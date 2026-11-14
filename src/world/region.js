import * as THREE from "three";
import { layout, pointOnPolyline } from "../geo/layout.js";
import {
  paint,
  mat,
  headlightMat,
  taillightMat,
  beaconMat,
  runwayLightMat,
  windowMat,
  lampMat,
  wallMat,
  wallWarmMat,
  wallAltMat,
  plasterMat,
  whiteMat,
  stoneMat,
  roofMat,
  metalMat,
  steelMat,
  copperMat,
  darkMat,
  greenMat,
  lawnMat,
  waterMat,
  plazaMat,
  pavingMat,
  sidewalkMat,
  markingMat,
  foliageMat,
  barkMat,
} from "./materials.js";
import { makePrism, makeSegment, outline, tag, addLabel } from "./meshkit.js";
import { yawAlignLocalZ } from "../frame.js";
import { createBatch, makeRng, instanceParts } from "./buildkit.js";

/**
 * Region: the 920 km² plinth, the corridors, and the big pieces outside the city blocks —
 * airport, solar park, 22 village settlements, coastal works. Static geometry is merged per
 * material; repeated pieces are instanced. Animations are kept from the original module.
 */

function lengthOf(points) {
  let n = 0;
  for (let i = 1; i < points.length; i++) n += Math.hypot(points[i].x - points[i - 1].x, points[i].z - points[i - 1].z);
  return n;
}

export function buildRegion(groups, labels) {
  const pad = layout.pad;
  const sirBatch = createBatch();
  sirBatch.add("box", paint.plinth, layout.sirCentroid?.x ?? 0, 0, layout.sirCentroid?.z ?? 0, 1, 1, 1);
  // The plinth itself is a prism of the SIR polygon; the batch cannot extrude a polygon, so prune it.
  sirBatch.finish();
  const sir = makePrism(layout.sir, 0, pad, mat(paint.plinth, { roughness: 0.96 }));
  tag(sir, "sir");
  groups.zones.parent.add(sir);
  groups.zones.parent.add(outline(layout.sir, pad + 1.4, paint.copper));

  buildCorridors(groups);
  const airport = buildAirport(groups, labels);
  buildSolar(groups, labels);
  buildVillages(groups, labels);
  buildCoast(groups, labels);
  buildDirections(groups, labels);

  const vehicles = buildVehicles();
  groups.roads.add(vehicles.group);

  const train = buildTrain(groups);
  const ships = buildShips(groups);

  addLabel(labels, { id: "sir", text: "Dholera SIR", x: centroid(layout.sir).x, y: 40, z: centroid(layout.sir).z, tier: "region" });
  addLabel(labels, { id: "expressway", text: "Expressway", x: layout.expressway[2].x, y: 30, z: layout.expressway[2].z, tier: "region" });
  addLabel(labels, { id: "gulf", text: "Gulf of Khambhat", x: layout.shoreX + 2500, y: 20, z: centroid(layout.sir).z, tier: "region" });

  return {
    update(time) {
      vehicles.update(time);
      if (train) train.update(time);
      if (ships) ships.update(time);
      if (airport) airport.update(time);
    },
    sample(time) {
      return vehicles.sample(time);
    },
  };
}

function centroid(poly) {
  let x = 0;
  let z = 0;
  for (const p of poly) {
    x += p.x;
    z += p.z;
  }
  return { x: x / poly.length, z: z / poly.length };
}

/* ------------------------------ corridors ------------------------------ */

