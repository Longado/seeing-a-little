import * as THREE from 'three';

// Generated albedo assets. Each scene owns its texture so normal eviction frees it.
export function paintedMaterial(kind,repeat=[1,1]){
 const stone=kind==='stone';
 const material=new THREE.MeshStandardMaterial({color:stone?'#737b7c':'#6b8065',roughness:stone?.58:.88,metalness:stone?.08:0});
 const map=new THREE.TextureLoader().load(`./assets/materials/${stone?'rain-paving':'painted-wood'}-v1.jpg`,()=>{
  material.color.set('#ffffff');material.needsUpdate=true;
 },undefined,()=>{
  // The scene remains readable with its base color if an asset cannot load.
  material.map=null;material.bumpMap=null;material.needsUpdate=true;map.dispose();
 });
 map.encoding=THREE.sRGBEncoding;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(...repeat);map.anisotropy=4;
 material.map=map;material.bumpMap=map;material.bumpScale=stone?.018:.006;
 return material;
}
