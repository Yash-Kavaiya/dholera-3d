import * as THREE from "three";
import { layout } from "../geo/layout.js";
import { facts } from "../content/city.js";
import { paint, mat, lampMat, windowMat, plannedMat } from "./materials.js";
import { makeBox, makeSegment, tag, addLabel } from "./meshkit.js";

const concrete = () => mat(paint.concrete, { roughness: 0.86 });

export function buildActivation(groups, labels) {
  const gnd = layout.ground;
  const aa = layout.activation;
  const pad = makeBox(aa.cx, gnd - 0.55, aa.cz, aa.width, 1.1, aa.height, mat(0xe7dfd0, { roughness: 0.95 }));
  tag(pad, "activation");
  groups.built.add(pad);

  tint(groups, "aa-industrial", layout.aaTints.industrial, 0xd7c4a4);
  tint(groups, "aa-residential", layout.aaTints.residential, 0xe4d2b4);
  tint(groups, "aa-commercial", layout.aaTints.commercial, 0xefe4d2);

  for (const line of layout.roads.lines) {
    const mesh = makeSegment(line.a, line.b, line.width, gnd + 0.2, mat(line.cls === "arterial" ? paint.arterial : paint.road));
    tag(mesh, "aa-roads");
    groups.roads.add(mesh);
  }
  addLabel(labels, { id: "aa-roads", text: "72 km of roads", x: aa.cx, y: 18, z: aa.cz, tier: "building" });

  buildCanal(groups, labels);
  buildUtilities(groups);
  buildLamps(groups);
  buildTrees(groups);
  buildPowerPylons(groups);

  const colliders = [];
  const solid = (spec, id, title, parent = groups.built, base = gnd) => {
    const mesh = block(spec, base, concrete(), id);
    parent.add(mesh);
    colliders.push(foot(spec));
    addLabel(labels, { id, text: title, x: spec.x, y: gnd + spec.h + 4, z: spec.z, tier: "building" });
    return mesh;
  };
  const ghost = (spec, id, title) => {
    const mesh = block(spec, gnd, plannedMat, id);
    groups.planned.add(mesh);
    colliders.push(foot(spec));
    addLabel(labels, { id, text: title, x: spec.x, y: gnd + spec.h + 4, z: spec.z, tier: "building" });
  };

  const bec = solid(layout.blocks.bec, "bec", "ABCD");
  dressFacade(bec, layout.blocks.bec, gnd);
  const spv = solid(layout.blocks.spv, "spv", "SPV");
  dressFacade(spv, layout.blocks.spv, gnd);

  solid(layout.blocks.stp, "stp", "Sewage plant");
  tanks(groups.built, layout.blocks.stp, gnd, "stp", 3);
  solid(layout.blocks.cetp, "cetp", "Effluent plant");
  tanks(groups.built, layout.blocks.cetp, gnd, "cetp", 4);
  solid(layout.blocks.subTorrent, "sub-torrent", "Substation");
  yard(groups.built, layout.blocks.subTorrent, gnd, "sub-torrent");
  solid(layout.blocks.subTorrentB, "sub-torrent", "Substation");
  ghost(layout.blocks.subGetco, "sub-getco", "GETCO");
  ghost(layout.blocks.semicon, "semicon", "Semicon City");
  halls(groups.planned, layout.blocks.semicon, gnd, "semicon");
  ghost(layout.blocks.school, "school", "School");
  ghost(layout.blocks.hospital, "hospital", "Hospital");
  ghost(layout.blocks.fire, "fire", "Fire station");
  ghost(layout.blocks.guesthouse, "guesthouse", "Guest house");
  ghost(layout.blocks.hotel, "hotel", "Hotel");
  ghost(layout.blocks.foodcourt, "foodcourt", "Food court");
  layout.blocks.residential.forEach((spec, i) => {
    const mesh = block(spec, gnd, plannedMat, "residential-blocks");
    groups.planned.add(mesh);
    colliders.push(foot(spec));
    if (i === 0) addLabel(labels, { id: "residential-blocks", text: "Housing", x: spec.x, y: gnd + spec.h + 4, z: spec.z, tier: "building" });
  });

  layout.blocks.esrs.forEach((spec, i) => {
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(5, 6, spec.h, 16), concrete());
    tower.position.set(spec.x, gnd + spec.h / 2, spec.z);
    tag(tower, "esr");
    groups.built.add(tower);
    colliders.push({ minX: spec.x - 7, maxX: spec.x + 7, minZ: spec.z - 7, maxZ: spec.z + 7 });
    if (i === 0) addLabel(labels, { id: "esr", text: "Reservoirs", x: spec.x, y: gnd + spec.h + 2, z: spec.z, tier: "building" });
  });

  const wtp = layout.wtp;
  const wtpSpec = { x: wtp.x, z: wtp.z, w: 80, d: 46, h: 10 };
  solid(wtpSpec, "wtp", "Water plant", groups.built, layout.pad);
  tanks(groups.built, wtpSpec, layout.pad, "wtp", 4);
  layout.blocks.mbrs.forEach((spec, i) => {
    const basin = makeBox(spec.x, layout.pad + spec.h / 2, spec.z, spec.w, spec.h, spec.d, mat(paint.canal, { roughness: 0.4 }));
    tag(basin, "mbr");
    groups.water.add(basin);
    if (i === 0) addLabel(labels, { id: "mbr", text: "Balancing reservoirs", x: spec.x, y: 16, z: spec.z, tier: "building" });
  });

  for (const span of layout.canal.spans) {
    colliders.push({ minX: span.minX, maxX: span.maxX, minZ: span.z - layout.canal.halfWidth, maxZ: span.z + layout.canal.halfWidth });
  }
  const hook = layout.canal.hook;
  const hookZ = layout.canal.polyline[1].z;
  colliders.push({
    minX: hook.x - layout.canal.halfWidth,
    maxX: hook.x + layout.canal.halfWidth,
    minZ: Math.min(hook.z, hookZ),
    maxZ: Math.max(hook.z, hookZ),
  });

  addLabel(labels, { id: "activation", text: "Activation Area", x: aa.cx, y: 36, z: aa.minZ + 200, tier: "zone" });
  addLabel(labels, { id: "canal", text: "Canal", x: (layout.canal.polyline[0].x + layout.canal.polyline[1].x) / 2, y: 14, z: layout.canal.polyline[0].z, tier: "building" });

  return { colliders, esrCount: layout.blocks.esrs.length, mbrCount: layout.blocks.mbrs.length, facts };
}

