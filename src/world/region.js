import * as THREE from "three";
import { layout, pointOnPolyline } from "../geo/layout.js";
import { paint, mat, headlightMat, taillightMat, beaconMat, runwayLightMat } from "./materials.js";
import { makePrism, makeBox, makeSegment, outline, tag, addLabel } from "./meshkit.js";
import { yawAlignLocalZ } from "../frame.js";

function lengthOf(points) {
  let n = 0;
  for (let i = 1; i < points.length; i++) n += Math.hypot(points[i].x - points[i - 1].x, points[i].z - points[i - 1].z);
  return n;
}

export function buildRegion(groups, labels) {
  const pad = layout.pad;
  const sir = makePrism(layout.sir, 0, pad, mat(paint.plinth, { roughness: 0.96 }));
  tag(sir, "sir");
  groups.zones.parent.add(sir);
  groups.zones.parent.add(outline(layout.sir, pad + 1.4, paint.copper));

  const yRoad = pad + 0.55;
  for (let i = 1; i < layout.expressway.length; i++) {
    const mesh = makeSegment(layout.expressway[i - 1], layout.expressway[i], 380, yRoad, mat(paint.express));
    tag(mesh, "expressway");
    groups.roads.add(mesh);
  }
  for (let i = 1; i < layout.airportLink.length; i++) {
    const mesh = makeSegment(layout.airportLink[i - 1], layout.airportLink[i], 220, yRoad, mat(paint.express));
    tag(mesh, "airport-link");
    groups.roads.add(mesh);
  }
  for (let i = 1; i < layout.nh751.length; i++) {
    const mesh = makeSegment(layout.nh751[i - 1], layout.nh751[i], 200, yRoad + 0.15, mat(paint.highway));
    tag(mesh, "nh751");
    groups.roads.add(mesh);
  }
  for (let i = 1; i < layout.rail.length; i++) {
    const mesh = makeSegment(layout.rail[i - 1], layout.rail[i], 90, yRoad + 0.3, mat(paint.rail, { metalness: 0.2 }));
    tag(mesh, "rail");
    groups.roads.add(mesh);
  }

  const airportExtras = buildAirport(groups, labels);
  buildSolar(groups, labels);
  buildVillages(groups, labels);
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
      if (airportExtras) airportExtras.update(time);
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

function buildAirport(groups, labels) {
  const { x, z } = layout.airport;
  const g = new THREE.Group();
  const runway = makeBox(0, 0.25, 0, 48, 0.4, 3200, mat(0xd8d4cc));
  const terminal = makeBox(180, 9, -400, 70, 16, 210, mat(paint.concrete));
  const cargo = makeBox(-160, 6, 500, 90, 10, 140, mat(paint.concreteDark));
  const tower = makeBox(120, 18, -180, 12, 36, 12, mat(paint.concrete));

  // ATC Radar antenna
  const radar = makeBox(120, 38, -180, 14, 2, 2, mat(0x445566));
  // Blinking hazard beacon on tower
  const beacon = makeBox(120, 39, -180, 2.5, 2.5, 2.5, beaconMat);

  // Runway threshold lights
  const runwayNorthLight = makeBox(0, 0.6, -1580, 44, 0.6, 2, runwayLightMat);
  const runwaySouthLight = makeBox(0, 0.6, 1580, 44, 0.6, 2, runwayLightMat);

  // Parked airliner stand-ins on terminal apron
  const plane1 = buildAirplane(120, 0.4, -460, 0.2);
  const plane2 = buildAirplane(120, 0.4, -340, 0.2);

  g.add(runway, terminal, cargo, tower, radar, beacon, runwayNorthLight, runwaySouthLight, plane1, plane2);
  g.position.set(x, 0, z);
  g.rotation.y = 0.55;
  tag(g, "airport");
  groups.planned.add(g);
  addLabel(labels, { id: "airport", text: "Airport", x, y: 50, z, tier: "region" });

  return {
    update(time) {
      radar.rotation.y = time * 2.5;
      beaconMat.emissiveIntensity = Math.sin(time * 6) > 0.2 ? 3.5 : 0.3;
    },
  };
}

function buildAirplane(x, y, z, rot) {
  const plane = new THREE.Group();
  // Fuselage
  const body = makeBox(0, 4, 0, 4, 4, 38, mat(0xf0ede6));
  // Wings
  const wings = makeBox(0, 3.5, 2, 36, 0.6, 6, mat(0xe0dbd0));
  // Tail fin
  const tail = makeBox(0, 8, 16, 0.6, 6, 6, mat(paint.copper));
  plane.add(body, wings, tail);
  plane.position.set(x, y, z);
  plane.rotation.y = rot;
  return plane;
}

function buildSolar(groups, labels) {
  const { x, z } = layout.solar;
  const cols = 150;
  const rows = 110;
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(7, 0.15, 1.4), mat(paint.solar, { roughness: 0.35, metalness: 0.4 }), cols * rows);
  const dummy = new THREE.Object3D();
  const yaw = 0.35;
  let n = 0;
  for (let ix = 0; ix < cols; ix++) {
    for (let iz = 0; iz < rows; iz++) {
      const px = x - 1200 + ix * 16;
      const pz = z - 1000 + iz * 18;
      if (!pointIn(layout.sir, px, pz)) continue;
      dummy.position.set(px, layout.pad + 0.7, pz);
      dummy.rotation.set(-0.35, yaw, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(n, dummy.matrix);
      n += 1;
    }
  }
  mesh.count = n;
  mesh.instanceMatrix.needsUpdate = true;
  tag(mesh, "solar");
  groups.built.add(mesh);
  const fence = makeBox(x, layout.pad + 1.2, z, 2460, 0.4, 2060, mat(paint.solar, { opacity: 0.18, roughness: 1 }));
  tag(fence, "solar");
  groups.built.add(fence);
  addLabel(labels, { id: "solar", text: "Solar park", x, y: 24, z, tier: "zone" });
}

function buildVillages(groups, labels) {
  for (const village of layout.pinned) {
    const disc = makeBox(village.x, layout.pad + 1.2, village.z, 64, 1.6, 64, mat(paint.copper));
    const post = makeBox(village.x, layout.pad + 18, village.z, 4, 32, 4, mat(paint.concrete));
    tag(disc, `village-${village.id}`);
    tag(post, `village-${village.id}`);
    groups.villages.add(disc, post);
    addLabel(labels, { id: `village-${village.id}`, text: village.name, x: village.x, y: 40, z: village.z, tier: "village" });
  }
}

function buildDirections(groups, labels) {
  const marks = [
    ["ahmedabad", "Ahmedabad · about 100 km"],
    ["bhavnagar", "Bhavnagar"],
    ["adhelai", "Adhelai"],
    ["bhimnath", "Bhimnath"],
  ];
  for (const [id, text] of marks) {
    const p = layout.namedPoints[id];
    const post = makeBox(p.x, 12, p.z, 8, 24, 8, mat(paint.concrete));
    tag(post, id);
    groups.villages.add(post);
    addLabel(labels, { id, text, x: p.x, y: 36, z: p.z, tier: "region" });
  }
}

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

      // Front headlights
      dummyLight.copy(dummy);
      dummyLight.translateZ(16);
      dummyLight.updateMatrix();
      headMesh.setMatrixAt(i, dummyLight.matrix);

      // Rear taillights
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
  const trainGroup = new THREE.Group();

  const cars = 6;
  const carLength = 26;
  const meshes = [];

  for (let c = 0; c < cars; c++) {
    const color = c === 0 ? paint.copper : 0x5a544d;
    const mesh = makeBox(0, layout.pad + 3, 0, 9, 6, carLength - 2, mat(color, { roughness: 0.6 }));
    trainGroup.add(mesh);
    meshes.push(mesh);
  }

  groups.roads.add(trainGroup);

  return {
    update(time) {
      const speed = 28;
      const baseDist = (speed * time) % total;
      for (let c = 0; c < cars; c++) {
        const d = (baseDist - c * carLength + total) % total;
        const p = pointOnPolyline(points, d);
        const ahead = pointOnPolyline(points, d + 4);
        meshes[c].position.set(p.x, layout.pad + 3, p.z);
        meshes[c].rotation.y = yawAlignLocalZ(ahead.x - p.x, ahead.z - p.z);
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
    const hull = makeBox(0, 4, 0, s.width, 8, s.length, mat(0x28323e, { roughness: 0.7 }));
    const bridge = makeBox(0, 11, -s.length * 0.25, s.width * 0.75, 8, s.length * 0.25, mat(0xedebe4));
    const mastLight = makeBox(0, 17, -s.length * 0.25, 2, 2, 2, beaconMat);
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
