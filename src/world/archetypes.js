import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import {
  paint,
  mat,
  windowMat,
  lampMat,
  foliageMat,
  barkMat,
  wallMat,
  wallAltMat,
  wallDarkMat,
  wallWarmMat,
  stoneMat,
  plasterMat,
  roofMat,
  roofDarkMat,
  metalMat,
  steelMat,
  copperMat,
  greenMat,
  lawnMat,
  waterMat,
  plazaMat,
  pavingMat,
  redMat,
  whiteMat,
  darkMat,
  containerMats,
  bodyTintMat,
} from "./materials.js";
import { UNIT, createBatch, makeRng } from "./buildkit.js";
import { tag } from "./meshkit.js";

/**
 * Solid building typologies for the whole SIR. Each archetype writes transformed unit
 * geometry into a batch; the batch merges per material so a building costs a few meshes.
 * Everything fits inside (or just inside) its w × d footprint so walk colliders stay honest.
 */

const FLOOR = 3.6;

/** Local-frame helpers around a spec centre, with y = 0 on the ground. */
function kit(batch, spec, gnd) {
  const { x, z } = spec;
  const hw = spec.w / 2;
  const hd = spec.d / 2;
  const drop = (kind, material, lx, ly, lz, sx, sy, sz, rotY = 0) =>
    batch.add(kind, material, x + lx, gnd + ly, z + lz, sx, sy, sz, rotY);
  const box = (lx, ly, lz, sx, sy, sz, material = wallMat, rotY = 0) => drop("box", material, lx, ly, lz, sx, sy, sz, rotY);
  const cyl = (lx, ly, lz, r, h, material = metalMat, rotY = 0) => drop("cyl", material, lx, ly, lz, r, h, r, rotY);
  const gable = (lx, ly, lz, sx, sy, sz, material = roofMat, rotY = 0) => drop("gable", material, lx, ly, lz, sx, sy, sz, rotY);
  const hip = (lx, ly, lz, sx, sy, sz, material = roofMat, rotY = 0) => drop("hip", material, lx, ly, lz, sx, sy, sz, rotY);

  /** A parked floor block: body, one ribbon-window band per floor, parapet. Returns top y. */
  const block = (lx, ly, lz, sw, sd, floors, floorH = FLOOR, body = wallMat, glass = windowMat, opts = {}) => {
    const h = floors * floorH;
    box(lx, ly, lz, sw, h, sd, body);
    const inset = opts.inset ?? 0.28;
    for (let f = 0; f < floors; f++) {
      box(lx, ly + f * floorH + floorH * 0.34, lz, sw + inset, floorH * 0.44, sd + inset, glass);
    }
    if (opts.parapet !== false) box(lx, ly + h, lz, sw + 0.5, 0.55, sd + 0.5, roofMat);
    return ly + h + (opts.parapet === false ? 0 : 0.55);
  };

  /** Thin horizontal balcony slabs + railings on both long sides of a tower. */
  const balconies = (lx, ly, lz, sw, sd, floors, floorH = FLOOR, every = 2) => {
    for (let f = every; f < floors; f += every) {
      for (const side of [-1, 1]) {
        box(lx, ly + f * floorH - 0.18, lz + side * (sd / 2 + 0.7), sw * 0.86, 0.22, 1.7, roofMat);
        box(lx, ly + f * floorH + 0.85, lz + side * (sd / 2 + 1.4), sw * 0.86, 0.12, 0.12, metalMat);
      }
    }
  };

  /** Vertical solar fins along a facade. */
  const fins = (lx, ly, lz, count, span, h, step, material = metalMat, side = -1) => {
    for (let i = 0; i < count; i++) {
      box(lx - span / 2 + (i * span) / (count - 1 || 1), ly, lz + side * (spec.d / 2 + 0.35), 0.35, h, 0.9, material);
    }
    void step;
  };

  /** Rooftop plant: AC units, water tank, mast. */
  const roofPlant = (lx, ly, lz, sw, sd, seed = 0) => {
    const rnd = makeRng(seed + 17);
    const n = 2 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) {
      box(lx + (rnd() - 0.5) * sw * 0.6, ly, lz + (rnd() - 0.5) * sd * 0.6, 3 + rnd() * 3, 1.4, 2.5 + rnd() * 2, metalMat);
    }
    cyl(lx + sw * 0.3, ly, lz - sd * 0.25, 2.2, 2.6, whiteMat);
    box(lx - sw * 0.35, ly, lz + sd * 0.2, 0.4, 6 + rnd() * 5, 0.4, steelMat);
  };

  /** Entry canopy and steps on the given local face. */
  const entrance = (lx, lz, sw, side = -1) => {
    box(lx, 0, lz + side * (spec.d / 2 + 2.6), sw, 0.4, 5.4, roofMat);
    for (const off of [-sw / 2 + 1.4, sw / 2 - 1.4]) cyl(lx + off, 0, lz + side * (spec.d / 2 + 4.6), 0.45, 3.6, steelMat);
    box(lx, 0, lz + side * (spec.d / 2 + 1.2), sw + 2, 0.25, 2.4, pavingMat);
  };

  return { x, z, hw, hd, w: spec.w, d: spec.d, drop, box, cyl, gable, hip, block, balconies, fins, roofPlant, entrance };
}

/* ------------------------------------------------------------------------------------ */
/* Civic / landmark archetypes                                                           */
/* ------------------------------------------------------------------------------------ */

/** ABCD / CIOC: stone podium, glass exhibition halls, copper-crowned operations tower, plaza. */
function cioc(batch, spec, gnd) {
  const k = kit(batch, spec, gnd);
  const { hw, hd } = k;
  // Podium: two exhibition halls with a glazed central atrium.
  const podTop = k.block(0, 0, 0, k.w, k.d, 5, 4, stoneMat, windowMat);
  k.box(0, 0, -hd * 0.18, k.w * 0.34, 22, k.d * 0.5, windowMat);
  k.box(0, 22, -hd * 0.18, k.w * 0.36, 1.2, k.d * 0.54, roofMat);
  // Copper vertical fins on the podium long faces.
  for (let i = -6; i <= 6; i++) {
    k.box(i * (k.w / 14), 0, -hd - 0.4, 1.1, 20, 0.8, copperMat);
    k.box(i * (k.w / 14), 0, hd + 0.4, 1.1, 20, 0.8, copperMat);
  }
  // CIOC tower at the west end, glazed with a copper crown and mast.
  const tx = -hw + 24;
  const towerTop = k.block(tx, podTop - 0.55, 0, 30, k.d * 0.72, 8, 3.9, plasterMat, windowMat);
  k.box(tx, towerTop, 0, 32, 2.2, k.d * 0.72 + 2, copperMat);
  k.box(tx, towerTop + 2.2, 0, 22, 3.4, 14, windowMat);
  k.cyl(tx, towerTop + 5.6, 0, 0.5, 12, steelMat);
  // Roof plant and planetarium dome on the east podium.
  k.roofPlant(-hw + 24, towerTop, 0, 20, 16, 3);
  k.cyl(hw - 26, podTop - 0.55, 4, 9, 1.1, windowMat);
  k.cyl(hw - 26, podTop - 0.55, 4, 8.2, 6, whiteMat);
  // Front plaza, steps, fountain, flags.
  k.box(0, 0, hd + 7, k.w * 0.9, 0.28, 14, plazaMat);
  for (let s = 0; s < 4; s++) k.box(0, 0, hd + 1 + s * 1.4, k.w * 0.55, 0.3 + s * 0.28, 1.5, stoneMat);
  k.cyl(0, 0.28, hd + 9, 7, 0.9, waterMat);
  k.cyl(0, 0.28, hd + 9, 7.6, 0.55, stoneMat);
  k.cyl(0, 1.1, hd + 9, 0.8, 5.4, whiteMat);
  for (const fx of [-14, -7, 7, 14]) {
    k.cyl(fx, 0.28, hd + 12, 0.25, 14, steelMat);
    k.box(fx, 13, hd + 12, 2.4, 1.4, 0.15, copperMat);
  }
  k.entrance(0, 0, 18);
  return k;
}

