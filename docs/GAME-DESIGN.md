# Dholera 3D — build contract (Lead-owned, binding)

Goal: the existing schematic model at `/explore/` becomes a **fully realised 3D city game**:
solid, detailed buildings and structures across the whole SIR, plus a playable
mission-based game layer. It must still build with `npm run build` and pass `npm run check`.

Repo: `C:\Users\yashk\Downloads\dholera-3d` (Vite + vanilla JS + Three.js 0.170).
Dev server is already running at `http://localhost:5173/explore/` (Lead owns it — do not start another).

## Hard rules

- **Write only inside your assigned scope.** Never edit `src/main.js`, `src/ui/*`,
  `explore/index.html`, `src/geo/layout.js`, `src/content/*`, `src/data/*`, `package.json`,
  or another teammate's files. Lead wires everything together.
- Read any file you need. Keep `npm run check` green (run it before reporting).
- Deterministic output (seeded random), no network assets, no new dependencies.
- Performance budget for the whole scene: **< 900 draw calls**, **< 1.8 M triangles**.
  Merge static geometry per material (`BufferGeometryUtils.mergeGeometries`) and use
  `InstancedMesh` for repeated elements. Shadows are off: do not enable `castShadow`.
- Coordinates: metres, Y up, +X east, −Z north. Ground for the Activation Area is
  `layout.ground` (3.3); the regional plinth top is `layout.pad` (2).

## Shared interface (do not change without asking Lead)

### `src/world/district.js` (city-builder) — new
```js
export function buildDistrict(groups, labels) // groups: { built, planned, zones, villages, roads, utilities, water }
// returns:
{
  update(time),            // animate nothing essential; optional
  colliders: [ { minX, maxX, minZ, maxZ } ],   // solid buildings near/inside Activation Area + major landmarks
  places: {                // MUST contain at least these ids, each { x, z, title }:
    "city-center", "stadium", "campus", "logistics-hub", "aerocity", "port",
    "central-park", "market", "tech-park", "metro"
  },
  stats: { buildings, drawMeshes }
}
```
The district is the rest of the city (town-planning bands TP1–TP6 outside the
Activation Area): street grid, solid buildings, landmarks, parks, aerocity, port,
village settlements. It must read `layout` (read-only) for geometry.

### `src/game/index.js` (game-dev) — new, self-contained module tree under `src/game/`
```js
export function createGame(options) // options:
{
  scene, camera, layout, groups,
  colliders,             // walk colliders + district.colliders, for drive collision
  places,                // district.places (above)
  getMode,               // () => "fly" | "walk" | "tour"
  enterWalk,             // () => void  (main enters walk mode at spawn; resets position)
  leaveWalk,             // () => void  (main returns to fly)
  restoreWalk,           // (x, z, yaw?) => void  (enter walk at a world position, no spawn reset — use on rover exit)
  flyToPoint,            // (x, z, alt) => void  (main animates the fly camera)
  toast,                 // (text, kind?) => void
  setTimeOfDay,          // ("day"|"golden"|"dusk"|"night") => void
  setFuture,             // (on) => void
  onGameMode,            // (on:boolean) => void  (main adds/removes body.game-on)
}
// returns:
{
  start(), stop(), active,
  update(dt, keys, mode), // every frame; MUST return true when the game is driving the camera
  handleKey(event),       // keydown; return true when consumed (e/E, c/C, j/J, p/P, Escape, r/R)
  getMinimapBlips(),      // [{ x, z, kind: "mission"|"shard" }]
  getStats(),             // { xp, level, credits, missionIndex, shards, driving, active }
  debug: {                // for QA automation
    teleportTo(id), completeCurrent(), collectAll(), reset()
  }
}
```
The game injects its own HUD DOM (`#game-hud`) and imports its own `hud.css`.
Game mode hides the guide chrome via `body.game-on`; do not restyle shell.css.

## Game design (game-dev)

Title: **"Dholera Rising — City Ops"**. You are the CIOC field operator activating
the smart city. Mission chain (9, sequential) + 12 data shards + drive mode.

- Start: brief overlay → start walk mode inside the Activation Area near the ABCD/CIOC
  building. HUD shows mission 01, objective, live distance, XP/level/credits, controls hint.
