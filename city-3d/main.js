// Standalone city model with guided tour. Bundled by Vite (see vite.config.js).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const rng = mulberry32(20261116);
const R = (a,b)=>a+(b-a)*rng();
const pick = a => a[Math.floor(rng()*a.length)];
const V = (x,y,z)=>new THREE.Vector3(x,y,z);
const C = h => new THREE.Color(h);
const snap = (v,s)=>Math.max(s, Math.round(v/s)*s);
const lerp = (a,b,k)=>a+(b-a)*k;

/* ---------- renderer ---------- */
const canvas = document.getElementById('scene');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, logarithmicDepthBuffer: true, powerPreference: 'high-performance' });
} catch (e) {
  document.querySelector('#loader div').innerHTML = 'This view needs WebGL<small>Try a recent desktop browser</small>';
  throw e;
}
const PR = Math.min(devicePixelRatio || 1, 1.75);
renderer.setPixelRatio(PR);
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const ANISO = renderer.capabilities.getMaxAnisotropy();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, innerWidth/innerHeight, 2, 12000);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true; controls.dampingFactor = 0.07;
controls.maxPolarAngle = Math.PI * 0.475; controls.minDistance = 30; controls.maxDistance = 3800;
controls.screenSpacePanning = false;

/* ---------- helpers ---------- */
function cnv(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return [c,c.getContext('2d')];}
function tex(c, srgb=true){const t=new THREE.CanvasTexture(c); if(srgb) t.colorSpace=THREE.SRGBColorSpace; t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=ANISO; return t;}
function shade(hex,j){const c=new THREE.Color(hex); c.offsetHSL(0,0,j); return '#'+c.getHexString();}
const std = (o)=>new THREE.MeshStandardMaterial(o);

/* ---------- sky ---------- */
const DAY = { top:C('#4c88c2'), horizon:C('#d5e0e2'), ground:C('#8d8770'), sunColor:new THREE.Color(7,6.2,5), dir:V(-0.55,0.62,0.56).normalize(),
  hemiSky:C('#dcebff'), hemiGround:C('#8a7d5e'), hemiI:1.0, sunI:2.7, sunLight:C('#fff0d8'), exposure:0.95 };
const NIGHT = { top:C('#02060e'), horizon:C('#15202e'), ground:C('#07080a'), sunColor:new THREE.Color(.5,.62,.95), dir:V(0.4,0.7,-0.3).normalize(),
  hemiSky:C('#5b6f9c'), hemiGround:C('#1a1712'), hemiI:0.2, sunI:0.35, sunLight:C('#9fb6ff'), exposure:1.1 };

function skyMaterial(cfg){
  return new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
    uniforms: { top:{value:cfg.top.clone()}, horizon:{value:cfg.horizon.clone()}, ground:{value:cfg.ground.clone()},
      sunDir:{value:cfg.dir.clone()}, sunColor:{value:cfg.sunColor.clone()} },
    vertexShader: `varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 top; uniform vec3 horizon; uniform vec3 ground; uniform vec3 sunDir; uniform vec3 sunColor; varying vec3 vDir;
      void main(){ vec3 d = normalize(vDir); float h = d.y;
        vec3 col = mix(horizon, top, smoothstep(0.0, 0.5, h));
        col = mix(ground, col, smoothstep(-0.05, 0.0, h));
        float s = max(dot(d, normalize(sunDir)), 0.0);
        col += sunColor * (pow(s, 1400.0) * 1.5 + pow(s, 14.0) * 0.08);
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`
  });
}
const skyMat = skyMaterial(DAY);
const skyGroup = new THREE.Group();
const sky = new THREE.Mesh(new THREE.SphereGeometry(5000, 48, 24), skyMat);
sky.renderOrder = -10; sky.frustumCulled = false; skyGroup.add(sky);
{ // stars
  const n=1800, p=new Float32Array(n*3);
  for(let i=0;i<n;i++){ const u=rng(), v=rng()*0.9+0.05; const th=u*Math.PI*2, ph=Math.acos(1-v); p[i*3]=Math.sin(ph)*Math.cos(th)*4500; p[i*3+1]=Math.cos(ph)*4500; p[i*3+2]=Math.sin(ph)*Math.sin(th)*4500; }
  const g=new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p,3));
  var starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
  const stars = new THREE.Points(g, starMat); stars.frustumCulled=false; skyGroup.add(stars);
}
scene.add(skyGroup);

const pmrem = new THREE.PMREMGenerator(renderer);
function makeEnv(cfg){ const s=new THREE.Scene(); s.add(new THREE.Mesh(new THREE.SphereGeometry(100,32,16), skyMaterial(cfg))); return pmrem.fromScene(s, 0.03, 0.1, 500).texture; }
const envDay = makeEnv(DAY), envNight = makeEnv(NIGHT);
scene.environment = envDay;
scene.fog = new THREE.Fog(DAY.horizon.clone(), 1700, 6500);

const hemi = new THREE.HemisphereLight(DAY.hemiSky, DAY.hemiGround, DAY.hemiI); scene.add(hemi);
const sun = new THREE.DirectionalLight(DAY.sunLight, DAY.sunI);
sun.castShadow = true; sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera, { left:-620, right:620, top:620, bottom:-620, near:50, far:3600 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.5;
scene.add(sun, sun.target);

/* ---------- shared materials ---------- */
const M = {
  roof: std({ color:'#9b9d98', roughness:.92 }),
  roofWarm: std({ color:'#b9ab95', roughness:.95 }),
  concrete: std({ color:'#cdc9c0', roughness:.9 }),
  white: std({ color:'#f1f1ec', roughness:.45, metalness:.1 }),
  metal: std({ color:'#8c939a', roughness:.4, metalness:.7 }),
  dark: std({ color:'#2c3135', roughness:.6, metalness:.3 }),
  paving: std({ color:'#d6d0c3', roughness:.95 }),
  grass: std({ color:'#6f9a4c', roughness:1 }),
  gravel: std({ color:'#a7a294', roughness:1 }),
  trunk: std({ color:'#6b5440', roughness:1 }),
  canopy: std({ color:'#ffffff', roughness:.95, flatShading:true }),
  solar: std({ color:'#1e3256', roughness:.18, metalness:.75 }),
  red: new THREE.MeshBasicMaterial({ color: new THREE.Color(5,0.25,0.2), toneMapped:false }),
  lamp: new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2,2.2,1.1), toneMapped:false, transparent:true, opacity:0 }),
  lights: new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped:false }),
  teal: std({ color:'#0f7f6e', roughness:.5 }),
};
const zoneMat = {
  cbd: std({ color:'#cfcabf', roughness:.95 }), abcd: std({ color:'#dcd5c6', roughness:.95 }), park: M.grass,
  resiMid: std({ color:'#d3cbb6', roughness:1 }), resiLow: std({ color:'#c6bf9f', roughness:1 }),
  logistics: std({ color:'#bdbab2', roughness:1 }), hub: std({ color:'#cbc5b9', roughness:.95 }),
};

// water normal map
const waterNormalImg = (()=>{
  const [c,g]=cnv(256,256); const img=g.createImageData(256,256); const T=Math.PI*2;
  for(let y=0;y<256;y++) for(let x=0;x<256;x++){
    const fx=x/256*T, fy=y/256*T;
    const dx=1.5*Math.cos(3*fx+2*fy)+1.05*Math.cos(7*fx-5*fy)-0.4*Math.cos(-4*fx+9*fy);
    const dy=1.0*Math.cos(3*fx+2*fy)-0.75*Math.cos(7*fx-5*fy)+0.9*Math.cos(-4*fx+9*fy);
    const s=0.12; let nx=-dx*s, ny=-dy*s, nz=1; const l=Math.hypot(nx,ny,nz); nx/=l; ny/=l; nz/=l;
    const i=(y*256+x)*4; img.data[i]=(nx*.5+.5)*255; img.data[i+1]=(ny*.5+.5)*255; img.data[i+2]=(nz*.5+.5)*255; img.data[i+3]=255;
  }
  g.putImageData(img,0,0); return c;
})();
const seaN = tex(waterNormalImg,false); seaN.repeat.set(1/220,1/220);
const riverN = tex(waterNormalImg,false); riverN.repeat.set(1,1);
const seaMat = std({ color:'#2b6578', roughness:.12, metalness:.25, normalMap:seaN, normalScale:new THREE.Vector2(.3,.3) });
const waterMat = std({ color:'#3a6f73', roughness:.1, metalness:.25, normalMap:riverN, normalScale:new THREE.Vector2(.5,.5), side:THREE.DoubleSide });

