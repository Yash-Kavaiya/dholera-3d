import * as THREE from "three";
import { aimEuler, applyYawPitch, shortestAngle } from "../frame.js";

export function createFocus(camera, fly) {
  const fromPos = new THREE.Vector3();
  const toPos = new THREE.Vector3();
  let fromYaw = 0;
  let fromPitch = 0;
  let toYaw = 0;
  let toPitch = 0;
  let u = 1;
  let duration = 1;

  function go(frame, seconds = 2.4) {
    fromPos.copy(camera.position);
    fromYaw = fly.yaw;
    fromPitch = fly.pitch;
    toPos.set(frame.position.x, frame.position.y, frame.position.z);
    const aim = aimEuler(toPos, new THREE.Vector3(frame.target.x, frame.target.y, frame.target.z));
    toYaw = aim.yaw;
    toPitch = aim.pitch;
    duration = seconds;
    u = 0;
  }

  function update(dt) {
    if (u >= 1) return false;
    u = Math.min(1, u + dt / duration);
    const k = u * u * (3 - 2 * u);
    camera.position.lerpVectors(fromPos, toPos, k);
    fly.setYawPitch(shortestAngle(fromYaw, fromYaw + shortestDelta(fromYaw, toYaw) * k), fromPitch + (toPitch - fromPitch) * k);
    return u < 1;
  }

  return { go, update, cancel() { u = 1; } };
}

function shortestDelta(from, to) {
  let d = to - from;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}
