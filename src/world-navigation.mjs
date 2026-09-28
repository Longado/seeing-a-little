export function isWheatClear(x,z){
 return (x>13&&x<23&&z>-27&&z<-19)||Math.abs(x)<1.7 || Math.abs(z+18)<2.5 || (x>-12.3&&x<-3.7&&z>2.3&&z<10.5) || (x>-9&&x<1.5&&z>8.5&&z<11.5) || (x>-9&&x<1.5&&Math.abs(z-6)<1.7) || (Math.abs(x)<2.5&&z<-19);
}
export function stepWalk(scene,position,dx,dz){
 const bounds=scene==='scream'?[-1.65,1.65,-5.5,15]:scene==='cafe'?[-5.4,5.4,-8,8]:scene==='gallery'?[-11.8,11.8,-14.1,14]:[-25,25,-29,25];
 const blocked=(x,z)=>scene==='scream'?false:scene==='cafe'?((Math.abs(x)<2.05&&z>-4.3&&z<2.3)||([[ -4.3,-5.8],[4.3,-5.8],[-4.3,2.5],[4.3,2.5]].some(([cx,cz])=>Math.hypot(x-cx,z-cz)<1.15))||(x>2&&z<-7.2)):scene==='wheat'?((x>-11.9&&x<-4.1&&z>2.6&&z<9.5)||(x>13.8&&x<22.2&&z>-27&&z<-20.7)):((Math.abs(x)<3.4&&Math.abs(z+4)<1.2)||(Math.abs(x-7)<1.15&&Math.abs(z-2)<1.15)||([-12,-4,4,12].some(p=>Math.abs(z-p)<.9)&&Math.abs(Math.abs(x)-10)<.9));
 let x=Math.max(bounds[0],Math.min(bounds[1],position.x+dx)),z=position.z;if(blocked(x,z))x=position.x;
 z=Math.max(bounds[2],Math.min(bounds[3],position.z+dz));if(blocked(x,z))z=position.z;return {x,z};
}

export function worldEntryPose(scene,from,kind='menu'){
 const defaults={gallery:[8,1.8,12,-.29],cafe:[3.1,1.9,6.5,-.32],wheat:[0,1.8,22,0],scream:[0,1.8,14,0]};
 const portals={
  'bedroom:wheat':[-8,1.8,11.2,Math.PI/2], 'cafe:wheat':[18,1.8,-18,-Math.PI/2],
  'scream:wheat':[0,1.8,-23,Math.PI], 'wheat:cafe':[.8,1.9,-6.5,Math.PI],
  'starry:cafe':[-3.2,1.9,-6.3,Math.PI], 'wheat:scream':[0,1.8,14,0],
  'wheat:bedroom':[0,1.8,0,0], 'cafe:starry':[0,1.8,0,0]
 };
 const [x,y,z,yaw]=(kind==='portal'&&portals[`${from}:${scene}`])||defaults[scene]||[0,1.8,22,0];
 return {x,y,z,yaw,pitch:0};
}
