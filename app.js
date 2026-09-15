const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const uid=()=>crypto.randomUUID();
const clone=x=>JSON.parse(JSON.stringify(x));
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const defaults={
  text:{type:"text",text:"Edit this text",style:{fontSize:"18px"}},
  heading:{type:"heading",text:"A beautiful heading"},
  paragraph:{type:"paragraph",text:"Tell your visitors what this section is about."},
  button:{type:"button",text:"Get Started",href:"#"},
  image:{type:"image",src:"",alt:"Image",},
  video:{type:"video",src:"",},
  spacer:{type:"spacer",height:"50"},
  divider:{type:"divider"},
  input:{type:"input",label:"Your name",placeholder:"Enter your name",name:"name",required:false},
  textarea:{type:"textarea",label:"Message",placeholder:"Write something...",name:"message",required:false},
  select:{type:"select",label:"Choose an option",options:["Option 1","Option 2","Option 3"]},
  checkbox:{type:"checkbox",label:"I agree",name:"agree"},
  card:{type:"card",title:"Feature card",body:"Add content to your card."},
  hero:{type:"hero",title:"Build anything",body:"Create websites, apps, landing pages and forms visually.",button:"Start building"},
  columns:{type:"columns",children:[]},
  html:{type:"html",code:"<div>Custom HTML</div>"}
};
const palette=[
 ["Layout","hero","Hero"],["Layout","columns","Two Columns"],["Layout","card","Card"],["Basic","heading","Heading"],["Basic","paragraph","Paragraph"],["Basic","text","Text"],["Basic","image","Image"],["Basic","video","Video"],["Basic","button","Button"],["Forms","input","Input"],["Forms","textarea","Textarea"],["Forms","select","Dropdown"],["Forms","checkbox","Checkbox"],["Advanced","divider","Divider"],["Advanced","spacer","Spacer"],["Advanced","html","HTML"]
];
let project=JSON.parse(localStorage.getItem("forge-project")||"null")||{
 name:"My Project",pages:[{id:uid(),name:"Home",nodes:[make("hero"),make("heading"),make("paragraph"),make("button"),make("card"),make("input")]}]
};
let pageIndex=0,selected=null,zoom=1,history=[],hi=-1;

function make(type){return {id:uid(),...clone(defaults[type])}}
function page(){return project.pages[pageIndex]}
function snapshot(){return JSON.stringify(project)}
function commit(){history=history.slice(0,hi+1);history.push(snapshot());hi++;localStorage.setItem("forge-project",snapshot())}
function toast(t){let x=$("#toast");x.textContent=t;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),1400)}

function renderPalette(){
 const q=$("#search").value.toLowerCase();
 let html="",last="";
 palette.filter(x=>x[2].toLowerCase().includes(q)).forEach(([group,type,label])=>{
   if(group!==last){html+=`<div class="group-title">${group}</div>`;last=group}
   html+=`<button class="palette-item" draggable="true" data-type="${type}"><i>${icon(type)}</i>${label}</button>`;
 });
 $("#palette").innerHTML=html;
 $$(".palette-item").forEach(b=>{
   b.onclick=()=>addNode(b.dataset.type);
   b.ondragstart=e=>e.dataTransfer.setData("type",b.dataset.type);
 });
}
function icon(t){return ({hero:"✦",columns:"▦",card:"▣",heading:"H",paragraph:"¶",text:"T",image:"▧",video:"▶",button:"→",input:"□",textarea:"☰",select:"▾",checkbox:"☑",divider:"—",spacer:"↕",html:"<>"}[t]||"•")}

