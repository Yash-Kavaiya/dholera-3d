import * as THREE from "three";
import { layout } from "../geo/layout.js";
import { facts } from "../content/city.js";
import {
  paint,
  mat,
  lampMat,
  windowMat,
  metalMat,
  steelMat,
  copperMat,
  greenMat,
  lawnMat,
  waterMat,
  plazaMat,
  pavingMat,
  asphaltMat,
  sidewalkMat,
  markingMat,
  medianMat,
  wallMat,
  foliageMat,
  barkMat,
} from "./materials.js";
import { createBatch, makeRng, streetStrip, instanceParts } from "./buildkit.js";
import { addArchetype, compilePrefab } from "./archetypes.js";
import { tag, addLabel } from "./meshkit.js";

/**
 * Activation Area (22.54 km²): the built trunk works plus a solid, detailed city fabric.
 * Everything here is solid geometry merged per material; nothing is a ghost volume.
 */

const GROUND = layout.ground;
const FLOOR_LABEL = 6;

export function buildActivation(groups, labels) {
  const aa = layout.activation;
  const rng = makeRng(20260815);
  const ctx = {
    aa,
    gnd: GROUND,
    groups,
    labels,
    colliders: [],
    exclusions: [],
    treeSpots: [],
    lampSpots: [],
    sites: [],
  };

  buildPad(ctx);
  buildZoneTints(ctx);
  buildRoads(ctx);
  buildCanal(ctx, rng);
  buildUtilities(ctx);
  buildPylons(ctx);
  buildSites(ctx);
  buildParks(ctx, rng);
  buildFabric(ctx, rng);
  buildStreetFurniture(ctx, rng);
  buildCanalDetails(ctx, rng);

  addLabel(labels, { id: "activation", text: "Activation Area", x: aa.cx, y: 46, z: aa.minZ + 260, tier: "zone" });
  addLabel(labels, { id: "aa-roads", text: "72 km of roads", x: aa.cx, y: 26, z: aa.minZ + 620, tier: "zone" });

  return {
    colliders: ctx.colliders,
    esrCount: layout.blocks.esrs.length,
    mbrCount: layout.blocks.mbrs.length,
    facts,
  };
}

/* ------------------------------------------------------------------ */

function buildPad(ctx) {
  const aa = ctx.aa;
  const batch = createBatch();
  batch.box(mat(0xe7dfd0, { roughness: 0.95 }), aa.cx, ctx.gnd - 1.2, aa.cz, aa.width, 1.2, aa.height);
  batch.build(ctx.groups.built, "activation");
}

function buildZoneTints(ctx) {
  const aa = ctx.aa;
  const tints = [
    ["aa-industrial", layout.aaTints.industrial, 0xcbb28c],
    ["aa-residential", layout.aaTints.residential, 0xdcc39d],
    ["aa-commercial", layout.aaTints.commercial, 0xe6d6ba],
  ];
  for (const [id, spec, color] of tints) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(spec.w, 0.14, spec.d),
      mat(color, { opacity: 0.35, offset: true, roughness: 1 }),
    );
    mesh.position.set(spec.x, ctx.gnd + 0.05, spec.z);
    tag(mesh, id);
    ctx.groups.zones.add(mesh);
  }
  void aa;
}

/* ------------------------------- roads ------------------------------- */

function local(rect, fx, fz) {
  return { x: rect.minX + fx * rect.width, z: rect.minZ + fz * rect.height };
}

