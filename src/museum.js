import * as THREE from 'three';
import { buildMuseumRoom } from './museum-room.js';
// Camera rig excerpt from ThreeUI Kage (MIT), preserved below. Room and waypoints are original.
export function mountMuseum(host){
 const journey=document.getElementById('museum-journey');
 let renderer;try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});}catch{return;}
 host.appendChild(renderer.domElement);renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.outputEncoding=THREE.sRGBEncoding;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#171c1c');scene.fog=new THREE.Fog('#171c1c',25,65);
 const camera=new THREE.PerspectiveCamera(48,1,.1,100);
 const clamp=THREE.MathUtils.clamp,lerp=THREE.MathUtils.lerp;
 const smooth=(a,b,x)=>{x=clamp((x-a)/(b-a),0,1);return x*x*(3-2*x)};
 const vpW=()=>host.clientWidth,vpH=()=>host.clientHeight;
 const CAM=[{p:[9,4.5,18],t:[0,3,-8],fov:48},{p:[5,3.4,10],t:[0,3.2,-10],fov:46},{p:[0,3,3],t:[0,3.5,-13],fov:48}];
const RIG = { prog: 0, smooth: 0, mx: 0, my: 0, tmx: 0, tmy: 0, intro: 0, focus: -1, focusAmt: 0 };
let curveP, curveT, tmpCam;

function buildRig() {
  curveP = new THREE.CatmullRomCurve3(CAM.map(c => new THREE.Vector3(c.p[0], c.p[1], c.p[2])), false, 'catmullrom', .42);
  curveT = new THREE.CatmullRomCurve3(CAM.map(c => new THREE.Vector3(c.t[0], c.t[1], c.t[2])), false, 'catmullrom', .42);
  tmpCam = new THREE.PerspectiveCamera(CAM[0].fov, vpW() / vpH(), .35, 220);
  camera.layers.enable(1); camera.layers.enable(2);
}
const _p = new THREE.Vector3(), _t = new THREE.Vector3(), _d = new THREE.Vector3();
/* Every waypoint is composed for a wide frame. On a tall one the same
   numbers crop the gate in half, so the rig steps back along its own view
   axis and opens up a little instead of letting the sides fall away. */