/** SPV building: glazed office bar with atrium, council chamber and a courtyard between ABCD. */
function spv(batch, spec, gnd) {
  const k = kit(batch, spec, gnd);
  const top = k.block(0, 0, 0, k.w, k.d, 6, 3.8, plasterMat, windowMat);
  k.box(0, 0, -k.hd + 3, k.w * 0.42, 26, 7, windowMat);
  k.box(0, 26, -k.hd + 3, k.w * 0.44, 1, 8, roofMat);
  k.roofPlant(0, top, 0, k.w * 0.7, k.d * 0.5, 8);
  k.box(-k.hw + 4, 0, 0, 4, 30, k.d * 0.8, stoneMat);
  k.box(k.hw - 4, 0, 0, 4, 30, k.d * 0.8, stoneMat);
  k.box(0, 0, k.hd + 2, k.w * 0.8, 0.3, 6, plazaMat);
  for (const fx of [-8, 8]) k.cyl(fx, 0, k.hd + 2, 0.25, 12, steelMat);
  k.entrance(0, 0, 12);
  return k;
}

/** City hall: stone base, colonnade, glazed council drum, copper crown, civic plaza. */
function cityhall(batch, spec, gnd) {
  const k = kit(batch, spec, gnd);
  const { hw, hd } = k;
  const base = 3;
  k.block(0, 0, 0, k.w, k.d, base, 4.2, stoneMat, windowMat);
  // Colonnade across the south face.
  for (let i = -5; i <= 5; i++) k.cyl(i * 6.4, 0, hd - 3.5, 0.85, 13, whiteMat);
  k.box(0, 13.2, hd - 3.5, k.w * 0.86, 1.6, 7, stoneMat);
  // Central council drum and copper crown.
  k.cyl(0, 12.6, -3, 13, 9, windowMat);
  k.cyl(0, 12.6, -3, 13.8, 3.6, stoneMat);
  k.cyl(0, 21.6, -3, 12, 2.4, copperMat);
  k.cyl(0, 24, -3, 6.5, 2.2, copperMat);
  k.cyl(0, 26.2, -3, 0.5, 9, steelMat);
  // Wings.
  k.block(-hw + 16, 12.6, -4, 26, 22, 3, 3.8, plasterMat, windowMat);
  k.block(hw - 16, 12.6, -4, 26, 22, 3, 3.8, plasterMat, windowMat);
  k.roofPlant(-hw + 16, 24, -4, 18, 14, 4);
  k.roofPlant(hw - 16, 24, -4, 18, 14, 5);
  // Plaza with paving bands, lawn and a reflecting pool.
  k.box(0, 0, hd + 12, k.w * 1.02, 0.22, 24, plazaMat);
  k.box(0, 0.22, hd + 12, 12, 0.1, 18, waterMat);
  k.box(-k.w * 0.32, 0.22, hd + 12, 22, 0.12, 16, lawnMat);
  k.box(k.w * 0.32, 0.22, hd + 12, 22, 0.12, 16, lawnMat);
  for (const fx of [-24, -16, 16, 24]) k.cyl(fx, 0, hd + 20, 0.18, 9, steelMat);
  return k;
}

/** Commercial high street: a run of retail blocks with awnings, signs and a paved street. */
function highstreet(batch, spec, gnd) {
  const k = kit(batch, spec, gnd);
  const blocks = 5;
  const bw = (k.w - 8) / blocks;
  for (let i = 0; i < blocks; i++) {
    const lx = -k.w / 2 + 4 + bw * (i + 0.5);
    const floors = 2 + ((i * 7) % 3);
    const depth = k.d * (0.62 + ((i * 3) % 4) * 0.07);
    const top = k.block(lx, 0, 0, bw - 2.4, depth, floors, 4, i % 2 ? wallAltMat : wallMat, windowMat);
    // Ground-floor shopfront.
    k.box(lx, 0.2, depth / 2 + 0.2, bw - 3.2, 3.4, 0.4, windowMat);
    k.box(lx, 3.7, depth / 2 + 1.6, bw - 3.4, 0.3, 3, copperMat); // awning
    k.box(lx, 6.4, depth / 2 + 0.4, bw - 5, 1.3, 0.3, lampMat); // sign band
    k.roofPlant(lx, top, 0, bw - 8, depth - 6, i + 3);
  }
  k.box(0, 0, k.d / 2 + 2.5, k.w, 0.2, 5, pavingMat);
  for (let i = 0; i < 6; i++) {
    k.cyl(-k.w / 2 + 12 + i * ((k.w - 24) / 5), 0, k.d / 2 + 4, 0.18, 6, steelMat);
    k.cyl(-k.w / 2 + 12 + i * ((k.w - 24) / 5), 6, k.d / 2 + 4, 0.5, 0.7, lampMat);
  }
  return k;
}

/** Retail block prefab: single shop parade with awnings and a roof terrace. */
function retail(batch, spec, gnd) {
  const k = kit(batch, spec, gnd);
  const top = k.block(0, 0, 0, k.w, k.d * 0.8, 3, 4.2, wallAltMat, windowMat);
  k.box(0, 0.2, k.d * 0.4 + 0.2, k.w - 3, 3.6, 0.4, windowMat);
  k.box(0, 3.9, k.d * 0.4 + 1.7, k.w - 2, 0.32, 3.2, copperMat);
  k.box(0, 6.8, k.d * 0.4 + 0.35, k.w * 0.5, 1.4, 0.3, lampMat);
  k.box(0, top, 0, k.w - 8, 0.4, k.d * 0.5, lawnMat);
  k.roofPlant(0, top, 0, k.w * 0.5, k.d * 0.3, 11);
  return k;
}

/** Apartment slab: 12–15 floors, balcony stacks, stair cores, plinth shops. */
function apartment(batch, spec, gnd, index = 0) {
  const k = kit(batch, spec, gnd);
  const plinth = 4.4;
  k.box(0, 0, 0, k.w, plinth, k.d - 2, wallAltMat);
  k.box(0, 0.4, 0, k.w + 0.3, 3, k.d - 1.7, windowMat);
  k.box(0, plinth, 0, k.w + 0.5, 0.4, k.d + 0.5, roofMat);
  const towers = index % 2 === 0 ? 3 : 2;
  const tw = (k.w - (towers + 1) * 9) / towers;
  for (let i = 0; i < towers; i++) {
    const lx = -k.w / 2 + 9 + tw / 2 + i * (tw + 9);
    const floors = 10 + ((i * 5 + index * 3) % 6);
    const top = k.block(lx, plinth + 0.4, 0, tw, k.d - 6, floors, 3.15, plasterMat, windowMat);
    k.balconies(lx, plinth + 0.4, 0, tw, k.d - 6, floors, 3.15, 2);
    k.box(lx, top, 0, tw - 6, 0.35, 9, lawnMat);
    k.roofPlant(lx, top, 0, tw - 10, k.d - 12, i + 30 + index);
    k.cyl(lx + tw / 2 - 4, top, 0, 0.3, 7, steelMat);
  }
  return k;
}

/** Courtyard housing: four mid-rise bars around a shared green. */
function midrise(batch, spec, gnd) {
  const k = kit(batch, spec, gnd);
  const { hw, hd } = k;
  const bar = 12;
  const wTop = k.block(0, 0, -hd + bar / 2, k.w, bar, 6, 3.3, wallMat, windowMat);
  k.balconies(0, 0, -hd + bar / 2, k.w, bar, 6, 3.3, 2);
  const eTop = k.block(hw - bar / 2, 0, 0, bar, k.d - bar * 2, 6, 3.3, wallAltMat, windowMat);
  const wSide = k.block(-hw + bar / 2, 0, 0, bar, k.d - bar * 2, 5, 3.3, wallAltMat, windowMat);
  k.block(0, 0, hd - bar / 2, k.w * 0.7, bar, 4, 3.3, wallMat, windowMat);
  k.box(0, 0.02, 0, k.w - bar * 2 - 4, 0.2, k.d - bar * 2 - 4, lawnMat);
  k.box(0, 0.22, 0, 4, 0.1, k.d - bar * 2 - 8, pavingMat);
  for (const [lx, lz] of [[-hw + bar / 2, -hd + bar / 2], [hw - bar / 2, -hd + bar / 2], [-hw + bar / 2, hd - bar / 2]]) {
    k.roofPlant(lx, lz === -hd + bar / 2 ? wTop : eTop, lz, 8, 6, 21);
  }
  k.cyl(0, 0.2, 0, 2.6, 1.2, waterMat);
  void wSide;
  return k;
}