function buildRoads(ctx) {
  const aa = ctx.aa;
  const gnd = ctx.gnd;
  const asphalt = createBatch();
  const walk = createBatch();
  const marks = createBatch();
  const medians = createBatch();

  const verticals = layout.roads.lines.filter((line) => Math.abs(line.a.x - line.b.x) < 1);
  const horizontals = layout.roads.lines.filter((line) => Math.abs(line.a.z - line.b.z) < 1);
  const roadXs = verticals.map((line) => line.a.x).sort((a, b) => a - b);
  const roadZs = horizontals.map((line) => line.a.z).sort((a, b) => a - b);

  // Secondary local streets fill the ~870 m superblocks into ~290 m walkable blocks.
  const xs = [...roadXs];
  const zs = [...roadZs];
  for (let x = aa.minX + 150; x < aa.maxX - 90; x += 300) {
    if (roadXs.some((v) => Math.abs(v - x) < 85)) continue;
    if (ctx.exclusions.some((ex) => x > ex.minX - 18 && x < ex.maxX + 18)) continue;
    xs.push(x);
  }
  for (let z = aa.minZ + 150; z < aa.maxZ - 90; z += 290) {
    if (roadZs.some((v) => Math.abs(v - z) < 85)) continue;
    if (ctx.exclusions.some((ex) => z > ex.minZ - 18 && z < ex.maxZ + 18)) continue;
    zs.push(z);
  }
  xs.sort((a, b) => a - b);
  zs.sort((a, b) => a - b);
  ctx.xs = xs;
  ctx.zs = zs;

  const canal = layout.canal;
  const canalZ = canal.polyline[0].z;
  const canalNorth = canalZ - canal.halfWidth - 26;
  const canalSouth = canalZ + canal.halfWidth + 26;

  const addStreet = (a, b, width, arterial) => {
    streetStrip(asphalt, arterial ? paint.arterial : paint.road, a, b, width, gnd + 0.12, 0.24);
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len = Math.hypot(dx, dz) || 1;
    const nx = -dz / len;
    const nz = dx / len;
    const off = width / 2 + 3.4;
    for (const side of [-1, 1]) {
      const sw = arterial ? 7 : 4.4;
      streetStrip(
        walk,
        sidewalkMat,
        { x: a.x + nx * off * side, z: a.z + nz * off * side },
        { x: b.x + nx * off * side, z: b.z + nz * off * side },
        sw,
        gnd + 0.17,
        0.18,
      );
    }
    if (arterial) {
      streetStrip(medians, paint.treeLeaf, a, b, 3.2, gnd + 0.2, 0.26);
      for (const side of [-1, 1]) {
        streetStrip(marks, markingMat, { x: a.x + nx * width * 0.18 * side, z: a.z + nz * width * 0.18 * side }, { x: b.x + nx * width * 0.18 * side, z: b.z + nz * width * 0.18 * side }, 0.35, gnd + 0.26, 0.02);
      }
    } else {
      streetStrip(marks, markingMat, a, b, 0.28, gnd + 0.26, 0.02);
    }
  };

  // The published 72 km grid.
  for (const line of layout.roads.lines) {
    addStreet(line.a, line.b, line.width, line.cls === "arterial");
  }
  // Local streets: verticals stop at the canal, horizontals run its full length.
  for (const x of xs) {
    if (roadXs.some((v) => Math.abs(v - x) < 1)) continue;
    const a = { x, z: aa.minZ + 36 };
    const b = { x, z: aa.maxZ - 36 };
    if (zWithin(a, b, canalNorth, canalSouth)) {
      addStreet(a, { x, z: canalNorth }, 11, false);
      addStreet({ x, z: canalSouth }, b, 11, false);
    } else {
      addStreet(a, b, 11, false);
    }
  }
  for (const z of zs) {
    if (roadZs.some((v) => Math.abs(v - z) < 1)) continue;
    if (z > canalNorth && z < canalSouth) continue;
    addStreet({ x: aa.minX + 36, z }, { x: aa.maxX - 36, z }, 11, false);
  }

  asphalt.build(ctx.groups.roads, "aa-roads");
  walk.build(ctx.groups.roads, "aa-roads");
  marks.build(ctx.groups.roads, "aa-roads");
  medians.build(ctx.groups.roads, "aa-roads");

  // Street tree / lamp positions along every street centreline.
  for (const line of layout.roads.lines) collectStreetFurniture(ctx, line.a, line.b, line.width, line.cls === "arterial");
  for (const x of xs) {
    if (roadXs.some((v) => Math.abs(v - x) < 1)) continue;
    collectStreetFurniture(ctx, { x, z: aa.minZ + 40 }, { x, z: aa.maxZ - 40 }, 11, false);
  }
  for (const z of zs) {
    if (roadZs.some((v) => Math.abs(v - z) < 1)) continue;
    if (z > canalNorth && z < canalSouth) continue;
    collectStreetFurniture(ctx, { x: aa.minX + 40, z }, { x: aa.maxX - 40, z }, 11, false);
  }

  // Buildings must keep clear of every street corridor.
  for (const line of layout.roads.lines) {
    addRoadExclusion(ctx, line.a, line.b, line.width / 2 + 12);
  }
  for (const x of xs) {
    if (roadXs.some((v) => Math.abs(v - x) < 1)) continue;
    addRoadExclusion(ctx, { x, z: aa.minZ }, { x, z: aa.maxZ }, 11 / 2 + 12);
  }
  for (const z of zs) {
    if (roadZs.some((v) => Math.abs(v - z) < 1)) continue;
    if (z > canalNorth && z < canalSouth) continue;
    addRoadExclusion(ctx, { x: aa.minX, z }, { x: aa.maxX, z }, 11 / 2 + 12);
  }
}

function zWithin(a, b, low, high) {
  const min = Math.min(a.z, b.z);
  const max = Math.max(a.z, b.z);
  return min < low && max > high;
}

