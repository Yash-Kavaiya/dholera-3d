import * as THREE from "three";
import { layout } from "../geo/layout.js";
import {
  paint,
  mat,
  lampMat,
  windowMat,
  wallMat,
  wallAltMat,
  wallWarmMat,
  plasterMat,
  stoneMat,
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
  sidewalkMat,
  markingMat,
  asphaltMat,
  arterialMat,
  medianMat,
  darkMat,
  whiteMat,
  foliageMat,
  barkMat,
  containerMats,
} from "./materials.js";
import { createBatch, makeRng, insidePoly, distanceToPoly, bboxOfPoly, instanceParts, ellipseRing } from "./buildkit.js";
import { addArchetype, compilePrefab, compileSimplePrefab } from "./archetypes.js";
import { tag, addLabel } from "./meshkit.js";

/**
 * District — the rest of the city outside the Activation Area.
 * A real (seeded) street grid across TP1–TP6 with solid buildings in blocks, plus set-piece
 * landmarks for the game places. Repeated buildings are InstancedMesh buckets; set pieces are
 * merged per material. Contract: buildDistrict(groups, labels) -> { update, colliders, places, stats }.
 */

const CELL = 300;
const INSET = 22;

export function buildDistrict(groups, labels) {
  const rng = makeRng(424242);
  const pad = layout.pad;
  const baseY = pad + 0.9;
  const aa = layout.activation;
  const colliders = [];
  const places = {};
  let drawMeshes = 0;

  const dev = layout.developable;
  const devBox = bboxOfPoly(dev);
  const centre = {
    x: (devBox.minX + devBox.maxX) / 2,
    z: (devBox.minZ + devBox.maxZ) / 2,
  };

  // Grid aligned to the expressway corridor so blocks read as a planned town, not graph paper.
  const e0 = layout.expressway[1];
  const e1 = layout.expressway[2];
  const theta = Math.atan2(e1.z - e0.z, e1.x - e0.x);
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  const toWorld = (u, v) => ({ x: centre.x + u * cos - v * sin, z: centre.z + u * sin + v * cos });
  const toGrid = (x, z) => ({ u: (x - centre.x) * cos + (z - centre.z) * sin, v: -(x - centre.x) * sin + (z - centre.z) * cos });

  // Grid coordinate range covering the whole developable.
  let minU = Infinity;
  let maxU = -Infinity;
  let minV = Infinity;
  let maxV = -Infinity;
  for (const p of dev) {
    const g = toGrid(p.x, p.z);
    minU = Math.min(minU, g.u);
    maxU = Math.max(maxU, g.u);
    minV = Math.min(minV, g.v);
    maxV = Math.max(maxV, g.v);
  }
  const i0 = Math.floor(minU / CELL) - 1;
  const i1 = Math.ceil(maxU / CELL) + 1;
  const j0 = Math.floor(minV / CELL) - 1;
  const j1 = Math.ceil(maxV / CELL) + 1;

  /* ---------------- exclusion tests ---------------- */

  const inRect = (r, x, z, expand = 0) => Math.abs(x - r.x) <= r.w / 2 + expand && Math.abs(z - r.z) <= r.d / 2 + expand;
  const distToRect = (r, x, z) => Math.hypot(Math.max(r.minX - x, 0, x - r.maxX), Math.max(r.minZ - z, 0, z - r.maxZ));

  const villages = layout.pinned;
  const airport = layout.airport;
  const solar = layout.solar;

  function blocked(x, z, radius = 0) {
    if (x > layout.shoreX - 900 - radius) return true;
    if (distToRect(aa, x, z) < 260 + radius) return true;
    if (Math.hypot(x - airport.x, z - airport.z) < 2300 + radius) return true;
    if (Math.abs(x - solar.x) < 1450 + radius && Math.abs(z - solar.z) < 1250 + radius) return true;
    if (Math.hypot(x - layout.wtp.x, z - layout.wtp.z) < 260 + radius) return true;
    for (const v of villages) if (Math.hypot(x - v.x, z - v.z) < 330 + radius) return true;
    if (segmentDistance(x, z, layout.expressway) < 330 + radius) return true;
    if (segmentDistance(x, z, layout.airportLink) < 240 + radius) return true;
    if (segmentDistance(x, z, layout.nh751) < 190 + radius) return true;
    if (segmentDistance(x, z, layout.rail) < 160 + radius) return true;
    if (x > layout.shoreX - 1500 && z > devBox.minZ - 4000) return true;
    return false;
  }

  function inBand(x, z) {
    for (const band of layout.bands) if (insidePoly(band.poly, x, z)) return band.id;
    return null;
  }

  const zoneRects = layout.zonePolys.filter((zone) => zone.x != null && zone.w != null);
  function zoneAt(x, z) {
    for (const zone of layout.zonePolys) {
      if (zone.poly && insidePoly(zone.poly, x, z)) return zone.id;
    }
    for (const zone of zoneRects) if (inRect(zone, x, z)) return zone.id;
    return "zone-residential";
  }

  // Cells with a city block.
  const cells = new Map();
  for (let i = i0; i <= i1; i++) {
    for (let j = j0; j <= j1; j++) {
      const { x, z } = toWorld(i * CELL, j * CELL);
      if (!insidePoly(dev, x, z)) continue;
      if (blocked(x, z, CELL * 0.55)) continue;
      cells.set(`${i},${j}`, { i, j, x, z });
      const band = inBand(x, z);
      // No city in the agricultural remainder or the coastal belt, sparse tourism strip.
      const zone = zoneAt(x, z);
      if (zone === "zone-crz" || zone === "zone-agriculture" || zone === "zone-solar") cells.delete(`${i},${j}`);
      else if (zone === "zone-tourism" && band && band !== "tp1" && band !== "tp2") cells.delete(`${i},${j}`);
      else if (!band) cells.delete(`${i},${j}`);
    }
  }

  /* ---------------- street network ---------------- */

  const edgeH = new Map();
  const edgeV = new Map();
  for (const cell of cells.values()) {
    // u-direction edge (varying u, fixed v): h
    for (const dj of [-1, 1]) {
      if (cells.has(`${cell.i},${cell.j + dj}`)) continue;
      const v = dj < 0 ? cell.j : cell.j + 1;
      const key = `${cell.i},${v}`;
      if (edgeH.has(key)) continue;
      const a = toWorld(cell.i * CELL, v * CELL);
      const b = toWorld((cell.i + 1) * CELL, v * CELL);
      if (!insidePoly(dev, a.x, a.z) || !insidePoly(dev, b.x, b.z)) continue;
      if (blocked(a.x, a.z, 20) || blocked(b.x, b.z, 20)) continue;
      edgeH.set(key, { a, b });
    }
    // v-direction edge (varying v, fixed u): v
    for (const di of [-1, 1]) {
      if (cells.has(`${cell.i + di},${cell.j}`)) continue;
      const u = di < 0 ? cell.i : cell.i + 1;
      const key = `${u},${cell.j}`;
      if (edgeV.has(key)) continue;
      const a = toWorld(u * CELL, cell.j * CELL);
      const b = toWorld(u * CELL, (cell.j + 1) * CELL);
      if (!insidePoly(dev, a.x, a.z) || !insidePoly(dev, b.x, b.z)) continue;
      if (blocked(a.x, a.z, 20) || blocked(b.x, b.z, 20)) continue;
      edgeV.set(key, { a, b });
    }
  }

  const roadPoses = [
    ...[...edgeH.values()].map((edge) => edgePose(edge, true)),
    ...[...edgeV.values()].map((edge) => edgePose(edge, false)),
  ];

  function edgePose(edge, horizontal) {
    const mx = (edge.a.x + edge.b.x) / 2;
    const mz = (edge.a.z + edge.b.z) / 2;
    const len = Math.hypot(edge.b.x - edge.a.x, edge.b.z - edge.a.z);
    return { x: mx, y: baseY, z: mz, len, horizontal };
  }

  const flatPlane = flatQuad();
  const roadMesh = new THREE.InstancedMesh(flatPlane, mat(paint.road, { roughness: 0.95, side: THREE.DoubleSide }), Math.max(roadPoses.length, 1));
  const walkMesh = new THREE.InstancedMesh(flatPlane, sidewalkMat, Math.max(roadPoses.length, 1));
  const markMesh = new THREE.InstancedMesh(flatPlane, markingMat, Math.max(roadPoses.length, 1));
  const dummy = new THREE.Object3D();
  roadPoses.forEach((pose, i) => {
    const len = pose.len + 6;
    const widthScale = pose.horizontal ? [len, 26] : [26, len];
    dummy.position.set(pose.x, baseY + 0.1, pose.z);
    dummy.rotation.set(-Math.PI / 2, 0, -theta);
    dummy.scale.set(widthScale[0], widthScale[1], 1);
    dummy.updateMatrix();
    walkMesh.setMatrixAt(i, dummy.matrix);
    dummy.position.y = baseY + 0.16;
    dummy.scale.set(pose.horizontal ? len : 14, pose.horizontal ? 14 : len, 1);
    dummy.updateMatrix();
    roadMesh.setMatrixAt(i, dummy.matrix);
    dummy.position.y = baseY + 0.19;
    dummy.scale.set(pose.horizontal ? len : 0.28, pose.horizontal ? 0.28 : len, 1);
    dummy.updateMatrix();
    markMesh.setMatrixAt(i, dummy.matrix);
  });
  for (const mesh of [walkMesh, roadMesh, markMesh]) {
    mesh.instanceMatrix.needsUpdate = true;
    mesh.count = roadPoses.length;
    mesh.computeBoundingSphere();
  }
  tag(roadMesh, "roads");
  tag(walkMesh, "roads");
  tag(markMesh, "roads");
  groups.roads.add(walkMesh, roadMesh, markMesh);
  drawMeshes += 3;

  /* ---------------- buildings ---------------- */

  const bulk = {};
  for (const name of ["house", "shopRow", "slab", "tower", "shed", "campus"]) bulk[name] = compileSimplePrefab(name);
  const detail = {
    towerA: compilePrefab("towerA"),
    apartmentA: compilePrefab("apartmentA"),
    midriseA: compilePrefab("midriseA"),
    retailA: compilePrefab("retailA"),
    shedA: compilePrefab("shedA"),
    warehouseA: compilePrefab("warehouseA"),
    techA: compilePrefab("techA"),
  };

  const poses = {};
  for (const name of Object.keys(bulk)) poses[name] = [];
  for (const name of Object.keys(detail)) poses[name] = [];
  let buildings = 0;

  const palette = [0xf0e8d8, 0xe4d7bf, 0xdccdb2, 0xf5f0e5, 0xd5c7ae, 0xe9dcc4, 0xd0c3ae, 0xefe1c8];

  const bulkPick = (zone, band, rng2) => {
    const r = rng2();
    if (zone === "zone-industrial") return r < 0.5 ? "shed" : r < 0.82 ? "campus" : "shopRow";
    if (zone === "zone-logistics") return r < 0.62 ? "shed" : r < 0.86 ? "shopRow" : "campus";
    if (zone === "zone-knowledge") return r < 0.4 ? "campus" : r < 0.68 ? "shopRow" : r < 0.9 ? "slab" : "tower";
    if (zone === "zone-city" || zone === "zone-access") return r < 0.38 ? "tower" : r < 0.62 ? "slab" : r < 0.85 ? "shopRow" : "campus";
    if (zone === "zone-public") return r < 0.4 ? "campus" : r < 0.7 ? "shopRow" : "slab";
    if (zone === "zone-sports") return r < 0.5 ? "campus" : "house";
    if (zone === "zone-tourism") return r < 0.5 ? "shopRow" : "house";
    // residential / default: low density in later phases.
    if (band === "tp1" || band === "tp2") return r < 0.45 ? "slab" : r < 0.72 ? "house" : r < 0.9 ? "shopRow" : "tower";
    return r < 0.68 ? "house" : r < 0.88 ? "slab" : "shopRow";
  };

  const dims = {
    house: { w: 18, d: 14 },
    shopRow: { w: 34, d: 18 },
    slab: { w: 34, d: 15 },
    tower: { w: 22, d: 22 },
    shed: { w: 42, d: 28 },
    campus: { w: 40, d: 30 },
    towerA: { w: 44, d: 32 },
    apartmentA: { w: 62, d: 20 },
    midriseA: { w: 50, d: 44 },
    retailA: { w: 52, d: 30 },
    shedA: { w: 64, d: 42 },
    warehouseA: { w: 76, d: 44 },
    techA: { w: 70, d: 56 },
  };

  const cellList = [...cells.values()];
  for (const cell of cellList) {
    const band = inBand(cell.x, cell.z);
    const zone = zoneAt(cell.x, cell.z);
    if (zone === "zone-sports") {
      // Sports grounds: a lawn and a running track, no buildings.
      continue;
    }
    const phase1 = band === "tp1" || band === "tp2";
    if (!phase1 && rng() < 0.35) continue;
    const dToAA = distToRect(aa, cell.x, cell.z);
    const detailRing = phase1 && dToAA < 1000;
    const parcels = phase1 ? 2 : rng() < 0.5 ? 1 : 2;
    for (let p = 0; p < parcels; p++) {
      if (rng() < (phase1 ? 0.08 : 0.28)) continue;
      const off = parcels === 1 ? 0 : p === 0 ? -CELL * 0.22 : CELL * 0.22;
      const px = cell.x + (rng() - 0.5) * 30 + off * cos;
      const pz = cell.z + (rng() - 0.5) * 30 + off * sin;
      const type = bulkPick(zone, band, rng);
      const dim = dims[type];
      const spanX = dim.w;
      const spanZ = dim.d;
      const scale = Math.min((CELL * 0.8) / spanX, (CELL * 0.8) / spanZ, 1.15) * (0.82 + rng() * 0.3);
      const useDetail = detailRing && rng() < 0.55;
      const detailId = useDetail ? detailPick(zone, rng) : null;
      const bucketName = useDetail ? detailId : type;
      const bucket = useDetail ? detail[detailId] : bulk[type];
      if (!bucket) continue;
      const detailDim = useDetail ? dims[detailId] : null;
      const rotY = theta + (rng() < 0.5 ? 0 : Math.PI / 2);
      poses[bucketName].push({
        x: px,
        y: baseY,
        z: pz,
        rotY,
        scale: useDetail ? Math.min(scale, 1) : scale,
        color: palette[Math.floor(rng() * palette.length)],
      });
      buildings += 1;
      const hw = ((detailDim ? detailDim.w : spanX) * scale) / 2;
      const hd = ((detailDim ? detailDim.d : spanZ) * scale) / 2;
      if (useDetail || dToAA < 700) {
        colliders.push({ minX: px - hw, maxX: px + hw, minZ: pz - hd, maxZ: pz + hd });
      }
    }
  }

  for (const [name, list] of Object.entries(poses)) {
    if (!list.length) continue;
    const parts = bulk[name] ?? detail[name];
    if (!parts) continue;
    instanceParts(groups.built, parts, list, `district-${name}`);
    drawMeshes += parts.length;
  }

  /* ---------------- trees, lamps, parks ---------------- */

  const treeSpots = [];
  const lampSpots = [];
  const parkTiles = [];
  const treeRnd = makeRng(7171);
  for (const cell of cellList) {
    const zone = zoneAt(cell.x, cell.z);
    const id = treeRnd();
    if (id < 0.32) {
      const a = toWorld(cell.i * CELL + 14, cell.j * CELL + 14);
      treeSpots.push({ x: a.x, z: a.z });
    }
    if (id > 0.83) {
      const a = toWorld(cell.i * CELL + CELL - 12, cell.j * CELL + CELL - 12);
      treeSpots.push({ x: a.x, z: a.z });
    }
    if (id < 0.18) lampSpots.push({ x: cell.x, z: cell.z });
    if (zone === "zone-residential" && treeRnd() < 0.08) parkTiles.push({ x: cell.x, z: cell.z, rotY: theta });
  }

  const treeMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.3, 0.45, 3, 5), barkMat, Math.max(treeSpots.length, 1));
  const leafMesh = new THREE.InstancedMesh(new THREE.ConeGeometry(2.9, 7.4, 6), foliageMat, Math.max(treeSpots.length, 1));
  treeSpots.forEach((spot, i) => {
    dummy.position.set(spot.x, baseY + 1.5, spot.z);
    dummy.rotation.set(0, (i * 0.61) % Math.PI, 0);
    dummy.scale.setScalar(0.85 + ((i * 37) % 40) / 100);
    dummy.updateMatrix();
    treeMesh.setMatrixAt(i, dummy.matrix);
    dummy.position.y = baseY + 4.6;
    dummy.updateMatrix();
    leafMesh.setMatrixAt(i, dummy.matrix);
  });
  treeMesh.instanceMatrix.needsUpdate = true;
  leafMesh.instanceMatrix.needsUpdate = true;
  groups.built.add(treeMesh, leafMesh);
  drawMeshes += 2;

  const lampPost = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.2, 0.28, 7, 5), steelMat, Math.max(lampSpots.length, 1));
  const lampHead = new THREE.InstancedMesh(new THREE.BoxGeometry(0.6, 0.35, 0.6), lampMat, Math.max(lampSpots.length, 1));
  lampSpots.forEach((spot, i) => {
    dummy.position.set(spot.x, baseY + 3.5, spot.z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    lampPost.setMatrixAt(i, dummy.matrix);
    dummy.position.y = baseY + 7.1;
    dummy.updateMatrix();
    lampHead.setMatrixAt(i, dummy.matrix);
  });
  lampPost.instanceMatrix.needsUpdate = true;
  lampHead.instanceMatrix.needsUpdate = true;
  groups.roads.add(lampPost, lampHead);
  drawMeshes += 2;

  if (parkTiles.length) {
    const lawn = new THREE.InstancedMesh(flatPlane, lawnMat, parkTiles.length);
    parkTiles.forEach((tile, i) => {
      dummy.position.set(tile.x, baseY + 0.06, tile.z);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.rotateZ(tile.rotY);
      dummy.scale.set(CELL * 0.7, CELL * 0.7, 1);
      dummy.updateMatrix();
      lawn.setMatrixAt(i, dummy.matrix);
    });
    lawn.instanceMatrix.needsUpdate = true;
    groups.built.add(lawn);
    drawMeshes += 1;
  }

  /* ---------------- landmarks / set pieces ---------------- */

  const landmark = (id, x, z, title, build, tier = "zone") => {
    const batch = createBatch();
    const info = build(batch, { x, z, pad: baseY }) ?? {};
    batch.build(groups.built, id);
    drawMeshes += 4;
    if (title) addLabel(labels, { id, text: title, x, y: baseY + (info.labelY ?? 40), z, tier });
    if (info.collider) colliders.push(info.collider);
    return info;
  };

  // Civic centre landmark (city-centre place points at the Activation Area's City Hall).
  places["city-center"] = { x: aaLocal(0.465), z: aaLocalZ(0.555), title: "City centre" };
  places["stadium"] = { x: aaLocal(0.68), z: aaLocalZ(0.56), title: "Stadium" };
  places["central-park"] = { x: aaLocal(0.42), z: aaLocalZ(0.59), title: "Central park" };
  places["market"] = { x: aaLocal(0.55), z: aaLocalZ(0.55), title: "Market" };
  places["metro"] = { x: aaLocal(0.6), z: aaLocalZ(0.47), title: "Metro station" };

  // Knowledge campus in the Knowledge & IT zone: quads, library tower, dorms, sports field.
  const knowledge = zoneRects.find((zone) => zone.id === "zone-knowledge");
  const campusAt = placeNear(rng, knowledge ? { x: knowledge.x - knowledge.w * 0.12, z: knowledge.z } : centre, 900);
  places["campus"] = { x: campusAt.x, z: campusAt.z, title: "Campus" };
  landmark("campus", campusAt.x, campusAt.z, "Campus", (batch, at) => {
    const b = (material, lx, ly, lz, sx, sy, sz, rotY) => batch.box(material, at.x + lx, at.pad + ly, at.z + lz, sx, sy, sz, rotY);
    const g = (material, lx, lz, sx, sz, h = 0.2) => b(material, lx, 0, lz, sx, h, sz);
    // Quad lawn and paths.
    g(greenMat, 0, 0, 320, 220, 0.24);
    g(pavingMat, 0, 0, 26, 300, 0.26);
    g(pavingMat, 0, 0, 220, 40, 0.26);
    // Library tower.
    b(stoneMat, -120, 0, -120, 46, 44, 46);
    b(windowMat, -120, 2, -120, 46.4, 18, 46.4);
    b(roofMat, -120, 44, -120, 48, 1, 48);
    b(metalMat, -120, 45, -120, 10, 6, 10);
    // Teaching bars around the quad.
    for (let i = 0; i < 3; i++) {
      b(plasterMat, -260 + i * 200, 0, 150, 150, 16 + (i % 2) * 4, 26);
      b(windowMat, -260 + i * 200, 1.2, 150, 150.3, 11, 26.3);
      b(roofMat, -260 + i * 200, 16 + (i % 2) * 4, 150, 152, 1, 28);
    }
    // Dorm slabs.
    for (let i = 0; i < 3; i++) {
      b(wallWarmMat, 260, 0, -160 + i * 90, 90, 22, 18);
      for (let f = 1; f < 6; f++) b(windowMat, 260, f * 3.6, -160 + i * 90, 90.3, 1.6, 18.3);
      b(roofMat, 260, 22, -160 + i * 90, 92, 0.6, 20);
    }
    // Sports field with track.
    b(mat(0x6f8f55, { roughness: 0.98 }), 0, 0, -250, 260, 0.3, 140);
    ellipseRing(batch, mat(0xb4693a, { roughness: 0.95 }), at.x, at.z - 250, at.pad + 0.34, 110, 58, 4, 0.2, 36);
    b(whiteMat, 0, 0, -250, 160, 0.4, 1.5);
    b(whiteMat, 0, 0, -250, 1.5, 0.4, 90);
    addLabel(labels, { id: "campus-note", text: "University campus", x: at.x, y: at.pad + 52, z: at.z, tier: "building" });
    return { labelY: 60, collider: rect(at.x - 330, at.x + 330, at.z - 330, at.z + 200) };
  });

  // Tech park: glass office clusters, greens and a parking edge.
  const techAt = placeNear(rng, knowledge ? { x: knowledge.x + knowledge.w * 0.26, z: knowledge.z + knowledge.d * 0.1 } : { x: centre.x + 1500, z: centre.z + 1500 }, 700);
  places["tech-park"] = { x: techAt.x, z: techAt.z, title: "Tech park" };
  landmark("tech-park", techAt.x, techAt.z, "Tech park", (batch, at) => {
    const b = (material, lx, ly, lz, sx, sy, sz) => batch.box(material, at.x + lx, at.pad + ly, at.z + lz, sx, sy, sz);
    b(greenMat, 0, 0, 0, 420, 0.2, 320);
    for (let i = 0; i < 4; i++) {
      const lx = -150 + (i % 2) * 300;
      const lz = -90 + Math.floor(i / 2) * 190;
      b(plasterMat, lx, 0, lz, 120, 18 + (i % 3) * 6, 50);
      for (let f = 1; f < 5; f++) b(windowMat, lx, f * 3.8, lz, 120.4, 1.8, 50.4);
      b(roofMat, lx, 18 + (i % 3) * 6, lz, 122, 0.8, 52);
    }
    b(windowMat, 0, 0, 0, 60, 24, 60);
    b(roofMat, 0, 24, 0, 62, 1, 62);
    b(waterMat, 0, 0.3, 0, 30, 0.2, 30);
    addLabel(labels, { id: "tech-park-note", text: "Tech offices", x: at.x, y: at.pad + 34, z: at.z, tier: "building" });
    return { labelY: 34, collider: rect(at.x - 220, at.x + 220, at.z - 170, at.z + 170) };
  });

  // Logistics hub: warehouse rows, container yard, gantry cranes, truck apron.
  const logistics = zoneRects.find((zone) => zone.id === "zone-logistics");
  const logAt = placeNear(rng, logistics ? { x: logistics.x, z: logistics.z } : { x: centre.x - 2200, z: centre.z + 1800 }, 1200);
  places["logistics-hub"] = { x: logAt.x, z: logAt.z, title: "Logistics hub" };
  landmark("logistics-hub", logAt.x, logAt.z, "Logistics hub", (batch, at) => {
    const b = (material, lx, ly, lz, sx, sy, sz) => batch.box(material, at.x + lx, at.pad + ly, at.z + lz, sx, sy, sz);
    b(pavingMat, 0, 0, 0, 760, 0.24, 460);
    for (let i = 0; i < 4; i++) {
      const lz = -150 + i * 100;
      b(plasterMat, -90, 0, lz, 360, 11, 70);
      b(roofMat, -90, 11, lz, 362, 0.8, 72);
      b(windowMat, -90, 7, lz + 36, 300, 2.6, 0.3);
      for (let d = 0; d < 5; d++) b(darkMat, -240 + d * 72, 0, lz + 36, 14, 5.4, 0.6);
    }
    // Container stacks.
    const colors = [0xb5563a, 0x3d6d84, 0x8a8f56, 0x9c7b4e];
    for (let ix = -3; ix <= 3; ix++) {
      for (let iz = 0; iz < 3; iz++) {
        for (let s = 0; s < 3; s++) {
          b(colors[(ix + iz + s + 4) % 4], 150 + ix * 16, s * 2.6, -150 + iz * 26, 14, 2.5, 6);
        }
      }
    }
    // Gantry cranes over the yard.
    for (let c = 0; c < 2; c++) {
      const gx = 120 + c * 160;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) b(steelMat, gx + sx * 30, 0, sz * 90, 2.2, 26, 2.2);
      b(steelMat, gx, 26, 0, 66, 2, 4);
      b(steelMat, gx, 22, 0, 4, 2, 190);
      b(darkMat, gx, 20, 30, 8, 3, 8);
    }
    // Office and guard block.
    b(whiteMat, -330, 0, -180, 70, 18, 40);
    for (let f = 1; f < 5; f++) b(windowMat, -330, f * 3.6, -180, 70.5, 1.6, 40.5);
    b(roofMat, -330, 18, -180, 72, 0.8, 42);
    addLabel(labels, { id: "logistics-note", text: "Warehouses", x: at.x - 90, y: at.pad + 24, z: at.z, tier: "building" });
    return { labelY: 44, collider: rect(at.x - 380, at.x + 380, at.z - 230, at.z + 230) };
  });

  // Aerocity: hotels and offices on the airport link.
  const link = layout.airportLink;
  const linkPoint = pointAlong(link, 0.35);
  const aeroAt = placeNear(rng, linkPoint, 900);
  places["aerocity"] = { x: aeroAt.x, z: aeroAt.z, title: "Aerocity" };
  landmark("aerocity", aeroAt.x, aeroAt.z, "Aerocity", (batch, at) => {
    const b = (material, lx, ly, lz, sx, sy, sz) => batch.box(material, at.x + lx, at.pad + ly, at.z + lz, sx, sy, sz);
    b(pavingMat, 0, 0, 0, 560, 0.22, 380);
    b(greenMat, 0, 0.22, 30, 180, 0.2, 120);
    // Two hotel towers.
    for (let t = 0; t < 2; t++) {
      const lx = -190 + t * 110;
      b(whiteMat, lx, 0, -110, 60, 20, 40);
      b(windowMat, lx, 1.2, -110, 60.4, 16, 40.4);
      b(stoneMat, lx, 20, -110, 60, 34, 26);
      for (let f = 1; f < 10; f++) b(windowMat, lx, 20 + f * 3.4, -110, 60.4, 1.8, 26.4);
      b(roofMat, lx, 54, -110, 62, 0.8, 28);
      b(waterMat, lx, 20.3, -110, 40, 0.2, 16);
    }
    // Office bars.
    for (let i = 0; i < 3; i++) {
      b(plasterMat, 180, 0, -100 + i * 100, 110, 22 + i * 4, 40);
      for (let f = 1; f < 6; f++) b(windowMat, 180, f * 3.7, -100 + i * 100, 110.4, 1.8, 40.4);
      b(roofMat, 180, 22 + i * 4, -100 + i * 100, 112, 0.8, 42);
    }
    // Retail plinth and parking deck.
    b(wallAltMat, 0, 0, 160, 260, 8, 60);
    b(windowMat, 0, 1, 160, 260.4, 4, 60.4);
    b(roofMat, 0, 8, 160, 262, 0.8, 62);
    b(pavingMat, 230, 0, 150, 130, 0.2, 120);
    addLabel(labels, { id: "aerocity-note", text: "Airport city", x: at.x, y: at.pad + 58, z: at.z, tier: "building" });
    return { labelY: 62, collider: rect(at.x - 300, at.x + 300, at.z - 220, at.z + 220) };
  });

  // Port: quay, breakwater, cranes, container yard and sheds on the gulf shore.
  const portZ = devBox.minZ + (devBox.maxZ - devBox.minZ) * 0.62;
  const portX = layout.shoreX - 900;
  places["port"] = { x: portX, z: portZ, title: "Port" };
  landmark("port", portX, portZ, "Port", (batch, at) => {
    const b = (material, lx, ly, lz, sx, sy, sz) => batch.box(material, at.x + lx, at.pad + ly, at.z + lz, sx, sy, sz);
    // Quay platform runs into the water.
    b(stoneMat, 150, 0, 0, 700, 3.2, 420);
    b(pavingMat, 150, 3.2, 0, 680, 0.2, 400);
    // Breakwater arms.
    b(stoneMat, 640, 0, -260, 46, 3.6, 340);
    b(stoneMat, 640, 0, 260, 46, 3.6, 340);
    // Four gantry cranes on rails.
    for (let c = 0; c < 4; c++) {
      const gx = -120 + c * 150;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) b(steelMat, gx + sx * 34, 3.3, sz * 110, 3, 34, 3);
      b(steelMat, gx, 37, 0, 78, 3, 5);
      b(steelMat, gx - 30, 34, 0, 5, 3, 130);
      b(darkMat, gx - 30, 28, 40, 10, 4, 10);
      b(copperMat, gx, 39, 0, 20, 3, 6);
    }
    // Container yard.
    const colors = [0xb5563a, 0x3d6d84, 0x8a8f56, 0x9c7b4e];
    for (let ix = 0; ix < 6; ix++) {
      for (let iz = 0; iz < 4; iz++) {
        for (let s = 0; s < 3; s++) b(colors[(ix + iz + s) % 4], -260 + ix * 17, 3.3 + s * 2.6, 120 + iz * 24, 15, 2.5, 6);
      }
    }
    // Warehouses and offices.
    for (let i = 0; i < 3; i++) {
      b(plasterMat, -150 + i * 170, 3.2, -110, 130, 13, 60);
      b(roofMat, -150 + i * 170, 16.2, -110, 132, 0.8, 62);
      b(darkMat, -150 + i * 170, 3.2, -78, 90, 6, 0.5);
    }
    b(whiteMat, -330, 3.2, 0, 44, 30, 44);
    for (let f = 1; f < 7; f++) b(windowMat, -330, 3.2 + f * 4, 0, 44.5, 1.8, 44.5);
    b(roofMat, -330, 33.2, 0, 46, 0.8, 46);
    // Beacons at the quay heads.
    b(lampMat, 640, 4, -410, 2, 8, 2);
    b(lampMat, 640, 4, 410, 2, 8, 2);
    addLabel(labels, { id: "port-note", text: "Cargo quay", x: at.x + 200, y: at.pad + 44, z: at.z, tier: "building" });
    return { labelY: 48, collider: rect(at.x - 420, at.x + 700, at.z - 300, at.z + 300) };
  });

  // A couple of smaller district anchors so the far bands read as places, not texture.
  const sportsZone = zoneRects.find((zone) => zone.id === "zone-sports");
  if (sportsZone) {
    const s = placeNear(rng, { x: sportsZone.x, z: sportsZone.z }, 700);
    const batch = createBatch();
    const green = mat(0x7fa05a, { roughness: 0.98 });
    batch.box(green, s.x, baseY, s.z, 420, 0.24, 320);
    ellipseRing(batch, mat(0xb4693a, { roughness: 0.95 }), s.x, s.z, baseY + 0.3, 170, 120, 6, 0.2, 48);
    batch.box(whiteMat, s.x, baseY + 0.28, s.z, 230, 0.4, 2);
    batch.box(whiteMat, s.x, baseY + 0.28, s.z, 2, 0.4, 120);
    batch.build(groups.built, "sports-fields");
    drawMeshes += 1;
  }

  /* ---------------- places for the game ---------------- */

  for (const [id, place] of Object.entries(places)) {
    if (!place.x || !Number.isFinite(place.x)) {
      const fallback = layout.namedPoints[id] ?? centre;
      place.x = fallback.x;
      place.z = fallback.z;
    }
  }

  addLabel(labels, { id: "district", text: "Town planning areas", x: centre.x, y: 64, z: centre.z + 3000, tier: "zone" });

  return {
    update() {},
    colliders,
    places,
    stats: { buildings, drawMeshes, places: Object.keys(places).length },
  };

  /* ---------------- helpers (hoisted) ---------------- */

  function aaLocal(fx) {
    return aa.minX + fx * aa.width;
  }
  function aaLocalZ(fz) {
    return aa.minZ + fz * aa.height;
  }

  function rect(minX, maxX, minZ, maxZ) {
    return { minX, maxX, minZ, maxZ };
  }

  /** Nudge a preferred landmark site until it clears the exclusions. */
  function placeNear(rnd, preferred, radius) {
    let best = null;
    let bestScore = -1;
    for (let i = 0; i < 26; i++) {
      const angle = rnd() * Math.PI * 2;
      const dist = i === 0 ? 0 : radius * (0.3 + rnd() * 0.7);
      const x = preferred.x + Math.cos(angle) * dist;
      const z = preferred.z + Math.sin(angle) * dist;
      if (!insidePoly(dev, x, z)) continue;
      if (blocked(x, z, 260)) continue;
      const score = 1 - dist / radius;
      if (score > bestScore) {
        best = { x, z };
        bestScore = score;
      }
    }
    if (best) return best;
    // Fall back to a point on the developable ring.
    for (let i = 0; i < 60; i++) {
      const p = dev[Math.floor(rnd() * dev.length)];
      if (!blocked(p.x, p.z, 500)) return { x: p.x * 0.82 + centre.x * 0.18, z: p.z * 0.82 + centre.z * 0.18 };
    }
    return { x: preferred.x, z: preferred.z };
  }
}

