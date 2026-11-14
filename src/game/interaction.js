/**
 * Dholera Rising — City Ops: screen-space helpers for the HUD.
 */

import * as THREE from "three";

const project = new THREE.Vector3();
const local = new THREE.Vector3();
const inverse = new THREE.Matrix4();

export function formatDistance(metres) {
  if (!Number.isFinite(metres)) return "—";
  if (metres >= 1000) return `${(metres / 1000).toFixed(metres >= 10000 ? 0 : 1)} km`;
  return `${Math.max(0, Math.round(metres / 5) * 5)} m`;
}

export function formatCredits(value) {
  if (!Number.isFinite(value)) return "₹0";
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

/**
 * Walk mode owns the camera 16 m behind the walker; estimate the walker's
 * position so distances feel right from the player's point of view.
 */
export function walkerEstimate(camera, target = new THREE.Vector3()) {
  camera.getWorldDirection(target);
  target.y = 0;
  if (target.lengthSq() < 1e-6) target.set(0, 0, -1);
  target.normalize();
  return {
    x: camera.position.x + target.x * 16,
    z: camera.position.z + target.z * 16,
  };
}

/**
 * Where to draw the off-screen objective arrow, anchored near the screen edge.
 * Returns { visible, angleDeg, x, y }: x/y are pixel offsets from screen centre
 * and angleDeg is the CSS rotation (0° = right, 90° = down).
 */
export function screenArrow(camera, x, y, z) {
  project.set(x, y, z);
  local.set(x, y, z);
  inverse.copy(camera.matrixWorldInverse);
  local.applyMatrix4(inverse);
  project.project(camera);

  const onScreen = project.z < 1 && Math.abs(project.x) < 0.88 && Math.abs(project.y) < 0.82;
  if (onScreen) return { visible: false, angleDeg: 0, x: 0, y: 0 };

  let angle;
  if (local.z > 0) {
    // Behind the camera: point down and slightly toward the target's side.
    angle = local.x >= 0 ? 1.15 : Math.PI - 1.15;
  } else {
    angle = Math.atan2(-project.y, project.x);
  }

  const viewportW = typeof globalThis.innerWidth === "number" ? globalThis.innerWidth : 1280;
  const viewportH = typeof globalThis.innerHeight === "number" ? globalThis.innerHeight : 800;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const radius = Math.min(
    (viewportW * 0.43) / Math.max(0.22, Math.abs(cos)),
    (viewportH * 0.4) / Math.max(0.22, Math.abs(sin)),
  );
  return {
    visible: true,
    angleDeg: (angle * 180) / Math.PI,
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}
