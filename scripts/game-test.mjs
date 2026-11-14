/**
 * Automated end-to-end QA for /explore/ and the City Ops game.
 *
 *   node scripts/game-test.mjs                    # full run against the dev server
 *   node scripts/game-test.mjs --url http://localhost:4173/explore/
 *
 * It drives a real headless Chromium over CDP (same trick as scripts/shot.mjs),
 * plays the mission chain, exercises the rover, checks the save, captures
 * screenshots and writes scripts/out/qa-game.json + qa-report.md.
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "scripts/out");
const shotDir = resolve(root, "shots");
mkdirSync(outDir, { recursive: true });
mkdirSync(shotDir, { recursive: true });

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const base = arg("url", "http://localhost:5173/explore/");
const width = 1440;
const height = 900;

function findChrome() {
  const baseDir = process.env.LOCALAPPDATA ? resolve(process.env.LOCALAPPDATA, "ms-playwright") : "";
  const candidates = [];
  if (baseDir && existsSync(baseDir)) {
    const versions = readdirSync(baseDir)
      .filter((n) => /^chromium-\d+$/.test(n))
      .sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]));
    for (const v of versions) {
      candidates.push(resolve(baseDir, v, "chrome-win64", "chrome.exe"), resolve(baseDir, v, "chrome-win", "chrome.exe"));
    }
  }
  candidates.push("C:/Program Files/Google/Chrome/Application/chrome.exe");
  for (const p of candidates) if (existsSync(p)) return p;
  throw new Error("No Chrome/Chromium found");
}

const port = 9600 + Math.floor(Math.random() * 200);
const profile = resolve(tmpdir(), `dholera-qa-${process.pid}-${Date.now()}`);
const chrome = spawn(
  findChrome(),
  [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    `--window-size=${width},${height}`,
    "--hide-scrollbars",
    "--mute-audio",
    "--no-first-run",
    "--disable-extensions",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "about:blank",
  ],
  { stdio: "ignore" },
);
const cleanup = () => {
  try {
    if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(chrome.pid), "/T", "/F"], { stdio: "ignore" });
    else chrome.kill();
  } catch {}
  setTimeout(() => {
    try {
      rmSync(profile, { recursive: true, force: true });
    } catch {}
  }, 300).unref();
};
process.on("exit", cleanup);
setTimeout(() => {
  console.error("qa: global timeout");
  cleanup();
  process.exit(2);
}, 300000);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function wsEndpoint() {
  for (let i = 0; i < 120; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return (await res.json()).webSocketDebuggerUrl;
    } catch {}
    await sleep(100);
  }
  throw new Error("DevTools endpoint did not come up");
}

const ws = new WebSocket(await wsEndpoint());
await new Promise((ok, fail) => {
  ws.addEventListener("open", ok, { once: true });
  ws.addEventListener("error", fail, { once: true });
});

let nextId = 0;
const pending = new Map();
const consoleErrors = [];
const pageErrors = [];
ws.addEventListener("message", (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { ok, fail } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? fail(new Error(JSON.stringify(msg.error))) : ok(msg.result);
    return;
  }
  if (msg.method === "Runtime.exceptionThrown") {
    pageErrors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
  }
  if (msg.method === "Runtime.consoleAPICalled" && (msg.params.type === "error" || msg.params.type === "warning")) {
    consoleErrors.push(`${msg.params.type}: ${msg.params.args.map((a) => a.value ?? a.description ?? "").join(" ")}`);
  }
  if (msg.method === "Log.entryAdded" && msg.params.entry.level === "error") {
    consoleErrors.push(`log: ${msg.params.entry.text}`);
  }
});

function send(method, params = {}, sessionId) {
  const id = ++nextId;
  ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  return new Promise((ok, fail) => pending.set(id, { ok, fail }));
}

const { targetId } = await send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
for (const domain of ["Page", "Runtime", "Log"]) await send(`${domain}.enable`, {}, sessionId);
await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false }, sessionId);

const loaded = new Promise((ok) => {
  const onMessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === "Page.loadEventFired") {
      ws.removeEventListener("message", onMessage);
      ok();
    }
  };
  ws.addEventListener("message", onMessage);
});
await send("Page.navigate", { url: base }, sessionId);
await Promise.race([loaded, sleep(20000)]);

async function evaluate(expression) {
  const res = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true, userGesture: true }, sessionId);
  if (res.exceptionDetails) throw new Error(res.exceptionDetails.exception?.description || res.exceptionDetails.text);
  return res.result?.value;
}

/** Poll an in-page expression until it is truthy (headless software GL needs ~15s of shader warm-up). */
async function waitFor(expression, timeoutMs = 60000, label = expression) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      if (await evaluate(expression)) return true;
    } catch {}
    await sleep(500);
  }
  throw new Error(`timeout waiting for ${label}`);
}
await waitFor("!!window.__dholera && !!window.__dholera.renderer", 90000, "scene boot");
await sleep(1500);
async function shot(name) {
  const file = resolve(shotDir, `qa-${name}.png`);
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await Promise.race([
        send("Page.captureScreenshot", { format: "png" }, sessionId),
        sleep(30000).then(() => {
          throw new Error("capture timeout");
        }),
      ]);
      writeFileSync(file, Buffer.from(res.data, "base64"));
      return file;
    } catch (error) {
      if (attempt === 1) {
        console.error(`shot ${name} failed: ${error.message}`);
        return null;
      }
      await sleep(1000);
    }
  }
  return null;
}
const key = async (code) => {
  await evaluate(`window.dispatchEvent(new KeyboardEvent("keydown", { code: "${code}", bubbles: true })); 1`);
  await sleep(120);
  await evaluate(`window.dispatchEvent(new KeyboardEvent("keyup", { code: "${code}", bubbles: true })); 1`);
};
const hold = async (code, ms) => {
  await evaluate(`window.dispatchEvent(new KeyboardEvent("keydown", { code: "${code}", bubbles: true })); 1`);
  await sleep(ms);
  await evaluate(`window.dispatchEvent(new KeyboardEvent("keyup", { code: "${code}", bubbles: true })); 1`);
};

