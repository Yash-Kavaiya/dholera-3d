import * as THREE from "three";
import { facts, villages, zones, chapters, places, entryFor, tourStops } from "../src/content/city.js";
import { layout } from "../src/geo/layout.js";
import { aimEuler, applyYawPitch, headingOf, yawAlignLocalZ, yawFacing, UP } from "../src/frame.js";
import { makePrism } from "../src/world/meshkit.js";
import * as data from "../src/data/dholera.js";
import { routes, explore } from "../src/site/routes.js";

const failures = [];
const bad = (message) => failures.push(message);

function near(name, value, target, tol) {
  if (Math.abs(value - target) > tol) bad(`${name}: ${value} is not within ${tol} of ${target}`);
}

near("roads UI", facts.roadsKm, 72, 0);
near("canal UI", facts.canalKm, 6.6, 0);
near("SIR UI", facts.sirKm2, 920, 0);
near("developable UI", facts.developableKm2, 422, 0);
near("phase UI", facts.phase1Km2, 153, 0);
near("activation UI", facts.activationKm2, 22.54, 0);
near("layout roads", layout.measures.roadsKm, 72, 0.02);
near("layout canal", layout.measures.canalKm, 6.6, 0.02);
near("layout airport offset sign", layout.measures.dholeraToAirportKm > 5 ? 1 : 0, 1, 0);

if (villages.length !== 22) bad(`expected 22 villages, got ${villages.length}`);
if (villages.filter((v) => v.pin === "osm").length !== 21) bad("expected 21 OSM pins and Sangasar unpinned");
if (zones.length < 12) bad("zone catalogue is short");
if (chapters.length !== 10) bad(`expected 10 chapters, got ${chapters.length}`);
if (tourStops.length < 12) bad("tour is short");

for (const stop of tourStops) {
  if (!layout.frames[stop.focus]) bad(`tour focus missing: ${stop.focus}`);
  if (!chapters.some((c) => c.id === stop.chapter)) bad(`tour chapter missing: ${stop.chapter}`);
}

for (const zone of zones) {
  if (!entryFor(zone.id)) bad(`no entry for ${zone.id}`);
  if (!layout.zonePolys.some((z) => z.id === zone.id)) bad(`no ground for ${zone.id}`);
}

for (const v of villages) {
  if (v.pin === "osm" && !layout.frames[`village-${v.id}`]) bad(`no frame for ${v.name}`);
  if (v.pin === "osm" && !entryFor(`village-${v.id}`)) bad(`no entry for ${v.name}`);
}

for (const id of Object.keys(places)) {
  if (!layout.frames[id] && !["gulf", "sir"].includes(id) && !layout.frames[id]) bad(`no camera frame for ${id}`);
}
for (const id of ["gulf", "sir", "activation", "bec", "airport", "solar", "canal", "wtp"]) {
  if (!layout.frames[id]) bad(`missing frame ${id}`);
  if (!entryFor(id) && !places[id]) bad(`missing entry ${id}`);
}

const square = [
  { x: 0, z: 0 },
  { x: 100, z: 0 },
  { x: 100, z: 80 },
  { x: 0, z: 80 },
];
const prism = makePrism(square, 0, 20, new THREE.MeshBasicMaterial({ side: THREE.FrontSide }));
const ray = new THREE.Raycaster(new THREE.Vector3(50, 40, 40), new THREE.Vector3(0, -1, 0));
if (ray.intersectObject(prism, false).length === 0) bad("prism top face is invisible from above");

const road = new THREE.Object3D();
road.rotation.y = yawAlignLocalZ(0, -1);
const north = new THREE.Vector3(0, 0, 1).applyQuaternion(road.quaternion);
if (north.distanceTo(new THREE.Vector3(0, 0, -1)) > 1e-4) bad(`road local +Z did not face north: ${north.toArray()}`);

const eastRoad = new THREE.Object3D();
eastRoad.rotation.y = yawAlignLocalZ(1, 0);
const east = new THREE.Vector3(0, 0, 1).applyQuaternion(eastRoad.quaternion);
if (east.distanceTo(new THREE.Vector3(1, 0, 0)) > 1e-4) bad(`road local +Z did not face east: ${east.toArray()}`);