function buildCorridors(groups) {
  const yRoad = layout.pad + 0.55;
  const batch = createBatch();
  const seg = (points, width, material, y) => {
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      const len = Math.hypot(b.x - a.x, b.z - a.z);
      if (len < 0.1) continue;
      batch.box(material, (a.x + b.x) / 2, y, (a.z + b.z) / 2, width, 0.32, len, Math.atan2(b.x - a.x, b.z - a.z));
    }
  };
  seg(layout.expressway, 380, paint.express, yRoad);
  // Expressway median and edge lines.
  for (let i = 1; i < layout.expressway.length; i++) {
    const a = layout.expressway[i - 1];
    const b = layout.expressway[i];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len = Math.hypot(dx, dz) || 1;
    const nx = -dz / len;
    const nz = dx / len;
    for (const side of [-1, 1]) {
      batch.box(paint.concrete, (a.x + b.x) / 2 + nx * 90 * side, yRoad + 0.2, (a.z + b.z) / 2 + nz * 90 * side, 2, 0.35, len, Math.atan2(dx, dz));
    }
  }
  seg(layout.airportLink, 220, paint.express, yRoad);
  seg(layout.nh751, 200, paint.highway, yRoad + 0.15);
  seg(layout.rail, 90, paint.rail, yRoad + 0.3);
  // Freight rail ballast + sleepers, cheap.
  for (let i = 1; i < layout.rail.length; i++) {
    const a = layout.rail[i - 1];
    const b = layout.rail[i];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len = Math.hypot(dx, dz);
    const nx = (-dz / (len || 1)) * 34;
    const nz = (dx / (len || 1)) * 34;
    batch.box(paint.concreteDark, (a.x + b.x) / 2 + nx, yRoad + 0.18, (a.z + b.z) / 2 + nz, 6, 0.3, len, Math.atan2(dx, dz));
    batch.box(paint.concreteDark, (a.x + b.x) / 2 - nx, yRoad + 0.18, (a.z + b.z) / 2 - nz, 6, 0.3, len, Math.atan2(dx, dz));
  }
  batch.build(groups.roads, "expressway");
}

/* -------------------------------- airport -------------------------------- */

