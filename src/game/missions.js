/**
 * Dholera Rising — City Ops: mission chain, target resolution and ground helpers.
 *
 * Pure module (no Three.js) so the chain and the coordinate fallbacks can be
 * tested headlessly. Coordinate lookup order is the one in docs/GAME-DESIGN.md:
 *   places[id] -> layout.namedPoints[id] -> layout.blocks[id] -> airport/solar
 * then per-target fallbacks. A mission is only unresolvable if the whole SIR is.
 */

export const MISSION_COUNT = 9;
export const SHARD_COUNT = 12;
export const WALK_RADIUS = 45;
export const DRIVE_RADIUS = 90;

export const MISSIONS = [
  {
    id: "cioc",
    code: "OP-01",
    title: "Boot the CIOC",
    brief:
      "The City Integrated Operations Centre is dark. Get across the plaza to the ABCD complex and bring the ops floor online.",
    objective: "Reach the ABCD building and press E to power the CIOC.",
    targets: [{ id: "bec", label: "ABCD / CIOC", fallback: ["spv"] }],
    reward: { xp: 60, credits: 120 },
    codex:
      "The ABCD complex holds DSIRDA's administration, exhibition halls and the City Integrated Operations Centre — the room that watches every pump, gate and substation in the SIR.",
  },
  {
    id: "water",
    code: "OP-02",
    title: "Water Works",
    brief:
      "Fifty million litres a day, five kilometres outside the Activation Area. Take the rover out and wake the treatment plant.",
    objective: "Drive to the 50 MLD water treatment plant and press E to start the pumps.",
    targets: [{ id: "wtp", label: "Water treatment plant" }],
    reward: { xp: 70, credits: 150 },
    codex:
      "The water treatment plant is commissioned at 50 MLD and scales to 150. Treated water fills two mass-balancing reservoirs and nine elevated service towers.",
  },
  {
    id: "canal",
    code: "OP-03",
    title: "Canal Flow",
    brief:
      "The storm canal has been dry since the rain. Open the sluices and let it run east toward the gulf.",
    objective: "Reach the canal and press E to open the storm-water sluices.",
    targets: [{ id: "canal", label: "Central canal" }],
    reward: { xp: 80, credits: 170 },
    codex:
      "A 6.6 km central canal carries storm water off the Activation Area, under the road bridges, to the sea. Gravity does the work; the sluices only start it.",
  },
  {
    id: "grid",
    code: "OP-04",
    title: "Grid Online",
    brief:
      "No city runs on promises. Bring the Torrent Power 400/220 kV yard up and hand the SIR its distribution capacity.",
    objective: "Reach the Torrent substation and press E to energise the grid.",
    targets: [{ id: "sub-torrent", label: "Torrent substation", fallback: ["sub-getco"] }],
    reward: { xp: 90, credits: 190 },
    codex:
      "Torrent Power is the distribution licensee: a 400/220 kV gas-insulated, SCADA-enabled yard with 500 MVA of distribution capacity, scalable to 1,500.",
  },
  {
    id: "semicon",
    code: "OP-05",
    title: "Silicon Sunrise",
    brief:
      "The Tata semiconductor fab is waiting on clean power and cleaner water. Get the fab campus online.",
    objective: "Reach the Semicon City fab campus and press E to commission the fab.",
    targets: [{ id: "semicon", label: "Semicon City fab", fallback: ["aa-industrial"] }],
    reward: { xp: 100, credits: 220 },
    codex:
      "The Tata–PSMC fab is the anchor of Semicon City: a 66.166 hectare SEZ notified in 2026, with ₹91,000 crore of committed investment.",
  },
  {
    id: "civic",
    code: "OP-06",
    title: "Civic Round",
    brief:
      "People first. Bring the district hospital online, then the school beside it — the first civic heartbeat of the new city.",
    objective: "Bring the hospital online.",
    targets: [
      {
        id: "hospital",
        label: "District hospital",
        objective: "Reach the district hospital and press E to power the wards.",
        fallback: ["fire"],
      },
      {
        id: "school",
        label: "School",
        objective: "Then reach the school and press E to open the classrooms.",
        fallback: ["guesthouse"],
      },
    ],
    reward: { xp: 110, credits: 250 },
    codex:
      "The civic round pairs a district hospital with the neighbourhood school — the two facilities the first residents of the Activation Area will judge the city by.",
  },
  {
    id: "stadium",
    code: "OP-07",
    title: "Stadium Lights",
    brief:
      "The sports complex is ready for its first match. Drive out and switch on the floodlights.",
    objective: "Reach the stadium and press E to light the ground.",
    targets: [
      {
        id: "stadium",
        label: "Stadium",
        fallback: ["sports-complex", "residential-blocks", "aa-residential", "activation"],
      },
    ],
    reward: { xp: 120, credits: 280 },
    codex:
      "The stadium anchors the sports zone of the town plan: a bowl set inside the residential band so most of the city is within a short drive of a match.",
  },
  {
    id: "market",
    code: "OP-08",
    title: "Market Day",
    brief:
      "The city centre market has stalls but no lights, no tills. Open the high street and let Dholera trade.",
    objective: "Reach the city centre market and press E to open the high street.",
    targets: [{ id: "market", label: "City centre market", fallback: ["city-center", "aa-commercial", "activation"] }],
    reward: { xp: 130, credits: 320 },
    codex:
      "The market is the commercial heart of the city centre: stalls, food courts and the high street that ties the Activation Area to the town-planning bands.",
  },
  {
    id: "gateway",
    code: "OP-09",
    title: "Gulf Gateway",
    brief:
      "One last run. Bring the airport link online, then finish at the solar park — the gulf gateway that ties the SIR to the world.",
    objective: "Bring the airport link online.",
    targets: [
      {
        id: "airport",
        label: "Dholera International Airport",
        objective: "Reach the airport and press E to bring the gulf gateway online.",
        fallback: ["aerocity", "airport-link"],
      },
      {
        id: "solar",
        label: "Solar park",
        objective: "Finish at the solar park and press E to switch on the gulf gateway.",
        fallback: ["zone-solar"],
      },
    ],
    reward: { xp: 170, credits: 420 },
    codex:
      "The gulf gateway is the airport plus the 300 MW solar park: an aviation hub about 20 km from Dholera, and the clean power that lets the rest of the plan breathe.",
  },
];

