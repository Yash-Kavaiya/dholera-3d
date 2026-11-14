import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { tag } from "./meshkit.js";

/**
 * Geometry kit for the solid city. Every part is a transformed unit geometry; parts are
 * merged per material into a handful of meshes, so a whole district costs a few draw calls.
 * All geometry is non-indexed so mergeGeometries can mix boxes, prisms and cylinders.
 */

function toNonIndexed(geo) {
  return geo.index ? geo.toNonIndexed() : geo;
}

/** Unit prism: profile in the x/y plane, extruded 1 along z, centred on z. Base at y = 0. */
function prism(points) {
  const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false });
  geo.translate(0, 0, -0.5);
  geo.computeVertexNormals();
  return toNonIndexed(geo);
}

export const UNIT = {
  box: toNonIndexed(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0)),
  cyl: toNonIndexed(new THREE.CylinderGeometry(1, 1, 1, 16).translate(0, 0.5, 0)),
  cyl8: toNonIndexed(new THREE.CylinderGeometry(1, 1, 1, 8).translate(0, 0.5, 0)),
  cone: toNonIndexed(new THREE.ConeGeometry(1, 1, 8).translate(0, 0.5, 0)),
  hip: toNonIndexed(new THREE.ConeGeometry(Math.SQRT1_2, 1, 4).rotateY(Math.PI / 4).translate(0, 0.5, 0)),
  gable: prism([[-0.5, 0], [0.5, 0], [0, 1]]),
  tooth: prism([[-0.5, 0], [0.5, 0], [0.5, 1]]),
};

const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _mat = new THREE.Matrix4();
const _up = new THREE.Vector3(0, 1, 0);

const colorMaterials = new Map();
const FALLBACK_MAT = new THREE.MeshStandardMaterial({ color: 0xd8d1c4, roughness: 0.9 });

/** Accepts a THREE material or a palette colour number (cached so it still merges). */
export function materialFor(value) {
  if (value && value.isMaterial) return value;
  if (typeof value === "number") {
    let material = colorMaterials.get(value);
    if (!material) {
      material = new THREE.MeshStandardMaterial({ color: value, roughness: 0.85 });
      colorMaterials.set(value, material);
    }
    return material;
  }
  return FALLBACK_MAT;
}

function compose(x, y, z, sx, sy, sz, rotY) {
  _pos.set(x, y, z);
  _quat.setFromAxisAngle(_up, rotY);
  _scale.set(sx, sy || 0.001, sz || 0.001);
  return _mat.compose(_pos, _quat, _scale);
}

/**
 * Accumulates transformed geometry parts and merges them per material.
 * Positions are in the caller's frame (world for city fabric, local for prefabs).
 */
export function createBatch() {
  const buckets = new Map();
  return {
    /** kind: key of UNIT, or a THREE.BufferGeometry. sx..sz are full sizes (not half). */
    add(kind, material, x, y, z, sx, sy, sz, rotY = 0) {
      const unit = typeof kind === "string" ? UNIT[kind] : kind;
      const geo = unit.clone();
      geo.applyMatrix4(compose(x, y, z, sx, sy, sz, rotY));
      const resolved = materialFor(material);
      let list = buckets.get(resolved);
      if (!list) buckets.set(resolved, (list = []));
      list.push(geo);
      return geo;
    },
    box(material, x, y, z, w, h, d, rotY = 0) {
      return this.add("box", material, x, y, z, w, h, d, rotY);
    },
    cyl(material, x, y, z, r, h, rotY = 0) {
      return this.add("cyl", material, x, y, z, r, h, r, rotY);
    },
    /** Merged geometry per material, in insertion order. */
    finish() {
      const parts = [];
      for (const [material, geos] of buckets) {
        const geometry = geos.length === 1 ? geos[0] : mergeGeometries(geos, false);
        if (!geometry) continue;
        geometry.computeBoundingSphere();
        parts.push({ geometry, material });
      }
      buckets.clear();
      return parts;
    },
    build(parent, id) {
      const meshes = [];
      for (const { geometry, material } of this.finish()) {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.matrixAutoUpdate = false;
        if (id) tag(mesh, id);
        parent.add(mesh);
        meshes.push(mesh);
      }
      return meshes;
    },
    get size() {
      let n = 0;
      for (const list of buckets.values()) n += list.length;
      return n;
    },
  };
}