/* ---------- facades ---------- */
const facadeMats = [];
function makeFacade(o){
  const cols=o.cols||8, rows=o.rows||16, cw=32, ch=32, W=cols*cw, H=rows*ch;
  const [c,g]=cnv(W,H), [e,ge]=cnv(W,H);
  g.fillStyle=o.frame; g.fillRect(0,0,W,H); ge.fillStyle='#000'; ge.fillRect(0,0,W,H);
  for(let r=0;r<rows;r++) for(let k=0;k<cols;k++){
    const x=k*cw, y=r*ch; let wx,wy,ww,wh;
    if(o.kind==='panel'){ g.fillStyle='rgba(0,0,0,0.07)'; g.fillRect(x+cw-2,y,2,ch); g.fillStyle='rgba(255,255,255,0.25)'; g.fillRect(x+cw-4,y,1,ch); if(r%5===0){ g.fillStyle='rgba(0,0,0,.06)'; g.fillRect(x,y,cw,2);} continue; }
    if(o.kind==='band'){ wx=x; wy=y+10; ww=cw; wh=15; }
    else if(o.kind==='resi'){ wx=x+8; wy=y+7; ww=cw-16; wh=ch-14; }
    else { wx=x+1; wy=y+3; ww=cw-2; wh=ch-4; }
    const j=(rng()-.5)*0.16;
    const gr=g.createLinearGradient(0,wy,0,wy+wh); gr.addColorStop(0,shade(o.glassA,j)); gr.addColorStop(1,shade(o.glassB,j*0.6));
    g.fillStyle=gr; g.fillRect(wx,wy,ww,wh);
    if(o.kind==='curtain'){ g.fillStyle='rgba(255,255,255,0.08)'; g.fillRect(wx, wy, ww*0.35, wh); g.fillStyle=o.frame; g.fillRect(x+cw/2,wy,1,wh); }
    if(o.kind==='band'){ g.fillStyle=o.frame; g.globalAlpha=.55; g.fillRect(x+cw-1,wy,1,wh); g.globalAlpha=1; }
    if(o.kind==='resi'){
      g.fillStyle='rgba(0,0,0,.2)'; g.fillRect(wx-2,wy+wh,ww+4,2);
      if((k+r)%3===0){ g.fillStyle=o.balcony; g.fillRect(x+3,y+ch-7,cw-6,5); }
      if(k%4===1){ g.fillStyle='rgba(0,0,0,.06)'; g.fillRect(x,y,2,ch); }
    }
    const p=rng();
    if(p<o.lit){ const a=0.55+rng()*0.45; ge.fillStyle=`rgba(255,${190+(rng()*50|0)},${115+(rng()*80|0)},${a})`; ge.fillRect(wx,wy,ww,wh); }
    else if(p<o.lit+0.06){ ge.fillStyle='rgba(130,175,255,.4)'; ge.fillRect(wx,wy,ww,wh); }
  }
  const side = std({ map:tex(c), emissive:0xffffff, emissiveMap:tex(e), emissiveIntensity:0, metalness:o.metal, roughness:o.rough });
  side.userData.nightE = o.kind==='panel' ? 0 : (o.nightE ?? 1.7);
  facadeMats.push(side);
  const roof = o.roof || M.roof;
  return { cols, rows, tileW: cols*4, tileH: rows*3.5, side, box:[side,side,roof,roof,side,side], cyl:[side,roof,roof] };
}
const F = {
  glassBlue: makeFacade({ kind:'curtain', frame:'#26343e', glassA:'#8fb3c8', glassB:'#3b5c72', metal:.7, rough:.16, lit:.45 }),
  glassTeal: makeFacade({ kind:'curtain', frame:'#203236', glassA:'#93c6bf', glassB:'#386663', metal:.7, rough:.16, lit:.42 }),
  bronze:    makeFacade({ kind:'curtain', frame:'#352a22', glassA:'#bea27f', glassB:'#594633', metal:.65, rough:.2, lit:.4 }),
  office:    makeFacade({ kind:'band', frame:'#e8e5de', glassA:'#647c8c', glassB:'#2d3f4b', metal:.15, rough:.5, lit:.5 }),
  resi:      makeFacade({ kind:'resi', frame:'#e8dcc7', glassA:'#5f6c76', glassB:'#323c44', balcony:'rgba(120,96,70,.45)', metal:0, rough:.9, lit:.38, nightE:1.4, roof:M.roofWarm }),
  resi2:     makeFacade({ kind:'resi', frame:'#dcb99a', glassA:'#56636c', glassB:'#2e383f', balcony:'rgba(250,245,235,.75)', metal:0, rough:.9, lit:.36, nightE:1.4, roof:M.roofWarm }),
  panel:     makeFacade({ kind:'panel', frame:'#e9ebea', metal:.2, rough:.6, lit:0 }),
};

function facadeUV(geo, fac, w, h, d){
  const n=geo.attributes.normal, p=geo.attributes.position, uv=geo.attributes.uv;
  const ou=Math.floor(rng()*fac.cols)/fac.cols, ov=Math.floor(rng()*fac.rows)/fac.rows;
  for(let i=0;i<p.count;i++){
    if(Math.abs(n.getY(i))>0.5) continue;
    const u = Math.abs(n.getX(i))>0.5 ? p.getZ(i)+d/2 : p.getX(i)+w/2;
    uv.setXY(i, u/fac.tileW+ou, (p.getY(i)+h/2)/fac.tileH+ov);
  }
}
function twistGeo(geo,h,total){
  const p=geo.attributes.position;
  for(let i=0;i<p.count;i++){ const a=(p.getY(i)/h+0.5)*total, x=p.getX(i), z=p.getZ(i); p.setX(i,x*Math.cos(a)-z*Math.sin(a)); p.setZ(i,x*Math.sin(a)+z*Math.cos(a)); }
  geo.computeVertexNormals();
}
const city = new THREE.Group(); scene.add(city);
function shadowed(m){ m.castShadow = true; m.receiveShadow = true; return m; }
function bx(x,y0,z,w,h,d,fac,{rot=0,twist=0}={}){
  const g=new THREE.BoxGeometry(w,h,d,1,twist?18:1,1); facadeUV(g,fac,w,h,d); if(twist) twistGeo(g,h,twist);
  const m=shadowed(new THREE.Mesh(g,fac.box)); m.position.set(x,y0+h/2,z); m.rotation.y=rot; city.add(m); return m;
}
function cyl(x,y0,z,r,h,fac){
  const g=new THREE.CylinderGeometry(r,r,h,40,1); const n=g.attributes.normal, p=g.attributes.position, uv=g.attributes.uv;
  const ov=Math.floor(rng()*fac.rows)/fac.rows, us=Math.round(2*Math.PI*r/4)/fac.cols;
  for(let i=0;i<p.count;i++){ if(Math.abs(n.getY(i))>0.5) continue; uv.setXY(i, uv.getX(i)*us, (p.getY(i)+h/2)/fac.tileH+ov); }
  const m=shadowed(new THREE.Mesh(g,fac.cyl)); m.position.set(x,y0+h/2,z); city.add(m); return m;
}
function solid(geo,mat,x,y,z,parent=city){ const m=shadowed(new THREE.Mesh(geo,mat)); m.position.set(x,y,z); parent.add(m); return m; }
function slab(x,y,z,w,h,d,mat){ return solid(new THREE.BoxGeometry(w,h,d),mat,x,y+h/2,z); }

const warnLights = [];
function beacon(x,y,z,r=0.9){ const m=new THREE.Mesh(new THREE.SphereGeometry(r,8,6),M.red); m.position.set(x,y,z); m.visible=false; city.add(m); warnLights.push(m); }

/* ---------- trees, lamps (instanced later) ---------- */
const trees=[]; const tree=(x,z,s=1)=>trees.push([x,z,s*R(0.8,1.25)]);
const lampPts=[];