function renderPages(){
 $("#pages").innerHTML=project.pages.map((p,i)=>`<div class="page ${i===pageIndex?"active":""}" data-i="${i}">▤ ${esc(p.name)} <button data-del="${i}">×</button></div>`).join("");
 $$(".page").forEach(x=>x.onclick=e=>{if(e.target.dataset.del!==undefined){if(project.pages.length>1){project.pages.splice(+e.target.dataset.del,1);pageIndex=Math.max(0,pageIndex-1);selected=null;commit();render()}}else{pageIndex=+x.dataset.i;selected=null;render()}})
}
function render(){
 renderPages();renderPalette();
 $("#projectName").value=project.name;
 const c=$("#canvas");c.innerHTML=`<div class="page-canvas">${page().nodes.map(renderNode).join("")}</div>`;
 $$(".node").forEach(n=>{
   n.onclick=e=>{if(e.target.closest(".mini"))return;e.stopPropagation();selected=n.dataset.id;renderInspector();render()};
   n.querySelectorAll("[data-action]").forEach(b=>b.onclick=e=>{e.stopPropagation();action(b.dataset.action,n.dataset.id)});
 });
 renderInspector();
}
function renderNode(n){
 const sel=n.id===selected?" selected":"";
 let body="";
 switch(n.type){
 case"hero":body=`<div class="hero"><h1>${esc(n.title)}</h1><p>${esc(n.body)}</p><button class="btn">${esc(n.button)}</button></div>`;break;
 case"heading":body=`<h2>${esc(n.text)}</h2>`;break;
 case"paragraph":body=`<p>${esc(n.text)}</p>`;break;
 case"text":body=`<div>${esc(n.text)}</div>`;break;
 case"button":body=`<a class="btn" href="${esc(n.href)}">${esc(n.text)}</a>`;break;
 case"image":body=n.src?`<img src="${esc(n.src)}" alt="${esc(n.alt)}" style="max-width:100%">`:`<div class="img-placeholder">Image — set URL in Inspector</div>`;break;
 case"video":body=n.src?`<video controls style="width:100%" src="${esc(n.src)}"></video>`:`<div class="img-placeholder">Video — set URL in Inspector</div>`;break;
 case"spacer":body=`<div style="height:${Math.max(5,+n.height||50)}px"></div>`;break;
 case"divider":body="<hr>";break;
 case"input":body=`<label>${esc(n.label)}</label><input placeholder="${esc(n.placeholder)}" ${n.required?"required":""}>`;break;
 case"textarea":body=`<label>${esc(n.label)}</label><textarea placeholder="${esc(n.placeholder)}" ${n.required?"required":""}></textarea>`;break;
 case"select":body=`<label>${esc(n.label)}</label><select>${n.options.map(o=>`<option>${esc(o)}</option>`).join("")}</select>`;break;
 case"checkbox":body=`<label class="check"><input type="checkbox"> ${esc(n.label)}</label>`;break;
 case"card":body=`<div class="card"><h3>${esc(n.title)}</h3><p>${esc(n.body)}</p></div>`;break;
 case"columns":body=`<div class="grid2">${n.children.length?n.children.map(ch=>`<div class="card">${renderNode(ch)}</div>`).join(""):`<div class="card">Column 1</div><div class="card">Column 2</div>`}</div>`;break;
 case"html":body=n.code;break;
 }
 return `<section class="node${sel}" data-id="${n.id}"><div class="mini"><button data-action="up">↑</button><button data-action="down">↓</button><button data-action="duplicate">⧉</button><button data-action="delete">×</button></div>${body}</section>`;
}
function action(a,id){
 const arr=page().nodes,i=arr.findIndex(n=>n.id===id);if(i<0)return;
 if(a==="delete"){arr.splice(i,1);selected=null}
 if(a==="up"&&i>0)[arr[i-1],arr[i]]=[arr[i],arr[i-1]];
 if(a==="down"&&i<arr.length-1)[arr[i+1],arr[i]]=[arr[i],arr[i+1]];
 if(a==="duplicate"){let x=clone(arr[i]);x.id=uid();arr.splice(i+1,0,x);selected=x.id}
 commit();render()
}
function addNode(type){let n=make(type);page().nodes.push(n);selected=n.id;commit();render();toast("Added "+type)}
function renderInspector(){
 const n=page().nodes.find(x=>x.id===selected),box=$("#inspector");
 if(!n){box.innerHTML="<p style='color:var(--muted);font-size:12px'>Select something on the canvas to edit it.</p>";return}
 let fields="";
 const input=(k,label)=>`<div class="field"><label>${label}</label><input data-k="${k}" value="${esc(n[k])}"></div>`;
 const area=(k,label)=>`<div class="field"><label>${label}</label><textarea data-k="${k}">${esc(n[k])}</textarea></div>`;
 if(["heading","paragraph","text"].includes(n.type))fields+=area("text","Text");
 if(n.type==="hero"){fields+=input("title","Title")+area("body","Description")+input("button","Button text")}
 if(n.type==="button")fields+=input("text","Button text")+input("href","Link");
 if(n.type==="card")fields+=input("title","Title")+area("body","Body");
 if(["input","textarea","select","checkbox"].includes(n.type))fields+=input("label","Label");
 if(["input","textarea"].includes(n.type))fields+=input("placeholder","Placeholder")+input("name","Field name")+`<label class="check"><input type="checkbox" data-k="required" ${n.required?"checked":""}> Required</label>`;
 if(n.type==="image")fields+=input("src","Image URL")+input("alt","Alt text");
 if(n.type==="video")fields+=input("src","Video URL");
 if(n.type==="spacer")fields+=input("height","Height (px)");
 if(n.type==="select")fields+=area("options","Options — one per line");
 if(n.type==="html")fields+=area("code","HTML");
 box.innerHTML=`<h4>Content</h4>${fields}<h4>Element</h4><button class="danger" id="deleteInspector">Delete element</button>`;
 box.querySelectorAll("[data-k]").forEach(el=>el.oninput=()=>{let k=el.dataset.k;n[k]=el.type==="checkbox"?el.checked:(k==="options"?el.value.split("\n").filter(Boolean):el.value);commit();render()});
 $("#deleteInspector").onclick=()=>action("delete",n.id);
}

