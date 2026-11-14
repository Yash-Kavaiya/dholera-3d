/**
 * Dholera Rising — City Ops
 * Game layer entry point. Contract: docs/GAME-DESIGN.md "Shared interface".
 *
 * Everything under src/game/ is self-contained: the team Lead wires this module
 * into src/main.js with a couple of calls and an update() in the frame loop.
 *
 *   const game = createGame({ scene, camera, layout, groups, colliders, places,
 *     getMode, enterWalk, leaveWalk, flyToPoint, toast, setTimeOfDay, setFuture,
 *     onGameMode });
 *
 * Design notes
 * - The game never edits the rest of the repo; it only reads layout/places and
 *   adds its own meshes + #game-hud DOM.
 * - `update()` returns true only while the rover owns the camera; main.js skips
 *   its walk/fly camera updates then.
 * - All state transitions are event driven (keys, clicks, debug hooks) so QA can
 *   drive the whole chain from `window.__dholera.game.debug`.
 */

import * as THREE from "three";
import { createHud } from "./hud.js";
import { createStore, levelProgress } from "./state.js";
import {
  MISSIONS,
  DRIVE_RADIUS,
  WALK_RADIUS,
  coordsFor,
  findFreeSpot,
  insideRect,
  pointInPolygon,
  resolveMissionTargets,
} from "./missions.js";
import { createMarker } from "./markers.js";
import { createCollectibles, SHARD_COUNT } from "./collectibles.js";
import { createDrive } from "./drive.js";
import { createAudio } from "./audio.js";
import { walkerEstimate, screenArrow, formatDistance, formatCredits } from "./interaction.js";

const CHARTER_MIN_DISTANCE = 2200;
const AUTOPILOT_ARRIVE = 55;
const SHARD_WALK_RADIUS = 22;
const SHARD_DRIVE_RADIUS = 30;
const SHARD_XP = 15;
const SHARD_CREDITS = 20;

function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

/** Wrap to (−π, π]. */
function wrapAngle(angle) {
  let value = angle;
  while (value > Math.PI) value -= Math.PI * 2;
  while (value < -Math.PI) value += Math.PI * 2;
  return value;
}

function pad2(value) {
  return String(Math.max(0, value)).padStart(2, "0");
}

