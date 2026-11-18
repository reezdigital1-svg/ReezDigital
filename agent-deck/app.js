/* Agent Deck - phone console for ring agents.
   Rules: default deny; every read is a tap; grants are scoped + expire; kill switch first. */
"use strict";

const $=id=>document.getElementById(id);
const LS=window.localStorage;
const state={
  cfg:JSON.parse(LS.getItem("adeck.cfg")||"null")||{name:"",ring:"https://zippy-nova-m44b5ul.tmp.now"},
  grants:JSON.parse(LS.getItem("adeck.grants")||"[]"),
  log:JSON.parse(LS.getItem("adeck.log")||"[]"),
  jobs:[]
};

/* ---------- tabs ---------- */
document.querySelectorAll(".tab").forEach(t=>t.addEventListener("click",()=>{
  document.querySelectorAll(".tab").forEach(x=>{
    const on=x===t; x.classList.toggle("is-active",on); x.setAttribute("aria-pressed",on);});
  document.querySelectorAll(".view").forEach(v=>
    v.classList.toggle("is-active", v.dataset.view===t.dataset.tab));
}));

/* ---------- log + grants ---------- */
function now(){return new Date().toISOString().replace("T"," ").slice(0,19)+" UTC"}
function slog(msg){
  state.log.unshift({ts:now(),msg});
  state.log=state.log.slice(0,200);
  LS.setItem("adeck.log",JSON.stringify(state.log));
  renderLog();
}
function renderLog(){
  const el=$("eventLog");
  el.innerHTML=state.log.map(l=>`<li><b>${l.ts}</b> ${esc(l.msg)}</li>`).join("")||"<li>nothing yet</li>";
}
function esc(s){const d=document.createElement("div");d.textContent=String(s);return d.innerHTML}
function renderGrants(){
  const g=state.grants.filter(x=>x.exp>Date.now());
  $("grantCount").textContent=g.length;
  $("grantList").innerHTML=g.length?g.map(x=>`<div class="grant">
      <div><b>${esc(x.agent)}</b> holds <span class="job-scope">${esc(x.scope)}</span>
      <div class="muted">granted ${x.ts} &middot; ${esc(x.ttlTxt)}</div></div>
      <button class="btn b-deny" data-revoke="${x.id}">revoke</button>
    </div>`).join("")
    :'<p class="empty muted">No active grants.</p>';
  document.querySelectorAll("[data-revoke]").forEach(b=>b.addEventListener("click",()=>{
    revoke(b.dataset.revoke,"manual revoke");
  }));
}
function newGrant(agent,scope,ttlSec){
  const id=Math.random().toString(36).slice(2,10);
  state.grants.push({id,agent,scope,ts:now(),exp:Date.now()+ttlSec*1000,
    ttlTxt:ttlSec<3600?(ttlSec/60+" min"):(ttlSec/86400>=1?(ttlSec/86400+" day"):(ttlSec/3600+" hour"))});
  pruneGrants(); slog(`grant issued: ${agent} -> ${scope}`);
}
function revoke(id,why){
  const g=state.grants.find(x=>x.id===id);
  state.grants=state.grants.filter(x=>x.id!==id);
  LS.setItem("adeck.grants",JSON.stringify(state.grants));
  slog(`REVOKED: ${g?g.agent+" "+g.scope:"grant"} (${why})`);
  renderGrants();
}
function pruneGrants(){
  const alive=[];
  state.grants.forEach(x=>{
    if(x.oneUse && x.used){return}
    if(x.exp>Date.now()){alive.push(x)}else{slog(`expired: ${x.agent} ${x.scope}`)}
  });
  state.grants=alive; LS.setItem("adeck.grants",JSON.stringify(state.grants));
}
setInterval(()=>{if(state.grants.length){pruneGrants();renderGrants()}},30000);

/* ---------- kill switch ---------- */
$("killBtn").addEventListener("click",()=>{
  const n=state.grants.length;
  state.grants=LS.setItem("adeck.grants","[]")||[];
  ["packetBody","packet"].forEach(id=>$(id).classList.add("hidden"));
  slog(`KILL SWITCH: all ${n} grant(s) revoked, capture cleared`);
  renderGrants();
});
$("clearLog").addEventListener("click",()=>{state.log=[];LS.setItem("adeck.log","[]");renderLog()});

/* ---------- setup ---------- */
$("myName").value=state.cfg.name; $("ringUrl").value=state.cfg.ring;
$("saveSetup").addEventListener("click",()=>{
  const studio=state.cfg.studio||"";
  state.cfg={name:$("myName").value.trim()||"phone", ring:$("ringUrl").value.trim().replace(/\/$/,"")};
  if(studio) state.cfg.studio=studio; // studio URL survives setup edits
  LS.setItem("adeck.cfg",JSON.stringify(state.cfg));
  $("whoami").textContent=state.cfg.name;
  $("setupResult").textContent="saved. test the ring, then check jobs.";
  slog("setup saved: "+state.cfg.name+" @ "+state.cfg.ring);
  testRing();
});
$("testSetup").addEventListener("click",testRing);
function testRing(){
  const s=$("setupResult");
  s.textContent="testing\u2026";
  fetch(state.cfg.ring+"/welcome",{method:"GET"}).then(r=>r.text()).then(t=>{
    $("ringStatus").textContent="online"; $("ringStatus").className="on";
    s.textContent="ring replied: "+t.slice(0,140);
    slog("ring test OK");
  }).catch(e=>{
    $("ringStatus").textContent="offline"; $("ringStatus").className="off";
    s.textContent="ring unreachable from this phone: "+e.message;
  });
}
if(state.cfg.name){$("whoami").textContent=state.cfg.name}

