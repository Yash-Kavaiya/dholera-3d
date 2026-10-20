import * as THREE from "three";
import { yawAlignLocalZ } from "../frame.js";

const shapeScratch = new THREE.Shape();

function shapeSignedArea(points, cx, cz) {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const x1 = a.x - cx;
    const y1 = cz - a.z;
    const x2 = b.x - cx;
    const y2 = cz - b.z;
    area += x1 * y2 - x2 * y1;
  }
  return area / 2;
}

/** Prism from a plan polygon. Top sits at baseY + height. Shape is recentred so earcut stays stable. */
export function makePrism(points, baseY, height, material) {
  if (points.length < 3) return new THREE.Mesh();
  let cx = 0;
  let cz = 0;
  for (const p of points) {
    cx += p.x;
    cz += p.z;
  }
  cx /= points.length;
  cz /= points.length;
  const ring = shapeSignedArea(points, cx, cz) < 0 ? [...points].reverse() : points;
  const shape = new THREE.Shape();
  ring.forEach((p, i) => {
    const sx = p.x - cx;
    const sy = cz - p.z;
    if (i === 0) shape.moveTo(sx, sy);
    else shape.lineTo(sx, sy);
  });
  const geo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(cx, baseY, cz);
  return mesh;
}

export function makeBox(cx, cy, cz, w, h, d, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(cx, cy, cz);
  return mesh;
}

export function makeSegment(a, b, width, y, material) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len = Math.hypot(dx, dz);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, 0.35, Math.max(len, 0.1)), material);
  mesh.position.set((a.x + b.x) / 2, y, (a.z + b.z) / 2);
  mesh.rotation.y = yawAlignLocalZ(dx, dz);
  return mesh;
}

export function tag(mesh, id) {
  mesh.userData.id = id;
  mesh.traverse((child) => {
    child.userData.id = id;
  });
  return mesh;
}

export function outline(points, y, color) {
  const verts = [];
  for (const p of points) verts.push(p.x, y, p.z);
  const first = points[0];
  verts.push(first.x, y, first.z);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  return new THREE.Line(geo, new THREE.LineBasicMaterial({ color }));
}

export function addLabel(labels, item) {
  labels.push(item);
}

void shapeScratch;