function addRoadExclusion(ctx, a, b, pad) {
  ctx.exclusions.push({
    minX: Math.min(a.x, b.x) - (Math.abs(a.x - b.x) < 2 ? pad : 0),
    maxX: Math.max(a.x, b.x) + (Math.abs(a.x - b.x) < 2 ? pad : 0),
    minZ: Math.min(a.z, b.z) - (Math.abs(a.z - b.z) < 2 ? pad : 0),
    maxZ: Math.max(a.z, b.z) + (Math.abs(a.z - b.z) < 2 ? pad : 0),
  });
}

function collectStreetFurniture(ctx, a, b, width, arterial) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len = Math.hypot(dx, dz) || 1;
  const nx = -dz / len;
  const nz = dx / len;
  const treeOffset = width / 2 + 7.5;
  const treeStep = arterial ? 42 : 58;
  for (let d = arterial ? 20 : 30; d < len - 10; d += treeStep) {
    const t = d / len;
    const px = a.x + dx * t;
    const pz = a.z + dz * t;
    for (const side of [-1, 1]) {
      if ((Math.floor(d / treeStep) + (side > 0 ? 1 : 0)) % 3 === 0) continue;
      ctx.treeSpots.push({
        x: px + nx * treeOffset * side + ((d * 7) % 11) - 5,
        z: pz + nz * treeOffset * side + ((d * 13) % 11) - 5,
      });
    }
  }
  const lampOffset = width / 2 + 1.6;
  const lampStep = arterial ? 64 : 86;
  for (let d = lampStep * 0.6; d < len - 10; d += lampStep) {
    const t = d / len;
    const side = Math.floor(d / lampStep) % 2 === 0 ? -1 : 1;
    ctx.lampSpots.push({
      x: a.x + dx * t + nx * lampOffset * side,
      z: a.z + dz * t + nz * lampOffset * side,
    });
  }
}

/* ------------------------------- canal ------------------------------- */

function buildCanal(ctx, rng) {
  const gnd = ctx.gnd;
  const canal = layout.canal;
  const half = canal.halfWidth;
  const water = createBatch();
  const stone = createBatch();
  for (const span of canal.spans) {
    const w = span.maxX - span.minX;
    const cx = (span.minX + span.maxX) / 2;
    water.box(paint.canal, cx, gnd + 0.26, span.z, w, 0.22, half * 1.25);
    stone.box(paint.parapet, cx, gnd + 0.5, span.z - half, w, 0.9, 1.6);
    stone.box(paint.parapet, cx, gnd + 0.5, span.z + half, w, 0.9, 1.6);
    // Promenades and low planting along both banks.
    for (const side of [-1, 1]) {
      stone.box(paint.concreteDark, cx, gnd + 0.38, span.z + side * (half + 4.6), w, 0.3, 7.4);
      water.box(paint.treeLeaf, cx, gnd + 0.42, span.z + side * (half + 9.6), w, 0.22, 3.4);
    }
    for (let x = span.minX + 14; x < span.maxX - 8; x += 26) {
      ctx.treeSpots.push({ x, z: span.z - half - 7 });
      if (rng() > 0.4) ctx.lampSpots.push({ x: x + 12, z: span.z + half + 3.6 });
    }
    ctx.colliders.push({ minX: span.minX, maxX: span.maxX, minZ: span.z - half, maxZ: span.z + half });
  }
  const a = canal.polyline[1];
  const b = canal.hook;
  const zMid = (a.z + b.z) / 2;
  water.box(paint.canal, a.x, gnd + 0.26, zMid, half * 1.3, 0.22, Math.abs(a.z - b.z));
  stone.box(paint.parapet, a.x - half * 0.7, gnd + 0.5, zMid, 1.6, 0.9, Math.abs(a.z - b.z));
  stone.box(paint.parapet, a.x + half * 0.7, gnd + 0.5, zMid, 1.6, 0.9, Math.abs(a.z - b.z));
  ctx.colliders.push({
    minX: a.x - half,
    maxX: a.x + half,
    minZ: Math.min(a.z, b.z),
    maxZ: Math.max(a.z, b.z),
  });

  // Exclusions: canal corridor and its promenades.
  ctx.exclusions.push({
    minX: canal.polyline[0].x - 30,
    maxX: canal.polyline[1].x + 30,
    minZ: canal.polyline[0].z - half - 16,
    maxZ: canal.polyline[0].z + half + 16,
  });
  ctx.exclusions.push({
    minX: a.x - half - 16,
    maxX: a.x + half + 16,
    minZ: Math.min(a.z, b.z) - 10,
    maxZ: Math.max(a.z, b.z) + 10,
  });

  water.build(ctx.groups.water, "canal");
  stone.build(ctx.groups.built, "canal");
  addLabel(ctx.labels, {
    id: "canal",
    text: "Central canal",
    x: (canal.polyline[0].x + canal.polyline[1].x) / 2,
    y: gnd + 18,
    z: canal.polyline[0].z,
    tier: "building",
  });
}

