import * as THREE from "three";

/** Y-up, right-handed. +X east, −Z north, +Y up. 1 unit = 1 metre. */
export const UP = new THREE.Vector3(0, 1, 0);

const _euler = new THREE.Euler(0, 0, 0, "YXZ");
const _fwd = new THREE.Vector3();
const _right = new THREE.Vector3();
const _matrix = new THREE.Matrix4();
const _quat = new THREE.Quaternion();

/** Box length runs along local +Z. θ = atan2(dx, dz) lays that axis on (dx, 0, dz). */
export function yawAlignLocalZ(dx, dz) {
  return Math.atan2(dx, dz);
}

/**
 * Yaw for an object whose front is local −Z.
 * Facing north (0, 0, −1) => 0. Facing east (1, 0, 0) => −π/2.
 */
export function yawFacing(dx, dz) {
  return Math.atan2(-dx, -dz);
}

export function headingOf(object, target = _fwd) {
  return target.set(0, 0, -1).applyQuaternion(object.quaternion);
}

/** Flat camera basis. Right is forward × up. */
export function flatBasis(camera, forward, right) {
  camera.getWorldDirection(forward);
  forward.y = 0;
  if (forward.lengthSq() < 1e-8) forward.set(0, 0, -1);
  else forward.normalize();
  right.crossVectors(forward, UP);
  return { forward, right };
}

/** Euler YXZ that aims a camera from `position` at `target`. */
export function aimEuler(position, target) {
  _matrix.lookAt(position, target, UP);
  _quat.setFromRotationMatrix(_matrix);
  _euler.setFromQuaternion(_quat, "YXZ");
  return { yaw: _euler.y, pitch: _euler.x };
}

export function applyYawPitch(camera, yaw, pitch) {
  _euler.set(pitch, yaw, 0, "YXZ");
  camera.quaternion.setFromEuler(_euler);
}

export function shortestAngle(from, to) {
  let d = to - from;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return from + d;
}

export { _fwd, _right };