function buildAirport(groups, labels) {
  const { x, z } = layout.airport;
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = 0.55;

  const batch = createBatch();
  const b = (material, lx, ly, lz, sx, sy, sz, rotY = 0) => batch.box(material, lx, ly, lz, sx, sy, sz, rotY);
  const cyl = (material, lx, ly, lz, r, h) => batch.add("cyl", material, lx, ly, lz, r, h, r);

  // Runway + shoulders + centerline + threshold bars.
  b(paint.asphalt, 0, 0.2, 0, 64, 0.4, 3300);
  b(paint.concreteDark, 0, 0.32, 0, 48, 0.2, 3200);
  for (let i = 0; i < 40; i++) b(paint.concrete, 0, 0.42, -1480 + i * 74, 1.4, 0.1, 34);
  for (const zt of [-1560, 1560]) {
    for (let i = -3; i <= 3; i++) b(paint.concrete, i * 6, 0.42, zt, 2.4, 0.1, 28);
  }
  // Parallel taxiway + connectors.
  b(paint.road, 128, 0.32, 0, 24, 0.2, 3000);
  for (const zc of [-1200, -500, 200, 900, 1400]) b(paint.road, 64, 0.32, zc, 140, 0.2, 24);
  // Apron.
  b(paint.concreteDark, 300, 0.3, -80, 280, 0.2, 900);
  // Terminal: glazed two-storey with a long roof and landside canopy.
  b(plasterMat, 300, 0.4, -240, 64, 16, 260);
  b(windowMat, 270, 1.2, -240, 6, 12, 250);
  b(roofMat, 300, 16.4, -240, 70, 1, 268);
  b(plasterMat, 340, 0.4, -240, 26, 9, 240);
  b(roofMat, 352, 9.4, -240, 22, 0.6, 250);
  // Airside concourse fingers.
  for (let i = 0; i < 6; i++) {
    const gz = -560 + i * 120;
    b(plasterMat, 250, 0.4, gz, 40, 7, 22);
    b(windowMat, 258, 1.2, gz, 3, 4.4, 20);
    b(steelMat, 228, 5, gz, 44, 0.5, 24);
    // Jet bridge.
    b(metalMat, 215, 4.6, gz, 34, 3.4, 6);
    b(windowMat, 215, 5.2, gz, 30, 1.6, 6.2);
    for (const dx of [-12, 12]) b(steelMat, 201 + dx, 0.4, gz, 1.4, 4.6, 3);
    // Aircraft stand markings.
    b(paint.concrete, 172, 0.34, gz, 1, 0.08, 34);
  }
  // Control tower with radar.
  b(stoneMat, 178, 0.4, -60, 16, 34, 16);
  b(windowMat, 178, 30, -60, 18, 6, 18);
  b(roofMat, 178, 36, -60, 20, 0.8, 20);
  b(steelMat, 178, 36.8, -60, 0.8, 16, 0.8);
  b(metalMat, 178, 52.8, -60, 12, 0.8, 1.4);
  // Cargo terminal and hangars.
  b(plasterMat, -270, 0.4, -820, 150, 12, 90);
  b(roofMat, -270, 12.4, -820, 156, 0.8, 96);
  for (let i = 0; i < 3; i++) {
    const hz = 860 + i * 150;
    b(plasterMat, -270, 0.4, hz, 96, 14, 80);
    batch.add("gable", roofMat, -270, 14.4, hz, 100, 10, 84);
    b(darkMat, -270, 0.4, hz + 39, 70, 10, 0.6);
  }
  // Fuel farm.
  for (let i = 0; i < 3; i++) {
    cyl(whiteMat, -230, 0.4, -330 + i * 34, 13, 14);
    cyl(metalMat, -230, 14.4, -330 + i * 34, 13.4, 0.6);
  }
  // Landside car park and access road.
  b(paint.road, 470, 0.32, -120, 26, 0.2, 700);
  b(paint.road, 400, 0.32, 60, 160, 0.2, 24);
  b(paint.concreteDark, 440, 0.3, -420, 160, 0.2, 260);
  // Perimeter fence (thin walls).
  for (const side of [-1, 1]) {
    b(paint.concrete, side * 760, 1.6, 0, 1.4, 3.2, 3400);
    b(paint.concrete, 0, 1.6, side * 1700, 1520, 3.2, 1.4);
  }
  // Approach lighting along the runway.
  for (let i = 0; i < 14; i++) {
    for (const side of [-1, 1]) {
      b(paint.runwayLight, side * 30, 0.6, -1680 - i * 30, 1.4, 1.4, 1.4);
      b(paint.runwayLight, side * 30, 0.6, 1680 + i * 30, 1.4, 1.4, 1.4);
    }
  }

  const meshes = batch.finish();
  const airportGroup = new THREE.Group();
  const staticBatch = createBatch();
  void staticBatch;
  for (const part of meshes) {
    const mesh = new THREE.Mesh(part.geometry, part.material);
    airportGroup.add(mesh);
  }
  // A few parked airliners.
  const planeParts = compilePlane();
  const parked = [
    { x: 172, z: -560 - 120 * 0.0, rotY: Math.PI },
    { x: 172, z: 200, rotY: 0 },
  ];
  const planePoses = parked.map((p) => ({ x: p.x, y: 0.5, z: p.z + 140, rotY: 0, scale: 1 }));
  const planeMeshes = instanceParts(airportGroup, planeParts, planePoses, "airport");
  // Two taxiing aircraft: animated instanced copies sharing the same prefab.
  const taxiCount = 2;
  const taxiMatrices = planeMeshes.map((mesh) => {
    const taxi = new THREE.InstancedMesh(mesh.geometry, mesh.material, taxiCount + 2);
    for (let i = 0; i < 2; i++) taxi.setMatrixAt(i, parked[i].matrix ?? new THREE.Matrix4());
    taxi.instanceMatrix.needsUpdate = true;
    return null;
  });
  void taxiMatrices;
  // Simpler + cheaper: a small group of moving planes, merged per material with 2 instances.
  const taxiBatchers = new Map();
  for (let i = 0; i < planeParts.length; i++) {
    const dummyMeshes = new THREE.InstancedMesh(planeParts[i].geometry, planeParts[i].material, taxiCount);
    dummyMeshes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    tag(dummyMeshes, "airport");
    airportGroup.add(dummyMeshes);
    taxiBatchers.set(i, dummyMeshes);
  }

  group.add(airportGroup);
  tag(group, "airport");
  groups.planned.add(group);
  addLabel(labels, { id: "airport", text: "Airport", x, y: 60, z, tier: "region" });

  const dummy = new THREE.Object3D();
  function update(time) {
    for (let i = 0; i < taxiCount; i++) {
      const t = (time * 0.035 + i * 0.5) % 1;
      const localZ = -300 + t * 2400;
      dummy.position.set(128, 0.5, localZ);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      for (const mesh of taxiBatchers.values()) mesh.setMatrixAt(i, dummy.matrix);
    }
    for (const mesh of taxiBatchers.values()) mesh.instanceMatrix.needsUpdate = true;
    beaconMat.emissiveIntensity = Math.sin(time * 6) > 0.2 ? 3.5 : 0.3;
  }
  update(0);

  return { update };
}

