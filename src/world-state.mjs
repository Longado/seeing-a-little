import { WORLD_IDS } from './world-catalog.mjs';
export const WORLD_KEY = 'closer-worlds-v1';
export const freshWorld = () => ({version:1,scene:'snow',pipe:'hidden',spoken:false,stormSeen:false,calmed:false,note:''});
export function restoreWorld(raw){
 let v;try{v=JSON.parse(raw);}catch{return freshWorld();}
 if(!v||v.version!==1)return freshWorld();
 const s=freshWorld();
 if(WORLD_IDS.includes(v.scene))s.scene=v.scene;
 if(['hidden','held','placed'].includes(v.pipe))s.pipe=v.pipe;
 s.spoken=s.pipe==='placed'&&v.spoken===true;
 s.stormSeen=v.stormSeen===true;s.calmed=s.stormSeen&&v.calmed===true;
 s.note=typeof v.note==='string'?v.note.slice(0,600):'';return s;
}
export function advanceWorld(state,event){
 const s={...state};
 if(event==='collect'&&s.pipe==='hidden')s.pipe='held';
 if(event==='putBack'&&s.pipe==='held')s.pipe='hidden';
 if(event==='place'&&s.pipe==='held')s.pipe='placed';
 if(event==='speak'&&s.pipe==='placed')s.spoken=true;
 if(event==='storm')s.stormSeen=true;
 if(event==='calm'&&s.stormSeen)s.calmed=true;
 return s;
}