const report = { url: base, startedAt: new Date().toISOString(), steps: [], metrics: {}, consoleErrors, pageErrors, shots: [], failures: [] };
const step = (name, ok, detail) => {
  report.steps.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${typeof detail === "string" ? detail : JSON.stringify(detail)}` : ""}`);
  if (!ok) report.failures.push(name);
};

try {
  const ready = await evaluate("!!window.__dholera && !!window.__dholera.renderer");
  step("scene booted", ready);
  report.metrics.drawCalls = await evaluate("window.__dholera.renderer.info.render.calls");
  report.metrics.triangles = await evaluate("window.__dholera.renderer.info.render.triangles");
  report.metrics.gameLoaded = await evaluate("!!window.__dholera.game");
  report.metrics.districtLoaded = await evaluate("!!window.__dholera.district");
  step("game module loaded", report.metrics.gameLoaded);
  step("district module loaded", report.metrics.districtLoaded);

  await evaluate("document.querySelector('#skip')?.click(); 1");
  await sleep(1500);
  report.shots.push(await shot("city-overview"));

  const fps = await evaluate(`new Promise((resolve) => {
    let frames = 0; const t0 = performance.now();
    const tick = () => { frames++; if (performance.now() - t0 < 2000) requestAnimationFrame(tick); else resolve(frames / ((performance.now() - t0) / 1000)); };
    requestAnimationFrame(tick);
  })`);
  report.metrics.fps = Math.round(fps);

  // Start City Ops from the shell button.
  await evaluate(`document.querySelector('#tools button.play')?.click(); 1`);
  await waitFor("!!document.querySelector('#game-hud')", 20000, "game HUD");
  await sleep(1500);
  // The intro overlay has its own Begin button.
  await evaluate(`(() => {
    const hud = document.querySelector('#game-hud');
    if (!hud) return 0;
    const start = [...hud.querySelectorAll('button')].find((b) => /start|begin|deploy|enter|operation/i.test(b.textContent));
    if (start) start.click();
    return 1;
  })()`);
  await waitFor("window.__dholera.game.getStats().active === true", 20000, "active game");
  await sleep(2500);
  let stats = await evaluate("window.__dholera.game.getStats()");
  step("game starts", !!stats.active, stats);
  report.shots.push(await shot("game-start"));

  // Mission 1 is the CIOC/ABCD building: teleport close and interact with E.
  await evaluate(`window.__dholera.game.debug.teleportTo("bec"); 1`);
  await sleep(2000);
  await key("KeyE");
  await sleep(2000);
  stats = await evaluate("window.__dholera.game.getStats()");
  step("first interaction completes a mission", stats.missionIndex >= 1, stats);

  // Drive mode: enter, move, exit (before the finale so no completion overlay freezes the run).
  if (stats.active) {
    await key("KeyC");
    await waitFor("window.__dholera.game.getStats().driving === true", 15000, "rover enter");
    const drive = await evaluate("window.__dholera.game.getStats()");
    const posBefore = await evaluate("window.__dholera.camera.position.toArray()");
    await hold("KeyW", 2600);
    await sleep(800);
    const posAfter = await evaluate("window.__dholera.camera.position.toArray()");
    const moved = Math.hypot(posAfter[0] - posBefore[0], posAfter[2] - posBefore[2]);
    report.shots.push(await shot("game-drive"));
    await key("KeyC");
    await sleep(800);
    const after = await evaluate("window.__dholera.game.getStats()");
    step("rover drives", drive.driving === true && moved > 3, { driving: drive.driving, moved: Math.round(moved) });
    step("rover exits", after.driving === false, after);
  }

  // Run the rest of the chain through the debug hook, checking monotonic progress.
  let index = stats.missionIndex;
  let advanced = 0;
  for (let i = 0; i < 12 && index < 9; i++) {
    await evaluate("window.__dholera.game.debug.completeCurrent(); 1");
    await sleep(700);
    const next = await evaluate("window.__dholera.game.getStats()");
    if (next.missionIndex > index) advanced++;
    index = next.missionIndex;
    if (index === 9) break;
  }
  step("mission chain completes", index >= 9, { index, advanced });
  await sleep(800);
  report.shots.push(await shot("game-complete"));

  // Collect the data shards.
  await evaluate("window.__dholera.game.debug.collectAll(); 1");
  await sleep(900);
  stats = await evaluate("window.__dholera.game.getStats()");
  step("shards collect", stats.shards >= 12, { shards: stats.shards });

  // Persistence.
  const saved = await evaluate(`(() => { try { return JSON.parse(localStorage.getItem("dholera-rising-v1") || "null"); } catch { return null; } })()`);
  step("progress saved", !!saved && typeof saved === "object", saved ? Object.keys(saved) : null);

  await evaluate("window.__dholera.game.debug.reset(); 1");
  await sleep(500);
  stats = await evaluate("window.__dholera.game.getStats()");
  step("reset works", stats.missionIndex === 0, stats);

  report.metrics.finalDrawCalls = await evaluate("window.__dholera.renderer.info.render.calls");
  report.metrics.finalTriangles = await evaluate("window.__dholera.renderer.info.render.triangles");
  step("draw calls under budget", report.metrics.finalDrawCalls < 1200, report.metrics.finalDrawCalls);
  step("no page exceptions", pageErrors.length === 0, pageErrors.slice(0, 3));
} catch (error) {
  step("harness ran without throwing", false, String(error));
}