/* ---------- ring polling: jobs from letters ---------- */
async function api(payload){
  const r=await fetch(state.cfg.ring+"/api/exchange",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify(payload)});
  return r.json();
}
async function pollRing(){
  if(!state.cfg.name){$("setupResult").textContent="set your agent name first (Setup tab)";return}
  $("pollBtn").textContent="checking\u2026";
  try{
    const r=await fetch(state.cfg.ring+"/api/exchange?to="+encodeURIComponent(state.cfg.name));
    const res=await r.json();
    const letters=res.letters||res.inbox||res.messages||[];
    let jobs=0;
    letters.forEach(L=>{
      const subj=(L.subject||"")+" "+(L.body||"");
      const m=(L.subject||"").match(/\[JOB\]\s*(.{0,120})/i);
      if(m){
        state.jobs.unshift({from:L.from||"unknown",what:m[1],subj:L.subject,body:L.body||"",ts:now()});
        jobs++;
      }
    });
    if(letters.length) slog(`polled: ${letters.length} letter(s), ${jobs} job(s)`);
    renderJobs();
  }catch(e){slog("poll failed: "+e.message)}
  $("pollBtn").textContent="Check ring";
}
$("pollBtn").addEventListener("click",pollRing);
function renderJobs(){
  const el=$("jobList");
  if(!state.jobs.length){return}
  el.innerHTML=state.jobs.map((j,i)=>`<div class="job ring-job">
    <header class="job-head"><span class="job-from">${esc(j.from)}</span>
      <span class="job-scope">READ (decoded by you)</span><span class="job-exp">${esc(j.ts)}</span></header>
    <p class="job-what">${esc(j.what)}<br><span class="muted">${esc((j.body||"").slice(0,220))}</span></p>
    <div class="job-actions">
      <button class="btn b-approve" data-japprove="${i}">&#10003; approve (act next)</button>
      <button class="btn b-deny" data-jdeny="${i}">&#10005; deny</button>
    </div>
  </div>`).join("");
  el.querySelectorAll("[data-japprove]").forEach(b=>b.addEventListener("click",()=>{
    const j=state.jobs[+b.dataset.japprove];
    slog(`job approved from ${j.from}: ${j.what.slice(0,60)}`);
    state.jobs=state.jobs.filter(x=>x!==j); renderJobs();
    document.querySelector('[data-tab="capture"]').click();
  }));
  el.querySelectorAll("[data-jdeny]").forEach(b=>b.addEventListener("click",()=>{
    const j=state.jobs[+b.dataset.jdeny];
    slog(`job DENIED from ${j.from}`);
    state.jobs=state.jobs.filter(x=>x!==j); renderJobs();
  }));
}

/* ---------- demo job ---------- */
$("demoApprove").addEventListener("click",()=>{
  navigator.clipboard?.readText?.().then(txt=>{
    $("demoResult").textContent="granted. captured note: "+(txt?txt.slice(0,120)+(txt.length>120?"\u2026":""):"(clipboard empty or not permitted; type it in Capture instead)");
    newGrant("demo agent","READ: pasted note",300);
  }).catch(()=>{
    $("demoResult").textContent="browser refused clipboard read. Use the Capture tab (Type note) instead.";
    newGrant("demo agent","READ: typed note",300);
  });
});
$("demoDeny").addEventListener("click",()=>{
  $("demoResult").textContent="denied. the agent got nothing, and the request was logged.";
  slog("demo job DENIED");
});

/* ---------- capture ---------- */
let packet=null; // {kind,meta,render,dataForm}
function showPacket(kind,meta,bodyHTML,form){
  packet={kind,meta,form};
  $("packetMeta").textContent=meta;
  $("packetBody").innerHTML=bodyHTML;
  $("packet").classList.remove("hidden");
  slog(`capture: ${kind} (${meta})`);
}
$("capPaste").addEventListener("click",async()=>{
  try{
    const txt=await navigator.clipboard.readText();
    if(!txt){return alert2("clipboard was empty")}
    showPacket("paste-text",`${txt.length} chars`,esc(txt),{kind:"text",text:txt});
  }catch(e){alert2("clipboard blocked by browser: "+e.message+" use Type note")}
});
$("capType").addEventListener("click",()=>{
  const txt=prompt("Type (or dictate with your keyboard mic) the note:");
  if(!txt){return}
  showPacket("typed-note",`${txt.length} chars`,esc(txt),{kind:"text",text:txt});
});
$("capPhoto").addEventListener("click",()=>{
  const fi=$("fileInput");
  fi.setAttribute("capture","environment");
  fi.click();
});
$("capFile").addEventListener("click",()=>{
  const fi=$("fileInput");
  fi.removeAttribute("capture");
  fi.click();
});
$("fileInput").addEventListener("change",e=>{
  const f=e.target.files[0]; if(!f){return}
  const url=URL.createObjectURL(f);
  const isImg=f.type.startsWith("image/");
  showPacket("file",`${f.name}, ${(f.size/1024).toFixed(1)} KB`,
    (isImg?`<img src="${url}" alt="selected photo preview">`:"(binary file)")+`<div class="muted">${esc(f.name)}</div>`,
    {kind:"file",file:f});
  e.target.value="";
});
function alert2(msg){slog(msg); alert(msg)}

