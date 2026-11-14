import * as THREE from "three";
import { layout } from "../geo/layout.js";
import { mat } from "./materials.js";
import { createGrain } from "./archetypes.js";
import { makeSegment, tag, addLabel } from "./meshkit.js";

function inside(poly, x, z) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const zi = poly[i].z;
    const xj = poly[j].x;
    const zj = poly[j].z;
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) hit = !hit;
  }
  return hit;
}

function mulberry(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function inActivation(x, z) {
  const aa = layout.activation;
  return x >= aa.minX - 40 && x <= aa.maxX + 40 && z >= aa.minZ - 40 && z <= aa.maxZ + 40;
}

function nearVillage(x, z) {
  for (const village of layout.pinned) {
    if (Math.hypot(village.x - x, village.z - z) < 220) return true;
  }
  return false;
}

/** Passenger rail and a grain of building typologies over town-planning land outside the Activation Area. Hidden until Future is on. */
export function buildFuture(parent, labels) {
  const group = new THREE.Group();
  group.name = "future";
  group.visible = false;

  const rail = layout.passengerRail;
  const railMat = mat(0x5c4030, { roughness: 0.72 });
  for (let i = 1; i < rail.length; i++) {
    const mesh = makeSegment(rail[i - 1], rail[i], 200, layout.pad + 1.1, railMat);
    tag(mesh, "passenger-rail");
    group.add(mesh);
  }
  const mid = rail[Math.floor(rail.length / 2)];
  addLabel(labels, {
    id: "passenger-rail",
    text: "Passenger rail",
    x: mid.x,
    y: 30,
    z: mid.z,
    tier: "zone",
    when: "future",
  });

  const spots = [];
  const rnd = mulberry(22);
  for (const band of layout.bands) {
    const phase1 = band.id === "tp1" || band.id === "tp2";
    const step = phase1 ? 340 : 620;
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (const p of band.poly) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minZ = Math.min(minZ, p.z);
      maxZ = Math.max(maxZ, p.z);
    }
    for (let x = minX; x <= maxX; x += step) {
      for (let z = minZ; z <= maxZ; z += step) {
        const px = x + (rnd() - 0.5) * step * 0.35;
        const pz = z + (rnd() - 0.5) * step * 0.35;
        if (!inside(band.poly, px, pz) || inActivation(px, pz) || nearVillage(px, pz)) continue;
        // Each cell is a block of parcels: 2 × 2 on Phase I, 2 × 1 later. Parcels leave a street margin.
        const block = phase1 ? 240 : 280;
        const cols = 2;
        const rows = phase1 ? 2 : 1;
        const pw = block / cols;
        const pd = (phase1 ? block : block * 0.55) / rows;
        for (let c = 0; c < cols; c++) {
          for (let r = 0; r < rows; r++) {
            if (rnd() < (phase1 ? 0.12 : 0.3)) continue;
            spots.push({
              x: px - block / 2 + pw * (c + 0.5),
              z: pz - (pd * rows) / 2 + pd * (r + 0.5),
              phase1,
              w: pw - 22 - rnd() * 14,
              d: pd - 22 - rnd() * 14,
            });
          }
        }
      }
    }
  }

  // Typologies by phase: towers, slabs and campuses on Phase I; sheds, warehouses and houses later.
  const grain = createGrain();
  const typeRnd = mulberry(2026);
  for (const spot of spots) grain.place(spot, layout.pad, spot.phase1, typeRnd);
  for (const mesh of grain.build("future-grain")) group.add(mesh);

  const home = layout.bands.find((band) => band.id === "tp4") ?? layout.bands[0];
  let cx = 0;
  let cz = 0;
  for (const p of home.poly) {
    cx += p.x;
    cz += p.z;
  }
  cx /= home.poly.length;
  cz /= home.poly.length;
  addLabel(labels, {
    id: "future-grain",
    text: "Later phases",
    x: cx + 1800,
    y: 40,
    z: cz,
    tier: "zone",
    when: "future",
  });

  if (!layout.frames["passenger-rail"]) layout.frames["passenger-rail"] = layout.frames.expressway;
  if (!layout.frames["future-grain"]) layout.frames["future-grain"] = layout.frames.tp4 ?? layout.frames.plan;

  parent.add(group);
  return group;
}