/** School campus: teaching block, two wings, courtyard, playground, assembly ground. */
function school(batch, spec, gnd) {
  const k = kit(batch, spec, gnd);
  const { hw, hd } = k;
  k.block(0, 0, -hd + 8, k.w, 16, 3, 3.8, wallWarmMat, windowMat);
  k.block(-hw + 8, 0, 4, 16, k.d - 20, 2, 3.8, wallAltMat, windowMat);
  k.block(hw - 8, 0, 4, 16, k.d - 20, 2, 3.8, wallAltMat, windowMat);
  // Covered walkway and courtyard.
  k.box(0, 4.2, -hd + 17.5, k.w - 20, 0.4, 5, roofMat);
  k.box(0, 0.02, 2, k.w - 40, 0.18, k.d - 26, lawnMat);
  k.box(hw - 22, 0.02, hd - 8, 34, 0.2, 24, mat(0xb98a63, { roughness: 0.95 })); // playground
  k.box(0, 0.02, hd - 6, k.w * 0.5, 0.2, 12, pavingMat);
  k.cyl(-hw + 26, 0, hd - 10, 0.2, 11, steelMat); // flag
  k.box(-hw + 26, 10, hd - 10, 2.6, 1.6, 0.12, copperMat);
  for (let i = 0; i < 4; i++) k.cyl(-hw + 14 + i * 8, 0, -hd + 18.5, 0.25, 4.2, steelMat);
  k.roofPlant(0, 11.4, -hd + 8, k.w * 0.5, 8, 41);
  return k;
}

/** Small school prefab for district neighbourhoods. */
function schoolSmall(batch, spec, gnd) {
  const k = kit(batch, spec, gnd);
  const { hw, hd } = k;
  k.block(0, 0, -hd + 6, k.w, 12, 2, 3.8, wallWarmMat, windowMat);
  k.block(-hw + 6, 0, 3, 12, k.d - 14, 2, 3.8, wallAltMat, windowMat);
  k.box(6, 0.02, hd - 10, k.w * 0.5, 0.16, 14, mat(0xb98a63, { roughness: 0.95 }));
  k.box(0, 0.02, hd - 4, k.w * 0.4, 0.16, 5, pavingMat);
  k.cyl(-hw + 10, 0, hd - 8, 0.18, 8, steelMat);
  return k;
}

/** Hospital: diagnostic podium, twin ward towers, connecting spine, helipad, ambulance bay. */
function hospital(batch, spec, gnd) {
  const k = kit(batch, spec, gnd);
  const { hw, hd } = k;
  const podTop = k.block(0, 0, 0, k.w, k.d, 2, 4.2, plasterMat, windowMat);
  const wardW = 18;
  const wardD = k.d - 8;
  const aTop = k.block(-k.w / 4, podTop - 0.55, 0, wardW, wardD, 5, 3.7, whiteMat, windowMat);
  k.block(k.w / 4, podTop - 0.55, 0, wardW, wardD, 5, 3.7, whiteMat, windowMat);
  k.block(0, podTop - 0.55, 0, k.w / 2 - wardW, 13, 4, 3.7, wallAltMat, windowMat);
  // Helipad with ring and H.
  k.cyl(k.w / 4, aTop, 0, 8.5, 0.5, roofDarkMat);
  k.cyl(k.w / 4, aTop + 0.5, 0, 7.2, 0.16, whiteMat);
  k.box(k.w / 4, aTop + 0.7, -2, 1.4, 0.1, 3.4, redMat);
  k.box(k.w / 4, aTop + 0.7, 2, 1.4, 0.1, 3.4, redMat);
  k.box(k.w / 4, aTop + 0.7, 0, 1.4, 0.1, 2, redMat);
  // Red cross sign and entrance canopy.
  k.box(0, podTop + 5, -k.d / 2 - 0.4, 5, 1.4, 0.4, redMat);
  k.box(0, podTop + 5.8, -k.d / 2 - 0.4, 1.4, 5, 0.4, redMat);
  k.entrance(0, 0, 22);
  k.box(0, 0, -k.d / 2 - 7, 34, 0.12, 12, pavingMat);
  k.box(-hw + 6, 0, -k.d / 2 - 7, 5, 3.6, 7, whiteMat);
  k.roofPlant(0, podTop + 18, 0, 24, 18, 52);
  return k;
}

/** Fire station: apparatus hall with bay doors, hose tower, forecourt. */
function fire(batch, spec, gnd) {
  const k = kit(batch, spec, gnd);
  const { hw, hd } = k;
  const hallD = k.d * 0.6;
  const hallZ = -hd + hallD / 2;
  k.box(0, 0, hallZ, k.w - 4, 8.5, hallD, plasterMat);
  k.box(0, 8.5, hallZ, k.w - 3, 0.7, hallD + 0.7, roofMat);
  for (const bx of [-10, 0, 10]) {
    k.box(bx, 0, hallZ + hallD / 2 + 0.15, 7.4, 6, 0.35, darkMat);
    k.box(bx, 5.7, hallZ + hallD / 2 + 0.2, 8, 0.5, 0.5, redMat);
  }
  k.box(0, 0, hallZ + hallD / 2 + (k.d - hallD) / 2, k.w - 4, 0.16, k.d - hallD - 2, pavingMat);
  k.box(hw - 4, 0, -hd + 4.5, 5.5, 20, 5.5, wallAltMat);
  k.box(hw - 4, 20, -hd + 4.5, 6.2, 0.7, 6.2, roofMat);
  k.box(hw - 4, 15, -hd + 4.5, 6.4, 2.2, 6.4, windowMat);
  k.roofPlant(-hw + 10, 9, hallZ, 10, 8, 61);
  return k;
}

/** Hotel: podium, rooftop pool deck, finned room tower, porte-cochère. */
function hotel(batch, spec, gnd) {
  const k = kit(batch, spec, gnd);
  const { hw } = k;
  k.box(0, 0, 0, k.w, 7, k.d, stoneMat);
  k.box(0, 0.4, 0, k.w + 0.3, 3.4, k.d + 0.3, windowMat);
  k.box(0, 7, 0, k.w + 0.6, 0.5, k.d + 0.6, roofMat);
  const tx = -hw + (k.w > 70 ? 24 : 18);
  const top = k.block(tx, 7.5, 0, 30, k.d * 0.72, 9, 3.4, whiteMat, windowMat);
  k.fins(tx, 7.5, 0, 8, 30, top - 7.5, 0, metalMat, -1);
  k.box(tx, top, 0, 26, 4.2, k.d * 0.6, windowMat);
  k.box(tx, top + 4.2, 0, 27, 0.5, k.d * 0.6 + 1, roofMat);
  // Pool deck on the podium roof.
  const poolX = hw - 18;
  k.box(poolX, 7.5, 0, 24, 0.3, k.d - 8, pavingMat);
  k.box(poolX, 7.8, 0, 18, 0.2, 9, waterMat);
  for (let i = 0; i < 4; i++) k.box(poolX - 8 + i * 5.4, 8, k.d / 2 - 4, 2.4, 0.5, 1.4, whiteMat);
  k.roofPlant(tx, top + 4.7, 0, 18, 12, 72);
  k.entrance(0, 0, 16);
  return k;
}

/** Guest house: staggered low wings under hipped roofs, verandas, garden. */
function guesthouse(batch, spec, gnd) {
  const k = kit(batch, spec, gnd);
  const wings = [
    { lx: -k.w / 4 + 1, lz: -4, w: k.w / 2 - 2, d: 14 },
    { lx: k.w / 4 - 1, lz: 6, w: k.w / 2 - 4, d: 14 },
  ];
  for (const wing of wings) {
    const top = k.block(wing.lx, 0, wing.lz, wing.w, wing.d, 3, 3.5, wallWarmMat, windowMat);
    k.hip(wing.lx, top, wing.lz, wing.w + 1.6, 4.4, wing.d + 1.6);
    for (const side of [-1, 1]) {
      k.box(wing.lx, 3.5, wing.lz + side * (wing.d / 2 + 1.4), wing.w * 0.9, 0.22, 2.6, roofMat);
      for (let i = 0; i < 5; i++) k.cyl(wing.lx - wing.w * 0.44 + (i * wing.w * 0.88) / 4, 0, wing.lz + side * (wing.d / 2 + 2.5), 0.22, 3.5, whiteMat);
    }
  }
  k.box(0, 0.02, 0, 12, 0.2, 26, pavingMat);
  k.box(k.w / 2 - 4, 0.02, -8, 10, 0.16, 14, lawnMat);
  k.roofPlant(0, 11, 0, 10, 6, 83);
  return k;
}

