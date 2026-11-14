/**
 * Dholera Rising — City Ops: DOM HUD, overlays, toasts and confetti.
 *
 * The game owns this file: injects #game-hud once, imports its own hud.css, and
 * only reads the rest of the page. All buttons are wired through data-action so
 * the markup can be re-rendered without leaking listeners.
 */

import "./hud.css";
import { formatCredits, formatDistance } from "./interaction.js";

const HUD_ID = "game-hud";

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

function pad2(value) {
  return String(Math.max(0, value)).padStart(2, "0");
}

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HTML = `
<header class="gh-top">
  <div class="gh-brand">
    <span class="gh-kicker">Dholera SIR · City Ops</span>
    <span class="gh-name">Dholera Rising</span>
    <span class="gh-sub">Field Operator HUD</span>
  </div>
  <div class="gh-meters">
    <div class="gh-meter gh-level-meter">
      <div class="gh-level-row">
        <span class="gh-level-chip" data-level>LVL 1</span>
        <span class="gh-xp-label" data-xp-label>0 / 120 XP</span>
      </div>
      <div class="gh-xp-track"><div class="gh-xp-fill" data-xp-fill></div></div>
    </div>
    <div class="gh-meter gh-credit-meter">
      <span class="gh-meter-label">Credits</span>
      <span class="gh-meter-value"><span class="gh-coin">₹</span><b data-credits>0</b></span>
    </div>
    <div class="gh-meter gh-shard-meter">
      <span class="gh-meter-label">Shards</span>
      <span class="gh-meter-value"><span class="gh-shard-diamond"></span><b data-shards>0</b><small>/12</small></span>
    </div>
  </div>
</header>

<aside class="gh-mission">
  <div class="gh-mission-head">
    <span class="gh-mission-no" data-mission-no>Mission 01 / 09</span>
    <div class="gh-badges">
      <span class="gh-badge" data-badge-drive>Rover</span>
      <span class="gh-badge" data-badge-auto>Autopilot</span>
    </div>
  </div>
  <h2 class="gh-mission-title" data-mission-title>Boot the CIOC</h2>
  <p class="gh-mission-objective" data-mission-objective>Reach the ABCD building and press E to power the CIOC.</p>
  <div class="gh-mission-foot">
    <span class="gh-distance" data-distance>—</span>
    <span class="gh-prompt" data-prompt>Press <kbd>E</kbd> to activate</span>
  </div>
  <div class="gh-mission-bar"><i data-mission-fill></i></div>
</aside>

<div class="gh-arrow" aria-hidden="true" data-arrow><span>➤</span></div>

<div class="gh-controls" data-controls>
  <span class="gh-key walk-only"><kbd>WASD</kbd> Move</span>
  <span class="gh-key walk-only"><kbd>Shift</kbd> Sprint</span>
  <span class="gh-key walk-only"><kbd>Drag</kbd> Look</span>
  <span class="gh-key"><kbd>E</kbd> Interact</span>
  <span class="gh-key"><kbd>C</kbd> Rover</span>
  <span class="gh-key drive-only"><kbd>Space</kbd> Brake</span>
  <span class="gh-key drive-only"><kbd>Shift</kbd> Boost</span>
  <span class="gh-key drive-only"><kbd>T</kbd> Autopilot</span>
  <span class="gh-key"><kbd>J</kbd> Log</span>
  <span class="gh-key"><kbd>P</kbd> Codex</span>
  <span class="gh-key"><kbd>Esc</kbd> Pause</span>
</div>

<div class="gh-speed" data-speed><b data-speed-value>0</b><span>km/h</span><em>Rover</em></div>

<div class="gh-toasts" data-toasts></div>
<div class="gh-fade" data-fade></div>
<div class="gh-confetti" data-confetti></div>

<div class="gh-overlay" data-overlay hidden>
  <div class="gh-card" data-card role="dialog" aria-modal="true"></div>
</div>
`;

