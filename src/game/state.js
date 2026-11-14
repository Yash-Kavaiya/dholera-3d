/**
 * Dholera Rising — City Ops: progress state, XP levels and persistence.
 *
 * Pure module (no Three.js, no DOM beyond an optional localStorage guard) so the
 * progression rules can be unit-tested headlessly with `node --input-type=module`.
 */

export const SAVE_KEY = "dholera-rising-v1";

/** XP needed to be at index+1 level. Level 1 starts at 0, level 5 at 900. */
export const LEVELS = [0, 120, 300, 560, 900];
export const MAX_LEVEL = LEVELS.length;

export function levelForXp(xp) {
  const value = Number.isFinite(xp) ? xp : 0;
  let level = 1;
  for (let i = 0; i < LEVELS.length; i++) {
    if (value >= LEVELS[i]) level = i + 1;
  }
  return level;
}

/** Progress inside the current level band, for the HUD XP bar. */
export function levelProgress(xp) {
  const value = Math.max(0, Number.isFinite(xp) ? xp : 0);
  const level = levelForXp(value);
  const current = LEVELS[level - 1];
  const next = level < LEVELS.length ? LEVELS[level] : null;
  if (next === null) return { level, current, next: null, span: 0, into: 0, ratio: 1, max: true };
  const span = next - current;
  const into = Math.min(Math.max(0, value - current), span);
  return { level, current, next, span, into, ratio: span > 0 ? into / span : 1, max: false };
}

export function emptyState() {
  return { xp: 0, credits: 0, completed: [], shards: [] };
}

function defaultStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function int(value, fallback = 0) {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function idList(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((entry) => typeof entry === "string" && entry.length > 0))];
}

function shardList(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((entry) => Number.isInteger(entry) && entry >= 0))].sort((a, b) => a - b);
}

export function sanitizeState(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  return {
    xp: int(source.xp),
    credits: int(source.credits),
    completed: idList(source.completed),
    shards: shardList(source.shards),
  };
}

export function loadState(storage = defaultStorage()) {
  if (!storage) return emptyState();
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return emptyState();
    return sanitizeState(JSON.parse(raw));
  } catch {
    return emptyState();
  }
}

export function saveState(state, storage = defaultStorage()) {
  const clean = sanitizeState(state);
  if (!storage) return clean;
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(clean));
  } catch {
    /* storage full or blocked — the run still works in-memory */
  }
  return clean;
}

export function clearState(storage = defaultStorage()) {
  if (!storage) return;
  try {
    storage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * In-memory store with write-through persistence. Every mutation emits `change`
 * so the HUD can refresh without polling.
 */
export function createStore(storage = defaultStorage()) {
  let state = loadState(storage);
  const listeners = new Set();

  function commit() {
    state = saveState(state, storage);
    for (const listener of listeners) listener(state);
  }

  return {
    get state() {
      return state;
    },
    get level() {
      return levelForXp(state.xp);
    },
    get progress() {
      return levelProgress(state.xp);
    },
    addXp(amount) {
      const add = int(amount);
      if (!add) return state.xp;
      state = { ...state, xp: state.xp + add };
      commit();
      return state.xp;
    },
    addCredits(amount) {
      const add = int(amount);
      if (!add) return state.credits;
      state = { ...state, credits: state.credits + add };
      commit();
      return state.credits;
    },
    completeMission(id) {
      if (typeof id !== "string" || state.completed.includes(id)) return false;
      state = { ...state, completed: [...state.completed, id] };
      commit();
      return true;
    },
    collectShard(index) {
      if (!Number.isInteger(index) || index < 0 || state.shards.includes(index)) return false;
      state = { ...state, shards: [...state.shards, index].sort((a, b) => a - b) };
      commit();
      return true;
    },
    isMissionComplete(id) {
      return state.completed.includes(id);
    },
    hasShard(index) {
      return state.shards.includes(index);
    },
    reset() {
      state = emptyState();
      clearState(storage);
      for (const listener of listeners) listener(state);
      return state;
    },
    /** Force a save of the current in-memory state (e.g. after a bulk debug action). */
    save() {
      commit();
      return state;
    },
    snapshot() {
      return JSON.parse(JSON.stringify(state));
    },
    onChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
