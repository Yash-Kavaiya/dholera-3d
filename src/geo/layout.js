import { facts, villages } from "../content/city.js";
import { ORIGIN, groundDistanceKm, project } from "./project.js";

const PAD = 2;
const GROUND = 3.3;
const AA_WIDTH = 6200;
const AA_HEIGHT = (facts.activationKm2 * 1e6) / AA_WIDTH;

function shoelace(poly) {
  let sum = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    sum += a.x * b.z - b.x * a.z;
  }
  return sum / 2;
}

function areaOf(poly) {
  return Math.abs(shoelace(poly));
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

function cross(o, a, b) {
  return (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
}

function convexHull(points) {
  const pts = [...points].sort((p, q) => p.x - q.x || p.z - q.z);
  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

function scaleToArea(poly, target) {
  const scale = Math.sqrt(target / areaOf(poly));
  const c = centroid(poly);
  return poly.map((p) => ({
    x: c.x + (p.x - c.x) * scale,
    z: c.z + (p.z - c.z) * scale,
  }));
}

function expand(poly, dist) {
  const c = centroid(poly);
  return poly.map((p) => {
    const dx = p.x - c.x;
    const dz = p.z - c.z;
    const len = Math.hypot(dx, dz) || 1;
    return { x: p.x + (dx / len) * dist, z: p.z + (dz / len) * dist };
  });
}

function inside(poly, x, z) {
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

function clipHalf(poly, key, limit, mode) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const av = a[key];
    const bv = b[key];
    const aIn = mode === "le" ? av <= limit + 1e-6 : av >= limit - 1e-6;
    const bIn = mode === "le" ? bv <= limit + 1e-6 : bv >= limit - 1e-6;
    const hit = () => {
      const t = (limit - av) / (bv - av || 1e-9);
      return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
    };
    if (aIn && bIn) out.push({ x: b.x, z: b.z });
    else if (aIn && !bIn) out.push(hit());
    else if (!aIn && bIn) {
      out.push(hit());
      out.push({ x: b.x, z: b.z });
    }
  }
  return out.filter((p, i, arr) => {
    const q = arr[(i + 1) % arr.length];
    return Math.hypot(p.x - q.x, p.z - q.z) > 0.01;
  });
}

function cutNorth(poly, target) {
  let lo = Math.min(...poly.map((p) => p.z));
  let hi = Math.max(...poly.map((p) => p.z));
  let zCut = (lo + hi) / 2;
  for (let i = 0; i < 48; i++) {
    zCut = (lo + hi) / 2;
    const north = clipHalf(poly, "z", zCut, "le");
    const area = north.length >= 3 ? areaOf(north) : 0;
    if (area < target) lo = zCut;
    else hi = zCut;
  }
  zCut = (lo + hi) / 2;
  return {
    zCut,
    north: clipHalf(poly, "z", zCut, "le"),
    south: clipHalf(poly, "z", zCut, "ge"),
  };
}

function splitBands(poly, count) {
  const bands = [];
  let rest = poly;
  for (let i = 0; i < count - 1; i++) {
    const share = areaOf(rest) / (count - i);
    const cut = cutNorth(rest, share);
    bands.push(cut.north);
    rest = cut.south.length >= 3 ? cut.south : rest;
  }
  bands.push(rest);
  return bands;
}

function bbox(poly) {
  const xs = poly.map((p) => p.x);
  const zs = poly.map((p) => p.z);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minZ: Math.min(...zs), maxZ: Math.max(...zs) };
}

function rectCorners(cx, cz, width, height) {
  const hw = width / 2;
  const hh = height / 2;
  return [
    { x: cx - hw, z: cz - hh },
    { x: cx + hw, z: cz - hh },
    { x: cx + hw, z: cz + hh },
    { x: cx - hw, z: cz + hh },
  ];
}

function polylineLength(points) {
  let len = 0;
  for (let i = 1; i < points.length; i++) len += Math.hypot(points[i].x - points[i - 1].x, points[i].z - points[i - 1].z);
  return len;
}

export function pointOnPolyline(points, distance) {
  let left = distance;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const span = Math.hypot(b.x - a.x, b.z - a.z);
    if (left <= span || i === points.length - 1) {
      const t = span === 0 ? 0 : left / span;
      return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
    }
    left -= span;
  }
  return { ...points[points.length - 1] };
}