/** Food court: glazed pavilion under a floating roof, stalls, seating clusters. */
function foodcourt(batch, spec, gnd) {
  const k = kit(batch, spec, gnd);
  const { hw, hd } = k;
  k.box(0, 0, 0, k.w - 6, 0.35, k.d - 6, plazaMat);
  k.box(0, 0.35, 0, k.w - 10, 4.4, k.d - 10, windowMat);
  k.box(0, 4.75, 0, k.w - 2, 0.8, k.d - 2, roofMat);
  k.box(0, 5.55, 0, k.w * 0.6, 0.4, 4, windowMat);
  for (const x of [-hw + 1.6, 0, hw - 1.6]) for (const z of [-hd + 1.6, hd - 1.6]) k.cyl(x, 0, z, 0.4, 5, steelMat);
  // Stall counters and parasols.
  for (let i = 0; i < 5; i++) {
    const lx = -hw + 8 + i * ((k.w - 16) / 4);
    k.box(lx, 0.35, hd - 3, 5, 1.5, 2.4, wallAltMat);
    k.box(lx, 1.85, hd - 3, 5.4, 0.3, 2.8, copperMat);
  }
  for (let i = 0; i < 6; i++) {
    const lx = -hw + 10 + i * ((k.w - 20) / 5);
    k.cyl(lx, 0.35, -hd + 3, 1.6, 0.35, whiteMat);
    k.cyl(lx, 0.7, -hd + 3, 0.2, 1.2, steelMat);
  }
  k.roofPlant(0, 4.75, 0, 16, 8, 92);
  return k;
}

/** Market hall: two gabled sheds, colonnade, stall rows, clock tower. */
function market(batch, spec, gnd) {
  const k = kit(batch, spec, gnd);
  const { hw, hd } = k;
  for (const side of [-1, 1]) {
    const lz = side * (k.d / 4);
    const top = k.block(0, 0, lz, k.w - 10, k.d / 2 - 6, 2, 5, wallWarmMat, windowMat);
    k.gable(0, top, lz, k.w - 8, 5.2, k.d / 2 - 4);
  }
  k.box(0, 0, 0, 7, 6.4, k.d - 2, stoneMat);
  k.box(0, 6.4, 0, 8, 0.6, k.d, roofMat);
  // Stall rows under the colonnade.
  for (let i = 0; i < 6; i++) {
    for (const side of [-1, 1]) {
      k.box(-k.w / 2 + 8 + i * ((k.w - 16) / 5), 1.2, side * (k.d / 2 - 3), 3.4, 1.2, 2.2, i % 2 ? wallAltMat : wallWarmMat);
      k.box(-k.w / 2 + 8 + i * ((k.w - 16) / 5), 2.4, side * (k.d / 2 - 3), 4, 0.25, 2.8, copperMat);
    }
  }
  // Clock tower at the corner.
  k.box(hw - 10, 0, hd - 8, 7, 20, 7, stoneMat);
  k.box(hw - 10, 20, hd - 8, 8, 0.6, 8, roofMat);
  k.box(hw - 10, 22, hd - 8, 0.6, 2.6, 0.6, copperMat);
  k.box(hw - 10, 15, hd - 8 + 3.6, 3.4, 3.4, 0.2, whiteMat);
  k.box(0, 0, hd + 4, k.w, 0.14, 8, pavingMat);
  return k;
}

/** Metro / transit station: elevated platforms, canopy, ground concourse, stairs. */
function metro(batch, spec, gnd) {
  const k = kit(batch, spec, gnd);
  const { hw, hd } = k;
  const deck = 8.4;
  // Viaduct piers and two elevated platforms.
  for (let i = -3; i <= 3; i++) {
    k.box((i * (k.w - 20)) / 6, 0, 0, 2.6, deck, 4.4, stoneMat);
  }
  for (const side of [-1, 1]) {
    k.box(0, deck, side * 9, k.w, 0.8, 11, roofMat);
    k.box(0, deck + 0.8, side * 9, k.w, 0.35, 8, pavingMat);
    k.box(0, deck + 1.15, side * 9, k.w, 0.25, 0.5, whiteMat);
  }
  k.box(0, deck + 0.55, 0, k.w, 0.7, 7, darkMat);
  // Station hall and canopy.
  k.box(0, 0, hd - 5, k.w * 0.5, 6.4, 10, stoneMat);
  k.box(0, 0.4, hd - 5, k.w * 0.5 - 4, 3.4, 8, windowMat);
  k.box(0, deck + 6.4, 0, k.w * 0.7, 0.55, 26, roofMat);
  for (let i = -4; i <= 4; i++) k.cyl((i * k.w * 0.7) / 9, deck + 0.8, -13, 0.4, 5.6, steelMat);
  for (let i = -4; i <= 4; i++) k.cyl((i * k.w * 0.7) / 9, deck + 0.8, 13, 0.4, 5.6, steelMat);
  // Stairs and lifts down.
  for (const side of [-1, 1]) {
    k.box(side * (k.w / 2 - 10), 0, 0, 4.4, deck, 20, stoneMat);
    k.box(side * (k.w / 2 - 10), 0, hd - 12, 5, 3.6, 6, windowMat);
  }
  k.box(0, 0, hd + 6, k.w * 0.8, 0.15, 14, plazaMat);
  k.roofPlant(0, deck + 6.4, 0, 14, 8, 99);
  return k;
}

/** Multi-storey car park: open decks, perimeter spandrels, ramps, stair core. */
function parking(batch, spec, gnd) {
  const k = kit(batch, spec, gnd);
  const { hw, hd } = k;
  const levels = 5;
  for (let l = 0; l < levels; l++) {
    const y = l * 3.1;
    k.box(0, y, 0, k.w, 0.4, k.d, roofMat);
    // Perimeter spandrels, open in the middle.
    k.box(0, y + 0.4, -hd + 0.3, k.w, 1.1, 0.6, whiteMat);
    k.box(0, y + 0.4, hd - 0.3, k.w, 1.1, 0.6, whiteMat);
    k.box(-hw + 0.3, y + 0.4, 0, 0.6, 1.1, k.d, whiteMat);
    k.box(hw - 0.3, y + 0.4, 0, 0.6, 1.1, k.d, whiteMat);
    if (l < levels - 1) {
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.cyl(sx * (hw - 2.5), y, sz * (hd - 2.5), 0.7, 3.1, stoneMat);
      for (let i = -2; i <= 2; i++) k.cyl(i * (k.w / 6), y, 0, 0.55, 3.1, stoneMat);
    }
  }
  // Vertical green fins on the long faces.
  for (let i = -5; i <= 5; i++) {
    k.box((i * (k.w - 4)) / 10, 0, -hd - 0.5, 1, levels * 3.1, 0.7, greenMat);
  }
  k.box(-hw + 5, 0, hd - 6, 8, levels * 3.1 + 2.6, 8, stoneMat);
  k.box(0, 0, hd + 3, k.w * 0.6, 0.2, 8, pavingMat);
  return k;
}