/* ---------- ground, coast, river ---------- */
{
  const [c,g]=cnv(256,256); g.fillStyle='#b4a982'; g.fillRect(0,0,256,256);
  for(let i=0;i<6000;i++){ const v=rng(); g.fillStyle = v<.5 ? `rgba(120,108,72,${rng()*.18})` : `rgba(220,212,180,${rng()*.18})`; g.fillRect(rng()*256,rng()*256,1+rng()*3,1+rng()*3); }
  const t=tex(c); t.repeat.set(45,45);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(14000,14000), std({ color:'#ffffff', map:t, roughness:1 }));
  ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground);
}
const coastX = z => 1050 + 60*Math.sin(z/180) + 28*Math.sin(z/57+1);
{
  const sh=new THREE.Shape(); sh.moveTo(coastX(-7000), 7000);
  for(let z=-7000; z<=7000; z+=25) sh.lineTo(coastX(z), -z);
  sh.lineTo(8000,-7000); sh.lineTo(8000,7000); sh.closePath();
  const g=new THREE.ShapeGeometry(sh); g.rotateX(-Math.PI/2);
  const sea=new THREE.Mesh(g, seaMat); sea.position.y=0.5; sea.receiveShadow=true; scene.add(sea);
  const mud=new THREE.Mesh(new THREE.PlaneGeometry(420,14000), std({ color:'#9a8f73', roughness:1 })); mud.rotation.x=-Math.PI/2; mud.position.set(1020,0.15,0); scene.add(mud);
}
function ribbon(curve, width, segs, y, mat, vScale=20){
  const len=curve.getLength(), pos=[], uv=[], idx=[];
  for(let i=0;i<=segs;i++){ const t=i/segs, p=curve.getPointAt(t), tg=curve.getTangentAt(t); const sx=-tg.z, sz=tg.x, l=Math.hypot(sx,sz)||1;
    pos.push(p.x+sx/l*width/2, y+p.y, p.z+sz/l*width/2, p.x-sx/l*width/2, y+p.y, p.z-sz/l*width/2);
    uv.push(t*len/vScale,0, t*len/vScale,1);
    if(i<segs){ const a=i*2; idx.push(a,a+2,a+1, a+1,a+2,a+3); } }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); g.setIndex(idx); g.computeVertexNormals();
  const m=new THREE.Mesh(g,mat); m.receiveShadow=true; scene.add(m); return m;
}
const riverCurve = new THREE.CatmullRomCurve3([V(-3200,0,-560),V(-2200,0,-650),V(-1400,0,-560),V(-900,0,-720),V(-400,0,-640),V(100,0,-760),V(600,0,-660),V(1000,0,-760),V(1400,0,-720)]);
ribbon(riverCurve, 84, 500, 0.12, std({ color:'#8c8163', roughness:1, side:THREE.DoubleSide }));
ribbon(riverCurve, 52, 500, 0.3, waterMat, 60);
const riverSamples = riverCurve.getSpacedPoints(400);
const riverZ = x => { let best=1e9, bz=0; for(const p of riverSamples){ const d=Math.abs(p.x-x); if(d<best){best=d;bz=p.z;} } return bz; };
for(let i=0;i<=160;i++){ const p=riverCurve.getPointAt(i/160), tg=riverCurve.getTangentAt(i/160); if(p.x>980) continue; for(const s of [-1,1]){ if(rng()<.75) tree(p.x - tg.z*s*R(48,60), p.z + tg.x*s*R(48,60), 1.1); } }

/* ---------- roads ---------- */
function roadTexture(kind){
  const [c,g]=cnv(256,128); g.fillStyle='#3b4044'; g.fillRect(0,0,256,128);
  for(let i=0;i<900;i++){ g.fillStyle=`rgba(${rng()<.5?0:255},${rng()<.5?0:255},255,${rng()*.05})`; g.fillRect(rng()*256,rng()*128,2,2); }
  g.fillStyle='#e9e7df';
  if(kind==='city'){ g.fillRect(0,8,256,3); g.fillRect(0,117,256,3); for(let x=0;x<256;x+=64) g.fillRect(x,62,34,4); }
  else { // expressway: median + 2 lanes each way
    g.fillStyle='#5e7a46'; g.fillRect(0,56,256,16); g.fillStyle='#d9d5c8'; g.fillRect(0,54,256,2); g.fillRect(0,72,256,2);
    g.fillStyle='#e9e7df'; g.fillRect(0,6,256,3); g.fillRect(0,119,256,3); for(let x=0;x<256;x+=64){ g.fillRect(x,30,30,3); g.fillRect(x,95,30,3); }
  }
  const t=tex(c); return t;
}
const roadMat = std({ map:roadTexture('city'), roughness:.85 });
const exMat = std({ map:roadTexture('ex'), roughness:.85, side:THREE.DoubleSide });
const ROADS=[-560,-400,-240,-80,80,240,400,560];
function roadPlane(cx,cz,len,w,vertical,y){
  const g=new THREE.PlaneGeometry(len,w); const uv=g.attributes.uv; for(let i=0;i<uv.count;i++) uv.setX(i, uv.getX(i)*len/20);
  g.rotateX(-Math.PI/2); if(vertical) g.rotateY(Math.PI/2);
  const m=new THREE.Mesh(g,roadMat); m.position.set(cx,y,cz); m.receiveShadow=true; scene.add(m); return m;
}
for(const c of ROADS){ roadPlane(0,c,1280,14,false,0.15); roadPlane(c,0,1280,14,true,0.25); }
roadPlane(-680,240,80,14,false,0.15);   // to fab
roadPlane(80,705,130,14,true,0.25);     // to solar park
roadPlane(750,-400,220,14,false,0.15);  // to water works
roadPlane(-575,-975,670,14,false,0.15); // airport landside
roadPlane(-240,-807,335,14,true,0.45);  // airport connector (bridges the river)
// lamps + road trees
for(const c of ROADS){
  for(let s=-630;s<=630;s+=24){
    if(ROADS.some(r=>Math.abs(s-r)<16)) continue;
    for(const o of [-10.5,10.5]){ if(rng()<.85){ tree(s,c+o,.9); tree(c+o,s,.9); } }
  }
  for(let s=-620;s<=620;s+=40){ if(ROADS.some(r=>Math.abs(s-r)<10)) continue; lampPts.push([s,c+7.5],[s,c-7.5],[c+7.5,s],[c-7.5,s]); }
}
// expressway from Ahmedabad (north)
const exCurve = new THREE.CatmullRomCurve3([V(560,0,-3400),V(520,0,-2200),V(380,0,-1400),V(200,0,-900),V(90,0,-660),V(80,0,-566)]);
ribbon(exCurve, 30, 400, 0.35, exMat);
for(let i=0;i<=120;i++){ const t=i/120, p=exCurve.getPointAt(t); if(p.z>-600) continue; const tg=exCurve.getTangentAt(t); lampPts.push([p.x,p.z]); if(i%2===0) for(const s of [-1,1]) tree(p.x - tg.z*s*22, p.z + tg.x*s*22, 1); }
const exSamples = exCurve.getSpacedPoints(60);

/* ---------- city blocks ---------- */
const BLOCKS=[-480,-320,-160,0,160,320,480];
function zoneOf(cx,cz){
  if(cx===0&&cz===-160) return 'abcd';
  if(cx===0&&cz===-320) return 'hub';
  if(cx===0&&cz>=0&&cz<=320) return 'park';
  if(Math.abs(cx)===160&&Math.abs(cz)<=160) return 'cbd';
  if(cx===-480&&cz>0) return 'logistics';
  if(Math.abs(cx)<=320&&Math.abs(cz)<=320) return 'resiMid';
  return 'resiLow';
}
const lowHouses={ resi:[], resi2:[] };