function frameBox(box, y, zPush) {
  const cx = (box.minX + box.maxX) / 2;
  const cz = (box.minZ + box.maxZ) / 2;
  const span = Math.max(box.maxX - box.minX, box.maxZ - box.minZ, 800);
  return {
    position: { x: cx + span * 0.05, y, z: cz + span * zPush },
    target: { x: cx, y: GROUND, z: cz },
  };
}

function look(x, z, y, tx, tz, ty = GROUND) {
  return { position: { x, y, z }, target: { x: tx, y: ty, z: tz } };
}

function createLayout() {
  const pinned = villages
    .filter((v) => v.lat != null)
    .map((v) => ({ ...v, ...project(v.lat, v.lon) }));

  let sir = scaleToArea(expand(convexHull(pinned.map((p) => ({ x: p.x, z: p.z }))), 2500), facts.sirKm2 * 1e6);
  for (const v of pinned) {
    if (!inside(sir, v.x, v.z)) {
      sir = scaleToArea(expand(convexHull(pinned.map((p) => ({ x: p.x, z: p.z }))), 5000), facts.sirKm2 * 1e6);
      break;
    }
  }

  const developable = scaleToArea(sir, facts.developableKm2 * 1e6);
  const phaseCut = cutNorth(developable, facts.phase1Km2 * 1e6);
  const phaseHalves = splitBands(phaseCut.north, 2);
  const later = splitBands(phaseCut.south, 4);
  const bands = [
    { id: "tp1", poly: phaseHalves[0] },
    { id: "tp2", poly: phaseHalves[1] },
    { id: "tp3", poly: later[0] },
    { id: "tp4", poly: later[1] },
    { id: "tp5", poly: later[2] },
    { id: "tp6", poly: later[3] },
  ];

  const kadipur = pinned.find((v) => v.id === "kadipur");
  const devC = centroid(developable);
  let aax = kadipur.x;
  let aaz = kadipur.z;
  for (let i = 0; i < 50; i++) {
    const corners = rectCorners(aax, aaz, AA_WIDTH, AA_HEIGHT);
    if (corners.every((p) => inside(developable, p.x, p.z))) break;
    aax += (devC.x - aax) * 0.2;
    aaz += (devC.z - aaz) * 0.2;
  }
  const activation = {
    cx: aax,
    cz: aaz,
    width: AA_WIDTH,
    height: AA_HEIGHT,
    corners: rectCorners(aax, aaz, AA_WIDTH, AA_HEIGHT),
    minX: aax - AA_WIDTH / 2,
    maxX: aax + AA_WIDTH / 2,
    minZ: aaz - AA_HEIGHT / 2,
    maxZ: aaz + AA_HEIGHT / 2,
  };

  const roads = buildRoads(activation);
  const canal = buildCanal(activation, roads);
  const blocks = buildBlocks(activation, canal);

  const airportLl = { lat: 22.3619916, lon: 72.3053472 };
  const adhelaiLl = { lat: 22.0513249, lon: 72.1115343 };
  const bhimnathLl = { lat: 22.2394979, lon: 71.9220762 };
  const ahmedabadLl = { lat: 23.0225, lon: 72.5714 };
  const airport = project(airportLl.lat, airportLl.lon);
  const adhelai = project(adhelaiLl.lat, adhelaiLl.lon);
  const bhimnath = project(bhimnathLl.lat, bhimnathLl.lon);
  const solar = pinned.find((v) => v.id === "mahadevpura");

  const expressway = [
    project(22.43, 72.32),
    project(22.335, 72.255),
    { x: kadipur.x, z: kadipur.z },
    project(22.16, 72.17),
    { x: adhelai.x, z: adhelai.z },
  ];
  // Same left-hand offset the Future passenger stroke is drawn with.
  const passengerRail = offsetPolyline(expressway, 520);
  const junction = expressway[1];
  const airportLink = [junction, airport];
  const nh751 = [project(22.37, 72.205), { x: 0, z: 0 }, project(22.07, 72.19)];
  const rail = [bhimnath, { x: activation.cx - 400, z: activation.cz }];

  const shoreX = Math.max(bbox(sir).maxX, airport.x, solar.x, ...expressway.map((p) => p.x)) + 1800;

  const zonePolys = buildZones(developable, solar);
  const aaTints = buildTints(activation);

  const dholeraToAirportKm = Math.hypot(airport.x, airport.z) / 1000;
  const dholeraToAhmedabadKm = groundDistanceKm(ahmedabadLl.lat, ahmedabadLl.lon);

  const wtp = placeWtp(activation, sir, shoreX);
  blocks.mbrs = [
    { x: wtp.x + 90, z: wtp.z + 10, w: 70, d: 46, h: 5 },
    { x: wtp.x - 80, z: wtp.z + 40, w: 60, d: 42, h: 5 },
  ];

  const frames = {
    arrive: {
      position: { x: shoreX + 7000, y: 7200, z: centroid(sir).z + 5000 },
      target: { x: centroid(sir).x, y: PAD, z: centroid(sir).z },
    },
    sir: frameBox(bbox(sir), 14000, 0.85),
    region: frameBox(bbox(sir), 16000, 0.9),
    plan: frameBox(bbox(developable), 11000, 0.8),
    activation: frameBox(bbox(activation.corners), 980, 0.48),
    tp1: frameBox(bbox(bands[0].poly), 7000, 0.8),
    expressway: look(kadipur.x + 1500, kadipur.z + 3500, 2200, kadipur.x, kadipur.z, PAD),
    airport: look(airport.x + 1800, airport.z + 2200, 1400, airport.x, airport.z, PAD),
    solar: look(solar.x + 800, solar.z + 1600, 1600, solar.x, solar.z, PAD),
    canal: look(canal.polyline[0].x + AA_WIDTH * 0.45, canal.polyline[0].z + 900, 700, canal.polyline[0].x + AA_WIDTH * 0.5, canal.polyline[0].z, GROUND),
    wtp: look(wtp.x + 500, wtp.z + 700, 500, wtp.x, wtp.z, PAD),
    "sub-torrent": look(blocks.subTorrent.x + 180, blocks.subTorrent.z + 260, 220, blocks.subTorrent.x, blocks.subTorrent.z, GROUND),
    bec: look(blocks.bec.x, blocks.bec.z + 220, 140, blocks.bec.x, blocks.bec.z, GROUND + 12),
    "village-dholera": look(400, 900, 1600, 0, 0, PAD),
    villages: frameBox(bbox(pinned), 12000, 0.85),
    zones: frameBox(bbox(developable), 12000, 0.75),
    infrastructure: frameBox(bbox(activation.corners), 2400, 1),
    connect: frameBox(bbox([...expressway, airport, bhimnath]), 18000, 0.7),
    time: frameBox(bbox(activation.corners), 3200, 0.9),
    sources: frameBox(bbox(sir), 15000, 0.85),
    gulf: {
      position: { x: shoreX + 4000, y: 2500, z: centroid(sir).z },
      target: { x: bbox(sir).maxX, y: PAD, z: centroid(sir).z },
    },
  };

  for (const band of bands) frames[band.id] = frameBox(bbox(band.poly), 8000, 0.75);
  for (const zone of zonePolys) frames[zone.id] = frameBox(bbox(zone.poly), 6000, 0.7);
  for (const v of pinned) frames[`village-${v.id}`] = look(v.x + 200, v.z + 700, 900, v.x, v.z, PAD);
  // Future-only places. Aim at the offset stroke, not the expressway centre, and at the TP4 grain.
  const railMid = passengerRail[2];
  frames["passenger-rail"] = look(railMid.x + 700, railMid.z + 1400, 1200, railMid.x, railMid.z, PAD);
  frames["future-grain"] = frames.tp4;

  const focusIds = ["canal", "wtp", "stp", "cetp", "esr", "mbr", "sub-getco", "semicon", "school", "hospital", "fire", "guesthouse", "hotel", "foodcourt", "residential-blocks", "aa-roads", "aa-industrial", "aa-residential", "aa-commercial", "spv", "nh751", "airport-link", "rail", "adhelai", "bhimnath", "ahmedabad", "bhavnagar", "activation"];
  const namedPoints = {
    canal: canal.mid,
    wtp,
    stp: blocks.stp,
    cetp: blocks.cetp,
    esr: blocks.esrs[0],
    mbr: blocks.mbrs[0],
    "sub-getco": blocks.subGetco,
    semicon: blocks.semicon,
    school: blocks.school,
    hospital: blocks.hospital,
    fire: blocks.fire,
    guesthouse: blocks.guesthouse,
    hotel: blocks.hotel,
    foodcourt: blocks.foodcourt,
    "residential-blocks": blocks.residential[0],
    "aa-roads": { x: activation.cx, z: activation.cz },
    "aa-industrial": aaTints.industrial,
    "aa-residential": aaTints.residential,
    "aa-commercial": aaTints.commercial,
    spv: blocks.spv,
    nh751: nh751[1],
    "airport-link": airport,
    rail: { x: (bhimnath.x + activation.cx) / 2, z: (bhimnath.z + activation.cz) / 2 },
    adhelai,
    bhimnath,
    ahmedabad: edgeLabel(sir, 0.75, -0.15),
    bhavnagar: edgeLabel(sir, 0.4, 1.08),
    activation: { x: activation.cx, z: activation.cz },
  };
  for (const id of focusIds) {
    if (frames[id]) continue;
    const p = namedPoints[id];
    const height = id === "ahmedabad" || id === "bhavnagar" || id === "rail" || id === "adhelai" || id === "bhimnath" ? 4000 : 420;
    frames[id] = look(p.x + 160, p.z + 280, height, p.x, p.z, id.startsWith("aa-") || blocks[id] || id === "canal" ? GROUND : PAD);
  }

  return {
    origin: ORIGIN,
    pad: PAD,
    ground: GROUND,
    sir,
    developable,
    bands,
    activation,
    roads,
    canal,
    blocks,
    aaTints,
    pinned,
    airport,
    adhelai,
    bhimnath,
    solar: { x: solar.x, z: solar.z },
    expressway,
    passengerRail,
    airportLink,
    nh751,
    rail,
    shoreX,
    zonePolys,
    wtp,
    frames,
    namedPoints,
    measures: {
      sirKm2: areaOf(sir) / 1e6,
      developableKm2: areaOf(developable) / 1e6,
      phase1Km2: areaOf(phaseCut.north) / 1e6,
      activationKm2: (AA_WIDTH * AA_HEIGHT) / 1e6,
      roadsKm: roads.metres / 1000,
      canalKm: canal.metres / 1000,
      dholeraToAirportKm,
      dholeraToAhmedabadKm,
      wtpOffsetKm: distOut(wtp, activation) / 1000,
      airportInsideSir: inside(sir, airport.x, airport.z),
      villagesOutside: pinned.filter((v) => !inside(sir, v.x, v.z)).map((v) => v.id),
      bandKm2: bands.map((b) => ({ id: b.id, km2: areaOf(b.poly) / 1e6 })),
    },
  };
}