/** Sports complex: stadium bowl, tiers, canopy, floodlights, pitch and running track. */
function stadium(batch, spec, gnd) {
  const k = kit(batch, spec, gnd);
  const rx = k.w / 2 - 6;
  const rz = k.d / 2 - 6;
  k.cyl(0, 0.02, 0, rx - 14, 0.3, lawnMat);
  k.cyl(0, 0.32, 0, rx - 8, 0.35, mat(0xb4693a, { roughness: 0.95 }));
  // Three stepped seating rings.
  const rings = [
    { r: 0.72, y: 1.2, h: 2.4, mat: plazaMat },
    { r: 0.84, y: 3.6, h: 2.8, mat: whiteMat },
    { r: 0.96, y: 6.4, h: 3.2, mat: plazaMat },
  ];
  for (const ring of rings) {
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      const px = Math.cos(a) * rx * ring.r;
      const pz = Math.sin(a) * rz * ring.r;
      const rotY = Math.atan2(-Math.sin(a) * rx, Math.cos(a) * rz);
      k.box(px, ring.y, pz, 7.5, ring.h, (Math.PI * (rx + rz)) / 48 + 1.5, ring.mat, rotY);
    }
  }
  // Roof canopy over the west/north stand.
  for (let i = 0; i < 18; i++) {
    const a = -Math.PI * 0.15 + (i / 18) * Math.PI * 0.85;
    const px = Math.cos(a) * rx * 1.02;
    const pz = Math.sin(a) * rz * 1.02;
    const rotY = Math.atan2(-Math.sin(a) * rx, Math.cos(a) * rz);
    k.box(px, 13.2, pz, 10, 0.5, (Math.PI * (rx + rz)) / 26, roofMat, rotY);
  }
  // Floodlight masts.
  for (const [sx, sz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
    k.cyl(sx * rx * 0.96, 0, sz * rz * 0.96, 0.8, 26, steelMat);
    k.box(sx * rx * 0.96, 26, sz * rz * 0.96, 7, 2.2, 2, lampMat);
  }
  // Concourse, gates and scoreboard.
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    k.box(Math.cos(a) * rx * 1.05, 0, Math.sin(a) * rz * 1.05, 12, 4.2, 6, stoneMat, -a);
  }
  k.box(0, 0, -rz * 0.36, 42, 0.14, 10, pavingMat);
  k.box(0, 16, -rz * 0.2, 26, 8, 1.2, darkMat);
  k.box(0, 16, -rz * 0.2 - 0.7, 23, 6.4, 0.2, windowMat);
  return k;
}

/** Sawtooth industrial shed with side office and loading yard. */
function shed(batch, spec, gnd, index = 0) {
  const k = kit(batch, spec, gnd);
  const { hw, hd } = k;
  const h = 8 + ((index * 3) % 4);
  const bodyD = k.d * 0.66;
  k.box(0, 0, -k.d * 0.08, k.w, h, bodyD, plasterMat);
  const teeth = Math.max(3, Math.round(k.w / 14));
  const tw = k.w / teeth;
  for (let i = 0; i < teeth; i++) {
    k.drop("tooth", metalMat, -hw + tw * (i + 0.5), h, -k.d * 0.08, tw, 3.4, bodyD);
  }
  k.box(0, h, -k.d * 0.08, k.w + 0.6, 0.6, bodyD + 0.6, roofMat);
  // Dock doors.
  for (let i = 0; i < 4; i++) {
    k.box(-hw + 10 + i * ((k.w - 20) / 3), 0, hd - 3, 6, 5.2, 0.5, darkMat);
  }
  k.box(0, 0, hd - 1.4, k.w, 0.18, 5, pavingMat);
  const officeTop = k.block(hw - 10, 0, -hd + 8, 16, 12, 2, 4, wallAltMat, windowMat);
  k.roofPlant(hw - 10, officeTop, -hd + 8, 10, 6, 111 + index);
  return k;
}

/** Logistics warehouse: long gabled shed, dock canopy, container/trailer yard. */
function warehouse(batch, spec, gnd, index = 0) {
  const k = kit(batch, spec, gnd);
  const { hw, hd } = k;
  const h = 9 + ((index * 2) % 3);
  const bodyD = k.d * 0.68;
  const z0 = -k.d * 0.1;
  k.box(0, 0, z0, k.w, h, bodyD, plasterMat);
  k.gable(0, h, z0, k.w + 0.8, 3.2, bodyD + 0.8, roofMat);
  k.box(0, h * 0.55, z0 - bodyD / 2, k.w * 0.5, h * 0.4, 0.4, windowMat);
  k.box(0, 7.2, z0 + bodyD / 2 + 2, k.w * 0.86, 0.4, 4, roofMat);
  for (let i = 0; i < 5; i++) k.box(-hw + 8 + i * ((k.w - 16) / 4), 0, z0 + bodyD / 2 + 1.5, 4.2, 4.2, 0.5, darkMat);
  for (let i = 0; i < 3; i++) k.cyl(-hw + 18 + i * ((k.w - 36) / 2), 0, z0 + bodyD / 2 + 3, 0.4, 6, steelMat);
  k.box(0, 0, hd - 4, k.w, 0.14, 10, pavingMat);
  return k;
}

/** Semiconductor fab campus: cleanroom with rooftop air handlers, CUB cooling towers, offices, tanks. */
function fab(batch, spec, gnd) {
  const k = kit(batch, spec, gnd);
  const { hw, hd } = k;
  const fx = -40;
  const fz = -12;
  const fw = Math.min(k.w - 100, 240);
  const fd = Math.min(k.d - 60, 150);
  k.box(fx, 0, fz, fw, 24, fd, plasterMat);
  k.box(fx, 7, fz, fw + 0.4, 1.4, fd + 0.4, windowMat);
  k.box(fx, 24, fz, fw + 1.2, 0.9, fd + 1.2, roofMat);
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 4; j++) {
      k.box(fx - fw / 2 + 16 + (i * (fw - 32)) / 5, 24.9, fz - fd / 2 + 16 + (j * (fd - 32)) / 3, 16, 4.5, 12, metalMat);
    }
  }
  for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) k.cyl(fx + sx * (fw / 2 + 10 + i * 12), 24, fz - fd / 2 + 10, 2.2, 20, steelMat);
  // Central utility building with cooling towers.
  const cx = hw - 60;
  const cz = -hd + 70;
  const cubTop = k.block(cx, 0, cz, 90, 70, 4, 4.5, wallAltMat, windowMat);
  for (let i = 0; i < 4; i++) {
    k.box(cx - 33 + i * 22, cubTop, cz + 12, 18, 6, 18, metalMat);
    k.cyl(cx - 33 + i * 22, cubTop + 6, cz + 12, 6.5, 1.6, roofMat);
  }
  // Office block and bridge.
  const ox = hw - 60;
  const oz = hd - 40;
  k.block(ox, 0, oz, 90, 38, 5, 4.2, plasterMat, windowMat);
  k.box(fx + fw / 2 + 7, 12, oz - 20, 15, 5, 8, windowMat);
  // Bulk gas / water tanks.
  for (let i = 0; i < 5; i++) k.cyl(-hw + 22, 0, -hd + 24 + i * 24, 4.5, 16, metalMat);
  for (const z of [-40, -12]) k.cyl(hw - 14, 0, z, 9, 12, metalMat);
  k.box(-20, 0.02, hd - 12, k.w - 40, 0.18, 16, lawnMat);
  k.box(0, 0.02, hd - 12, 20, 0.2, 8, pavingMat);
  return k;
}

/** 220 kV substation: control building, transformers, gantries, lightning masts. */
function substation(batch, spec, gnd) {
  const k = kit(batch, spec, gnd);
  const { hw, hd } = k;
  k.box(0, 0.01, 0, k.w, 0.12, k.d, pavingMat);
  k.box(-hw + 10, 0, -hd + 9, 18, 7, 15, plasterMat);
  k.box(-hw + 10, 7, -hd + 9, 18.6, 0.6, 15.6, roofMat);
  for (const x of [-8, 10, 26]) {
    k.box(x, 0, 6, 9, 6.5, 7, metalMat);
    k.cyl(x, 0, 6, 1.2, 8, steelMat);
  }
  for (const x of [-14, 4, 22]) {
    for (const z of [-hd + 5, hd - 5]) k.box(x, 0, z, 0.9, 15, 0.9, steelMat);
    k.box(x, 14, 0, 0.9, 0.9, k.d - 10, steelMat);
    for (let i = -3; i <= 3; i++) k.box(x, 13.4, (i * (k.d - 12)) / 6, 0.5, 1.8, 0.5, whiteMat);
  }
  for (const [sx, sz] of [[-1, -1], [1, 1]]) k.cyl(sx * (hw - 6), 0, sz * (hd - 6), 0.5, 22, steelMat);
  return k;
}

