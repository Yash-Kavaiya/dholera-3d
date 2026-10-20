import * as THREE from "three";
import { chapters, layers } from "./content/city.js";
import { layout } from "./geo/layout.js";
import { aimEuler, headingOf, UP } from "./frame.js";
import { createFly } from "./camera/fly.js";
import { createWalk } from "./camera/walk.js";
import { createFocus } from "./camera/focus.js";
import { createTour } from "./camera/tour.js";
import { tourStops } from "./content/city.js";
import { buildTerrain } from "./world/terrain.js";
import { buildRegion } from "./world/region.js";
import { buildPlan } from "./world/plan.js";
import { buildActivation } from "./world/activation.js";
import { pickAt } from "./world/pick.js";
import { setDusk, setTimeOfDay, setFuture } from "./world/materials.js";
import { buildFuture } from "./world/future.js";
import { futureView } from "./content/city.js";
import { createShell } from "./ui/shell.js";
import { drawMinimap } from "./ui/minimap.js";
import { sound } from "./audio/ambient.js";

const canvas = document.querySelector("#view");
const labelRoot = document.querySelector("#labels");
const mapCanvas = document.querySelector("#map");

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  logarithmicDepthBuffer: true,
  preserveDrawingBuffer: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color("#d5e0e4");
scene.fog = new THREE.Fog("#d5e0e4", 8000, 64000);
const camera = new THREE.PerspectiveCamera(42, 1, 0.4, 180000);

const hemi = new THREE.HemisphereLight(0xf4f7f8, 0xe4d8c4, 0.78);
const sun = new THREE.DirectionalLight(0xfff6ea, 1.25);
sun.position.set(-6000, 12000, 4000);
scene.add(hemi, sun);

const groups = {};
for (const layer of layers) {
  groups[layer.id] = new THREE.Group();
  scene.add(groups[layer.id]);
}
groups.utilities.visible = false;

const labels = [];
const terrain = buildTerrain(scene, groups, layout);
const region = buildRegion(groups, labels);
buildPlan(groups, labels);
const activation = buildActivation(groups, labels);
const futureGroup = buildFuture(scene, labels);
let futureOn = false;

const fly = createFly(camera);
const walk = createWalk(camera, layout, activation.colliders);
walk.player.visible = false;
scene.add(walk.player);
const focus = createFocus(camera, fly);

const opening = layout.frames.arrive;
const aim = aimEuler(opening.position, opening.target);
camera.position.set(opening.position.x, opening.position.y, opening.position.z);
fly.setYawPitch(aim.yaw, aim.pitch);

const keys = {};
let mode = "fly";
let isOrbiting = false;
let orbitCenter = new THREE.Vector3(layout.activation.cx, layout.ground, layout.activation.cz);
let orbitRadius = 3200;
let orbitAngle = 0;
let pointer = null;
let dragged = 0;
const labelNodes = new Map();
const tmp = new THREE.Vector3();
const toPoint = new THREE.Vector3();
const viewDir = new THREE.Vector3();

function showToast(message) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.append(toast);
  setTimeout(() => {
    toast.classList.add("out");
    setTimeout(() => toast.remove(), 400);
  }, 2200);
}

function applyLightingMode(timeMode) {
  setTimeOfDay(timeMode);

  if (timeMode === "night") {
    const fog = "#0f1318";
    const zenith = "#07090d";
    const horizon = "#1b2029";
    scene.background.set(fog);
    scene.fog.color.set(fog);
    terrain.paintSky(terrain.skyGeo, zenith, horizon);
    terrain.skyGeo.attributes.color.needsUpdate = true;
    hemi.color.set(0x182030);
    hemi.groundColor.set(0x121620);
    sun.color.set(0x6688aa);
    sun.intensity = 0.25;
    sun.position.set(4000, 8000, -8000);
  } else if (timeMode === "dusk") {
    const fog = "#2a3138";
    const zenith = "#151a22";
    const horizon = "#3a342f";
    scene.background.set(fog);
    scene.fog.color.set(fog);
    terrain.paintSky(terrain.skyGeo, zenith, horizon);
    terrain.skyGeo.attributes.color.needsUpdate = true;
    hemi.color.set(0x243044);
    hemi.groundColor.set(0x2a241e);
    sun.color.set(0xffb27a);
    sun.intensity = 0.65;
    sun.position.set(14000, 4000, 6000);
  } else if (timeMode === "golden") {
    const fog = "#d4c8b2";
    const zenith = "#8aa8c0";
    const horizon = "#e8b488";
    scene.background.set(fog);
    scene.fog.color.set(fog);
    terrain.paintSky(terrain.skyGeo, zenith, horizon);
    terrain.skyGeo.attributes.color.needsUpdate = true;
    hemi.color.set(0xfdf2d8);
    hemi.groundColor.set(0xd4be9e);
    sun.color.set(0xff9944);
    sun.intensity = 1.35;
    sun.position.set(-12000, 4500, 4000);
  } else {
    // Day
    const fog = "#d5e0e4";
    const zenith = "#b7c9d4";
    const horizon = "#d5e0e4";
    scene.background.set(fog);
    scene.fog.color.set(fog);
    terrain.paintSky(terrain.skyGeo, zenith, horizon);
    terrain.skyGeo.attributes.color.needsUpdate = true;
    hemi.color.set(0xf4f7f8);
    hemi.groundColor.set(0xe4d8c4);
    sun.color.set(0xfff6ea);
    sun.intensity = 1.25;
    sun.position.set(-6000, 12000, 4000);
  }
}