function crown(x,top,z,fp,h){
  const k=rng();
  if(k<.3){ solid(new THREE.CylinderGeometry(.5,.8,28,6),M.metal,x,top+14,z); beacon(x,top+28.5,z); }
  else if(k<.55){ solid(new THREE.CylinderGeometry(fp*.36,fp*.36,1.2,24),M.dark,x,top+.6,z); const ring=new THREE.Mesh(new THREE.TorusGeometry(fp*.24,.35,6,32),M.white); ring.rotation.x=Math.PI/2; ring.position.set(x,top+1.3,z); city.add(ring); }
  else if(k<.8){ slab(x,top,z,fp*.55,5,fp*.55,M.metal); slab(x+fp*.15,top+5,z-fp*.1,fp*.18,3,fp*.18,M.dark); }
  else { for(const a of [0,Math.PI/2]){ const f=slab(x,top,z,fp*.9,10,.8,M.white); f.rotation.y=a; } }
  if(h>130 && k>=.3) beacon(x,top+(k<.55?2:k<.8?8.5:10.5),z);
}
function tower(x,z,fp,h,type){
  const fac=pick([F.glassBlue,F.glassTeal,F.glassBlue,F.bronze,F.office]);
  fp=snap(fp,4); h=snap(h,3.5);
  bx(x,0.6,z,fp+12,8,fp+12,F.office);
  let top=8.6, cw=fp;
  if(type==='setback'){ const h1=snap(h*.6,3.5), h2=snap(h*.26,3.5), h3=snap(h*.14,3.5); bx(x,top,z,fp,h1,fp,fac); top+=h1; bx(x,top,z,fp-8,h2,fp-8,fac); top+=h2; bx(x,top,z,fp-16,h3,fp-16,fac); top+=h3; cw=fp-16; }
  else if(type==='cyl'){ cyl(x,top,z,fp/2,h,fac); top+=h; slab(x,top,z,fp*.5,3,fp*.5,M.metal); cw=fp*.6; }
  else if(type==='twist'){ bx(x,top,z,fp,h,fp,fac,{twist:0.9}); top+=h; cw=fp*.6; }
  else if(type==='slim'){ bx(x,top,z,fp,h,snap(fp*.6,4),fac,{rot:rng()<.5?0:Math.PI/2}); top+=h; cw=fp*.5; }
  else { bx(x,top,z,fp,h,fp,fac); top+=h; }
  // floor plate fins on tall ones
  if(h>150 && type==='box'){ for(let y=8.6+35; y<top-10; y+=35) slab(x,y,z,fp+1.2,.9,fp+1.2,M.white); }
  crown(x,top,z,cw,h);
}
function buildCBD(cx,cz){
  const center=1-Math.abs(cz)/400;
  if(rng()<.38){
    tower(cx,cz,44,R(210,270)*(.8+.2*center),pick(['twist','setback','cyl']));
    bx(cx,0.6,cz+50,108,17.5,18,F.office); bx(cx,0.6,cz-50,108,14,18,F.glassTeal);
  } else {
    for(const [ox,oz] of [[-30,-30],[30,-30],[-30,30],[30,30]]) tower(cx+ox,cz+oz,pick([28,32,36]),R(70,200)*(.7+.3*center),pick(['box','setback','cyl','slim','box','twist']));
  }
  for(let i=0;i<10;i++) tree(cx+R(-60,60), cz+pick([-63,63]), .8);
}
function rooftop(x,top,z,w,d){ slab(x+w*.2,top,z,Math.min(8,w*.3),4,Math.min(8,d*.4),M.concrete); slab(x-w*.25,top,z+d*.1,4,3,4,M.dark); }
function buildResiMid(cx,cz){
  const fac=rng()<.5?F.resi:F.resi2, t=rng();
  if(t<.35){ for(const oz of [-42,0,42]){ const h=snap(R(24,46),3.5); bx(cx,.6,cz+oz,96,h,16,fac); rooftop(cx,.6+h,cz+oz,96,16); }
    for(const oz of [-21,21]) for(let x=-44;x<=44;x+=11) tree(cx+x,cz+oz,.85); }
  else if(t<.7){ for(const [ox,oz] of [[-30,-30],[30,-30],[-30,30],[30,30]]){ const h=snap(R(42,84),3.5); bx(cx+ox,.6,cz+oz,24,h,24,fac); rooftop(cx+ox,.6+h,cz+oz,24,24); }
    for(let i=0;i<14;i++) tree(cx+R(-12,12),cz+R(-55,55),.9); for(let i=0;i<8;i++) tree(cx+R(-55,55),cz+R(-10,10),.9); }
  else { const h=snap(R(25,42),3.5); bx(cx,.6,cz-48,116,h,18,fac); bx(cx-50,.6,cz+8,16,h-7,92,fac); bx(cx+50,.6,cz+8,16,h-7,92,fac);
    rooftop(cx,.6+h,cz-48,116,18); for(let i=0;i<22;i++) tree(cx+R(-34,34),cz+R(-26,50),1); }
}
function buildResiLow(cx,cz){
  for(const ox of [-45,-15,15,45]) for(const oz of [-45,-15,15,45]){
    if(rng()<.18){ tree(cx+ox,cz+oz,1.2); continue; }
    (rng()<.55?lowHouses.resi:lowHouses.resi2).push([cx+ox+R(-2,2), cz+oz+R(-2,2), rng()<.5?0:Math.PI/2]);
    if(rng()<.6) tree(cx+ox+8, cz+oz+8, .8);
  }
}
function buildLogistics(cx,cz){
  bx(cx,.6,cz-30,120,14,44,F.panel); bx(cx,.6,cz+33,120,10.5,40,F.panel);
  for(const z of [cz-30,cz+33]) for(let x=-50;x<=50;x+=20) slab(cx+x,.6+(z===cz-30?14:10.5),z,3,.6,30,M.white);
  for(let i=0;i<6;i++) slab(cx-58+i*9, .6, cz+3, 2.6, 3.2, 12, pick([M.white,M.teal,M.dark]));
}
function buildHub(cx,cz){
  slab(cx,.6,cz,140,.3,140,M.paving);
  slab(cx,9,cz-20,110,1.2,40,M.white);
  for(let x=-50;x<=50;x+=20) for(const z of [-36,-4]) solid(new THREE.CylinderGeometry(.7,.7,8.4,8),M.metal,cx+x,4.8,cz+z);
  bx(cx,.6,cz+38,84,17.5,24,F.glassTeal);
  for(let i=0;i<5;i++){ const b=slab(cx-40+i*20, .9, cz-20, 3, 3.4, 12, i%2?M.teal:M.white); }
  for(let i=0;i<16;i++) tree(cx+R(-62,62),cz+R(56,64),.9);
}
function buildPark(cx,cz){
  const px=cx+R(-15,15), pz=cz+R(-15,15);
  solid(new THREE.CylinderGeometry(26,26,.3,40),waterMat,px,.75,pz);
  solid(new THREE.TorusGeometry(26.5,.6,6,48),M.paving,px,.8,pz).rotation.x=Math.PI/2;
  slab(cx,.6,cz,6,.15,146,M.paving); slab(cx,.6,cz,146,.15,6,M.paving);
  if(cz===320){ const p=solid(new THREE.CylinderGeometry(14,14,1,24),M.white,cx+40,7.5,cz-40); for(let a=0;a<6;a++) solid(new THREE.CylinderGeometry(.5,.5,7,6),M.metal,cx+40+Math.cos(a)*12,4,cz-40+Math.sin(a)*12); }
  for(let i=0;i<95;i++){ const x=cx+R(-66,66), z=cz+R(-66,66); if(Math.hypot(x-px,z-pz)<32||Math.abs(x-cx)<5||Math.abs(z-cz)<5) continue; tree(x,z,R(.9,1.4)); }
}
function buildABCD(cx,cz){
  slab(cx,.6,cz,140,.3,140,M.paving);
  // ring-sector office building
  const sh=new THREE.Shape(); const ro=54, ri=36, a0=-Math.PI*.35, a1=Math.PI*1.35;
  sh.absarc(0,0,ro,a0,a1,false); sh.absarc(0,0,ri,a1,a0,true); sh.closePath();
  const H=21;
  const g=new THREE.ExtrudeGeometry(sh,{depth:H,bevelEnabled:false,curveSegments:48}); g.rotateX(-Math.PI/2);
  const uv=g.attributes.uv; for(let i=0;i<uv.count;i++) uv.setXY(i, uv.getX(i)/F.office.tileW, uv.getY(i)/F.office.tileH);
  // extrude groups: 0 = caps, 1 = sides
  const ring=shadowed(new THREE.Mesh(g,[M.roof,F.office.side])); ring.position.set(cx,.9,cz+4); city.add(ring);
  // central glass drum + floating disc canopy
  cyl(cx,.9,cz+4,15,31.5,F.glassTeal);
  solid(new THREE.CylinderGeometry(32,32,1.6,48),M.white,cx,36,cz+4);
  for(let a=0;a<8;a++){ const ang=a/8*Math.PI*2; solid(new THREE.CylinderGeometry(.6,.6,3.2,6),M.metal,cx+Math.cos(ang)*14,33.6,cz+4+Math.sin(ang)*14); }
  // reflecting pool + plaza flagpoles
  solid(new THREE.BoxGeometry(70,.3,14),waterMat,cx,1,cz+52);
  for(let i=-2;i<=2;i++){ solid(new THREE.CylinderGeometry(.25,.25,16,6),M.white,cx+i*9,8.9,cz+64); }
  for(let i=0;i<18;i++) tree(cx+R(-64,64), cz+pick([-64,-58]),1);
}

for(const cx of BLOCKS) for(const cz of BLOCKS){
  const zone=zoneOf(cx,cz);
  const plate=new THREE.Mesh(new THREE.BoxGeometry(146,.6,146), zoneMat[zone]); plate.position.set(cx,.3,cz); plate.receiveShadow=true; city.add(plate);
  ({cbd:buildCBD, resiMid:buildResiMid, resiLow:buildResiLow, logistics:buildLogistics, hub:buildHub, park:buildPark, abcd:buildABCD})[zone](cx,cz);
}
// low-rise villas (instanced)
for(const key of ['resi','resi2']){
  const list=lowHouses[key]; if(!list.length) continue;
  const w=12,h=7,d=12; const g=new THREE.BoxGeometry(w,h,d); facadeUV(g,F[key],w,h,d);
  const im=new THREE.InstancedMesh(g,F[key].box,list.length); const dm=new THREE.Object3D();
  list.forEach(([x,z,r],i)=>{ dm.position.set(x,.6+h/2,z); dm.rotation.set(0,r,0); dm.scale.set(1,rng()<.3?1.5:1,1); if(dm.scale.y>1) dm.position.y=.6+h*0.75; dm.updateMatrix(); im.setMatrixAt(i,dm.matrix); });
  im.castShadow=im.receiveShadow=true; city.add(im);
}

