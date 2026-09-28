import * as THREE from 'three';
import { paintedMaterial } from './painted-materials.js';

// Spatial interpretations: paths between painters are authored for this experience.
export function buildArtistWorlds({scene,groups,box,mat,addHotspot,travel,animated,only,registerInteraction}){
 let seed=1889;const rnd=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 const basic=c=>new THREE.MeshBasicMaterial({color:c,side:THREE.DoubleSide});
 const tube=(g,points,r,m)=>{const o=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),64,r,6,false),m);g.add(o);return o;};
 const sphere=(g,x,y,z,s,m)=>{const o=new THREE.Mesh(new THREE.SphereGeometry(s,16,12),m);o.position.set(x,y,z);g.add(o);return o;};
 const group=id=>{const g=groups[id]=new THREE.Group();scene.add(g);return g;};
 function backdrop(g,color){const sky=new THREE.Mesh(new THREE.SphereGeometry(80,32,24),new THREE.MeshBasicMaterial({color,side:THREE.BackSide}));g.add(sky);}
 function portal(g,id,label,x,y,z,dest,color){const m=basic(color);const ring=new THREE.Mesh(new THREE.TorusGeometry(.38,.025,8,40),m);ring.position.set(x,y,z);g.add(ring);addHotspot(id,label,[x,y,z],()=>travel(dest),g.userData.id);}
 const boatMat=only==='starry'?null:mat('#997548',['#bea477','#674c35']);
 if(!only||only==='starry'){
 const starry=group('starry');starry.userData.id='starry';backdrop(starry,'#102244');starry.add(new THREE.HemisphereLight('#a6c0e1','#263739',1.2));
 const ground=mat('#243e41',['#365252','#1b303c']);box(starry,75,.2,70,0,-.2,-8,ground);
 // Layered hills and individual village buildings.
 for(let i=0;i<15;i++){const h=sphere(starry,(i-7)*5,0,-28-rnd()*9,5+rnd()*5,mat('#254960',['#365a74','#243b56']));h.scale.set(1,.55,.6);}
 const wall=mat('#6e7e92',['#a2a494','#465b75']),roof=mat('#263956',['#466583','#182c43']),gold=basic('#edce78');
 for(let i=0;i<24;i++){const x=(i%8-3.5)*3.5,z=-9-Math.floor(i/8)*5,h=1.1+rnd()*1.8;box(starry,2.2,h,2.4,x,h/2,z,wall);const r=new THREE.Mesh(new THREE.ConeGeometry(1.9,1.3,4),roof);r.rotation.y=Math.PI/4;r.position.set(x,h+.65,z);starry.add(r);for(const dx of [-.5,.5])box(starry,.27,.4,.04,x+dx,h*.6,z+1.22,gold);}
 box(starry,1.5,4,1.5,1,2,-14,wall);const spire=new THREE.Mesh(new THREE.ConeGeometry(1,3.8,4),roof);spire.position.set(1,5.8,-14);starry.add(spire);
 const cypress=mat('#172e2d',['#38533b','#101f2c']);for(let i=0;i<14;i++){const o=sphere(starry,-7+Math.sin(i)*.3,1+i*.7,-4,1.7-i*.075,cypress);o.scale.set(.65,1.8,.65);}
 const heavens=new THREE.Group();starry.add(heavens);
 for(let i=0;i<12;i++){const x=-24+rnd()*48,y=10+rnd()*13,z=-28;const orb=sphere(heavens,x,y,z,.2+rnd()*.25,gold);for(let j=0;j<3;j++){const ring=new THREE.Mesh(new THREE.TorusGeometry(.65+j*.3,.05,6,48),basic(j%2?'#aab99a':'#d5b96b'));ring.position.copy(orb.position);heavens.add(ring);}}
 sphere(heavens,17,19,-29,1.5,gold);
 for(let j=0;j<12;j++){const pts=[];for(let i=0;i<95;i++){const a=i/94*Math.PI*3.4,r=1+i/94*6+j*.13;pts.push([Math.cos(a)*r-2,13+Math.sin(a)*r*.4+j*.12,-24-j*.1]);}tube(heavens,pts,.04,basic(j%2?'#7b9eac':'#bfbd87'));}
 for(let k=0;k<6;k++){const pts=[];for(let i=0;i<80;i++){const x=-27+i*.7;pts.push([x,15+Math.sin(x*.12+k*.09)*2+k*.2,-31]);}tube(heavens,pts,.08,basic(k%2?'#597f9d':'#899f9d'));}
 const traceCurve=new THREE.CatmullRomCurve3(Array.from({length:95},(_,i)=>{const a=i/94*Math.PI*3.4,r=1+i/94*6;return new THREE.Vector3(Math.cos(a)*r-2,13+Math.sin(a)*r*.4,-23.85);}));
 const tracePoints=traceCurve.getSpacedPoints(94);
 const trace=new THREE.Mesh(new THREE.TubeGeometry(traceCurve,94,.085,6,false),basic('#fff0af'));heavens.add(trace);trace.geometry.setDrawRange(0,0);
 const cursor=sphere(heavens,tracePoints[0].x,tracePoints[0].y,-23.75,.22,basic('#fff0af'));
 const traceSurface=new THREE.Mesh(new THREE.PlaneGeometry(23,13),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));traceSurface.position.set(-2,13,-23.8);starry.add(traceSurface);
 let traceProgress=0,tracing=false,flowing=false,starAwarded=false,traceMode=false,keyTracing=false,keyProgress=0;
 const setTrace=index=>{traceProgress=index;trace.geometry.setDrawRange(0,index*36);cursor.position.copy(tracePoints[index]);cursor.position.z+=.1;if(index===94&&!flowing){flowing=true;tracing=false;keyTracing=false;if(!starAwarded){starAwarded=true;window.artTrophies?.award('starry');}}};
 const restartTrace=()=>{flowing=false;tracing=false;keyTracing=false;keyProgress=0;heavens.rotation.z=0;setTrace(0);};
 const traceKey=event=>event.code==='Space'||event.key==='Enter';
 const traceHit=raycaster=>{const hit=raycaster.intersectObject(traceSurface)[0];if(!hit)return null;let distance=Infinity,index=0;tracePoints.forEach((p,i)=>{const d=Math.hypot(p.x-hit.point.x,p.y-hit.point.y);if(d<distance){distance=d;index=i;}});return {index,distance};};
 registerInteraction?.('starry',{
  pointerDown:({raycaster})=>{if(flowing)return false;const hit=traceHit(raycaster);if(!hit||hit.distance>.85||Math.abs(hit.index-traceProgress)>5)return false;tracing=true;traceMode=true;return true;},
  pointerMove:({raycaster})=>{if(!tracing)return;const hit=traceHit(raycaster);if(!hit||hit.distance>.95||hit.index>traceProgress+10||hit.index<traceProgress-6){tracing=false;return;}setTrace(Math.max(traceProgress,hit.index>=91?94:hit.index));},
  pointerUp:()=>{tracing=false;},
  keyDown:({event})=>{if(event.target!==traceButton||!traceKey(event))return false;if(event.repeat)return true;if(flowing)restartTrace();traceMode=true;keyTracing=true;keyProgress=traceProgress;return true;},
  keyUp:({event})=>{if(!traceKey(event))return false;keyTracing=false;return event.target===traceButton;},
  cancel:()=>{tracing=false;keyTracing=false;}
 });
 const traceButton=addHotspot('star-touch','沿涡流描绘星光',[-4,10,-20],()=>{traceMode=true;if(flowing)restartTrace();},'starry');
 traceButton.setAttribute('aria-keyshortcuts','Space Enter');traceButton.addEventListener('keyup',event=>{if(traceKey(event))event.preventDefault();});
 animated.push({type:'artist',scene:'starry',update:(t,dt,gentle)=>{if(keyTracing&&document.activeElement!==traceButton)keyTracing=false;if(keyTracing&&!flowing){keyProgress+=Math.min(dt,.1)*20;setTrace(Math.min(94,Math.max(traceProgress,Math.floor(keyProgress))));}heavens.rotation.z=flowing&&!gentle?Math.sin(t*.12)*.035:0;cursor.scale.setScalar(flowing||gentle?1:1+Math.sin(t*2)*.12);const label=flowing?'再描一遍':traceMode?'按住描绘星光':'沿涡流描绘星光';traceButton.setAttribute('aria-pressed',String(traceMode&&!flowing));traceButton.setAttribute('aria-label',label);traceButton.querySelector('span').textContent=label;}});
 portal(starry,'star-cafe','回到咖啡馆',-4,3,0,'cafe','#edce78');portal(starry,'star-pond','沿星光走向池塘',5,1.6,-4,'pond','#b8d7bd');

 }
 if(!only||only==='pond'){
 const pond=group('pond');pond.userData.id='pond';backdrop(pond,'#9aafad');pond.add(new THREE.HemisphereLight('#ebdfb1','#33534b',1.65));
 const grass=mat('#4e7150',['#749066','#355543']),wood=paintedMaterial('wood',[.3,1.6]);box(pond,55,.4,50,0,-.45,-5,grass);
 const water=new THREE.Mesh(new THREE.PlaneGeometry(20,29,50,60),new THREE.MeshStandardMaterial({color:'#466d78',metalness:.5,roughness:.26,side:THREE.DoubleSide}));water.rotation.x=-Math.PI/2;water.position.set(0,-.08,-6);pond.add(water);
 const lilyMat=mat('#577343',['#879766','#345d4e']),flower=basic('#e9c5c5');
 for(let i=0;i<110;i++){const x=(rnd()-.5)*18,z=-19+rnd()*25;if(Math.abs(z+7)<2)continue;const leaf=new THREE.Mesh(new THREE.CircleGeometry(.18+rnd()*.35,16,0,Math.PI*1.85),lilyMat);leaf.rotation.x=-Math.PI/2;leaf.rotation.z=rnd()*6;leaf.position.set(x,.01,z);pond.add(leaf);if(i%4===0){const f=sphere(pond,x,.12,z,.16,flower);f.scale.set(1,.5,1);}}
 // Bridge arches run left to right over the water.
 for(let i=0;i<35;i++){const x=-11+i*22/34,y=.55+1.7*(1-(x/11)**2);box(pond,.68,.13,2.2,x,y,-7,wood);if(i%3===0)for(const z of [-8,-6])box(pond,.09,1.1,.09,x,y+.55,z,wood);}
 for(const z of [-8,-6])for(const lift of [.5,1.1]){const pts=[];for(let i=0;i<=40;i++){const x=-11+i*.55;pts.push([x,.55+1.7*(1-(x/11)**2)+lift,z]);}tube(pond,pts,.08,wood);}
 for(let i=0;i<24;i++){const x=(i%2?-1:1)*(11+rnd()*9),z=-22+rnd()*33,h=4+rnd()*5;box(pond,.25,h,.25,x,h/2,z,wood);const crown=sphere(pond,x,h,z,2+rnd(),grass);crown.scale.y=.65;for(let j=0;j<5;j++)tube(pond,[[x,h,z],[x+Math.sin(j)*1.8,h-.8,z+Math.cos(j)*1.4],[x+Math.sin(j)*2,h-3.3,z+Math.cos(j)*1.6]],.035,wood);}
 for(let i=0;i<130;i++){const x=(rnd()-.5)*18,z=-19+rnd()*25;const o=box(pond,.2+rnd()*.9,.004,.025,x,-.05,z,basic(i%3?'#64837d':'#b2b49b'));}
 const ripples=Array.from({length:3},()=>{const ringGroup=new THREE.Group();pond.add(ringGroup);for(let i=0;i<4;i++){const ring=new THREE.Mesh(new THREE.RingGeometry(.98,1,64),new THREE.MeshBasicMaterial({color:'#d2dcca',transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.visible=false;ringGroup.add(ring);}return {group:ringGroup,age:6};});
 let rippleSlot=0,settling=false,quietAge=6;
 const disturb=point=>{const ripple=ripples[rippleSlot++%ripples.length];ripple.group.position.set(point.x,-.045,point.z);ripple.age=0;quietAge=0;settling=true;};
 const clearRipples=()=>{settling=false;quietAge=6;ripples.forEach(r=>{r.age=6;r.group.children.forEach(m=>m.visible=false);});};
 registerInteraction?.('pond',{
  pointerDown:({raycaster})=>{const hit=raycaster.intersectObject(water)[0];if(!hit)return false;disturb(hit.point);return true;},
  cancel:clearRipples
 });
 addHotspot('pond-touch','轻触水面',[0,.2,2],()=>disturb(new THREE.Vector3(0,-.08,2)),'pond');
 animated.push({type:'artist',scene:'pond',update:(t,dt,gentle)=>{const step=Math.min(dt,.1);quietAge+=step;ripples.forEach(ripple=>{ripple.age+=step;ripple.group.children.forEach((r,i)=>{const a=ripple.age-i*.35;r.visible=a>=0&&a<4;r.scale.setScalar(gentle?.6+i*.28:.2+Math.max(0,a)*1.2);r.material.opacity=Math.max(0,.6-a*.15);});});water.position.y=-.08+(gentle?0:Math.sin(t*.4)*.006);if(settling&&quietAge>=5.1){settling=false;window.artTrophies?.award('lilies');}}});
 box(pond,1.8,.3,4.4,6,.2,3,boatMat);for(const x of [5.12,6.88])box(pond,.12,.5,4.4,x,.5,3,boatMat);for(const z of [1,5])box(pond,1.8,.5,.13,6,.5,z,boatMat);box(pond,1.7,.12,.5,6,.7,3,boatMat);
 portal(pond,'pond-bridge','走上日本桥',-4,2,-7,'bridge','#b8d7bd');
 portal(pond,'pond-star','回到星夜',-5,1.3,5,'starry','#edce78');portal(pond,'pond-wave','登舟，驶向海面',6,1.1,3,'wave','#f2e4c7');

 }
 if(!only||only==='wave'){
 const wave=group('wave');wave.userData.id='wave';backdrop(wave,'#d4c7ac');wave.add(new THREE.HemisphereLight('#eee2c6','#173750',1.5));
 const sea=mat('#234e6b',['#416e85','#193c5c']);box(wave,90,.3,80,0,-.5,-12,sea);
 const fuji=new THREE.Mesh(new THREE.ConeGeometry(5,5,4),basic('#4e6f84'));fuji.position.set(6,2,-33);wave.add(fuji);const snowcap=new THREE.Mesh(new THREE.ConeGeometry(1.65,1.65,4),basic('#eee5d2'));snowcap.position.set(6,3.8,-33);wave.add(snowcap);
 const crest=new THREE.Group();wave.add(crest);const foam=basic('#eee7d4');
 // An extruded curling profile gives the wave thickness rather than a flat backdrop.
 const profile=new THREE.Shape();profile.moveTo(-14,-.2);profile.bezierCurveTo(-12,5,-9,11,-4,11);profile.bezierCurveTo(1,11,3,8,1,6);profile.bezierCurveTo(1,9,-3,9,-4,6);profile.bezierCurveTo(-6,2,-6,0,-5,-.2);profile.closePath();
 const curl=new THREE.Mesh(new THREE.ExtrudeGeometry(profile,{depth:7,bevelEnabled:true,bevelThickness:.2,bevelSize:.15,bevelSegments:2,steps:1,curveSegments:40}),sea);curl.position.z=-13;crest.add(curl);
 for(let j=0;j<19;j++){const z=-5.65+j*.025;const d=j*.055;const pts=[[-13+d,.2,z],[-10+d,6,z],[-6,10.3-d,z],[-2,10.2-d,z],[.7-d,8.1,z]];tube(crest,pts,.035+j%3*.025,foam);for(let k=0;k<3;k++)tube(crest,[[.3,8.5,z],[1.2+k*.18,8.1-k*.18,z],[.8+k*.2,7.45-k*.22,z+.1]],.075,foam);}
 for(let i=0;i<75;i++){const s=sphere(crest,-1+rnd()*4,6+rnd()*4,-13+rnd()*7,.04+rnd()*.08,foam);s.scale.y=1.6;}
 for(let j=0;j<8;j++){const pts=[];for(let i=0;i<50;i++)pts.push([-25+i,Math.sin(i*.22+j)*.25+.05,-24+j*4]);tube(wave,pts,.035,foam);}
 const vessel=new THREE.Group();wave.add(vessel);box(vessel,3,.2,7,0,.05,5,boatMat);for(const x of [-1.5,1.5])box(vessel,.16,.65,7,x,.35,5,boatMat);for(const z of [2,4,6,8])box(vessel,3,.15,.25,0,.45,z,boatMat);const paddle=box(vessel,.12,.1,4,1.3,.85,4,boatMat);paddle.rotation.y=.5;const blade=box(vessel,.45,.08,1.2,2.1,.85,5.4,boatMat);
 const oar=new THREE.Group();oar.position.set(1.3,.85,4);vessel.add(oar);paddle.position.sub(oar.position);vessel.remove(paddle);oar.add(paddle);blade.position.sub(oar.position);vessel.remove(blade);oar.add(blade);
 // A broad invisible surface follows the boat so a touch can hold the oar reliably.
 const oarSurface=new THREE.Mesh(new THREE.PlaneGeometry(5,3),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));oarSurface.position.set(.8,1.1,3);vessel.add(oarSurface);
 let holding=false,holdAge=0,restAge=1,strokes=0,journey=0,arrived=false,waveAwarded=false,retryAge=0;
 const startStroke=()=>{if(arrived||holding||restAge<.28)return false;holding=true;holdAge=0;retryAge=0;return true;};
 const releaseStroke=()=>{if(!holding)return;holding=false;if(holdAge>=.35&&holdAge<=1.6)strokes=Math.min(6,strokes+1);else retryAge=1.1;restAge=0;};
 const cancelStroke=()=>{holding=false;holdAge=0;restAge=1;retryAge=0;};
 registerInteraction?.('wave',{
  pointerDown:({raycaster})=>{if(!raycaster.intersectObject(oarSurface)[0])return false;return startStroke();},
  pointerUp:releaseStroke,
  cancel:cancelStroke
 });
 const rowButton=addHotspot('wave-calm','握住船桨',[1.1,1.4,2],()=>{if(arrived){cancelStroke();strokes=journey=0;arrived=false;vessel.position.z=0;oar.rotation.x=0;wake.visible=false;}else if(holding)releaseStroke();else startStroke();},'wave');
 const wake=new THREE.Group();vessel.add(wake);for(const side of [-1,1]){tube(wake,[[side*1.4,-.16,7],[side*1.9,-.16,9],[side*2.5,-.16,11]],.025,foam);}
 animated.push({type:'artist',scene:'wave',update:(t,dt,gentle)=>{
  const step=Math.min(dt,.1);retryAge=Math.max(0,retryAge-step);if(holding)holdAge+=step;else restAge+=step;
  journey=gentle?strokes:THREE.MathUtils.lerp(journey,strokes,Math.min(1,step*3));vessel.position.z=-journey;
  const strength=gentle?0:arrived?.15:1;crest.rotation.z=Math.sin(t*.55)*.015*strength;vessel.rotation.z=Math.sin(t*.8)*.025*strength;
  oar.rotation.x=gentle?0:holding?-.45*Math.min(1,holdAge/.8):Math.max(0,.35-restAge);wake.visible=strokes>0;wake.scale.x=1+(gentle?0:Math.sin(t*1.2)*.04);
  if(rowButton.worldPosition){vessel.updateWorldMatrix(true,true);rowButton.worldPosition.set(.2,.45,-.8);oar.localToWorld(rowButton.worldPosition);}
  rowButton.classList.toggle('is-target',holding&&holdAge>=.35&&holdAge<=1.6);
  const label=arrived?'再划一程':(retryAge>0||holding&&holdAge>1.6)?'再试一桨':holding?(holdAge>=.35?'松开船桨':'握住船桨'):'握住船桨';rowButton.setAttribute('aria-label',label);rowButton.querySelector('span').textContent=label;
  if(strokes===6&&journey>5.97&&!arrived){arrived=true;holding=false;if(!waveAwarded){waveAwarded=true;window.artTrophies?.award('wave');}}
 }});
 portal(wave,'wave-pond','回到睡莲池',-3,1.4,3,'pond','#b8d7bd');portal(wave,'wave-gallery','回到博物馆',5,2,-12,'gallery','#edce78');
 }
}