/** Left of the travel direction, y-up: left = (−dz, dx). */
function offsetPolyline(points, metres) {
  return points.map((point, i) => {
    const a = points[Math.max(0, i - 1)];
    const b = points[Math.min(points.length - 1, i + 1)];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len = Math.hypot(dx, dz) || 1;
    return { x: point.x + (-dz / len) * metres, z: point.z + (dx / len) * metres };
  });
}

function edgeLabel(poly, xFrac, zFrac) {
  const box = bbox(poly);
  return {
    x: box.minX + (box.maxX - box.minX) * xFrac,
    z: box.minZ + (box.maxZ - box.minZ) * zFrac,
  };
}

function distOut(p, rect) {
  const dx = Math.max(rect.minX - p.x, 0, p.x - rect.maxX);
  const dz = Math.max(rect.minZ - p.z, 0, p.z - rect.maxZ);
  return Math.hypot(dx, dz);
}

function placeWtp(rect, sir, shoreX) {
  const gap = facts.wtpOffsetKm * 1000;
  const candidates = [
    { x: rect.maxX + gap, z: rect.cz },
    { x: rect.cx, z: rect.minZ - gap },
    { x: rect.minX - gap, z: rect.cz },
    { x: rect.cx, z: rect.maxZ + gap },
  ];
  for (const c of candidates) {
    if (c.x < shoreX - 600 && inside(sir, c.x, c.z) && distOut(c, rect) > gap * 0.9) return c;
  }
  return candidates[1];
}