export const MISSION_BY_ID = Object.fromEntries(MISSIONS.map((mission) => [mission.id, mission]));

export function isFinitePoint(point) {
  return Boolean(point) && Number.isFinite(point.x) && Number.isFinite(point.z);
}

export function insideRect(rect, x, z) {
  return Boolean(rect) && x >= rect.minX && x <= rect.maxX && z >= rect.minZ && z <= rect.maxZ;
}

export function pointInPolygon(poly, x, z) {
  if (!Array.isArray(poly) || poly.length < 3) return false;
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

/**
 * Height of the drivable/walkable surface at a point.
 * Activation Area pad top = layout.ground, SIR plinth = layout.pad, salt flat = 0.35.
 */
export function getGroundY(layout, x, z) {
  if (!layout) return 0;
  if (layout.activation && insideRect(layout.activation, x, z)) return layout.ground ?? 3.3;
  if (pointInPolygon(layout.sir, x, z)) return layout.pad ?? 2;
  return 0.35;
}

/** Look a single landmark id up across every source the contract allows. */
export function coordsFor(layout, places, id) {
  if (!id || typeof id !== "string") return null;
  const place = places && typeof places === "object" ? places[id] : null;
  if (place && Number.isFinite(place.x) && Number.isFinite(place.z)) {
    return { x: place.x, z: place.z, label: typeof place.title === "string" && place.title ? place.title : id, source: "place" };
  }
  const named = layout?.namedPoints?.[id];
  if (isFinitePoint(named)) return { x: named.x, z: named.z, label: id, source: "named" };
  // layout.namedPoints.canal is not populated by layout.js; derive the canal
  // midpoint from its polyline so OP-03 has a real target.
  if (id === "canal" && Array.isArray(layout?.canal?.polyline) && layout.canal.polyline.length >= 2) {
    const [a, b] = layout.canal.polyline;
    return { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2, label: "Central canal", source: "canal" };
  }
  if (id === "airport" && isFinitePoint(layout?.airport)) {
    return { x: layout.airport.x, z: layout.airport.z, label: "Dholera International Airport", source: "region" };
  }
  if (id === "solar" && isFinitePoint(layout?.solar)) {
    return { x: layout.solar.x, z: layout.solar.z, label: "Solar park", source: "region" };
  }
  const block = layout?.blocks?.[{ "sub-torrent": "subTorrent" }[id] || id];
  if (block && !Array.isArray(block) && isFinitePoint(block)) {
    return { x: block.x, z: block.z, label: id, source: "block" };
  }
  return null;
}

function insideCollider(colliders, x, z, clearance) {
  if (!Array.isArray(colliders)) return false;
  for (const box of colliders) {
    if (!box) continue;
    if (x > box.minX - clearance && x < box.maxX + clearance && z > box.minZ - clearance && z < box.maxZ + clearance) {
      return true;
    }
  }
  return false;
}

/**
 * Some landmark coordinates are the centre of a solid building. The player can
 * never stand there, so push the interaction point out to the nearest open
 * ground with a deterministic ring search.
 */
export function findFreeSpot(layout, colliders, x, z, clearance = 7) {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return { x: 0, z: 0 };
  if (!insideCollider(colliders, x, z, clearance)) return { x, z };
  const rings = [40, 70, 110, 160, 220, 300, 400, 520, 680];
  for (const radius of rings) {
    for (let step = 0; step < 16; step++) {
      const angle = (step / 16) * Math.PI * 2 + radius * 0.0013;
      const px = x + Math.cos(angle) * radius;
      const pz = z + Math.sin(angle) * radius;
      if (!insideCollider(colliders, px, pz, clearance)) return { x: px, z: pz };
    }
  }
  return { x, z };
}

/** Resolve one target entry to a reachable interaction point. */
export function resolveTarget(layout, places, colliders, target, missionLabel) {
  if (!target) return null;
  const ids = [target.id, ...(target.fallback || [])].filter(Boolean);
  for (const id of ids) {
    const coords = coordsFor(layout, places, id);
    if (!coords) continue;
    const spot = findFreeSpot(layout, colliders, coords.x, coords.z, 8);
    return {
      id,
      label: target.label || missionLabel || coords.label || id,
      x: coords.x,
      z: coords.z,
      standX: spot.x,
      standZ: spot.z,
      y: getGroundY(layout, spot.x, spot.z),
      source: coords.source,
    };
  }
  return null;
}

/**
 * Resolve every target of a mission. If a mission's whole chain is missing
 * (district not built yet, tests passing stubs) it falls back to the Activation
 * Area centre instead of crashing, so the run stays completable.
 */
export function resolveMissionTargets(layout, places, colliders, mission) {
  const resolved = [];
  for (const target of mission.targets || []) {
    const point = resolveTarget(layout, places, colliders, target, mission.title);
    if (point) resolved.push(point);
  }
  if (resolved.length) return resolved;
  const fallback = coordsFor(layout, places, "activation") || { x: 0, z: 0 };
  const spot = findFreeSpot(layout, colliders, fallback.x, fallback.z, 8);
  return [
    {
      id: "activation",
      label: "Activation Area",
      x: fallback.x,
      z: fallback.z,
      standX: spot.x,
      standZ: spot.z,
      y: getGroundY(layout, spot.x, spot.z),
      source: "fallback",
    },
  ];
}

export function distance2D(ax, az, bx, bz) {
  return Math.hypot(ax - bx, az - bz);
}
