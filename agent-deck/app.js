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
  state.cfg={name:$("myName").value.trim()||"phone", ring:$("ringUrl").value.trim().replace(/\/$/,"")};
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

/* ---------- boot ---------- */
renderLog(); renderGrants();
slog("Agent Deck opened. Default deny active.");
pruneGrants(); renderGrants();
