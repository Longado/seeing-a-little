(function(){
'use strict';
var KEY='closer-observations-v2',records=Object.create(null);
function valid(id){return typeof id==='string'&&/^[a-z][a-z0-9-]{0,60}$/.test(id);}
function clean(text){return typeof text==='string'?text.slice(0,600):'';}
try{var store=JSON.parse(localStorage.getItem(KEY)||'null');if(store&&store.version===2&&store.records&&typeof store.records==='object'&&!Array.isArray(store.records))Object.keys(store.records).forEach(function(id){var r=store.records[id];if(valid(id)&&r&&typeof r==='object')records[id]={saved:clean(r.saved),draft:typeof r.draft==='string'?clean(r.draft):null};});}catch(e){}
// Read old observations without deleting or rewriting the original key.
try{var old=JSON.parse(localStorage.getItem('closer-observations-v1')||'{}');if(old&&typeof old==='object'&&!Array.isArray(old))Object.keys(old).forEach(function(id){if(valid(id)&&!records[id]&&typeof old[id]==='string')records[id]={saved:clean(old[id]),draft:null};});}catch(e){}
function persist(){try{localStorage.setItem(KEY,JSON.stringify({version:2,records:records}));return true;}catch(e){return false;}}
function notify(){window.dispatchEvent(new CustomEvent('world-observations-change'));}
window.WorldObservations={
 read:function(id){var r=records[id];return r?{saved:r.saved,draft:r.draft}:{saved:'',draft:null};},
 saveDraft:function(id,text){if(!valid(id))return false;var r=records[id]||(records[id]={saved:'',draft:null});r.draft=clean(text);return persist();},
 save:function(id,text){if(!valid(id)||!clean(text).trim())return false;var before=records[id];records[id]={saved:clean(text).trim(),draft:null};if(!persist()){if(before)records[id]=before;else delete records[id];return false;}notify();return true;},
 entries:function(){return Object.keys(records).filter(function(id){return records[id].saved.trim();}).map(function(id){return {id:id,text:records[id].saved};});}
};
})();
