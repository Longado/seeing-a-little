import { WORLD_CATALOG } from './world-catalog.mjs';
export const TROPHY_KEY='closer-trophies-v1';
export const TROPHIES=[
 ['starry','一颗星','星月夜','连起一段天空的笔触。','✧'],
 ['bedroom','一扇窗','阿尔的卧室','推开卧室的窗。','▣'],
 ['cafe','一盏夜灯','夜间咖啡馆','让球相碰，唤起房间里的星光。','◉'],
 ['lilies','一片浮叶','睡莲','触碰池水，等倒影重新安静。','❧'],
 ['rain','一滴雨','雨天的巴黎街道','移动雨伞，发现水洼中的街景。','◊'],
 ['sunday','一个午后','大碗岛的星期日下午','走近色点，再退后看完整画面。','◒'],
 ['wave','一朵浪花','神奈川冲浪里','顺着浪的节奏，划过一段海面。','≋'],
 ['portrait','一缕回声','自画像','找到烟斗并归还给画中人。','♧'],
 ['wheat','一穗麦子','麦田','沿小路走过公路，到达桥端。','❦'],
 ['scream','一次呼吸','呐喊','走近画作，再让视线与空间安静。','◎'],
 ['bridge','一座桥','睡莲池上的桥','换一个站位，找到桥与倒影的构图。','⌒'],
 ['snow','一片雪','雪幕','穿过雪幕中的任意作品之门。','❄']
].map(([id,name,work,hint,symbol])=>({id,name,work,hint,symbol}));
export function restoreTrophies(raw){try{const a=JSON.parse(raw);return Array.isArray(a)?[...new Set(a.filter(id=>TROPHIES.some(t=>t.id===id)))]:[];}catch{return [];}}
export function collectTrophy(owned,id){return TROPHIES.some(t=>t.id===id)&&!owned.includes(id)?[...owned,id]:owned;}
export function mountTrophies(){
 let owned=[];try{owned=restoreTrophies(localStorage.getItem(TROPHY_KEY));}catch{}
 const dialog=document.createElement('dialog');dialog.className='trophy-case';dialog.setAttribute('aria-label','画中纪念物');document.body.appendChild(dialog);
 let opener;
 function render(){dialog.innerHTML='<header><h2>画中纪念物 <small>'+owned.length+' / '+TROPHIES.length+'</small></h2><button aria-label="关闭纪念物">×</button></header><div class="trophy-grid">'+TROPHIES.map(t=>{const has=owned.includes(t.id);return '<article class="trophy-piece '+(has?'owned':'locked')+'"><span aria-hidden="true">'+t.symbol+'</span><h3>'+(has?t.name:'未收集')+'</h3><p>'+t.work+'</p><small>'+t.hint+'</small><button class="trophy-return" data-trophy-world="'+t.id+'">'+(has?'再走进去 ↗':'去发现 ↗')+'</button></article>';}).join('')+'</div><footer>保存在当前浏览器</footer>';dialog.querySelector('header button').onclick=()=>dialog.close();dialog.querySelectorAll('[data-trophy-world]').forEach(button=>{button.onclick=()=>{const id=button.dataset.trophyWorld,world=WORLD_CATALOG.find(w=>w.id===id||w.work===id);dialog.close();window.openPaintingWorlds?.(world?.id||id);};});}
 dialog.addEventListener('close',()=>opener?.focus());
 function open(){opener=document.activeElement;render();dialog.showModal();}
 document.querySelectorAll('[data-trophies]').forEach(b=>b.onclick=open);
 const toast=document.createElement('div');toast.className='trophy-toast';toast.setAttribute('role','status');document.body.appendChild(toast);let timer;
 function award(id){const next=collectTrophy(owned,id);if(next===owned)return false;try{localStorage.setItem(TROPHY_KEY,JSON.stringify(next));}catch{toast.textContent='纪念物暂未保存，请检查浏览器存储。';toast.classList.add('visible');clearTimeout(timer);timer=setTimeout(()=>toast.classList.remove('visible'),3500);return false;}owned=next;const t=TROPHIES.find(t=>t.id===id);toast.textContent=t.symbol+'  收集了「'+t.name+'」';toast.classList.add('visible');clearTimeout(timer);timer=setTimeout(()=>toast.classList.remove('visible'),3000);if(dialog.open)render();return true;}
 window.artTrophies={award,open};
}
