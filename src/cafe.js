import * as THREE from 'three';
// A spatial interpretation of The Night Café, not a measured reconstruction.
export function buildCafe({scene,groups,box,mat,addHotspot,travel,animated,message,playCue,registerInteraction,focusTable,isTableFocused}){
 const g=groups.cafe=new THREE.Group();scene.add(g);
 const red=mat('#762b26',['#a84532','#5b2528','#c56843']),green=mat('#426f57',['#729074','#304d43']),oak=mat('#8a602e',['#bd8a43','#634024'],true),floor=mat('#9c7a37',['#c2a15b','#735a2e']),brass=new THREE.MeshStandardMaterial({color:'#b4974d',metalness:.62,roughness:.36});
 box(g,12,.2,18,0,-.15,0,floor);box(g,12,6,.2,0,3,-9,red);box(g,.2,6,18,-6,3,0,red);box(g,.2,6,18,6,3,0,red);box(g,12,.15,18,0,6,0,green);box(g,12,6,.2,0,3,9,red);
 for(const x of [-5.87,5.87]){box(g,.08,1.15,18,x,.58,0,green);box(g,.12,.09,18,x,1.2,0,brass);}box(g,12,1.15,.1,0,.58,-8.86,green);box(g,12,.09,.1,0,1.2,-8.8,brass);
 for(let x=-6;x<6;x+=.65)box(g,.012,.006,18,x,-.045,0,oak);
 // Four lamps and their soft pools of light.
 const lamps=[],bulbs=[],warmGlow=new THREE.Color('#fff5cb');for(const [x,z] of [[-1.9,-5],[1.9,-5],[-3,3],[3,3]]){
 box(g,.025,.8,.025,x,5.5,z,brass);const shade=new THREE.Mesh(new THREE.ConeGeometry(.6,.22,32,1,true),brass);shade.position.set(x,5.03,z);g.add(shade);
 const bulb=new THREE.Mesh(new THREE.SphereGeometry(.17,16,12),new THREE.MeshBasicMaterial({color:'#ffe1a0'}));bulb.position.set(x,4.92,z);g.add(bulb);bulbs.push(bulb);
 const light=new THREE.PointLight('#ffd18a',1.5,12,1.6);light.position.set(x,4.75,z);g.add(light);lamps.push(light);
 const pool=new THREE.Mesh(new THREE.CircleGeometry(2.1,48),new THREE.MeshBasicMaterial({color:'#ebc374',transparent:true,opacity:.065,depthWrite:false}));pool.rotation.x=-Math.PI/2;pool.position.set(x,-.035,z);g.add(pool);
 }
 g.add(new THREE.HemisphereLight('#cdbb87','#39291e',.85));
 // Billiards: felt, raised cushions, corner pockets and turned legs.
 box(g,3.6,.4,6,0,1.12,-1,oak,true);const felt=mat('#346b49',['#4f8152','#234d3d']);box(g,3.25,.08,5.65,0,1.36,-1,felt);
 for(const x of [-1.7,1.7])box(g,.2,.15,5.9,x,1.47,-1,oak,true);for(const z of [-3.9,1.9])box(g,3.6,.15,.2,0,1.47,z,oak,true);
 for(const x of [-1.35,1.35])for(const z of [-3.3,1.3]){const leg=new THREE.Mesh(new THREE.CylinderGeometry(.18,.24,1,16),oak);leg.position.set(x,.5,z);g.add(leg);const collar=new THREE.Mesh(new THREE.TorusGeometry(.2,.035,6,16),brass);collar.rotation.x=Math.PI/2;collar.position.set(x,.65,z);g.add(collar);}
 const dark=new THREE.MeshBasicMaterial({color:'#171e16'});for(const x of [-1.48,1.48])for(const z of [-3.62,1.62]){const pocket=new THREE.Mesh(new THREE.CircleGeometry(.17,20),dark);pocket.rotation.x=-Math.PI/2;pocket.position.set(x,1.41,z);g.add(pocket);}
 const balls=[];for(const [x,z,color] of [[.65,.9,'#eee4c9'],[-.2,-1.2,'#b93b25'],[.7,-2.5,'#d5b953']]){const ball=new THREE.Mesh(new THREE.SphereGeometry(.11,20,14),new THREE.MeshStandardMaterial({color,roughness:.3}));ball.position.set(x,1.51,z);g.add(ball);balls.push(ball);}
 const cue=box(g,.035,.035,3.1,1.45,1.63,.65,oak);cue.rotation.y=-.18;
 // The shot is driven by the player's pull, with bounded 2D ball motion.
 const tablePlane=new THREE.Plane(new THREE.Vector3(0,1,0),-1.51);
 const tablePoint=new THREE.Vector3(),pullStart=new THREE.Vector3();
 const velocities=balls.map(()=>new THREE.Vector2());
 const bounds={left:-1.48,right:1.48,back:-3.64,front:1.64};
 const aimPoints=new Float32Array(6),aimGeometry=new THREE.BufferGeometry();
 aimGeometry.setAttribute('position',new THREE.BufferAttribute(aimPoints,3));
 const aimMaterial=new THREE.LineBasicMaterial({color:'#f8d783',transparent:true,opacity:.9});
 const aimLine=new THREE.Line(aimGeometry,aimMaterial);aimLine.frustumCulled=false;g.add(aimLine);
 const powerHalo=new THREE.Mesh(new THREE.RingGeometry(.15,.19,40),new THREE.MeshBasicMaterial({color:'#f8d783',side:THREE.DoubleSide,transparent:true,opacity:.8,depthWrite:false}));
 powerHalo.rotation.x=-Math.PI/2;g.add(powerHalo);
 let aiming=false,pulling=false,rolling=false,angle=Math.PI,power=.45,shotResponded=false,response=0,windowGlow=0;
 const direction=new THREE.Vector2(),pairDelta=new THREE.Vector2();
 function redrawAim(){
  direction.set(Math.sin(angle),Math.cos(angle));
  const ball=balls[0].position;
  aimLine.visible=powerHalo.visible=aiming;
  cue.visible=!rolling;
  if(!rolling){cue.rotation.y=angle;cue.position.set(ball.x-direction.x*(1.7+power*.55),1.59,ball.z-direction.y*(1.7+power*.55));}
  if(!aiming)return;
  const length=.4+power*1.7;
  aimPoints.set([ball.x,1.55,ball.z,ball.x+direction.x*length,1.55,ball.z+direction.y*length]);
  aimGeometry.attributes.position.needsUpdate=true;
  powerHalo.position.set(ball.x,1.415,ball.z);powerHalo.scale.setScalar(1+power*1.7);
  powerHalo.material.color.setHSL(.13-power*.08,.8,.65);
 }
 function beginAim(){
  if(rolling)return false;
  aiming=true;redrawAim();return true;
 }
 function shoot(){
  if(!aiming||rolling||power<.07){aiming=false;redrawAim();return;}
  velocities[0].set(Math.sin(angle),Math.cos(angle)).multiplyScalar(1.2+power*5.3);
  aiming=pulling=false;rolling=true;shotResponded=false;redrawAim();
 }
 function planeHit(raycaster){return raycaster.ray.intersectPlane(tablePlane,tablePoint);}
 function adjustPull(raycaster){
  if(!planeHit(raycaster))return;
  const dx=pullStart.x-tablePoint.x,dz=pullStart.z-tablePoint.z;
  power=THREE.MathUtils.clamp(Math.hypot(dx,dz)/2,0,1);
  if(power>.01)angle=Math.atan2(dx,dz);
  redrawAim();
 }
 registerInteraction('cafe',{
  pointerDown({raycaster,event}){
   if(event.button!==undefined&&event.button!==0)return false;
   if(rolling||!planeHit(raycaster))return false;
   if(tablePoint.x<bounds.left-.12||tablePoint.x>bounds.right+.12||tablePoint.z<bounds.back-.12||tablePoint.z>bounds.front+.12)return false;
   pullStart.copy(tablePoint);power=0;pulling=true;beginAim();return true;
  },
  pointerMove({raycaster}){if(pulling)adjustPull(raycaster);},
  pointerUp({raycaster}){if(!pulling)return;adjustPull(raycaster);pulling=false;shoot();},
  leaveFocus(){aiming=pulling=false;redrawAim();},
  cancel(){aiming=pulling=rolling=false;velocities.forEach(v=>v.set(0,0));redrawAim();},
  keyDown({event}){
   const key=event.key.toLowerCase();
   if(!aiming){if(rolling||!isTableFocused()||!['arrowleft','arrowright','arrowup','arrowdown',' '].includes(key))return false;beginAim();if(key===' ')return true;}
   if(key==='arrowleft')angle+=.08;
   else if(key==='arrowright')angle-=.08;
   else if(key==='arrowup')power=Math.min(1,power+.06);
   else if(key==='arrowdown')power=Math.max(.08,power-.06);
   else if(key===' '){if(!event.repeat)shoot();return true;}
   else if(key==='escape'){aiming=pulling=false;}
   else return false;
   redrawAim();return true;
  }
 });
 animated.push({type:'artist',scene:'cafe',update(_t,dt,gentle){
  response=Math.max(0,response-dt*(gentle?.48:.95));
  windowGlow=Math.max(0,windowGlow-dt*(gentle?.28:.55));
  lamps.forEach((lamp,i)=>{lamp.intensity=1.5+response*(gentle?.5:.85);bulbs[i].material.color.set(cool?'#d5e9ef':'#ffe1a0').lerp(warmGlow,response*.45);});
  stars.forEach((star,i)=>{star.material.opacity=(i===0?.88:.26)+windowGlow*(i===0?.12:.7);star.scale.setScalar(1+windowGlow*(gentle?.3:.65));});
  if(!rolling||dt<=0)return;
  // Small steps keep fast balls from crossing each other between frames.
  const steps=Math.max(1,Math.ceil(dt/.008)),step=dt/steps;
  for(let n=0;n<steps;n++){
   balls.forEach((ball,i)=>{
    const v=velocities[i],dx=v.x*step,dz=v.y*step;
    ball.position.x+=dx;ball.position.z+=dz;
    ball.rotation.z-=dx/.11;ball.rotation.x+=dz/.11;
    for(const [axis,component,min,max] of [['x','x',bounds.left,bounds.right],['z','y',bounds.back,bounds.front]]){
     if(ball.position[axis]<min){ball.position[axis]=min;v[component]=Math.abs(v[component])*.82;}
     if(ball.position[axis]>max){ball.position[axis]=max;v[component]=-Math.abs(v[component])*.82;}
    }
    v.multiplyScalar(Math.exp(-1.15*step));if(v.lengthSq()<.0025)v.set(0,0);
   });
   for(let i=0;i<balls.length;i++)for(let j=i+1;j<balls.length;j++){
    pairDelta.set(balls[j].position.x-balls[i].position.x,balls[j].position.z-balls[i].position.z);
    const distance=pairDelta.length();if(distance>=.22)continue;
    if(distance<.0001)pairDelta.set(1,0);else pairDelta.divideScalar(distance);
    const overlap=(.22-distance)/2+.0001;
    balls[i].position.x-=pairDelta.x*overlap;balls[i].position.z-=pairDelta.y*overlap;
    balls[j].position.x+=pairDelta.x*overlap;balls[j].position.z+=pairDelta.y*overlap;
    const closing=(velocities[i].x-velocities[j].x)*pairDelta.x+(velocities[i].y-velocities[j].y)*pairDelta.y;
    if(closing>0){
     velocities[i].addScaledVector(pairDelta,-closing*.94);velocities[j].addScaledVector(pairDelta,closing*.94);
     if(!shotResponded){shotResponded=true;response=1;windowGlow=1;playCue('hit');window.artTrophies?.award('cafe');}
    }
   }
  }
  if(velocities.every(v=>v.lengthSq()===0)){
   rolling=false;power=.45;redrawAim();
  }
 }});
 redrawAim();
 const shotHotspot=addHotspot('cafe-shot','靠近球桌',[.65,1.65,.9],()=>{focusTable();beginAim();},'cafe');shotHotspot.dataset.singleTap='true';
 box(g,.22,.32,.08,2.5,1.7,-8.72,brass);box(g,.08,.16,.09,2.5,1.7,-8.66,green);let cool=false;addHotspot('cafe-light','换一种灯光',[2.5,1.7,-8.5],()=>{cool=!cool;lamps.forEach(l=>l.color.set(cool?'#b7d7ea':'#ffd18a'));},'cafe');
 // Tables, bent-back chairs, cups, bottle shelf and a wall clock.
 const porcelain=new THREE.MeshStandardMaterial({color:'#d5cbaa',roughness:.6});
 function chair(x,z,angle){const c=new THREE.Group();c.position.set(x,0,z);c.rotation.y=angle;g.add(c);box(c,.62,.09,.62,0,.63,0,oak);for(const xx of [-.25,.25])for(const zz of [-.25,.25])box(c,.045,.64,.045,xx,.31,zz,oak);box(c,.6,.38,.065,0,1.09,-.26,oak);for(const xx of [-.26,.26])box(c,.055,.65,.055,xx,.94,-.26,oak);}
 for(const [x,z] of [[-4.3,-5.8],[4.3,-5.8],[-4.3,2.5],[4.3,2.5]]){const top=new THREE.Mesh(new THREE.CylinderGeometry(.68,.68,.08,32),porcelain);top.position.set(x,.99,z);g.add(top);box(g,.12,1,.12,x,.5,z,brass);box(g,1,.06,.12,x,.03,z,brass);chair(x-.7,z+.65,-.4);chair(x+.5,z-.7,Math.PI);const cup=new THREE.Mesh(new THREE.CylinderGeometry(.085,.06,.16,16),porcelain);cup.position.set(x+.15,1.1,z);g.add(cup);}
 box(g,3,1.4,.8,3.7,.7,-8,oak,true);for(const y of [2.2,3.1]){box(g,3.2,.09,.42,3.8,y,-8.7,oak);for(let i=0;i<7;i++){const bottle=new THREE.Mesh(new THREE.CylinderGeometry(.075,.1,.4,12),new THREE.MeshStandardMaterial({color:i%2?'#597a49':'#79643d',roughness:.25}));bottle.position.set(2.5+i*.4,y+.25,-8.6);g.add(bottle);}}
 const clock=new THREE.Mesh(new THREE.CircleGeometry(.52,40),porcelain);clock.position.set(0,4.5,-8.84);g.add(clock);const rim=new THREE.Mesh(new THREE.TorusGeometry(.54,.045,8,40),brass);rim.position.copy(clock.position);g.add(rim);box(g,.035,.36,.025,0,4.65,-8.8,oak);const hand=box(g,.3,.03,.025,.12,4.45,-8.8,oak);hand.rotation.z=-.4;
 // A small night window connects the room to the authored starry village.
 const windowX=-1.85,windowY=4.12;
 box(g,1.3,1.7,.12,windowX,windowY,-8.78,new THREE.MeshBasicMaterial({color:'#172b50'}));
 const stars=[];for(const [dx,dy,r] of [[0,.1,.11],[-.4,.55,.045],[.35,.45,.055],[-.25,-.35,.035],[.25,-.6,.045],[.5,-.1,.032]]){const star=new THREE.Mesh(new THREE.SphereGeometry(r,12,8),new THREE.MeshBasicMaterial({color:'#f5dd98',transparent:true,opacity:.26,depthWrite:false}));star.position.set(windowX+dx,windowY+dy,-8.65);g.add(star);stars.push(star);}
 for(const x of [windowX-.7,windowX+.7])box(g,.09,1.88,.16,x,windowY,-8.63,oak);for(const y of [windowY-.94,windowY+.94])box(g,1.5,.09,.16,windowX,y,-8.63,oak);
 addHotspot('cafe-starry','推窗，走入星夜',[windowX,windowY,-8.5],()=>travel('starry'),'cafe');
 animated.push({type:'cafe-hotspot',scene:'cafe',update(){shotHotspot.worldPosition.set(balls[0].position.x,balls[0].position.y+.16,balls[0].position.z);}});
 // Two explicit doorways: museum and the field road.
 for(const [x,id,label,dest] of [[-3.8,'cafe-gallery','回到博物馆','gallery'],[0,'cafe-road','走向麦田公路','wheat']]){box(g,1.45,2.7,.12,x,1.35,-8.78,green,true);for(const xx of [x-.8,x+.8])box(g,.12,2.85,.18,xx,1.42,-8.68,oak);box(g,1.7,.12,.18,x,2.87,-8.68,oak);const knob=new THREE.Mesh(new THREE.SphereGeometry(.06,12,8),brass);knob.position.set(x+.48,1.3,-8.6);g.add(knob);addHotspot(id,label,[x,1.55,-8.5],()=>travel(dest),'cafe');}
}