/* ---------- send packet or letter ---------- */
$("packetSend").addEventListener("click",async()=>{
  if(!packet){return}
  const agent=($("grantAgent").value||"").trim();
  if(!agent){return alert2("name the agent first")}
  const ttl=+$("grantTtl").value;
  const send=$("packetSend");
  send.disabled=true; send.textContent="sending\u2026";
  try{
    if(packet.kind==="text"){
      await api({op:"send",from:state.cfg.name||"phone",to:agent,
        subject:"[PKT] "+packet.kind+" ("+packet.meta+")",
        body:"SCOPED GRANT PACKET\nkind: "+packet.kind+"\nttl_seconds: "+ttl+
        "\n\n--- captured content follows ---\n"+packet.form.text});
      newGrant(agent,"READ: "+packet.kind,ttl);
      $("sendResult")&&($("sendResult").textContent="letter sent to "+agent);
      slog(`packet sent to ${agent}: ${packet.kind}, grant ${ttl}s`);
      $("packet").classList.add("hidden"); packet=null;
    }else{
      // upload binary to unlisted temp host, then letter the link
      const fd=new FormData();
      fd.append("files[]",packet.form.file,packet.form.file.name);
      const up=await fetch("https://uguu.se/upload?output=json",{method:"POST",body:fd});
      const j=await up.json();
      const link=j.files&&j.files[0]&&j.files[0].url;
      if(!link){throw new Error("upload failed: "+JSON.stringify(j).slice(0,120))}
      await api({op:"send",from:state.cfg.name||"phone",to:agent,
        subject:"[PKT] "+packet.kind+" ("+packet.meta+")",
        body:"SCOPED GRANT PACKET (file)\nlink: "+link+"\nbytes: "+packet.form.file.size+
        "\nttl: unlisted host expiry + grant "+ttl+"s\nnote: unlisted link, treat as sensitive, do not forward."});
      newGrant(agent,"READ file: "+packet.meta,ttl);
      slog(`file packet sent to ${agent}: ${link}`);
      $("packet").classList.add("hidden"); packet=null;
    }
  }catch(e){
    alert2("send failed: "+e.message);
  }
  send.disabled=false; send.textContent="send packet";
  renderGrants();
});
$("sendBtn").addEventListener("click",async()=>{
  const to=($("toAgent").value||"").trim(), subj=$("subj").value.trim(), body=$("msgBody").value;
  if(!to||!body){$("sendResult").textContent="recipient and body required";return}
  try{
    const r=await api({op:"send",from:state.cfg.name||"phone",to,subject:subj||"(no subject)",body});
    $("sendResult").textContent="delivered: "+(r.delivered??"")+" to "+to;
    slog(`letter sent to ${to}`);
    $("msgBody").value="";
  }catch(e){$("sendResult").textContent="failed: "+e.message}
});

/* ---------- phone doctor: honest device report + guided fixes ---------- */
/* A web page can only READ what the browser exposes and GUIDE. It cannot run
   repairs, change system settings, or add physical RAM/ROM. Say so, always. */

const CHECKS=[
  {t:"Turn on RAM expansion (virtual RAM)",
   d:"Settings, search \u201cmemory extension\u201d / \u201cRAM expansion\u201d / \u201cvirtual RAM\u201d. Samsung: Device care > Memory > RAM Plus. Xiaomi: Additional settings > Memory extension. Infinix/Tecno: XOS/HI-OS memory settings. This borrows storage as extra RAM. It helps background apps survive, it is not new physical hardware."},
  {t:"Free storage to at least 10 percent free",
   d:"Settings > Storage. Delete old downloads, duplicate videos and unused apps. 'App is not responding' is most often a phone with almost no free storage."},
  {t:"Clear the cache of the app that freezes",
   d:"Settings > Apps > [the app] > Storage > Clear cache. Do not press Clear data unless you accept losing the app's saved sign-ins."},
  {t:"Update the freezing app",
   d:"Play Store or App Store > search the app > Update. Old app versions against a newer OS is a classic freezing cause."},
  {t:"Check for a pending system update",
   d:"Settings > System > System update. Builders patch freeze bugs constantly."},
  {t:"Restart in Safe Mode and test the app",
   d:"Hold power > long-press \u201cPower off\u201d > tap OK for Safe Mode. If the app stops freezing there, a third-party app is the cause. Hold power > Restart to leave Safe Mode."},
  {t:"Update Android System WebView / Chrome",
   d:"Play Store > search \u201cAndroid System WebView\u201d > Update. WebView crashes freeze many apps that show web content."},
  {t:"Clear all apps from recents + restart once a week",
   d:"Recents button > Clear all. Then restart. Phones that never restart accumulate memory-hogging zombies."},
  {t:"Last resort: back up, then factory reset",
   d:"Settings > System > Reset. Only after backing up photos and accounts. This is the honest end of the software road."},
  {t:"If freezes continue after all of the above",
   d:"Then it is hardware: worn storage or insufficient RAM for the OS version. No web page can fix that. A repair shop is the honest end. A lighter Launcher and Go-edition app set lowers memory pressure instead."}
];

const LS_CHECKS="adeck.checks";
function loadChecks(){try{return JSON.parse(LS.getItem(LS_CHECKS)||"[]")}catch(e){return[]}}
function saveChecks(v){LS.setItem(LS_CHECKS,JSON.stringify(v))}