/** Simple airliner prefab: fuselage, wings, tail, engines — 4 materials. */
function compilePlane() {
  const batch = createBatch();
  const b = (material, x, y, z, sx, sy, sz) => batch.box(material, x, y, z, sx, sy, sz);
  b(whiteMat, 0, 0, 0, 5, 5, 44);
  b(whiteMat, 0, -1, -24, 4, 3.4, 8);
  b(whiteMat, 0, -2.4, 24, 3.4, 2.6, 6);
  b(metalMat, 0, -0.6, 4, 40, 0.8, 7);
  b(metalMat, 0, -0.4, 22, 16, 0.6, 4);
  b(copperMat, 0, 4, 20, 0.7, 7, 7);
  b(darkMat, -8, -2.8, 2, 4, 3.6, 8);
  b(darkMat, 8, -2.8, 2, 4, 3.6, 8);
  b(lampMat, 0, 5, -22, 1.2, 1.2, 1.2);
  return batch.finish();
}

/* ------------------------------- solar park ------------------------------- */

function buildSolar(groups, labels) {
  const { x, z } = layout.solar;
  const pad = layout.pad;
  const rng = makeRng(9911);
  const cols = 118;
  const rows = 88;
  const count = cols * rows;
  const panelGeo = new THREE.PlaneGeometry(10, 2.4);
  panelGeo.rotateX(-Math.PI / 2 + 0.55);
  const panels = new THREE.InstancedMesh(panelGeo, mat(paint.solar, { roughness: 0.35, metalness: 0.45, side: THREE.DoubleSide }), count);
  const dummy = new THREE.Object3D();
  let n = 0;
  for (let ix = 0; ix < cols; ix++) {
    for (let iz = 0; iz < rows; iz++) {
      const px = x - 1180 + ix * 20 + (rng() - 0.5) * 1.4;
      const pz = z - 880 + iz * 20 + (rng() - 0.5) * 1.4;
      if (!pointIn(layout.sir, px, pz)) continue;
      dummy.position.set(px, pad + 1.4, pz);
      dummy.rotation.set(0, 0.35, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      panels.setMatrixAt(n, dummy.matrix);
      n += 1;
    }
  }
  panels.count = n;
  panels.instanceMatrix.needsUpdate = true;
  panels.computeBoundingSphere();
  tag(panels, "solar");
  groups.built.add(panels);

  // Inverter cabins, service roads, fence, planted berm.
  const batch = createBatch();
  for (let i = 0; i < 8; i++) {
    batch.box(paint.concrete, x - 1000 + i * 280, pad, z + 960, 26, 6, 14);
  }
  for (let i = 0; i < 6; i++) {
    batch.box(paint.concreteDark, x - 1100 + i * 420, pad + 0.1, z - 960, 16, 0.3, 1860);
  }
  for (let i = 0; i < 5; i++) {
    batch.box(paint.concreteDark, x - 1180 + i * 560, pad + 0.1, z + 30, 0.3, 0.3, 1840);
  }
  for (const [sx, sz, w, d] of [[0, -1, 2480, 2], [0, 1, 2480, 2], [-1, 0, 2, 2000], [1, 0, 2, 2000]]) {
    batch.box(paint.concrete, x + (sx * 2480) / 2, pad + 1.4, z + (sz * 2000) / 2, w, 1.2, d);
  }
  batch.build(groups.built, "solar");
  addLabel(labels, { id: "solar", text: "Solar park", x, y: 26, z, tier: "zone" });
}

/* -------------------------------- villages -------------------------------- */

function buildVillages(groups, labels) {
  const pad = layout.pad;
  const rng = makeRng(5150);
  const housePoses = [];
  const tankPoses = [];
  const templePoses = [];
  const fieldPoses = [];
  const treeSpots = [];
  const lanePoses = [];
  const colors = [0xf0e4cc, 0xe4d2b2, 0xd8c3a0, 0xecdcc0, 0xdccaa8, 0xf2e8d4];

  for (const village of layout.pinned) {
    const count = 9 + Math.floor(rng() * 9);
    const spread = 120 + rng() * 60;
    for (let i = 0; i < count; i++) {
      const a = rng() * Math.PI * 2;
      const r = 30 + rng() * spread;
      const hx = village.x + Math.cos(a) * r;
      const hz = village.z + Math.sin(a) * r;
      housePoses.push({ x: hx, y: pad + 0.4, z: hz, rotY: -a, scale: 0.85 + rng() * 0.5, color: colors[Math.floor(rng() * colors.length)] });
      if (rng() < 0.5) treeSpots.push({ x: hx + 12, z: hz + 9 });
    }
    // Water tank on stilts at the village centre.
    tankPoses.push({ x: village.x, y: pad + 0.4, z: village.z, rotY: 0, scale: 1 });
    // Temple beside it.
    templePoses.push({ x: village.x + 26, y: pad + 0.4, z: village.z - 18, rotY: rng() * Math.PI, scale: 0.9 + rng() * 0.4 });
    // Fields on the outskirts.
    for (let f = 0; f < 4; f++) {
      const a = rng() * Math.PI * 2;
      const r = spread + 70 + rng() * 140;
      fieldPoses.push({
        x: village.x + Math.cos(a) * r,
        y: pad + 0.16,
        z: village.z + Math.sin(a) * r,
        rotY: a,
        scale: 0.8 + rng() * 0.6,
        color: rng() < 0.5 ? 0x8fa25c : rng() < 0.6 ? 0xa9a05e : 0x7d8f52,
      });
    }
    // A small lane through the settlement.
    lanePoses.push({ x: village.x, y: pad + 0.28, z: village.z, rotY: rng() * Math.PI, scale: 1 });
    addLabel(labels, { id: `village-${village.id}`, text: village.name, x: village.x, y: 40, z: village.z, tier: "village" });
  }

  const houseParts = compileVillageHouse();
  instanceParts(groups.villages, houseParts, housePoses, "villages");
  const tankParts = compileWaterTank();
  instanceParts(groups.villages, tankParts, tankPoses, "villages");
  const templeParts = compileTemple();
  instanceParts(groups.villages, templeParts, templePoses, "villages");

  const fieldGeo = new THREE.PlaneGeometry(1, 1);
  fieldGeo.rotateX(-Math.PI / 2);
  const fields = new THREE.InstancedMesh(fieldGeo, lawnMat, fieldPoses.length);
  const dummy = new THREE.Object3D();
  fieldPoses.forEach((pose, i) => {
    dummy.position.set(pose.x, pose.y, pose.z);
    dummy.rotation.set(0, pose.rotY, 0);
    dummy.scale.set(130 * pose.scale, 1, 90 * pose.scale);
    dummy.updateMatrix();
    fields.setMatrixAt(i, dummy.matrix);
    if (!fields.instanceColor) fields.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(fieldPoses.length * 3), 3);
    fields.instanceColor.setXYZ(i, ((pose.color >> 16) & 255) / 255, ((pose.color >> 8) & 255) / 255, (pose.color & 255) / 255);
  });
  fields.instanceMatrix.needsUpdate = true;
  if (fields.instanceColor) fields.instanceColor.needsUpdate = true;
  groups.villages.add(fields);

  const laneGeo = new THREE.PlaneGeometry(1, 1);
  laneGeo.rotateX(-Math.PI / 2);
  const lanes = new THREE.InstancedMesh(laneGeo, pavingMat, lanePoses.length);
  lanePoses.forEach((pose, i) => {
    dummy.position.set(pose.x, pose.y, pose.z);
    dummy.rotation.set(0, pose.rotY, 0);
    dummy.scale.set(9, 1, 190);
    dummy.updateMatrix();
    lanes.setMatrixAt(i, dummy.matrix);
  });
  lanes.instanceMatrix.needsUpdate = true;
  groups.villages.add(lanes);

  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.3, 0.45, 3, 5), barkMat, treeSpots.length);
  const leaf = new THREE.InstancedMesh(new THREE.ConeGeometry(2.8, 7, 6), foliageMat, treeSpots.length);
  treeSpots.forEach((spot, i) => {
    dummy.position.set(spot.x, pad + 1.5, spot.z);
    dummy.rotation.set(0, (i * 0.7) % Math.PI, 0);
    dummy.scale.setScalar(0.8 + ((i * 29) % 40) / 100);
    dummy.updateMatrix();
    trunk.setMatrixAt(i, dummy.matrix);
    dummy.position.y = pad + 4.4;
    dummy.updateMatrix();
    leaf.setMatrixAt(i, dummy.matrix);
  });
  trunk.instanceMatrix.needsUpdate = true;
  leaf.instanceMatrix.needsUpdate = true;
  groups.villages.add(trunk, leaf);
  void rng;
}

