import { chapters, disclaimer, entryFor, futureView, layers, sources, timeline, villages, zones, places } from "../content/city.js";
import { layout } from "../geo/layout.js";
import { minimapClickToWorld } from "./minimap.js";

export function createShell(handlers) {
  const app = document.querySelector("#app");
  const brand = document.querySelector("#brand");
  const tools = document.querySelector("#tools");
  const nav = document.querySelector("#chapters");
  const select = document.querySelector("#chapter-select");
  const panel = document.querySelector("#panel");
  const arrive = document.querySelector("#arrive");
  const hint = document.querySelector("#hint");
  const mapCanvas = document.querySelector("#map");

  let chapterId = "region";
  let todModes = ["day", "golden", "dusk", "night"];
  let todIndex = 0;
  let orbiting = false;

  brand.innerHTML = `<a class="home" href="/" title="Back to the guide"><div class="gu">ધોલેરા સ્માર્ટ સિટી</div><strong>Dholera SIR</strong><small>← Back to guide</small></a>`;

  // Search input
  const search = document.createElement("input");
  search.type = "search";
  search.placeholder = "Search 22 villages, zones, projects…";
  search.setAttribute("aria-label", "Search villages, zones, and chapters");
  const results = document.createElement("div");
  results.className = "results";
  results.hidden = true;

  // Primary Tool Buttons
  const gameBtn = document.createElement("button");
  gameBtn.textContent = "▶ Play";
  gameBtn.title = "Play Dholera Rising: city-ops missions, collectibles and rover driving";
  gameBtn.className = "play";

  const walkBtn = document.createElement("button");
  walkBtn.textContent = "Walk";
  walkBtn.title = "Explore street-level in Activation Area (W/A/S/D)";
  walkBtn.hidden = matchMedia("(pointer: coarse)").matches;

  const tourBtn = document.createElement("button");
  tourBtn.textContent = "Tour";
  tourBtn.title = "Cinematic aerial flyover tour of key landmarks";

  const orbitBtn = document.createElement("button");
  orbitBtn.textContent = "Orbit";
  orbitBtn.title = "360° drone orbit around current focal point";

  const todBtn = document.createElement("button");
  todBtn.textContent = "☀️ Day";
  todBtn.title = "Cycle Lighting: Day → Golden Hour → Dusk → Night";

  const futureBtn = document.createElement("button");
  futureBtn.textContent = "Future";
  futureBtn.title = "Preview the published programme: planned and started works";
  futureBtn.setAttribute("aria-pressed", "false");

  const soundBtn = document.createElement("button");
  soundBtn.textContent = "🔇 Sound";
  soundBtn.title = "Toggle spatial atmospheric audio (wind, waves, city hum)";

  const statsBtn = document.createElement("button");
  statsBtn.textContent = "📊 Stats";
  statsBtn.title = "Dholera Investment & Infrastructure Dashboard";

  const snapBtn = document.createElement("button");
  snapBtn.textContent = "📷";
  snapBtn.title = "Capture screenshot";
  snapBtn.style.minWidth = "32px";

  const helpBtn = document.createElement("button");
  helpBtn.textContent = "?";
  helpBtn.title = "Keyboard shortcuts and navigation guide";
  helpBtn.style.minWidth = "32px";
  helpBtn.style.fontWeight = "bold";

  tools.append(
    search,
    gameBtn,
    walkBtn,
    tourBtn,
    orbitBtn,
    todBtn,
    futureBtn,
    soundBtn,
    statsBtn,
    snapBtn,
    helpBtn,
    results
  );

  // Chapters navigation
  for (const chapter of chapters) {
    const button = document.createElement("button");
    button.textContent = chapter.label;
    button.dataset.id = chapter.id;
    button.addEventListener("click", () => openChapter(chapter.id));
    nav.append(button);
    const option = document.createElement("option");
    option.value = chapter.id;
    option.textContent = chapter.label;
    select.append(option);
  }
  select.addEventListener("change", () => openChapter(select.value));

  // Splash Screen Intro Content
  arrive.innerHTML = `
    <p class="kicker">Gulf of Khambhat · Gujarat · India</p>
    <p class="gu">ધોલેરા સ્પેશિયલ ઇન્વેસ્ટમેન્ટ રીજન</p>
    <h1>Dholera</h1>
    <p>Explore India's premier greenfield industrial smart city. 920 km² region, 422 km² town-planning area, and the 22.54 km² Activation Area with world-class plug-and-play trunk infrastructure.</p>
    <div class="row">
      <button class="primary" id="enter" type="button">Take Guided Tour</button>
      <button id="skip" type="button">Free Fly Roam</button>
      <button id="view-stats" type="button">View Key Facts</button>
    </div>`;

  arrive.querySelector("#enter").addEventListener("click", () => {
    app.classList.add("flying");
    handlers.onEnter();
  });
  arrive.querySelector("#skip").addEventListener("click", () => {
    app.classList.add("flying");
    openChapter("region");
    handlers.onSkip();
  });
  arrive.querySelector("#view-stats").addEventListener("click", () => {
    app.classList.add("flying");
    openChapter("region");
    toggleStats(true);
  });

  walkBtn.addEventListener("click", () => handlers.onWalk());
  gameBtn.addEventListener("click", () => {
    if (handlers.onGame) handlers.onGame();
  });
  tourBtn.addEventListener("click", () => {
    app.classList.add("flying");
    handlers.onTour();
  });

  orbitBtn.addEventListener("click", () => {
    orbiting = !orbiting;
    orbitBtn.setAttribute("aria-pressed", String(orbiting));
    if (handlers.onOrbit) handlers.onOrbit(orbiting);
  });

  todBtn.addEventListener("click", () => {
    todIndex = (todIndex + 1) % todModes.length;
    const mode = todModes[todIndex];
    document.body.classList.toggle("dusk", mode === "dusk" || mode === "night");
    const icons = { day: "☀️ Day", golden: "🌅 Golden", dusk: "🌆 Dusk", night: "🌙 Night" };
    todBtn.textContent = icons[mode];
    if (handlers.onTimeOfDay) handlers.onTimeOfDay(mode);
    else if (handlers.onDusk) handlers.onDusk(mode === "dusk" || mode === "night");
  });

  futureBtn.addEventListener("click", () => {
    const on = futureBtn.getAttribute("aria-pressed") !== "true";
    setFutureUi(on);
    handlers.onFuture(on);
  });

  soundBtn.addEventListener("click", () => {
    if (handlers.onToggleSound) {
      const active = handlers.onToggleSound();
      soundBtn.textContent = active ? "🔊 Sound" : "🔇 Sound";
      soundBtn.setAttribute("aria-pressed", String(active));
    }
  });

  snapBtn.addEventListener("click", () => {
    if (handlers.onScreenshot) handlers.onScreenshot();
  });

  function setFutureUi(on) {
    futureBtn.setAttribute("aria-pressed", String(on));
    futureBtn.textContent = on ? "Now" : "Future";
  }

  // Layer filters
  for (const layer of layers) {
    const button = document.createElement("button");
    button.textContent = layer.label;
    button.setAttribute("aria-pressed", layer.id === "utilities" ? "false" : "true");
    button.addEventListener("click", () => {
      const on = button.getAttribute("aria-pressed") !== "true";
      button.setAttribute("aria-pressed", String(on));
      handlers.onLayer(layer.id, on);
    });
    tools.append(button);
  }

  // Stats Dashboard Drawer Panel
  const statsPanel = document.createElement("aside");
  statsPanel.id = "stats-panel";
  statsPanel.hidden = true;
  statsPanel.innerHTML = `
    <div class="stats-header">
      <h2>Dholera Smart City Metrics</h2>
      <button class="stats-close" type="button">×</button>
    </div>
    <div class="kpi-grid">
      <div class="kpi-card highlight">
        <span class="kpi-num">920</span>
        <span class="kpi-unit">km²</span>
        <span class="kpi-label">Total SIR Footprint</span>
        <span class="kpi-sub">Larger than Singapore (728 km²)</span>
      </div>
      <div class="kpi-card highlight">
        <span class="kpi-num">422</span>
        <span class="kpi-unit">km²</span>
        <span class="kpi-label">Developable Area</span>
        <span class="kpi-sub">Town Planning Schemes 1 to 6</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-num">22.54</span>
        <span class="kpi-unit">km²</span>
        <span class="kpi-label">Activation Area</span>
        <span class="kpi-sub">First Phase (TP 2A & 4A)</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-num">153</span>
        <span class="kpi-unit">km²</span>
        <span class="kpi-label">Phase I Area</span>
        <span class="kpi-sub">TP1 & TP2 Combined</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-num">72</span>
        <span class="kpi-unit">km</span>
        <span class="kpi-label">Smart Roads</span>
        <span class="kpi-sub">With underground multi-utility ducts</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-num">6.6</span>
        <span class="kpi-unit">km</span>
        <span class="kpi-label">Central Storm Canal</span>
        <span class="kpi-sub">Gravity drainage to Gulf</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-num">109</span>
        <span class="kpi-unit">km</span>
        <span class="kpi-label">Expressway</span>
        <span class="kpi-sub">Open since Mar 2026 (NHAI)</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-num">300</span>
        <span class="kpi-unit">MW</span>
        <span class="kpi-label">Solar Park</span>
        <span class="kpi-sub">Tata Power, running since 2022</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-num">50</span>
        <span class="kpi-unit">MLD</span>
        <span class="kpi-label">Water Treatment</span>
        <span class="kpi-sub">Scalable to 150 MLD</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-num">500</span>
        <span class="kpi-unit">MVA</span>
        <span class="kpi-label">Power Distribution</span>
        <span class="kpi-sub">Torrent Power 400/220 kV GIS</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-num">22</span>
        <span class="kpi-unit">Villages</span>
        <span class="kpi-label">Regional Coverage</span>
        <span class="kpi-sub">Dholera Taluka, Ahmedabad District</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-num">₹91K</span>
        <span class="kpi-unit">Cr</span>
        <span class="kpi-label">Tata Semiconductor Fab</span>
        <span class="kpi-sub">Tata–PSMC fab · 66.166 ha SEZ notified 2026</span>
      </div>
    </div>

    <div class="stats-section">
      <h3>Land use</h3>
      <p class="fine">DSIRDA does not publish land-use shares in the public record this model uses, so none are printed. See the development plan and GDCR on the DSIRDA site.</p>
      <p class="fine"><a href="/projects/">Project status tracker</a> · <a href="/sources/">Sources</a></p>
    </div>
  `;
  app.append(statsPanel);

  function toggleStats(force) {
    const show = force !== undefined ? force : statsPanel.hidden;
    statsPanel.hidden = !show;
    statsBtn.setAttribute("aria-pressed", String(show));
  }
  statsBtn.addEventListener("click", () => toggleStats());
  statsPanel.querySelector(".stats-close").addEventListener("click", () => toggleStats(false));

  // Keyboard Shortcuts Modal
  const helpModal = document.createElement("div");
  helpModal.id = "help-modal";
  helpModal.hidden = true;
  helpModal.innerHTML = `
    <div class="help-content">
      <button class="help-close" type="button">×</button>
      <h2>Dholera 3D Controls & Navigation</h2>
      <div class="help-section">
        <h3>🛩️ Fly Mode</h3>
        <div class="key-row"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><span>Fly forward / strafe left / backward / right</span></div>
        <div class="key-row"><kbd>Q</kbd><kbd>E</kbd><span>Descend / Ascend</span></div>
        <div class="key-row"><kbd>←</kbd><kbd>→</kbd><span>Pan camera left / right</span></div>
        <div class="key-row"><kbd>Shift</kbd><span>4x High-speed boost</span></div>
        <div class="key-row"><kbd>Mouse Wheel</kbd><span>Altitude elevation control</span></div>
        <div class="key-row"><kbd>Mouse Drag</kbd><span>Look around and pitch</span></div>
      </div>
      <div class="help-section">
        <h3>🚶 Walk Mode (Activation Area)</h3>
        <div class="key-row"><kbd>W</kbd><kbd>S</kbd><span>Walk forward / backward</span></div>
        <div class="key-row"><kbd>A</kbd><kbd>D</kbd><span>Strafe left / right</span></div>
        <div class="key-row"><kbd>Q</kbd><kbd>E</kbd><span>Turn camera</span></div>
        <div class="key-row"><kbd>Shift</kbd><span>Sprint</span></div>
      </div>
      <div class="help-section">
        <h3>⚡ Interactive Features</h3>
        <div class="key-row"><kbd>Click Minimap</kbd><span>Teleport directly to geographic coordinates</span></div>
        <div class="key-row"><kbd>Click 3D Object</kbd><span>Inspect building, plant, or village details</span></div>
        <div class="key-row"><kbd>H</kbd> or <kbd>?</kbd><span>Toggle this help dialog</span></div>
        <div class="key-row"><kbd>F</kbd><span>Toggle Fullscreen</span></div>
        <div class="key-row"><kbd>Esc</kbd><span>Reset to regional overview</span></div>
      </div>
    </div>
  `;
  app.append(helpModal);

  function toggleHelp() {
    helpModal.hidden = !helpModal.hidden;
  }
  helpBtn.addEventListener("click", toggleHelp);
  helpModal.querySelector(".help-close").addEventListener("click", () => { helpModal.hidden = true; });
  helpModal.addEventListener("click", (e) => { if (e.target === helpModal) helpModal.hidden = true; });

  // HUD (Heads-Up Display)
  const hud = document.createElement("div");
  hud.id = "hud";
  hud.innerHTML = `
    <span id="hud-alt">Alt: 7200m</span> · 
    <span id="hud-mode">Fly</span> · 
    <span id="hud-heading">Facing: NW</span>
  `;
  app.append(hud);

  // Interactive Minimap Click
  if (mapCanvas) {
    mapCanvas.style.cursor = "crosshair";
    mapCanvas.title = "Click anywhere on minimap to teleport";
    mapCanvas.addEventListener("click", (event) => {
      const coords = minimapClickToWorld(mapCanvas, layout, event.clientX, event.clientY);
      if (handlers.onTeleport) handlers.onTeleport(coords.x, coords.z);
    });
  }

  // Search input handling
  search.addEventListener("input", () => renderSearch(search.value));
  search.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      const first = results.querySelector("button");
      if (first) first.click();
    }
  });

  hint.textContent = "Drag to look · WASD to fly · Click minimap to teleport · Click buildings to inspect · '?' for shortcuts";

  function fitChrome() {
    document.documentElement.style.setProperty("--chrome", `${tools.parentElement.offsetHeight + 8}px`);
  }
  fitChrome();
  window.addEventListener("resize", fitChrome);

  function renderEntry(entry, say) {
    panel.replaceChildren();
    const kicker = document.createElement("p");
    kicker.className = "kicker";
    kicker.textContent = entry.kicker || "";
    const title = document.createElement("h1");
    title.textContent = entry.title;
    panel.append(kicker, title);
    if (say) {
      const note = document.createElement("p");
      note.className = "say";
      note.textContent = say;
      panel.append(note);
    }
    for (const paragraph of entry.paragraphs || []) {
      const p = document.createElement("p");
      p.textContent = paragraph;
      panel.append(p);
    }
    const extra = distanceNote(entry.id);
    if (extra) {
      const p = document.createElement("p");
      p.textContent = extra;
      panel.append(p);
    }
    if (entry.id === "time") renderTimeline();
    if (entry.id === "sources") renderSources();
    if (entry.rows?.length) renderRows(entry.rows);
    if (entry.links?.length) {
      const list = document.createElement("ul");
      for (const link of entry.links) {
        const li = document.createElement("li");
        const button = document.createElement("button");
        button.className = "link";
        button.textContent = link.label;
        button.addEventListener("click", () => openId(link.id));
        li.append(button);
        list.append(li);
      }
      panel.append(list);
    }
    const fine = document.createElement("p");
    fine.className = "fine";
    fine.textContent = disclaimer;
    const home = document.createElement("a");
    home.href = "https://dholera.gujarat.gov.in/";
    home.target = "_blank";
    home.rel = "noreferrer";
    home.textContent = " dholera.gujarat.gov.in";
    fine.append(home);
    panel.append(fine);
    panel.scrollTop = 0;
  }

  function renderRows(rows) {
    const list = document.createElement("ul");
    list.className = "programme";
    for (const row of rows) {
      const li = document.createElement("li");
      const button = document.createElement("button");
      button.className = "link";
      button.textContent = `${row.status} — ${row.title}`;
      button.addEventListener("click", () => openId(row.id));
      const detail = document.createElement("p");
      detail.className = "fine";
      detail.textContent = row.text;
      li.append(button, detail);
      list.append(li);
    }
    panel.append(list);
  }

  function renderTimeline() {
    const list = document.createElement("ol");
    for (const item of timeline) {
      const li = document.createElement("li");
      li.textContent = `${item.year} — ${item.text}`;
      list.append(li);
    }
    panel.append(list);
  }

  function renderSources() {
    const list = document.createElement("ul");
    for (const source of sources) {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = source.href;
      a.target = "_blank";
      a.rel = "noreferrer";
      a.textContent = source.title;
      li.append(a, document.createTextNode(` — ${source.note}`));
      list.append(li);
    }
    panel.append(list);
  }

  function distanceNote(id) {
    if (id === "airport") {
      return `In this projection the airport is ${layout.measures.dholeraToAirportKm.toFixed(1)} km from Dholera village centre. The link road connects to the 109 km Expressway.`;
    }
    if (id === "ahmedabad") {
      return `A straight line from Dholera to Ahmedabad is ${layout.measures.dholeraToAhmedabadKm.toFixed(0)} km (approx. 100 km via Expressway).`;
    }
    if (id === "wtp") return `The 50 MLD Water Treatment Plant is sited ${layout.measures.wtpOffsetKm.toFixed(1)} km outside the Activation Area.`;
    return "";
  }

  function markChapter(id) {
    chapterId = id;
    for (const button of nav.children) button.setAttribute("aria-current", button.dataset.id === id ? "true" : "false");
    select.value = id;
    if (location.hash !== `#${id}`) history.replaceState(null, "", `#${id}`);
    document.title = `${chapters.find((c) => c.id === id)?.label ?? "Dholera"} — Dholera SIR 3D Smart City`;
  }

  function openChapter(id, say, move = true) {
    const chapter = chapters.find((item) => item.id === id) || chapters[1];
    app.classList.add("flying");
    markChapter(chapter.id);
    renderEntry({ id: chapter.id, kicker: chapter.kicker, title: chapter.title, paragraphs: chapter.paragraphs, links: chapter.links }, say);
    if (move) handlers.onFocus(chapter.id === "arrive" ? "arrive" : chapter.id);
  }

  function openId(id) {
    if (id === "future") {
      setFutureUi(true);
      handlers.onFuture(true);
      return;
    }
    if (chapters.some((chapter) => chapter.id === id)) {
      openChapter(id);
      return;
    }
    const entry = entryFor(id);
    if (entry) {
      renderEntry(entry);
      handlers.onFocus(id);
      return;
    }
    const village = villages.find((item) => item.id === id);
    if (village) {
      renderEntry({ id: village.id, kicker: "Village", title: village.name, paragraphs: [village.note], links: [{ id: "villages", label: "All villages" }] });
    }
  }

  function renderSearch(query) {
    const q = query.trim().toLowerCase();
    results.replaceChildren();
    if (q.length < 2) {
      results.hidden = true;
      return;
    }
    const hits = searchIndex().filter((item) => item.hay.includes(q)).slice(0, 10);
    results.hidden = hits.length === 0;
    for (const hit of hits) {
      const button = document.createElement("button");
      button.textContent = hit.label;
      button.addEventListener("click", () => {
        results.hidden = true;
        search.value = "";
        openId(hit.id);
      });
      results.append(button);
    }
  }

  window.addEventListener("hashchange", () => {
    const id = location.hash.slice(1);
    if (id && id !== chapterId && chapters.some((chapter) => chapter.id === id)) openChapter(id);
  });

  return {
    openChapter,
    show(id, say) {
      openChapter(id, say, false);
    },
    openId,
    showCustom(entry) {
      app.classList.add("flying");
      renderEntry(entry);
    },
    setWalking(on) {
      walkBtn.textContent = on ? "Fly" : "Walk";
      walkBtn.setAttribute("aria-pressed", String(on));
    },
    setGameActive(on) {
      gameBtn.setAttribute("aria-pressed", String(on));
      gameBtn.textContent = on ? "■ City Ops" : "▶ Play";
    },
    setOrbiting(on) {
      orbiting = on;
      orbitBtn.setAttribute("aria-pressed", String(on));
    },
    toggleHelp,
    updateHud(alt, modeName, headingDeg) {
      const altEl = document.querySelector("#hud-alt");
      const modeEl = document.querySelector("#hud-mode");
      const headEl = document.querySelector("#hud-heading");
      if (altEl) altEl.textContent = `Alt: ${Math.round(alt)}m`;
      if (modeEl) modeEl.textContent = modeName;
      if (headEl) {
        const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
        const d = directions[Math.round(((headingDeg % 360) + 360) % 360 / 45) % 8];
        headEl.textContent = `Heading: ${d}`;
      }
    },
  };
}