const shell = createShell({
  onEnter() {
    isOrbiting = false;
    mode = "tour";
    tour.start();
  },
  onSkip() {
    isOrbiting = false;
    mode = "fly";
  },
  onTour() {
    leaveWalk(false);
    isOrbiting = false;
    mode = "tour";
    tour.start();
  },
  onWalk() {
    isOrbiting = false;
    if (mode === "walk") leaveWalk(true);
    else enterWalk();
  },
  onOrbit(enable) {
    isOrbiting = enable;
    if (isOrbiting) {
      if (tour.running) tour.stop();
      if (mode === "walk") leaveWalk(false);
      mode = "fly";
      // Pick orbit center near current look target
      camera.getWorldDirection(viewDir);
      const hitDist = Math.min(camera.position.y * 1.5, 5000);
      orbitCenter.copy(camera.position).addScaledVector(viewDir, hitDist);
      orbitCenter.y = layout.ground;
      orbitRadius = Math.hypot(camera.position.x - orbitCenter.x, camera.position.z - orbitCenter.z);
      orbitAngle = Math.atan2(camera.position.z - orbitCenter.z, camera.position.x - orbitCenter.x);
      showToast("360° Orbit Mode Active");
    }
  },
  onTimeOfDay(tod) {
    applyLightingMode(tod);
    showToast(`Time of Day: ${tod.toUpperCase()}`);
  },
  onDusk(on) {
    applyLightingMode(on ? "dusk" : "day");
  },
  onToggleSound() {
    const active = sound.toggle();
    showToast(active ? "Spatial Audio: ON" : "Spatial Audio: MUTED");
    return active;
  },
  onLayer(id, on) {
    if (groups[id]) groups[id].visible = on;
  },
  onFuture(on) {
    futureOn = on;
    setFuture(on);
    futureGroup.visible = on;
    if (on) shell.showCustom(futureView);
  },
  onFocus(id) {
    isOrbiting = false;
    goFrame(id, 2.3, false);
  },
  onTeleport(wx, wz) {
    isOrbiting = false;
    if (tour.running) tour.stop();
    if (mode === "walk") leaveWalk(false);
    mode = "fly";
    const targetAlt = Math.max(camera.position.y, 800);
    focus.go({
      position: { x: wx + 400, y: targetAlt, z: wz + 800 },
      target: { x: wx, y: layout.ground, z: wz }
    }, 1.8);
    showToast("Teleported to coordinates");
  },
  onScreenshot() {
    renderer.render(scene, camera);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dholera-sir-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("High-res Screenshot Saved!");
    });
  },
});

const tour = createTour(tourStops, (stop) => {
  shell.show(stop.chapter, stop.say);
  goFrame(stop.focus, 6.2, true);
});

function enterWalk() {
  tour.stop();
  focus.cancel();
  isOrbiting = false;
  mode = "walk";
  walk.player.visible = true;
  walk.reset();
  shell.setWalking(true);
  shell.show("activation");
  showToast("Entered Walk Mode (WASD + Shift)");
}

function leaveWalk(resumeFly) {
  const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, "YXZ");
  fly.setYawPitch(euler.y, euler.x);
  mode = "fly";
  walk.player.visible = false;
  shell.setWalking(false);
  if (!resumeFly) return;
}

function goFrame(id, seconds, fromTour) {
  const frame = layout.frames[id];
  if (!frame) return;
  if (!fromTour && tour.running) tour.stop();
  if (mode === "walk") leaveWalk(false);
  if (!fromTour) mode = "fly";
  focus.go(frame, seconds);
}

function cancelAuto() {
  focus.cancel();
  if (isOrbiting) {
    isOrbiting = false;
    shell.setOrbiting(false);
  }
  if (tour.running) {
    tour.stop();
    mode = mode === "walk" ? "walk" : "fly";
  }
}