/** Water / sewage / effluent process plant: basins, clarifiers, tanks, control block. */
function processPlant(batch, spec, gnd, index = 0) {
  const k = kit(batch, spec, gnd);
  const { hw, hd } = k;
  k.box(0, 0.01, 0, k.w, 0.12, k.d, pavingMat);
  // Rectangular process basins.
  for (let i = 0; i < 4; i++) {
    const bx = -hw + 12 + (i % 2) * (k.w * 0.34);
    const bz = -hd + 12 + Math.floor(i / 2) * (k.d * 0.36);
    const bw = k.w * 0.22;
    const bd = k.d * 0.2;
    k.box(bx, 0, bz, bw, 1.6, bd, stoneMat);
    k.box(bx, 1.6, bz, bw - 2, 0.2, bd - 2, waterMat);
    for (let r = 0; r < 3; r++) k.box(bx, 1.8, bz - bd / 2 + 3 + r * ((bd - 6) / 2), bw - 3, 0.12, 0.4, steelMat);
  }
  // Circular clarifiers.
  for (let i = 0; i < 2; i++) {
    const cx = hw - 22;
    const cz = -hd + 22 + i * 30;
    k.cyl(cx, 0, cz, 12, 1.4, stoneMat);
    k.cyl(cx, 1.4, cz, 10.6, 0.2, waterMat);
    k.cyl(cx, 1.6, cz, 1.2, 4, metalMat);
    k.box(cx, 5.4, cz, 21, 0.3, 0.6, steelMat);
  }
  // Control block, pump house, pipe racks, elevated tank.
  k.block(hw - 24, 0, hd - 18, 34, 14, 2, 4, plasterMat, windowMat);
  k.box(-hw + 18, 0, hd - 12, 26, 6, 12, wallAltMat);
  for (let i = 0; i < 3; i++) k.cyl(-hw + 12 + i * 8, 0, 0, 1.4, 3.2, metalMat);
  for (let i = 0; i < 4; i++) k.box(-hw + 6 + i * 5, 2.4, hd - 6, 0.5, 0.5, k.d * 0.5, steelMat);
  const tankX = -hw + 14;
  const tankZ = -hd + 10;
  for (const a of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) k.cyl(tankX + Math.cos(a) * 5, 0, tankZ + Math.sin(a) * 5, 0.6, 14, steelMat);
  k.cyl(tankX, 12, tankZ, 7.5, 6, whiteMat);
  k.cyl(tankX, 18, tankZ, 7.8, 0.5, roofMat);
  void index;
  return k;
}

/** Elevated service reservoir: tank on pillars with a maintenance stair and valve house. */
function esr(batch, spec, gnd) {
  const k = kit(batch, spec, gnd);
  const r = Math.max(5, Math.min(spec.w, spec.d) / 2 - 1);
  const h = spec.h || 22;
  const top = h * 0.72;
  for (const a of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
    k.cyl(Math.cos(a) * r * 0.6, 0, Math.sin(a) * r * 0.6, 0.7, top, steelMat);
  }
  k.cyl(0, top, 0, r, 0.6, roofMat);
  k.cyl(0, top + 0.6, 0, r, h * 0.24, whiteMat);
  k.cyl(0, h - 2.2, 0, r + 0.4, 1.4, roofMat);
  k.cyl(0, h - 0.8, 0, r * 0.5, 0.8, metalMat);
  k.box(0, 0, 0, r * 1.4, 3, r * 1.4, stoneMat);
  return k;
}

/** Tech campus: low glass office bars around a green, atrium, plaza, parking edge. */
function techCampus(batch, spec, gnd) {
  const k = kit(batch, spec, gnd);
  const { hw, hd } = k;
  const bar = 16;
  const nTop = k.block(0, 0, -hd + bar / 2, k.w, bar, 4, 4, plasterMat, windowMat);
  k.block(-hw + bar / 2, 0, 0, bar, k.d - bar * 2, 4, 4, wallAltMat, windowMat);
  k.block(hw - bar / 2, 0, 0, bar, k.d - bar * 2, 3, 4, wallAltMat, windowMat);
  k.box(0, 0.02, 0, k.w - bar * 2 - 6, 0.2, k.d - bar * 2 - 6, lawnMat);
  k.box(0, 0.24, 0, 6, 0.1, k.d - bar * 2 - 10, pavingMat);
  k.cyl(0, 0.24, 0, 4, 1.4, waterMat);
  // Glazed atrium and entrance.
  k.box(0, 0, -hd + bar + 4, 26, 16, 20, windowMat);
  k.box(0, 16, -hd + bar + 4, 28, 0.6, 22, roofMat);
  k.box(0, 0.02, -hd + bar + 16, 30, 0.2, 10, plazaMat);
  k.roofPlant(0, nTop, -hd + bar / 2, k.w * 0.5, 6, 121);
  return k;
}

/** Convention centre: long banner hall, barrel roof, glazed foyer, plaza, pylon sign. */
function convention(batch, spec, gnd) {
  const k = kit(batch, spec, gnd);
  const { hw, hd } = k;
  const hallW = k.w * 0.72;
  k.box(-k.w * 0.12, 0, 0, hallW, 16, k.d * 0.8, plasterMat);
  // Stepped barrel roof.
  for (let i = 0; i < 5; i++) {
    const w = hallW - i * (hallW / 7);
    k.box(-k.w * 0.12, 16 + i * 2.2, 0, w, 2.2, k.d * 0.8 - i * 5, roofMat);
  }
  // Glazed foyer and canopy.
  k.box(k.w * 0.3, 0, 0, k.w * 0.22, 14, k.d * 0.7, windowMat);
  k.box(k.w * 0.3, 14, 0, k.w * 0.24, 0.6, k.d * 0.74, roofMat);
  k.box(k.w * 0.3, 6, -k.d * 0.4, k.w * 0.2, 0.5, 10, copperMat);
  // Plaza and pylon.
  k.box(0, 0.02, hd + 8, k.w, 0.2, 16, plazaMat);
  k.box(hw - 6, 0, hd + 12, 2, 18, 2, steelMat);
  k.box(hw - 6, 15, hd + 12, 12, 4, 0.5, copperMat);
  for (let i = 0; i < 5; i++) k.cyl(-hw + 16 + i * ((k.w - 32) / 4), 0.2, hd + 12, 0.15, 8, steelMat);
  return k;
}

/* ------------------------------------------------------------------------------------ */
/* Archetype registry                                                                    */
/* ------------------------------------------------------------------------------------ */

/** type name -> builder(batch, spec, ground). All makers fit the SPEC footprint. */
export const archetypes = {
  cioc,
  spv,
  cityhall,
  highstreet,
  retail,
  apartment,
  midrise,
  school,
  schoolSmall,
  clinic,
  hospital,
  fire,
  hotel,
  guesthouse,
  foodcourt,
  market,
  marketSmall,
  metro,
  parking,
  stadium,
  shed,
  warehouse,
  fab,
  substation,
  processPlant,
  esr,
  techCampus,
  convention,
  officeTower,
};

const alias = {
  stp: "processPlant",
  cetp: "processPlant",
  wtp: "processPlant",
  industrial: "shed",
  logistics: "warehouse",
  tech: "techCampus",
  "residential-blocks": "apartment",
  semicon: "fab",
  "sub-getco": "substation",
};

/** Build one archetype into a batch. Returns the builder kit (or null). */
export function addArchetype(batch, type, spec, gnd, index = 0) {
  const name = archetypes[type] ? type : alias[type];
  const build = archetypes[name];
  if (!build) return null;
  return build(batch, spec, gnd, index);
}

export function hasArchetype(type) {
  return Boolean(archetypes[type] || alias[type]);
}

/** Tags each built mesh of the last batch output with `id` (picking support). */
export function buildArchetype(batch, parent, id) {
  return batch.build(parent, id);
}

/** Keep the old planned-shape entry point working for any stale import. */
export function plannedShape(id, spec, gnd, index = 0) {
  const batch = createBatch();
  const type = id in archetypes ? id : alias[id];
  if (!type) return null;
  addArchetype(batch, type, spec, gnd, index);
  const group = new THREE.Group();
  group.position.set(0, 0, 0);
  batch.build(group, id);
  return tag(group, id);
}

/* ------------------------------------------------------------------------------------ */
/* Prefabs for the district: compiled once, instanced thousands of times                */
/* ------------------------------------------------------------------------------------ */

