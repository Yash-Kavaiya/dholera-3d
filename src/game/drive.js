/**
 * Dholera Rising — City Ops: arcade rover + chase camera.
 *
 * Only drive mode owns the main camera (the game's update() returns true while
 * this is active and calls placeCamera every frame).
 */

import * as THREE from "three";
import { getGroundY } from "./missions.js";

const MAX_SPEED = 48; // m/s ≈ 173 km/h, the contract's top speed
const MAX_REVERSE = 14;
const ACCEL = 15;
const BRAKE = 30;
const REVERSE_ACCEL = 10;
const ROLL = 4.6;
const AIR_DRAG = 0.045;
const TURN_RATE = 1.62;
const RADIUS = 2.35;
const WHEEL_RADIUS = 0.78;

function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

function buildRover() {
  const group = new THREE.Group();
  group.name = "city-ops-rover";
  group.visible = false;

  const shellMat = new THREE.MeshStandardMaterial({ color: 0xe7ddca, roughness: 0.62, metalness: 0.12 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x2a2723, roughness: 0.7, metalness: 0.25 });
  const copperMat = new THREE.MeshStandardMaterial({ color: 0xb5693a, roughness: 0.4, metalness: 0.45 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x8fb5bd,
    roughness: 0.16,
    metalness: 0.25,
    transparent: true,
    opacity: 0.82,
  });
  const headMat = new THREE.MeshStandardMaterial({ color: 0xfff6dd, emissive: 0xffe6b0, emissiveIntensity: 1.4, roughness: 0.25 });
  const tailMat = new THREE.MeshStandardMaterial({ color: 0x8f1616, emissive: 0xff3b2a, emissiveIntensity: 1.1, roughness: 0.4 });
  const tyreMat = new THREE.MeshStandardMaterial({ color: 0x1e1c1a, roughness: 0.95 });
  const hubMat = new THREE.MeshStandardMaterial({ color: 0xc9c0af, roughness: 0.4, metalness: 0.6 });

  const tilt = new THREE.Group();
  tilt.name = "rover-tilt";
  group.add(tilt);

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.62, 5.2), shellMat);
  chassis.position.y = 1.06;
  tilt.add(chassis);

  const skirt = new THREE.Mesh(new THREE.BoxGeometry(2.72, 0.26, 5.0), darkMat);
  skirt.position.y = 0.72;
  tilt.add(skirt);

  const hood = new THREE.Mesh(new THREE.BoxGeometry(2.34, 0.5, 1.5), copperMat);
  hood.position.set(0, 1.4, -1.72);
  tilt.add(hood);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.16, 0.92, 2.15), glassMat);
  cabin.position.set(0, 1.78, 0.24);
  tilt.add(cabin);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.16, 2.4), shellMat);
  roof.position.set(0, 2.3, 0.24);
  tilt.add(roof);

  const rack = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.22, 1.6), darkMat);
  rack.position.set(0, 2.48, 0.2);
  tilt.add(rack);

  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.34, 8), copperMat.clone());
  beacon.material.emissive = new THREE.Color(0xff8a3d);
  beacon.material.emissiveIntensity = 2;
  beacon.position.set(0, 2.78, 0.2);
  tilt.add(beacon);

  const bumperFront = new THREE.Mesh(new THREE.BoxGeometry(2.86, 0.34, 0.38), darkMat);
  bumperFront.position.set(0, 0.82, -2.62);
  tilt.add(bumperFront);
  const bumperRear = new THREE.Mesh(new THREE.BoxGeometry(2.86, 0.34, 0.38), darkMat);
  bumperRear.position.set(0, 0.82, 2.62);
  tilt.add(bumperRear);

  for (const side of [-1, 1]) {
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.2, 0.1), headMat);
    head.position.set(side * 0.86, 1.24, -2.63);
    tilt.add(head);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.2, 0.1), tailMat);
    tail.position.set(side * 0.9, 1.18, 2.63);
    tilt.add(tail);
  }

  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.5, 5), darkMat);
  antenna.position.set(-0.9, 3.0, 1.6);
  tilt.add(antenna);
  const antennaTip = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), copperMat);
  antennaTip.position.set(-0.9, 3.78, 1.6);
  tilt.add(antennaTip);

  const wheelGeo = new THREE.CylinderGeometry(WHEEL_RADIUS, WHEEL_RADIUS, 0.62, 16);
  wheelGeo.rotateZ(Math.PI / 2);
  const hubGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.66, 12);
  hubGeo.rotateZ(Math.PI / 2);
  const wheels = [];
  for (const side of [-1, 1]) {
    for (const end of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(side * 1.38, WHEEL_RADIUS, end * 1.78);
      const wheel = new THREE.Mesh(wheelGeo, tyreMat);
      const hub = new THREE.Mesh(hubGeo, hubMat);
      pivot.add(wheel, hub);
      group.add(pivot);
      wheels.push({ pivot, wheel, hub, front: end < 0 });
    }
  }

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(3.1, 24),
    new THREE.MeshBasicMaterial({ color: 0x1c1915, transparent: true, opacity: 0.2, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.06;
  shadow.scale.set(1.25, 1, 1);
  group.add(shadow);

  return { group, tilt, wheels, beacon };
}

export function createDrive({ scene, camera, layout, colliders = [] }) {
  const { group, tilt, wheels } = buildRover();
  scene.add(group);

  const boxes = (Array.isArray(colliders) ? colliders : []).filter(
    (box) =>
      box &&
      Number.isFinite(box.minX) &&
      Number.isFinite(box.maxX) &&
      Number.isFinite(box.minZ) &&
      Number.isFinite(box.maxZ),
  );

  const state = {
    x: layout?.blocks?.spawn?.x ?? 0,
    z: layout?.blocks?.spawn?.z ?? 0,
    y: layout?.ground ?? 3,
    yaw: 0,
    speed: 0,
    steer: 0,
    wheelSpin: 0,
    visible: false,
    blocked: false,
  };

  // The terrain land plane: stay on it, off the gulf, and inside its footprint.
  const land = (() => {
    const sir = Array.isArray(layout?.sir) ? layout.sir : [];
    const xs = sir.map((p) => p.x);
    const zs = sir.map((p) => p.z);
    const extraX = [layout?.bhimnath?.x, layout?.adhelai?.x, layout?.airport?.x, layout?.solar?.x].filter(Number.isFinite);
    const extraZ = [layout?.airport?.z, layout?.solar?.z, layout?.expressway?.[0]?.z].filter(Number.isFinite);
    const minX = Math.min(...xs, ...extraX) - 6000;
    const maxX = (layout?.shoreX ?? Math.max(...xs, ...extraX)) - 110;
    const minZ = Math.min(...zs, ...extraZ) - 6000;
    const maxZ = Math.max(...zs, layout?.adhelai?.z ?? -Infinity) + 6000;
    return {
      minX: Number.isFinite(minX) ? minX : -40000,
      maxX: Number.isFinite(maxX) ? maxX : 40000,
      minZ: Number.isFinite(minZ) ? minZ : -40000,
      maxZ: Number.isFinite(maxZ) ? maxZ : 40000,
    };
  })();

  function withinLand(x, z) {
    return x >= land.minX && x <= land.maxX && z >= land.minZ && z <= land.maxZ;
  }

  function collides(x, z) {
    if (!withinLand(x, z)) return true;
    for (const box of boxes) {
      if (x + RADIUS > box.minX && x - RADIUS < box.maxX && z + RADIUS > box.minZ && z - RADIUS < box.maxZ) return true;
    }
    return false;
  }

  /** Find a collision-free spawn near (x, z). */
  function findSpawn(x, z) {
    if (!collides(x, z)) return { x, z };
    const rings = [8, 16, 26, 40, 60, 90, 130, 180];
    for (const radius of rings) {
      for (let step = 0; step < 12; step++) {
        const angle = (step / 12) * Math.PI * 2 + radius * 0.002;
        const px = x + Math.cos(angle) * radius;
        const pz = z + Math.sin(angle) * radius;
        if (!collides(px, pz)) return { x: px, z: pz };
      }
    }
    return { x, z };
  }

  function summonAt(x, z, yaw = 0) {
    const spot = findSpawn(Number.isFinite(x) ? x : state.x, Number.isFinite(z) ? z : state.z);
    state.x = spot.x;
    state.z = spot.z;
    state.yaw = Number.isFinite(yaw) ? yaw : state.yaw;
    state.speed = 0;
    state.steer = 0;
    state.y = getGroundY(layout, state.x, state.z);
    state.visible = true;
    state.blocked = false;
    group.visible = true;
    syncTransform();
    placeCamera(0, { snap: true });
    return { x: state.x, z: state.z };
  }

  function setPosition(x, z, yaw) {
    if (!Number.isFinite(x) || !Number.isFinite(z)) return;
    const spot = findSpawn(x, z);
    state.x = spot.x;
    state.z = spot.z;
    if (Number.isFinite(yaw)) state.yaw = yaw;
    state.speed = 0;
    state.y = getGroundY(layout, state.x, state.z);
    syncTransform();
    placeCamera(0, { snap: true });
  }

  function release() {
    state.visible = false;
    state.speed = 0;
    state.blocked = false;
    group.visible = false;
  }

  function syncTransform() {
    group.position.set(state.x, state.y, state.z);
    group.rotation.y = state.yaw;
  }

  function placeCamera(dt, { snap = false } = {}) {
    const fx = -Math.sin(state.yaw);
    const fz = -Math.cos(state.yaw);
    const back = 19 + Math.min(6, Math.abs(state.speed) * 0.14);
    const desiredX = state.x - fx * back;
    const desiredZ = state.z - fz * back;
    const floor = getGroundY(layout, desiredX, desiredZ) + 4.4;
    const desiredY = Math.max(state.y + 8.8, floor);
    if (snap) {
      camera.position.set(desiredX, desiredY, desiredZ);
    } else {
      const blend = 1 - Math.exp(-6.5 * Math.max(0, dt));
      camera.position.x += (desiredX - camera.position.x) * blend;
      camera.position.y += (desiredY - camera.position.y) * blend;
      camera.position.z += (desiredZ - camera.position.z) * blend;
    }
    camera.lookAt(state.x + fx * 9, state.y + 3.6, state.z + fz * 9);
  }

  function update(dt, input = {}) {
    const throttle = clamp(input.throttle ?? 0, -1, 1);
    const steerTarget = clamp(input.steer ?? 0, -1, 1);
    const boost = Boolean(input.boost);
    const stepDt = Math.min(dt, 0.05);

    state.steer += (steerTarget - state.steer) * Math.min(1, stepDt * 7.5);

    // Longitudinal physics.
    if (input.brake) {
      const drop = BRAKE * stepDt;
      state.speed = state.speed > 0 ? Math.max(0, state.speed - drop) : Math.min(0, state.speed + drop);
    } else if (throttle > 0) {
      state.speed += ACCEL * throttle * (boost ? 1.55 : 1) * stepDt;
    } else if (throttle < 0) {
      if (state.speed > 0.6) state.speed -= BRAKE * stepDt;
      else state.speed -= REVERSE_ACCEL * stepDt;
    } else {
      const drop = ROLL * stepDt;
      if (Math.abs(state.speed) <= drop) state.speed = 0;
      else state.speed -= Math.sign(state.speed) * drop;
    }
    state.speed -= state.speed * AIR_DRAG * stepDt;
    state.speed = clamp(state.speed, -MAX_REVERSE, MAX_SPEED);

    // Speed-dependent steering, reversed while backing up.
    const grip = Math.min(1, Math.abs(state.speed) / 8);
    const speedDamp = 1 / (1 + Math.abs(state.speed) * 0.011);
    const direction = state.speed >= 0 ? 1 : -1;
    state.yaw += state.steer * TURN_RATE * grip * speedDamp * direction * stepDt;

    // Move with substeps so a fast rover cannot tunnel through a collider.
    const distance = state.speed * stepDt;
    const steps = Math.max(1, Math.ceil(Math.abs(distance) / 3.2));
    const step = distance / steps;
    const fx = -Math.sin(state.yaw);
    const fz = -Math.cos(state.yaw);
    state.blocked = false;
    for (let i = 0; i < steps; i++) {
      let moved = false;
      const nx = state.x + fx * step;
      if (!collides(nx, state.z)) {
        state.x = nx;
        moved = true;
      }
      const nz = state.z + fz * step;
      if (!collides(state.x, nz)) {
        state.z = nz;
        moved = true;
      }
      if (!moved) {
        state.speed *= -0.16;
        state.blocked = true;
        break;
      }
    }

    const groundY = getGroundY(layout, state.x, state.z);
    state.y += (groundY - state.y) * Math.min(1, stepDt * 12);

    // Wheel + body animation.
    state.wheelSpin += (state.speed / WHEEL_RADIUS) * stepDt;
    for (const entry of wheels) {
      entry.wheel.rotation.x = state.wheelSpin;
      entry.hub.rotation.x = state.wheelSpin;
      if (entry.front) entry.pivot.rotation.y = state.steer * 0.42;
    }
    const lateral = state.steer * Math.min(1, Math.abs(state.speed) / 24);
    tilt.rotation.z += (-lateral * 0.05 - tilt.rotation.z) * Math.min(1, stepDt * 6);
    tilt.rotation.x += ((-state.speed / MAX_SPEED) * 0.015 - tilt.rotation.x) * Math.min(1, stepDt * 5);

    syncTransform();
    placeCamera(stepDt);
    return {
      kmh: Math.abs(state.speed) * 3.6,
      speed: state.speed,
      blocked: state.blocked,
      x: state.x,
      z: state.z,
      y: state.y,
    };
  }

  return {
    group,
    get visible() {
      return state.visible;
    },
    get x() {
      return state.x;
    },
    get z() {
      return state.z;
    },
    get y() {
      return state.y;
    },
    get yaw() {
      return state.yaw;
    },
    get speed() {
      return state.speed;
    },
    get kmh() {
      return Math.abs(state.speed) * 3.6;
    },
    summonAt,
    setPosition,
    release,
    update,
    placeCamera,
    findSpawn,
    /** Sanity bounds for tests/debug. */
    get bounds() {
      return { ...land };
    },
  };
}