/* ------------------------------------------------------------------ */

/** Flat unit quad used for street ribbons (2 triangles per draw). */
function flatQuad() {
  const geo = new THREE.PlaneGeometry(1, 1);
  geo.rotateX(-Math.PI / 2);
  return geo;
}

function detailPick(zone, rnd) {
  const r = rnd();
  if (zone === "zone-industrial" || zone === "zone-logistics") return r < 0.5 ? "shedA" : r < 0.8 ? "warehouseA" : "retailA";
  if (zone === "zone-knowledge") return r < 0.4 ? "techA" : r < 0.7 ? "towerA" : "apartmentA";
  if (zone === "zone-residential") return r < 0.5 ? "apartmentA" : r < 0.8 ? "midriseA" : "retailA";
  return r < 0.5 ? "towerA" : r < 0.75 ? "retailA" : "apartmentA";
}

function segmentDistance(x, z, points) {
  let best = Infinity;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / len2));
    const px = a.x + dx * t;
    const pz = a.z + dz * t;
    best = Math.min(best, Math.hypot(x - px, z - pz));
  }
  return best;
}

function pointAlong(points, t) {
  let total = 0;
  const lens = [];
  for (let i = 1; i < points.length; i++) {
    const len = Math.hypot(points[i].x - points[i - 1].x, points[i].z - points[i - 1].z);
    lens.push(len);
    total += len;
  }
  let left = total * t;
  for (let i = 1; i < points.length; i++) {
    const len = lens[i - 1];
    if (left <= len) {
      const u = left / (len || 1);
      return { x: points[i - 1].x + (points[i].x - points[i - 1].x) * u, z: points[i - 1].z + (points[i].z - points[i - 1].z) * u };
    }
    left -= len;
  }
  return { ...points[points.length - 1] };
}
