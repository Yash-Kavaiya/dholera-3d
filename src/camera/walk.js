import * as THREE from "three";
import { UP, headingOf } from "../frame.js";

const heading = new THREE.Vector3();
const right = new THREE.Vector3();
const look = new THREE.Vector3();

export function createWalk(camera, layout, colliders) {
  const player = new THREE.Group();
  player.name = "walker";
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.32, 0.9, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0xc4b8a4, roughness: 0.7 }),
  );
  body.position.y = 1.05;
  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xb5693a, roughness: 0.5 }),
  );
  nose.name = "nose";
  nose.position.set(0, 1.45, -0.36);
  player.add(body, nose);

  const radius = 0.45;
  const aa = layout.activation;

  function blocked(x, z) {
    if (x < aa.minX + 3 || x > aa.maxX - 3 || z < aa.minZ + 3 || z > aa.maxZ - 3) return true;
    for (const box of colliders) {
      if (x > box.minX - radius && x < box.maxX + radius && z > box.minZ - radius && z < box.maxZ + radius) return true;
    }
    return false;
  }

  function reset() {
    player.position.set(layout.blocks.spawn.x, layout.ground, layout.blocks.spawn.z);
    player.rotation.y = layout.blocks.spawn.yaw;
    placeCamera();
  }

  function placeCamera() {
    headingOf(player, heading);
    look.copy(player.position).addScaledVector(UP, 1.45);
    camera.position.copy(look).addScaledVector(heading, -16).addScaledVector(UP, 4.2);
    camera.lookAt(look);
  }

  function update(dt, keys) {
    const turn = (keys.ArrowLeft || keys.KeyQ ? 1 : 0) - (keys.ArrowRight || keys.KeyE ? 1 : 0);
    player.rotation.y += turn * 1.35 * dt;
    headingOf(player, heading);
    right.crossVectors(heading, UP);
    const boost = keys.ShiftLeft || keys.ShiftRight ? 2.5 : 1;
    const speed = 14 * boost;
    const f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
    const s = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
    const nx = player.position.x + (heading.x * f + right.x * s) * speed * dt;
    const nz = player.position.z + (heading.z * f + right.z * s) * speed * dt;
    if (!blocked(nx, player.position.z)) player.position.x = nx;
    if (!blocked(player.position.x, nz)) player.position.z = nz;
    player.position.y = layout.ground;
    placeCamera();
  }

  reset();
  return { player, reset, update, yawBy(delta) { player.rotation.y += delta; } };
}