function buildCanalDetails(ctx, rng) {
  const gnd = ctx.gnd;
  const canal = layout.canal;
  const half = canal.halfWidth;
  const batch = createBatch();
  // Road bridges across the canal where the trunk grid crosses it.
  for (const line of layout.roads.lines) {
    if (Math.abs(line.a.x - line.b.x) >= 1) continue;
    const x = line.a.x;
    if (x < canal.polyline[0].x || x > canal.polyline[1].x) continue;
    const width = line.width + 10;
    const z = canal.polyline[0].z;
    batch.box(paint.concreteDark, x, gnd + 0.42, z, width, 0.55, half * 2 + 12);
    for (const side of [-1, 1]) {
      batch.box(paint.parapet, x - width / 2 + 0.5, gnd + 0.75, z, 0.7, 1.1, half * 2 + 12);
      batch.box(paint.parapet, x + width / 2 - 0.5, gnd + 0.75, z, 0.7, 1.1, half * 2 + 12);
      for (let i = 0; i < 4; i++) batch.cyl(paint.steelMat ? paint.steelMat : paint.concreteDark, x + (i - 1.5) * (width / 4), gnd - 0.2, z + side * (half - 2), 1.1, 1.6);
    }
  }
  // Footbridges at the local street grid ends.
  const footZ = canal.polyline[0].z;
  for (let x = ctx.aa.minX + 280; x < ctx.aa.maxX - 200; x += 620) {
    batch.box(paint.concreteDark, x, gnd + 0.9, footZ, 5, 0.4, half * 2 + 10);
    for (const side of [-1, 1]) batch.box(paint.parapet, x, gnd + 1.35, footZ + side * 8, 5.4, 0.9, 0.6);
    ctx.colliders.push({ minX: x - 2.6, maxX: x + 2.6, minZ: footZ - half - 5, maxZ: footZ + half + 5 });
  }
  // Benches and litter bins along the promenade.
  for (let x = canal.polyline[0].x + 40; x < canal.polyline[1].x; x += 62) {
    if (rng() < 0.4) continue;
    batch.box(paint.concreteDark, x, gnd + 0.5, footZ + half + 6.4, 2.4, 0.5, 0.8);
    batch.cyl(paint.concreteDark, x + 4, gnd + 0.5, footZ + half + 6.2, 0.4, 1.2);
  }
  batch.build(ctx.groups.built, "canal");
}

/* ---------------------------- utilities ---------------------------- */

function buildUtilities(ctx) {
  const gnd = ctx.gnd;
  const colors = [0x3d7ea6, 0x7a5b46, 0xb5693a, 0xd2a04a];
  const batchers = colors.map(() => createBatch());
  const marked = layout.roads.lines.filter((line) => line.cls === "arterial");
  marked.forEach((line, index) => {
    const dx = line.b.x - line.a.x;
    const dz = line.b.z - line.a.z;
    const len = Math.hypot(dx, dz) || 1;
    const ox = (-dz / len) * (11 + index * 2.2);
    const oz = (dx / len) * (11 + index * 2.2);
    streetStrip(batchers[index % batchers.length], colors[index % batchers.length], { x: line.a.x + ox, z: line.a.z + oz }, { x: line.b.x + ox, z: line.b.z + oz }, 1.5, gnd + 0.2, 0.16);
  });
  batchers.forEach((batch, i) => {
    if (batch.size === 0) return;
    batch.build(ctx.groups.utilities, i === 0 ? "wtp" : "aa-roads");
  });
}

function buildPylons(ctx) {
  const gnd = ctx.gnd;
  const sub = layout.blocks.subTorrent;
  const batch = createBatch();
  for (let i = 1; i <= 7; i++) {
    const px = sub.x + i * 210;
    const pz = sub.z + (i % 2 === 0 ? 34 : -34);
    batch.box(paint.concreteDark, px, gnd, pz, 4, 32, 4);
    batch.box(paint.concreteDark, px, gnd + 28, pz, 1.5, 1.5, 26);
    batch.box(paint.concreteDark, px, gnd + 24, pz, 1.5, 1.5, 18);
  }
  batch.build(ctx.groups.utilities, "sub-torrent");
}

/* ----------------------------- sites ----------------------------- */

