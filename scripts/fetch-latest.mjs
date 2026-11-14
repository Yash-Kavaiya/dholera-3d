/**
 * Checks the official DSIRDA pages against src/data/dholera.js and writes scripts/out/latest-report.md.
 * It only reports. A person reads the report and edits the data file.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { facts, meta, projects, sources } from "../src/data/dholera.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Figures we expect each page to print. `pattern` must match the page text when the figure is unchanged. */
const expectations = {
  "dsirda-faq": [
    ["SIR area", facts.sirKm2, /920\s*sq\.?\s*km/i],
    ["Activation Area", facts.activationKm2, /22\.54\s*sq/i],
    ["Internal roads", facts.roadsKm, /72\s*km/i],
    ["Central canal", facts.canalKm, /6\.6\s*km/i],
    ["WTP", facts.wtpMld, /50\s*MLD/i],
    ["STP", facts.stpMld, /10\s*MLD/i],
    ["CETP", facts.cetpMld, /20\s*MLD/i],
    ["Expressway length", facts.expresswayKm, /109\s*km/i],
    ["Power", facts.powerMva, /500\s*MVA/i],
    ["Plot size upper bound", facts.plotMaxAcres, /330\s*acre/i],
  ],
  "dsirda-planning": [
    ["Developable area", facts.developableKm2, /422\s*sq/i],
    ["Phase I", facts.phase1Km2, /153\s*sq/i],
    ["Villages", facts.villageCount, /22\s*villages/i],
  ],
  "dsirda-about": [],
};

/** Phrases whose appearance means the record has moved on. The project id marks it known once that project cites the page. */
const watch = [
  [/expressway[^.]{0,80}(operational|opened|inaugurated)/i, "The expressway is now described as open on the official page."],
  [/airport[^.]{0,80}(operational|commissioned|inaugurated)/i, "The airport is described as operational."],
  [/semi[- ]?high[- ]?speed[^.]{0,80}(approved|sanctioned|under construction)/i, "Semi high-speed rail status changed."],
  [/tata|semiconductor fab|PSMC/i, "Tata / fab now mentioned on the page.", "tata-fab"],
  [/data cent(re|er)/i, "Data centres now mentioned on the page.", "data-centres"],
];

const text = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");

const lines = [`# Dholera data check`, ``, `Run: ${new Date().toISOString()}`, `Data file as of: ${meta.dataAsOf} (DSIRDA updated ${meta.dsirdaPageUpdated})`, ``];
let attention = 0;

for (const [id, checks] of Object.entries(expectations)) {
  const source = sources.find((s) => s.id === id);
  lines.push(`## ${source.title}`, ``, source.href, ``);
  let body;
  try {
    const res = await fetch(source.href, { headers: { "user-agent": "dholera-guide-data-check/1.0" }, signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    body = text(await res.text());
  } catch (error) {
    attention++;
    lines.push(`- ❌ Could not fetch: ${error.message}`, ``);
    continue;
  }

  const updated = /Last\s*Updated\s*:?\s*(\d{2})\/(\d{2})\/(\d{4})/i.exec(body);
  if (updated) {
    const iso = `${updated[3]}-${updated[2]}-${updated[1]}`;
    const changed = iso !== meta.dsirdaPageUpdated;
    if (changed) attention++;
    lines.push(`- ${changed ? "⚠️" : "✅"} Last Updated ${iso}${changed ? ` (data file says ${meta.dsirdaPageUpdated})` : ""}`);
  } else {
    lines.push(`- ⚠️ No "Last Updated" stamp found`);
  }

  for (const [label, value, pattern] of checks) {
    const ok = pattern.test(body);
    if (!ok) attention++;
    lines.push(`- ${ok ? "✅" : "⚠️"} ${label}: ${value}${ok ? "" : " — not found as expected; check the page"}`);
  }
  for (const [pattern, message, projectId] of watch) {
    if (pattern.test(body)) {
      if (projectId && projects.find((p) => p.id === projectId)?.sourceIds.includes(id)) {
        lines.push(`- ✅ ${message} Already cited by project ${projectId}.`);
        continue;
      }
      attention++;
      const at = body.search(pattern);
      lines.push(`- 🔎 ${message} Context: “…${body.slice(Math.max(0, at - 80), at + 160).trim()}…”`);
    }
  }
  lines.push(``);
}

lines.push(attention ? `**${attention} item(s) need a look.** Edit src/data/dholera.js, bump meta.dataAsOf, and run npm run build.` : `**Nothing changed.**`);

const out = join(root, "scripts", "out", "latest-report.md");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, lines.join("\n") + "\n");
console.log(lines.join("\n"));
console.log(`\nReport: ${out}`);