/** Place already-compiled prefab parts into a batch (merged output), optionally rotated. */
export function placeParts(batch, parts, x, y, z, rotY = 0, sx = 1, sy = 1, sz = 1) {
  const m = compose(x, y, z, sx, sy, sz, rotY).clone();
  for (const part of parts) {
    batch.add(part.geometry, part.material, 0, 0, 0, 1, 1, 1).applyMatrix4(m);
  }
}

/**
 * One InstancedMesh per prefab part material. `poses` are {x, y, z, rotY?, scale?, color?}.
 * Parts flagged `tint: true` receive per-instance colours when poses carry a colour.
 */
export function instanceParts(parent, parts, poses, id, layer) {
  const meshes = [];
  for (const part of parts) {
    const mesh = new THREE.InstancedMesh(part.geometry, part.material, poses.length);
    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    let hasColor = false;
    poses.forEach((pose, i) => {
      const s = pose.scale ?? 1;
      mesh.setMatrixAt(i, compose(pose.x, pose.y ?? 0, pose.z, s, pose.s ?? s, s, pose.rotY ?? 0));
      if (part.tint && pose.color != null) {
        if (!hasColor) {
          mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(poses.length * 3), 3);
          hasColor = true;
        }
        mesh.instanceColor.setXYZ(i, (pose.color >> 16 & 255) / 255, (pose.color >> 8 & 255) / 255, (pose.color & 255) / 255);
      }
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
    if (id) tag(mesh, id);
    if (layer != null) mesh.layers.set(layer);
    parent.add(mesh);
    meshes.push(mesh);
  }
  return meshes;
}

/** Convenience for long straight street strips: box from a to b at a given width. */
export function streetStrip(batch, material, a, b, width, y, height = 0.3) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len = Math.hypot(dx, dz);
  if (len < 0.01) return;
  batch.box(material, (a.x + b.x) / 2, y, (a.z + b.z) / 2, width, height, len, Math.atan2(dx, dz));
}

/** A ring of boxes around an ellipse — stadium tiers, roundabouts, tank bunds. */
export function ellipseRing(batch, material, cx, cz, y, rx, rz, thickness, height, segments, step = 1) {
  for (let i = 0; i < segments; i += step) {
    const a = (i / segments) * Math.PI * 2;
    const x = cx + Math.cos(a) * rx;
    const z = cz + Math.sin(a) * rz;
    const tangentX = -Math.sin(a) * rx;
    const tangentZ = Math.cos(a) * rz;
    const rotY = Math.atan2(tangentX, tangentZ);
    batch.box(material, x, y, z, thickness, height, (Math.PI * (rx + rz)) / segments + 1, rotY);
  }
}

/** Seeded RNG (mulberry32) — deterministic city layouts. */
export function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Point in polygon (x/z). */
export function insidePoly(poly, x, z) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const zi = poly[i].z;
    const xj = poly[j].x;
    const zj = poly[j].z;
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) hit = !hit;
  }
  return hit;
}

/** Closest distance from a point to a polygon boundary (used to keep buildings off band edges). */
export function distanceToPoly(poly, x, z) {
  let best = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[j];
    const b = poly[i];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / len2));
    const px = a.x + dx * t;
    const pz = a.z + dz * t;
    best = Math.min(best, Math.hypot(x - px, z - pz));
  }
  return best;
}

export function bboxOfPoly(poly) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const p of poly) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minZ = Math.min(minZ, p.z);
    maxZ = Math.max(maxZ, p.z);
  }
  return { minX, maxX, minZ, maxZ };
}