const walker = new THREE.Object3D();
walker.rotation.y = yawFacing(1, 0);
const face = headingOf(walker, new THREE.Vector3());
if (face.dot(new THREE.Vector3(1, 0, 0)) < 0.99) bad(`yawFacing east produced ${face.toArray()}`);
walker.rotation.y = yawFacing(0, -1);
const faceN = headingOf(walker, new THREE.Vector3());
if (faceN.dot(new THREE.Vector3(0, 0, -1)) < 0.99) bad(`yawFacing north produced ${faceN.toArray()}`);

const camera = new THREE.PerspectiveCamera();
const eye = new THREE.Vector3(100, 20, 0);
const aim = aimEuler(eye, new THREE.Vector3(0, 0, 0));
camera.position.copy(eye);
applyYawPitch(camera, aim.yaw, aim.pitch);
const dir = new THREE.Vector3();
camera.getWorldDirection(dir);
const want = new THREE.Vector3(-100, -20, 0).normalize();
if (dir.dot(want) < 0.99) bad(`aimEuler looked ${dir.toArray()} instead of ${want.toArray()}`);

const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 0, -1), UP);
if (right.distanceTo(new THREE.Vector3(1, 0, 0)) > 1e-6) bad("forward × up is not +X");

if (layout.blocks.spawn.z <= layout.blocks.bec.z) bad("spawn is not south of ABCD");
if (layout.canal.polyline[0].z <= layout.blocks.spawn.z) bad("canal is not south of the walk spawn");

// Data integrity: every cited source exists, every project is dated and has a known status.
const sourceIds = new Set(data.sources.map((s) => s.id));
if (sourceIds.size !== data.sources.length) bad("duplicate source id");
const cited = (where, ids = []) => {
  for (const id of ids) if (!sourceIds.has(id)) bad(`${where}: unknown source ${id}`);
};
const isDate = (d) => /^\d{4}(-\d{2}(-\d{2})?)?$/.test(d);
for (const s of data.sources) {
  if (!["official", "press"].includes(s.tier)) bad(`source ${s.id}: bad tier`);
  if (!s.href.startsWith("https://")) bad(`source ${s.id}: href is not https`);
  if (s.tier === "press" && s.publisher !== "Wikipedia" && !s.date) bad(`press source ${s.id} has no date`);
}
const projectIds = new Set();
for (const p of data.projects) {
  if (projectIds.has(p.id)) bad(`duplicate project ${p.id}`);
  projectIds.add(p.id);
  if (!data.statuses.some((s) => s.id === p.status)) bad(`project ${p.id}: unknown status ${p.status}`);
  if (!data.categories.some((c) => c.id === p.category)) bad(`project ${p.id}: unknown category`);
  if (!isDate(p.asOf)) bad(`project ${p.id}: asOf missing`);
  if (!p.sourceIds?.length) bad(`project ${p.id}: no sources`);
  if (p.explore && !layout.frames[p.explore]) bad(`project ${p.id}: explore frame ${p.explore} missing`);
  cited(`project ${p.id}`, p.sourceIds);
  for (const m of p.milestones || []) {
    if (!isDate(m.date)) bad(`project ${p.id}: milestone date ${m.date}`);
    cited(`project ${p.id} milestone`, m.sourceIds);
  }
}
for (const t of data.timeline) {
  if (t.date !== "Now" && !isDate(t.date)) bad(`timeline date ${t.date}`);
  if (!t.sourceIds?.length) bad(`timeline ${t.date}: no sources`);
  cited(`timeline ${t.date}`, t.sourceIds);
}
for (const f of data.faq) cited(`faq "${f.q}"`, f.sourceIds);
for (const c of data.connectivity) cited(`connectivity ${c.mode}`, c.sourceIds);
cited("allotment", [...data.allotment.sourceIds, ...data.allotment.policies]);
if (!isDate(data.meta.dataAsOf)) bad("meta.dataAsOf is not a date");
const paths = new Set([...routes, explore].map((r) => r.path));
if (paths.size !== routes.length + 1) bad("duplicate route path");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("check ok");
console.log(JSON.stringify(layout.measures, null, 2));