/* ---------- metro loop ---------- */
function roundedRect(hh,r,y){
  const c=hh-r, pts=[]; const corners=[[c,-c,-Math.PI/2],[c,c,0],[-c,c,Math.PI/2],[-c,-c,Math.PI]];
  corners.forEach(([x,z,a0],k)=>{
    for(let j=0;j<=8;j++){ const a=a0+j/8*Math.PI/2; pts.push(V(x+r*Math.cos(a),y,z+r*Math.sin(a))); }
    const end=pts[pts.length-1]; const [nx,nz,na]=corners[(k+1)%4]; const st=V(nx+r*Math.cos(na),y,nz+r*Math.sin(na));
    for(let j=1;j<10;j++) pts.push(end.clone().lerp(st,j/10));
  });
  return new THREE.CatmullRomCurve3(pts,true,'centripetal');
}
const metroCurve = roundedRect(240,40,12);
{
  const N=220, pts=metroCurve.getSpacedPoints(N), segLen=metroCurve.getLength()/N;
  const deck=new THREE.InstancedMesh(new THREE.BoxGeometry(8,1.6,segLen+.4),M.concrete,N);
  const pil=new THREE.InstancedMesh(new THREE.CylinderGeometry(1.2,1.5,12,10),M.concrete,Math.ceil(N/3));
  const dm=new THREE.Object3D(); let pc=0;
  for(let i=0;i<N;i++){ const a=pts[i], b=pts[i+1]; dm.position.copy(a).lerp(b,.5); dm.lookAt(b); dm.updateMatrix(); deck.setMatrixAt(i,dm.matrix);
    if(i%3===0){ dm.position.set(a.x,6,a.z); dm.rotation.set(0,0,0); dm.updateMatrix(); pil.setMatrixAt(pc++,dm.matrix); } }
  pil.count=pc; deck.castShadow=deck.receiveShadow=pil.castShadow=true; city.add(deck,pil);
  for(const [x,z,along] of [[0,-240,'x'],[240,0,'z'],[0,240,'x'],[-240,0,'z']]){
    for(const s of [-1,1]){ if(along==='x') bx(x,12.8,z+s*8.5,64,5,3,F.glassTeal); else bx(x+s*8.5,12.8,z,3,5,64,F.glassTeal); }
    if(along==='x') slab(x,18.8,z,72,1,24,M.white); else slab(x,18.8,z,24,1,72,M.white);
  }
}
const trains=[];
{
  const bodyG=new THREE.BoxGeometry(3.2,3.4,18), bandG=new THREE.BoxGeometry(3.3,1.1,17.4);
  const bodyM=std({color:'#f3f4f2',roughness:.35,metalness:.3});
  const bandM=std({color:'#1b3b45',roughness:.2,metalness:.4,emissive:new THREE.Color('#ffe2b0'),emissiveIntensity:0});
  facadeMats.push(bandM); bandM.userData.nightE=2.2;
  for(let k=0;k<2;k++){ const cars=[]; for(let i=0;i<4;i++){ const g=new THREE.Group(); const b=new THREE.Mesh(bodyG,bodyM); b.castShadow=true; const s=new THREE.Mesh(bandG,bandM); s.position.y=.5; const st=new THREE.Mesh(new THREE.BoxGeometry(3.32,.35,18.02),M.teal); st.position.y=-.9; g.add(b,s,st); scene.add(g); cars.push(g); } trains.push({cars,offset:k*.5}); }
}

/* ---------- semiconductor fab ---------- */
const steam=[];
{
  const ox=-900, oz=250;
  slab(ox,0,oz,380,.6,260,std({color:'#c9c6bd',roughness:1}));
  bx(ox-30,.6,oz-20,200,31.5,108,F.panel); bx(ox-30,.6,oz+80,200,21,48,F.panel);
  slab(ox-30,32.1,oz-20,200,.4,4,M.teal); // accent band
  bx(ox+120,.6,oz-40,68,21,60,F.office);
  bx(ox+130,.6,oz-110,60,21,24,F.glassBlue);
  // rooftop air handlers
  { const im=new THREE.InstancedMesh(new THREE.BoxGeometry(7,3.4,7),M.metal,48); const dm=new THREE.Object3D(); let n=0;
    for(let i=0;i<12;i++) for(let j=0;j<4;j++){ dm.position.set(ox-30-88+i*16, 32.1+1.7, oz-20-36+j*24); dm.updateMatrix(); im.setMatrixAt(n++,dm.matrix); }
    im.castShadow=true; city.add(im); }
  for(let i=0;i<4;i++){ solid(new THREE.CylinderGeometry(1.8,2.2,26,12),M.white,ox-120+i*60,32+13,oz+40); }
  // cooling towers (hyperbolic)
  const prof=[]; for(let i=0;i<=12;i++){ const t=i/12; prof.push(new THREE.Vector2(9.5-3.2*Math.sin(t*Math.PI*.85),t*24)); }
  const ctG=new THREE.LatheGeometry(prof,28); const ctM=std({color:'#cdc9c0',roughness:.9,side:THREE.DoubleSide});
  const steamM=std({color:'#ffffff',transparent:true,opacity:.5,roughness:1,depthWrite:false});
  for(let a=0;a<3;a++) for(let b=0;b<2;b++){ const x=ox+98+a*22, z=oz+45+b*24; solid(ctG,ctM,x,.6,z);
    for(let k=0;k<3;k++){ const p=new THREE.Mesh(new THREE.IcosahedronGeometry(6,1),steamM); p.position.set(x,24,z); scene.add(p); steam.push({m:p,x,z,ph:k/3+rng()*.1}); } }
  // gas storage spheres
  for(let i=0;i<3;i++){ solid(new THREE.SphereGeometry(7,20,14),M.white,ox-150+i*20,9,oz+115); for(const s of [-1,1]) solid(new THREE.CylinderGeometry(.5,.5,8,6),M.metal,ox-150+i*20+s*4,4,oz+115); }
  // parking lot (static cars)
  { const im=new THREE.InstancedMesh(new THREE.BoxGeometry(2,1.5,4.5),std({color:'#ffffff',roughness:.4,metalness:.4}),120); const dm=new THREE.Object3D(); const cols=['#e8e8e6','#2d3236','#9aa3aa','#7d1f1f','#20406a','#c7c7c2']; let n=0;
    slab(ox+40,.6,oz-95,120,.1,40,std({color:'#4a4f53',roughness:.9}));
    for(let i=0;i<20;i++) for(let j=0;j<6;j++){ if(rng()<.2) continue; dm.position.set(ox-15+i*5.6,1.45,oz-110+j*6.2); dm.rotation.set(0,0,0); dm.updateMatrix(); im.setMatrixAt(n,dm.matrix); im.setColorAt(n,C(pick(cols))); n++; }
    im.count=n; city.add(im); }
  for(let x=-185;x<=185;x+=10){ tree(ox+x,oz-136,.9); tree(ox+x,oz+136,.9); }
}

/* ---------- solar park ---------- */
{
  const ox=150, oz=910;
  slab(ox,0,oz,860,.4,320,M.gravel);
  const list=[]; for(let x=-410;x<=410;x+=10) for(let z=-140;z<=140;z+=15){ if(Math.abs(x)<9||Math.abs(z)<9) continue; list.push([ox+x,oz+z]); }
  const im=new THREE.InstancedMesh(new THREE.BoxGeometry(9,.25,6),M.solar,list.length); const dm=new THREE.Object3D();
  list.forEach(([x,z],i)=>{ dm.position.set(x,2.4,z); dm.rotation.set(.42,0,0); dm.updateMatrix(); im.setMatrixAt(i,dm.matrix); });
  im.castShadow=true; im.receiveShadow=true; city.add(im);
  slab(ox,0.4,oz,6,.1,300,M.concrete); slab(ox,.4,oz,840,.1,6,M.concrete);
  // substation + transmission line towards the city
  slab(ox+440,.4,oz-120,40,.3,36,M.concrete);
  for(let i=0;i<6;i++) slab(ox+428+(i%3)*12,.7,oz-128+Math.floor(i/3)*16,6,6,6,M.metal);
  const pylonPts=[]; for(let i=0;i<6;i++){ const t=i/5; pylonPts.push(V(lerp(ox+440,610,t),0,lerp(oz-120,610,t))); }
  const wireM=new THREE.LineBasicMaterial({color:'#3a3f44'});
  pylonPts.forEach(p=>{ solid(new THREE.CylinderGeometry(.6,2.4,34,4),M.metal,p.x,17,p.z); const arm=slab(p.x,30,p.z,16,.8,.8,M.metal); arm.rotation.y=Math.PI/2; });
  for(const s of [-7,7]){ const g=new THREE.BufferGeometry().setFromPoints(pylonPts.map(p=>V(p.x+s*0.0,30.4,p.z+s))); scene.add(new THREE.Line(g,wireM)); }
}