function buildSites(ctx) {
  const gnd = ctx.gnd;
  const l = (fx, fz) => local(ctx.aa, fx, fz);
  const sites = [];
  const add = (id, type, spec, opts = {}) => {
    if (!spec) {
      sites.push({ id, type, spec: null, ...opts });
      return;
    }
    sites.push({ id, type, spec: { x: spec.x, z: spec.z, w: spec.w, d: spec.d, h: spec.h ?? 24 }, ...opts });
  };

  // Trunk works described as built.
  add("bec", "cioc", layout.blocks.bec, { label: "ABCD", layer: "built", labelY: 62 });
  add("spv", "spv", layout.blocks.spv, { label: "SPV", layer: "built", labelY: 44 });
  add("stp", "processPlant", layout.blocks.stp, { label: "Sewage plant", index: 0 });
  add("cetp", "processPlant", layout.blocks.cetp, { label: "Effluent plant", index: 1 });
  add("sub-torrent", "substation", layout.blocks.subTorrent, { label: "Substation" });
  add("sub-torrent", "substation", layout.blocks.subTorrentB, {});
  add("sub-getco", "substation", layout.blocks.subGetco, { label: "GETCO", layer: "planned" });
  add("esr", "esr", null, { esrs: true });
  add("wtp", "processPlant", { x: layout.wtp.x, z: layout.wtp.z, w: 90, d: 54, h: 10 }, { label: "Water plant", base: layout.pad, layer: "built", index: 2, labelY: 26 });

  // Social buildings described as initiated.
  add("school", "school", layout.blocks.school, { label: "School", layer: "planned", labelY: 26 });
  add("hospital", "hospital", layout.blocks.hospital, { label: "Hospital", layer: "planned", labelY: 40 });
  add("fire", "fire", layout.blocks.fire, { label: "Fire station", layer: "planned", labelY: 28 });
  add("hotel", "hotel", layout.blocks.hotel, { label: "Hotel", layer: "planned", labelY: 48 });
  add("guesthouse", "guesthouse", layout.blocks.guesthouse, { label: "Guest house", layer: "planned", labelY: 22 });
  add("foodcourt", "foodcourt", layout.blocks.foodcourt, { label: "Food court", layer: "planned", labelY: 20 });
  add("residential-blocks", "apartment", layout.blocks.residential[0], { label: "Housing", layer: "planned", labelY: 52, index: 0 });
  add("residential-blocks", "apartment", layout.blocks.residential[1], { index: 1, layer: "planned" });
  add("residential-blocks", "apartment", layout.blocks.residential[2], { index: 2, layer: "planned" });
  add("semicon", "fab", layout.blocks.semicon, { label: "Semicon City", layer: "planned", labelY: 42 });

  // New civic / commercial fabric.
  add("cityhall", "cityhall", { ...l(0.465, 0.555), w: 112, d: 70, h: 30 }, { label: "City Hall", labelY: 40 });
  add("high-street", "highstreet", { ...l(0.45, 0.35), w: 250, d: 44, h: 24 }, { label: "High Street", labelY: 22 });
  add("market", "market", { ...l(0.55, 0.55), w: 110, d: 62, h: 26 }, { label: "Market", labelY: 26 });
  add("metro", "metro", { ...l(0.6, 0.47), w: 160, d: 46, h: 18 }, { label: "Metro station", labelY: 26 });
  add("parking", "parking", { ...l(0.375, 0.44), w: 92, d: 52, h: 18 }, { label: "Parking", labelY: 24 });
  add("stadium", "stadium", { ...l(0.68, 0.56), w: 300, d: 250, h: 22 }, { label: "Stadium", labelY: 30 });

  // Place the sites, merge each building's parts per material.
  const batches = new Map();
  const perSite = [];
  for (const site of sites) {
    site.layer = site.layer ?? "built";
    site.base = site.base ?? gnd;
    let batch = batches.get(site.id + site.layer);
    if (!batch) batches.set(site.id + site.layer, (batch = { batch: createBatch(), ids: site.id, layer: site.layer, group: site.id }));
    if (site.esrs) {
      layout.blocks.esrs.forEach((spec, i) => {
        addArchetype(batch.batch, "esr", { x: spec.x + 30, z: spec.z, w: 15, d: 15, h: spec.h }, gnd, i);
      });
      continue;
    }
    addArchetype(batch.batch, site.type, site.spec, site.base, site.index ?? 0);
    if (!site.extra) perSite.push(site);
  }

  for (const entry of batches.values()) {
    const group = entry.layer === "planned" ? ctx.groups.planned : ctx.groups.built;
    entry.batch.build(group, entry.ids);
  }

  for (const site of perSite) {
    if (site.spec) {
      ctx.exclusions.push({
        minX: site.spec.x - site.spec.w / 2 - 16,
        maxX: site.spec.x + site.spec.w / 2 + 16,
        minZ: site.spec.z - site.spec.d / 2 - 16,
        maxZ: site.spec.z + site.spec.d / 2 + 16,
      });
      ctx.colliders.push({
        minX: site.spec.x - site.spec.w / 2,
        maxX: site.spec.x + site.spec.w / 2,
        minZ: site.spec.z - site.spec.d / 2,
        maxZ: site.spec.z + site.spec.d / 2,
      });
    }
    if (site.label) {
      addLabel(ctx.labels, {
        id: site.id,
        text: site.label,
        x: site.spec.x,
        y: site.base + (site.labelY ?? 30),
        z: site.spec.z,
        tier: "building",
      });
    }
  }

  // ESR colliders + label (the batch above is tagged "esr").
  for (const spec of layout.blocks.esrs) {
    ctx.colliders.push({ minX: spec.x + 23, maxX: spec.x + 37, minZ: spec.z - 7, maxZ: spec.z + 7 });
    ctx.exclusions.push({ minX: spec.x + 12, maxX: spec.x + 48, minZ: spec.z - 18, maxZ: spec.z + 18 });
  }
  addLabel(ctx.labels, { id: "esr", text: "Reservoirs", x: layout.blocks.esrs[0].x + 30, y: gnd + 32, z: layout.blocks.esrs[0].z, tier: "building" });

  // Mass-balancing reservoirs + WTP tanks.
  buildReservoirs(ctx);
}

