import * as THREE from 'three';
import { paintedMaterial } from '../painted-materials.js';

// Authored spatial interpretations; no physics or external model dependencies.
export function buildExtendedWorld({scene,groups,box,mat,addHotspot,travel,animated,registerInteraction,playCue,only}){
 const id=only;if(!['bridge','rain','sunday'].includes(id))return null;
 const g=groups[id]=new THREE.Group();g.userData.id=id;scene.add(g);
 let seed=1899;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 const basic=color=>new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide});
 const solid=color=>mat(color,[color]);
 const mesh=(geometry,material,x=0,y=0,z=0,parent=g)=>{const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);parent.add(m);return m;};
 const tube=(points,r,material,parent=g)=>mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),32,r,6,false),material,0,0,0,parent);
 const sphere=(x,y,z,r,material,parent=g)=>mesh(new THREE.SphereGeometry(r,12,8),material,x,y,z,parent);
 const sky=mesh(new THREE.SphereGeometry(70,24,16),new THREE.MeshBasicMaterial({color:id==='rain'?'#8b969c':'#b5c4ab',side:THREE.BackSide}));
 g.add(new THREE.HemisphereLight('#eee6ce','#42574c',1.4));
 const hotspot=(key,label,p,fn)=>addHotspot(`${id}-${key}`,label,p,fn,id);
 const award=()=>{const earned=window.artTrophies?.award(id);if(earned)playCue?.('success');return earned;};
 // Bounded, authored reflections: one translucent surface, no second scene render.
 function waterSurface(width,depth,x,y,z,isPuddle=false){
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,
   uniforms:{time:{value:0},reveal:{value:isPuddle?0:1},puddle:{value:isPuddle?1:0},base:{value:new THREE.Color(isPuddle?'#9eafb3':'#537b75')}},
   vertexShader:`varying vec2 waterUV;varying vec3 waterPosition;void main(){waterUV=uv;vec4 world=modelMatrix*vec4(position,1.);waterPosition=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}`,
   fragmentShader:`
    uniform float time,reveal,puddle;uniform vec3 base;varying vec2 waterUV;varying vec3 waterPosition;
    float line(float p,float width){return 1.-smoothstep(width,width+.045,abs(p));}
    void main(){
     vec2 uv=waterUV,center=uv-.5;float radial=length(center*2.);
     float shoreline=puddle>.5?1.-smoothstep(.76,1.,radial):(1.-smoothstep(.42,.5,abs(center.x)))*(1.-smoothstep(.46,.5,abs(center.y)));
     if(shoreline<.005)discard;
     float wave=sin(waterPosition.z*10.+time*.85)*.018+sin(waterPosition.x*7.-time*.6)*.012;
     vec3 shade=base;float reflected=0.;
     if(puddle>.5){
      vec2 p=uv+vec2(wave,0.);float stem=(1.-smoothstep(.012,.025,abs(p.x-.5)))*smoothstep(.12,.2,p.y)*(1.-smoothstep(.74,.82,p.y));
      float lantern=(1.-smoothstep(.06,.09,abs(p.x-.5)))*(1.-smoothstep(.075,.105,abs(p.y-.78)));
      reflected=max(stem,lantern);shade=mix(shade,vec3(.2,.28,.3),stem*reveal*.72);shade=mix(shade,vec3(.69,.7,.49),lantern*reveal*.8);
      float rings=0.;for(int i=0;i<4;i++){float k=float(i);vec2 origin=vec2(.24+mod(k*.37,.5),.26+mod(k*.23,.5));float age=fract(time*.22+k*.27);float radius=length((uv-origin)*vec2(1.,.72));rings+=line(radius-age*.34,.002)*(1.-age)*.13;}
      shade+=rings*shoreline;
     }else{
      float x=waterPosition.x+wave*2.;float arch=.65+1.8*(1.-pow(x/8.,2.));float z=waterPosition.z;
      float rail=max(line(z-(-3.9+(arch+.5)*.8),.075),line(z-(-3.9+(arch+1.05)*.8),.075));
      float post=(1.-smoothstep(.025,.055,abs(fract((x+8.)/1.5)-.5)))*step(-3.9+arch*.8,z)*(1.-step(-3.9+(arch+1.05)*.8,z));
      reflected=max(rail,post)*(1.-smoothstep(7.5,8.,abs(x)));shade=mix(shade,vec3(.23,.4,.32),reflected*.52);
      float leafBands=sin(x*2.8+sin(z*1.7))*.5+.5;shade=mix(shade,vec3(.36,.48,.34),leafBands*.15);
     }
     shade+=sin(waterPosition.z*17.+time*.6)*.008;
     gl_FragColor=vec4(shade,shoreline*(puddle>.5 ? .76 : .9));
     #include <tonemapping_fragment>
     #include <encodings_fragment>
    }`});
  const surface=mesh(new THREE.PlaneGeometry(width,depth),material,x,y,z);surface.rotation.x=-Math.PI/2;return material;
 }
 let drag=null;
 const rayHit=(raycaster,objects)=>!!raycaster.intersectObjects(objects,true).length;
 function bind(objects,change){
  registerInteraction?.(id,{
   pointerDown:({raycaster,pointer,camera})=>{if(!rayHit(raycaster,objects))return false;drag={x:pointer.x,y:pointer.y};return true;},
   pointerMove:({pointer,camera})=>{if(!drag)return false;const dx=pointer.x-drag.x,dy=pointer.y-drag.y;drag={x:pointer.x,y:pointer.y};change(dx,dy);return true;},
   pointerUp:()=>{const owned=!!drag;drag=null;return owned;},cancel:()=>{drag=null;}
  });
 }
 let camera;
 if(id==='bridge'){
  camera={position:[0,2.7,12],target:[0,1,-4]};
  const bridgeWood=paintedMaterial('wood',[.3,1.6]),green=solid('#527c66'),bank=solid('#637e51'),water=new THREE.MeshStandardMaterial({color:'#5d807b',metalness:.32,roughness:.33,side:THREE.DoubleSide});
  box(g,100,.3,120,0,-.45,-5,bank);box(g,16,.12,80,0,-.2,-5,water);
  for(const side of [-1,1])for(let i=0;i<6;i++){const shrub=sphere(side*(10.5+random()*3),.3,5+i*3,1.2+random()*.5,bank);shrub.scale.set(1,.6,1.2);}
  const arch=new THREE.Group();g.add(arch);const bridgeWater=waterSurface(16,80,0,-.125,-5);
  for(let i=0;i<33;i++){const x=-8+i*.5,y=.65+1.8*(1-(x/8)**2);box(arch,.49,.13,2.4,x,y,-5,bridgeWood);if(i%3===0)for(const z of [-6.1,-3.9])box(arch,.09,1.1,.09,x,y+.55,z,bridgeWood);}
  for(const z of [-6.1,-3.9])for(const h of [.5,1.05]){const p=[];for(let i=0;i<33;i++){const x=-8+i*.5;p.push([x,.65+1.8*(1-(x/8)**2)+h,z]);}tube(p,.075,bridgeWood,arch);}
  // Branches and suspended leaf clusters frame the clear bridge silhouette.
  for(let i=0;i<16;i++){const x=(i%2?1:-1)*(9+random()*5),z=-17+random()*20,h=5+random()*3;box(g,.22,h,.22,x,h/2,z,green);for(let j=0;j<6;j++){const dx=Math.sin(j)*2,dz=Math.cos(j)*2; tube([[x,h,z],[x+dx,h-.4,z+dz],[x+dx*1.1,h-3,z+dz]],.025,green);for(let k=0;k<4;k++){const leaf=sphere(x+dx,h-.5-k*.7,z+dz,.38,bank);leaf.scale.set(.55,1.7,.7);}}}
  for(let i=0;i<65;i++){const leaf=mesh(new THREE.CircleGeometry(.15+random()*.2,12),green,(random()-.5)*14,.01,-17+random()*25);leaf.rotation.x=-Math.PI/2;}
  const paleFlower=basic('#e4cfbd');
  for(let i=0;i<26;i++){const x=(random()-.5)*13,z=9+random()*23,r=.22+random()*.24;const pad=mesh(new THREE.CircleGeometry(r,14,0,Math.PI*1.88),green,x,-.11,z);pad.rotation.x=-Math.PI/2;if(i%5===0){const bloom=sphere(x,-.01,z,.11,paleFlower);bloom.scale.y=.45;}}
  let offset=-2.4,seenLeft=false,aligned=false,spent=0,earned=false;
  const align=delta=>{offset=THREE.MathUtils.clamp(offset+delta,-3,3);seenLeft ||=Math.abs(offset)>1.5;camera.position[0]=offset;camera.target[0]=offset*.25;aligned=Math.abs(offset)<.24;};align(0);
  bind([arch],dx=>align(dx*5));
  hotspot('left','向左找一找',[-4,1,3],()=>align(-.6));hotspot('right','向右找一找',[4,1,3],()=>align(.6));
  const marker=mesh(new THREE.RingGeometry(.15,.18,32),new THREE.MeshBasicMaterial({color:'#e3d6a4',transparent:true,opacity:.35,depthWrite:false}),0,.05,1);marker.rotation.x=-Math.PI/2;
  animated.push({type:'artist',scene:id,update:(t,dt,gentle=false)=>{bridgeWater.uniforms.time.value=gentle?0:t;spent=aligned&&seenLeft?spent+dt:0;marker.material.opacity=THREE.MathUtils.lerp(marker.material.opacity,aligned ? .75 : .2,1-Math.exp(-dt*4));marker.material.color.set(aligned?'#f4eacb':'#94a889');if(spent>1.5&&!earned){earned=true;award();}}});
  hotspot('exit','回到睡莲池',[-7,1.4,5],()=>travel('pond'));
  hotspot('rain','穿过雨帘',[7,1.5,-7],()=>travel('rain'));
 }
 if(id==='rain'){
  camera={position:[0,2.5,12],target:[0,1.7,-7]};
  const stone=solid('#aaa396'),roof=solid('#5d656b'),paving=paintedMaterial('stone',[12,27]),dark=solid('#36434a'),trim=solid('#bdb7a6'),iron=solid('#394747');
  box(g,45,.2,100,0,-.2,-5,paving);
  for(const side of [-1,1])for(let i=0;i<5;i++){
   const x=side*(10+i*.35),z=1-i*8,h=8+(i%3)*1.2;box(g,7,h,7,x,h/2,z,stone);box(g,7.6,.25,7.5,x,h,z,roof);
   const top=mesh(new THREE.ConeGeometry(5,2.2,4),roof,x,h+1.1,z);top.rotation.y=Math.PI/4;
   for(let row=0;row<3;row++)for(let c=0;c<3;c++){const wx=x-2+c*2;box(g,.85,1.25,.06,wx,2+row*2.1,z+3.54,dark);box(g,1.13,.1,.3,wx,1.35+row*2.1,z+3.62,stone);}
   // The camera looks down the street, so the inhabited facade must face inward.
   const facade=new THREE.Group();facade.position.set(x-side*3.54,0,z);facade.rotation.y=-side*Math.PI/2;g.add(facade);
   for(const y of [2.8,5.05,7.25])if(y<h)box(facade,7.1,.1,.2,0,y,.06,trim);
   for(let row=0;row<3;row++)for(let c=0;c<3;c++){
    const wx=-2.1+c*2.1,wy=1.65+row*2.25;
    box(facade,1.13,1.6,.1,wx,wy,.025,trim);box(facade,.88,1.35,.08,wx,wy,.1,dark);
    box(facade,.045,1.35,.035,wx,wy,.16,trim);box(facade,1.2,.1,.32,wx,wy-.82,.14,trim);
    if(row===1&&i<3){
     for(const y of [wy-.62,wy-.1])box(facade,1.22,.035,.035,wx,y,.38,iron);
     for(const dx of [-.5,-.17,.17,.5])box(facade,.025,.55,.035,wx+dx,wy-.36,.38,iron);
    }
   }
   box(facade,1.3,2.2,.13,0,1.05,.18,iron);box(facade,.035,2.05,.025,0,1.05,.26,trim);
   box(facade,1.65,.17,.4,0,2.24,.22,trim);box(facade,7.1,.2,1.1,0,-.015,.45,stone);
  }
  const lamp=solid('#364545');box(g,.13,5,.13,-3,2.5,-2,lamp);box(g,.6,.8,.6,-3,5,-2,lamp);box(g,.4,.55,.62,-3,5,-2,basic('#d3c99a'));
  function umbrella(x,y,z,color){const u=new THREE.Group();u.position.set(x,y,z);g.add(u);const canopy=mesh(new THREE.SphereGeometry(1.35,16,8,0,Math.PI*2,0,Math.PI*.44),solid(color),0,0,0,u);canopy.scale.y=.32;box(u,.045,1.9,.045,0,-.7,0,lamp);for(let i=0;i<8;i++){const a=i*Math.PI/4;tube([[0,.4,0],[Math.cos(a)*.75,.29,Math.sin(a)*.75],[Math.cos(a)*1.3,.06,Math.sin(a)*1.3]],.012,lamp,u);}return u;}
  function person(x,z,color){
   const coat=solid(color);const torso=mesh(new THREE.CylinderGeometry(.24,.36,1.12,10),coat,x,1.04,z);torso.scale.z=.7;
   const shoulders=sphere(x,1.53,z,.28,coat);shoulders.scale.set(1,.45,.75);
   sphere(x,1.88,z,.18,solid('#b6a28d'));
   mesh(new THREE.CylinderGeometry(.25,.25,.05,12),dark,x,2.03,z);mesh(new THREE.CylinderGeometry(.16,.18,.17,12),dark,x,2.13,z);
   for(const dx of [-.16,.16]){mesh(new THREE.CylinderGeometry(.075,.085,.55,8),dark,x+dx,.27,z);const shoe=sphere(x+dx,.035,z+.06,.105,dark);shoe.scale.set(.8,.5,1.6);}
   for(const dx of [-.3,.3]){const arm=mesh(new THREE.CylinderGeometry(.09,.075,.75,8),coat,x+dx,1.15,z);arm.rotation.z=dx*.45;}
   umbrella(x,2.6,z,'#59666a');
  }
  person(-2,-5,'#4b5151');person(-1,-5.5,'#686765');person(4,-14,'#535958');person(-5,-20,'#797773');
  const held=umbrella(0,2.6,4,'#334c57');
  const puddleWater=waterSurface(4.6,3.3,-3,.015,1,true);
  const rainPositions=new Float32Array(650*3);for(let i=0;i<650;i++){rainPositions[i*3]=(random()-.5)*30;rainPositions[i*3+1]=random()*12;rainPositions[i*3+2]=-28+random()*40;}
  const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(rainPositions,3));const drops=new THREE.Points(rainGeo,new THREE.PointsMaterial({color:'#c6d0d0',size:.035,transparent:true,opacity:.55}));g.add(drops);
  let shift=0,opened=false,noticed=false,reflectionHotspot;const move=delta=>{shift=THREE.MathUtils.clamp(shift+delta,-3,3);held.position.x=shift;opened ||=Math.abs(shift)>1.7;if(reflectionHotspot)reflectionHotspot.dataset.available=String(opened);if(opened&&noticed)award();};
  bind([held],dx=>move(dx*6));hotspot('umbrella','移开雨伞',[0,2.2,4],()=>move(shift>1.7?-2:1));
  reflectionHotspot=hotspot('reflection','看看倒影',[-3,.15,1],()=>{if(opened){noticed=true;award();}});reflectionHotspot.dataset.available='false';
  animated.push({type:'artist',scene:id,update:(t,dt,gentle=false)=>{for(let i=0;i<650;i++){const y=i*3+1;rainPositions[y]-=(gentle?0:dt)*3.5;if(rainPositions[y]<0)rainPositions[y]=12;}rainGeo.attributes.position.needsUpdate=true;puddleWater.uniforms.time.value=gentle?0:t;puddleWater.uniforms.reveal.value=gentle?(opened?1:0):THREE.MathUtils.lerp(puddleWater.uniforms.reveal.value,opened?1:0,1-Math.exp(-dt*3));}});
  hotspot('exit','回到博物馆',[-5,1.4,7],()=>travel('gallery'));hotspot('park','去河边走走',[5,1.4,-8],()=>travel('sunday'));
 }
 if(id==='sunday'){
  camera={position:[0,3.2,14],target:[0,1,-5]};
  const content=new THREE.Group();g.add(content);const lawn=solid('#92a75f'),blue=solid('#83a9ae'),trunk=solid('#656548');
  box(content,38,.25,40,0,-.3,-8,lawn);box(content,14,.09,38,-13,-.12,-8,blue);
  for(const p of [[-4,-12],[3,-10],[8,-5],[10,5]]){box(content,.55,9,.55,p[0],4.5,p[1],trunk);const crown=sphere(p[0],8,p[1],4,solid('#5f7955'),content);crown.scale.y=.65;}
  const colors=['#d3b384','#536773','#b08d74','#e0d6b1','#657b72'];
  const contactMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,vertexShader:'varying vec2 shadowUV;void main(){shadowUV=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 shadowUV;void main(){float radius=length((shadowUV-.5)*2.);gl_FragColor=vec4(.16,.22,.12,(1.-smoothstep(.05,1.,radius))*.3);}' });
  const contactGeometry=new THREE.PlaneGeometry(1.8,1.1);
  for(let i=0;i<16;i++){const x=-3+random()*12,z=-17+random()*21,color=solid(colors[i%5]);const shadow=mesh(contactGeometry,contactMaterial,x+.16,.055,z+.1,content);shadow.rotation.x=-Math.PI/2;if(i%2===0)mesh(new THREE.ConeGeometry(.5,1.5,10),color,x,.85,z,content);else box(content,.5,1.2,.36,x,1,z,color);sphere(x,1.8,z,.18,solid('#c3ad86'),content);const hat=mesh(new THREE.CylinderGeometry(.35,.35,.06,12),color,x,1.98,z,content);if(i%4===0){const parasol=mesh(new THREE.ConeGeometry(.9,.38,16),solid('#d0c28b'),x+.4,2.4,z,content);box(content,.03,1,.03,x+.4,1.7,z,trunk);}}
  for(const x of [-6,-1]){box(content,2.2,.13,.55,x,.65,4,trunk);box(content,2.2,.65,.1,x,1,4.25,trunk);for(const dx of [-.8,.8])box(content,.1,.65,.4,x+dx,.3,4,trunk);}
  const dots=new THREE.InstancedMesh(new THREE.SphereGeometry(.047,5,4),new THREE.MeshBasicMaterial(),4800),dummy=new THREE.Object3D(),color=new THREE.Color();
  for(let i=0;i<4800;i++){const x=-6+random()*19,z=-23+random()*31;dummy.position.set(x,.01+random()*.025,z);dummy.scale.set(1,.2,1);dummy.updateMatrix();dots.setMatrixAt(i,dummy.matrix);color.set(['#c4bf73','#719268','#92a764','#ddcb81','#5e836f'][i%5]);dots.setColorAt(i,color);}content.add(dots);
  // Continuous ground hit area avoids requiring a precise hit on a tiny color dot.
  const groundDrag=mesh(new THREE.PlaneGeometry(25,36),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,colorWrite:false,side:THREE.DoubleSide}),3,.07,-8);groundDrag.rotation.x=-Math.PI/2;
  let distance=0,near=false,far=false,seated=false;const distanceChange=delta=>{distance=THREE.MathUtils.clamp(distance+delta,0,1);near ||=distance>.8;far ||=near&&distance<.2;camera.position[2]=14-distance*8;camera.position[1]=(seated?2.4:3.2)-distance*1.4;camera.target[2]=-5+distance*4;if(near&&far)award();};
  bind([groundDrag],(dx,dy)=>distanceChange(-dy*.85));
  hotspot('near','走近看色点',[-1.4,.8,1],()=>distanceChange(.35));hotspot('far','退后看颜色',[1.4,.8,1],()=>distanceChange(-.35));
  hotspot('sit','坐一会儿',[-1,1,4],()=>{seated=!seated;distanceChange(0);});
  hotspot('exit','乘舟去睡莲池',[-7,1.2,5],()=>travel('pond'));
 }
 return {camera};
}