export const prefabSpecs = {
  towerA: { type: "officeTower", w: 44, d: 32 },
  towerB: { type: "officeTower", w: 56, d: 34 },
  apartmentA: { type: "apartment", w: 62, d: 20 },
  midriseA: { type: "midrise", w: 50, d: 44 },
  retailA: { type: "retail", w: 52, d: 30 },
  shedA: { type: "shed", w: 64, d: 42 },
  warehouseA: { type: "warehouse", w: 76, d: 44 },
  schoolA: { type: "schoolSmall", w: 46, d: 34 },
  clinicA: { type: "clinic", w: 30, d: 22 },
  marketA: { type: "marketSmall", w: 38, d: 28 },
  techA: { type: "techCampus", w: 70, d: 56 },
  hotelA: { type: "hotel", w: 72, d: 40 },
};

/** Office tower prefab: podium + shaft (variant by spec/index). */
function officeTower(batch, spec, gnd, index = 0) {
  const k = kit(batch, spec, gnd);
  const podH = 4;
  const podTop = k.block(0, 0, 0, k.w, k.d, 3, 4.4, index % 2 ? wallAltMat : plasterMat, windowMat);
  const tw = Math.min(k.w, k.d) * 0.56;
  const floors = 7 + ((index * 5) % 9);
  const tx = (index % 3 === 0 ? 0 : 1) * (k.w * 0.12);
  const top = k.block(tx, podTop - 0.4, 0, tw, tw * 0.82, floors, 3.6, index % 2 ? wallMat : plasterMat, windowMat);
  k.box(tx, top, 0, tw * 0.9, 1, tw * 0.74, roofMat);
  k.cyl(tx, top + 1, 0, 0.35, 7, steelMat);
  k.roofPlant(tx, top + 1, 0, tw * 0.5, tw * 0.4, 130 + index);
  k.entrance(0, 0, Math.min(16, k.w * 0.4));
  void podH;
  return k;
}

/** Small clinic prefab: waiting hall, two consulting wings, ramp. */
function clinic(batch, spec, gnd) {
  const k = kit(batch, spec, gnd);
  k.block(0, 0, 0, k.w, k.d * 0.7, 2, 4, whiteMat, windowMat);
  k.block(-k.w * 0.3, 0, k.d * 0.28, k.w * 0.36, k.d * 0.4, 2, 4, plasterMat, windowMat);
  k.box(0, 5.8, -k.d * 0.35, 4, 1.2, 0.3, redMat);
  k.box(0, 6.4, -k.d * 0.35, 1.2, 4, 0.3, redMat);
  k.box(0, 0.02, k.d * 0.5 + 2, k.w * 0.5, 0.16, 5, pavingMat);
  k.roofPlant(0, 5.8, 0, 8, 6, 140);
  return k;
}

/** Neighbourhood market prefab: one gabled hall with stall canopy. */
function marketSmall(batch, spec, gnd) {
  const k = kit(batch, spec, gnd);
  const top = k.block(0, 0, -k.d * 0.12, k.w, k.d * 0.62, 2, 4.2, wallWarmMat, windowMat);
  k.gable(0, top, -k.d * 0.12, k.w + 0.8, 4, k.d * 0.66);
  k.box(0, 0.02, k.d * 0.35, k.w, 0.14, 5, pavingMat);
  for (let i = 0; i < 4; i++) {
    k.box(-k.w / 2 + 7 + i * ((k.w - 14) / 3), 1.2, k.d * 0.3, 3, 1.2, 2, i % 2 ? copperMat : wallAltMat);
  }
  return k;
}

/** Compile a prefab into parts (one merged geometry per material, local origin at base centre). */
export function compilePrefab(name) {
  const spec = prefabSpecs[name];
  if (!spec) return null;
  const batch = createBatch();
  addArchetype(batch, spec.type, { x: 0, z: 0, w: spec.w, d: spec.d, h: 20 }, 0, prefabVariant(name));
  const raw = batch.finish();
  // Collapse every wall-like part into one white material so instances can be tinted per building.
  const tintable = new Set([wallMat, wallAltMat, wallWarmMat, plasterMat, whiteMat, stoneMat, wallDarkMat]);
  const bodyGeos = [];
  const parts = [];
  for (const part of raw) {
    if (tintable.has(part.material)) bodyGeos.push(part.geometry);
    else parts.push(part);
  }
  if (bodyGeos.length) {
    const geometry = bodyGeos.length === 1 ? bodyGeos[0] : mergeGeometries(bodyGeos, false);
    if (geometry) {
      geometry.computeBoundingSphere();
      parts.unshift({ geometry, material: bodyTintMat, tint: true });
    }
  }
  return parts;
}

function prefabVariant(name) {
  const variants = { towerA: 0, towerB: 1, apartmentA: 0, midriseA: 0, retailA: 0, shedA: 0, warehouseA: 0, schoolA: 0, clinicA: 0, marketA: 0, techA: 0, hotelA: 0 };
  return variants[name] ?? 0;
}

/* ------------------------------------------------------------------------------------ */
/* Bulk prefabs: low-poly types for the whole town-planning area (thousands of instances) */
/* ------------------------------------------------------------------------------------ */

const simpleSpecs = {
  house: { w: 18, d: 14 },
  shopRow: { w: 34, d: 18 },
  slab: { w: 34, d: 15 },
  tower: { w: 22, d: 22 },
  shed: { w: 42, d: 28 },
  campus: { w: 40, d: 30 },
};

/** Collapse wall-like parts into one white material so instances carry a per-building colour. */
function collapseBody(raw) {
  const tintable = new Set([wallMat, wallAltMat, wallWarmMat, plasterMat, whiteMat, stoneMat, wallDarkMat]);
  const bodyGeos = [];
  const parts = [];
  for (const part of raw) {
    if (tintable.has(part.material)) bodyGeos.push(part.geometry);
    else parts.push(part);
  }
  if (bodyGeos.length) {
    const geometry = bodyGeos.length === 1 ? bodyGeos[0] : mergeGeometries(bodyGeos, false);
    if (geometry) {
      geometry.computeBoundingSphere();
      parts.unshift({ geometry, material: bodyTintMat, tint: true });
    }
  }
  return parts;
}

