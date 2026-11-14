/**
 * Headless screenshot + in-page inspection over the Chrome DevTools Protocol.
 * Uses the Chromium builds already on disk (no Playwright dependency).
 *
 *   node scripts/shot.mjs --url http://127.0.0.1:5173/explore/ --out shots/explore.png
 *   node scripts/shot.mjs --url ... --eval "window.__dholera.camera.position.set(0,400,0)" --wait 800
 *
 * Options
 *   --url      page to open (default http://127.0.0.1:5173/explore/)
 *   --out      screenshot path (default scripts/out/shot.png)
 *   --width    viewport width (default 1440)
 *   --height   viewport height (default 900)
 *   --wait     ms to wait after load before evaluating (default 3500)
 *   --settle   ms to wait after --eval before capture (default 900)
 *   --eval     JS expression evaluated in the page (may return a promise)
 *   --probe    JS expression whose JSON result is printed to stdout
 *   --keep     keep the browser profile dir (debugging)
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const flags = new Set(process.argv.filter((a) => a.startsWith("--")));

const url = arg("url", "http://127.0.0.1:5173/explore/");
const out = resolve(root, arg("out", "scripts/out/shot.png"));
const width = Number(arg("width", 1440));
const height = Number(arg("height", 900));
const waitMs = Number(arg("wait", 3500));
const settleMs = Number(arg("settle", 900));
const evalExpr = arg("eval", "");
const probeExpr = arg("probe", "");
const timeoutMs = Number(arg("timeout", 60000));

function findChrome() {
  const base = process.env.LOCALAPPDATA ? resolve(process.env.LOCALAPPDATA, "ms-playwright") : "";
  const candidates = [];
  if (base && existsSync(base)) {
    const versions = readdirSync(base)
      .filter((n) => /^chromium-\d+$/.test(n))
      .sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]));
    for (const v of versions) {
      candidates.push(resolve(base, v, "chrome-win64", "chrome.exe"), resolve(base, v, "chrome-win", "chrome.exe"));
    }
  }
  candidates.push("C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe");
  for (const p of candidates) if (existsSync(p)) return p;
  throw new Error("No Chromium/Chrome executable found. Looked in %LOCALAPPDATA%\\ms-playwright and Program Files.");
}

const chrome = findChrome();
const port = 9330 + Math.floor(Math.random() * 200);
const profile = resolve(tmpdir(), `dholera-shot-${process.pid}-${Date.now()}`);
mkdirSync(dirname(out), { recursive: true });

const proc = spawn(
  chrome,
  [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    `--window-size=${width},${height}`,
    "--hide-scrollbars",
    "--mute-audio",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--disable-dev-shm-usage",
    "about:blank",
  ],
  { stdio: "ignore" },
);

const kill = () => {
  try {
    proc.kill();
  } catch {}
};
process.on("exit", kill);
setTimeout(() => {
  console.error("shot: global timeout");
  kill();
  process.exit(2);
}, timeoutMs).unref();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function versionInfo() {
  for (let i = 0; i < 100; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return res.json();
    } catch {}
    await sleep(100);
  }
  throw new Error("Chrome DevTools endpoint did not come up");
}

const wsUrl = (await versionInfo()).webSocketDebuggerUrl;
const ws = new WebSocket(wsUrl);
await new Promise((ok, fail) => {
  ws.addEventListener("open", ok, { once: true });
  ws.addEventListener("error", fail, { once: true });
});

let nextId = 0;
const pending = new Map();
const logs = [];
ws.addEventListener("message", (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { ok, fail } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? fail(new Error(JSON.stringify(msg.error))) : ok(msg.result);
    return;
  }
  if (msg.method === "Runtime.exceptionThrown") {
    logs.push(`exception: ${msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text}`);
  }
  if (msg.method === "Runtime.consoleAPICalled") {
    const type = msg.params.type;
    if (type === "error" || type === "warning") {
      logs.push(`${type}: ${msg.params.args.map((a) => a.value ?? a.description ?? "").join(" ")}`);
    }
  }
  if (msg.method === "Log.entryAdded" && msg.params.entry.level === "error") {
    logs.push(`log: ${msg.params.entry.text}`);
  }
});
function send(method, params = {}, sessionId) {
  const id = ++nextId;
  ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  return new Promise((ok, fail) => pending.set(id, { ok, fail }));
}

const { targetId } = await send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
await send("Page.enable", {}, sessionId);
await send("Runtime.enable", {}, sessionId);
await send("Log.enable", {}, sessionId).catch(() => {});
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
await send("Page.navigate", { url }, sessionId);
await Promise.race([loaded, sleep(15000)]);
await sleep(waitMs);

async function evaluate(expression) {
  const res = await send(
    "Runtime.evaluate",
    { expression, awaitPromise: true, returnByValue: true, userGesture: true },
    sessionId,
  );
  if (res.exceptionDetails) throw new Error(res.exceptionDetails.exception?.description || res.exceptionDetails.text);
  return res.result?.value;
}

if (evalExpr) {
  const value = await evaluate(evalExpr);
  if (value !== undefined) console.log("eval:", JSON.stringify(value));
  await sleep(settleMs);
}

if (probeExpr) {
  const value = await evaluate(probeExpr);
  console.log("probe:", JSON.stringify(value));
}

const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }, sessionId);
writeFileSync(out, Buffer.from(shot.data, "base64"));
console.log(`shot: ${out}`);
if (logs.length) console.log(`page logs:\n${[...new Set(logs)].slice(0, 12).join("\n")}`);

try {
  await send("Target.closeTarget", { targetId });
} catch {}
try {
  ws.close();
} catch {}
kill();
setTimeout(() => {
  try {
    if (!flags.has("--keep")) rmSync(profile, { recursive: true, force: true });
  } catch {}
}, 400).unref();
process.exit(0);
