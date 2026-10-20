import { layout } from "../geo/layout.js";
import { zones } from "../content/city.js";
import { paint, mat } from "./materials.js";
import { makePrism, outline, tag, addLabel } from "./meshkit.js";

const zoneColor = {
  "zone-industrial": 0xc6b396,
  "zone-residential": 0xdcc7a4,
  "zone-city": 0xefe6d4,
  "zone-knowledge": 0xc5cfc4,
  "zone-access": 0xe4d2ae,
  "zone-logistics": 0xcbbba6,
  "zone-tourism": 0xd5cfc2,
  "zone-sports": 0xc3d0b6,
  "zone-public": 0xddd6c8,
  "zone-solar": 0x3e4a56,
  "zone-agriculture": 0xc9bb96,
  "zone-crz": 0xb7c8c6,
};

export function buildPlan(groups, labels) {
  const y = layout.pad;
  layout.bands.forEach((band, index) => {
    if (!band.poly || band.poly.length < 3) return;
    const line = outline(band.poly, y + 0.9, index < 2 ? 0x8a5a3a : 0x8d867c);
    tag(line, band.id);
    groups.zones.add(line);
    const c = centroid(band.poly);
    addLabel(labels, { id: band.id, text: band.id.toUpperCase(), x: c.x, y: 48, z: c.z, tier: "zone" });
  });

  for (const zone of layout.zonePolys) {
    if (!zone.poly || zone.poly.length < 3) continue;
    const mesh = makePrism(zone.poly, y + 0.15, 0.45, mat(zoneColor[zone.id] ?? 0xddd6c8, { opacity: 0.62, offset: true, roughness: 1 }));
    tag(mesh, zone.id);
    groups.zones.add(mesh);
    const c = centroid(zone.poly);
    const title = zones.find((item) => item.id === zone.id)?.title ?? zone.id;
    addLabel(labels, { id: zone.id, text: title, x: c.x, y: 28, z: c.z, tier: "zone" });
  }
}

function centroid(poly) {
  let x = 0;
  let z = 0;
  for (const p of poly) {
    x += p.x;
    z += p.z;
  }
  return { x: x / poly.length, z: z / poly.length };
}