function searchIndex() {
  const rows = chapters.map((chapter) => ({
    id: chapter.id,
    label: chapter.label,
    hay: `${chapter.label} ${chapter.title} ${chapter.paragraphs.join(" ")}`.toLowerCase(),
  }));
  for (const village of villages) {
    rows.push({
      id: village.pin === "osm" ? `village-${village.id}` : village.id,
      label: `${village.name} (Village)`,
      hay: `${village.name} village taluka dholera`.toLowerCase(),
    });
  }
  for (const zone of zones) {
    rows.push({
      id: zone.id,
      label: `${zone.title} (Zoning)`,
      hay: `${zone.title} zone land use master plan`.toLowerCase(),
    });
  }
  for (const [id, place] of Object.entries(places)) {
    rows.push({
      id,
      label: `${place.title} (${place.kicker})`,
      hay: `${place.title} ${place.kicker} infrastructure project`.toLowerCase(),
    });
  }
  rows.push(
    { id: "semicon", label: "Tata Semiconductor Fab (Semicon City)", hay: "tata semiconductor fab electronics chips silicon dicdl" },
    { id: "airport", label: "Dholera International Airport (DIACL)", hay: "dholera international airport runway cargo flights diacl aai" },
    { id: "expressway", label: "Ahmedabad-Dholera Expressway (109 km)", hay: "expressway highway ahmedabad nhai connectivity transport" },
    { id: "solar", label: "Dholera Solar Park (300 MW)", hay: "solar power renewable clean energy green electricity mahadevpura" },
    { id: "bec", label: "ABCD Building & City Operations (CIOC)", hay: "abcd building admin business exhibition smart operations cioc scada" },
    { id: "future", label: "Future: the published programme", hay: "future planned programme as planned passenger rail semi high speed later phases" }
  );
  return rows;
}