/* ---------- airport ---------- */
let flyer;
const flyCurve = new THREE.CatmullRomCurve3([V(-1110,3,-1120),V(-800,3,-1120),V(-520,12,-1120),V(-250,70,-1140),V(-60,180,-1300),V(-300,260,-1620),V(-900,280,-1680),V(-1450,220,-1470),V(-1650,120,-1210),V(-1420,32,-1124)],true);
function makePlane(){
  const g=new THREE.Group(); const W=std({color:'#f4f5f4',roughness:.35,metalness:.2});
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(2,30,6,14),W); body.rotation.x=Math.PI/2;
  const wing=new THREE.Mesh(new THREE.BoxGeometry(34,.6,6),W); wing.position.set(0,-.6,1);
  const fin=new THREE.Mesh(new THREE.BoxGeometry(.5,6.5,4.5),M.teal); fin.position.set(0,4,-14.5);
  const hs=new THREE.Mesh(new THREE.BoxGeometry(12,.4,3),W); hs.position.set(0,1,-15);
  g.add(body,wing,fin,hs);
  for(const s of [-1,1]){ const e=new THREE.Mesh(new THREE.CylinderGeometry(1.15,1.15,4.5,12),M.metal); e.rotation.x=Math.PI/2; e.position.set(s*7.5,-1.8,3); g.add(e); }
  g.traverse(o=>{ if(o.isMesh) o.castShadow=true; });
  return g;
}
{
  const [c,g]=cnv(2048,96); g.fillStyle='#34393d'; g.fillRect(0,0,2048,96); g.fillStyle='#ecebe5';
  g.fillRect(0,6,2048,3); g.fillRect(0,87,2048,3);
  for(let x=140;x<1900;x+=60) g.fillRect(x,46,32,4);
  for(const x0 of [20,1948]) for(let i=0;i<8;i++) g.fillRect(x0,14+i*9,80,5);
  for(const x0 of [260,1740]) { g.fillRect(x0,24,60,10); g.fillRect(x0,62,60,10); }
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=ANISO;
  const rw=new THREE.Mesh(new THREE.PlaneGeometry(700,24),std({map:t,roughness:.85})); rw.rotation.x=-Math.PI/2; rw.position.set(-760,.3,-1120); rw.receiveShadow=true; scene.add(rw);
  slab(-760,0,-1095,1000,.15,140,std({color:'#a8a68c',roughness:1}));
  const asph=std({color:'#3d4245',roughness:.9});
  slab(-760,.2,-1085,640,.1,12,asph);
  for(const x of [-1040,-760,-480]) slab(x,.2,-1100,14,.1,24,asph);
  slab(-760,.2,-1050,320,.15,44,std({color:'#bdbab1',roughness:.9}));
  bx(-760,.6,-1010,200,10.5,30,F.glassTeal);
  const arch=new THREE.CylinderGeometry(1,1,1,40,1,true,0,Math.PI); arch.rotateZ(Math.PI/2);
  const roof=shadowed(new THREE.Mesh(arch,std({color:'#f2f2ee',roughness:.4,metalness:.2,side:THREE.DoubleSide}))); roof.scale.set(214,11,22); roof.position.set(-760,11.1,-1010); city.add(roof);
  // jet bridges
  for(const x of [-860,-760,-660]) slab(x,6,-1031,3,3,14,M.white);
  bx(-1000,.6,-1010,80,14,40,F.panel); // cargo
  // control tower
  solid(new THREE.CylinderGeometry(3,4,46,16),M.concrete,-560,23.6,-1000);
  cyl(-560,46.6,-1000,7,6,F.glassTeal); solid(new THREE.CylinderGeometry(7.6,7.6,1,20),M.white,-560,53.1,-1000); beacon(-560,55,-1000,1.1);
  for(const x of [-860,-760,-660]){ const p=makePlane(); p.position.set(x,3.6,-1052); city.add(p); }
  flyer=makePlane(); scene.add(flyer);
  for(let x=-900;x<=-250;x+=22){ tree(x,-962,.9); }
}

/* ---------- water works ---------- */
{
  const ox=760, oz=-510;
  slab(ox,0,oz,200,.6,160,std({color:'#c3c0b6',roughness:1}));
  for(const [x,z] of [[700,-555],[760,-555],[700,-470],[760,-470]]){
    solid(new THREE.CylinderGeometry(22,22,4,48,1,true),std({color:'#cfcbc2',roughness:.9,side:THREE.DoubleSide}),x,2.6,z);
    solid(new THREE.CylinderGeometry(21.6,21.6,.3,48),waterMat,x,3.9,z);
    const br=slab(x,4.4,z,44,1,2,M.metal); br.rotation.y=rng()*Math.PI;
    solid(new THREE.CylinderGeometry(3,3,4,16),M.concrete,x,4.8,z);
  }
  slab(830,.6,-550,40,3.4,70,M.concrete); slab(830,4,-550,37,.2,67,waterMat);
  bx(830,.6,-470,40,10.5,20,F.office);
}

/* ---------- countryside: fields + salt pans ---------- */
{
  const boxes=[]; const fieldCols=['#a3a06a','#8f9a5a','#b8ac7c','#a99268','#7f8f4e','#c2b88a','#96894f'];
  const blocked=(x,z,s)=> (Math.abs(x)<720+s && Math.abs(z)<720+s) || (x>-1150-s&&x<-650+s&&z>90-s&&z<410+s) || (x>-1300-s&&x<-150+s&&z>-1200-s&&z<-940+s)
    || (x>-300-s&&x<620+s&&z>720-s&&z<1100+s) || (x>640-s&&x<880+s&&z>-610-s&&z<-400+s) || Math.abs(z-riverZ(x))<70+s || x>coastX(z)-130-s
    || exSamples.some(p=>Math.hypot(p.x-x,p.z-z)<36+s);
  let tries=0; while(boxes.length<520 && tries<6000){ tries++;
    const x=R(-3000,1000), z=R(-3200,3000), w=R(70,170), d=R(60,150); if(blocked(x,z,Math.max(w,d)/2)) continue;
    boxes.push([x,z,w,d,pick(fieldCols)]); }
  for(let i=0;i<5;i++) for(let j=0;j<14;j++) boxes.push([820+i*28, 260+j*52, 24, 46, pick(['#ebe5d9','#ddd3c6','#e6cdc8','#d9d6cf']), 1]);
  const im=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),std({color:'#ffffff',roughness:1}),boxes.length); const dm=new THREE.Object3D();
  boxes.forEach(([x,z,w,d,c,salt],i)=>{ dm.position.set(x,salt?.22:.12,z); dm.rotation.set(0,salt?0:R(-.05,.05),0); dm.scale.set(w,.2,d); dm.updateMatrix(); im.setMatrixAt(i,dm.matrix); im.setColorAt(i,C(c)); });
  im.receiveShadow=true; scene.add(im);
  // farm trees + hamlets
  for(let i=0;i<500;i++){ const x=R(-2600,950), z=R(-2600,2600); if(blocked(x,z,10)) continue; tree(x,z,R(1,1.6)); }
}

/* ---------- instanced trees + lamps ---------- */
{
  const N=trees.length; const dm=new THREE.Object3D();
  const trunk=new THREE.InstancedMesh(new THREE.CylinderGeometry(.35,.5,3,5),M.trunk,N);
  const can=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(2.7,0),M.canopy,N);
  const greens=['#4f7a3a','#5f8a40','#6b9046','#3f6b35','#77964a','#58773a'];
  trees.forEach(([x,z,s],i)=>{ dm.position.set(x,.6+1.5*s,z); dm.rotation.set(0,rng()*6,0); dm.scale.set(s,s,s); dm.updateMatrix(); trunk.setMatrixAt(i,dm.matrix);
    dm.position.y=.6+4.6*s; dm.scale.set(s*R(.9,1.15),s*R(.85,1.2),s*R(.9,1.15)); dm.updateMatrix(); can.setMatrixAt(i,dm.matrix); can.setColorAt(i,C(pick(greens))); });
  can.castShadow=true; can.receiveShadow=true; scene.add(trunk,can);
  const L=lampPts.length;
  const poles=new THREE.InstancedMesh(new THREE.CylinderGeometry(.18,.25,9,5),M.metal,L);
  var lamps=new THREE.InstancedMesh(new THREE.SphereGeometry(.75,8,6),M.lamp,L);
  lampPts.forEach(([x,z],i)=>{ dm.position.set(x,4.8,z); dm.rotation.set(0,0,0); dm.scale.set(1,1,1); dm.updateMatrix(); poles.setMatrixAt(i,dm.matrix); dm.position.y=9.4; dm.updateMatrix(); lamps.setMatrixAt(i,dm.matrix); });
  lamps.visible=false; scene.add(poles,lamps);
}