function compileVillageHouse() {
  const batch = createBatch();
  const w = 16;
  const d = 12;
  const h = 4.5;
  batch.box(wallWarmMat, 0, 0, 0, w, h, d);
  batch.box(windowMat, 0, 1.4, d / 2 + 0.1, 4, 1.6, 0.2);
  batch.box(darkMat, 0, 0, d / 2 + 0.05, 2.4, 3, 0.2);
  batch.add("gable", roofMat, 0, h, 0, w + 1.6, 2.8, d + 1.6);
  batch.box(whiteMat, w * 0.28, h + 1.4, -d * 0.18, 1.2, 1.4, 1.2);
  return batch.finish();
}

function compileWaterTank() {
  const batch = createBatch();
  for (const a of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
    batch.cyl(steelMat, Math.cos(a) * 4, 0, Math.sin(a) * 4, 0.5, 11);
  }
  batch.cyl(whiteMat, 0, 11, 0, 6, 6);
  batch.cyl(roofMat, 0, 17, 0, 6.4, 0.6);
  batch.box(lampMat, 0, 17.6, 0, 1.2, 1.2, 1.2);
  return batch.finish();
}

function compileTemple() {
  const batch = createBatch();
  batch.box(stoneMat, 0, 0, 0, 16, 4, 16);
  batch.box(stoneMat, 0, 4, 0, 12, 8, 12);
  batch.add("hip", copperMat, 0, 12, 0, 13, 8, 13);
  batch.cyl(copperMat, 0, 20, 0, 1.2, 5);
  batch.box(lampMat, 0, 24.6, 0, 1, 1, 1);
  batch.box(stoneMat, 10, 0, 6, 6, 3, 6);
  return batch.finish();
}