/** Compile one of the bulk low-poly types. ~40–90 triangles each. */
export function compileSimplePrefab(name) {
  const spec = simpleSpecs[name];
  if (!spec) return null;
  const batch = createBatch();
  const w = spec.w;
  const d = spec.d;
  const box = (material, x, y, z, sx, sy, sz, rotY = 0) => batch.box(material, x, y, z, sx, sy, sz, rotY);
  const rnd = makeRng(name.length * 977 + name.charCodeAt(0));
  if (name === "house") {
    const h = 4.6 + rnd() * 1.4;
    box(wallWarmMat, 0, 0, 0, w, h, d);
    batch.add("gable", roofMat, 0, h, 0, w + 1, 2.6, d + 1);
    box(windowMat, 0, h * 0.42, d / 2 + 0.15, w * 0.5, h * 0.32, 0.2);
    box(plazaMat, 0, 0, d / 2 + 2, w * 0.6, 0.35, 3.5);
    box(metalMat, w * 0.3, h + 1.6, -d * 0.2, 1, 1.6, 1);
  } else if (name === "shopRow") {
    const floors = 2;
    box(wallAltMat, 0, 0, 0, w, floors * 4.2, d);
    for (let f = 0; f < floors; f++) box(windowMat, 0, 0.6 + f * 4.2, 0, w + 0.25, 2.6, d + 0.25);
    box(roofMat, 0, floors * 4.2, 0, w + 0.6, 0.5, d + 0.6);
    box(copperMat, 0, 3.6, d / 2 + 1.2, w * 0.9, 0.3, 2.6);
    box(lampMat, 0, 6.2, d / 2 + 0.3, w * 0.5, 1, 0.25);
  } else if (name === "slab") {
    const floors = 6 + Math.floor(rnd() * 4);
    const h = floors * 3.2;
    box(plasterMat, 0, 0, 0, w, h, d);
    for (let f = 1; f < floors; f += 2) box(windowMat, 0, f * 3.2, 0, w + 0.3, 1.5, d + 0.3);
    box(roofMat, 0, h, 0, w + 0.6, 0.5, d + 0.6);
    box(whiteMat, w * 0.2, h + 0.5, 0, 3, 2.6, 3);
    box(metalMat, -w * 0.3, h + 0.5, 0, 0.4, 6, 0.4);
  } else if (name === "tower") {
    const floors = 12 + Math.floor(rnd() * 8);
    const h = floors * 3.5;
    box(plasterMat, 0, 0, 0, w, 8, d);
    box(windowMat, 0, 0.6, 0, w + 0.3, 3.4, d + 0.3);
    box(roofMat, 0, 8, 0, w + 0.5, 0.5, d + 0.5);
    box(wallMat, 0, 8.5, 0, w * 0.72, h, d * 0.72);
    for (let f = 3; f < floors; f += 3) box(windowMat, 0, 8.5 + f * 3.5, 0, w * 0.72 + 0.3, 1.6, d * 0.72 + 0.3);
    box(roofMat, 0, 8.5 + h, 0, w * 0.78, 0.6, d * 0.78);
    box(metalMat, 0, 8.5 + h + 0.6, 0, w * 0.4, 3.4, d * 0.4);
  } else if (name === "shed") {
    const h = 7 + rnd() * 3;
    box(plasterMat, 0, 0, 0, w, h, d);
    const teeth = 4;
    for (let i = 0; i < teeth; i++) batch.add("tooth", metalMat, -w / 2 + (w / teeth) * (i + 0.5), h, 0, w / teeth, 2.6, d);
    box(roofMat, 0, h, 0, w + 0.5, 0.5, d + 0.5);
    box(darkMat, 0, 0, d / 2, w * 0.28, 4.4, 0.4);
    box(plazaMat, 0, 0, d / 2 + 3, w, 0.3, 6);
  } else if (name === "campus") {
    box(plasterMat, 0, 0, -d / 4, w, 12, d * 0.4);
    for (let f = 0; f < 3; f++) box(windowMat, 0, 0.8 + f * 4, -d / 4, w + 0.3, 2.2, d * 0.4 + 0.3);
    box(wallAltMat, -w / 4, 0, d / 4, w * 0.44, 8, d * 0.38);
    box(greenMat, w * 0.2, 0.05, d / 4, w * 0.4, 0.2, d * 0.36);
    box(roofMat, 0, 12, -d / 4, w + 0.5, 0.5, d * 0.42);
    box(metalMat, w * 0.3, 12.5, -d / 4, 2.4, 3, 2.4);
  }
  const parts = collapseBody(batch.finish());
  // Give the bulk types a slightly different window/roof balance to read as distinct families.
  for (const part of parts) {
    if (part.material === windowMat) part.tint = false;
  }
  return parts;
}

export const simplePrefabSpecs = simpleSpecs;

/* ------------------------------------------------------------------------------------ */
/* Future grain (kept for src/world/future.js)                                          */
/* ------------------------------------------------------------------------------------ */

const grainBody = wallDarkMat;

/**
 * Collects parts across many buildings, then emits one InstancedMesh per geometry and material.
 * Each building has a centre, a yaw, and parts given in its local frame.
 */
export function createGrain() {
  const buckets = new Map();
  const dummy = new THREE.Object3D();

  function add(geo, material, b, ox, oy, oz, w, h, d) {
    const key = `${geo.uuid}:${material.uuid}`;
    if (!buckets.has(key)) buckets.set(key, { geo, material, matrices: [] });
    const c = Math.cos(b.yaw);
    const s = Math.sin(b.yaw);
    dummy.position.set(b.x + ox * c + oz * s, b.y + oy, b.z - ox * s + oz * c);
    dummy.rotation.set(0, b.yaw, 0);
    dummy.scale.set(w, h, d);
    dummy.updateMatrix();
    buckets.get(key).matrices.push(dummy.matrix.clone());
  }

  const box = (b, ox, oy, oz, w, h, d, material = grainBody) => add(UNIT.box, material, b, ox, oy, oz, w, h, d);
  const glass = paint.window;

  const types = {
    tower(b, rnd) {
      const pod = 6 + rnd() * 3;
      box(b, 0, 0, 0, b.w, pod, b.d);
      box(b, 0, pod, 0, b.w + 0.6, 0.5, b.d + 0.6, roofMat);
      const side = Math.min(b.w, b.d) * (0.42 + rnd() * 0.12);
      const h = 34 + rnd() * 46;
      box(b, b.w * 0.15, pod, 0, side, h, side, windowMat);
      box(b, b.w * 0.15, pod + h, 0, side * 0.82, 3.5, side * 0.82, roofMat);
    },
    slabs(b, rnd) {
      const h = 15 + rnd() * 15;
      const depth = Math.max(10, b.d * 0.28);
      for (const side of [-1, 1]) {
        const hh = side > 0 ? h : h * (0.75 + rnd() * 0.25);
        box(b, 0, 0, side * (b.d / 2 - depth / 2), b.w * 0.92, hh, depth);
        box(b, 0, hh, side * (b.d / 2 - depth / 2), b.w * 0.92 + 0.6, 0.5, depth + 0.6, roofMat);
        for (let f = 2; f < hh / 3.4; f += 2) box(b, 0, f * 3.4, side * (b.d / 2 - depth / 2), b.w * 0.92 + 0.3, 1.4, depth + 0.3, windowMat);
      }
      box(b, 0, 0, 0, b.w * 0.8, 0.2, b.d - depth * 2 - 4, greenMat);
    },
    shed(b, rnd) {
      const h = 8 + rnd() * 5;
      box(b, 0, 0, 0, b.w, h, b.d);
      const teeth = Math.max(3, Math.round(b.w / 11));
      const tw = b.w / teeth;
      for (let i = 0; i < teeth; i++) add(UNIT.tooth, metalMat, b, -b.w / 2 + tw * (i + 0.5), h, 0, tw, 3.2, b.d);
    },
    warehouse(b, rnd) {
      const h = 9 + rnd() * 4;
      const d = b.d * 0.72;
      box(b, 0, 0, -b.d * 0.12, b.w, h, d);
      add(UNIT.gable, roofMat, b, 0, h, -b.d * 0.12, b.w + 0.8, 2.6, d + 0.8);
      box(b, 0, 0, b.d / 2 - b.d * 0.12, b.w, 0.15, b.d * 0.22, plazaMat);
    },
    campus(b, rnd) {
      const h = 8 + rnd() * 7;
      const t = Math.max(10, Math.min(b.w, b.d) * 0.3);
      box(b, 0, 0, -b.d / 2 + t / 2, b.w, h, t);
      box(b, -b.w / 2 + t / 2, 0, t / 2, t, h * 0.8, b.d - t);
      box(b, 0, h, -b.d / 2 + t / 2, b.w + 0.5, 0.4, t + 0.5, roofMat);
      box(b, t / 2, 0, t / 2, b.w - t - 4, 0.2, b.d - t - 4, greenMat);
    },
    houses(b, rnd) {
      const hw = b.w / 4;
      const hd = b.d / 4;
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          const w = hw * 1.3;
          const d = hd * 1.3;
          const h = 6 + rnd() * 3;
          box(b, sx * hw, 0, sz * hd, w, h, d);
          add(UNIT.gable, roofMat, b, sx * hw, h, sz * hd, w + 0.8, 2.8, d + 0.8);
        }
      }
    },
  };

  const mixes = {
    phase1: [["tower", 0.2], ["slabs", 0.3], ["campus", 0.15], ["shed", 0.25], ["warehouse", 0.1]],
    later: [["shed", 0.4], ["warehouse", 0.25], ["houses", 0.25], ["slabs", 0.1]],
  };

  function pick(mix, r) {
    let acc = 0;
    for (const [type, weight] of mix) {
      acc += weight;
      if (r < acc) return type;
    }
    return mix[mix.length - 1][0];
  }

  return {
    place(spot, y, phase1, rnd) {
      const type = pick(phase1 ? mixes.phase1 : mixes.later, rnd());
      const b = { ...spot, y, yaw: rnd() < 0.5 ? 0 : Math.PI / 2 };
      types[type](b, rnd);
      return type;
    },
    build(id) {
      const meshes = [];
      for (const { geo, material, matrices } of buckets.values()) {
        const mesh = new THREE.InstancedMesh(geo, material, matrices.length);
        matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
        mesh.instanceMatrix.needsUpdate = true;
        mesh.computeBoundingSphere();
        tag(mesh, id);
        meshes.push(mesh);
      }
      return meshes;
    },
  };
}


