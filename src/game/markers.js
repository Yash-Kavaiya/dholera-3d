/**
 * Dholera Rising — City Ops: the 3D objective marker (beam + pulsing rings +
 * floating diamond) that hangs over the active mission target.
 */

import * as THREE from "three";

export function createMarker(scene, { groundY = 3 } = {}) {
  const group = new THREE.Group();
  group.name = "game-objective-marker";
  group.visible = false;
  group.renderOrder = 6;

  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xc9703f,
    transparent: true,
    opacity: 0.16,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
  });
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xffc48a,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
  });

  const beam = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 10, 230, 20, 1, true), beamMat);
  beam.position.y = 115;
  const core = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.4, 230, 10, 1, true), coreMat);
  core.position.y = 115;
  group.add(beam, core);

  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xe39a5f,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(15, 20, 48), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.6;
  group.add(ring);

  const pulseMat = new THREE.MeshBasicMaterial({
    color: 0xffc48a,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
  });
  const pulse = new THREE.Mesh(new THREE.RingGeometry(22, 26, 48), pulseMat);
  pulse.rotation.x = -Math.PI / 2;
  pulse.position.y = 0.7;
  group.add(pulse);

  const diamondMat = new THREE.MeshStandardMaterial({
    color: 0xb5693a,
    emissive: 0xff8a3d,
    emissiveIntensity: 1.5,
    roughness: 0.25,
    metalness: 0.45,
  });
  const diamond = new THREE.Mesh(new THREE.OctahedronGeometry(3.6, 0), diamondMat);
  diamond.position.y = 26;
  group.add(diamond);

  const halo = new THREE.Mesh(
    new THREE.RingGeometry(6, 7.4, 32),
    new THREE.MeshBasicMaterial({
      color: 0xffd9b0,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
    }),
  );
  halo.position.y = 26;
  group.add(halo);

  scene.add(group);

  let flash = 0;
  const state = { x: 0, z: 0, y: groundY, time: 0 };

  function setTarget(point) {
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.z)) {
      group.visible = false;
      return;
    }
    state.x = point.x;
    state.z = point.z;
    state.y = Number.isFinite(point.y) ? point.y : groundY;
    group.position.set(state.x, state.y, state.z);
    group.visible = true;
    flash = 1;
  }

  function setVisible(visible) {
    group.visible = Boolean(visible);
  }

  function update(dt, time) {
    state.time = time;
    if (!group.visible) return;
    const wobble = Math.sin(time * 2.1);
    const pulseScale = 1 + 0.08 * wobble;
    ring.scale.setScalar(pulseScale);
    pulse.scale.setScalar(1 + ((time * 0.55) % 1) * 1.9);
    pulseMat.opacity = 0.5 * (1 - ((time * 0.55) % 1));
    diamond.position.y = 26 + wobble * 1.4;
    diamond.rotation.y += dt * 1.4;
    diamond.rotation.z = Math.sin(time * 0.7) * 0.12;
    halo.position.y = diamond.position.y;
    halo.rotation.z += dt * 0.6;
    coreMat.opacity = 0.42 + 0.16 * Math.sin(time * 3.4);
    if (flash > 0) {
      flash = Math.max(0, flash - dt * 2.6);
      const burst = 1 + flash * 0.5;
      beam.scale.set(burst, 1, burst);
      beamMat.opacity = 0.2 + flash * 0.25;
    }
  }

  return {
    group,
    setTarget,
    setVisible,
    update,
    get visible() {
      return group.visible;
    },
    flash() {
      flash = 1;
    },
    dispose() {
      scene.remove(group);
      group.traverse((node) => {
        if (node.geometry) node.geometry.dispose();
        if (node.material) node.material.dispose();
      });
    },
  };
}