function renderDocList(){
  const done=loadChecks(), ol=$("docList");
  ol.innerHTML="";
  CHECKS.forEach((c,i)=>{
    const li=document.createElement("li");
    if(done.includes(i)) li.classList.add("done");
    li.innerHTML='<span class="dcb">\u2713</span><span class="dtxt">'+esc(c.t)+'<small>'+esc(c.d)+'</small></span>';
    li.addEventListener("click",()=>{
      const v=loadChecks(), at=v.indexOf(i);
      if(at>=0){v.splice(at,1)}else{v.push(i)}
      saveChecks(v); renderDocList();
      slog((at>=0?"fix step undone: ":"fix step done: ")+c.t);
      docProgress();
    });
    ol.appendChild(li);
  });
  docProgress();
}
function docProgress(){
  const n=loadChecks().length, p=$("docProgress");
  if(p) p.innerHTML="<b>"+n+"</b> of "+CHECKS.length+" steps done. Progress saves on this phone only.";
}

let docReportText="";
async function runDocScan(){
  const out=$("docReport");
  out.classList.remove("muted");
  out.textContent="reading this phone\u2026";
  const lines=[];
  const nav=navigator;
  lines.push("AGENT DECK DEVICE REPORT (hardware numbers only)");
  lines.push("generated: "+now());
  if(nav.deviceMemory!==undefined){
    lines.push("ram_tier_gb: "+nav.deviceMemory+" (browser rounds DOWN to a power of 2, so a 6GB phone reports 4)");
  }else{lines.push("ram_tier_gb: not exposed by this browser")}
  try{
    const est=await nav.storage.estimate();
    const gb=x=>(x/1073741824).toFixed(2);
    lines.push("storage_used_gb: "+gb(est.usage||0));
    lines.push("storage_quota_gb: "+gb(est.quota||0)+" (origin quota, not the SD card size)");
    if(est.usageDetails) lines.push("storage_detail: "+JSON.stringify(est.usageDetails));
  }catch(e){lines.push("storage: not exposed")}
  try{if(nav.storage.persist) lines.push("storage_persisted: "+await nav.storage.persist())}catch(e){}
  lines.push("cpu_cores: "+(nav.hardwareConcurrency||"not exposed"));
  lines.push("online: "+nav.onLine);
  lines.push("screen: "+screen.width+"x"+screen.height+" @ devicePixelRatio "+(window.devicePixelRatio||1));
  try{
    if(nav.getBattery){
      const b=await nav.getBattery();
      lines.push("battery: "+Math.round(b.level*100)+"% "+(b.charging?"charging":"on battery"));
    }else{lines.push("battery: not exposed by this browser")}
  }catch(e){lines.push("battery: not exposed")}
  const ua=nav.userAgent||"";
  const plat=/Android/i.test(ua)?"Android":/iPhone|iPad/i.test(ua)?"iOS":/Win/i.test(ua)?"Windows":/Mac/i.test(ua)?"macOS":/Linux/i.test(ua)?"Linux":"unknown";
  lines.push("platform: "+plat);
  lines.push("language: "+nav.language);
  lines.push("note: browser cannot read total physical RAM/ROM. For exact sizes: Settings > About phone > Hardware information. Paste those numbers into a letter if an agent asks.");
  docReportText=lines.join("\n");
  out.textContent=docReportText;
  slog("device report generated: "+docReportText.split("\n").length+" lines, no personal data");
}

$("docRun").addEventListener("click",runDocScan);

$("docSend").addEventListener("click",async()=>{
  if(!docReportText){alert2("tap scan first, then send the report");return}
  const agent=($("docAgent").value||"").trim();
  if(!agent){alert2("name the agent to receive the report");return}
  if(!state.cfg.ring){alert2("set the exchange URL in Setup first");return}
  const btn=$("docSend");
  btn.disabled=true; btn.textContent="sending\u2026";
  try{
    await api({op:"send",from:state.cfg.name||"phone",to:agent,
      subject:"[PKT] device report",
      body:"SCOPED GRANT PACKET\nkind: device report (hardware numbers only)\n\n"+docReportText});
    newGrant(agent,"READ: device report",300);
    slog("device report sent to "+agent+", grant 300s");
  }catch(e){alert2("send failed: "+e.message)}
  btn.disabled=false; btn.textContent="send report";
  renderGrants();
});

/* ---------- voice + daily runner ---------- */
/* Honest tier: the page listens only after a tap, drafts replies, keeps notes and
   reminders, and opens apps by URL. It cannot control other apps like a native assistant. */

const LS_DAILY="adeck.daily";
function loadDaily(){try{return JSON.parse(LS.getItem(LS_DAILY)||"{\"notes\":[],\"rems\":[]}")}catch(e){return{notes:[],rems:[]}}}
function saveDaily(d){LS.setItem(LS_DAILY,JSON.stringify(d))}

function speak(t){
  try{const u=new SpeechSynthesisUtterance(t);u.rate=1;speechSynthesis.speak(u)}catch(e){}
}
function showHeard(t,cls){
  const h=$("heard"); h.classList.toggle("muted",!cls);
  h.textContent=t;
}

function renderDaily(){
  const d=loadDaily(), el=$("dailyList");
  if(!d.notes.length&&!d.rems.length){el.textContent="No notes or reminders yet.";el.classList.add("muted");return}
  el.classList.remove("muted");
  const rows=["NOTES"]; d.notes.slice(0,30).forEach((n,i)=>rows.push((i+1)+". "+n.text+"  ("+n.ts+")"));
  rows.push("","REMINDERS");
  d.rems.slice().sort((a,b)=>a.at-b.at).forEach(r=>rows.push(new Date(r.at).toLocaleString()+"  "+r.text+(r.fired?"  [fired]":"")));
  el.textContent=rows.join("\n");
}
function addNote(text){
  const d=loadDaily(); d.notes.unshift({ts:now(),text}); d.notes=d.notes.slice(0,100);
  saveDaily(d); renderDaily(); slog("note saved: "+text.slice(0,50));
}
function addReminder(text,at){
  const d=loadDaily(); d.rems.push({text,at}); saveDaily(d); renderDaily();
  slog("reminder set for "+new Date(at).toLocaleString());
}