function aspectFix() { return clamp((1.62 - vpW() / vpH()) / 1.05, 0, 1); }
function fitAspect(p, t, fov) {
  const nf = aspectFix();
  if (nf <= 0) return fov;
  _d.subVectors(p, t).normalize();
  p.addScaledVector(_d, nf * 8.2);
  p.y += nf * 1.1;
  return fov * (1 + nf * .40);
}
function applyCamera() {
  const N = CAM.length - 1;
  const u = clamp(RIG.smooth / N, 0, 1);
  curveP.getPoint(u, _p); curveT.getPoint(u, _t);
  const i = clamp(Math.floor(RIG.smooth), 0, N - 1), f = clamp(RIG.smooth - i, 0, 1);
  let fov = lerp(CAM[i].fov, CAM[i + 1].fov, f);

  fov = fitAspect(_p, _t, fov);

  /* the opening dolly: a long lens easing in from further back */
  const io = 1 - RIG.intro;
  _p.z += io * 5.6; _p.y += io * 0.65; fov += io * 8;

  /* parallax — a hand-held drift, never enough to break the frame */
  const par = 1 - smooth(0, 1.6, RIG.smooth) * .55;
  _p.x += RIG.mx * 0.62 * par; _p.y += RIG.my * 0.34 * par;
  _t.x -= RIG.mx * 0.20 * par; _t.y -= RIG.my * 0.12 * par;

  camera.position.copy(_p);
  camera.lookAt(_t);
  if (Math.abs(camera.fov - fov) > 1e-4) { camera.fov = fov; camera.updateProjectionMatrix(); }
}


 const {group:room,leftPainting}=buildMuseumRoom({onLoad:()=>render(),anisotropy:renderer.capabilities.getMaxAnisotropy()});scene.add(room);const loader=new THREE.TextureLoader();
 buildRig();RIG.intro=1;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');let paused=reduce.matches,visible=true,raf=0,last=0;
 const toggle=document.getElementById('museum-motion');
 function label(){toggle.textContent=paused?'开启镜头 ↗':'暂停镜头 Ⅱ';toggle.setAttribute('aria-pressed',String(!paused));}label();
 let entering=false;
 function render(){if(!entering&&(!vpW()||!vpH()))return;if(!entering)applyCamera();renderer.render(scene,camera);}
 function tick(time){raf=0;if(entering||!visible||document.hidden)return;const dt=Math.min((time-last)/1000||.016,.05);last=time;if(!paused){const rect=journey.getBoundingClientRect();RIG.prog=clamp(-rect.top/Math.max(1,journey.offsetHeight-host.offsetHeight),0,1)*2;const a=1-Math.exp(-dt*5);RIG.smooth=lerp(RIG.smooth,RIG.prog,a);RIG.mx=lerp(RIG.mx,RIG.tmx,a);RIG.my=lerp(RIG.my,RIG.tmy,a);}render();if(!paused)raf=requestAnimationFrame(tick);}
 function start(){if(!entering&&!raf&&visible&&!document.hidden)raf=requestAnimationFrame(tick);}
 toggle.addEventListener('click',()=>{paused=!paused;label();start();});
 reduce.addEventListener('change',()=>{paused=reduce.matches;label();start();});
 host.parentElement.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const r=host.getBoundingClientRect();RIG.tmx=(e.clientX-r.left)/r.width-.5;RIG.tmy=.5-(e.clientY-r.top)/r.height;});
 host.parentElement.addEventListener('pointerleave',()=>{RIG.tmx=RIG.tmy=0});
 new ResizeObserver(()=>{const w=vpW(),h=vpH();if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();render();}).observe(host);
 new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(visible)start();else{cancelAnimationFrame(raf);raf=0;}}).observe(host);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else start();});
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();host.classList.add('unavailable');cancelAnimationFrame(raf);});
 // The same renderer stays mounted throughout the visit; no page handoff.
 const roomSlot=document.getElementById('lesson-scene');
 let currentArt='bedroom',flight=0,viewerWidth=0,viewerHeight=0;
 function sizeViewer(){
  if(!entering)return;
  const w=roomSlot.clientWidth,h=roomSlot.clientHeight;if(!w||!h)return;
  viewerWidth=w;viewerHeight=h;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();
 }
 function destination(art){
  const x=art==='both'?0:art==='cafe'?4.7:-4.7;
  const distance=Math.max(8.8,(art==='both'?15:5.1)/(2*Math.tan(THREE.MathUtils.degToRad(44/2))*camera.aspect)*1.16);
  return new THREE.Vector3(x,2.35,-15.54+distance);
 }
 function positionPlaque(){
  const x=currentArt==='both'?0:currentArt==='cafe'?4.7:-4.7;
  const point=new THREE.Vector3(x,1.7,-15.4).project(camera);
  const view=document.getElementById('lesson-view');
  view.style.setProperty('--plaque-x',((point.x+1)*.5*viewerWidth)+'px');
  view.style.setProperty('--plaque-y',((1-point.y)*.5*viewerHeight)+'px');
 }
 const paintingTextures=new Map([['bedroom',leftPainting.texture]]);
 function displayArtwork(id){
  const entry=window.ArtCatalog.find(a=>a.id===(id==='both'?'bedroom':id));
  if(!entry||id==='cafe')return;
  let texture=paintingTextures.get(entry.id);
  if(!texture){texture=loader.load(entry.src,()=>render());texture.encoding=THREE.sRGBEncoding;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());paintingTextures.set(entry.id,texture);}
  leftPainting.mesh.material.map=texture;
  const width=Math.min(5.1,4*entry.ratio),height=width/entry.ratio;
  leftPainting.mesh.scale.set(width/5.1,height/4,1);leftPainting.frame.scale.set((width+.3)/5.4,(height+.3)/4.3,1);
 }
 function focusArt(art,animate=true){displayArtwork(art);
  currentArt=art;cancelAnimationFrame(flight);sizeViewer();
  const from=camera.position.clone(),q=camera.quaternion.clone(),fov=camera.fov;
  const to=destination(art),end=camera.clone();end.position.copy(to);end.lookAt(to.x,art==='both'&&camera.aspect<.8?-2.5:to.y,-15.54);
  const begun=performance.now(),duration=reduce.matches||!animate?0:950;
  function draw(time){const t=duration?clamp((time-begun)/duration,0,1):1,e=t*t*(3-2*t);
   camera.position.lerpVectors(from,to,e);camera.quaternion.slerpQuaternions(q,end.quaternion,e);camera.fov=lerp(fov,44,e);camera.updateProjectionMatrix();renderer.render(scene,camera);positionPlaque();
   if(t<1)flight=requestAnimationFrame(draw);else flight=0;
  }draw(begun);
 }
 window.museumViewer={
  getPose(){return {position:camera.position.toArray(),quaternion:camera.quaternion.toArray(),fov:camera.fov};},
  open(art){const wasOpen=entering;entering=true;cancelAnimationFrame(raf);raf=0;roomSlot.appendChild(renderer.domElement);sizeViewer();if(!wasOpen||art!==currentArt)focusArt(art);},
  focus(art){if(entering&&art!==currentArt)focusArt(art);},
  close(){cancelAnimationFrame(flight);flight=0;entering=false;host.appendChild(renderer.domElement);const w=vpW(),h=vpH();if(w&&h){renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();render();}start();}
 };
 new ResizeObserver(()=>{if(entering&&(roomSlot.clientWidth!==viewerWidth||roomSlot.clientHeight!==viewerHeight))focusArt(currentArt,false);}).observe(roomSlot);
 reduce.addEventListener('change',()=>{if(entering)focusArt(currentArt,false);});
 renderer.domElement.addEventListener('webglcontextlost',()=>roomSlot.classList.add('scene-unavailable'));
 start();
}