/* ---------- traffic ---------- */
const lanes=[];
for(const c of ROADS){
  lanes.push({a:V(-640,0,c),d:V(1,0,0),len:1280},{a:V(640,0,c),d:V(-1,0,0),len:1280},{a:V(c,0,-640),d:V(0,0,1),len:1280},{a:V(c,0,640),d:V(0,0,-1),len:1280});
}
const exLen=exCurve.getLength();
for(const off of [5.2,9.4]) for(const dir of [1,-1]) lanes.push({curve:exCurve,off,dir,len:exLen});
const cars=[]; const carCols=['#f2f2f0','#e7e6e1','#9ea6ad','#2a2f33','#8a1d1d','#1f3f6e','#c9c7bf','#d9b13b','#2e5a3a'];
lanes.forEach(l=>{ const n=l.curve?20:7; for(let k=0;k<n;k++) cars.push({l, s:rng()*l.len, v:l.curve?R(24,34):R(9,16), big:rng()<.08}); });
const carMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(2,1.5,4.5),std({color:'#ffffff',roughness:.35,metalness:.45}),cars.length);
const lightMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1.8,.45,.35),M.lights,cars.length*2);
cars.forEach((c,i)=>{ carMesh.setColorAt(i,C(c.big?pick(['#d9a23b','#e9e9e4','#c0392b']):pick(carCols))); lightMesh.setColorAt(i*2,new THREE.Color(3,3,2.6)); lightMesh.setColorAt(i*2+1,new THREE.Color(3,.15,.1)); });
carMesh.castShadow=true; lightMesh.visible=false; scene.add(carMesh,lightMesh);
const _p=V(0,0,0), _f=V(0,0,0), _dm=new THREE.Object3D();
function updateCars(dt){
  cars.forEach((c,i)=>{
    c.s=(c.s+c.v*dt)%c.l.len; const l=c.l; let y;
    if(l.curve){ let t=c.s/l.len; if(l.dir<0) t=1-t; l.curve.getPointAt(t,_p); l.curve.getTangentAt(t,_f); if(l.dir<0) _f.negate(); _p.x+=_f.z*l.off; _p.z-=_f.x*l.off; y=.35; }
    else { _f.copy(l.d); _p.copy(l.a).addScaledVector(l.d,c.s); _p.x+=_f.z*3.5; _p.z-=_f.x*3.5; y=.2; }
    const sz=c.big?2.6:1, sy=c.big?1.9:1;
    _dm.position.set(_p.x,y+.75*sy,_p.z); _dm.rotation.set(0,Math.atan2(_f.x,_f.z),0); _dm.scale.set(c.big?1.25:1,sy,sz); _dm.updateMatrix(); carMesh.setMatrixAt(i,_dm.matrix);
    if(lightMesh.visible){ _dm.scale.set(1,1,1); const h=2.3*sz;
      _dm.position.set(_p.x+_f.x*h,y+.8,_p.z+_f.z*h); _dm.updateMatrix(); lightMesh.setMatrixAt(i*2,_dm.matrix);
      _dm.position.set(_p.x-_f.x*h,y+.8,_p.z-_f.z*h); _dm.updateMatrix(); lightMesh.setMatrixAt(i*2+1,_dm.matrix); }
  });
  carMesh.instanceMatrix.needsUpdate=true; if(lightMesh.visible) lightMesh.instanceMatrix.needsUpdate=true;
}
const mLen=metroCurve.getLength(), _n=V(0,0,0);
function updateTrains(t){
  trains.forEach(tr=>{ const base=(t*16/mLen+tr.offset)%1; tr.cars.forEach((g,i)=>{ let u=((base*mLen - i*19)%mLen+mLen)%mLen/mLen; metroCurve.getPointAt(u,_p); metroCurve.getPointAt((u+0.002)%1,_n); g.position.set(_p.x,15.1,_p.z); _n.y=15.1; g.lookAt(_n); }); });
}
function updatePlane(t){
  const u=(t/75)%1; flyCurve.getPointAt(u,_p); flyCurve.getPointAt((u+0.003)%1,_n);
  flyer.position.copy(_p); flyer.position.y+=0.6; flyer.lookAt(_n.x,_n.y+0.6,_n.z);
}
function updateSteam(t){ steam.forEach(s=>{ const k=(t*0.12+s.ph)%1; s.m.position.set(s.x+k*14,25+k*30,s.z+k*6); const sc=0.5+k*1.6; s.m.scale.set(sc,sc,sc); s.m.material.opacity=0.5; s.m.visible=k<0.95; }); }

/* ---------- composer ---------- */
const rt=new THREE.WebGLRenderTarget(innerWidth*PR, innerHeight*PR, { type:THREE.HalfFloatType, samples:4 });
const composer=new EffectComposer(renderer, rt);
composer.setSize(innerWidth, innerHeight);
composer.addPass(new RenderPass(scene,camera));
const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),0.12,0.55,0.92);
composer.addPass(bloom); composer.addPass(new OutputPass());

/* ---------- day / night ---------- */
let nightK=0, nightTarget=0, appliedK=-1;
const _c1=new THREE.Color();
function applyNight(k){
  const u=skyMat.uniforms;
  u.top.value.lerpColors(DAY.top,NIGHT.top,k); u.horizon.value.lerpColors(DAY.horizon,NIGHT.horizon,k); u.ground.value.lerpColors(DAY.ground,NIGHT.ground,k);
  u.sunColor.value.lerpColors(DAY.sunColor,NIGHT.sunColor,k); u.sunDir.value.lerpVectors(DAY.dir,NIGHT.dir,k).normalize();
  scene.fog.color.copy(u.horizon.value);
  hemi.color.lerpColors(DAY.hemiSky,NIGHT.hemiSky,k); hemi.groundColor.lerpColors(DAY.hemiGround,NIGHT.hemiGround,k); hemi.intensity=lerp(DAY.hemiI,NIGHT.hemiI,k);
  sun.color.lerpColors(DAY.sunLight,NIGHT.sunLight,k); sun.intensity=lerp(DAY.sunI,NIGHT.sunI,k);
  facadeMats.forEach(m=>{ m.emissiveIntensity=k*k*m.userData.nightE; });
  M.lamp.opacity=k; lamps.visible=k>0.02; lightMesh.visible=k>0.02; starMat.opacity=k;
  bloom.strength=lerp(0.12,0.95,k); bloom.threshold=lerp(0.92,0.55,k); bloom.radius=lerp(0.55,0.7,k);
  renderer.toneMappingExposure=lerp(DAY.exposure,NIGHT.exposure,k);
  scene.environment = k>0.5 ? envNight : envDay;
  if(k<=0.02) warnLights.forEach(w=>w.visible=false);
}
const btnNight=document.getElementById('btnNight');
function setNight(on){ nightTarget=on?1:0; btnNight.setAttribute('aria-pressed',String(on)); btnNight.querySelector('.lbl').textContent=on?'Day':'Night';
  btnNight.querySelector('svg').innerHTML = on ? '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>' : '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'; }
btnNight.addEventListener('click',()=>setNight(nightTarget<0.5));

/* ---------- tour ---------- */
const STOPS=[
 { id:'overview', short:'Overview', kicker:'Ahmedabad district, Gujarat', title:'Dholera Special Investment Region',
   body:'A greenfield industrial city planned on flat coastal land beside the Gulf of Khambhat. The model shows the core grid: a civic centre and business district on a green spine, industry to the west, the airport to the north and solar fields to the south.',
   facts:[['Planned area','920 km²'],['From Ahmedabad','~100 km'],['Corridor','Delhi–Mumbai DMIC']], cam:[1250,820,1450], target:[-60,0,-120] },
 { id:'abcd', short:'ABCD', kicker:'Civic centre', title:'ABCD Building',
   body:'The Administrative cum Business Centre for Dholera was one of the first buildings completed in the city. It holds the development authority’s offices and the command-and-control centre that monitors traffic, water, power and safety systems.',
   facts:[['Role','Admin and business hub'],['Houses','City command centre'],['In this model','Stylised form']], cam:[118,62,-30], target:[0,14,-160] },
 { id:'cbd', short:'Downtown', kicker:'Business district', title:'Towers along the green spine',
   body:'Office and residential towers line both sides of a linear park. Blocks are short and the park runs the length of the core, so most desks sit a few minutes’ walk from shade and water.',
   facts:[['Tower heights','70–270 m'],['Spine','Linear central park'],['Blocks','Walkable grid']], cam:[-150,120,360], target:[60,70,-40] },
 { id:'mobility', short:'Mobility', kicker:'Getting around', title:'Metro loop and expressway',
   body:'The Ahmedabad–Dholera expressway arrives from the north and crosses the river into the grid. Inside the city an elevated metro ring circles the business district with a station on each side.',
   facts:[['Expressway','~109 km to Ahmedabad'],['Traffic','Drives on the left'],['Metro','Elevated loop (concept)']], cam:[400,175,-170], target:[60,10,-430] },
 { id:'fab', short:'Chip fab', kicker:'Industry', title:'Semiconductor fab',
   body:'Tata Electronics is building India’s first commercial chip fabrication plant here with Taiwan’s PSMC. Windowless cleanroom halls sit under rows of air handlers, with cooling towers and gas storage beside them.',
   facts:[['Investment','₹91,000 crore'],['Partner','PSMC, Taiwan'],['Capacity','50,000 wafers/month']], cam:[-620,165,540], target:[-900,10,250] },
 { id:'solar', short:'Solar', kicker:'Energy', title:'Dholera Solar Park',
   body:'Saline coastal land that is poor for farming suits large solar fields. Rows of south-facing panels feed a substation, and a transmission line carries the power into the city grid.',
   facts:[['Planned capacity','5,000 MW'],['Panels','Tilted to the south'],['Land','Saline flats']], cam:[560,150,600], target:[150,0,920] },
 { id:'airport', short:'Airport', kicker:'Air link', title:'Dholera International Airport',
   body:'A greenfield airport north of the river, planned for passengers and air cargo from the industrial zones. Watch an aircraft fly a circuit and touch down on the runway.',
   facts:[['Type','Greenfield'],['Traffic','Passengers and cargo'],['Access','Road link to the core']], cam:[-430,165,-800], target:[-760,10,-1070] },
 { id:'water', short:'Riverfront', kicker:'Utilities', title:'River Bhadar and the water works',
   body:'Treatment and recycling plants sit by the river as it winds east to the gulf. Salt pans along the shore are a long-standing local industry on this coast.',
   facts:[['Plant','Treat and recycle'],['River','Flows to the gulf'],['Coast','Salt pans, mudflats']], cam:[1000,170,-330], target:[730,0,-580] },
 { id:'night', short:'Night', kicker:'After dark', title:'Dholera at night', night:true,
   body:'Office and apartment windows light up, the metro runs lit and traffic streams along the grid. Drag to look around, scroll to zoom, or pick any stop below.',
   facts:[['Mouse','Drag · scroll · right-drag'],['Keys','← → stops, Space play'],['Toggle','Day / Night button']], cam:[560,300,660], target:[0,50,0] },
];
const TAGS=[ ['abcd','ABCD Building',0,44,-160], ['cbd','Business district',160,250,0], ['mobility','Metro loop',240,24,-240], ['mobility','Expressway to Ahmedabad',360,12,-1350],
  ['fab','Semiconductor fab',-930,60,230], ['solar','Solar park',150,18,900], ['airport','Airport',-760,40,-1060], ['water','Water works',760,20,-520],
  ['overview','Gulf of Khambhat',1500,6,250], ['water','River Bhadar',-700,8,-660] ];