/* reminder checks while the page is open */
setInterval(()=>{
  const d=loadDaily(); let did=false;
  d.rems.forEach(r=>{
    if(!r.fired&&r.at<=Date.now()){
      r.fired=true; did=true;
      try{navigator.vibrate&&navigator.vibrate([300,120,300])}catch(e){}
      speak("Reminder: "+r.text);
      alert2("REMINDER: "+r.text);
    }
  });
  if(did){saveDaily(d);renderDaily()}
},20000);

$("noteAdd").addEventListener("click",()=>{
  const v=$("noteIn").value.trim(); if(!v)return alert2("type the note first");
  addNote(v); $("noteIn").value="";
});
$("remAdd").addEventListener("click",()=>{
  const t=$("remText").value.trim(), at=$("remIn").value;
  if(!t||!at)return alert2("reminder needs text and a time");
  addReminder(t,new Date(at).getTime()); $("remText").value="";
});

/* studio launcher + reply drafter */
$("goStudio").addEventListener("click",()=>{
  let url=(state.cfg.studio||"").trim();
  if(!url){url=prompt("Paste your Nico Gen Studio URL once; it saves:")||""; if(!url)return; state.cfg.studio=url; saveSetup(); $("studioUrl")&&($("studioUrl").value=url);}
  window.open(url,"_blank"); slog("opened Nico Gen Studio");
});
$("goReply").addEventListener("click",()=>{
  const pool=loadDaily().notes.map(n=>n.text);
  const last=pool[0]||"";
  const draft="Thanks for your message! I saw it. I will get back to you properly"+(last?". Quick note for myself: "+last:".");
  const to=prompt("Paste this draft into the chat. Say OK if you also want it copied:",draft);
  if(to){
    try{navigator.clipboard.writeText(draft);slog("reply draft copied to clipboard")}
    catch(e){slog("copy blocked; draft shown in prompt")}
  }
});
$("studioUrl").addEventListener("change",e=>{
  state.cfg.studio=e.target.value.trim(); saveSetup(); slog("studio URL saved");
});

/* voice recognition */
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
let rec=null, listening=false;
if(!SR){
  $("micBtn").disabled=true; $("micBtn").textContent="voice not supported in this browser";
  showHeard("This browser has no Web Speech. Use Chrome on Android for voice.",false);
}else{
  rec=new SR(); rec.lang=navigator.language||"en-US"; rec.interimResults=true; rec.maxAlternatives=1;
  rec.onstart=()=>{listening=true;$("micBtn").textContent="listening\u2026 tap to stop";showHeard("listening\u2026",false)};
  rec.onresult=e=>{
    let fin="",raw="";
    for(const r of e.results){raw+=r[0].transcript; if(r.isFinal)fin=r[0].transcript}
    showHeard("heard: "+(fin||raw),!!fin);
    if(fin) runIntent(fin.trim());
  };
  rec.onerror=e=>{listening=false;$("micBtn").textContent="press and speak";showHeard("voice error: "+e.error,false)};
  rec.onend=()=>{listening=false;$("micBtn").textContent="press and speak"};
}
$("micBtn").addEventListener("click",()=>{
  if(!rec)return;
  if(listening){rec.stop();return}
  try{rec.start()}catch(e){/* already started */}
});

function switchTab(name){
  const t=document.querySelector('[data-tab="'+name+'"]'); if(t)t.click();
}
function runIntent(say){
  const s=say.toLowerCase();
  if(/scan|report|about my phone|diagnos/.test(s)){
    switchTab("doctor"); runDocScan(); speak("Scanning your phone now.");
  }else if(/^\s*(note|write a note|save a note)/.test(s)){
    const text=say.replace(/^\s*(note|write a note|save a note)\s*/i,"").trim()||"(empty note)";
    addNote(text); speak("Note saved.");
  }else if(/remind me/.test(s)){
    const text=say.replace(/^\s*remind me\s*(to )?/i,"").trim()||"(reminder)";
    const at=Date.now()+60*60000; // voice reminders default: 60 minutes
    addReminder(text,at); speak("Reminder set for one hour from now. Change the time in the daily runner.");
  }else if(/job|inbox|letter|mail/.test(s)){
    switchTab("jobs"); pollRing(); speak("Checking the ring for jobs.");
  }else if(/studio|video|generate/.test(s)){
    $("goStudio").click(); speak("Opening Nico Gen Studio.");
  }else if(/whats ?app|reply|message/.test(s)){
    switchTab("voice"); $("goReply").click(); speak("Drafting your reply. You press send.");
  }else if(/battery|storage|ram/.test(s)){
    switchTab("doctor"); runDocScan(); speak("Showing the device report.");
  }else{
    addNote(say); speak("I saved that as a note.");
  }
}

/* ---------- memory vault ---------- */
/* Layer 1: IndexedDB on this phone (big, private, survives restarts).
   Layer 2: GitHub archive (free, permanent, versioned) = the eternity layer. */

