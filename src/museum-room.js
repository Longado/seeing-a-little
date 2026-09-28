import { WORLD_CATALOG } from './world-catalog.mjs';
import * as THREE from 'three';
// One authored museum used by both the entrance and the walking view.
export function buildMuseumRoom({onLoad=()=>{},anisotropy=4}={}){
 const group=new THREE.Group();
 const wall=new THREE.MeshStandardMaterial({color:'#afa68f',roughness:.94});
 const dark=new THREE.MeshStandardMaterial({color:'#343b37',roughness:.85});
 const bronze=new THREE.MeshStandardMaterial({color:'#96734a',metalness:.68,roughness:.3});
 const floor=new THREE.MeshStandardMaterial({color:'#77776b',roughness:.3,metalness:.25});
 function box(w,h,d,x,y,z,mat){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;group.add(o);return o;}
 box(30,.25,46,0,-.15,-8,floor);box(26,10,.5,0,5,-16,wall);
 box(.6,10,34,-13,5,-1,wall);box(.6,10,34,13,5,-1,wall);
 for(let z=-12;z<=12;z+=8){for(const x of [-10,10]){box(1,9,1,x,4.5,z,wall);box(1.5,.3,1.5,x,.15,z,bronze);}box(19,.65,1,0,8.8,z,dark);}
 for(let x=-9;x<=9;x+=3){box(.12,.15,33,x,9,-1,bronze);}
 const glow=new THREE.MeshBasicMaterial({color:'#ffdfaa'});box(5,.03,24,0,9,-2,glow);
 for(let z=-12;z<=12;z+=8){const light=new THREE.PointLight('#ffe0ac',1.1,19,2);light.position.set(0,7,z);group.add(light);}
 group.add(new THREE.HemisphereLight('#c2d4d3','#484034',1.3));
 const sun=new THREE.DirectionalLight('#ffdfac',2.4);sun.position.set(-5,12,7);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-18,right:18,top:18,bottom:-18,near:.5,far:65});sun.shadow.bias=-.001;group.add(sun);
 const loader=new THREE.TextureLoader();
 function painting(url,x,z,w,h,extras=true){const frame=box(w+.3,h+.3,.18,x,3.6,z,bronze);const tex=loader.load(url,onLoad);tex.encoding=THREE.sRGBEncoding;tex.anisotropy=anisotropy;const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex}));m.position.set(x,3.6,z+.11);group.add(m);if(extras)box(.55,.06,.025,x,1.8,z+.12,glow);const l=new THREE.PointLight('#ffe3b2',.7,7);l.position.set(x,6,z+2);if(extras)group.add(l);return {mesh:m,frame,texture:tex};}
 const leftPainting=painting('./assets/bedroom.jpg',-4.7,-15.65,5.1,4);painting('./assets/cafe.jpg',4.7,-15.65,5.1,4);
 const portals=[{id:'gallery-cafe',label:'走进夜间咖啡馆',position:[4.7,3.6,-15.4],destination:'cafe'},{id:'gallery-bedroom',label:'走进卧室',position:[-4.7,3.6,-15.4],destination:'bedroom'}];
 function sideArt(id,label,path,x,z,w,h,destination){const holder=new THREE.Group();group.add(holder);const art=painting(path,0,0,w,h,false);group.remove(art.mesh,art.frame);holder.add(art.mesh,art.frame);holder.position.set(x,0,z);holder.rotation.y=x<0?Math.PI/2:-Math.PI/2;portals.push({id,label,position:[x+(x<0?.2:-.2),3.6,z],destination});}
 sideArt('gallery-portrait','走近自画像','./assets/worlds/portrait.jpg',-12.6,-5,2.8,3.5,'portrait');sideArt('gallery-scream','走进呐喊','./assets/worlds/scream.jpg',12.6,-5,2.8,3.5,'scream');
 // New worlds live on the same museum walls as the original entrances.
 for(const [id,x,z] of [['rain',12.6,1],['sunday',-12.6,8]]){
  const work=WORLD_CATALOG.find(w=>w.id===id);if(work?.ready)sideArt('gallery-'+id,'走进'+work.name,work.image,x,z,3.2,2.4,id);
 }
 box(6,.25,1.6,0,.95,-4,dark);for(const x of [-2.3,2.3])box(.2,.9,1.1,x,.4,-4,bronze);
 // A quiet foreground plinth creates depth without crowding the paintings.
 box(1.4,1.6,1.4,7,.8,2,wall);const sculpture=new THREE.Mesh(new THREE.TorusGeometry(.65,.13,18,70),bronze);sculpture.position.set(7,2.6,2);sculpture.rotation.y=-.5;group.add(sculpture);
 for(const portal of portals){const work=WORLD_CATALOG.find(w=>w.id===portal.destination);if(work)portal.label='走进'+work.name;}
 return {group,leftPainting,portals};
}