function tint(groups, id, spec, color) {
  const mesh = makeBox(spec.x, layout.ground + 0.05, spec.z, spec.w, 0.12, spec.d, mat(color, { opacity: 0.55, offset: true, roughness: 1 }));
  tag(mesh, id);
  groups.zones.add(mesh);
}

function block(spec, gnd, material, id) {
  const mesh = makeBox(spec.x, gnd + spec.h / 2, spec.z, spec.w, spec.h, spec.d, material);
  return tag(mesh, id);
}

function foot(spec) {
  return {
    minX: spec.x - spec.w / 2,
    maxX: spec.x + spec.w / 2,
    minZ: spec.z - spec.d / 2,
    maxZ: spec.z + spec.d / 2,
  };
}

function dressFacade(mesh, spec, gnd) {
  const parent = mesh.parent ?? null;
  const group = new THREE.Group();
  const floors = Math.max(2, Math.round(spec.h / 5));
  const cols = Math.max(3, Math.round(spec.w / 8));
  for (let floor = 0; floor < floors; floor++) {
    for (let col = 0; col < cols; col++) {
      const wx = spec.x - spec.w / 2 + ((col + 0.5) * spec.w) / cols;
      const wy = gnd + 2.2 + floor * ((spec.h - 3) / floors);
      for (const side of [-1, 1]) {
        const pane = makeBox(wx, wy, spec.z + side * (spec.d / 2 + 0.15), 2.2, 1.5, 0.12, windowMat);
        pane.userData.id = mesh.userData.id;
        group.add(pane);
      }
    }
  }
  if (parent) parent.add(group);
  else mesh.add(group);
}

function tanks(parent, spec, gnd, id, count) {
  for (let i = 0; i < count; i++) {
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 5, 18), mat(paint.concreteDark));
    tank.position.set(spec.x - spec.w / 2 + 16 + i * 18, gnd + spec.h + 1.5, spec.z);
    tag(tank, id);
    parent.add(tank);
  }
}

function yard(parent, spec, gnd, id) {
  for (let i = 0; i < 6; i++) {
    const gantry = makeBox(spec.x - 30 + i * 12, gnd + spec.h + 4, spec.z, 1.2, 8, spec.d * 0.7, mat(paint.concreteDark, { metalness: 0.3 }));
    tag(gantry, id);
    parent.add(gantry);
  }
}

function halls(parent, spec, gnd, id) {
  for (let i = 0; i < 4; i++) {
    const hall = makeBox(spec.x - 140 + i * 90, gnd + 8, spec.z, 70, 12, 150, plannedMat);
    tag(hall, id);
    parent.add(hall);
  }
}

function buildCanal(groups, labels) {
  const gnd = layout.ground;
  const half = layout.canal.halfWidth;
  for (const span of layout.canal.spans) {
    const w = span.maxX - span.minX;
    const cx = (span.minX + span.maxX) / 2;
    const water = makeBox(cx, gnd + 0.35, span.z, w, 0.25, half * 1.2, mat(paint.canal, { roughness: 0.25, metalness: 0.05 }));
    const north = makeBox(cx, gnd + 0.7, span.z - half, w, 0.9, 1.4, mat(paint.parapet));
    const south = makeBox(cx, gnd + 0.7, span.z + half, w, 0.9, 1.4, mat(paint.parapet));
    tag(water, "canal");
    tag(north, "canal");
    tag(south, "canal");
    groups.water.add(water, north, south);
  }
  const a = layout.canal.polyline[1];
  const b = layout.canal.hook;
  const hook = makeBox(a.x, gnd + 0.35, (a.z + b.z) / 2, half * 1.4, 0.25, Math.abs(a.z - b.z), mat(paint.canal, { roughness: 0.25 }));
  tag(hook, "canal");
  groups.water.add(hook);
  void labels;
}