function buildReservoirs(ctx) {
  const water = createBatch();
  const concrete = createBatch();
  layout.blocks.mbrs.forEach((spec, i) => {
    water.box(paint.canal, spec.x, layout.pad + spec.h - 1.2, spec.z, spec.w, 1.4, spec.d);
    concrete.box(paint.concreteDark, spec.x, layout.pad, spec.z - spec.d / 2 - 1, spec.w + 4, 2.2, 2);
    concrete.box(paint.concreteDark, spec.x, layout.pad, spec.z + spec.d / 2 + 1, spec.w + 4, 2.2, 2);
    concrete.box(paint.concreteDark, spec.x - spec.w / 2 - 1, layout.pad, spec.z, 2, 2.2, spec.d + 4);
    concrete.box(paint.concreteDark, spec.x + spec.w / 2 + 1, layout.pad, spec.z, 2, 2.2, spec.d + 4);
    for (let a = 0; a < 4; a++) concrete.cyl(paint.concreteDark, spec.x - 20 + a * 14, layout.pad + 1, spec.z + 6, 2.2, 1.4);
    ctx.colliders.push({
      minX: spec.x - spec.w / 2,
      maxX: spec.x + spec.w / 2,
      minZ: spec.z - spec.d / 2,
      maxZ: spec.z + spec.d / 2,
    });
    if (i === 0) addLabel(ctx.labels, { id: "mbr", text: "Balancing reservoirs", x: spec.x, y: layout.pad + 18, z: spec.z, tier: "building" });
  });
  water.build(ctx.groups.water, "mbr");
  concrete.build(ctx.groups.built, "mbr");
}

/* ----------------------------- parks ----------------------------- */

function buildParks(ctx, rng) {
  const gnd = ctx.gnd;
  const aa = ctx.aa;
  const parkBatch = createBatch();
  const parks = [
    { x: aa.minX + 0.42 * aa.width, z: aa.minZ + 0.59 * aa.height, w: 300, d: 180, id: "central-park", label: "Central Park" },
    { x: layout.aaTints.residential.x - 120, z: layout.aaTints.residential.z - 260, w: 190, d: 150, id: "aa-residential" },
    { x: layout.aaTints.industrial.x - 400, z: layout.aaTints.industrial.z + 200, w: 170, d: 140, id: "aa-industrial" },
  ];
  for (const park of parks) {
    const { x, z, w, d } = park;
    parkBatch.box(paint.treeLeaf, x, gnd + 0.02, z, w, 0.18, d);
    // Curved-ish walking loop from straight segments.
    const ring = [
      { x: x - w * 0.36, z: z - d * 0.3 },
      { x: x + w * 0.3, z: z - d * 0.34 },
      { x: x + w * 0.38, z: z + d * 0.28 },
      { x: x - w * 0.28, z: z + d * 0.32 },
    ];
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i];
      const b = ring[(i + 1) % ring.length];
      const mx = (a.x + b.x) / 2;
      const mz = (a.z + b.z) / 2;
      const len = Math.hypot(b.x - a.x, b.z - a.z);
      parkBatch.box(paint.concreteDark, mx, gnd + 0.16, mz, 4.4, 0.14, len, Math.atan2(b.x - a.x, b.z - a.z));
    }
    // Pond and pavilion.
    parkBatch.add("cyl", paint.canal, x + w * 0.08, gnd + 0.14, z - d * 0.02, w * 0.2, 0.16, d * 0.24);
    parkBatch.cyl(paint.concreteDark, x + w * 0.3, gnd + 0.18, z + d * 0.18, 5, 3.4);
    parkBatch.box(paint.concreteDark, x + w * 0.3, gnd + 3.4, z + d * 0.18, 14, 0.5, 14);
    // Trees inside the park.
    const rows = Math.floor(d / 34);
    const cols = Math.floor(w / 40);
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        if (rng() < 0.42) continue;
        ctx.treeSpots.push({
          x: x - w / 2 + 20 + i * 40 + rng() * 12,
          z: z - d / 2 + 18 + j * 34 + rng() * 10,
        });
      }
    }
    // Benches.
    for (let i = 0; i < 8; i++) {
      const t = i / 8;
      parkBatch.box(paint.concreteDark, x - w * 0.36 + t * w * 0.72, gnd + 0.3, z - d * 0.3, 2.2, 0.4, 0.7);
    }
    ctx.exclusions.push({ minX: x - w / 2 - 10, maxX: x + w / 2 + 10, minZ: z - d / 2 - 10, maxZ: z + d / 2 + 10 });
    ctx.colliders.push({ minX: x + w * 0.3 - 7, maxX: x + w * 0.3 + 7, minZ: z + d * 0.18 - 7, maxZ: z + d * 0.18 + 7 });
    addLabel(ctx.labels, { id: park.id, text: park.label ?? "Park", x, y: gnd + 16, z, tier: "building" });
  }
  parkBatch.build(ctx.groups.built, "central-park");
}

