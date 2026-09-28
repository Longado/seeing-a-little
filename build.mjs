import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
// Keep the verified upstream file intact. Change only texture URLs at build time.
await build({entryPoints:['src/gallery-mount.jsx'],bundle:true,minify:true,format:'iife',outfile:'assets/gallery-runtime.js',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'lesson-artworks',setup(b){b.onLoad({filter:/Gallery\.tsx$/},async a=>({contents:(await readFile(a.path,'utf8')).replace(/new URL\("\.\/assets\/gallery-(\d)\.webp", import.meta.url\)\.href/g,(_,index)=>{return '"./assets/'+(Number(index)%2?'bedroom':'cafe')+'.jpg"'}),loader:'tsx'}));}}]});

// Local previews can keep old JS/CSS in memory. Content versions keep each build visible.
let html=await readFile('index.html','utf8');
const assets=/(src|href)="\.\/([^"?]+\.(?:js|css))(?:\?[^" ]*)?"/g;
const versions=new Map();
for(const match of html.matchAll(assets)){
 const path=match[2];
 if(!versions.has(path))versions.set(path,createHash('sha256').update(await readFile(path)).digest('hex').slice(0,12));
}
html=html.replace(assets,(_,attribute,path)=>`${attribute}="./${path}?v=${versions.get(path)}"`);
await writeFile('index.html',html);
