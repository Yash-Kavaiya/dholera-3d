/** Writes every generated page in src/site/routes.js, plus public/sitemap.xml. Run before vite. */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { routes, explore } from "../src/site/routes.js";
import { renderers } from "../src/site/templates.mjs";
import { meta } from "../src/data/dholera.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

for (const route of routes) {
  const html = renderers[route.id](route);
  const out = join(root, route.file);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
}

const indexed = [...routes.filter((r) => !r.noindex), explore];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexed.map((r) => `  <url><loc>${meta.siteUrl}${r.path}</loc><lastmod>${meta.dataAsOf}</lastmod></url>`).join("\n")}
</urlset>
`;
writeFileSync(join(root, "public", "sitemap.xml"), sitemap);
writeFileSync(join(root, "public", "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${meta.siteUrl}/sitemap.xml\n`);

console.log(`pages: ${routes.length} written, sitemap: ${indexed.length} urls`);
