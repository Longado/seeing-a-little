import * as THREE from 'three';
export function addSceneDetails({groups,box,mat,tube}){
 if(groups.bedroom){
 const room=groups.bedroom,wood=mat('#846b35',['#b3944c','#574727']),linen=mat('#d5cfaa',['#ede5c5','#a5ad94']);
 box(room,2.6,.13,.46,-1,2.38,-3.55,wood,true);for(const x of [-2.52,.5]){box(room,.055,2.6,.055,x,3.75,-3.5,wood);}
 tube(room,[[-4.65,3.5,-1.55],[-4.65,3.42,-1.25],[-4.65,2.7,-1.25]],.07,linen);
 const rug=mat('#8b7660',['#b09870','#5b6a60']);box(room,2.1,.025,2.6,-.7,.025,2.2,rug);for(let x=-1.7;x<.4;x+=.09)box(room,.018,.01,.18,x,.045,3.56,linen);
 }
 if(groups.wheat){
 const wheat=groups.wheat,trim=mat('#685942',['#9f8862','#443d32']),stone=mat('#827d67',['#aaa28b','#595d52']),blue=mat('#405d65',['#6f8990','#283f47']);
 // Eaves, slate courses, door boards and chimney cap give the house readable construction.
 for(const x of [-12,-4])box(wheat,.16,.15,7.2,x,4.4,6,trim);box(wheat,.18,.16,7.25,-8,6.65,6,blue);
 for(let z=2.6;z<9.5;z+=.42){tube(wheat,[[-12,4.42,z],[-8,6.64,z],[-4,4.42,z]],.025,blue);}
 for(const x of [-8.68,-7.32])box(wheat,.12,2.9,.16,x,1.55,9.1,trim);box(wheat,1.55,.14,.16,-8,3.02,9.1,trim);
 for(let x=-8.6;x<-7.35;x+=.18)box(wheat,.018,2.55,.035,x,1.5,8.94,trim);box(wheat,.84,.14,.84,-6,6.94,4,stone);
 for(const x of [-7.0,-4.8]){const shutter=box(wheat,.48,1.7,.08,x,2.8,9.15,blue);for(let y=2.1;y<3.6;y+=.16)box(wheat,.45,.025,.1,x,y,9.21,trim);}
 for(let i=0;i<5;i++)box(wheat,1.3,.07,.4,-8,.05,9.6+i*.55,stone);
 }
 if(groups.scream){
 const bridge=groups.scream,rail=new THREE.MeshStandardMaterial({color:'#584638',roughness:.9});
 for(let z=-13.8;z<16.5;z+=.55){box(bridge,3.92,.014,.018,0,-.16,z,rail);for(const x of [-1.75,1.75]){const bolt=new THREE.Mesh(new THREE.SphereGeometry(.025,6,4),rail);bolt.position.set(x,-.14,z);bridge.add(bolt);}}
 // Layered silhouettes suggest the fjord beyond the bridge, without text overlays.
 for(let i=0;i<3;i++){const shape=new THREE.Shape();shape.moveTo(-18,-3);shape.lineTo(-18,0);for(let x=-18;x<=18;x+=2)shape.lineTo(x,Math.sin(x*.27+i)*.65+i*.45);shape.lineTo(18,-3);shape.closePath();const m=new THREE.Mesh(new THREE.ShapeGeometry(shape),new THREE.MeshBasicMaterial({color:['#294248','#355052','#476363'][i],side:THREE.DoubleSide}));m.position.set(0,-1-i*.2,-13-i*2);bridge.add(m);}
 }
}
