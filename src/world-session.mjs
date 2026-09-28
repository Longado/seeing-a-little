// Scene resources are kept separate from save data. Eviction never erases progress.
export function releaseWorldGroup(group,otherGroups,protectedTextures=[]){
 const collect=root=>{const set=new Set();root.traverse(o=>{if(o.isInstancedMesh)set.add(o);if(o.geometry)set.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){if(!m)continue;set.add(m);for(const v of Object.values(m))if(v?.isTexture)set.add(v);for(const u of Object.values(m.uniforms||{}))if(u.value?.isTexture)set.add(u.value);}if(o.shadow?.map)set.add(o.shadow.map);});return set;};
 const shared=new Set(protectedTextures);for(const g of otherGroups)for(const r of collect(g))shared.add(r);
 const released=new Set();for(const r of collect(group))if(!shared.has(r)){r.dispose?.();released.add(r);}
 group.removeFromParent();group.clear();return released;
}