function buildRoads(rect) {
  const xFracs = [0.08, 0.22, 0.36, 0.5, 0.64, 0.78, 0.92];
  const zFracs = [0.1, 0.24, 0.38, 0.5, 0.64, 0.78, 0.92];
  const lines = [];
  const add = (a, b, cls) => lines.push({ a, b, cls, width: cls === "arterial" ? 28 : 14 });
  for (const f of xFracs) {
    const x = rect.minX + f * rect.width;
    add({ x, z: rect.minZ }, { x, z: rect.maxZ }, f === 0.5 ? "arterial" : "collector");
  }
  for (const f of zFracs) {
    const z = rect.minZ + f * rect.height;
    add({ x: rect.minX, z }, { x: rect.maxX, z }, f === 0.5 ? "arterial" : "collector");
  }
  const target = facts.roadsKm * 1000;
  let metres = lines.reduce((sum, line) => sum + Math.hypot(line.b.x - line.a.x, line.b.z - line.a.z), 0);
  const remain = target - metres;
  const z = rect.minZ + 0.17 * rect.height;
  add({ x: rect.minX + 80, z }, { x: rect.minX + 80 + remain, z }, "collector");
  metres = lines.reduce((sum, line) => sum + Math.hypot(line.b.x - line.a.x, line.b.z - line.a.z), 0);
  return { lines, metres, xFracs, zFracs };
}

