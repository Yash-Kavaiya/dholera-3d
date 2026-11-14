import * as THREE from "three";

const dir = new THREE.Vector3();

function getMinimapBounds(layout) {
  const pts = layout.sir.concat([layout.airport, layout.adhelai, layout.bhimnath]);
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minZ = Math.min(minZ, p.z);
    maxZ = Math.max(maxZ, p.z);
  }
  minX -= 1800;
  maxX = Math.max(maxX, layout.shoreX) + 1800;
  minZ -= 1800;
  maxZ += 1800;
  return { minX, maxX, minZ, maxZ };
}

/**
 * @param {Array<{x:number,z:number,kind:string}>} [blips] game markers: kind "mission" | "shard" | "player".
 */
export function drawMinimap(canvas, layout, camera, blips = []) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const { minX, maxX, minZ, maxZ } = getMinimapBounds(layout);

  const X = (x) => ((x - minX) / (maxX - minX)) * (w - 36) + 18;
  const Y = (z) => ((z - minZ) / (maxZ - minZ)) * (h - 36) + 18;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#7f9aa4";
  ctx.fillRect(0, 0, w, h);

  // Plinth outline
  ctx.beginPath();
  layout.sir.forEach((p, i) => (i ? ctx.lineTo(X(p.x), Y(p.z)) : ctx.moveTo(X(p.x), Y(p.z))));
  ctx.closePath();
  ctx.fillStyle = "#ddd3c2";
  ctx.fill();

  // Expressway line
  ctx.beginPath();
  layout.expressway.forEach((p, i) => (i ? ctx.lineTo(X(p.x), Y(p.z)) : ctx.moveTo(X(p.x), Y(p.z))));
  ctx.strokeStyle = "#b5693a";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Activation Area rectangle
  const aa = layout.activation;
  ctx.strokeStyle = "#b5693a";
  ctx.lineWidth = 3;
  ctx.strokeRect(X(aa.minX), Y(aa.minZ), X(aa.maxX) - X(aa.minX), Y(aa.maxZ) - Y(aa.minZ));
  ctx.fillStyle = "rgba(181, 105, 58, 0.12)";
  ctx.fillRect(X(aa.minX), Y(aa.minZ), X(aa.maxX) - X(aa.minX), Y(aa.maxZ) - Y(aa.minZ));

  // Airport point
  ctx.fillStyle = "#1c1915";
  ctx.beginPath();
  ctx.arc(X(layout.airport.x), Y(layout.airport.z), 5, 0, Math.PI * 2);
  ctx.fill();

  // Game blips
  const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 320);
  for (const blip of blips) {
    if (!blip || !Number.isFinite(blip.x) || !Number.isFinite(blip.z)) continue;
    const bx = X(blip.x);
    const by = Y(blip.z);
    if (blip.kind === "mission") {
      ctx.strokeStyle = "#b5693a";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(bx, by, 9 + pulse * 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#e08a4e";
      ctx.beginPath();
      ctx.arc(bx, by, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff8ee";
      ctx.beginPath();
      ctx.arc(bx, by, 2.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (blip.kind === "shard") {
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = "#3f93a8";
      ctx.fillRect(-3.6, -3.6, 7.2, 7.2);
      ctx.strokeStyle = "rgba(255,255,255,0.8)";
      ctx.lineWidth = 1;
      ctx.strokeRect(-3.6, -3.6, 7.2, 7.2);
      ctx.restore();
    } else {
      ctx.fillStyle = "#3f93a8";
      ctx.beginPath();
      ctx.arc(bx, by, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Camera frustum / heading pointer
  camera.getWorldDirection(dir);
  const ang = Math.atan2(dir.x, dir.z);
  ctx.save();
  ctx.translate(X(camera.position.x), Y(camera.position.z));
  ctx.rotate(ang);
  ctx.fillStyle = "#b5693a";
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(7, 9);
  ctx.lineTo(-7, 9);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // North compass
  ctx.fillStyle = "#6e655b";
  ctx.font = "bold 20px Outfit, sans-serif";
  ctx.fillText("N", w / 2 - 7, 26);

  // Scale bar
  const metresPerPx = (maxX - minX) / (w - 36);
  const barPx = Math.min(w * 0.42, 10000 / metresPerPx);
  ctx.fillStyle = "rgba(243, 238, 228, 0.92)";
  ctx.fillRect(12, h - 38, barPx + 18, 26);
  ctx.fillStyle = "#1c1915";
  ctx.fillRect(18, h - 16, barPx, 3);
  ctx.font = "14px Outfit, sans-serif";
  ctx.fillText("10 km", 18, h - 22);
}

export function minimapClickToWorld(canvas, layout, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const relX = (clientX - rect.left) / rect.width;
  const relY = (clientY - rect.top) / rect.height;
  const w = canvas.width;
  const h = canvas.height;
  const { minX, maxX, minZ, maxZ } = getMinimapBounds(layout);

  const px = relX * w;
  const py = relY * h;

  const worldX = minX + ((px - 18) / (w - 36)) * (maxX - minX);
  const worldZ = minZ + ((py - 18) / (h - 36)) * (maxZ - minZ);

  return { x: worldX, z: worldZ };
}