/* --------------------------- city fabric --------------------------- */

let prefabCache = null;
function getPrefabs() {
  if (prefabCache) return prefabCache;
  prefabCache = {
    towerA: compilePrefab("towerA"),
    towerB: compilePrefab("towerB"),
    apartmentA: compilePrefab("apartmentA"),
    midriseA: compilePrefab("midriseA"),
    retailA: compilePrefab("retailA"),
    shedA: compilePrefab("shedA"),
    warehouseA: compilePrefab("warehouseA"),
    techA: compilePrefab("techA"),
  };
  return prefabCache;
}

const BODY_COLORS = [0xf2ebde, 0xe8ddc9, 0xdfd2ba, 0xf6f1e7, 0xd9cbb4, 0xe9d9c2, 0xd4c8b6, 0xefe3cc, 0xe2d4be];

function buildFabric(ctx, rng) {
  const gnd = ctx.gnd;
  const aa = ctx.aa;
  const prefabs = getPrefabs();
  const poses = new Map();
  for (const key of Object.keys(prefabs)) poses.set(key, []);

  const inTint = (tint, x, z) => Math.abs(x - tint.x) < tint.w / 2 && Math.abs(z - tint.z) < tint.d / 2;
  const blocked = (x0, x1, z0, z1) =>
    ctx.exclusions.some((ex) => x1 > ex.minX && x0 < ex.maxX && z1 > ex.minZ && z0 < ex.maxZ);

  const pickType = (x, z, rng2) => {
    const industrial = inTint(layout.aaTints.industrial, x, z);
    const residential = inTint(layout.aaTints.residential, x, z);
    const commercial = inTint(layout.aaTints.commercial, x, z);
    const toBec = Math.hypot(x - layout.blocks.bec.x, z - layout.blocks.bec.z);
    const r = rng2();
    if (industrial && !commercial) return r < 0.62 ? "shedA" : r < 0.88 ? "warehouseA" : "techA";
    if (residential && !commercial) return r < 0.4 ? "apartmentA" : r < 0.72 ? "midriseA" : r < 0.9 ? "retailA" : "towerA";
    if (commercial) return r < 0.42 ? "towerA" : r < 0.62 ? "towerB" : r < 0.86 ? "retailA" : "apartmentA";
    if (toBec < 900) return r < 0.5 ? "towerA" : r < 0.72 ? "towerB" : "retailA";
    return r < 0.3 ? "towerA" : r < 0.52 ? "apartmentA" : r < 0.72 ? "midriseA" : r < 0.9 ? "retailA" : "techA";
  };

  const dims = {
    towerA: { w: 44, d: 32 },
    towerB: { w: 56, d: 34 },
    apartmentA: { w: 62, d: 20 },
    midriseA: { w: 50, d: 44 },
    retailA: { w: 52, d: 30 },
    shedA: { w: 64, d: 42 },
    warehouseA: { w: 76, d: 44 },
    techA: { w: 70, d: 56 },
  };

  const placeCell = (x0, x1, z0, z1, depth) => {
    if (x1 - x0 < 55 || z1 - z0 < 55) return;
    if (blocked(x0, x1, z0, z1)) {
      if (depth <= 0) return;
      const mx = (x0 + x1) / 2;
      const mz = (z0 + z1) / 2;
      placeCell(x0, mx, z0, mz, depth - 1);
      placeCell(mx, x1, z0, mz, depth - 1);
      placeCell(x0, mx, mz, z1, depth - 1);
      placeCell(mx, x1, mz, z1, depth - 1);
      return;
    }
    const cw = x1 - x0;
    const cd = z1 - z0;
    const nx = Math.max(1, Math.round(cw / 128));
    const nz = Math.max(1, Math.round(cd / 118));
    const pw = cw / nx;
    const pd = cd / nz;
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < nz; j++) {
        if (rng() < 0.1) continue;
        const px = x0 + pw * (i + 0.5) + (rng() - 0.5) * 12;
        const pz = z0 + pd * (j + 0.5) + (rng() - 0.5) * 12;
        const type = pickType(px, pz, rng);
        const dim = dims[type];
        const rotate = pd > pw;
        const spanX = rotate ? dim.d : dim.w;
        const spanZ = rotate ? dim.w : dim.d;
        const scale = Math.min((pw - 10) / spanX, (pd - 10) / spanZ, 1.25);
        if (scale < 0.52) continue;
        poses.get(type).push({
          x: px,
          z: pz,
          y: gnd,
          rotY: rotate ? Math.PI / 2 : 0,
          scale,
          color: BODY_COLORS[Math.floor(rng() * BODY_COLORS.length)],
        });
        const hw = (spanX * scale) / 2;
        const hd = (spanZ * scale) / 2;
        ctx.colliders.push({ minX: px - hw, maxX: px + hw, minZ: pz - hd, maxZ: pz + hd });
      }
    }
  };

  // Cells between the street centre lines.
  const xs = ctx.xs;
  const zs = ctx.zs;
  for (let i = 0; i < xs.length - 1; i++) {
    for (let j = 0; j < zs.length - 1; j++) {
      const x0 = xs[i] + 24;
      const x1 = xs[i + 1] - 24;
      const z0 = zs[j] + 24;
      const z1 = zs[j + 1] - 24;
      // Keep the walk spawn clear.
      const spawn = layout.blocks.spawn;
      if (z1 > spawn.z - 45 && z0 < spawn.z + 45 && x1 > spawn.x - 45 && x0 < spawn.x + 45) {
        continue;
      }
      placeCell(x0, x1, z0, z1, 1);
    }
  }

  // Instanced placement: one InstancedMesh per prefab part/material.
  for (const [key, list] of poses) {
    if (!list.length) continue;
    instanceParts(ctx.groups.built, prefabs[key], list, key.startsWith("shed") || key.startsWith("warehouse") ? "aa-industrial" : key.startsWith("apartment") || key.startsWith("midrise") ? "aa-residential" : "aa-commercial");
  }
  ctx.fabricCount = [...poses.values()].reduce((sum, list) => sum + list.length, 0);
  void aa;
}