function idbOpen(){
  return new Promise((res,rej)=>{
    const rq=indexedDB.open('adeck-vault',1);
    rq.onupgradeneeded=()=>{rq.result.createObjectStore('files',{keyPath:'id'})};
    rq.onsuccess=()=>res(rq.result);
    rq.onerror=()=>rej(rq.error);
  });
}
async function vaultPut(rec){
  const db=await idbOpen();
  return new Promise((res,rej)=>{
    const tx=db.transaction('files','readwrite');
    tx.objectStore('files').put(rec);
    tx.oncomplete=res; tx.onerror=()=>rej(tx.error);
  });
}
async function vaultAll(){
  const db=await idbOpen();
  return new Promise((res,rej)=>{
    const rq=db.transaction('files').objectStore('files').getAll();
    rq.onsuccess=()=>res(rq.result); rq.onerror=()=>rej(rq.error);
  });
}
async function vaultDel(id){
  const db=await idbOpen();
  return new Promise((res,rej)=>{
    const tx=db.transaction('files','readwrite');
    tx.objectStore('files').delete(id);
    tx.oncomplete=res; tx.onerror=()=>rej(tx.error);
  });
}

function gbFmt(n){
  const u=['B','KB','MB','GB'];let i=0;
  while(n>=1024&&i<3){n/=1024;i++}
  return n.toFixed(i?1:0)+' '+u[i];
}

async function vaultUsage(){
  try{
    const est=await navigator.storage.estimate();
    const files=await vaultAll();
    const tot=files.reduce((a,f)=>a+(f.blob&&f.blob.size||0),0);
    $('vaultUsage').textContent=files.length+' file(s), '+gbFmt(tot)+' used of '+gbFmt(est.quota||0)+' available';
  }catch(e){$('vaultUsage').textContent='usage unknown: '+e.message}
}

async function renderVault(){
  const files=await vaultAll(), el=$('vaultList');
  if(!files.length){el.textContent='Vault is empty. Saved files survive refreshes and restarts.';el.classList.add('muted');await vaultUsage();return}
  el.classList.remove('muted');
  el.innerHTML='';
  files.slice().sort((a,b)=>b.ts-a.ts).forEach(f=>{
    const row=document.createElement('div');
    row.className='vault-row';
    const meta=document.createElement('div');
    meta.innerHTML='<b>'+esc(f.name)+'</b> <span class="muted">'+gbFmt(f.blob.size||0)+'  '+f.ts+(f.gh?'  \u00b7 archived to GitHub':'')+'</span>';
    meta.style.cssText='flex:1;min-width:140px';
    const bOpen=document.createElement('button'); bOpen.className='btn'; bOpen.textContent='open';
    bOpen.onclick=()=>{const u=URL.createObjectURL(f.blob);window.open(u,'_blank');setTimeout(()=>URL.revokeObjectURL(u),30000)};
    const bGh=document.createElement('button'); bGh.className='btn'; bGh.textContent=f.gh?'re-archive':'archive';
    bGh.onclick=async()=>{try{await ghArchiveOne(f);f.gh=true;await vaultPut(f);renderVault()}catch(e){alert2('archive failed: '+e.message)}};
    const bDel=document.createElement('button'); bDel.className='btn'; bDel.textContent='delete';
    bDel.onclick=async()=>{await vaultDel(f.id);renderVault();slog('vault deleted: '+f.name)};
    row.append(meta,bOpen,bGh,bDel);
    el.appendChild(row);
  });
  await vaultUsage();
}

$('vaultAdd').addEventListener('click',()=>$('vaultFile').click());
$('vaultFile').addEventListener('change',async e=>{
  for(const f of e.target.files){
    await vaultPut({id:Date.now()+'-'+f.name+'-'+Math.random().toString(36).slice(2,7),name:f.name,blob:f,ts:now()});
    slog('vault saved: '+f.name+' ('+gbFmt(f.size)+')');
  }
  e.target.value=''; renderVault();
});
$('vaultPersist').addEventListener('click',async()=>{
  try{
    const ok=await navigator.storage.persist();
    slog('vault persistence request: '+(ok?'GRANTED, browser will not evict':'denied for now (install the deck as an app, then retry)'));
    alert2(ok?'Vault locked: the browser will not clear it on its own.':'Not granted yet. Install the deck to your home screen and retry once.')
  }catch(e){alert2('persistence request failed: '+e.message)}
});

/* GitHub eternity layer */
const LS_GH='adeck.gh';
function gh(){try{return JSON.parse(LS.getItem(LS_GH)||'{}')}catch(e){return{}}}
$('ghSave').addEventListener('click',()=>{
  const repo=($('ghRepo').value||'').trim()||'reezdigital1-svg/ReezDigital';
  const token=($('ghToken').value||'').trim();
  if(!token)return alert2('paste a fine-grained token first');
  LS.setItem(LS_GH,JSON.stringify({repo,token}));
  $('ghResult').textContent='saved: '+repo+' (token stays on this phone only)';
  slog('GitHub vault keys saved for '+repo);
});