/* --------------------------------- coast --------------------------------- */

function buildCoast(groups, labels) {
  const pad = layout.pad;
  const rng = makeRng(3100);
  const batch = createBatch();
  // A small fishing harbour north of the cargo port: quay, sheds, jetty, lighthouse.
  const harbourX = layout.shoreX - 700;
  const harbourZ = layout.namedPoints.bhavnagar
    ? layout.namedPoints.bhavnagar.z * 0.55 + layout.solar.z * 0.45
    : layout.solar.z;
  const b = (material, lx, ly, lz, sx, sy, sz) => batch.box(material, harbourX + lx, pad + ly, harbourZ + lz, sx, sy, sz);
  b(stoneMat, 0, 0, 0, 520, 4, 340);
  b(pavingMat, 0, 4, 0, 500, 0.3, 320);
  // Quay arms into the water.
  b(stoneMat, 300, 0, -120, 300, 4.4, 34);
  b(stoneMat, 300, 0, 120, 300, 4.4, 34);
  // Sheds and fish market.
  for (let i = 0; i < 4; i++) {
    b(plasterMat, -170 + i * 90, 4, -60, 76, 9, 60);
    b(roofMat, -170 + i * 90, 13, -60, 78, 0.7, 62);
    b(windowMat, -170 + i * 90, 6.4, -30, 60, 2.4, 0.3);
  }
  // Jetty piles.
  for (let i = 0; i < 10; i++) b(steelMat, 380 + i * 22, 0, 0, 1.8, 4.6, 1.8);
  b(plazaMat, 470, 4.1, 0, 220, 0.4, 18);
  // Lighthouse.
  b(whiteMat, -280, 4, 90, 9, 34, 9);
  b(redMat, -280, 38, 90, 10, 2.6, 10);
  b(lampMat, -280, 40.6, 90, 3.2, 3.2, 3.2);
  // 2 gantry cranes.
  for (let c = 0; c < 2; c++) {
    const gx = 160 + c * 130;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b(steelMat, gx + sx * 24, 4, sz * 60, 2.2, 24, 2.2);
    b(steelMat, gx, 27, 0, 56, 2.4, 4);
    b(steelMat, gx - 20, 24, 0, 4, 2.4, 90);
    b(copperMat, gx, 29, 0, 14, 2.4, 5);
  }
  // Breakwater with riprap.
  for (let i = 0; i < 26; i++) {
    const t = i / 26;
    batch.box(stoneMat, harbourX + 620 + t * 300, pad, harbourZ - 320 + t * 260, 22, 4 + rng() * 4, 22, rng() * 0.6);
  }
  batch.build(groups.built, "port");
  addLabel(labels, { id: "port-coast", text: "Fishing harbour", x: harbourX, y: 30, z: harbourZ, tier: "zone" });
}