window.addEventListener("keydown", (event) => {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
  keys[event.code] = true;

  if (event.code === "KeyH") {
    shell.toggleHelp();
    return;
  }
  if (event.code === "KeyF") {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
    return;
  }
  if (event.code === "KeyO") {
    isOrbiting = !isOrbiting;
    shell.setOrbiting(isOrbiting);
    showToast(isOrbiting ? "Orbit Active" : "Orbit Stopped");
    return;
  }
  if (event.code === "KeyM") {
    const active = sound.toggle();
    showToast(active ? "Audio ON" : "Audio MUTED");
    return;
  }
  if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyQ", "KeyE"].includes(event.code)) {
    cancelAuto();
  }
  if (event.code === "Escape") {
    cancelAuto();
    shell.openChapter("region");
  }
});

window.addEventListener("keyup", (event) => {
  keys[event.code] = false;
});

canvas.addEventListener("pointerdown", (event) => {
  pointer = { x: event.clientX, y: event.clientY, id: event.pointerId };
  dragged = 0;
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", (event) => {
  if (!pointer || event.pointerId !== pointer.id) return;
  const dx = event.clientX - pointer.x;
  const dy = event.clientY - pointer.y;
  dragged += Math.abs(dx) + Math.abs(dy);
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  if (dragged < 4) return;
  cancelAuto();
  if (mode === "walk") walk.yawBy(-dx * 0.005);
  else fly.yawBy(-dx * 0.0035, -dy * 0.0028);
});

canvas.addEventListener("pointerup", (event) => {
  if (dragged < 5) {
    const id = pickAt(event, camera, scene);
    if (id) shell.openId(id);
  }
  pointer = null;
});

canvas.addEventListener("wheel", (event) => {
  if (mode !== "walk") {
    event.preventDefault();
    cancelAuto();
    fly.elevate(-Math.sign(event.deltaY) * (event.deltaY > 0 ? 1 : 1) * Math.min(900, Math.abs(event.deltaY)));
  }
}, { passive: false });

function resize() {
  const w = canvas.clientWidth || window.innerWidth;
  const h = canvas.clientHeight || window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / Math.max(h, 1);
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

const labelRank = { region: 0, zone: 1, village: 2, building: 3 };

function updateLabels() {
  camera.getWorldDirection(viewDir);
  const height = camera.position.y;
  const pending = [];
  for (const label of labels) {
    const node = ensureLabel(label);
    const show = labelVisible(label.tier, height) && !(label.when === "future" && !futureOn);
    toPoint.set(label.x, label.y, label.z).sub(camera.position);
    const behind = toPoint.dot(viewDir) < 0;
    if (!show || behind) {
      node.style.display = "none";
      continue;
    }
    tmp.set(label.x, label.y, label.z).project(camera);
    if (tmp.z > 1) {
      node.style.display = "none";
      continue;
    }
    pending.push({
      label,
      node,
      x: (tmp.x * 0.5 + 0.5) * canvas.clientWidth,
      y: (-tmp.y * 0.5 + 0.5) * canvas.clientHeight,
    });
  }
  const rank = (item) => (item.label.id === "future-grain" ? -1 : (labelRank[item.label.tier] ?? 9));
  pending.sort((a, b) => rank(a) - rank(b));
  const kept = [];
  for (const item of pending) {
    const gap = item.label.tier === "building" ? 36 : item.label.tier === "village" ? 46 : 96;
    if (kept.some((other) => Math.hypot(other.x - item.x, other.y - item.y) < gap)) {
      item.node.style.display = "none";
      continue;
    }
    item.node.style.display = "block";
    item.node.style.left = `${item.x}px`;
    item.node.style.top = `${item.y}px`;
    kept.push(item);
  }
}

function labelVisible(tier, height) {
  if (tier === "village") return height < 4200 && height > 80;
  if (tier === "zone") return height < 16000 && height > 450;
  if (tier === "building") return height < 1400;
  return height > 2800;
}

function ensureLabel(label) {
  let node = labelNodes.get(label.id + label.text);
  if (!node) {
    node = document.createElement("button");
    node.type = "button";
    node.className = `tier-${label.tier}`;
    node.textContent = label.text;
    node.addEventListener("click", (event) => {
      event.stopPropagation();
      shell.openId(label.id);
    });
    labelRoot.append(node);
    labelNodes.set(label.id + label.text, node);
  }
  return node;
}

function updateFog() {
  const u = THREE.MathUtils.clamp((camera.position.y - 160) / 6000, 0, 1);
  scene.fog.near = THREE.MathUtils.lerp(240, 9000, u);
  scene.fog.far = THREE.MathUtils.lerp(3800, 78000, u);
}

let then = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - then) / 1000);
  then = now;
  const focusing = focus.update(dt);

  if (mode === "tour") {
    tour.update(dt);
  } else if (isOrbiting) {
    orbitAngle += dt * 0.12;
    camera.position.x = orbitCenter.x + Math.cos(orbitAngle) * orbitRadius;
    camera.position.z = orbitCenter.z + Math.sin(orbitAngle) * orbitRadius;
    camera.lookAt(orbitCenter.x, orbitCenter.y + 20, orbitCenter.z);
  } else if (!focusing && mode === "walk") {
    walk.update(dt, keys);
  } else if (!focusing && mode === "fly") {
    fly.update(dt, keys);
  }

  region.update(now * 0.001);

  // Water animation
  if (terrain.water) {
    terrain.water.position.y = 0.12 + Math.sin(now * 0.0008) * 0.08;
  }

  // Atmospheric dust / pollen drift
  if (terrain.particles) {
    terrain.particles.rotation.y += dt * 0.015;
    terrain.particles.position.copy(camera.position);
  }

  // Audio update
  const isWalkingMoving = Boolean(keys.KeyW || keys.KeyS || keys.KeyA || keys.KeyD || keys.ArrowUp || keys.ArrowDown);
  sound.update(camera.position, mode === "walk", isWalkingMoving);

  terrain.sky.position.copy(camera.position);
  updateFog();
  updateLabels();
  drawMinimap(mapCanvas, layout, camera);

  // HUD stats
  camera.getWorldDirection(viewDir);
  const headingDeg = (Math.atan2(viewDir.x, -viewDir.z) * 180) / Math.PI;
  const currentMode = mode === "walk" ? "Walk" : isOrbiting ? "Orbit" : mode === "tour" ? "Tour" : "Fly";
  shell.updateHud(camera.position.y, currentMode, headingDeg);

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Dismiss initial loading screen
const loaderEl = document.querySelector("#loader");
if (loaderEl) {
  loaderEl.style.transition = "opacity 0.6s ease-out";
  loaderEl.style.opacity = "0";
  setTimeout(() => loaderEl.remove(), 650);
}

