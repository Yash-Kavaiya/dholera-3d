import * as THREE from "three";

export const paint = {
  salt: 0xc4bba8,
  plinth: 0xf4efe4,
  gulf: 0x5a8898,
  foam: 0xe6f2f4,
  road: 0x8a8276,
  arterial: 0x5e574d,
  express: 0xb5693a,
  highway: 0x3e3a34,
  rail: 0x2c2926,
  concrete: 0xf7f4ef,
  concreteDark: 0xd7d1c6,
  glass: 0x98b8c2,
  solar: 0x1d2938,
  canal: 0x5c8a88,
  parapet: 0xe7e2d8,
  copper: 0xb5693a,
  planned: 0xf4f0e8,
  lamp: 0xffb866,
  window: 0xd5e1e4,
  treeLeaf: 0x4d6642,
  treeTrunk: 0x5d4738,
  runwayLight: 0x55ffaa,
  beaconRed: 0xff3322,
};

export function mat(color, opts = {}) {
  const opacity = opts.opacity ?? 1;
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.85,
    metalness: opts.metalness ?? 0,
    transparent: opacity < 1,
    opacity,
    side: opts.side ?? THREE.FrontSide,
    polygonOffset: Boolean(opts.offset),
    polygonOffsetFactor: opts.offset ? -2 : 0,
    polygonOffsetUnits: opts.offset ? -2 : 0,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 1,
    depthWrite: opts.depthWrite ?? true,
  });
}

export const lampMat = mat(0xe6e0d6, { emissive: paint.lamp, emissiveIntensity: 0, roughness: 0.45 });
export const windowMat = mat(paint.window, { emissive: 0xffe2bf, emissiveIntensity: 0, roughness: 0.25, metalness: 0.05 });
export const headlightMat = mat(0xffffff, { emissive: 0xfff6dd, emissiveIntensity: 0, roughness: 0.2 });
export const taillightMat = mat(0x991111, { emissive: 0xff2222, emissiveIntensity: 0, roughness: 0.3 });
export const beaconMat = mat(0xff2211, { emissive: 0xff1100, emissiveIntensity: 0 });
export const runwayLightMat = mat(0x55ff99, { emissive: 0x55ff99, emissiveIntensity: 0 });

export const foliageMat = mat(paint.treeLeaf, { roughness: 0.9 });
export const barkMat = mat(paint.treeTrunk, { roughness: 0.95 });

/* ---------- Solid city palette (shared singletons so geometry can be merged per material) ---------- */

export const wallMat = mat(0xf0e9dc, { roughness: 0.9 });
export const wallAltMat = mat(0xe1d4bd, { roughness: 0.92 });
export const wallDarkMat = mat(0xc9bda8, { roughness: 0.93 });
export const wallWarmMat = mat(0xe8cdb0, { roughness: 0.9 });
export const stoneMat = mat(0xd6cbb8, { roughness: 0.95 });
export const plasterMat = mat(0xf6f2e9, { roughness: 0.88 });
export const roofMat = mat(0xb0a799, { roughness: 0.92 });
export const roofDarkMat = mat(0x847d72, { roughness: 0.9 });
export const metalMat = mat(0x9aa2a6, { metalness: 0.4, roughness: 0.52 });
export const steelMat = mat(0x768084, { metalness: 0.55, roughness: 0.42 });
export const copperMat = mat(paint.copper, { metalness: 0.3, roughness: 0.45 });
export const greenMat = mat(0x6f8f55, { roughness: 0.95 });
export const lawnMat = mat(0x8aa562, { roughness: 0.98 });
export const waterMat = mat(paint.canal, { roughness: 0.16, metalness: 0.08 });
export const plazaMat = mat(0xe7dfd0, { roughness: 0.95 });
export const pavingMat = mat(0xcfc7b8, { roughness: 0.96 });
export const asphaltMat = mat(paint.road, { roughness: 0.96 });
export const arterialMat = mat(paint.arterial, { roughness: 0.96 });
export const sidewalkMat = mat(0xdad3c5, { roughness: 0.97 });
export const markingMat = mat(0xf3f0e7, { roughness: 0.8 });
export const medianMat = mat(0x7d9459, { roughness: 0.98 });
export const redMat = mat(0xb5442f, { roughness: 0.7 });
export const whiteMat = mat(0xfaf8f3, { roughness: 0.6 });
export const darkMat = mat(0x3a3f44, { roughness: 0.8 });
export const containerMats = [
  mat(0xb5563a, { roughness: 0.8 }),
  mat(0x3d6d84, { roughness: 0.8 }),
  mat(0x8a8f56, { roughness: 0.8 }),
  mat(0x9c7b4e, { roughness: 0.8 }),
];
export const bodyMats = [wallMat, wallAltMat, wallWarmMat, plasterMat, wallDarkMat];