function buildDirections(groups, labels) {
  const marks = [
    ["ahmedabad", "Ahmedabad · about 100 km"],
    ["bhavnagar", "Bhavnagar"],
    ["adhelai", "Adhelai"],
    ["bhimnath", "Bhimnath"],
  ];
  const batch = createBatch();
  for (const [id, text] of marks) {
    const p = layout.namedPoints[id];
    batch.box(paint.concrete, p.x, 0, p.z, 8, 24, 8);
    addLabel(labels, { id, text, x: p.x, y: 36, z: p.z, tier: "region" });
  }
  batch.build(groups.villages, "directions");
  // Keep picking on one representative mesh.
  const single = new THREE.Mesh(new THREE.BoxGeometry(8, 24, 8), mat(paint.concrete));
  single.position.set(0, -500, 0);
  single.visible = false;
  groups.villages.add(single);
  void single;
}

/* ------------------------------- vehicles ------------------------------- */

function buildVehicles() {
  const points = layout.expressway;
  const total = lengthOf(points);
  const count = 18;
  const group = new THREE.Group();

  const bodyMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(16, 7, 32), mat(0xf7f4ef, { roughness: 0.5 }), count);
  const headMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(12, 2.5, 2), headlightMat, count);
  const tailMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(12, 2.5, 2), taillightMat, count);
  group.add(bodyMesh, headMesh, tailMesh);

  const dummy = new THREE.Object3D();
  const dummyLight = new THREE.Object3D();
  const speeds = [];
  for (let i = 0; i < count; i++) speeds.push(38 + (i % 5) * 7);

  function pose(time, i, store) {
    const dist = (speeds[i] * time + (i / count) * total) % total;
    const p = pointOnPolyline(points, dist);
    const ahead = pointOnPolyline(points, dist + 12);
    store.position.set(p.x, layout.pad + 1.4, p.z);
    store.rotation.set(0, yawAlignLocalZ(ahead.x - p.x, ahead.z - p.z), 0);
    return p;
  }

  function update(time) {
    for (let i = 0; i < count; i++) {
      pose(time, i, dummy);
      dummy.updateMatrix();
      bodyMesh.setMatrixAt(i, dummy.matrix);
      dummyLight.copy(dummy);
      dummyLight.translateZ(16);
      dummyLight.updateMatrix();
      headMesh.setMatrixAt(i, dummyLight.matrix);
      dummyLight.copy(dummy);
      dummyLight.translateZ(-16);
      dummyLight.updateMatrix();
      tailMesh.setMatrixAt(i, dummyLight.matrix);
    }
    bodyMesh.instanceMatrix.needsUpdate = true;
    headMesh.instanceMatrix.needsUpdate = true;
    tailMesh.instanceMatrix.needsUpdate = true;
  }
  update(0);

  return {
    group,
    mesh: group,
    update,
    sample: (time) => pose(time, 0, new THREE.Object3D()),
  };
}

