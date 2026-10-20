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

/** Shared by every translucent “planned” mass so Future can finish them together. */
export const plannedMat = mat(paint.planned, { opacity: 0.42, roughness: 0.4, depthWrite: false });

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
}

export function setFuture(on) {
  plannedMat.color.set(on ? paint.concrete : paint.planned);
  plannedMat.opacity = on ? 1 : 0.42;
  plannedMat.transparent = !on;
  plannedMat.depthWrite = on;
  plannedMat.roughness = on ? 0.86 : 0.4;
  plannedMat.needsUpdate = true;
}