function buildCanal(rect, roads) {
  const zCanal = rect.minZ + 0.71 * rect.height;
  const x0 = rect.minX + 40;
  const x1 = rect.maxX - 40;
  const polyline = [
    { x: x0, z: zCanal },
    { x: x1, z: zCanal },
    { x: x1, z: zCanal - (facts.canalKm * 1000 - (x1 - x0)) },
  ];
  const ns = roads.lines.filter((line) => Math.abs(line.a.x - line.b.x) < 1);
  const spans = [];
  const cuts = ns.map((line) => line.a.x).sort((a, b) => a - b);
  let cursor = x0;
  for (const x of cuts) {
    const gap = 22;
    if (x - gap > cursor + 30) spans.push({ minX: cursor, maxX: x - gap, z: zCanal });
    cursor = x + gap;
  }
  if (x1 - 10 > cursor) spans.push({ minX: cursor, maxX: x1, z: zCanal });
  const hook = polyline[2];
  return {
    polyline,
    metres: polylineLength(polyline),
    spans,
    hook,
    halfWidth: 16,
  };
}

function local(rect, fx, fz) {
  return { x: rect.minX + fx * rect.width, z: rect.minZ + fz * rect.height };
}

function buildBlocks(rect, canal) {
  const bec = { ...local(rect, 0.43, 0.44), w: 92, d: 38, h: 22 };
  const spv = { ...local(rect, 0.55, 0.44), w: 52, d: 34, h: 18 };
  const box = (fx, fz, w, d, h) => ({ ...local(rect, fx, fz), w, d, h });
  return {
    bec,
    spv,
    stp: box(0.14, 0.86, 70, 48, 8),
    cetp: box(0.7, 0.86, 80, 52, 8),
    subTorrent: box(0.84, 0.18, 110, 72, 7),
    subTorrentB: box(0.72, 0.16, 64, 48, 6),
    subGetco: box(0.84, 0.32, 70, 50, 6),
    semicon: box(0.2, 0.2, 420, 220, 14),
    school: box(0.62, 0.62, 80, 48, 12),
    hospital: box(0.74, 0.62, 90, 52, 16),
    fire: box(0.3, 0.62, 36, 28, 8),
    guesthouse: box(0.58, 0.3, 48, 28, 14),
    hotel: box(0.66, 0.3, 56, 32, 28),
    foodcourt: box(0.48, 0.3, 40, 24, 6),
    residential: [0.16, 0.28, 0.4].map((fx, i) => box(0.82, 0.48 + i * 0.08, 150, 28, 16)),
    esrs: [0.22, 0.36, 0.5, 0.64, 0.78]
      .flatMap((fx) => [0.24, 0.5].map((fz) => ({ ...local(rect, fx, fz), w: 14, d: 14, h: 22 })))
      .slice(0, facts.esrCount)
      .map((esr) => ({ ...esr, z: esr.z + 36 })),
    mbrs: [],
    spawn: { ...local(rect, 0.43, 0.47), yaw: 0 },
    canalZ: canal.polyline[0].z,
  };
}