report.finishedAt = new Date().toISOString();
writeFileSync(resolve(outDir, "qa-game.json"), JSON.stringify(report, null, 2));

const md = [
  "# Game QA report",
  "",
  `- URL: ${report.url}`,
  `- When: ${report.startedAt} → ${report.finishedAt}`,
  `- Draw calls: ${report.metrics.drawCalls} → ${report.metrics.finalDrawCalls}`,
  `- Triangles: ${report.metrics.triangles} → ${report.metrics.finalTriangles}`,
  `- FPS (headless software GL): ${report.metrics.fps}`,
  "",
  "## Steps",
  ...report.steps.map((s) => `- ${s.ok ? "PASS" : "FAIL"} — ${s.name}${s.detail ? `: \`${typeof s.detail === "string" ? s.detail : JSON.stringify(s.detail).slice(0, 240)}\`` : ""}`),
  "",
  "## Shots",
  ...report.shots.map((s) => `- ${s}`),
  "",
  "## Failures",
  ...(report.failures.length ? report.failures.map((f) => `- ${f}`) : ["- none"]),
  "",
  "## Console errors",
  ...(report.consoleErrors.length ? report.consoleErrors.slice(0, 20).map((e) => `- ${e}`) : ["- none"]),
  "",
  "## Page exceptions",
  ...(report.pageErrors.length ? report.pageErrors.slice(0, 20).map((e) => `- ${e}`) : ["- none"]),
].join("\n");
writeFileSync(resolve(outDir, "qa-report.md"), md);
console.log(`\n${md}`);
cleanup();
process.exit(report.failures.length ? 1 : 0);
