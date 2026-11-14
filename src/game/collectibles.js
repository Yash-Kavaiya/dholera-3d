/**
 * Dholera Rising — City Ops: 12 collectible data shards scattered around the
 * landmarks. Glowing octahedra that bob, spin, and pop when the player comes
 * close. Collection is persisted by the store.
 */

import * as THREE from "three";
import { coordsFor, findFreeSpot, getGroundY } from "./missions.js";

export const SHARD_COUNT = 12;

/** Deterministic placement: landmark id + a fixed offset direction/radius. */
export const SHARD_SPECS = [
  { id: "bec", angle: 0.85, dist: 30 },
  { id: "spv", angle: 2.4, dist: 26 },
  { id: "hospital", angle: 1.15, dist: 42 },
  { id: "school", angle: 4.0, dist: 38 },
  { id: "semicon", angle: 2.9, dist: 120 },
  { id: "sub-torrent", angle: 0.3, dist: 60, fallback: ["sub-getco"] },
  { id: "canal", angle: 1.57, dist: 44 },
  { id: "hotel", angle: 5.2, dist: 34 },
  { id: "city-center", angle: 3.5, dist: 40, fallback: ["activation"] },
  { id: "stadium", angle: 0.2, dist: 52, fallback: ["activation"] },
  { id: "solar", angle: 2.1, dist: 120, fallback: ["zone-solar"] },
  { id: "airport", angle: 5.6, dist: 140, fallback: ["airport-link"] },
];

const CRYSTAL_GEO = new THREE.OctahedronGeometry(2.1, 0);
const EDGE_GEO = new THREE.EdgesGeometry(CRYSTAL_GEO);
const GLOW_GEO = new THREE.RingGeometry(3.6, 5.2, 36);

const CRYSTAL_MAT = new THREE.MeshStandardMaterial({
  color: 0x2f7d92,
  emissive: 0x63d8f0,
  emissiveIntensity: 1.35,
  roughness: 0.2,
  metalness: 0.4,
  transparent: true,
  opacity: 0.94,
});
const EDGE_MAT = new THREE.LineBasicMaterial({ color: 0xd6f7ff, transparent: true, opacity: 0.8 });
const GLOW_MAT = new THREE.MeshBasicMaterial({
  color: 0x55c9e0,
  transparent: true,
  opacity: 0.5,
  side: THREE.DoubleSide,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  fog: false,
});

export function createCollectibles({ scene, layout, places, colliders = [], onCollect } = {}) {
  const group = new THREE.Group();
  group.name = "data-shards";
  group.visible = false;
  scene.add(group);

  const shards = [];
  const collected = new Set();
  const pickAnim = new Map();

  SHARD_SPECS.forEach((spec, index) => {
    const base =
      coordsFor(layout, places, spec.id) ||
      (spec.fallback || []).map((id) => coordsFor(layout, places, id)).find(Boolean) ||
      coordsFor(layout, places, "activation") || { x: 0, z: 0 };
    const ox = Math.cos(spec.angle) * spec.dist;
    const oz = Math.sin(spec.angle) * spec.dist;
    const spot = findFreeSpot(layout, colliders, base.x + ox, base.z + oz, 5);
    const y = getGroundY(layout, spot.x, spot.z) + 3.1;

    const node = new THREE.Group();
    node.position.set(spot.x, y, spot.z);
    const crystal = new THREE.Mesh(CRYSTAL_GEO, CRYSTAL_MAT);
    const edges = new THREE.LineSegments(EDGE_GEO, EDGE_MAT);
    const glow = new THREE.Mesh(GLOW_GEO, GLOW_MAT);
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = -2.9;
    node.add(crystal, edges, glow);
    group.add(node);

    shards.push({
      index,
      id: spec.id,
      node,
      crystal,
      edges,
      glow,
      x: spot.x,
      y,
      z: spot.z,
      phase: index * 0.73,
      hidden: false,
    });
  });

  function setCollected(indices) {
    collected.clear();
    for (const index of indices || []) {
      if (Number.isInteger(index) && shards[index]) collected.add(index);
    }
    for (const shard of shards) {
      const isCollected = collected.has(shard.index);
      shard.hidden = isCollected;
      shard.node.visible = !isCollected;
      shard.node.scale.setScalar(1);
    }
    pickAnim.clear();
  }

  function update(dt, time, player, radius) {
    const picked = [];
    for (const shard of shards) {
      if (shard.hidden) continue;
      shard.crystal.rotation.y += dt * 1.3;
      shard.crystal.rotation.x = Math.sin(time * 0.8 + shard.phase) * 0.18;
      shard.node.position.y = shard.y + Math.sin(time * 1.4 + shard.phase) * 0.9;
      shard.glow.scale.setScalar(1 + Math.sin(time * 2.2 + shard.phase) * 0.12);
      shard.edges.rotation.y -= dt * 0.7;

      if (player && Number.isFinite(player.x) && Number.isFinite(player.z)) {
        const distance = Math.hypot(shard.x - player.x, shard.z - player.z);
        if (distance <= radius) {
          shard.hidden = true;
          collected.add(shard.index);
          pickAnim.set(shard.index, 0);
          picked.push(shard.index);
        }
      }
    }
    // Pickup flourish: shrink and rise briefly.
    for (const [index, age] of pickAnim) {
      const shard = shards[index];
      const next = age + dt;
      pickAnim.set(index, next);
      const t = Math.min(1, next / 0.42);
      shard.node.scale.setScalar(Math.max(0.001, 1 - t));
      shard.node.position.y = shard.y + t * 4;
      shard.node.rotation.y += dt * 8;
      if (t >= 1) {
        shard.node.visible = false;
        pickAnim.delete(index);
      }
    }
    if (picked.length && typeof onCollect === "function") {
      for (const index of picked) onCollect(index);
    }
    return picked;
  }

  function resetVisuals() {
    pickedReset();
  }

  function pickedReset() {
    collected.clear();
    pickAnim.clear();
    for (const shard of shards) {
      shard.hidden = false;
      shard.node.visible = true;
      shard.node.scale.setScalar(1);
      shard.node.rotation.set(0, 0, 0);
      shard.node.position.y = shard.y;
    }
  }

  function blips() {
    const out = [];
    for (const shard of shards) {
      if (collected.has(shard.index)) continue;
      out.push({ x: shard.x, z: shard.z, kind: "shard" });
    }
    return out;
  }

  setCollected([]);

  return {
    group,
    shards,
    update,
    setCollected,
    reset() {
      pickedReset();
    },
    blips,
    get collectedCount() {
      return collected.size;
    },
    setVisible(visible) {
      group.visible = Boolean(visible);
    },
    dispose() {
      scene.remove(group);
      CRYSTAL_MAT.dispose();
      EDGE_MAT.dispose();
      GLOW_MAT.dispose();
      CRYSTAL_GEO.dispose();
      EDGE_GEO.dispose();
      GLOW_GEO.dispose();
    },
  };
}
