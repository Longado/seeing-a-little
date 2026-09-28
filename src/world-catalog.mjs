// Scene IDs remain stable so existing observations and trophies keep their meaning.
export const WORLD_CATALOG=[
 {id:'bedroom',work:'bedroom',name:'在阿尔的卧室',short:'卧室',artist:'梵高',image:'./assets/bedroom.jpg',ready:true},
 {id:'cafe',work:'cafe',name:'夜间咖啡馆',short:'咖啡馆',artist:'梵高',image:'./assets/cafe.jpg',ready:true},
 {id:'wheat',work:'wheat',name:'麦田群鸦',short:'麦田',artist:'梵高',image:'./assets/worlds/wheat-entry.svg',previewLabel:'麦田空间插画',ready:true},
 {id:'portrait',work:'portrait',name:'自画像',short:'自画像',artist:'梵高',image:'./assets/worlds/portrait.jpg',ready:true},
 {id:'starry',work:'starry',name:'星月夜',short:'星夜',artist:'梵高',image:'./assets/worlds/starry-entry.svg',featured:true,snowX:-4.8,tint:'#e3bd74',ready:true},
 {id:'pond',work:'lilies',name:'睡莲',short:'睡莲',artist:'莫奈',image:'./assets/lilies.jpg',featured:true,snowX:0,tint:'#a9d6be',ready:true},
 {id:'bridge',work:'bridge',name:'睡莲池上的桥',short:'日本桥',artist:'莫奈',image:'./assets/lilies.jpg',previewLabel:'睡莲作品参考图',ready:true},
 {id:'wave',work:'wave',name:'神奈川冲浪里',short:'大浪',artist:'葛饰北斋',image:'./assets/wave.jpg',featured:true,snowX:4.8,tint:'#a9c6e3',ready:true},
 {id:'scream',work:'scream',name:'呐喊',short:'呐喊',artist:'蒙克',image:'./assets/worlds/scream.jpg',ready:true},
 {id:'rain',work:'rain',name:'雨天的巴黎街道',short:'巴黎雨景',artist:'卡耶博特',image:'./assets/rain.jpg',ready:true},
 {id:'sunday',work:'sunday',name:'大碗岛的星期日下午',short:'大碗岛',artist:'修拉',image:'./assets/sunday.jpg',ready:true}
];
export const WORLD_IDS=['gallery','snow',...WORLD_CATALOG.filter(w=>w.ready).map(w=>w.id)];
export const SNOW_WORLDS=WORLD_CATALOG.filter(w=>w.featured);
export function mountWorldCatalog(){
 const dialog=document.createElement('dialog');dialog.className='world-library';dialog.setAttribute('aria-label','全部作品');
 const header=document.createElement('header');header.innerHTML='<h2>走进一幅画</h2><button aria-label="关闭作品菜单">×</button>';dialog.append(header);
 const grid=document.createElement('div');grid.className='world-library-grid';dialog.append(grid);document.body.append(dialog);
 let opener;const open=()=>{opener=document.activeElement;window.paintingWorlds?.hold();dialog.showModal();};
 header.querySelector('button').onclick=()=>dialog.close();dialog.addEventListener('close',()=>opener?.focus());
 for(const w of WORLD_CATALOG){const b=document.createElement('button');b.className='world-library-art';const sourceIndex=window.ArtCatalog.findIndex(a=>a.id===w.work);b.disabled=!w.ready&&sourceIndex<0;b.innerHTML=`<img src="${w.image}" alt="${w.previewLabel||w.name}" loading="lazy"><strong>${w.name}</strong><small>${w.artist} · ${w.ready?'进入世界 ↗':sourceIndex>=0?'看原作 · 世界制作中':'独立世界制作中'}</small>`;b.onclick=()=>{dialog.close();if(w.ready)window.openPaintingWorlds(w.id);else document.querySelector(`[data-catalog="${sourceIndex}"]`)?.click();};grid.append(b);}
 const home=document.querySelector('.home-artways-track');home.replaceChildren();for(const w of SNOW_WORLDS){const b=document.createElement('button');b.className='home-artway';b.setAttribute('aria-label',`进入${w.artist}${w.short}`);b.innerHTML=`<img src="${w.image}" alt="${w.name}"><span><strong>${w.short}</strong><i>↗</i></span><small>${w.artist}</small>`;b.onclick=()=>window.openPaintingWorlds(w.id);home.append(b);}
 const links=document.querySelector('.home-world-links');links.replaceChildren();for(const w of WORLD_CATALOG.filter(w=>w.ready&&!w.featured)){const b=document.createElement('button');b.textContent=w.short;b.onclick=()=>window.openPaintingWorlds(w.id);links.append(b);}
 const choose=document.getElementById('choose-art');choose.textContent='全部作品 ↗';choose.onclick=open;
 const nav=document.querySelector('.world-chapters');nav.replaceChildren();const browse=document.createElement('button');browse.textContent='全部作品';browse.onclick=open;nav.append(browse);
 for(const [id,label] of [['gallery','画廊'],['snow','雪幕']]){const b=document.createElement('button');b.dataset.world=id;b.textContent=label;nav.append(b);}
 const current=document.createElement('span');current.id='world-current-label';current.setAttribute('aria-live','polite');nav.append(current);
 window.worldLibrary={open};
}
