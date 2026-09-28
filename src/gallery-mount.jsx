import { mountWorldCatalog } from './world-catalog.mjs';
import { mountTrophies } from './trophies.mjs';
import { mountWorlds } from './worlds';
import { mountMuseum } from './museum';
import { CircleButtons } from '../vendor/threeui/src/shaders/circle-buttons/CircleButtons';
import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Gallery } from '../vendor/threeui/src/shaders/gallery/Gallery';
function ArtworkGallery(){
 const [speed,setSpeed]=useState(.55);
 useEffect(()=>{const button=document.getElementById('orbit-toggle');const toggle=()=>setSpeed(s=>s?0:.55);button.addEventListener('click',toggle);return()=>button.removeEventListener('click',toggle);},[]);
 useEffect(()=>{const button=document.getElementById('orbit-toggle');button.textContent=speed?'暂停转动 Ⅱ':'转动画廊 ↻';button.setAttribute('aria-pressed',String(!!speed));},[speed]);
 return <Gallery speed={speed} scale={1} opacity={1} />;
}
if(document.getElementById('gallery-mount'))createRoot(document.getElementById('gallery-mount')).render(<ArtworkGallery/>);

mountMuseum(document.getElementById('museum-mount'));
createRoot(document.getElementById('entry-circle')).render(<CircleButtons variant="play" ariaLabel="进入今天的观看练习" onClick={()=>document.getElementById('start-button').click()}/>);

mountWorldCatalog();
mountTrophies();
mountWorlds();