- Missions use these targets: `bec` (CIOC), `wtp`, `canal`, `sub-torrent`, `semicon`,
  `hospital`, `school`, `stadium`, `market`, `city-center`, `campus`, `metro`,
  `airport`, `solar`, `port`, `logistics-hub`, `central-park`, `aerocity`, `tech-park`.
  Resolve coordinates: `places[id]` → `layout.namedPoints[id]` → `layout.blocks[id]` →
  `layout.airport/solar`; skip a mission only if really unresolvable.
- Reach an objective (radius 45 m walking / 90 m driving) and press **E** to interact
  ("bring online"). Each gives XP + credits, toast, chime optional.
- XP levels: 1 (0), 2 (120), 3 (300), 4 (560), 5 (900). At level 3 call `setFuture(true)`?
  No — keep Future manual; instead final mission completion triggers the completion
  overlay and `setTimeOfDay("golden")` + fireworks-style confetti in HUD.
- 12 glowing data shards near landmarks: +20 credits +15 XP on proximity pickup, respawn
  on game reset. Shown on minimap.
- **Drive mode**: press **C** to summon/enter a rover at the player position (works in
  walk mode; auto switches out of walk via leaveWalk and back via enterWalk on exit).
  Arcade physics: accelerate/brake/steer with inertia, top speed ~48 m/s, collide with
  `colliders` boxes and the plinth bounds; chase camera; speed readout in HUD; **C** or
  **F** exits. Game.update returns true while driving and positions the camera.
- Objective marker in 3D: vertical glowing beam + pulsing ring at the active target;
  minimap blip via getMinimapBlips(); off-screen arrow near screen edge.
- Save to `localStorage` key `dholera-rising-v1` (xp, credits, completed, shards,
  level). Reset button in HUD (with confirm). "P" opens codex/pause, "J" mission log.
- **Do not break** the existing guide/tour: when game is off, no game HUD, no keys consumed.

## World design (city-builder)

Make the model read as a real city, in this priority order:

1. **Activation Area (22.54 km²)**: replace every translucent ghost mass in
   `src/world/activation.js` with solid, detailed buildings (upgrade `archetypes.js`):
   ABCD/CIOC landmark, SPV, city hall + plaza, commercial high street, 3 residential
   towers + mid-rise housing blocks, school, hospital, fire station, hotel, guest house,
   food court, market, transit/metro station, parking structure, sports complex/stadium,
   parks with paths/water, industrial sheds, semicon fab campus, substations, STP/CETP/WTP,
   ESRs, canal bridge details. Solid materials, ribbon windows, emissive glass at night
   (reuse `windowMat`/`lampMat` so time-of-day keeps working). Keep existing userData tags
   and colliders; add a few more labels only for major landmarks.
2. **Full city**: `district.js` fills TP1–TP6 with a real street network (arterials,
   avenues, local streets, medians, lane markings via cheap materials), sidewalks, street
   lamps, trees, and **solid buildings in blocks** — towers, offices, apartments, industrial
   sheds, warehouses, schools, clinics, markets, village settlements — using seeded
   procedural placement aligned to the road grid, not random scatter. Add the 10 required
   `places` landmarks as larger set-piece structures (stadium bowl, convention centre,
   tech campus, logistics hub, aerocity near airport, port on the gulf shore, central park).
3. **Region**: upgrade `src/world/region.js` airport (terminal, apron, hangars, tower,
   taxiing planes), solar park edge treatment, village settlements (houses, water tank,
   temple, fields), port/coastal works. Keep animations working.
4. Keep `src/world/future.js` as the "growth/phase 2" extra skyline; it may stay simpler.

Style: warm desert-modern, off-white/limestone + glass teal + copper accents, matching the
site palette (`src/world/materials.js`). Detail matters at 50–300 m viewing distance.

## QA / verification

Use `node scripts/shot.mjs --url http://localhost:5173/explore/ --out shots/<name>.png --wait 5000 --eval "<js>" --settle 4000`
(CDP + cached Chromium; works without Playwright). Useful eval snippets:
- skip splash: `document.querySelector('#skip').click()`
- open chapter: `document.querySelector('#chapters button[data-id=activation]').click()`
- probe: `--probe "JSON.stringify({ ready: !!window.__dholera, calls: window.__dholera?.renderer?.info.render.calls })"`

Report back to Lead with: files changed, exact exports, check/build status, screenshots,
and any contract deviation.