export function createHud(callbacks = {}) {
  const stale = document.getElementById(HUD_ID);
  if (stale) stale.remove();

  const root = document.createElement("div");
  root.id = HUD_ID;
  root.setAttribute("role", "region");
  root.setAttribute("aria-label", "Dholera Rising — City Ops HUD");
  root.innerHTML = HTML;
  document.body.append(root);

  const $ = (selector) => root.querySelector(selector);
  const elements = {
    level: $("[data-level]"),
    xpLabel: $("[data-xp-label]"),
    xpFill: $("[data-xp-fill]"),
    credits: $("[data-credits]"),
    shards: $("[data-shards]"),
    missionNo: $("[data-mission-no]"),
    missionTitle: $("[data-mission-title]"),
    missionObjective: $("[data-mission-objective]"),
    distance: $("[data-distance]"),
    prompt: $("[data-prompt]"),
    missionFill: $("[data-mission-fill]"),
    missionCard: $(".gh-mission"),
    badgeDrive: $("[data-badge-drive]"),
    badgeAuto: $("[data-badge-auto]"),
    controls: $("[data-controls]"),
    speed: $("[data-speed]"),
    speedValue: $("[data-speed-value]"),
    arrow: $("[data-arrow]"),
    toasts: $("[data-toasts]"),
    overlay: $("[data-overlay]"),
    card: $("[data-card]"),
    fade: $("[data-fade]"),
    confetti: $("[data-confetti]"),
  };

  let overlayKind = null;
  let resetFrom = null;
  let last = {
    level: null,
    xp: null,
    credits: null,
    shards: null,
    missionNo: null,
    title: null,
    objective: null,
    distance: null,
    inRange: null,
    driving: null,
    autopilot: null,
    speed: null,
    arrowAngle: null,
    arrowVisible: null,
  };
  let confettiTimer = 0;
  let fadeTimer = 0;

  // ------------------------------------------------------------ core state

  function show() {
    document.body.classList.add("game-on");
  }

  function hide() {
    document.body.classList.remove("game-on");
    closeOverlay();
    elements.toasts.replaceChildren();
    elements.confetti.replaceChildren();
    elements.fade.classList.remove("on");
  }

  function setStats(stats = {}) {
    const level = Number.isFinite(stats.level) ? stats.level : 1;
    const xp = Number.isFinite(stats.xp) ? stats.xp : 0;
    const progress = stats.progress || { ratio: 0, max: false, into: 0, span: 0 };
    const credits = Number.isFinite(stats.credits) ? stats.credits : 0;
    const shards = Number.isFinite(stats.shards) ? stats.shards : 0;

    if (last.level !== level) {
      elements.level.textContent = `LVL ${level}`;
      last.level = level;
    }
    const xpLabel = progress.max ? `${xp} XP · MAX` : `${progress.into} / ${progress.span} XP`;
    if (last.xp !== xpLabel) {
      elements.xpLabel.textContent = xpLabel;
      elements.xpFill.style.width = `${Math.round((progress.ratio || 0) * 100)}%`;
      last.xp = xpLabel;
    }
    if (last.credits !== credits) {
      elements.credits.textContent = formatCredits(credits).replace("₹", "");
      last.credits = credits;
    }
    if (last.shards !== shards) {
      elements.shards.textContent = String(shards);
      last.shards = shards;
    }
  }

  function setMission(mission = {}) {
    const done = Boolean(mission.done);
    const index = Number.isFinite(mission.index) ? mission.index : 1;
    const total = Number.isFinite(mission.total) ? mission.total : 9;
    const missionNo = done ? "City ops complete" : `Mission ${pad2(index)} / ${pad2(total)}`;
    if (last.missionNo !== missionNo) {
      elements.missionNo.textContent = missionNo;
      last.missionNo = missionNo;
    }
    const title = mission.title || "—";
    if (last.title !== title) {
      elements.missionTitle.textContent = title;
      last.title = title;
    }
    const objective = mission.objective || "—";
    if (last.objective !== objective) {
      elements.missionObjective.textContent = objective;
      last.objective = objective;
    }
    const distance = done ? "—" : formatDistance(mission.distance);
    if (last.distance !== distance) {
      elements.distance.textContent = distance;
      last.distance = distance;
    }
    const inRange = Boolean(mission.inRange) && !done;
    if (last.inRange !== inRange) {
      elements.prompt.classList.toggle("on", inRange);
      elements.distance.style.color = inRange ? "var(--gh-teal)" : "";
      last.inRange = inRange;
    }
    const driving = Boolean(mission.driving);
    if (last.driving !== driving) {
      elements.badgeDrive.classList.toggle("on", driving);
      elements.controls.classList.toggle("driving", driving);
      last.driving = driving;
    }
    const autopilot = Boolean(mission.autopilot);
    if (last.autopilot !== autopilot) {
      elements.badgeAuto.classList.toggle("on", autopilot);
      last.autopilot = autopilot;
    }
    elements.missionCard.classList.toggle("gh-mission-done", done);
    const progress = done ? 1 : Number.isFinite(mission.progress) ? Math.max(0, Math.min(1, mission.progress)) : 0;
    elements.missionFill.style.width = `${Math.round(progress * 100)}%`;
    elements.missionTitle.classList.toggle("gh-mission-done-title", done);
  }

  function setDriving(driving, speedKmh = 0, autopilot = false) {
    elements.speed.classList.toggle("on", Boolean(driving));
    elements.speed.querySelector("em").textContent = autopilot ? "Autopilot" : "Rover";
    const rounded = Math.max(0, Math.round(speedKmh));
    if (last.speed !== rounded) {
      elements.speedValue.textContent = String(rounded);
      last.speed = rounded;
    }
  }

  function setArrow(visible, angleDeg = 0, x = 0, y = 0) {
    const showArrow = Boolean(visible);
    if (last.arrowVisible !== showArrow) {
      elements.arrow.classList.toggle("on", showArrow);
      last.arrowVisible = showArrow;
    }
    if (showArrow) {
      const angle = Math.round(angleDeg * 10) / 10;
      if (last.arrowAngle !== angle) {
        elements.arrow.style.setProperty("--gh-arrow-angle", `${angle}deg`);
        last.arrowAngle = angle;
      }
      elements.arrow.style.setProperty("--gh-arrow-x", `${Math.round(x)}px`);
      elements.arrow.style.setProperty("--gh-arrow-y", `${Math.round(y)}px`);
    }
  }

  // --------------------------------------------------------------- toasts

  function toast(options = {}) {
    const { title, detail, tone = "", duration = 2600 } = options;
    const node = document.createElement("div");
    node.className = `gh-toast gh-tone-${tone || "info"}`;
    const titleNode = document.createElement("span");
    titleNode.className = "gh-toast-title";
    titleNode.textContent = title || "";
    node.append(titleNode);
    if (detail) {
      const detailNode = document.createElement("span");
      detailNode.className = "gh-toast-detail";
      detailNode.textContent = detail;
      node.append(detailNode);
    }
    elements.toasts.append(node);
    while (elements.toasts.children.length > 3) elements.toasts.firstElementChild.remove();
    const remove = () => {
      if (!node.isConnected) return;
      node.classList.add("gh-toast-out");
      setTimeout(() => node.remove(), 340);
    };
    setTimeout(remove, duration);
  }

  function flashReward({ title, xp, credits }) {
    toast({
      title: title || "Operation complete",
      detail: `+${xp || 0} XP  ·  +${formatCredits(credits || 0)}`,
      tone: "reward",
      duration: 3400,
    });
  }

  // ------------------------------------------------------------- overlays

  function openOverlay(kind, html, { narrow = false } = {}) {
    overlayKind = kind;
    elements.card.classList.toggle("gh-card-narrow", narrow);
    elements.card.innerHTML = html;
    elements.overlay.hidden = false;
    elements.card.scrollTop = 0;
  }

  function closeOverlay() {
    elements.overlay.hidden = true;
    elements.card.innerHTML = "";
    overlayKind = null;
    resetFrom = null;
  }

  function isOverlayOpen() {
    return overlayKind !== null;
  }

  function getOverlay() {
    return overlayKind;
  }

  function legend() {
    return `
      <div class="gh-controls-grid">
        <div class="gh-control-row"><span class="gh-keys"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></span> Walk / drive</div>
        <div class="gh-control-row"><span class="gh-keys"><kbd>Shift</kbd></span> Sprint / boost</div>
        <div class="gh-control-row"><span class="gh-keys"><kbd>E</kbd></span> Interact with the objective</div>
        <div class="gh-control-row"><span class="gh-keys"><kbd>C</kbd></span> Summon / exit the rover</div>
        <div class="gh-control-row"><span class="gh-keys"><kbd>T</kbd></span> Autopilot / charter flight</div>
        <div class="gh-control-row"><span class="gh-keys"><kbd>J</kbd></span> Mission log</div>
        <div class="gh-control-row"><span class="gh-keys"><kbd>P</kbd></span> Pause &amp; codex</div>
        <div class="gh-control-row"><span class="gh-keys"><kbd>Esc</kbd></span> Close / pause</div>
      </div>`;
  }

  function showIntro({ hasSave = false, level = 1, completed = 0, shards = 0, missionCount = 9 } = {}) {
    const saveNote = hasSave
      ? `<p class="gh-save-note"><strong>Operation in progress</strong> — Level ${level} · ${completed} of ${missionCount} ops complete · ${shards}/12 data shards recovered. Your last run will resume from the city spawn.</p>`
      : "";
    openOverlay(
      "intro",
      `
      <p class="gh-kicker">Dholera SIR · Activation Area</p>
      <h1 class="gh-title">Dholera <span class="gh-title-accent">Rising</span></h1>
      <p class="gh-lede">The city is built. The systems are dark. As the CIOC field operator you will bring water, power, industry and civic life online across nine operations — then finish at the gulf gateway.</p>
      ${saveNote}
      <div class="gh-chips">
        <span class="gh-chip"><strong>${pad2(missionCount)}</strong> Operations</span>
        <span class="gh-chip"><strong>12</strong> Data shards</span>
        <span class="gh-chip"><strong>01</strong> Rover</span>
      </div>
      ${legend()}
      <div class="gh-actions">
        <button class="gh-btn primary" type="button" data-action="begin">${hasSave ? "Resume operation" : "Begin operation"}</button>
        <button class="gh-btn" type="button" data-action="log">Mission log</button>
        ${hasSave ? '<button class="gh-btn gh-btn-quiet" type="button" data-action="reset">New operation</button>' : ""}
      </div>
      <p class="gh-fineprint">Progress saves automatically to this browser. You can reset it any time from the pause menu.</p>
    `,
    );
  }

  function showLog({ missions = [], activeIndex = 0 } = {}) {
    const rows = missions
      .map((mission, index) => {
        const number = mission.number || index + 1;
        const status = mission.status || "locked";
        const statusLabel = status === "done" ? "Online" : status === "active" ? "Active" : "Locked";
        return `
        <div class="gh-log-item is-${esc(status)}">
          <span class="gh-log-no">${pad2(number)}</span>
          <div>
            <p class="gh-log-name">${esc(mission.title)}</p>
            <p class="gh-log-brief">${esc(mission.brief)}</p>
            <p class="gh-log-reward">+${mission.xp} XP · +${formatCredits(mission.credits)}</p>
          </div>
          <span class="gh-status is-${esc(status)}">${statusLabel}</span>
        </div>`;
      })
      .join("");
    const done = missions.filter((mission) => mission.status === "done").length;
    openOverlay(
      "log",
      `
      <p class="gh-kicker">City ops · ${done} of ${missions.length} complete</p>
      <h2 class="gh-title-sm">Mission log</h2>
      <p class="gh-lede gh-muted">The chain is sequential. Each operation pays XP and credits, and the city grows with every system you bring online.</p>
      <div class="gh-log">${rows || '<p class="gh-fineprint">No operations resolved yet.</p>'}</div>
      <div class="gh-actions">
        <button class="gh-btn primary" type="button" data-action="close">Back to the field</button>
        <button class="gh-btn" type="button" data-action="pause">Pause &amp; codex</button>
      </div>
      <p class="gh-fineprint">Active operation: ${pad2(activeIndex + 1)} — the copper marker in the world shows where to go.</p>
    `,
    );
  }

  function showPause({ stats = {}, codex = [], completed = 0, shards = 0, missionCount = 9 } = {}) {
    const codexRows = codex
      .map(
        (entry, index) => `
      <div class="gh-codex-item">
        <h4><span>${pad2(index + 1)}</span>${esc(entry.title)}</h4>
        <p>${esc(entry.text)}</p>
      </div>`,
      )
      .join("");
    openOverlay(
      "pause",
      `
      <p class="gh-kicker">City ops · Paused</p>
      <h2 class="gh-title-sm">Operations codex</h2>
      <div class="gh-pause-grid">
        <div>
          <p class="gh-subhead">Operator record</p>
          <div class="gh-stat-list">
            <div class="gh-stat"><span>Level</span><b>${stats.level ?? 1}</b></div>
            <div class="gh-stat"><span>XP</span><b>${stats.xp ?? 0}</b></div>
            <div class="gh-stat"><span>Credits</span><b>${formatCredits(stats.credits ?? 0)}</b></div>
            <div class="gh-stat"><span>Shards</span><b>${shards}/12</b></div>
            <div class="gh-stat"><span>Operations</span><b>${completed}/${missionCount}</b></div>
            <div class="gh-stat"><span>Mission</span><b>${pad2(Math.min(stats.missionIndex + 1, missionCount))}/${pad2(missionCount)}</b></div>
          </div>
          <div class="gh-pause-actions">
            <button class="gh-btn primary" type="button" data-action="resume">Resume</button>
            <button class="gh-btn" type="button" data-action="log">Mission log</button>
            <button class="gh-btn danger" type="button" data-action="reset">Reset progress</button>
            <button class="gh-btn gh-btn-quiet" type="button" data-action="quit">Exit to guide</button>
          </div>
        </div>
        <div>
          <p class="gh-subhead">Landmark codex</p>
          <div class="gh-codex">${codexRows || '<p class="gh-fineprint">Codex entries unlock with the mission chain.</p>'}</div>
        </div>
      </div>
      <p class="gh-fineprint">Press <kbd>P</kbd> or <kbd>Esc</kbd> to resume. Everything you have earned is saved.</p>
    `,
    );
  }

  function showResetConfirm({ from = "pause" } = {}) {
    resetFrom = from;
    openOverlay(
      "reset",
      `
      <p class="gh-kicker">Reset city ops</p>
      <h2 class="gh-title-sm">Start the operation over?</h2>
      <p class="gh-lede">This clears all XP, credits, completed missions and collected data shards for this browser. It cannot be undone.</p>
      <div class="gh-actions">
        <button class="gh-btn danger" type="button" data-action="reset-confirm">Yes, reset everything</button>
        <button class="gh-btn" type="button" data-action="reset-cancel">Keep my progress</button>
      </div>
    `,
      { narrow: true },
    );
  }

  function showCompletion({ stats = {}, missionCount = 9, shards = 0 } = {}) {
    openOverlay(
      "complete",
      `
      <div class="gh-complete">
        <p class="gh-kicker">Dholera SIR · All systems online</p>
        <h1 class="gh-title">City <span class="gh-title-accent">Online</span></h1>
        <p class="gh-lede">Every operation in the chain is complete. The CIOC has water, power, industry, civic life, a stadium, a market — and a gulf gateway. Dholera is rising.</p>
        <div class="gh-complete-stats">
          <div class="gh-stat"><span>Operations</span><b>${missionCount}/${missionCount}</b></div>
          <div class="gh-stat"><span>Shards</span><b>${shards}/12</b></div>
          <div class="gh-stat"><span>Level</span><b>${stats.level ?? 5}</b></div>
          <div class="gh-stat"><span>Credits</span><b>${formatCredits(stats.credits ?? 0)}</b></div>
        </div>
        <div class="gh-complete-actions">
          <button class="gh-btn primary" type="button" data-action="replay">Run it again</button>
          <button class="gh-btn" type="button" data-action="close">Keep roaming</button>
          <button class="gh-btn gh-btn-quiet" type="button" data-action="quit">Exit to guide</button>
        </div>
        <p class="gh-fineprint">Final XP: ${stats.xp ?? 0} · All progress saved locally.</p>
      </div>
    `,
    );
  }

  // -------------------------------------------------------------- effects

  function confetti() {
    const rng = mulberry32(20261109);
    const colors = ["#b5693a", "#e0a06a", "#3f93a8", "#f3eee4", "#1c1915"];
    elements.confetti.replaceChildren();
    for (let i = 0; i < 46; i++) {
      const piece = document.createElement("span");
      piece.style.setProperty("--x", `${(rng() * 100).toFixed(2)}%`);
      piece.style.setProperty("--c", colors[Math.floor(rng() * colors.length)]);
      piece.style.setProperty("--dur", `${(2.4 + rng() * 2.4).toFixed(2)}s`);
      piece.style.setProperty("--delay", `${(rng() * 0.7).toFixed(2)}s`);
      piece.style.setProperty("--rot", `${Math.round((rng() - 0.5) * 1080)}deg`);
      elements.confetti.append(piece);
    }
    clearTimeout(confettiTimer);
    confettiTimer = setTimeout(() => elements.confetti.replaceChildren(), 5600);
  }

  function fade(on) {
    elements.fade.classList.toggle("on", Boolean(on));
    clearTimeout(fadeTimer);
    if (on) fadeTimer = setTimeout(() => elements.fade.classList.remove("on"), 650);
  }

  // -------------------------------------------------------------- dispatch

  const actions = {
    begin: () => callbacks.onBegin?.(),
    resume: () => {
      closeOverlay();
      callbacks.onResume?.();
    },
    log: () => callbacks.onLog?.(),
    pause: () => callbacks.onPause?.(),
    reset: () => showResetConfirm({ from: overlayKind || "pause" }),
    "reset-confirm": () => {
      callbacks.onReset?.();
    },
    "reset-cancel": () => {
      if (resetFrom === "intro") callbacks.onIntro?.();
      else callbacks.onPause?.();
    },
    quit: () => {
      closeOverlay();
      callbacks.onQuit?.();
    },
    replay: () => {
      closeOverlay();
      callbacks.onReplay?.();
    },
    close: () => {
      closeOverlay();
      callbacks.onClose?.();
    },
  };

  elements.overlay.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    if (actions[action]) {
      event.preventDefault();
      actions[action]();
    }
  });

  return {
    root,
    show,
    hide,
    setStats,
    setMission,
    setDriving,
    setArrow,
    toast,
    flashReward,
    showIntro,
    showLog,
    showPause,
    showResetConfirm,
    showCompletion,
    closeOverlay,
    isOverlayOpen,
    getOverlay,
    confetti,
    fade,
    get card() {
      return elements.card;
    },
    dispose() {
      clearTimeout(confettiTimer);
      clearTimeout(fadeTimer);
      root.remove();
    },
  };
}

export { HUD_ID };
