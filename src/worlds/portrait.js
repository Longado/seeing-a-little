import * as THREE from 'three';
export function buildPortraitRoom({scene,groups,box,mat,portrait,pipeModel,addHotspot,collect,respond,travel}){
 const g=groups.portrait=new THREE.Group();scene.add(g);
 const wall=mat('#4c6766',['#506c69','#486460','#546d66'],true),wood=mat('#66523b',['#957954','#423e31']),linen=mat('#c3baa1',['#dfd2b5','#a59e8b']);
 box(g,9,.2,10,0,-.15,1,wood);box(g,9,6,.18,0,3,-3,wall);for(const x of [-4.5,4.5])box(g,.15,6,10,x,3,1,wall);
 for(let x=-4.3;x<4.5;x+=.55)box(g,.009,.005,10,x,-.04,1,new THREE.MeshStandardMaterial({color:'#393a32'}));
 const painting=portrait.clone();painting.scale.setScalar(1.65);painting.position.set(0,2.8,-1.9);g.add(painting);
 // The backing stays behind the painted plane; only the perimeter projects forward.
 box(g,2.3,2.9,.1,0,2.8,-2.04,wood);
 for(const x of [-1.135,1.135])box(g,.15,2.99,.22,x,2.8,-1.97,wood,true);
 for(const y of [1.38,4.22])box(g,2.12,.15,.22,0,y,-1.97,wood,true);
 for(const x of [-1.063,1.063])box(g,.025,2.7,.04,x,2.8,-1.902,linen);
 for(const y of [1.454,4.146])box(g,2.15,.025,.04,0,y,-1.902,linen);
 for(const x of [-.85,.85]){const leg=box(g,.12,4.2,.14,x,2.1,-2.17,wood,true);leg.rotation.z=x*.1;}
 const back=box(g,.12,3,.12,0,1.4,-2.55,wood);back.rotation.x=-.2;box(g,2.65,.12,.35,0,1.33,-1.92,wood,true);box(g,.6,.16,.22,0,4.35,-1.95,wood,true);
 box(g,1.8,.14,1.2,-2.6,1.1,-.4,wood,true);for(const x of [-3.3,-1.9])for(const z of [-.85,.05])box(g,.1,1.1,.1,x,.55,z,wood);
 // Shared, feathered contact patches anchor the feet without another shadow light.
 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64;
 const shadowContext=shadowCanvas.getContext('2d'),gradient=shadowContext.createRadialGradient(32,32,2,32,32,32);
 gradient.addColorStop(0,'rgba(20,24,18,.48)');gradient.addColorStop(.35,'rgba(20,24,18,.2)');gradient.addColorStop(1,'rgba(20,24,18,0)');
 shadowContext.fillStyle=gradient;shadowContext.fillRect(0,0,64,64);
 const shadowMaterial=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}),shadowGeometry=new THREE.PlaneGeometry(1,1);
 for(const [x,z,w,d] of [[-3.3,-.85,.5,.42],[-3.3,.05,.5,.42],[-1.9,-.85,.5,.42],[-1.9,.05,.5,.42],[-1.03,-2.17,.58,.46],[1.03,-2.17,.58,.46],[0,-2.25,.48,.58]]){
  const contact=new THREE.Mesh(shadowGeometry,shadowMaterial);contact.rotation.x=-Math.PI/2;contact.position.set(x,-.037,z);contact.scale.set(w,d,1);g.add(contact);
 }
 const palette=new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.04,32),linen);palette.scale.z=.7;palette.position.set(-2.8,1.22,-.5);g.add(palette);
 for(let i=0;i<5;i++){const pigment=new THREE.Mesh(new THREE.SphereGeometry(.065,12,8),new THREE.MeshStandardMaterial({color:['#a48543','#587783','#b7784b','#c4b98d','#374f4d'][i]}));pigment.scale.y=.22;pigment.position.set(-3+i*.13,1.25,-.5);g.add(pigment);}
 const loose=pipeModel();loose.position.set(-2.2,1.22,-.25);g.add(loose);
 const placed=pipeModel();placed.scale.setScalar(.63);placed.position.set(-.15,2.65,-1.68);placed.rotation.z=-.1;g.add(placed);
 const tablePosition=loose.position.clone(),targetPosition=placed.position.clone(),returnPosition=new THREE.Vector3(.35,1.95,-.65);
 const vapor=new THREE.Group();vapor.position.set(.33,2.8,-1.62);g.add(vapor);for(let i=0;i<6;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(.05+i*.008,8,6),new THREE.MeshBasicMaterial({color:'#ddd7c2',transparent:true,opacity:.1,depthWrite:false}));m.position.y=i*.12;vapor.add(m);}
 // Light enters a deep window instead of flattening the whole room.
 box(g,.12,2.6,1.4,-4.36,3,-.5,linen);const light=new THREE.SpotLight('#ffe0a1',1.5,20,.7,.7);light.position.set(-3.8,5,3);light.target.position.set(0,2.8,-2);g.add(light,light.target);g.add(new THREE.HemisphereLight('#d6d6bf','#394a43',1.05));
 const pickup=addHotspot('portrait-room-pipe','拾起烟斗',[-2.2,1.5,-.2],collect,'portrait');const face=addHotspot('portrait-room-face','看看画中人',[0,2.65,-1.65],respond,'portrait');
 addHotspot('portrait-room-exit','回到卧室',[2.65,1.7,-1.5],()=>travel('bedroom'),'portrait');
 box(g,1.25,2.65,.1,2.65,1.32,-2.85,wood,true);box(g,.8,1.9,.08,2.65,1.35,-2.78,wall);
 let lastPipe,animation=null,returnedVisually=false,smokeStarted=-Infinity;
 const ease=t=>t*t*(3-2*t);
 function beginReturn(time=0,gentle=false){
  returnedVisually=true;
  animation=gentle?null:{kind:'return',start:time,duration:.8};
  placed.visible=true;placed.position.copy(gentle?targetPosition:returnPosition);placed.scale.setScalar(gentle ? .63 : .8);
  vapor.visible=false;
  smokeStarted=gentle?-Infinity:time+.8;
 }
 return {beginReturn,sync(state,time=0,gentle=false){
  if(lastPipe!==state.pipe){
   const previous=lastPipe;lastPipe=state.pipe;
   // Loading a room restores its saved state without replaying the action.
   if(previous!==undefined&&previous==='hidden'&&state.pipe==='held'&&!gentle)animation={kind:'pickup',start:time,duration:.55};
   else if(previous!==undefined&&state.pipe==='placed'&&!returnedVisually)beginReturn(time,gentle);
   else if(state.pipe==='hidden'){animation=null;returnedVisually=false;}
   if(state.pipe!=='placed'){smokeStarted=-Infinity;vapor.visible=false;}
   pickup.dataset.available=String(state.pipe==='hidden');
   face.setAttribute('aria-label',state.pipe==='held'?'归还烟斗':state.pipe==='placed'?'看看画中人':'看看自画像');
   face.querySelector('span').textContent=face.getAttribute('aria-label');
   face.classList.toggle('is-target',state.pipe==='held');
  }
  if(gentle){animation=null;smokeStarted=-Infinity;}
  loose.visible=state.pipe==='hidden';loose.position.copy(tablePosition);loose.scale.setScalar(1);loose.rotation.z=0;
  placed.visible=state.pipe==='placed'||returnedVisually;placed.position.copy(targetPosition);placed.scale.setScalar(.63);placed.rotation.z=-.1;
  if(animation){
   const progress=THREE.MathUtils.clamp((time-animation.start)/animation.duration,0,1),t=ease(progress);
   if(animation.kind==='pickup'){
    loose.visible=progress<1;loose.position.y+=Math.sin(progress*Math.PI/2)*.35;loose.position.z+=t*.15;
    loose.rotation.z=-t*.15;loose.scale.setScalar(1-.9*Math.max(0,(progress-.55)/.45));
   }else{
    placed.visible=true;placed.position.lerpVectors(returnPosition,targetPosition,t);placed.position.y+=Math.sin(progress*Math.PI)*.14;
    placed.scale.setScalar(.8-.17*t);placed.rotation.z=-.1*t;
   }
   if(progress===1)animation=null;
  }
  // A brief plume belongs to the completed action, not every revisit.
  const smokeAge=time-smokeStarted;
  vapor.visible=!gentle&&state.pipe==='placed'&&smokeAge>=0&&smokeAge<3;
  const visibleSmokeAge=vapor.visible?smokeAge:0;
  vapor.children.forEach((m,i)=>{
   const rise=((visibleSmokeAge*.2+i*.12)%.8);
   m.position.set(Math.sin(time*.7+i)*.025,rise,0);
   m.material.opacity=.13*(1-rise/.8)*(1-visibleSmokeAge/3);
  });
 }};
}