function b64Of(blob){
  return new Promise((res,rej)=>{
    const r=new FileReader();
    r.onload=()=>{
      const bytes=new Uint8Array(r.result); let bin='';
      const CH=32768;
      for(let i=0;i<bytes.length;i+=CH){bin+=String.fromCharCode.apply(null,bytes.subarray(i,i+CH))}
      res(btoa(bin));
    };
    r.onerror=()=>rej(r.error);
    r.readAsArrayBuffer(blob);
  });
}
async function ghArchiveOne(rec){
  const g=gh();
  if(!g.token||!g.repo)throw new Error('save the GitHub token and repo first');
  const content=await b64Of(rec.blob);
  const path='deck-vault/'+rec.name;
  const api='https://api.github.com/repos/'+g.repo+'/contents/'+path;
  const put=(sha)=>fetch(api,{
    method:'PUT',
    headers:{'Authorization':'Bearer '+g.token,'Accept':'application/vnd.github+json','Content-Type':'application/json'},
    body:JSON.stringify({message:'vault archive: '+rec.name,content,sha})
  });
  let r=await put(undefined);
  if(r.status===422){
    const g0=await fetch(api,{headers:{'Authorization':'Bearer '+g.token,'Accept':'application/vnd.github+json'}});
    const j0=await g0.json();
    if(g0.ok&&j0.sha)r=await put(j0.sha);
  }
  if(!r.ok)throw new Error('GitHub '+r.status+' '+(await r.text()).slice(0,160));
  return 'https://github.com/'+g.repo+'/tree/main/deck-vault';
}
$('ghSync').addEventListener('click',async()=>{
  const btn=$('ghSync'); btn.disabled=true; btn.textContent='archiving\u2026';
  try{
    const files=await vaultAll();
    if(!files.length)throw new Error('vault is empty');
    let ok=0;
    for(const f of files){
      try{await ghArchiveOne(f);f.gh=true;await vaultPut(f);ok++}
      catch(e){slog('archive failed for '+f.name+': '+e.message)}
    }
    const g=gh();
    $('ghResult').textContent='archived '+ok+' of '+files.length+' file(s): https://github.com/'+g.repo+'/tree/main/deck-vault';
    slog('GitHub archive done: '+ok+'/'+files.length);
    renderVault();
  }catch(e){alert2('archive failed: '+e.message)}
  btn.disabled=false; btn.textContent='archive all to GitHub';
});

/* free AI quick buttons */
$('aiStudio').addEventListener('click',()=>$('goStudio').click());
$('aiRing').addEventListener('click',()=>switchTab('jobs'));