function buildHTML(){
 const body=page().nodes.map(renderNode).join("");
 return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(project.name)}</title><style>${document.querySelector("style")?.textContent||""}body{margin:0;font-family:system-ui,sans-serif}.page-canvas{max-width:1100px;margin:auto;padding:40px}.node{margin:8px 0}.hero{text-align:center;padding:80px 20px}.btn{display:inline-block;padding:12px 20px;background:#7c5cff;color:#fff;border-radius:8px;text-decoration:none}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:20px}.card{padding:22px;border:1px solid #ddd;border-radius:12px}input,textarea,select{width:100%;padding:10px;box-sizing:border-box}@media(max-width:700px){.grid2{grid-template-columns:1fr}}</style></head><body><main class="page-canvas">${body}</main></body></html>`;
}
function preview(){
 $("#previewFrame").srcdoc=buildHTML();$("#preview").classList.remove("hidden")
}
function download(name,data,type){
 const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([data],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)
}

$("#addPageBtn").onclick=()=>{let n=prompt("Page name","New Page");if(n){project.pages.push({id:uid(),name:n,nodes:[]});pageIndex=project.pages.length-1;selected=null;commit();render()}};
$("#search").oninput=renderPalette;
$("#projectName").oninput=e=>{project.name=e.target.value;commit()};
$("#previewBtn").onclick=preview;
$("#exportBtn").onclick=()=>$("#export").classList.remove("hidden");
$$("[data-close]").forEach(b=>b.onclick=()=>b.closest(".modal").classList.add("hidden"));
$("#downloadJSON").onclick=()=>download("forge-project.json",JSON.stringify(project,null,2),"application/json");
$("#downloadProject").onclick=()=>{download("index.html",buildHTML(),"text/html");toast("Downloaded HTML");};
$("#zoomIn").onclick=()=>{zoom=Math.min(1.5,zoom+.1);$("#canvas").style.transform=`scale(${zoom})`;$("#zoom").textContent=Math.round(zoom*100)+"%"};
$("#zoomOut").onclick=()=>{zoom=Math.max(.5,zoom-.1);$("#canvas").style.transform=`scale(${zoom})`;$("#zoom").textContent=Math.round(zoom*100)+"%"};
$$(".device button").forEach(b=>b.onclick=()=>{$$(".device button").forEach(x=>x.classList.remove("active"));b.classList.add("active");$("#canvas").className="canvas "+(b.dataset.device==="desktop"?"":b.dataset.device)});
$("#undoBtn").onclick=()=>{if(hi>0){hi--;project=JSON.parse(history[hi]);render()}};
$("#redoBtn").onclick=()=>{if(hi<history.length-1){hi++;project=JSON.parse(history[hi]);render()}};
$("#canvas").ondragover=e=>e.preventDefault();$("#canvas").ondrop=e=>{e.preventDefault();let t=e.dataTransfer.getData("type");if(t)addNode(t)};
document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key==="s"){e.preventDefault();commit();toast("Saved")};if(e.key==="Delete"&&selected)action("delete",selected)});
commit();render();