const $=id=>document.getElementById(id);
const stopsEl=$('stops'), tagsEl=$('tags'), card=$('card'), bar=$('bar');
stopsEl.innerHTML = STOPS.map((s,i)=>`<li><button data-i="${i}"><span class="n">${String(i+1).padStart(2,'0')}</span><span class="t">${s.short}</span></button></li>`).join('');
const tagEls = TAGS.map(([id,label,x,y,z])=>{ const b=document.createElement('button'); b.className='tag'; b.textContent=label; b.dataset.stop=id; tagsEl.appendChild(b); return { el:b, id, p:V(x,y,z) }; });
tagsEl.addEventListener('click',e=>{ const b=e.target.closest('.tag'); if(!b) return; const i=STOPS.findIndex(s=>s.id===b.dataset.stop); if(i>=0){ exitRoam(); goTo(i); } });
stopsEl.addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; exitRoam(); goTo(+b.dataset.i); });

let cur=0, playing=!reduced, roam=false, hold=0, fly=null; const HOLD=10;
function renderCard(s,i){
  $('kicker').textContent=s.kicker; $('count').textContent=`${i+1} / ${STOPS.length}`; $('title').textContent=s.title; $('body').textContent=s.body;
  $('facts').innerHTML=s.facts.map(([l,v])=>`<div><dt>${l}</dt><dd>${v}</dd></div>`).join('');
  stopsEl.querySelectorAll('button').forEach((b,k)=>{ if(k===i){ b.setAttribute('aria-current','step'); b.scrollIntoView({block:'nearest',inline:'center',behavior:reduced?'auto':'smooth'}); } else b.removeAttribute('aria-current'); });
  tagEls.forEach(t=>t.el.classList.toggle('on', t.id===s.id && s.id!=='overview'));
}
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
function goTo(i,instant=false){
  cur=(i+STOPS.length)%STOPS.length; const s=STOPS[cur]; renderCard(s,cur); hold=0;
  setNight(!!s.night);
  const toP=V(...s.cam), toT=V(...s.target);
  if(instant||reduced){ camera.position.copy(toP); controls.target.copy(toT); fly=null; controls.update(); return; }
  const fromP=camera.position.clone(), fromT=controls.target.clone(); const dist=fromP.distanceTo(toP);
  const mid=fromP.clone().lerp(toP,.5); mid.y=Math.max(fromP.y,toP.y)+dist*0.22;
  fly={ curve:new THREE.QuadraticBezierCurve3(fromP,mid,toP), fromT, toT, t:0, dur:THREE.MathUtils.clamp(dist/520,2.4,5.5) };
  controls.enabled=false;
}
function setPlaying(p){ playing=p; $('btnPlay').setAttribute('aria-label',p?'Pause tour':'Play tour');
  $('playIcon').innerHTML = p ? '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>' : '<path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/>'; }
function exitRoam(){ if(!roam) return; roam=false; card.hidden=false; $('btnRoam').setAttribute('aria-pressed','false'); }
$('btnPlay').addEventListener('click',()=>{ exitRoam(); setPlaying(!playing); if(playing&&!fly) hold=Math.min(hold,HOLD-0.01); });
$('btnNext').addEventListener('click',()=>{ exitRoam(); goTo(cur+1); });
$('btnPrev').addEventListener('click',()=>{ exitRoam(); goTo(cur-1); });
$('btnRoam').addEventListener('click',()=>{ roam=!roam; card.hidden=roam; $('btnRoam').setAttribute('aria-pressed',String(roam)); if(roam) setPlaying(false); });
controls.addEventListener('start',()=>{ if(playing) setPlaying(false); });
addEventListener('keydown',e=>{
  if(e.target.closest && e.target.closest('input,textarea')) return;
  if(e.key==='ArrowRight'){ exitRoam(); goTo(cur+1); } else if(e.key==='ArrowLeft'){ exitRoam(); goTo(cur-1); }
  else if(e.key===' '&&!(e.target instanceof HTMLButtonElement)){ e.preventDefault(); setPlaying(!playing); }
  else if(e.key==='n'||e.key==='N') setNight(nightTarget<0.5);
});
setPlaying(playing);
goTo(0,true);

/* ---------- frame loop ---------- */
const clock=new THREE.Clock(); const _v=V(0,0,0), Y=V(0,1,0);
function updateTour(dt){
  if(fly){ fly.t+=dt/fly.dur; const k=ease(Math.min(fly.t,1)); fly.curve.getPoint(k,camera.position); controls.target.lerpVectors(fly.fromT,fly.toT,k);
    if(fly.t>=1){ fly=null; controls.enabled=true; } bar.style.width='0%'; return; }
  if(playing && !roam){ hold+=dt; if(!reduced){ _v.copy(camera.position).sub(controls.target).applyAxisAngle(Y,dt*0.035); camera.position.copy(controls.target).add(_v); }
    bar.style.width=Math.min(hold/HOLD,1)*100+'%'; if(hold>=HOLD) goTo(cur+1); }
  else bar.style.width='0%';
}
function updateTags(){
  const w=innerWidth, h=innerHeight;
  tagEls.forEach(t=>{ _v.copy(t.p).project(camera); const d=camera.position.distanceTo(t.p);
    if(_v.z>1||_v.z<-1||Math.abs(_v.x)>1.1||Math.abs(_v.y)>1.1||d>4200){ t.el.style.opacity='0'; t.el.style.pointerEvents='none'; return; }
    t.el.style.opacity='1'; t.el.style.pointerEvents='auto';
    t.el.style.transform=`translate(${((_v.x*.5+.5)*w).toFixed(1)}px,${((-_v.y*.5+.5)*h).toFixed(1)}px) translate(-50%,calc(-100% - 14px))`; });
}
let first=true;
renderer.setAnimationLoop(()=>{
  const dt=Math.min(clock.getDelta(),0.05), t=clock.elapsedTime;
  if(nightK!==nightTarget){ const sp=reduced?10:0.9; nightK = nightTarget>nightK ? Math.min(nightTarget,nightK+dt*sp) : Math.max(nightTarget,nightK-dt*sp); }
  if(nightK!==appliedK){ applyNight(nightK); appliedK=nightK; }
  if(nightK>0.3){ const on=Math.sin(t*3.2)>0.2; warnLights.forEach(w=>w.visible=on); }
  updateCars(dt); updateTrains(t); updatePlane(t); updateSteam(t);
  seaN.offset.set(t*0.0008,t*0.0005); riverN.offset.set(-t*0.02,0);
  updateTour(dt); controls.update();
  skyGroup.position.copy(camera.position);
  const tg=controls.target; sun.target.position.set(Math.round(tg.x/20)*20,0,Math.round(tg.z/20)*20);
  sun.position.copy(sun.target.position).addScaledVector(skyMat.uniforms.sunDir.value,1600);
  updateTags();
  composer.render();
  if(first){ first=false; requestAnimationFrame(()=>$('loader').classList.add('done')); }
});
addEventListener('resize',()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); composer.setSize(innerWidth,innerHeight); bloom.resolution.set(innerWidth,innerHeight); });