/* ------------------------- trees and lamps ------------------------- */

function buildStreetFurniture(ctx, rng) {
  const gnd = ctx.gnd;
  const spots = ctx.treeSpots;
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.32, 0.5, 3.2, 5), barkMat, spots.length);
  const foliage = new THREE.InstancedMesh(new THREE.ConeGeometry(3.1, 8.2, 6), foliageMat, spots.length);
  const dummy = new THREE.Object3D();
  spots.forEach((spot, i) => {
    dummy.position.set(spot.x, gnd + 1.6, spot.z);
    dummy.rotation.set(0, (i * 0.73) % Math.PI, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    trunk.setMatrixAt(i, dummy.matrix);
    dummy.position.set(spot.x, gnd + 5.4, spot.z);
    dummy.updateMatrix();
    foliage.setMatrixAt(i, dummy.matrix);
  });
  trunk.instanceMatrix.needsUpdate = true;
  foliage.instanceMatrix.needsUpdate = true;
  ctx.groups.built.add(trunk, foliage);

  const lamps = ctx.lampSpots;
  const posts = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.22, 0.3, 8, 6), steelMat, lamps.length);
  const heads = new THREE.InstancedMesh(new THREE.BoxGeometry(0.7, 0.4, 0.7), lampMat, lamps.length);
  lamps.forEach((spot, i) => {
    dummy.position.set(spot.x, gnd + 4, spot.z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    posts.setMatrixAt(i, dummy.matrix);
    dummy.position.set(spot.x, gnd + 8.1, spot.z);
    dummy.updateMatrix();
    heads.setMatrixAt(i, dummy.matrix);
  });
  posts.instanceMatrix.needsUpdate = true;
  heads.instanceMatrix.needsUpdate = true;
  ctx.groups.roads.add(posts, heads);

  // A little scattered scrub between blocks for texture.
  const scrub = new THREE.InstancedMesh(new THREE.ConeGeometry(1.4, 2.2, 5), foliageMat, 900);
  for (let i = 0; i < 900; i++) {
    const x = ctx.aa.minX + rng() * ctx.aa.width;
    const z = ctx.aa.minZ + rng() * ctx.aa.height;
    dummy.position.set(x, gnd + 1.1, z);
    dummy.rotation.set(0, rng() * Math.PI, 0);
    dummy.scale.setScalar(0.7 + rng() * 0.8);
    dummy.updateMatrix();
    scrub.setMatrixAt(i, dummy.matrix);
  }
  scrub.instanceMatrix.needsUpdate = true;
  ctx.groups.built.add(scrub);
}
