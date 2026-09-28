import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
export function refineBedroom({group,box,mat}){
 const oak=mat('#ad883c',['#c8a85d','#8f7137']),linen=mat('#ded7b9',['#ede3c9','#c7c6ae']);
 const round=(w,h,d,x,y,z,m,r=.08)=>{const o=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,3,r),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;group.add(o);return o;};
 for(const x of [1.51,4.19]){round(.14,.26,4.95,x,.65,-.55,oak);for(const z of [-2.9,1.8])round(.13,.55,.13,x,.29,z,oak,.035);}
 for(const z of [-3.03,1.9])round(2.6,.1,.12,2.85,z<0?1.91:1.25,z,oak,.045);
 for(const x of [2.2,3.45]){const p=round(1.12,.29,.82,x,1.33,-2.27,linen,.13);p.rotation.y=x<3?-.06:.07;}
 // Geometric cloth folds remain visible under both quilt colour presets.
 const geo=new THREE.PlaneGeometry(2.72,3.85,36,48);geo.rotateX(-Math.PI/2);const p=geo.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),edge=Math.max(0,Math.abs(x)-1.17);p.setY(i,.022*Math.sin(z*9+x*2)+.016*Math.sin(x*13+z*3)-edge*1.2+Math.exp(-Math.pow((z+1.64)/.18,2))*.09);}
 geo.computeVertexNormals();const quilt=new THREE.Mesh(geo,mat('#b94730',['#bc5940','#9a3c30','#ce7050']));quilt.position.set(2.85,1.3,.03);quilt.castShadow=quilt.receiveShadow=true;group.add(quilt);
 // Basin body, pitcher lip and handle replace the impression of disconnected rings.
 const bowl=new THREE.Mesh(new THREE.SphereGeometry(.33,24,14,0,Math.PI*2,Math.PI/2,Math.PI/2),linen);bowl.scale.y=.45;bowl.position.set(-3.8,1.6,-2.9);group.add(bowl);
 const handle=new THREE.Mesh(new THREE.TorusGeometry(.13,.025,8,24),linen);handle.position.set(-3.92,1.77,-3.08);group.add(handle);
 for(const x of [-4.25,-2.45])round(.1,.12,1.1,x,.55,-2.8,oak,.025);round(2,.25,.1,-3.35,1.21,-2.16,oak,.035);
 const knob=new THREE.Mesh(new THREE.SphereGeometry(.045,12,8),oak);knob.position.set(-3.35,1.21,-2.06);group.add(knob);
 // Hinges and window reveal establish thickness around the opening.
 for(const y of [2.7,4.8])box(group,.045,.17,.08,-2.1,y,-3.55,oak);
 for(const x of [-2.13,.13])round(.13,2.8,.28,x,3.75,-3.67,oak,.035);
 return quilt;
}
