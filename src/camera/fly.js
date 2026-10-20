import * as THREE from "three";
import { UP, applyYawPitch, flatBasis } from "../frame.js";

export function createFly(camera) {
  let yaw = 0;
  let pitch = -0.45;
  const velocity = new THREE.Vector3();
  const desired = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();

  function setYawPitch(nextYaw, nextPitch) {
    yaw = nextYaw;
    pitch = Math.max(-1.35, Math.min(0.85, nextPitch));
    applyYawPitch(camera, yaw, pitch);
  }

  function update(dt, keys) {
    const turn = (keys.ArrowLeft ? 1 : 0) - (keys.ArrowRight ? 1 : 0);
    if (turn) yaw += turn * 0.85 * dt;
    setYawPitch(yaw, pitch);
    flatBasis(camera, forward, right);
    const boost = keys.ShiftLeft || keys.ShiftRight ? 4.4 : 1;
    const speed = 260 * boost;
    const f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
    const s = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
    const h = (keys.KeyE ? 1 : 0) - (keys.KeyQ ? 1 : 0);
    desired.set(0, 0, 0).addScaledVector(forward, f * speed).addScaledVector(right, s * speed);
    desired.y += h * speed;
    velocity.lerp(desired, 1 - Math.exp(-3.5 * dt));
    camera.position.addScaledVector(velocity, dt);
    camera.position.y = Math.max(8, Math.min(80000, camera.position.y));
  }

  return {
    setYawPitch,
    yawBy(dyaw, dpitch) {
      setYawPitch(yaw + dyaw, pitch + dpitch);
    },
    elevate(amount) {
      camera.position.y = Math.max(8, Math.min(80000, camera.position.y + amount));
    },
    update,
    get yaw() {
      return yaw;
    },
    get pitch() {
      return pitch;
    },
    basis() {
      flatBasis(camera, forward, right);
      return { forward: forward.clone(), right: right.clone(), up: UP };
    },
  };
}