function buildTrain(groups) {
  const points = layout.rail;
  if (!points || points.length < 2) return null;
  const total = lengthOf(points);
  const cars = 6;
  const carLength = 26;
  const group = new THREE.Group();
  const batch = createBatch();
  const meshes = [];
  for (let c = 0; c < cars; c++) {
    const addr = c * carLength;
    batch.box(c === 0 ? paint.copper : 0x5a544d, 0, -400, addr, 9, 6, carLength - 2);
  }
  const parts = batch.finish();
  for (const part of parts) {
    const mesh = new THREE.Mesh(part.geometry, part.material);
    mesh.position.set(0, -400, 0);
    group.add(mesh);
    meshes.push({ mesh, part: true });
  }
  void meshes;
  groups.roads.add(group);
  // Individual car transforms: rebuild as instanced bodies (single material batches are per-colour, so use boxes).
  const carBodies = [];
  for (let c = 0; c < cars; c++) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(9, 6, carLength - 2), mat(c === 0 ? paint.copper : 0x5a544d, { roughness: 0.6 }));
    mesh.position.set(0, -400, 0);
    group.add(mesh);
    carBodies.push(mesh);
  }
  for (const child of [...group.children]) if (child !== carBodies[0] && !carBodies.includes(child)) group.remove(child);

  return {
    update(time) {
      const speed = 28;
      const baseDist = (speed * time) % total;
      for (let c = 0; c < cars; c++) {
        const d = (baseDist - c * carLength + total) % total;
        const p = pointOnPolyline(points, d);
        const ahead = pointOnPolyline(points, d + 4);
        carBodies[c].position.set(p.x, layout.pad + 3, p.z);
        carBodies[c].rotation.y = yawAlignLocalZ(ahead.x - p.x, ahead.z - p.z);
      }
    },
  };
}

function buildShips(groups) {
  const shipGroup = new THREE.Group();
  const ships = [
    { x0: layout.shoreX + 3200, z0: -2000, speed: 12, length: 140, width: 28 },
    { x0: layout.shoreX + 6800, z0: 4000, speed: 9, length: 180, width: 34 },
  ];

  const shipMeshes = ships.map((s) => {
    const g = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.BoxGeometry(s.width, 8, s.length), mat(0x28323e, { roughness: 0.7 }));
    hull.position.y = 4;
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(s.width * 0.75, 8, s.length * 0.25), mat(0xedebe4));
    bridge.position.set(0, 11, -s.length * 0.25);
    const mastLight = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), beaconMat);
    mastLight.position.set(0, 17, -s.length * 0.25);
    g.add(hull, bridge, mastLight);
    shipGroup.add(g);
    return { g, spec: s };
  });

  groups.water.add(shipGroup);

  return {
    update(time) {
      shipMeshes.forEach(({ g, spec }) => {
        const z = spec.z0 + ((time * spec.speed) % 18000) - 9000;
        g.position.set(spec.x0, 0.4, z);
      });
    },
  };
}

function pointIn(poly, x, z) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const zi = poly[i].z;
    const xj = poly[j].x;
    const zj = poly[j].z;
    const crosses = zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi;
    if (crosses) hit = !hit;
  }
  return hit;
}