function selfTest() {
  const failures = [];
  const savedMode = mode;
  tour.stop();
  focus.cancel();
  mode = "fly";
  fly.setYawPitch(0, 0);
  camera.position.set(0, 400, 0);
  const z0 = camera.position.z;
  const x0 = camera.position.x;
  for (let i = 0; i < 24; i++) fly.update(0.05, { KeyW: true });
  if (!(camera.position.z < z0 - 1)) failures.push(`fly W went to z ${camera.position.z}`);
  fly.setYawPitch(0, 0);
  camera.position.set(0, 400, 0);
  for (let i = 0; i < 24; i++) fly.update(0.05, { KeyD: true });
  if (!(camera.position.x > x0 + 1)) failures.push(`fly D went to x ${camera.position.x}`);
  const basis = fly.basis();
  if (basis.right.dot(new THREE.Vector3(1, 0, 0)) < 0.9) failures.push("fly right is not east at yaw 0");

  mode = "walk";
  walk.reset();
  const p0 = walk.player.position.clone();
  for (let i = 0; i < 20; i++) walk.update(0.05, { KeyW: true });
  const moved = walk.player.position.clone().sub(p0);
  moved.y = 0;
  const face = headingOf(walk.player, new THREE.Vector3());
  if (moved.length() < 0.4) failures.push("walk W did not move");
  else if (face.dot(moved.clone().normalize()) < 0.9) failures.push(`walk faced away from travel ${face.dot(moved.normalize())}`);
  const nose = walk.player.getObjectByName("nose");
  const origin = new THREE.Vector3();
  const noseAt = new THREE.Vector3();
  walk.player.getWorldPosition(origin);
  nose.getWorldPosition(noseAt);
  const noseDir = noseAt.sub(origin).setY(0).normalize();
  if (noseDir.dot(face) < 0.9) failures.push("nose is not in front of the walker");

  walk.reset();
  const canalZ = layout.canal.polyline[0].z;
  for (let i = 0; i < 400; i++) walk.update(0.05, { KeyS: true });
  if (walk.player.position.z > canalZ - layout.canal.halfWidth) failures.push("walker entered the canal");

  const a = region.sample(0);
  const b = region.sample(4);
  if (Math.hypot(a.x - b.x, a.z - b.z) < 1) failures.push("expressway vehicle did not move");

  walk.reset();
  walk.player.visible = savedMode === "walk";
  camera.position.set(opening.position.x, opening.position.y, opening.position.z);
  fly.setYawPitch(aim.yaw, aim.pitch);
  mode = savedMode === "walk" ? "walk" : "fly";
  void UP;
  void chapters;
  return failures;
}

window.__dholera = { selfTest, layout, camera, scene, groups };
