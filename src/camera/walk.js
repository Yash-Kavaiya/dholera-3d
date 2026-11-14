import * as THREE from "three";
import { UP, headingOf } from "../frame.js";

const heading = new THREE.Vector3();
const right = new THREE.Vector3();
const look = new THREE.Vector3();

function insidePoly(poly, x, z) {
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

  /** Walking is allowed on the whole plinth; the Activation Area sits a little higher. */
  function surfaceY(x, z) {
    return x >= aa.minX && x <= aa.maxX && z >= aa.minZ && z <= aa.maxZ ? layout.ground : layout.pad;
  }

  function blocked(x, z) {
    if (!insidePoly(layout.sir, x, z)) return true;
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

  /** Drop the walker at a world position without resetting to spawn (drive exit, fast travel). */
  function teleport(x, z, yaw) {
    player.position.set(x, surfaceY(x, z), z);
    if (typeof yaw === "number") player.rotation.y = yaw;
    placeCamera();
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
    player.position.y = surfaceY(player.position.x, player.position.z);
    placeCamera();
  }

  reset();
  return { player, reset, update, teleport, surfaceY, yawBy(delta) { player.rotation.y += delta; } };
}
