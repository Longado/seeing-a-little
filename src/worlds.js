import { releaseWorldGroup } from './world-session.mjs';
import { WORLD_CATALOG, WORLD_IDS, SNOW_WORLDS } from './world-catalog.mjs';
import { buildExtendedWorld } from './worlds/extended.js';
import { buildPortraitRoom } from './worlds/portrait.js';
import { refineBedroom } from './worlds/bedroom-detail.js';
import * as THREE from 'three';
import { stepWalk, worldEntryPose, isWheatClear } from './world-navigation.mjs';
import { buildArtistWorlds } from './artist-worlds.js';
import { buildCafe } from './cafe.js';
import { addSceneDetails } from './scene-details.js';
import { buildRoaming } from './roaming.js';
import { WORLD_KEY, freshWorld, restoreWorld, advanceWorld } from './world-state.mjs';

// Original, hand-built scenes. Art textures retain their source images unchanged.
export function mountWorlds(){
 const $=id=>document.getElementById(id), root=$('world-view'), host=$('world-canvas');
 let state;try{state=restoreWorld(localStorage.getItem(WORLD_KEY));}catch{state=freshWorld();}
 const media=matchMedia('(prefers-reduced-motion: reduce)');let gentle=media.matches;
 let renderer,scene,camera,groups={},active=false,raf=0,last=0,clock=0,transitionTimer=0;
 let snowDestination='starry',snowGateX=-4.8;
 let portraitRoom,windowOpen=false;const routeHistory=[];let entered=false,returning=false;
 const interactions=new Map(),worldCameras=new Map();let inputOwner=null;
 let wheatWalked=0,wheatCheckpoint=false,wheatPortalsArmed=false,screamExperienced=false,screamQuiet=0,screamStill=0,lastScreamYaw=0,lastScreamPitch=0,lastScreamX=0,lastScreamZ=14;
 let actionUntil=0,actionComplete=null,selectedHotspot=null;
 let pickupScene=null,screamLegacyChecked=false;
 let portraitBounds={top:.1,bottom:.65},portraitMeasureFrame=0;
 let detail='',cafeFocus=false,selectedPipe=false,talkingUntil=0,storm=0,stormTarget=0;
 let snow,portal,portrait,tablePipe,portraitPipe,smoke,post,renderTarget,postScene,postCamera;
 let ready=false,broken=false,sound=false,audio,ambientGain,windGain,environmentFilter,nextAmbienceAt=0;
 const discoveryHintsSeen=new Set();
 const ambienceProfiles={
  gallery:[0,0,500],cafe:[.022,0,300],bedroom:[.035,.003,400],portrait:[.012,.002,350],
  rain:[0,.032,3800],pond:[0,.012,620],bridge:[0,.013,700],wave:[0,.028,850],
  starry:[0,.004,280],sunday:[0,.007,600],wheat:[0,.012,550],snow:[0,.014,800],scream:[0,.025,500]
 };
 let pointer={x:0,y:0},drag=null,yaw=0,pitch=0,portalEntering=false;
 let entrancePose=null,entranceAt=0,routeTransition=false;const keys=new Set(),walk=new THREE.Vector3();
 function moveWalk(forward,side,step){const previous=walk.clone(),next=stepWalk(state.scene,walk,(Math.sin(yaw)*forward+Math.cos(yaw)*side)*step,(-Math.cos(yaw)*forward+Math.sin(yaw)*side)*step);walk.x=next.x;walk.z=next.z;if(state.scene==='wheat'&&isWheatClear(previous.x,previous.z)&&isWheatClear(walk.x,walk.z)){wheatWalked+=walk.distanceTo(previous);if(Math.abs(walk.x)<1.7&&Math.abs(walk.z+18)<1.5)wheatCheckpoint=true;}}let windowTarget,windowCamera,windowGlass;
 const roaming=()=>['gallery','wheat','cafe','scream'].includes(state.scene);
 function travel(name){if(state.scene==='wheat'&&name==='scream'&&wheatCheckpoint&&wheatWalked>=12&&walk.z<-23&&Math.abs(walk.x)<1.7)window.artTrophies?.award('wheat');changeScene(name,false,'portal');}
 let blanketMesh,originalQuilt,alternateQuilt,quiltCool=false;
 const hotspots=[],textures=[],animated=[],raycaster=new THREE.Raycaster();
 const camGoal=new THREE.Vector3(),lookGoal=new THREE.Vector3(),look=new THREE.Vector3();
 const cameraPositions={snow:[6,3.2,13],bedroom:[0,4,9],scream:[0,2.7,15]};
 const escaped=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function save(){try{localStorage.setItem(WORLD_KEY,JSON.stringify(state));}catch{message('暂时无法保存进度，当前体验仍可继续。');}}
 function event(name){const previous=state.pipe;state=advanceWorld(state,name);save();if(['collect','place'].includes(name)&&state.pipe!==previous)playCue(name);if(name==='speak'&&state.spoken)window.artTrophies?.award('portrait');if(name==='calm'&&state.calmed)window.artTrophies?.award('scream');}
 let messageTimer;
 function message(s,duration=3200){$('world-status').textContent=s;$('world-status').classList.add('is-visible');clearTimeout(messageTimer);messageTimer=setTimeout(()=>$('world-status').classList.remove('is-visible'),duration);}
 function showDiscoveryHint(name){
  if(discoveryHintsSeen.has(name))return;
  const touch=matchMedia('(pointer: coarse)').matches;
  const hints=touch?{
   starry:'按住星光，用手指沿涡流描画',pond:'轻触水面，再松开手指',wave:'按住船桨，再松开手指',
   rain:'用手指拖开雨伞',bridge:'用手指左右拖动桥身',sunday:'用手指上下拖动草地'
  }:{
   starry:'按住鼠标，沿星光涡流描画',pond:'点击水面，再松开鼠标',wave:'按住船桨，再松开鼠标',
   rain:'按住鼠标拖开雨伞',bridge:'按住鼠标左右拖动桥身',sunday:'按住鼠标上下拖动草地'
  };
  if(!hints[name])return;discoveryHintsSeen.add(name);message(hints[name],3000);
 }
 function panel(kicker,title,body,actions=[]){
  $('world-panel-copy').innerHTML=(kicker?'<p class="world-kicker">'+kicker+'</p>':'')+(title?'<h2>'+title+'</h2>':'')+(body?'<p>'+body+'</p>':'');
  $('world-panel-actions').replaceChildren();
  actions.forEach(([label,fn,secondary])=>{const b=document.createElement('button');b.className='world-action'+(secondary?' secondary-action':'');b.textContent=label;b.onclick=()=>{if(!blocked())fn();};$('world-panel-actions').appendChild(b);});
  schedulePortraitMeasure();
 }
 function schedulePortraitMeasure(){
  if(portraitMeasureFrame)return;
  portraitMeasureFrame=requestAnimationFrame(()=>{
   portraitMeasureFrame=0;
   if(state.scene!=='portrait'||!camera)return;
   const canvasRect=host.getBoundingClientRect();if(!canvasRect.height)return;
   let top=12,bottom=canvasRect.height*.65;
   for(const element of [root.querySelector('.world-top'),$('world-room-back')]){
    if(!element||element.hidden)continue;
    const rect=element.getBoundingClientRect();
    if(rect.height)top=Math.max(top,rect.bottom-canvasRect.top+12);
   }
   const interaction=$('world-panel'),rect=interaction.getBoundingClientRect();
   if(rect.height&&( $('world-panel-copy').childElementCount||$('world-panel-actions').childElementCount))bottom=rect.top-canvasRect.top-12;
   portraitBounds={top:THREE.MathUtils.clamp(top/canvasRect.height,0,.99),bottom:THREE.MathUtils.clamp(bottom/canvasRect.height,0,1)};
   setCameraGoal();
  });
 }
 function seeded(seed){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
 const rand=seeded(1888);
 function brushTexture(base,accents,vertical=false){
  const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.fillStyle=base;ctx.fillRect(0,0,256,256);
  for(let i=0;i<1400;i++){const x=rand()*256,y=rand()*256;ctx.globalAlpha=.06+rand()*.23;ctx.strokeStyle=accents[i%accents.length];ctx.lineWidth=.4+rand()*3;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(vertical?rand()*3:7+rand()*24),y+(vertical?8+rand()*30:rand()*5));ctx.stroke();}
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.wrapS=t.wrapT=THREE.RepeatWrapping;textures.push(t);return t;
 }
 function mat(color,accents,vertical){const texture=brushTexture(color,accents,vertical);return new THREE.MeshStandardMaterial({map:texture,bumpMap:texture,bumpScale:.025,roughness:.94});}
 function box(group,w,h,d,x,y,z,material,edge=false){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
  if(edge){const lines=new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry),new THREE.LineBasicMaterial({color:0x273c34,transparent:true,opacity:.5}));mesh.add(lines);}return mesh;
 }
 function tube(group,points,r,material){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const m=new THREE.Mesh(new THREE.TubeGeometry(curve,48,r,6,false),material);group.add(m);return m;}
 function imageTexture(path){const t=new THREE.TextureLoader().load(path,()=>{},()=>{},()=>{message('有一张画作未载入，请返回展厅后重新进入。');});t.encoding=THREE.sRGBEncoding;t.anisotropy=4;textures.push(t);return t;}
 function pipeModel(){const g=new THREE.Group(),wood=new THREE.MeshBasicMaterial({color:'#713e24'});const rim=new THREE.MeshBasicMaterial({color:'#ac8044'});tube(g,[[0,0,0],[.22,-.025,0],[.47,-.1,0],[.72,-.05,0]],.037,wood);const bowl=new THREE.Mesh(new THREE.CylinderGeometry(.115,.075,.27,12),wood);bowl.position.set(.75,.06,0);g.add(bowl);const lip=new THREE.Mesh(new THREE.TorusGeometry(.104,.024,6,16),rim);lip.rotation.x=Math.PI/2;lip.position.set(.75,.2,0);g.add(lip);const hole=new THREE.Mesh(new THREE.CircleGeometry(.081,16),new THREE.MeshBasicMaterial({color:'#1a1716'}));hole.rotation.x=-Math.PI/2;hole.position.set(.75,.203,0);g.add(hole);return g;}
 function clearHotspotSelection(){if(selectedHotspot){selectedHotspot.classList.remove('is-selected');selectedHotspot.setAttribute('aria-expanded','false');selectedHotspot=null;}}
 function blocked(){return !active||routeTransition||portalEntering||!!actionComplete||!!document.querySelector('dialog[open]');}
 function cameraBlocked(){return blocked()||!!inputOwner||!!detail||!!root.querySelector('textarea, input:focus');}
 function interactionInput(event){
  if(event&&Number.isFinite(event.clientX)){const r=host.getBoundingClientRect();pointer.x=(event.clientX-r.left)/r.width*2-1;pointer.y=1-(event.clientY-r.top)/r.height*2;}
  if(camera)raycaster.setFromCamera(new THREE.Vector2(pointer.x,pointer.y),camera);
  return {raycaster,pointer,event,camera,clock};
 }
 function cancelInteraction(event){
  const owner=inputOwner;inputOwner=null;
  (owner?.handler||interactions.get(state.scene))?.cancel?.(interactionInput(event));
  if(owner&&host.hasPointerCapture(owner.pointerId))host.releasePointerCapture(owner.pointerId);
  keys.clear();drag=null;
 }
 function focusCafeTable(){
  if(state.scene!=='cafe'||blocked())return;
  cafeFocus=true;keys.clear();drag=null;clearHotspotSelection();
  $('world-room-back').hidden=false;$('world-room-back').textContent='↶ 回到房间';$('world-walk').hidden=true;
  camera.fov=camera.aspect<.8?62:52;camera.updateProjectionMatrix();setCameraGoal(true);
  message('回拉松手击球 · 方向键 / 空格',1800);
 }
 function leaveCafeTable(){
  if(!cafeFocus)return;
  cafeFocus=false;keys.clear();drag=null;interactions.get('cafe')?.leaveFocus?.();
  $('world-room-back').hidden=true;$('world-walk').hidden=false;camera.fov=48;camera.updateProjectionMatrix();setCameraGoal();
 }
 function activateHotspot(button,fn,touch=false){if(blocked()||detail||button.dataset.available==='false')return;if(touch&&button.dataset.singleTap!=='true'&&selectedHotspot!==button){clearHotspotSelection();selectedHotspot=button;button.classList.add('is-selected');button.setAttribute('aria-expanded','true');keys.clear();drag=null;return;}clearHotspotSelection();fn();}
 function addHotspot(id,label,position,fn,group){const invoke=()=>{if(id==='field-scream'&&(state.scene!=='wheat'||walk.z>=-23))return;fn();};const b=document.createElement('button');b.className='world-hotspot';b.dataset.singleTap=String(['pipe','portrait-room-pipe','portrait-room-face'].includes(id));const tooltip=document.createElement('span');tooltip.className='hotspot-label';tooltip.textContent=label;b.appendChild(tooltip);b.setAttribute('aria-label',label);b.setAttribute('aria-expanded','false');let touch=false;b.onpointerdown=e=>{touch=e.pointerType==='touch';};b.onclick=e=>{activateHotspot(b,invoke,touch&&e.detail!==0);touch=false;};$('world-hotspots').appendChild(b);b.worldPosition=new THREE.Vector3(...position);hotspots.push({id,button:b,position:b.worldPosition,fn:invoke,group});const hit=new THREE.Mesh(new THREE.SphereGeometry(id==='bed'?.8:.42,8,6),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));hit.position.set(...position);hit.userData.interaction=id;groups[group].add(hit);return b;}
 function buildSnow(){
  const g=groups.snow=new THREE.Group();scene.add(g);
  const ice=mat('#203d50',['#41667c','#71868c','#162635']);const floor=box(g,100,.2,100,0,-.15,0,ice);floor.material.roughness=.32;floor.material.metalness=.45;
  const gold=new THREE.MeshStandardMaterial({color:'#bcaa79',metalness:.65,roughness:.35,emissive:'#80713b',emissiveIntensity:.25});
  // Three artwork doors share a quiet snowy threshold.
  const gates=SNOW_WORLDS.map(w=>[w.snowX,w.id,`${w.artist} · ${w.short}`,w.image,w.tint]);
  for(const [x,dest,label,src,tint] of gates){
   const frame=gold.clone();frame.color.set(tint);
   for(const side of [-1.75,1.75])box(g,.12,6.2,.3,x+side,3.1,-3,frame);
   box(g,3.6,.12,.3,x,6.2,-3,frame);box(g,4,.12,2,x,.1,-2.6,frame);
   const painting=new THREE.Mesh(new THREE.PlaneGeometry(3.38,5.98),new THREE.MeshBasicMaterial({map:imageTexture(src),side:THREE.DoubleSide}));painting.position.set(x,3.1,-3);painting.userData.snowDestination=dest;painting.userData.snowGateX=x;g.add(painting);
   const light=new THREE.PointLight(tint,1.2,10,2);light.position.set(x,2,-1);g.add(light);
   const button=addHotspot('snow-'+dest,label,[x,1,-2.8],()=>enterSnowGate(dest,x),'snow');button.classList.add('snow-door-label');
  }
  g.add(new THREE.HemisphereLight('#b5e5f6','#102037',1.2));
  for(let i=0;i<17;i++){const z=-9-rand()*15,x=(i%2?-1:1)*(11+rand()*13);const m=box(g,.13,4+rand()*7,.13,x,2,z,new THREE.MeshStandardMaterial({color:'#314a55'}));m.rotation.z=(rand()-.5)*.15;}
  const n=650,pos=new Float32Array(n*3),sizes=new Float32Array(n);for(let i=0;i<n;i++){pos[i*3]=(rand()-.5)*34;pos[i*3+1]=rand()*15;pos[i*3+2]=(rand()-.5)*30;sizes[i]=.4+rand();}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('flakeSize',new THREE.BufferAttribute(sizes,1));
  const snowMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:{value:0},motion:{value:1},pointer:{value:new THREE.Vector2()}},vertexShader:`attribute float flakeSize;uniform float time;uniform float motion;uniform vec2 pointer;varying float alpha;void main(){vec3 p=position;p.y=mod(p.y-time*.55*motion+30.,15.);p.x+=sin(time*.2+p.z)*.5*motion;p.x+=pointer.x*exp(-abs(p.z-5.)*.3)*motion;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(flakeSize*75./-mv.z,1.5,10.);alpha=clamp(1.-abs(p.z)*.02,.3,.9);}`,fragmentShader:`varying float alpha;void main(){vec2 p=gl_PointCoord-.5;float r=length(p);float a=(1.-smoothstep(.1,.5,r))*.7;float cross=exp(-abs(p.x)*55.)+exp(-abs(p.y)*55.);gl_FragColor=vec4(.82,.93,1.,min(1.,a+cross*.12)*alpha);}`});
  snow=new THREE.Points(geo,snowMat);g.add(snow);
 }
 function buildBedroom(){
  const g=groups.bedroom=new THREE.Group();scene.add(g);
  const blue=mat('#688f9f',['#254e69','#97b9b7','#b9bb9b'],true),floor=mat('#af794f',['#d39a64','#83543a','#dec391']);const wood=mat('#c89d3c',['#efd77f','#8e6425','#6e622b'],true),red=mat('#b94730',['#e07140','#832e30','#d25a41']),linen=mat('#dfddb0',['#fff1cc','#a3b49c']);const green=mat('#427466',['#89a080','#183f46'],true);
  box(g,10,.2,12,0,-.15,1,floor);box(g,10,6,.16,0,3,-4.1,blue,true);box(g,.18,6,10,-5,3,.9,blue,true);box(g,.18,6,10,5,3,.9,blue,true);
  const seams=new THREE.LineBasicMaterial({color:'#6c5039',transparent:true,opacity:.65});for(let x=-5;x<5;x+=.6){const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,.005,-4),new THREE.Vector3(x+.45,.005,7)]);g.add(new THREE.Line(geo,seams));}
  // Bed: thick, skewed ochre frame, red quilt, pale pillows.
  box(g,2.8,.3,5.1,2.85,.65,-.55,wood,true);box(g,2.65,.32,4.8,2.85,.94,-.55,linen,true);
  const blanket=box(g,2.67,.15,3.75,2.85,1.17,.03,red,true);blanket.rotation.z=.015;blanketMesh=blanket;originalQuilt=red;alternateQuilt=mat('#486b8c',['#7695b0','#263e65','#a0b2b6']);
  box(g,2.84,1.1,.2,2.85,1.38,-3.15,wood,true);box(g,2.84,.6,.18,2.85,.93,2.0,wood,true);
  for(const x of [1.45,4.25])for(const z of [-3.13,2.02]){box(g,.22,1.8,.22,x,.9,z,wood,true);const finial=new THREE.Mesh(new THREE.SphereGeometry(.14,10,8),wood);finial.position.set(x,1.82,z);g.add(finial);}
  for(const x of [2.2,3.45]){const p=box(g,1.08,.22,.74,x,1.25,-2.25,linen,true);p.rotation.y=.07;}
  // Shuttered window and a small wash table.
  box(g,2.25,2.7,.14,-1,3.75,-3.95,wood,true);box(g,2.05,2.5,.16,-1,3.75,-3.83,green,true);
  const glass=windowGlass=new THREE.MeshBasicMaterial({color:'#cbd3a2'});const windowView=new THREE.Mesh(new THREE.PlaneGeometry(1.95,2.35),glass);windowView.position.set(-1,3.75,-3.72);g.add(windowView);
  box(g,.11,2.6,.08,-1,3.75,-3.68,green,true);box(g,2.1,.12,.08,-1,3.75,-3.68,green,true);
  const shutter=box(g,.62,2.65,.09,-2.4,3.75,-3.55,green,true);shutter.rotation.y=-.45;for(let y=-1.15;y<1.25;y+=.2)box(shutter,.6,.035,.05,0,y,.075,wood);
  const table=box(g,2.25,.16,1.3,-3.35,1.42,-2.8,wood,true);for(const x of [-4.25,-2.45])for(const z of [-3.25,-2.35])box(g,.14,1.4,.14,x,.7,z,wood,true);
  const basin=new THREE.Mesh(new THREE.TorusGeometry(.36,.07,8,32),linen);basin.rotation.x=Math.PI/2;basin.position.set(-3.8,1.57,-2.9);g.add(basin);
  const jug=new THREE.Mesh(new THREE.CylinderGeometry(.12,.21,.45,12),linen);jug.position.set(-4.1,1.74,-3.08);g.add(jug);
  const bottle=new THREE.Mesh(new THREE.CylinderGeometry(.07,.09,.45,10),new THREE.MeshStandardMaterial({color:'#3f8869',roughness:.35}));bottle.position.set(-2.6,1.72,-3.18);g.add(bottle);
  function chair(x,z,rotation){const c=new THREE.Group();c.position.set(x,0,z);c.rotation.y=rotation;g.add(c);box(c,.9,.16,.9,0,.85,0,wood,true);for(const xx of [-.37,.37])for(const zz of [-.37,.37])box(c,.1,zz<0?1.9:.9,.1,xx,zz<0?.95:.45,zz,wood,true);box(c,.85,.16,.1,0,1.8,-.37,wood,true);box(c,.85,.13,.1,0,1.4,-.37,wood,true);for(let i=0;i<7;i++)box(c,.035,.02,.73,-.35+i*.115,.95,0,linen);return c;}
  chair(-3,1.5,-.3);chair(-.2,-2.65,.14);
  // Hanging coat and towel add recognizable room details.
  const coat=box(g,.66,1.35,.1,-4.82,2.8,-.7,green);coat.rotation.y=Math.PI/2;box(g,.08,1.2,.5,-4.8,2.2,-1.5,linen);
  const portraitTex=imageTexture('./assets/worlds/portrait.jpg');
  const portraitMat=new THREE.ShaderMaterial({uniforms:{map:{value:portraitTex},time:{value:0},alive:{value:0},speaking:{value:0}},vertexShader:'varying vec2 vUv;uniform float time;uniform float alive;void main(){vUv=uv;vec3 p=position;p.z+=sin(time*.8)*.007*alive;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',fragmentShader:`varying vec2 vUv;uniform sampler2D map;uniform float time;uniform float alive;uniform float speaking;
   void main(){vec2 uv=vUv;vec2 mouth=vec2(.43,.443);float d=length((uv-mouth)*vec2(1.,1.7));float voice=(.5+.5*sin(time*12.))*speaking;uv.y+=exp(-d*d*500.)*(uv.y-mouth.y)*voice*1.8;uv.x+=sin(time*.7)*.0015*alive;vec4 col=texture2D(map,uv);float opening=1.-smoothstep(.75,1.,length((vUv-mouth)/vec2(.041,.003+voice*.009)));col.rgb=mix(col.rgb,vec3(.12,.07,.045),opening*voice*.55);gl_FragColor=col;
#include <encodings_fragment>
}`});
  portrait=new THREE.Mesh(new THREE.PlaneGeometry(1.28,1.62,20,20),portraitMat);portrait.position.set(2.75,4.28,-3.94);g.add(portrait);box(g,1.46,1.8,.1,2.75,4.28,-4.02,wood,true);
  const mini=new THREE.Mesh(new THREE.PlaneGeometry(1.35,.95),new THREE.MeshBasicMaterial({map:imageTexture('./assets/bedroom.jpg')}));mini.position.set(.75,4.9,-3.95);mini.rotation.z=.025;g.add(mini);
  tablePipe=pipeModel();tablePipe.position.set(-3.0,1.56,-2.48);tablePipe.rotation.y=.3;g.add(tablePipe);
  portraitPipe=pipeModel();portraitPipe.scale.setScalar(.38);portraitPipe.position.set(2.66,4.19,-3.81);portraitPipe.rotation.z=-.1;g.add(portraitPipe);
  smoke=new THREE.Group();smoke.position.set(2.95,4.28,-3.78);g.add(smoke);for(let i=0;i<7;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(.04+i*.009,8,6),new THREE.MeshBasicMaterial({color:'#e7ddbe',transparent:true,opacity:.12,depthWrite:false}));m.position.y=i*.1;smoke.add(m);}
  g.add(new THREE.HemisphereLight('#d0e2d6','#6d5732',1.65));const sun=new THREE.DirectionalLight('#ffe4a3',2.3);sun.position.set(-3,6,3);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-7,right:7,top:7,bottom:-7});sun.shadow.bias=-.001;g.add(sun);const fill=new THREE.PointLight('#ffbb73',.6,15);fill.position.set(0,3,3);g.add(fill);
  addHotspot('window','推开窗',[-1,3.75,-3.7],()=>interact('window'),'bedroom');
  addHotspot('bed','床上的颜色',[2.8,1.5,.8],()=>interact('bed'),'bedroom');
  addHotspot('pipe','桌上的小物',[-2.55,1.85,-2.4],()=>interact('pipe'),'bedroom');
  addHotspot('portrait','看看自画像',[2.75,3.21,-3.7],()=>interact('portrait'),'bedroom');
  animated.push({type:'shutter',mesh:shutter,open:windowOpen});
  blanket.visible=false;blanketMesh=refineBedroom({group:g,box,mat});originalQuilt=blanketMesh.material;
 }
 function buildScream(){
  const g=groups.scream=new THREE.Group();scene.add(g);
  const shader=new THREE.ShaderMaterial({side:THREE.BackSide,uniforms:{time:{value:0},strength:{value:0}},vertexShader:`varying vec3 vP;uniform float time;uniform float strength;void main(){vec3 p=position;float a=atan(p.y,p.x);p.x+=sin(p.z*.35+time*.5)*strength*.5;p.y+=cos(p.z*.3+time*.4)*strength*.4;vP=p;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,fragmentShader:`varying vec3 vP;uniform float time;uniform float strength;void main(){float a=atan(vP.z,vP.x);float band=a*5.+sin(vP.y*.13+a*2.-time*.1*strength)*1.3;float n=sin(band)*.5+.5;float fine=sin(band*7.+sin(vP.z*.9))* .5+.5;vec3 warm=mix(vec3(.24,.15,.17),vec3(.78,.34,.16),n);warm=mix(warm,vec3(.9,.64,.32),pow(n,6.)*.65);vec3 cool=mix(vec3(.08,.16,.22),vec3(.26,.36,.35),n);vec3 color=mix(cool,warm,smoothstep(-.2,.7,-sin(a)));color+=fine*.025;gl_FragColor=vec4(color,1.);}`});
  const tunnel=new THREE.Mesh(new THREE.CylinderGeometry(14,14,80,96,72,false),shader);tunnel.rotation.x=Math.PI/2;tunnel.position.set(0,1,-15);g.add(tunnel);animated.push({type:'tunnel',mesh:tunnel});
  const wood=mat('#865d42',['#c2915e','#402f29','#ad7450'],true);box(g,4,.25,35,0,-.3,1,wood);
  const rail=new THREE.MeshStandardMaterial({color:'#624538',roughness:1});for(let z=-14;z<17;z+=1.5){for(const x of [-2,2])box(g,.11,1.3,.12,x,.5,z,rail);box(g,4,.015,.025,0,-.16,z,rail);}for(const x of [-2,2])box(g,.13,.14,35,x,1.17,1,wood);
  const scream=new THREE.Mesh(new THREE.PlaneGeometry(3.1,3.85),new THREE.MeshBasicMaterial({map:imageTexture('./assets/worlds/scream.jpg')}));scream.position.set(0,3,-7.9);g.add(scream);box(g,3.38,4.13,.18,0,3,-8.04,rail,true);
  // Broad, uneven ribbons follow the horizon around the visitor, rather than radiating like wires.
  for(let i=0;i<22;i++){
   const count=160,positions=[],indices=[],radius=10.6+i*.12,lower=i>=15;
   for(let j=0;j<=count;j++){
    const t=j/count*Math.PI*2;
    const ripple=Math.sin(t*2+i*.36)*.55+Math.sin(t*5+i)*.13;
    const y=(lower?-.5-(i-15)*.48:5.7+i*.39)+ripple;
    const width=(.08+(i%4)*.045)*(1+.25*Math.sin(t*17+i));
    const x=Math.sin(t)*radius,z=-2+Math.cos(t)*radius;
    positions.push(x,y-width,z,x,y+width,z);
    if(j<count){const n=j*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);}
   }
   const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(indices);
   const colors=lower?['#41676d','#61756c','#2e515c']:['#b65c35','#d28b4e','#8e4734','#d5a764','#667d78'];
   const mesh=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:colors[i%colors.length],side:THREE.DoubleSide,transparent:true,opacity:.6,depthWrite:false}));g.add(mesh);animated.push({type:'stroke',mesh,phase:i*.4});
  }
  g.add(new THREE.HemisphereLight('#e6a673','#2b3240',1.6));
 }
 function ensureWorld(id){
  if(groups[id])return;
  const animationStart=animated.length;
  const context={scene,groups,box,mat,imageTexture,addHotspot,travel,animated,message,playCue,focusTable:focusCafeTable,isTableFocused:()=>cafeFocus,registerInteraction:(id,handler)=>interactions.set(id,handler)};
  if(id==='bedroom'){buildBedroom();addSceneDetails({groups:{bedroom:groups.bedroom},box,mat,tube});addHotspot('room-gallery','回到画廊',[-4.8,2,3],()=>travel('gallery'),'bedroom');}
  else if(id==='snow')buildSnow();
  else if(id==='scream'){buildScream();addSceneDetails({groups:{scream:groups.scream},box,mat,tube});addHotspot('scream-wheat','走向麦田',[0,1.5,15],()=>travel('wheat'),'scream');}
  else if(id==='gallery'||id==='wheat'){buildRoaming({...context,only:id});if(id==='wheat')addSceneDetails({groups:{wheat:groups.wheat},box,mat,tube});}
  else if(id==='cafe')buildCafe(context);
  else if(['bridge','rain','sunday'].includes(id)){const world=buildExtendedWorld({...context,only:id});if(world?.camera)worldCameras.set(id,world.camera);}
  else if(id==='portrait'){ensureWorld('bedroom');portraitRoom=buildPortraitRoom({...context,portrait,pipeModel,collect:collectPipe,respond:respondInPortrait});}
  else buildArtistWorlds({...context,only:id});
  for(let i=animationStart;i<animated.length;i++)animated[i].owner??=id;groups[id].visible=false;
 }
 function trimWorlds(current,previous){

  const keep=new Set([current,previous]);
  if(keep.has('portrait'))keep.add('bedroom');
  if(keep.has('bedroom')&&windowOpen)keep.add('wheat');
  // Keep a recent world for fast return; bedroom/portrait and its live window are dependencies.
  for(const id of Object.keys(groups)){if(keep.has(id))continue;
   const group=groups[id],released=releaseWorldGroup(group,Object.entries(groups).filter(([key])=>key!==id).map(([,g])=>g),[windowTarget?.texture]);
   for(let i=hotspots.length-1;i>=0;i--)if(hotspots[i].group===id){hotspots[i].button.remove();hotspots.splice(i,1);}
   for(let i=animated.length-1;i>=0;i--)if(animated[i].owner===id)animated.splice(i,1);
   for(let i=textures.length-1;i>=0;i--)if(released.has(textures[i]))textures.splice(i,1);
   interactions.delete(id);worldCameras.delete(id);delete groups[id];
   if(id==='snow')snow=null;if(id==='portrait')portraitRoom=null;
   if(id==='bedroom'){portrait=smoke=tablePipe=portraitPipe=blanketMesh=windowGlass=null;}
  }
  renderer.renderLists.dispose();
 }
 function keepDraft(){for(const [id,world] of [['portrait-note','portrait'],['world-reflection','scream']]){const input=$(id);if(input&&!window.WorldObservations?.saveDraft(world,input.value)){message('草稿暂未存下，请保留文字。');return false;}}return true;}
 function closeDetail(){if(cafeFocus){leaveCafeTable();return;}if(actionComplete||!keepDraft())return;detail='';root.dataset.detail='';$('world-room-back').hidden=true;panel('','','');clearHotspotSelection();setCameraGoal();updateInventory();}
 function setDetail(name){keys.clear();drag=null;clearHotspotSelection();detail=name;root.dataset.detail=name;$('world-room-back').hidden=false;$('world-room-back').textContent=state.scene==='bedroom'?'↶ 看整个房间':state.scene==='scream'?'↶ 继续看桥':'↶ 继续看画';setCameraGoal();}
 function openObservation(){
  setDetail('note');panel('','哪一种颜色，让你停了一下？','',[
   ['保存观察',()=>{const value=$('portrait-note').value.trim();if(!value){message('写一点感受，或先继续看画。');return;}if(window.WorldObservations?.save('portrait',value)){$('portrait-note').remove();closeDetail();message('观察已保存。');}else message('暂时无法保存，请保留文字。');}],
   ['先不写',closeDetail,true]
  ]);
  const input=document.createElement('textarea');input.id='portrait-note';input.className='world-note';input.maxLength=600;input.placeholder='写一句，也可以先不写';input.setAttribute('aria-label','自画像观察');const saved=window.WorldObservations?.read('portrait');input.value=saved?.draft??saved?.saved??'';input.oninput=()=>{if(!window.WorldObservations?.saveDraft('portrait',input.value))message('草稿暂未存下，请保留文字。');};$('world-panel-copy').append(input);input.focus();schedulePortraitMeasure();
 }
 function showPortraitFocus(){if(!keepDraft())return;setDetail('focus');panel('','','',[['留一句观察',openObservation,true],['返回房间',closeDetail,true]]);}
 function showPortraitResponse(){setDetail('response');panel('','先看颜色，再看我。','场景创作对白',[['继续看画',showPortraitFocus],['留一句观察',openObservation,true],['返回房间',closeDetail,true]]);}
 function collectPipe(){
  if(blocked()||detail||state.pipe!=='hidden')return;
  pickupScene=state.scene;event('collect');selectedPipe=true;updateInventory();message('烟斗已收起。');
 }
 function showHeldPipe(){
  if(blocked()||state.pipe!=='held'||!keepDraft())return;
  setDetail('inventory');
  const actions=[['去自画像',()=>{if(state.scene==='portrait')closeDetail();else travel('portrait');}]];
  if(pickupScene===state.scene)actions.push(['放回原处',()=>{
   if(blocked()||state.pipe!=='held'||pickupScene!==state.scene)return;
   event('putBack');pickupScene=null;selectedPipe=false;closeDetail();message('烟斗已放回原处。');
  },true]);
  panel('','手中的烟斗','',actions);
 }
 function respondInPortrait(){
  if(blocked()||detail)return;
  if(state.pipe==='held'){
   setDetail('returning');panel('','','');$('world-room-back').hidden=true;
   portraitRoom?.beginReturn?.(clock,gentle);actionUntil=clock+.9;
   actionComplete=()=>{event('place');event('speak');pickupScene=null;selectedPipe=false;talkingUntil=clock+4;updateInventory();say('先看颜色，再看我。');showPortraitResponse();};
   return;
  }
  if(state.pipe==='placed'){showPortraitFocus();return;}
  setDetail('response');panel('','桌上有一支烟斗。','',[['继续看看',closeDetail]]);
 }
 function init(){
  if(ready||broken)return;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});}catch{broken=true;return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.outputEncoding=THREE.sRGBEncoding;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.setClearColor('#14232e');host.appendChild(renderer.domElement);
  scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(48,1,.1,120);

  windowTarget=new THREE.WebGLRenderTarget(512,512);windowTarget.texture.encoding=THREE.sRGBEncoding;windowCamera=new THREE.PerspectiveCamera(65,1,.1,120);windowCamera.position.set(0,2,9);windowCamera.lookAt(0,3,-20);

  renderTarget=new THREE.WebGLRenderTarget(1,1);postScene=new THREE.Scene();postCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  post=new THREE.ShaderMaterial({uniforms:{map:{value:renderTarget.texture},time:{value:0},strength:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`varying vec2 vUv;uniform sampler2D map;uniform float time;uniform float strength;void main(){vec2 p=vUv-.5;float r=length(p);float a=atan(p.y,p.x);float twist=sin(r*13.-time*.8)*strength*.11;vec2 uv=.5+mat2(cos(twist),-sin(twist),sin(twist),cos(twist))*p;uv.x+=sin(uv.y*19.+time)*.009*strength;uv.y+=sin(uv.x*17.-time*.7)*.007*strength;gl_FragColor=texture2D(map,clamp(uv,.002,.998));
#include <encodings_fragment>
}`});postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),post));
  new ResizeObserver(resize).observe(host);
  const portraitLayoutObserver=new ResizeObserver(schedulePortraitMeasure);
  for(const element of [$('world-panel'),root.querySelector('.world-top'),$('world-room-back')])if(element)portraitLayoutObserver.observe(element);
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();message('画面暂时中断，请刷新后继续；进度已保留。');});
  ready=true;resize();
 }
 function resize(){if(!renderer||!host.clientWidth||!host.clientHeight)return;const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;if(cafeFocus)camera.fov=camera.aspect<.8?62:52;camera.updateProjectionMatrix();renderTarget?.setSize(Math.round(w*Math.min(devicePixelRatio,1.4)),Math.round(h*Math.min(devicePixelRatio,1.4)));setCameraGoal(true);schedulePortraitMeasure();}
 function setCameraGoal(snap=false){if(!camera)return;const mobile=camera.aspect<.8;
  if(state.scene==='portrait'){
   camGoal.set(.3,2.9,mobile?12.5:6);lookGoal.set(0,2.7,-2);
   if(['returning','response','note','focus'].includes(detail)){
    // Cached screen bounds leave the actual panel and top controls clear.
    const availableHeight=Math.max(.01,portraitBounds.bottom-portraitBounds.top);
    const halfHeight=Math.max(2.9/(2*availableHeight*.94),2.3/(2*camera.aspect*.86));
    const distance=halfHeight/Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
    const framingY=2.8-halfHeight*(1-portraitBounds.top-portraitBounds.bottom);
    camGoal.set(0,framingY,-1.9+distance);lookGoal.set(0,framingY,-1.9);
   }
  }
  if(state.scene==='starry'){camGoal.set(0,4,mobile?23:14);lookGoal.set(0,8,-12);}
  if(state.scene==='pond'){camGoal.set(0,mobile?5:3.6,mobile?19:12);lookGoal.set(0,1,-6);}
  if(state.scene==='wave'){camGoal.set(0,mobile?4:2.8,mobile?19:11);lookGoal.set(-2,4,-10);}
  if(state.scene==='snow'){camGoal.set(0,3.4,mobile?34:17);lookGoal.set(0,3,-3);if(portalEntering){camGoal.set(snowGateX,3.2,-1.2);lookGoal.set(snowGateX,3.2,-4);}}
  if(state.scene==='bedroom'){
   if(detail==='window'){camGoal.set(-1,3.7,mobile?4.8:1);lookGoal.set(-1,3.75,-3.72);}
   else if(detail==='pipe'){camGoal.set(-1.4,2.9,2);lookGoal.set(-3,1.5,-2.6);}
   else{camGoal.set(mobile?-.2:0,mobile?4.1:4.0,mobile?20:8.8);lookGoal.set(0,mobile?2.2:2.15,-1.0);}
  }
  if(state.scene==='scream'){camGoal.set(0,2.5,THREE.MathUtils.lerp(mobile?17:14,mobile?2.2:1.3,storm));lookGoal.set(0,mobile?2.25:2.9,-8);}
  const worldCamera=worldCameras.get(state.scene);if(worldCamera){
   camGoal.fromArray(worldCamera.position);lookGoal.fromArray(worldCamera.target);
   const fitWidth=worldCamera.fitWidth??({bridge:19,rain:14}[state.scene]);
   if(mobile&&fitWidth){
    const horizontalFov=2*Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.aspect);
    const minimumDistance=fitWidth*1.04/(2*Math.tan(horizontalFov/2));
    if(camGoal.distanceTo(lookGoal)<minimumDistance){
     camGoal.sub(lookGoal);if(camGoal.lengthSq()===0)camGoal.set(0,0,1);
     camGoal.setLength(minimumDistance).add(lookGoal);
    }
   }
  }
  if(state.scene==='cafe'&&cafeFocus){camGoal.set(0,5.55,5.8);lookGoal.set(0,1.8,-2);}
  else if(roaming()){camGoal.copy(walk);lookGoal.copy(walk).add(new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)));}else if(!(state.scene==='portrait'&&['returning','response','note','focus'].includes(detail))){lookGoal.x+=yaw;lookGoal.y+=pitch;}
  if(snap){camera.position.copy(camGoal);look.copy(lookGoal);camera.lookAt(look);}
 }
 function updateInventory(){if(tablePipe)tablePipe.visible=state.pipe==='hidden';if(portraitPipe)portraitPipe.visible=state.pipe==='placed';if(smoke)smoke.visible=state.pipe==='placed';portraitRoom?.sync(state,clock,gentle);$('world-inventory').hidden=!['bedroom','portrait'].includes(state.scene)||state.pipe!=='held';$('world-inventory').setAttribute('aria-pressed',String(selectedPipe));hotspots.find(h=>h.id==='portrait')?.button.classList.toggle('is-target',selectedPipe);}
 function defaultBedroom(){closeDetail();}
 function interact(id){if(state.scene!=='bedroom')return;if(id==='portrait'){travel('portrait');return;}
  if(id==='window'){if(!windowOpen)playCue('window');windowOpen=true;ensureWorld('wheat');window.artTrophies?.award('bedroom');setDetail('window');animated.find(a=>a.type==='shutter').open=true;windowGlass.map=windowTarget.texture;windowGlass.color.set('#ffffff');windowGlass.needsUpdate=true;panel('','窗外，是另一幅画。','',[['走进麦田 →',()=>travel('wheat')],['留在窗边',defaultBedroom,true]]);return;}
  if(id==='bed'){setDetail('bed');panel('床边 / 色彩实验',quiltCool?'同一个房间，换一种心情。':'一种让人停下来的红。',quiltCool?'更安静，还是更冷？':'只换一种颜色，感觉会变吗？',[[quiltCool?'还原红色 ↶':'把床上的红换成蓝',()=>{quiltCool=!quiltCool;blanketMesh.material=quiltCool?alternateQuilt:originalQuilt;interact('bed');}],['继续找找 →',defaultBedroom,true]]);return;}
  if(id==='pipe')collectPipe();
 }
 function migrateScreamObservation(){
  if(screamLegacyChecked||!window.WorldObservations)return;
  screamLegacyChecked=true;
  const saved=window.WorldObservations.read('scream');
  if(saved?.draft==null&&!saved?.saved?.trim()&&state.note?.trim())window.WorldObservations.save('scream',state.note);
 }
 function openScreamObservation(){
  setDetail('scream-note');panel('','刚才，哪一处让你停下来？','',[
   ['保存观察',()=>{const value=$('world-reflection').value.trim();if(!value){message('可以先继续看看。');return;}if(window.WorldObservations?.save('scream',value)){$('world-reflection').remove();closeDetail();message('观察已保存。');}else message('暂时无法保存，请保留文字。');}],['继续看桥',closeDetail,true]
  ]);
  const field=document.createElement('textarea');field.id='world-reflection';field.className='world-note';field.maxLength=600;field.placeholder='写下一点感受';field.setAttribute('aria-label','呐喊观察');
  const saved=window.WorldObservations?.read('scream');field.value=saved?.draft??(saved?.saved?.trim()?saved.saved:state.note||'');
  field.oninput=()=>{if(!window.WorldObservations?.saveDraft('scream',field.value))message('草稿暂未存下，请保留文字。');};$('world-panel-copy').append(field);field.focus();
 }
 function updateScream(dt){
  if(state.scene!=='scream'||cameraBlocked())return;
  const moving=Math.abs(walk.x-lastScreamX)>.001||Math.abs(walk.z-lastScreamZ)>.001||Math.abs(yaw-lastScreamYaw)>.002||Math.abs(pitch-lastScreamPitch)>.002;
  lastScreamX=walk.x;lastScreamZ=walk.z;lastScreamYaw=yaw;lastScreamPitch=pitch;
  const proximity=THREE.MathUtils.clamp((12-walk.z)/15,0,1);
  if(proximity>.9&&!screamExperienced){screamExperienced=true;event('storm');message('停一会儿，或慢慢退后。');}
  screamStill=moving?0:screamStill+dt;
  const settling=screamExperienced?THREE.MathUtils.clamp((screamStill-1)/5,0,1):0;
  stormTarget=proximity*(1-settling);
  if(screamExperienced&&stormTarget<.15){screamQuiet+=dt;if(screamQuiet>2&&!state.calmed){event('calm');message('线条安静下来了。');panel('','','',[['留一句观察',openScreamObservation,true]]);}}
  else screamQuiet=0;
 }
 function enterSnowGate(destination,x){if(portalEntering)return;snowDestination=destination;snowGateX=x;portalEntering=true;setCameraGoal();clearTimeout(transitionTimer);transitionTimer=setTimeout(()=>changeScene(snowDestination,false,'portal'),gentle?0:900);}
 function changeScene(name,immediate=false,entry='menu',historyPose=null){
  if(!ready||!WORLD_IDS.includes(name)||routeTransition||actionComplete)return;
  if(!keepDraft())return;if(entry==='portal')playCue('portal');cancelInteraction();cafeFocus=false;clearHotspotSelection();keys.clear();drag=null;
  entrancePose=null;camera.fov=48;camera.updateProjectionMatrix();clearTimeout(transitionTimer);window.speechSynthesis?.cancel();talkingUntil=0;$('world-transition').classList.add('is-active');
  const recordHistory=!returning;returning=false;routeTransition=true;const previousScene=state.scene,previousPose={scene:previousScene,walk:walk.clone(),yaw,pitch,wheatWalked,wheatCheckpoint};
  const enter=()=>{try{ensureWorld(name);if(name==='bedroom'&&windowOpen){ensureWorld('wheat');windowGlass.map=windowTarget.texture;windowGlass.color.set('#ffffff');windowGlass.needsUpdate=true;}}catch(error){console.error(error);routeTransition=false;portalEntering=false;$('world-transition').classList.remove('is-active');message('这个空间暂未载入，请重新进入。');return;}if(entered&&recordHistory&&previousScene!==name)routeHistory.push(previousPose);entered=true;$('world-go-back').hidden=!routeHistory.length;if(previousScene==='snow'&&['starry','pond','wave'].includes(name)&&portalEntering)window.artTrophies?.award('snow');routeTransition=false;portalEntering=false;state.scene=name;save();detail='';root.dataset.scene=name;root.dataset.detail='';const pose=worldEntryPose(name,previousScene,entry);keys.clear();walk.set(pose.x,pose.y,pose.z);yaw=pose.yaw;pitch=pose.pitch;wheatWalked=0;wheatCheckpoint=false;wheatPortalsArmed=false;if(historyPose){walk.copy(historyPose.walk);yaw=historyPose.yaw;pitch=historyPose.pitch;wheatWalked=historyPose.wheatWalked;wheatCheckpoint=historyPose.wheatCheckpoint;}renderer.toneMapping=['gallery','cafe','portrait'].includes(name)?THREE.ACESFilmicToneMapping:THREE.NoToneMapping;renderer.toneMappingExposure=1.25;scene.fog=name==='gallery'?new THREE.Fog('#171c1c',25,65):null;renderer.setClearColor(name==='gallery'?'#171c1c':'#14232e');selectedPipe=false;$('world-walk').hidden=!roaming();$('world-room-back').hidden=true;Object.entries(groups).forEach(([id,g])=>g.visible=id===name);$('world-storm-control').hidden=true;$('world-inventory').hidden=true;
   document.querySelectorAll('[data-world]').forEach(b=>b.setAttribute('aria-current',b.dataset.world===name?'step':'false'));
   const copy={portrait:['','','',''],starry:['','','',''],pond:['','','',''],wave:['','','',''],cafe:['','','',''],gallery:['','','',''],wheat:['','','',''],snow:['画外 / 雪幕','BEYOND THE FRAME','画外，\n下起了雪。','有些世界，要走进去才看得见。'],bedroom:['画中 / 阿尔的房间','ARLES · AN UNFINISHED CONVERSATION','房间，还醒着。','拖动画面环顾 · 点击发光的线索'],scream:['画中 / 一声呐喊','','','']}[name]||['','','',''];['world-location','world-eyebrow','world-title','world-subtitle'].forEach((id,i)=>$(id).textContent=copy[i]);
   if(name==='snow')panel('','','');
   if(['starry','pond','wave','portrait','bridge','rain','sunday'].includes(name)){panel('','','');clearTimeout(messageTimer);$('world-status').classList.remove('is-visible');}if(name==='bedroom')defaultBedroom();if(roaming()){panel('','','');message('拖动环顾 · WASD / 方向键移动');}
   if(name==='scream'){migrateScreamObservation();storm=stormTarget=0;screamExperienced=false;screamQuiet=screamStill=0;lastScreamX=walk.x;lastScreamZ=walk.z;lastScreamYaw=yaw;lastScreamPitch=pitch;panel('','','',state.calmed?[['留一句观察',openScreamObservation,true]]:[]);message('沿桥向前走 · 停留或后退，让线条安静');}
   trimWorlds(name,previousScene);$('world-current-label').textContent=WORLD_CATALOG.find(w=>w.id===name)?.short|| (name==='snow'?'雪幕':'画廊');setCameraGoal(true);updateInventory();$('world-transition').classList.remove('is-active');showDiscoveryHint(name);
  };if(immediate||gentle)enter();else transitionTimer=setTimeout(enter,420);
 }
 function updateHotspots(){camera.updateMatrixWorld();for(const h of hotspots){let show=state.scene===h.group;if(h.group==='wheat'&&h.position.distanceTo(camera.position)>13)show=false;
   if(h.id==='field-scream'&&walk.z>=-23)show=false;if(detail||(cafeFocus&&h.group==='cafe'))show=false;if(h.id==='pipe'&&state.pipe!=='hidden')show=false;if(h.button.dataset.available==='false')show=false;
   h.button.hidden=!show;if(!show)continue;if(h.group==='gallery'){const direction=h.position.clone().sub(camera.position),distance=direction.length();raycaster.set(camera.position,direction.normalize());const hit=raycaster.intersectObjects(groups.gallery.children,true).find(hit=>hit.object.isMesh&&!hit.object.userData.interaction);if(hit&&hit.distance<distance-.4){h.button.hidden=true;continue;}}const p=h.position.clone().project(camera);h.button.style.left=((p.x+1)*.5*host.clientWidth)+'px';h.button.style.top=((1-p.y)*.5*host.clientHeight)+'px';if(p.z>1||Math.abs(p.x)>1.1||Math.abs(p.y)>1.1)h.button.hidden=true;
  }}
 function tick(time){raf=0;if(!active||document.hidden)return;const dt=Math.min((time-last)/1000||.016,.05);last=time;clock+=dt;
  if(actionComplete&&clock>=actionUntil){const complete=actionComplete;actionComplete=null;complete();}

  if(roaming()&&!cameraBlocked()&&!cafeFocus){let forward=(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0),side=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);const norm=Math.hypot(forward,side)||1,step=dt*4/norm;moveWalk(forward,side,step);if(state.scene==='wheat'&&!routeTransition){const atRoom=Math.hypot(walk.x+8,walk.z-9.6)<1.35,atBridge=walk.z<-25.6&&Math.abs(walk.x)<1.6;if(!atRoom&&!atBridge)wheatPortalsArmed=true;if(wheatPortalsArmed){if(atRoom)travel('bedroom');else if(atBridge)travel('scream');}}}
  updateScream(dt);
  storm=THREE.MathUtils.lerp(storm,stormTarget,1-Math.exp(-dt*2));setCameraGoal();const ease=gentle?1:1-Math.exp(-dt*3.7);camera.position.lerp(camGoal,ease);look.lerp(lookGoal,ease);camera.lookAt(look);if(entrancePose&&state.scene==='gallery'){const f=Math.min(1,(clock-entranceAt)/1.3),e=f*f*(3-2*f),q=camera.quaternion.clone();camera.position.lerpVectors(new THREE.Vector3(...entrancePose.position),camGoal,e);camera.quaternion.slerpQuaternions(new THREE.Quaternion(...entrancePose.quaternion),q,e);camera.fov=THREE.MathUtils.lerp(entrancePose.fov,48,e);camera.updateProjectionMatrix();if(f===1)entrancePose=null;}
  if(snow){snow.material.uniforms.time.value=clock;snow.material.uniforms.motion.value=gentle?.08:1;snow.material.uniforms.pointer.value.set(pointer.x,pointer.y);}
  if(portrait){portrait.material.uniforms.time.value=clock;portrait.material.uniforms.alive.value=state.spoken&&!gentle?1:0;portrait.material.uniforms.speaking.value=clock<talkingUntil&&!gentle?1:0;}
  portraitRoom?.sync(state,clock,gentle);smoke?.children.forEach((s,i)=>{s.position.x=Math.sin(clock*.7+i)*.06;s.position.y=((clock*.12+i*.12)%.9);s.material.opacity=gentle?0:(1-s.position.y/.9)*.17;});
  animated.forEach(a=>{if(a.type==='artist'&&a.scene===state.scene&&!blocked()&&(!detail||state.scene==='cafe'))a.update(gentle?0:clock,dt,gentle);if(a.type==='cafe-hotspot'&&state.scene==='cafe')a.update();if(a.type==='cafe-shot'&&state.scene==='cafe'&&!a.finished){a.elapsed+=dt;const f=Math.min(1,a.elapsed/2),e=1-(1-f)*(1-f);a.balls[0].position.set(.65-.85*e,1.51,.9-2.05*e);a.balls[1].position.set(-.2+Math.max(0,e-.65)*2,1.51,-1.2-Math.max(0,e-.65)*2.5);a.balls[0].rotation.x-=dt*4;if(f===1){a.finished=true;a.done();}}if(a.owner!==state.scene&&!(state.scene==='bedroom'&&windowOpen&&a.owner==='wheat'))return;if(a.type==='wheat')a.wind.value=gentle?0:clock;if(a.type==='crow'){const t=(gentle?0:clock)*.18+a.phase;a.mesh.position.set(Math.sin(t)*15,5+Math.sin(t*.7+a.phase)*2,-13+Math.cos(t)*9);a.mesh.rotation.y=-t;a.wings.forEach((w,i)=>w.rotation.z=(i?1:-1)*Math.sin((gentle?0:clock)*5+a.phase)*.6);}if(a.type==='shutter')a.mesh.rotation.y=THREE.MathUtils.lerp(a.mesh.rotation.y,a.open?-1.25:-.45,ease);if(a.type==='tunnel'){a.mesh.material.uniforms.time.value=gentle?0:clock;a.mesh.material.uniforms.strength.value=gentle?storm*.1:storm;}if(a.type==='stroke'){a.mesh.rotation.z=Math.sin((gentle?0:clock)*.22+a.phase)*storm*(gentle?.005:.035);}});
  updateHotspots();updateAmbience();
  if(state.scene==='bedroom'&&animated.find(a=>a.type==='shutter').open){groups.bedroom.visible=false;groups.wheat.visible=true;renderer.setRenderTarget(windowTarget);renderer.render(scene,windowCamera);renderer.setRenderTarget(null);groups.wheat.visible=false;groups.bedroom.visible=true;}
  if(state.scene==='scream'){renderer.setRenderTarget(renderTarget);renderer.render(scene,camera);renderer.setRenderTarget(null);post.uniforms.time.value=gentle?0:clock;post.uniforms.strength.value=gentle?storm*.12:storm;renderer.render(postScene,postCamera);}else renderer.render(scene,camera);
  raf=requestAnimationFrame(tick);
 }
 function resume(){if(active&&!raf&&!document.hidden){last=performance.now();raf=requestAnimationFrame(tick);}}
 function pause(){cancelInteraction();keepDraft();if(actionComplete){const complete=actionComplete;actionComplete=null;complete();}routeTransition=false;clearHotspotSelection();keys.clear();drag=null;active=false;portalEntering=false;cancelAnimationFrame(raf);raf=0;clearTimeout(transitionTimer);$('world-transition').classList.remove('is-active');window.speechSynthesis?.cancel();if(audio)audio.suspend().catch(()=>{});}
 function open(destination){if(!active){routeHistory.length=0;entered=false;}const startPose=destination==='gallery'?window.museumViewer?.getPose():null;active=true;init();if(broken){panel('画中世界','此设备暂时无法打开三维空间。','可以返回展厅继续看画与记录。');return;}const target=WORLD_IDS.includes(destination)?destination:state.scene;changeScene(target,true);resize();entrancePose=gentle?null:startPose;entranceAt=clock;if(sound&&audio)audio.resume().catch(()=>{});resume();}
 function createSound(){const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return false;audio=new Context();ambientGain=audio.createGain();ambientGain.gain.value=0;ambientGain.connect(audio.destination);for(const f of [130.81,196,261.63]){const o=audio.createOscillator();o.frequency.value=f;o.type='sine';const gain=audio.createGain();gain.gain.value=.13;o.connect(gain);gain.connect(ambientGain);o.start();}const buffer=audio.createBuffer(1,audio.sampleRate*3,audio.sampleRate),data=buffer.getChannelData(0);let v=0;for(let i=0;i<data.length;i++){v=(v+(Math.random()*2-1)*.03)*.98;data[i]=v+(Math.random()*2-1)*.025;}const source=audio.createBufferSource();source.buffer=buffer;source.loop=true;const filter=environmentFilter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=500;filter.Q.value=.2;windGain=audio.createGain();windGain.gain.value=0;source.connect(filter);filter.connect(windGain);windGain.connect(audio.destination);source.start();return true;}
 function updateAmbience(){
  if(!audio||!ambientGain||!environmentFilter||audio.state!=='running'||audio.currentTime<nextAmbienceAt)return;
  const now=audio.currentTime;nextAmbienceAt=now+.1;
  let [hum,noise,cutoff]=ambienceProfiles[state.scene]||[0,0,500];
  if(!gentle){
   if(state.scene==='wave'){const tide=.5+.5*Math.sin(clock*.65);noise*=.45+.55*tide;cutoff=500+450*tide;}
   else if(['pond','bridge'].includes(state.scene)){const ripple=Math.sin(clock*.42);noise*=.88+.12*ripple;cutoff+=90*ripple;}
  }
  if(state.scene==='scream')noise+=storm*(gentle?.01:.04);
  const level=sound&&active&&!document.hidden?(gentle?.65:1):0;
  ambientGain.gain.setTargetAtTime(hum*level,now,.45);windGain.gain.setTargetAtTime(noise*level,now,.45);
  environmentFilter.frequency.setTargetAtTime(cutoff,now,.65);
 }
 function playCue(kind='touch'){
  if(!sound||!audio||audio.state!=='running')return;
  const tones={collect:[330,495],place:[440,330],window:[294,440],portal:[262,524],water:[520,310],hit:[185,110],success:[392,588]};
  const [from,to]=tones[kind]||[360,440],start=audio.currentTime,duration=.18;
  const oscillator=audio.createOscillator(),gain=audio.createGain();oscillator.type='sine';
  oscillator.frequency.setValueAtTime(from,start);oscillator.frequency.exponentialRampToValueAtTime(to,start+duration);
  gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(.035,start+.018);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
  oscillator.connect(gain);gain.connect(audio.destination);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};oscillator.start(start);oscillator.stop(start+duration+.02);
 }
 function say(text){if(!sound||!window.speechSynthesis)return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text.replace(/[“”]/g,''));u.lang='zh-CN';u.rate=.85;const voice=window.speechSynthesis.getVoices().find(v=>v.lang.startsWith('zh'));if(voice)u.voice=voice;window.speechSynthesis.speak(u);}
 $('world-sound').onclick=async()=>{sound=!sound;try{if(sound&&!audio&&!createSound())throw Error();if(audio){if(sound)await audio.resume();else await audio.suspend();}}catch{sound=false;message('当前浏览器无法开启声音，文字互动可正常体验。');}if(!sound)window.speechSynthesis?.cancel();$('world-sound').textContent=sound?'声音 开':'声音 关';$('world-sound').setAttribute('aria-pressed',String(sound));};
 $('world-motion').onclick=()=>{gentle=!gentle;$('world-motion').setAttribute('aria-pressed',String(gentle));message(gentle?'已减弱飘雪、人物和空间动态。':'已恢复画中世界的动态。');};$('world-motion').setAttribute('aria-pressed',String(gentle));
 media.addEventListener('change',e=>{gentle=e.matches;$('world-motion').setAttribute('aria-pressed',String(gentle));});
 document.querySelectorAll('[data-world]').forEach(b=>b.onclick=()=>changeScene(b.dataset.world));$('world-room-back').onclick=closeDetail;
 $('world-go-back').onclick=()=>{if(blocked())return;if(detail){closeDetail();return;}if(!keepDraft())return;const target=routeHistory.pop();if(target){returning=true;changeScene(target.scene,false,'history',target);}};
 $('world-inventory').draggable=false;$('world-inventory').onclick=showHeldPipe;
 $('world-distance').disabled=true;
 host.addEventListener('pointerdown',e=>{
  if(cameraBlocked()||inputOwner)return;
  const input=interactionInput(e),handler=interactions.get(state.scene);
  if(handler?.pointerDown?.(input)===true){inputOwner={handler,pointerId:e.pointerId};keys.clear();drag=null;e.preventDefault();host.setPointerCapture(e.pointerId);return;}
  if(cafeFocus)return;
  drag={x:e.clientX,y:e.clientY,yaw,pitch};host.setPointerCapture(e.pointerId);
 });
 host.addEventListener('pointermove',e=>{
  const input=interactionInput(e);
  if(inputOwner){if(e.pointerId===inputOwner.pointerId)inputOwner.handler.pointerMove?.(input);return;}
  if(cameraBlocked())return;
  interactions.get(state.scene)?.pointerMove?.(input);
  if(drag&&state.scene!=='snow'&&!cafeFocus){const sensitivity=e.pointerType==='touch'?1:.4;yaw=roaming()?drag.yaw+(e.clientX-drag.x)*.005*sensitivity:THREE.MathUtils.clamp(drag.yaw+(e.clientX-drag.x)*.008*sensitivity,-1.5,1.5);pitch=THREE.MathUtils.clamp(drag.pitch-(e.clientY-drag.y)*.005*sensitivity,-.65,.65);}
 });
 host.addEventListener('pointerup',e=>{
  const input=interactionInput(e);
  if(inputOwner){if(e.pointerId!==inputOwner.pointerId)return;const owner=inputOwner;inputOwner=null;owner.handler.pointerUp?.(input);drag=null;return;}
  if(!cameraBlocked()&&drag&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<6&&active&&ready){
   if(state.scene==='snow'){const hit=raycaster.intersectObjects(groups.snow.children).find(h=>h.object.userData.snowDestination);if(hit){const h=hotspots.find(h=>h.group==='snow'&&h.position.x===hit.object.userData.snowGateX);if(h)activateHotspot(h.button,h.fn,e.pointerType==='touch');}}
   else if(['bedroom','portrait'].includes(state.scene)&&!detail){const hit=raycaster.intersectObjects(groups[state.scene].children,true).find(h=>h.object.userData.interaction);if(hit){const h=hotspots.find(h=>h.group===state.scene&&h.id===hit.object.userData.interaction);if(h)activateHotspot(h.button,h.fn,e.pointerType==='touch');}}
  }
  drag=null;
 });
 host.addEventListener('pointercancel',cancelInteraction);
 host.addEventListener('lostpointercapture',e=>{if(inputOwner?.pointerId===e.pointerId)cancelInteraction(e);else drag=null;});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelInteraction();cancelAnimationFrame(raf);raf=0;audio?.suspend().catch(()=>{});window.speechSynthesis?.cancel();}else if(active){if(sound)audio?.resume().catch(()=>{});resume();}});
 document.addEventListener('keydown',e=>{
  if(!active)return;
  const dialog=document.querySelector('dialog[open]'),editing=/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.target.isContentEditable;
  if(dialog){if(e.key==='Escape'){e.preventDefault();dialog.close();}return;}
  if(editing){if(e.key==='Escape'){e.preventDefault();if(detail)closeDetail();}return;}
  if(e.key==='Escape'){
   if(actionComplete||routeTransition)return;
   if(!detail&&interactions.get(state.scene)?.keyDown?.(interactionInput(e))===true){e.preventDefault();return;}
   if(cafeFocus){e.preventDefault();leaveCafeTable();return;}
   cancelInteraction(e);e.preventDefault();
   if(detail){closeDetail();return;}if(selectedHotspot){clearHotspotSelection();return;}
   if(routeHistory.length)$('world-go-back').click();else $('world-exit').click();return;
  }
  if(cameraBlocked())return;
  if(interactions.get(state.scene)?.keyDown?.(interactionInput(e))===true){e.preventDefault();return;}
  if(roaming()&&['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(e.key.toLowerCase())){e.preventDefault();keys.add(e.key.toLowerCase());return;}
  if(e.target===document.body&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();yaw=THREE.MathUtils.clamp(yaw+(e.key==='ArrowLeft'?-.3:.3),-1.5,1.5);}
 });
 new MutationObserver(()=>{if(document.querySelector('dialog[open]'))cancelInteraction();}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
 document.addEventListener('focusin',e=>{if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))cancelInteraction(e);});
 document.addEventListener('keyup',e=>{keys.delete(e.key.toLowerCase());if(active&&!document.querySelector('dialog[open]')&&!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)&&!e.target.isContentEditable)interactions.get(state.scene)?.keyUp?.(interactionInput(e));});window.addEventListener('blur',cancelInteraction);
 document.querySelectorAll('[data-walk]').forEach(b=>{let pressedAt=0;b.onclick=()=>{if(cameraBlocked()||!roaming()||performance.now()-pressedAt>220)return;const forward=b.dataset.walk==='w'?1:b.dataset.walk==='s'?-1:0,side=b.dataset.walk==='d'?1:b.dataset.walk==='a'?-1:0;moveWalk(forward,side,.6);};b.onkeydown=e=>{if(e.key==='Enter'||e.key===' ')pressedAt=performance.now();};b.onpointerdown=e=>{if(cameraBlocked())return;e.preventDefault();pressedAt=performance.now();b.setPointerCapture(e.pointerId);keys.add(b.dataset.walk);};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>keys.delete(b.dataset.walk);});
 window.paintingWorlds={open,pause,inspect:()=>({scene:state.scene,loaded:Object.keys(groups),hotspots:hotspots.length,geometries:renderer?.info.memory.geometries,textures:renderer?.info.memory.textures}),hold:()=>cancelInteraction()};
}