/** White base for instanced bodies; per-instance colours multiply into the warm palette. */
export const bodyTintMat = mat(0xffffff, { roughness: 0.9 });

/** Emissive bands that stay in sync with the shared window material (day/night). */
export const SIGN_MATS = [windowMat, lampMat];

/** Shared by every translucent “planned” mass so Future can finish them together. */
export const plannedMat = mat(paint.planned, { opacity: 0.42, roughness: 0.4, depthWrite: false });
/** Accent materials for planned buildings. They ghost and finish with plannedMat (see setFuture). */
export const plannedGlassMat = mat(paint.glass, { opacity: 0.3, roughness: 0.2, metalness: 0.15, depthWrite: false, emissive: 0xffe2bf, emissiveIntensity: 0 });
export const plannedRoofMat = mat(paint.concreteDark, { opacity: 0.36, roughness: 0.7, depthWrite: false });
export const plannedGreenMat = mat(0x8fa877, { opacity: 0.3, roughness: 0.95, depthWrite: false });
export const plannedMetalMat = mat(0xa9b0b4, { opacity: 0.36, roughness: 0.45, metalness: 0.5, depthWrite: false });
export const plannedPoolMat = mat(0x5aa6b8, { opacity: 0.4, roughness: 0.15, depthWrite: false });

const plannedFinish = [
  [plannedMat, paint.planned, paint.concrete, 0.42, 0.4, 0.86],
  [plannedGlassMat, paint.glass, 0x7d9eaa, 0.3, 0.2, 0.18],
  [plannedRoofMat, paint.concreteDark, 0xb9b1a4, 0.36, 0.7, 0.8],
  [plannedGreenMat, 0x8fa877, 0x6f8f55, 0.3, 0.95, 0.95],
  [plannedMetalMat, 0xa9b0b4, 0x8d969b, 0.36, 0.45, 0.4],
  [plannedPoolMat, 0x5aa6b8, 0x3f93a8, 0.4, 0.15, 0.1],
];

export function setDusk(on) {
  setTimeOfDay(on ? "dusk" : "day");
}

export function setTimeOfDay(time) {
  if (time === "night") {
    lampMat.emissiveIntensity = 3.6;
    windowMat.emissiveIntensity = 1.4;
    headlightMat.emissiveIntensity = 4.0;
    taillightMat.emissiveIntensity = 2.8;
    beaconMat.emissiveIntensity = 3.2;
    runwayLightMat.emissiveIntensity = 3.0;
  } else if (time === "dusk") {
    lampMat.emissiveIntensity = 2.4;
    windowMat.emissiveIntensity = 0.9;
    headlightMat.emissiveIntensity = 2.5;
    taillightMat.emissiveIntensity = 1.8;
    beaconMat.emissiveIntensity = 2.4;
    runwayLightMat.emissiveIntensity = 2.2;
  } else if (time === "golden") {
    lampMat.emissiveIntensity = 0.8;
    windowMat.emissiveIntensity = 0.4;
    headlightMat.emissiveIntensity = 1.2;
    taillightMat.emissiveIntensity = 0.8;
    beaconMat.emissiveIntensity = 1.5;
    runwayLightMat.emissiveIntensity = 1.0;
  } else {
    // Day
    lampMat.emissiveIntensity = 0;
    windowMat.emissiveIntensity = 0;
    headlightMat.emissiveIntensity = 0;
    taillightMat.emissiveIntensity = 0;
    beaconMat.emissiveIntensity = 0.6;
    runwayLightMat.emissiveIntensity = 0.4;
  }
  plannedGlassMat.emissiveIntensity = windowMat.emissiveIntensity * 0.7;
}

export function setFuture(on) {
  for (const [material, ghost, finished, opacity, ghostRough, finishedRough] of plannedFinish) {
    material.color.set(on ? finished : ghost);
    material.opacity = on ? 1 : opacity;
    material.transparent = !on;
    material.depthWrite = on;
    material.roughness = on ? finishedRough : ghostRough;
    material.needsUpdate = true;
  }
}