function buildUtilities(groups) {
  const gnd = layout.ground;
  const colors = [0x3d7ea6, 0x7a5b46, 0xb5693a, 0xd2a04a, 0x6e8b8a];
  const arterials = layout.roads.lines.filter((line) => line.cls === "arterial");
  arterials.forEach((line, index) => {
    const dx = line.b.x - line.a.x;
    const dz = line.b.z - line.a.z;
    const len = Math.hypot(dx, dz) || 1;
    const ox = (-dz / len) * (10 + index);
    const oz = (dx / len) * (10 + index);
    const mesh = makeSegment(
      { x: line.a.x + ox, z: line.a.z + oz },
      { x: line.b.x + ox, z: line.b.z + oz },
      1.4,
      gnd + 0.15,
      mat(colors[index % colors.length], { roughness: 0.5 }),
    );
    tag(mesh, index === 0 ? "wtp" : "aa-roads");
    groups.utilities.add(mesh);
  });
}

function buildLamps(groups) {
  const gnd = layout.ground;
  const arterials = layout.roads.lines.filter((line) => line.cls === "arterial");
  const spots = [];
  for (const line of arterials) {
    const dx = line.b.x - line.a.x;
    const dz = line.b.z - line.a.z;
    const len = Math.hypot(dx, dz);
    const steps = Math.floor(len / 90);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      spots.push({ x: line.a.x + dx * t, z: line.a.z + dz * t });
    }
  }
  const mesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.35, 0.45, 8, 6), lampMat, spots.length);
  const dummy = new THREE.Object3D();
  spots.forEach((spot, i) => {
    dummy.position.set(spot.x, gnd + 4, spot.z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  });
  groups.roads.add(mesh);
}

function buildTrees(groups) {
  const gnd = layout.ground;
  const arterials = layout.roads.lines.filter((line) => line.cls === "arterial");
  const treeSpots = [];

  for (const line of arterials) {
    const dx = line.b.x - line.a.x;
    const dz = line.b.z - line.a.z;
    const len = Math.hypot(dx, dz) || 1;
    const normX = -dz / len;
    const normZ = dx / len;
    const steps = Math.floor(len / 45);

    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const cx = line.a.x + dx * t;
      const cz = line.a.z + dz * t;
      // Left and right avenue trees
      treeSpots.push({ x: cx + normX * 18, z: cz + normZ * 18 });
      treeSpots.push({ x: cx - normX * 18, z: cz - normZ * 18 });
    }
  }

  // Residential park clusters
  const res = layout.aaTints.residential;
  for (let rx = -3; rx <= 3; rx++) {
    for (let rz = -3; rz <= 3; rz++) {
      treeSpots.push({
        x: res.x + rx * 110 + (Math.sin(rx * 3) * 20),
        z: res.z + rz * 110 + (Math.cos(rz * 3) * 20),
      });
    }
  }

  const foliageGeo = new THREE.ConeGeometry(3.2, 7.5, 6);
  const trunkGeo = new THREE.CylinderGeometry(0.4, 0.6, 3, 5);

  const foliageMat = mat(0x3e5e3a, { roughness: 0.9 });
  const trunkMat = mat(0x524336, { roughness: 0.95 });

  const foliageMesh = new THREE.InstancedMesh(foliageGeo, foliageMat, treeSpots.length);
  const trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, treeSpots.length);

  const dummy = new THREE.Object3D();
  treeSpots.forEach((p, i) => {
    // Trunk
    dummy.position.set(p.x, gnd + 1.5, p.z);
    dummy.rotation.set(0, (i * 0.7) % Math.PI, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    trunkMesh.setMatrixAt(i, dummy.matrix);

    // Foliage
    dummy.position.set(p.x, gnd + 6.2, p.z);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    foliageMesh.setMatrixAt(i, dummy.matrix);
  });

  foliageMesh.instanceMatrix.needsUpdate = true;
  trunkMesh.instanceMatrix.needsUpdate = true;
  groups.built.add(trunkMesh, foliageMesh);
}

function buildPowerPylons(groups) {
  const gnd = layout.ground;
  const sub = layout.blocks.subTorrent;
  const pylonMat = mat(0x757d82, { metalness: 0.4, roughness: 0.6 });

  for (let i = 1; i <= 6; i++) {
    const px = sub.x + i * 220;
    const pz = sub.z + (i % 2 === 0 ? 30 : -30);
    const tower = makeBox(px, gnd + 16, pz, 4, 32, 4, pylonMat);
    const crossbar = makeBox(px, gnd + 28, pz, 1.5, 1.5, 24, pylonMat);
    groups.utilities.add(tower, crossbar);
  }
}
