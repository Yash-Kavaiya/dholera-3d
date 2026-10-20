import * as THREE from "three";
import { paint, mat } from "./materials.js";
import { tag } from "./meshkit.js";

function mulberry(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function saltTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const g = canvas.getContext("2d");
  const rnd = mulberry(22);
  g.fillStyle = "#c4bba8";
  g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 90; i++) {
    const shade = rnd() > 0.5 ? "180, 168, 146" : "214, 206, 190";
    g.fillStyle = `rgba(${shade}, ${0.05 + rnd() * 0.09})`;
    g.beginPath();
    g.ellipse(rnd() * 1024, rnd() * 1024, 30 + rnd() * 160, 20 + rnd() * 90, rnd() * Math.PI, 0, Math.PI * 2);
    g.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function paintSky(geo, zenithHex, horizonHex) {
  const zenith = new THREE.Color(zenithHex);
  const horizon = new THREE.Color(horizonHex);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const mix = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 140000;
    const t = THREE.MathUtils.clamp(y * 1.4 + 0.15, 0, 1);
    mix.copy(horizon).lerp(zenith, t);
    colors[i * 3] = mix.r;
    colors[i * 3 + 1] = mix.g;
    colors[i * 3 + 2] = mix.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
}

export function buildTerrain(scene, groups, layout) {
  const pad = layout.pad;
  const sirBox = bounds(layout.sir);
  const contentMinX = Math.min(sirBox.minX, layout.bhimnath.x, layout.adhelai.x) - 6000;
  const contentMaxZ = Math.max(sirBox.maxZ, layout.adhelai.z) + 6000;
  const contentMinZ = Math.min(sirBox.minZ, layout.airport.z, layout.expressway[0].z) - 6000;
  const landWidth = layout.shoreX - contentMinX;
  const landDepth = contentMaxZ - contentMinZ;

  const landMat = mat(paint.salt, { roughness: 1 });
  landMat.map = saltTexture();
  landMat.map.repeat.set(landWidth / 4000, landDepth / 4000);
  const land = new THREE.Mesh(new THREE.PlaneGeometry(landWidth, landDepth), landMat);
  land.rotation.x = -Math.PI / 2;
  land.position.set(contentMinX + landWidth / 2, 0, contentMinZ + landDepth / 2);
  scene.add(land);

  const waterWidth = 22000;
  const water = new THREE.Mesh(new THREE.PlaneGeometry(waterWidth, landDepth + 8000), mat(paint.gulf, { roughness: 0.35, metalness: 0.08 }));
  water.rotation.x = -Math.PI / 2;
  water.position.set(layout.shoreX + waterWidth / 2 - 30, 0.12, contentMinZ + landDepth / 2);
  tag(water, "gulf");
  groups.water.add(water);

  const foam = new THREE.Mesh(new THREE.BoxGeometry(28, 0.4, landDepth), mat(paint.foam, { roughness: 0.7 }));
  foam.position.set(layout.shoreX, 0.35, contentMinZ + landDepth / 2);
  groups.water.add(foam);

  const skyGeo = new THREE.SphereGeometry(140000, 28, 16);
  paintSky(skyGeo, "#b7c9d4", "#d5e0e4");
  const sky = new THREE.Mesh(
    skyGeo,
    new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }),
  );
  sky.frustumCulled = false;
  sky.renderOrder = -1;
  scene.add(sky);

  /* ── atmospheric dust / pollen particles ── */
  const particleCount = 200;
  const particlePositions = new Float32Array(particleCount * 3);
  const rndP = mulberry(42);
  for (let i = 0; i < particleCount; i++) {
    particlePositions[i * 3]     = (rndP() - 0.5) * 6000;
    particlePositions[i * 3 + 1] = rndP() * 800 + 20;
    particlePositions[i * 3 + 2] = (rndP() - 0.5) * 6000;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0xfff8e8,
    size: 3.5,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    sizeAttenuation: true,
    fog: false,
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  particles.frustumCulled = false;
  scene.add(particles);

  const sirMat = mat(paint.plinth, { roughness: 0.95 });
  return { sky, skyGeo, paintSky, land, pad, water, particles };
}

function bounds(poly) {
  const xs = poly.map((p) => p.x);
  const zs = poly.map((p) => p.z);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minZ: Math.min(...zs), maxZ: Math.max(...zs) };
}
