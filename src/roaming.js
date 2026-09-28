import * as THREE from 'three';
import { buildMuseumRoom } from './museum-room.js';
import { isWheatClear } from './world-navigation.mjs';
export function buildRoaming({scene,groups,box,mat,imageTexture,addHotspot,travel,animated,only}){
 if(!only||only==='gallery'){
 const museum=buildMuseumRoom();const gallery=groups.gallery=museum.group;scene.add(gallery);
 for(const portal of museum.portals)addHotspot(portal.id,portal.label,portal.position,()=>travel(portal.destination),'gallery');
 }
 if(only==='gallery')return groups.gallery;
 const wheat=groups.wheat=new THREE.Group();scene.add(wheat);
 const sky=new THREE.Mesh(new THREE.SphereGeometry(80,48,24),new THREE.ShaderMaterial({side:THREE.BackSide,vertexShader:'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 p;void main(){float h=clamp(p.y/55.,0.,1.);float s=sin(p.x*.14+sin(p.z*.12)*2.+p.y*.3);vec3 c=mix(vec3(.28,.43,.48),vec3(.035,.09,.24),h);c+=s*.027;gl_FragColor=vec4(c,1.);}'}));wheat.add(sky);
 const gold=mat('#b49532',['#e1bd4d','#8e7d28','#c6a034']);box(wheat,90,.2,90,0,-.2,0,gold);
 const pathMat=mat('#997347',['#be974f','#607349']);box(wheat,2.8,.03,38,0,-.065,-2,pathMat);
 const lane=box(wheat,9,.035,2.8,-4.5,-.05,6,pathMat);
 const road=mat('#45494a',['#727367','#383f48']);box(wheat,60,.08,4,6,-.03,-18,road);
 const stripe=new THREE.MeshBasicMaterial({color:'#c4bd91'});for(let x=-24;x<35;x+=4)box(wheat,1.8,.015,.08,x,.02,-18,stripe);
 const wood=mat('#756044',['#af8b5a','#433b37']);box(wheat,4,.22,9,0,.02,-24,wood);
 // The last rail spans take on the red-brown of the next painting.
 const bridgeEnd=mat('#8b513e',['#ba6c46','#593d39']);
 for(const x of [-2,2]){box(wheat,.1,.12,5,x,1.2,-21,wood);box(wheat,.1,.12,5,x,1.2,-26,bridgeEnd);for(let z=-20;z>=-28;z-=2)box(wheat,.1,1.2,.1,x,.6,z,z<=-24?bridgeEnd:wood);}
 const planks=new THREE.InstancedMesh(new THREE.BoxGeometry(3.94,.018,.44),new THREE.MeshStandardMaterial({roughness:.95}),18),plankPose=new THREE.Object3D();
 for(let i=0;i<18;i++){plankPose.position.set(0,.14,-19.75-i*.49);plankPose.updateMatrix();planks.setMatrixAt(i,plankPose.matrix);planks.setColorAt(i,new THREE.Color('#89724f').lerp(new THREE.Color('#92523c'),i/17));}wheat.add(planks);
 const beyond=new THREE.Mesh(new THREE.PlaneGeometry(3.1,3.85),new THREE.MeshBasicMaterial({map:imageTexture('./assets/worlds/scream.jpg')}));beyond.position.set(0,2.7,-28);wheat.add(beyond);box(wheat,3.35,4.1,.15,0,2.7,-28.12,wood);
 addHotspot('field-scream','沿桥走进呐喊',[0,2.2,-26.8],()=>travel('scream'),'wheat');
 // A lit roadside facade links the asphalt road to the café interior.
 const cafeRed=mat('#773e2c',['#ad6647','#52352c']),cafeGreen=mat('#3a6454',['#688571','#243e34']);
 box(wheat,8,4.8,5,18,2.4,-24,cafeRed);box(wheat,8.5,.25,5.5,18,4.9,-24,wood);box(wheat,8,.15,1.5,18,.05,-20.8,wood);
 box(wheat,1.5,2.8,.12,18,1.4,-21.44,cafeGreen,true);
 const amber=new THREE.MeshBasicMaterial({color:'#dca255'});for(const x of [15.7,20.3]){box(wheat,2.2,2,.1,x,2.3,-21.42,cafeGreen);box(wheat,1.9,1.7,.1,x,2.3,-21.34,amber);box(wheat,.08,1.8,.15,x,2.3,-21.23,wood);}
 for(let i=0;i<12;i++){const awning=box(wheat,.68,.12,1.6,14.3+i*.67,3.8,-20.9,i%2?cafeGreen:cafeRed);awning.rotation.x=.12;}
 // Deep jambs and a shallow threshold read as a passage at road level.
 for(const x of [17.17,18.83])box(wheat,.16,3.02,.36,x,1.51,-21.22,wood);
 box(wheat,1.82,.16,.36,18,3.04,-21.22,wood);box(wheat,1.82,.12,.55,18,.12,-21.07,wood);
 box(wheat,.76,.7,.025,18,2.27,-21.35,amber);box(wheat,.055,.72,.05,18,2.27,-21.32,cafeGreen);
 box(wheat,.075,.24,.12,18.52,1.38,-21.3,amber);
 addHotspot('field-cafe','走进夜间咖啡馆',[18,1.7,-20.9],()=>travel('cafe'),'wheat');
 // Solid house: the bedroom window and door face the path, instead of a floating picture.
 const plaster=mat('#c8b46c',['#dfcb81','#a59258']),roofMat=mat('#5b7681',['#91a2a0','#304e64']),green=mat('#4f725c',['#88946b','#28493d']);
 box(wheat,7,.25,6,-8,.05,6,wood);box(wheat,7,4.4,.22,-8,2.25,3,plaster);box(wheat,.22,4.4,6,-11.5,2.25,6,plaster);box(wheat,.22,4.4,6,-4.5,2.25,6,plaster);
 box(wheat,2.75,4.4,.22,-10.125,2.25,9,plaster);box(wheat,2.75,4.4,.22,-5.875,2.25,9,plaster);box(wheat,1.5,1.6,.22,-8,3.65,9,plaster);
 box(wheat,1.45,2.7,.09,-8,1.5,8.85,new THREE.MeshBasicMaterial({color:'#342f21'}));box(wheat,1.5,.15,1.4,-8,.12,9.5,wood);
 const roomView=new THREE.Mesh(new THREE.PlaneGeometry(1.3,1.6),new THREE.MeshBasicMaterial({map:imageTexture('./assets/bedroom.jpg')}));roomView.position.set(-5.9,2.8,9.14);wheat.add(roomView);for(const x of [-6.62,-5.18])box(wheat,.15,1.85,.12,x,2.8,9.18,green);box(wheat,1.6,.14,.12,-5.9,3.72,9.18,green);box(wheat,1.6,.14,.12,-5.9,1.9,9.18,green);box(wheat,.08,1.7,.1,-5.9,2.8,9.2,green);
 const roofGeo=new THREE.BufferGeometry();roofGeo.setAttribute('position',new THREE.Float32BufferAttribute([-12,4.4,2.5,-4,4.4,2.5,-8,6.6,2.5,-12,4.4,9.5,-4,4.4,9.5,-8,6.6,9.5],3));roofGeo.setIndex([0,2,3,2,5,3,2,1,5,1,4,5,0,1,2,3,5,4]);roofGeo.computeVertexNormals();const roof=new THREE.Mesh(roofGeo,roofMat);roof.material.side=THREE.DoubleSide;wheat.add(roof);box(wheat,.6,2,.6,-6,5.9,4,plaster);
 box(wheat,8,.035,2.7,-4,.0,10,pathMat);addHotspot('field-room','进屋，回到卧室',[-8,1.65,9.3],()=>travel('bedroom'),'wheat');

 // Small pools belong to the thresholds; no full-scene lighting or extra signage.
 const lampMetal=new THREE.MeshStandardMaterial({color:'#51483a',roughness:.75});
 function doorwayLight(x,z,y){
  box(wheat,.28,.38,.24,x,y,z,lampMetal);box(wheat,.19,.23,.255,x,y-.015,z,amber);
  const light=new THREE.PointLight('#ffd48d',.65,4.5,2);light.position.set(x,y-.25,z+.35);wheat.add(light);
  const glow=new THREE.Mesh(new THREE.PlaneGeometry(1.8,2.5),new THREE.MeshBasicMaterial({color:'#e4b774',transparent:true,opacity:.12,depthWrite:false}));glow.rotation.x=-Math.PI/2;glow.position.set(x,.145,z+1.05);wheat.add(glow);
 }
 doorwayLight(-8,9.31,3.43);doorwayLight(18,-21.02,3.42);
 // Sparse boundary stakes mark the two decisions, leaving the walking corridor clear.
 const reflector=new THREE.MeshBasicMaterial({color:'#d2bf88'});
 for(const [x,z] of [[-2,10],[-6.7,10.85],[1.8,-16],[12,-20.15],[16.8,-20.15]]){
  box(wheat,.12,.65,.12,x,.325,z,wood);box(wheat,.145,.11,.145,x,.57,z,reflector);
 }
 // A low stone edge joins the café porch to the asphalt, without narrowing its door.
 for(const x of [16.7,19.3])box(wheat,.15,.12,.8,x,.03,-20.05,pathMat);

 const grassMat=new THREE.MeshStandardMaterial({color:'#c7a52d',roughness:1,side:THREE.DoubleSide});const wind={value:0};grassMat.onBeforeCompile=s=>{s.uniforms.windTime=wind;s.vertexShader='uniform float windTime;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.x += sin(windTime*1.6+instanceMatrix[3].x*.5+instanceMatrix[3].z*.3)*.19*pow(max(position.y+.5,0.),2.);');};
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([-.012,-.5,0,.012,-.5,0,-.008,.24,0,.008,.24,0,-.055,.23,0,.055,.23,0,-.065,.39,0,.065,.39,0,0,.56,0],3));geometry.setIndex([0,1,2,1,3,2,4,5,6,5,7,6,6,7,8]);geometry.computeVertexNormals();const count=23000,stalks=new THREE.InstancedMesh(geometry,grassMat,count),dummy=new THREE.Object3D();let n=0;let seed=1889;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<count;i++){let x=(random()-.5)*70,z=(random()-.5)*70;if(isWheatClear(x,z))continue;const h=.65+random()*.85;dummy.position.set(x,h/2-.07,z);dummy.rotation.set(0,random()*Math.PI,random()*.12-.06);dummy.scale.set(.7+random(),h,1);dummy.updateMatrix();stalks.setMatrixAt(n++,dummy.matrix);stalks.setColorAt(n-1,new THREE.Color().setHSL(.105+random()*.035,.55+random()*.25,.35+random()*.23));}stalks.count=n;wheat.add(stalks);animated.push({type:'wheat',wind});
 const birdMat=new THREE.MeshBasicMaterial({color:'#131b29'});for(let i=0;i<23;i++){const bird=new THREE.Group();const wings=[];for(const sign of [-1,1]){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,sign*.55,.1,.08,sign*.27,0,.23],3));const wing=new THREE.Mesh(geo,birdMat);wing.material.side=THREE.DoubleSide;bird.add(wing);wings.push(wing);}wheat.add(bird);animated.push({type:'crow',mesh:bird,wings,phase:i*.81});}
 wheat.add(new THREE.HemisphereLight('#b6c9db','#655024',1.15));const sun=new THREE.DirectionalLight('#ffe6ab',.8);sun.position.set(-12,15,4);wheat.add(sun);
 return wheat;
}
