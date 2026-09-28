(function(root){
  var labels={moodA:'A 的第一感受',noteA:'A 的补充',moodB:'B 的第一感受',noteB:'B 的补充',detail:'我发现的细节',preference:'我更愿意停留的房间',reason:'我的理由',reflection:'读过背景之后',application:'我的色彩实验'};
  function fresh(){return {version:1,step:0,started:false,completed:false,answers:{},pin:null,palette:'original'};}
  function restore(raw){
    var s=fresh(),v;try{v=JSON.parse(raw);}catch(e){return s;}
    if(!v||Array.isArray(v)||v.version!==1)return s;
    s.step=Number.isInteger(v.step)?Math.max(0,Math.min(6,v.step)):0;
    s.started=v.started===true;s.completed=v.completed===true;
    Object.keys(labels).forEach(function(k){if(v.answers&&typeof v.answers[k]==='string')s.answers[k]=v.answers[k].slice(0,600);});
    var p=v.pin;if(p&&['bedroom','cafe'].includes(p.art)&&Number.isFinite(p.x)&&Number.isFinite(p.y))s.pin={art:p.art,x:Math.max(0,Math.min(1,p.x)),y:Math.max(0,Math.min(1,p.y))};
    if(['original','warm','cool'].includes(v.palette))s.palette=v.palette;
    return s;
  }
  function toMarkdown(s){return '# 看见一点 · 房间里的情绪\n\n'+Object.keys(labels).map(function(k){return '## '+labels[k]+'\n\n'+(s.answers[k]||'（暂未记录）');}).join('\n\n')+'\n\n色彩实验：'+s.palette+'\n';}
  root.LookState={fresh:fresh,restore:restore,toMarkdown:toMarkdown,labels:labels};
})(typeof window!=='undefined'?window:this);