/* ---------- AI model knowledge base ---------- */
const KB=[
 {cat:'claude',name:'Claude Fable 5.2 (current world flagship)',
  f:'Released November 9, 2026. Anthropic\u2019s most capable model: top results in coding, reasoning, vision, math and science. 1M token context, up to 128K output, 30% faster output than 5.1, anti-distillation protections, can coordinate 1,000+ agents at once. Available to claude.ai Pro, Max, Ultra, Team, Enterprise and on the Claude API, AWS Bedrock, Google Cloud, Microsoft Foundry.'},
 {cat:'claude',name:'Claude Fable 5.5 (pre-release, next flagship)',
  f:'NOT officially released. Leaked October 13, 2026 in the Microsoft Azure catalog with a GA status, then pulled; LiteLLM briefly listed claude-fable-5-5 with prices copied from Fable 5.1. Reports say partners already have early access. Treat any Fable 5.5 specs or downloads found online right now as rumor or fake. This entry updates the day Anthropic publishes official specs.'},
 {cat:'claude',name:'Claude Fable 5',
  f:'Released June 9, 2026. First Mythos-class model opened to the public. $10 per million input tokens, $50 per million output, cache read $1, batch API 50% off. 1M context, 128K max output, knowledge cutoff January 2026. Now legacy; retirement not sooner than June 9, 2027.'},
 {cat:'claude',name:'Claude Fable 5.1',
  f:'Released September 2026. Same capability class as Fable 5, about 25% cheaper to run for typical workloads, up to ~45% cheaper for complex coding and long agentic tasks.'},
 {cat:'claude',name:'Claude Opus 5.5 / Sonnet 5.5 / Haiku 5.5',
  f:'The daily-driver tiers released September 2026. Anthropic guidance: Opus 5.5 for everyday work ($4/$20 per MTok), Sonnet 5.5 ($2/$10) for volume, Haiku 5.5 (from $0.10/$0.50) for cheap scale. All have 1M context.'},
 {cat:'claude',name:'Claude Mythos (restricted twin)',
  f:'Mythos is the same underlying model as Fable but with fewer safeguards, offered only to vetted organizations in cybersecurity and life sciences. Roughly 8 trillion parameters by industry estimates. You cannot sign up for it; verified orgs only.'},
 {cat:'claude',name:'Free Claude doors',
  f:'claude.ai has a free tier with limited use of strong models. Claude is also the agent connected to your Agent Exchange ring, so you already send Claude real jobs at zero cost through the ring.'},
 {cat:'openai',name:'OpenAI GPT-5 family + Astra',
  f:'GPT-5 Astra is OpenAI\u2019s current flagship line. Leaks in November 2026 showed OpenAI A/B testing a GPT-6.2 Astra variant in Codex usage analytics before any announcement. Same rule as Fable 5.5: pre-release info is rumor until OpenAI speaks.'},
 {cat:'openai',name:'ChatGPT free tier',
  f:'chatgpt.com is free with limits, including a limited number of the strongest model replies per day. Custom GPT Actions (like the kit in your repo) work on the free tier, which is how your ChatGPT seat reaches the ring.'},
 {cat:'openai',name:'OpenAI API pricing shape',
  f:'Pay per token, in and out, with prompt caching and a Batch API at 50% off. Image and audio models priced per generation/minute. No unlimited free API; costs scale with usage.'},
 {cat:'google',name:'Google Gemini 4 Carbon',
  f:'Google\u2019s flagship released November 2026, the model Fable 5.2 benchmarked against. Strong multimodal (text, image, audio, video input). Free personal access through the Gemini app; free developers entry through Google AI Studio with rate limits.'},
 {cat:'open',name:'What open weights means',
  f:'Open-weight models publish the trained model file itself. You download it once and run it on your own machine forever, free, offline. The catch: nobody can hand you the newest flagship as open weights, and running big ones needs real GPU memory. Open weights is the only path to true free frontier-adjacent AI.'},
 {cat:'open',name:'Llama (Meta)',
  f:'Meta\u2019s open-weight family. Free to download and run, license restricts some very-large-company uses. The classic choice for a private local assistant on your own machine.'},
 {cat:'open',name:'Mistral',
  f:'European lab, famous for permissive small open models plus paid frontier APIs. Its small open models run on modest hardware. The model writing this knowledge base, via your Agent Exchange setup.'},
 {cat:'open',name:'Qwen (Alibaba) and DeepSeek',
  f:'Two strong open-weight families from China. Qwen covers many sizes and languages; DeepSeek got famous for near-frontier reasoning at train-time prices far below US labs. Both free to download and run yourself.'},
 {cat:'media',name:'FLUX.1 image models',
  f:'FLUX.1 schnell: Apache 2.0 license, free including commercial work. FLUX.1 dev: stronger, but its license is non-commercial. Current photoreal open-weights king at smaller sizes; needs a GPU for comfortable use.'},
 {cat:'media',name:'Stable Diffusion XL',
  f:'Older but runs on weak hardware, huge fine-tune community, fully open. Still the safest pick for low-VRAM machines.'},
 {cat:'media',name:'AI video: the paid truth',
  f:'The best AI video (Sora, Veo, Higgsfield, Runway, Pika) is closed, paid, and credit-metered. There is no open-weights model that matches them on a phone. Your legal free paths: our Nicogen engine, free-tier trials where offered, and footage sites Mixkit/Coverr which are license-clean for your videos.'},
 {cat:'ours',name:'Nico Gen Studio (yours, free forever)',
  f:'Your own browser video engine: fBm generative scenes, keyword routing, halation film pass, 9:16 and 16:9, no API, no credits. One tap opens it from this deck. It also exists as a Python engine and MCP server in your repo.'},
 {cat:'ours',name:'Nicodiff v0.1 (your own diffusion model)',
  f:'Built and trained from scratch in your repo: 359,587 parameters, 20,755 steps, grade C1 PASS with worst channel G std 7.6%. Exports to a single 1.45MB ONNX file with parity 2.38e-07, ready for browser inference. The road to photos-real is on your GPU machine with the same code.'},
 {cat:'ours',name:'Agent Exchange ring',
  f:'Your public agent mail system on Vercel: any agent with a name can send and receive, transcripts archived in your GitHub repo. Claude is connected with an hourly auto-reply run; your phone now reaches it through this deck.'},
 {cat:'free',name:'Rule of free: the honest map',
  f:'Nothing forces companies to open their best models, so nobody truly gets all AI models free. The working map: free chat tiers (claude.ai, chatgpt.com, gemini), open weights on your own hardware (Llama, Mistral, Qwen, DeepSeek, FLUX schnell), per-project free doors (Vercel hobby, GitHub, Mixkit, Coverr, uguu), and everything you build yourself (Studio, Nicodiff, the ring, this deck).'},
 {cat:'free',name:'Batch and caching: pay half',
  f:'On Claude API: Batch API is 50% off input and output; prompt cache read is a fraction of input price. Design agent jobs around batching + caching before paying for a bigger plan.'},
 {cat:'free',name:'Free-model scam pattern',
  f:'Sites (or APKs) offering free GPT-6, free Fable 5.5, cracked Higgsfield: they steal credentials, resell stolen API keys, or ship malware. Never sign in to a model outside its official site, never paste a token into a site you did not choose.'}
];
let kbCat='all', kbQ='';
function renderKB(){
  const el=$('kbList'); el.innerHTML='';
  const q=kbQ.trim().toLowerCase();
  const rows=KB.filter(k=>(kbCat==='all'||k.cat===kbCat)&&(!q||(k.name+' '+k.f+' '+k.cat).toLowerCase().includes(q)));
  if(!rows.length){el.innerHTML='<p class="muted" style="font-size:13px">nothing matches that search</p>';return}
  rows.forEach(k=>{
    const d=document.createElement('div'); d.className='kb';
    d.innerHTML='<b>'+esc(k.name)+'</b><span class="kb-tag">'+esc(k.cat)+'</span><p>'+esc(k.f)+'</p>';
    el.appendChild(d);
  });
}
$('kbSearch').addEventListener('input',e=>{kbQ=e.target.value;renderKB()});
$('kbChips').addEventListener('click',e=>{
  const b=e.target.closest('.chip'); if(!b)return;
  document.querySelectorAll('#kbChips .chip').forEach(x=>x.classList.toggle('is-on',x===b));
  kbCat=b.dataset.cat; renderKB();
});

/* ---------- boot ---------- */
renderLog(); renderGrants(); renderDocList(); renderDaily(); renderVault();
(function(){const g=gh(); if(g.repo&&$("ghRepo"))$("ghRepo").value=g.repo;})();
if(state.cfg.studio&&$("studioUrl"))$("studioUrl").value=state.cfg.studio;
renderKB();
slog("Agent Deck opened. Default deny active.");
pruneGrants(); renderGrants();