function buildTints(rect) {
  return {
    industrial: { ...local(rect, 0.28, 0.55), w: rect.width * 0.42, d: rect.height * 0.7 },
    residential: { ...local(rect, 0.75, 0.62), w: rect.width * 0.32, d: rect.height * 0.5 },
    commercial: { ...local(rect, 0.48, 0.38), w: rect.width * 0.28, d: rect.height * 0.28 },
  };
}

function buildZones(developable, solar) {
  const box = bbox(developable);
  const xCutEast = box.minX + (box.maxX - box.minX) * 0.86;
  const xCutTour = box.minX + (box.maxX - box.minX) * 0.74;
  const xCutAg = box.minX + (box.maxX - box.minX) * 0.2;
  const crz = clipHalf(developable, "x", xCutEast, "ge");
  const tourism = clipHalf(clipHalf(developable, "x", xCutEast, "le"), "x", xCutTour, "ge");
  const agriculture = clipHalf(developable, "x", xCutAg, "le");
  const specs = [
    ["zone-industrial", 0.28, 0.32, 0.32, 0.36],
    ["zone-residential", 0.28, 0.7, 0.24, 0.18],
    ["zone-city", 0.46, 0.46, 0.12, 0.12],
    ["zone-knowledge", 0.42, 0.16, 0.16, 0.14],
    ["zone-access", 0.58, 0.2, 0.14, 0.28],
    ["zone-logistics", 0.56, 0.52, 0.14, 0.16],
    ["zone-sports", 0.3, 0.52, 0.12, 0.14],
    ["zone-public", 0.44, 0.62, 0.12, 0.12],
  ];
  const rects = specs.map(([id, fx, fz, fw, fh]) => {
    const w = fw * (box.maxX - box.minX);
    const d = fh * (box.maxZ - box.minZ);
    const x = box.minX + fx * (box.maxX - box.minX) + w / 2;
    const z = box.minZ + fz * (box.maxZ - box.minZ) + d / 2;
    return { id, kind: "rect", x, z, w, d, poly: rectPoly(x, z, w, d) };
  });
  const solarPoly = rectPoly(solar.x, solar.z, 2400, 2000);
  return [
    { id: "zone-crz", kind: "poly", poly: crz },
    { id: "zone-tourism", kind: "poly", poly: tourism },
    { id: "zone-agriculture", kind: "poly", poly: agriculture },
    { id: "zone-solar", kind: "poly", poly: solarPoly, x: solar.x, z: solar.z },
    ...rects,
  ];
}

function rectPoly(cx, cz, w, d) {
  return rectCorners(cx, cz, w, d);
}

export const layout = createLayout();

function assertNear(name, value, target, tol) {
  if (Math.abs(value - target) > tol) {
    throw new Error(`${name} is ${value}, expected ${target} ± ${tol}`);
  }
}

assertNear("SIR", layout.measures.sirKm2, facts.sirKm2, 0.05);
assertNear("developable", layout.measures.developableKm2, facts.developableKm2, 0.05);
assertNear("phase I", layout.measures.phase1Km2, facts.phase1Km2, 0.4);
assertNear("activation", layout.measures.activationKm2, facts.activationKm2, 0.01);
assertNear("roads", layout.measures.roadsKm, facts.roadsKm, 0.02);
assertNear("canal", layout.measures.canalKm, facts.canalKm, 0.02);
if (layout.measures.villagesOutside.length) {
  throw new Error(`Village pins outside the plinth: ${layout.measures.villagesOutside.join(", ")}`);
}
if (!layout.activation.corners.every((p) => inside(layout.developable, p.x, p.z))) {
  throw new Error("Activation Area does not sit inside the developable plinth");
}
if (layout.blocks.esrs.length !== facts.esrCount) {
  throw new Error(`Expected ${facts.esrCount} reservoirs, got ${layout.blocks.esrs.length}`);
}