export function createGame(options = {}) {
  const scene = options.scene;
  const camera = options.camera;
  const layout = options.layout ?? null;
  const colliders = Array.isArray(options.colliders) ? options.colliders : [];
  const places = options.places && typeof options.places === "object" ? options.places : {};

  const getMode = typeof options.getMode === "function" ? options.getMode : () => "fly";
  const enterWalk = typeof options.enterWalk === "function" ? options.enterWalk : () => {};
  const leaveWalk = typeof options.leaveWalk === "function" ? options.leaveWalk : () => {};
  const restoreWalk = typeof options.restoreWalk === "function" ? options.restoreWalk : null;
  const flyToPoint = typeof options.flyToPoint === "function" ? options.flyToPoint : () => {};
  const toastOption = typeof options.toast === "function" ? options.toast : () => {};
  const setTimeOfDay = typeof options.setTimeOfDay === "function" ? options.setTimeOfDay : () => {};
  const setFuture = typeof options.setFuture === "function" ? options.setFuture : () => {};
  const onGameMode = typeof options.onGameMode === "function" ? options.onGameMode : () => {};

  const hasScene = Boolean(scene && camera && typeof scene.add === "function");

  const store = createStore(options.storage);
  const audio = createAudio();
  const hud = createHud({
    onBegin: () => beginRun(),
    onResume: () => {},
    onLog: () => openLog(),
    onPause: () => openPause(),
    onIntro: () => showIntro(),
    onReset: () => resetRun(),
    onQuit: () => stop(),
    onReplay: () => replay(),
    onClose: () => {},
  });

  const marker = hasScene ? createMarker(scene, { groundY: layout?.ground ?? 3 }) : null;
  const collectibles = hasScene
    ? createCollectibles({
        scene,
        layout,
        places,
        colliders,
        onCollect: (index) => onShardCollected(index),
      })
    : null;
  const drive = hasScene ? createDrive({ scene, camera, layout, colliders }) : null;

  // Guide chrome stays clickable under body.game-on (the minimap and labels are
  // not hidden by hud.css). Swallow those guide handlers while a run is live so
  // clicking the map cannot teleport the fly camera out from under the game.
  if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
    window.addEventListener(
      "click",
      (event) => {
        if (!active) return;
        const target = event.target instanceof Element ? event.target : null;
        if (target && target.closest("#map, #labels")) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      },
      true,
    );
  }

  let active = false;
  let started = false;
  let driving = false;
  let autopilot = false;
  let time = 0;
  let missionIndex = 0;
  let targetIndex = 0;
  let shardSet = new Set(store.state.shards);
  let gameStartedWalk = false;
  let charterBusy = false;
  let autopilotStuck = 0;
  let completionTimer = 0;
  let travelHintTimer = 0;
  let introShown = false;
  let resolvedMissions = buildChain();
  syncFromSave();
  const tmpDir = new THREE.Vector3();

  // ------------------------------------------------------------------ chain

  function buildChain() {
    return MISSIONS.map((mission) => ({
      ...mission,
      targets: resolveMissionTargets(layout, places, colliders, mission),
    }));
  }

  function syncFromSave() {
    missionIndex = resolvedMissions.findIndex((mission) => !store.state.completed.includes(mission.id));
    if (missionIndex < 0) missionIndex = resolvedMissions.length;
    targetIndex = 0;
  }

  function currentMission() {
    return missionIndex >= 0 && missionIndex < resolvedMissions.length ? resolvedMissions[missionIndex] : null;
  }

  function currentTarget() {
    const mission = currentMission();
    if (!mission) return null;
    return mission.targets[Math.min(targetIndex, mission.targets.length - 1)] || null;
  }

  function isChainComplete() {
    return missionIndex >= resolvedMissions.length;
  }

  // ------------------------------------------------------------- lifecycle

  function activate() {
    if (active) return;
    active = true;
    resolvedMissions = buildChain();
    syncFromSave();
    shardSet = new Set(store.state.shards);
    collectibles?.setCollected([...shardSet]);
    collectibles?.setVisible(false);
    hud.show();
    refreshStats();
    if (typeof onGameMode === "function") onGameMode(true);
    audio.ensure();
  }

  function start() {
    activate();
    if (started) return;
    if (isChainComplete()) {
      started = true;
      refreshMarker();
      refreshStats();
      refreshObjectiveHud();
      hud.confetti();
      hud.showCompletion({ stats: buildStats(), missionCount: resolvedMissions.length, shards: shardSet.size });
      return;
    }
    showIntro();
  }

  function startIfNeededForDebug() {
    if (!active) start();
    if (!started) beginRun();
  }

  function showIntro() {
    introShown = true;
    const saved = store.state.completed.length > 0 || store.state.xp > 0 || store.state.shards.length > 0;
    hud.showIntro({
      hasSave: saved,
      level: store.level,
      completed: store.state.completed.length,
      shards: shardSet.size,
      missionCount: resolvedMissions.length,
    });
  }

  function beginRun() {
    if (!active) activate();
    if (isChainComplete()) {
      hud.closeOverlay();
      return;
    }
    hud.closeOverlay();
    introShown = false;
    started = true;
    autopilot = false;
    audio.ensure();
    audio.ui();
    if (!gameStartedWalk) {
      gameStartedWalk = true;
      enterWalk();
    }
    collectibles?.setVisible(true);
    refreshShardsFromSave();
    refreshStats();
    refreshMarker();
    refreshObjectiveHud();
    const mission = currentMission();
    if (mission) {
      hud.toast({
        title: `${mission.code} · ${mission.title}`,
        detail: mission.objective,
        tone: "info",
        duration: 4600,
      });
    }
  }

  function stop() {
    if (!active) return;
    active = false;
    started = false;
    autopilot = false;
    charterBusy = false;
    clearTimeout(completionTimer);
    clearTimeout(travelHintTimer);
    hud.closeOverlay();
    hud.setDriving(false);
    marker?.setVisible(false);
    collectibles?.setVisible(false);
    if (driving) {
      driving = false;
      drive?.release();
    }
    hud.hide();
    if (typeof onGameMode === "function") onGameMode(false);
    if (getMode() === "walk") leaveWalk();
    gameStartedWalk = false;
    introShown = false;
  }

  function replay() {
    resetRun();
    if (!active) return;
    started = false;
    showIntro();
  }

  function resetRun() {
    store.reset();
    shardSet.clear();
    collectibles?.reset();
    collectibles?.setCollected([]);
    missionIndex = 0;
    targetIndex = 0;
    autopilot = false;
    charterBusy = false;
    clearTimeout(completionTimer);
    clearTimeout(travelHintTimer);
    if (driving) {
      driving = false;
      drive?.release();
      hud.setDriving(false);
      if (active) enterWalk();
    }
    hud.closeOverlay();
    refreshStats();
    refreshMarker();
    refreshObjectiveHud();
    if (active) showIntro();
    return getStats();
  }

  // --------------------------------------------------------------- driving

  function toggleDrive() {
    if (driving) {
      exitDrive();
      return;
    }
    if (!drive) return;
    if (getMode() !== "walk") {
      hud.toast({
        title: "Rover unavailable here",
        detail: "Summon it while walking in the Activation Area.",
        duration: 2600,
      });
      return;
    }
    const walker = hasScene ? walkerEstimate(camera) : { x: 0, z: 0 };
    const spawn = drive.findSpawn(walker.x, walker.z);
    camera.getWorldDirection(tmpDir);
    const yaw = Math.atan2(-tmpDir.x, -tmpDir.z);
    leaveWalk(false);
    driving = true;
    autopilot = false;
    drive.summonAt(spawn.x, spawn.z, yaw);
    hud.setDriving(true, 0, false);
    audio.rover();
    hud.toast({
      title: "Rover online",
      detail: "WASD drive · Space brake · Shift boost · C exit · T autopilot",
      duration: 3400,
    });
    refreshObjectiveHud();
  }

  function exitDrive() {
    if (!driving) return;
    const exit = drive ? { x: drive.x, z: drive.z, yaw: drive.yaw } : null;
    driving = false;
    autopilot = false;
    drive?.release();
    hud.setDriving(false);
    if (started && exit) {
      const walkable =
        insideRect(layout?.activation, exit.x, exit.z) || pointInPolygon(layout?.sir, exit.x, exit.z);
      if (restoreWalk && walkable) {
        restoreWalk(exit.x, exit.z, exit.yaw);
      } else {
        enterWalk();
        if (restoreWalk && !walkable) {
          hud.toast({
            title: "Returning to the Activation Area",
            detail: "There is no walkable ground out here.",
            duration: 2600,
          });
        }
      }
      gameStartedWalk = true;
    }
    refreshObjectiveHud();
    hud.toast({ title: "Back on foot", detail: "Press C to summon the rover again.", duration: 2300 });
  }

  function readDriveInput(keys) {
    const forward = (keys?.KeyW || keys?.ArrowUp ? 1 : 0) - (keys?.KeyS || keys?.ArrowDown ? 1 : 0);
    const steer = (keys?.KeyA || keys?.ArrowLeft ? 1 : 0) - (keys?.KeyD || keys?.ArrowRight ? 1 : 0);
    return {
      throttle: forward,
      steer,
      brake: Boolean(keys?.Space),
      boost: Boolean(keys?.ShiftLeft || keys?.ShiftRight),
    };
  }

  function autopilotInput(dt) {
    const target = currentTarget();
    if (!target || !drive) return { throttle: 0, steer: 0, brake: true };
    const dx = target.standX - drive.x;
    const dz = target.standZ - drive.z;
    const distance = Math.hypot(dx, dz);
    const desired = Math.atan2(-dx, -dz);
    const diff = wrapAngle(desired - drive.yaw);
    const steer = clamp(diff * 1.5, -1, 1);
    let throttle = 1;
    let brake = false;

    if (Math.abs(diff) > 1.4) throttle = 0.1;
    else if (Math.abs(diff) > 0.7) throttle = 0.45;
    if (distance < AUTOPILOT_ARRIVE + 30) {
      throttle = 0;
      brake = true;
    }
    if (distance < AUTOPILOT_ARRIVE) {
      autopilot = false;
      hud.toast({ title: "Autopilot disengaged", detail: "Press E to activate the objective.", duration: 2400 });
      refreshObjectiveHud();
    }
    // Stuck against a collider? hand control back to the player.
    if (Math.abs(drive.speed) < 0.9 && distance > 120) {
      autopilotStuck += dt;
      if (autopilotStuck > 2.2) {
        autopilotStuck = 0;
        autopilot = false;
        hud.toast({ title: "Autopilot paused", detail: "Obstacle ahead — take the wheel.", duration: 2300 });
        refreshObjectiveHud();
      }
    } else {
      autopilotStuck = 0;
    }
    return { throttle, steer, brake, boost: false };
  }

  function handleTravel() {
    if (!driving || !drive) return;
    const target = currentTarget();
    if (!target) return;
    const distance = Math.hypot(target.standX - drive.x, target.standZ - drive.z);
    if (distance > CHARTER_MIN_DISTANCE) {
      charterTo(target, distance);
      return;
    }
    autopilot = !autopilot;
    autopilotStuck = 0;
    hud.toast({
      title: autopilot ? "Autopilot engaged" : "Autopilot disengaged",
      detail: autopilot ? `Route set for ${target.label}.` : "Manual control.",
      duration: 2200,
    });
    hud.setDriving(true, drive.kmh, autopilot);
    refreshObjectiveHud();
  }

  function charterTo(target, distance) {
    if (charterBusy) return;
    charterBusy = true;
    autopilot = false;
    hud.fade(true);
    audio.rover();
    hud.toast({
      title: "CIOC charter reroute",
      detail: `${formatDistance(distance)} to ${target.label} — bringing the rover forward.`,
      duration: 2600,
    });
    setTimeout(() => {
      charterBusy = false;
      if (!active || !driving || !drive) {
        hud.fade(false);
        return;
      }
      const dx = target.standX - drive.x;
      const dz = target.standZ - drive.z;
      const remaining = Math.hypot(dx, dz);
      // Land inside the 90 m interaction radius so E works right after the flight.
      const stop = Math.min(60, Math.max(35, remaining * 0.6));
      const t = remaining > 0 ? Math.max(0, 1 - stop / remaining) : 1;
      const nx = drive.x + dx * t;
      const nz = drive.z + dz * t;
      const yaw = Math.atan2(-dx, -dz);
      drive.setPosition(nx, nz, yaw);
      hud.fade(false);
      refreshObjectiveHud();
    }, 700);
  }

  // ------------------------------------------------------------ interaction

  function playerPosition() {
    if (driving && drive) return { x: drive.x, z: drive.z };
    if (!camera || !camera.position) return { x: 0, z: 0 };
    if (getMode() === "walk") {
      const walker = walkerEstimate(camera);
      return { x: walker.x, z: walker.z };
    }
    return { x: camera.position.x, z: camera.position.z };
  }

  function distanceToTarget(target) {
    if (!target) return Infinity;
    const player = playerPosition();
    return Math.hypot(target.standX - player.x, target.standZ - player.z);
  }

  function tryInteract() {
    if (!started || hud.isOverlayOpen()) return;
    const mission = currentMission();
    const target = currentTarget();
    if (!mission || !target) return;
    const distance = distanceToTarget(target);
    const radius = driving ? DRIVE_RADIUS : WALK_RADIUS;
    if (distance > radius) {
      hud.toast({
        title: "Move closer",
        detail: `${formatDistance(distance)} to ${target.label} — get within ${radius} m.`,
        duration: 2400,
      });
      return;
    }
    audio.ui();
    targetIndex += 1;
    marker?.flash();
    if (targetIndex < mission.targets.length) {
      const next = mission.targets[targetIndex];
      refreshMarker();
      refreshObjectiveHud();
      hud.toast({
        title: `${target.label} online`,
        detail: `Next: ${next.label} · ${formatDistance(distanceToTarget(next))}`,
        tone: "info",
        duration: 3200,
      });
      return;
    }
    completeMission(mission);
  }

  function completeMission(mission) {
    const levelBefore = store.level;
    store.completeMission(mission.id);
    store.addXp(mission.reward.xp);
    store.addCredits(mission.reward.credits);
    missionIndex += 1;
    targetIndex = 0;
    audio.mission();
    hud.flashReward({ title: `${mission.code} · ${mission.title}`, xp: mission.reward.xp, credits: mission.reward.credits });
    refreshStats();
    const levelAfter = store.level;
    if (levelAfter > levelBefore) {
      setTimeout(() => {
        if (!active) return;
        audio.levelUp();
        hud.toast({ title: `Level ${levelAfter}`, detail: "Operator clearance increased.", duration: 3200 });
      }, 900);
    }
    if (isChainComplete()) finishChain();
    else {
      refreshMarker();
      refreshObjectiveHud();
      scheduleTravelHint();
    }
  }

  /** Nudge the player toward the rover when the next objective is a long drive. */
  function scheduleTravelHint() {
    clearTimeout(travelHintTimer);
    const mission = currentMission();
    if (!mission) return;
    const target = mission.targets[0];
    const distance = distanceToTarget(target);
    if (!Number.isFinite(distance) || distance <= 700) return;
    travelHintTimer = setTimeout(() => {
      if (!active || !started || hud.isOverlayOpen() || !currentMission()) return;
      hud.toast({
        title: "Long-range objective",
        detail: `${formatDistance(distance)} away — press C for the rover, then T to charter.`,
        duration: 4400,
      });
    }, 1700);
  }

  function finishChain() {
    marker?.setVisible(false);
    autopilot = false;
    try {
      setTimeOfDay("golden");
    } catch {
      /* lighting callback is main.js's business */
    }
    if (typeof toastOption === "function") toastOption("City Ops complete — golden hour over Dholera");
    audio.complete();
    hud.confetti();
    clearTimeout(completionTimer);
    completionTimer = setTimeout(() => {
      if (!active) return;
      hud.showCompletion({ stats: buildStats(), missionCount: resolvedMissions.length, shards: shardSet.size });
    }, 1100);
  }

  function onShardCollected(index) {
    if (store.hasShard(index)) {
      shardSet.add(index);
      return;
    }
    if (store.collectShard(index)) {
      store.addXp(SHARD_XP);
      store.addCredits(SHARD_CREDITS);
      shardSet = new Set(store.state.shards);
      audio.shard();
      refreshStats();
      hud.toast({
        title: "Data shard recovered",
        detail: `+${SHARD_XP} XP · +${formatCredits(SHARD_CREDITS)} · ${shardSet.size}/${SHARD_COUNT}`,
        duration: 2600,
      });
    }
  }

  // ------------------------------------------------------------------- HUD

  function buildStats() {
    return {
      ...getStats(),
      progress: levelProgress(store.state.xp),
      completed: store.state.completed.length,
      shardTotal: SHARD_COUNT,
    };
  }

  function refreshStats() {
    hud.setStats({
      level: store.level,
      xp: store.state.xp,
      credits: store.state.credits,
      shards: shardSet.size,
      progress: levelProgress(store.state.xp),
    });
  }

  function refreshShardsFromSave() {
    shardSet = new Set(store.state.shards);
    collectibles?.setCollected([...shardSet]);
  }

  function refreshMarker() {
    const mission = currentMission();
    if (!started || !mission || hud.getOverlay() === "complete") {
      marker?.setVisible(false);
      return;
    }
    const target = mission.targets[Math.min(targetIndex, mission.targets.length - 1)];
    if (!target) {
      marker?.setVisible(false);
      return;
    }
    marker?.setTarget({ x: target.standX, z: target.standZ, y: target.y });
    marker?.setVisible(true);
  }

  /** Live mission card, distance, in-range prompt and off-screen arrow. */
  function refreshObjectiveHud() {
    const mission = currentMission();
    if (!mission) {
      hud.setMission({ done: true, index: resolvedMissions.length, total: resolvedMissions.length, title: "City online", objective: "Every operation complete. Keep roaming.", progress: 1 });
      hud.setArrow(false);
      if (driving && drive) hud.setDriving(true, drive.kmh, autopilot);
      return;
    }
    const target = mission.targets[Math.min(targetIndex, mission.targets.length - 1)];
    const distance = distanceToTarget(target);
    const radius = driving ? DRIVE_RADIUS : WALK_RADIUS;
    const within = mission.targets.length > 1 ? targetIndex / mission.targets.length : 0;
    const progress = (missionIndex + within) / resolvedMissions.length;
    hud.setMission({
      index: missionIndex + 1,
      total: resolvedMissions.length,
      title: mission.title,
      objective: target?.objective || mission.objective,
      distance,
      inRange: distance <= radius,
      driving,
      autopilot,
      progress,
    });
    if (target) {
      const arrow = screenArrow(camera, target.standX, target.y + 24, target.standZ);
      hud.setArrow(arrow.visible, arrow.angleDeg, arrow.x, arrow.y);
    } else {
      hud.setArrow(false);
    }
    if (driving && drive) hud.setDriving(true, drive.kmh, autopilot);
  }

  function openLog() {
    const missions = resolvedMissions.map((mission, index) => ({
      number: index + 1,
      title: mission.title,
      brief: mission.brief,
      xp: mission.reward.xp,
      credits: mission.reward.credits,
      status: store.state.completed.includes(mission.id) ? "done" : index === missionIndex ? "active" : "locked",
    }));
    hud.showLog({ missions, activeIndex: Math.min(missionIndex, resolvedMissions.length - 1) });
  }

  function openPause() {
    const codex = resolvedMissions.map((mission) => ({ title: mission.title, text: mission.codex }));
    hud.showPause({
      stats: { level: store.level, xp: store.state.xp, credits: store.state.credits, missionIndex: Math.min(missionIndex, resolvedMissions.length) },
      codex,
      completed: store.state.completed.length,
      shards: shardSet.size,
      missionCount: resolvedMissions.length,
    });
  }

  // --------------------------------------------------------------- frame

  function update(dt, keys, mode) {
    void mode;
    if (!active) {
      marker?.setVisible(false);
      collectibles?.setVisible(false);
      return false;
    }
    const step = Math.min(Math.max(dt || 0, 0), 0.05);
    time += step;

    // Overlays freeze the sim; keep camera ownership so main.js does not hand
    // the camera to fly/walk behind the pause card (walking keys stay inert too).
    if (hud.isOverlayOpen()) {
      marker?.update(step, time);
      if (driving && drive) hud.setDriving(true, drive.kmh, autopilot);
      return true;
    }

    if (!started) {
      marker?.update(step, time);
      return false;
    }

    if (driving && drive) {
      const input = autopilot ? autopilotInput(step) : readDriveInput(keys);
      drive.update(step, input);
      hud.setDriving(true, drive.kmh, autopilot);
      collectibles?.update(step, time, { x: drive.x, z: drive.z }, SHARD_DRIVE_RADIUS);
      marker?.update(step, time);
      refreshObjectiveHud();
      return true;
    }

    // E is the game's interact key; main.js's walk module would also treat a
    // held E as "turn right", so clear it after the game has consumed it.
    if (keys && keys.KeyE) keys.KeyE = false;
    const player = playerPosition();
    collectibles?.update(step, time, player, SHARD_WALK_RADIUS);
    marker?.update(step, time);
    refreshObjectiveHud();
    return false;
  }

  // -------------------------------------------------------------- keyboard

  function handleKey(event) {
    if (!active || !event || !event.code) return false;
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLSelectElement ||
      event.target instanceof HTMLTextAreaElement
    ) {
      return false;
    }
    const code = event.code;
    const overlay = hud.getOverlay();

    if (code === "Escape") {
      if (overlay === "intro") {
        beginRun();
      } else if (overlay) {
        hud.closeOverlay();
      } else {
        openPause();
        audio.ui();
      }
      return true;
    }

    if (code === "KeyP") {
      if (event.repeat) return true;
      if (overlay === "pause") hud.closeOverlay();
      else if (overlay) {
        hud.closeOverlay();
        openPause();
      } else openPause();
      audio.ui();
      return true;
    }

    if (code === "KeyJ") {
      if (event.repeat) return true;
      if (overlay === "log") hud.closeOverlay();
      else if (overlay) {
        hud.closeOverlay();
        openLog();
      } else openLog();
      audio.ui();
      return true;
    }

    // Block main.js's orbit toggle and guide help modal while a run is live.
    if (code === "KeyO" || code === "KeyH") return true;

    if (overlay) {
      if (code === "Enter" && overlay === "intro") {
        beginRun();
        return true;
      }
      if (code === "Space" || code === "KeyE" || code === "KeyC" || code === "KeyT") return true;
      return false;
    }

    if (code === "Enter" && !started) {
      beginRun();
      return true;
    }
    if (code === "KeyE") {
      if (event.repeat) return true;
      tryInteract();
      return true;
    }
    if (code === "KeyC") {
      if (event.repeat) return true;
      toggleDrive();
      return true;
    }
    if (code === "KeyF") {
      if (driving) {
        exitDrive();
        return true;
      }
      return false; // let main.js keep fullscreen on F outside the rover
    }
    if (code === "KeyT") {
      if (event.repeat) return true;
      if (driving) {
        handleTravel();
        return true;
      }
      return false;
    }
    if (code === "KeyR") {
      if (event.repeat) return true;
      hud.showResetConfirm({ from: "pause" });
      return true;
    }
    return false;
  }

  // ------------------------------------------------------------------- API

  function getStats() {
    const mission = currentMission();
    const target = currentTarget();
    const targetDistance = mission && target ? Math.round(distanceToTarget(target)) : null;
    return {
      xp: store.state.xp,
      level: store.level,
      credits: store.state.credits,
      missionIndex,
      missionTotal: resolvedMissions.length,
      missionId: mission ? mission.id : null,
      missionTitle: mission ? mission.title : isChainComplete() ? "City online" : null,
      targetId: target ? target.id : null,
      targetDistance,
      shards: shardSet.size,
      shardTotal: SHARD_COUNT,
      driving,
      active,
    };
  }

  function getMinimapBlips() {
    if (!active || !started) return [];
    const blips = [];
    const target = currentTarget();
    if (target) blips.push({ x: target.x, z: target.z, kind: "mission" });
    if (collectibles) blips.push(...collectibles.blips());
    return blips;
  }

  function teleportTo(idOrX, maybeZ) {
    startIfNeededForDebug();
    let coords = null;
    if (typeof idOrX === "number" && typeof maybeZ === "number") {
      coords = { x: idOrX, z: maybeZ };
    } else if (typeof idOrX === "string") {
      coords = coordsFor(layout, places, idOrX);
      if (!coords) {
        const mission = resolvedMissions.find((entry) => entry.id === idOrX);
        if (mission && mission.targets[0]) coords = { x: mission.targets[0].x, z: mission.targets[0].z };
      }
    }
    if (!coords || !Number.isFinite(coords.x) || !Number.isFinite(coords.z)) return null;
    const spot = findFreeSpot(layout, colliders, coords.x, coords.z, 10);
    if (!driving) {
      if (getMode() === "walk") leaveWalk(false);
      if (!drive) return { x: spot.x, z: spot.z };
      driving = true;
      autopilot = false;
      drive.summonAt(spot.x, spot.z, 0);
      hud.setDriving(true, 0, false);
    } else if (drive) {
      drive.setPosition(spot.x, spot.z);
    }
    refreshMarker();
    refreshObjectiveHud();
    return { x: spot.x, z: spot.z, label: coords.label || coords.id || null };
  }

  function completeCurrent() {
    startIfNeededForDebug();
    const mission = currentMission();
    if (!mission) return getStats();
    targetIndex = Math.max(0, mission.targets.length - 1);
    targetIndex = mission.targets.length - 1;
    completeMission(mission);
    return getStats();
  }

  function collectAll() {
    startIfNeededForDebug();
    let added = 0;
    for (let index = 0; index < SHARD_COUNT; index++) {
      if (store.collectShard(index)) {
        store.addXp(SHARD_XP);
        store.addCredits(SHARD_CREDITS);
        added += 1;
      }
    }
    shardSet = new Set(store.state.shards);
    collectibles?.setCollected([...shardSet]);
    refreshStats();
    return { added, total: shardSet.size };
  }

  function debugReset() {
    return resetRun();
  }

  const game = {
    start,
    stop,
    get active() {
      return active;
    },
    update,
    handleKey,
    getMinimapBlips,
    getStats,
    debug: {
      teleportTo,
      completeCurrent,
      collectAll,
      reset: debugReset,
    },
    /** Extra QA/debug surface (not part of the required contract). */
    getMissions() {
      return resolvedMissions.map((mission, index) => ({
        id: mission.id,
        index,
        status: store.state.completed.includes(mission.id) ? "done" : index === missionIndex ? "active" : "locked",
        targets: mission.targets.map((target) => ({ id: target.id, label: target.label, x: target.standX, z: target.standZ, resolved: target.source })),
      }));
    },
    getTarget() {
      return currentTarget();
    },
    getMissionIndex() {
      return missionIndex;
    },
    flyToPoint,
    setFuture,
  };

  return game;
}
