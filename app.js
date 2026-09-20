const BLOOD_GROUPS = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];
const COMPAT = {
  "O-": ["O-"],
  "O+": ["O+","O-"],
  "A-": ["A-","O-"],
  "A+": ["A+","A-","O+","O-"],
  "B-": ["B-","O-"],
  "B+": ["B+","B-","O+","O-"],
  "AB-": ["AB-","A-","B-","O-"],
  "AB+": ["AB+","AB-","A+","A-","B+","B-","O+","O-"],
};

const els = {};
let donors = JSON.parse(localStorage.getItem("lifedrop_donors")||"null") || seedDonors();
let requests = JSON.parse(localStorage.getItem("lifedrop_requests")||"null") || seedRequests();
let inventoryLog = JSON.parse(localStorage.getItem("lifedrop_log")||"null") || seedLog();
let donateTargetId = null;

function seedDonors(){
  return [
    {id:uid(),name:"Aarav Sharma",age:28,bloodGroup:"O+",phone:"+91 98765 43211",location:"Delhi",lastDonation:daysAgo(72),totalDonations:5},
    {id:uid(),name:"Priya Verma",age:24,bloodGroup:"A+",phone:"+91 98765 43212",location:"Mumbai",lastDonation:daysAgo(20),totalDonations:2},
    {id:uid(),name:"Rohan Gupta",age:31,bloodGroup:"B-",phone:"+91 98765 43213",location:"Bengaluru",lastDonation:daysAgo(95),totalDonations:8},
    {id:uid(),name:"Sneha Patel",age:26,bloodGroup:"AB+",phone:"+91 98765 43214",location:"Ahmedabad",lastDonation:null,totalDonations:0},
    {id:uid(),name:"Aman Singh",age:29,bloodGroup:"O-",phone:"+91 98765 43215",location:"Delhi",lastDonation:daysAgo(10),totalDonations:3},
    {id:uid(),name:"Kavya Reddy",age:27,bloodGroup:"A-",phone:"+91 98765 43216",location:"Hyderabad",lastDonation:daysAgo(60),totalDonations:4},
  ];
}
function seedRequests(){
  return [
    {id:uid(),patientName:"Ramesh Kumar",bloodGroup:"B+",units:2,hospital:"AIIMS Delhi",contact:"+91 90000 11111",urgency:"urgent",status:"pending",date:new Date().toISOString()},
    {id:uid(),patientName:"Ananya Desai",bloodGroup:"O-",units:1,hospital:"Fortis Mumbai",contact:"+91 90000 22222",urgency:"critical",status:"pending",date:daysAgo(1)},
    {id:uid(),patientName:"Vikram Mehta",bloodGroup:"AB+",units:3,hospital:"Apollo Chennai",contact:"+91 90000 33333",urgency:"normal",status:"fulfilled",date:daysAgo(2)},
  ];
}
function seedLog(){
  return [
    {date:new Date().toISOString(),action:"Donation",group:"O+",units:1,note:"Aarav Sharma donation"},
    {date:daysAgo(1),action:"Issued",group:"B+",units:2,note:"Request for Ramesh Kumar"},
  ];
}
function uid(){return Math.random().toString(36).slice(2,9)}
function daysAgo(n){const d=new Date();d.setDate(d.getDate()-n);return d.toISOString().slice(0,10)}
function save(){
  localStorage.setItem("lifedrop_donors",JSON.stringify(donors));
  localStorage.setItem("lifedrop_requests",JSON.stringify(requests));
  localStorage.setItem("lifedrop_log",JSON.stringify(inventoryLog));
}
function isEligible(d){
  if(!d.lastDonation) return true;
  const diff = (Date.now() - new Date(d.lastDonation).getTime())/86400000;
  return diff >= 56;
}
function daysSince(date){
  if(!date) return null;
  return Math.floor((Date.now()-new Date(date).getTime())/86400000);
}
function inventory(){
  const map={}; BLOOD_GROUPS.forEach(g=>map[g]=8);
  // apply log
  inventoryLog.forEach(l=>{
    if(l.action==="Donation") map[l.group]=(map[l.group]||0)+l.units;
    if(l.action==="Issued") map[l.group]=(map[l.group]||0)-l.units;
  });
  // also adjust for fulfilled that not in log (ensure non-negative)
  BLOOD_GROUPS.forEach(g=>{ if(map[g]<0) map[g]=0; });
  return map;
}

function renderAll(){
  const inv=inventory();
  const eligible = donors.filter(isEligible).length;
  const pending = requests.filter(r=>r.status==="pending").length;
  const urgent = requests.filter(r=>r.status==="pending" && (r.urgency==="urgent"||r.urgency==="critical")).length;
  const totalUnits = Object.values(inv).reduce((a,b)=>a+b,0);
  const lives = donors.reduce((a,d)=>a+d.totalDonations,0)*3;

  document.getElementById("stat-donors").textContent = donors.length;
  document.getElementById("stat-eligible").textContent = eligible + " eligible now";
  document.getElementById("stat-units").textContent = totalUnits;
  document.getElementById("stat-pending").textContent = pending;
  document.getElementById("stat-urgent").textContent = urgent + " urgent";
  document.getElementById("stat-lives").textContent = lives;
  document.getElementById("nav-donor-count").textContent = donors.length;
  document.getElementById("nav-request-count").textContent = pending;

  // stock grid
  const sg=document.getElementById("stockGrid"); sg.innerHTML="";
  BLOOD_GROUPS.forEach(g=>{
    const units=inv[g];
    let cls=""; if(units<=4) cls="critical"; else if(units<=7) cls="low";
    const pct=Math.min(100, units/15*100);
    sg.innerHTML+=`<div class="stock-item ${cls}"><span>${g}</span><b>${units}</b><small>units</small><div class="stock-bar"><i style="width:${pct}%"></i></div></div>`;
  });

  // recent requests
  const rr=document.getElementById("recentRequests"); rr.innerHTML="";
  requests.slice(0,4).forEach(r=>{
    rr.innerHTML+=`<tr><td>${r.patientName}</td><td><span class="bg-pill">${r.bloodGroup}</span></td><td>${r.units}</td><td><span class="status ${r.status}">${r.status}</span></td></tr>`;
  });

  // timeline
  const tl=document.getElementById("timeline"); tl.innerHTML="";
  [...inventoryLog].reverse().slice(0,5).forEach(l=>{
    tl.innerHTML+=`<div class="tl-item"><span class="tl-dot"></span><div><b>${l.action} • ${l.group} • ${l.units} unit(s)</b><div style="color:#64748b;font-size:12px">${new Date(l.date).toLocaleDateString()} — ${l.note}</div></div></div>`;
  });
  if(!inventoryLog.length) tl.innerHTML='<div style="color:#94a3b8;font-size:13px">No activity yet</div>';

  // eligible list
  const elList=document.getElementById("eligibleList"); elList.innerHTML="";
  donors.filter(isEligible).slice(0,5).forEach(d=>{
    elList.innerHTML+=`<div class="elig-row"><div><b>${d.name}</b> <span class="bg-pill" style="margin-left:6px">${d.bloodGroup}</span><div style="color:#64748b;font-size:12px">${d.location} • ${d.phone}</div></div><span class="status eligible">Eligible</span></div>`;
  });
  if(!donors.filter(isEligible).length) elList.innerHTML='<div style="color:#94a3b8;font-size:13px">No eligible donors at the moment</div>';

  renderDonors();
  renderRequests();
  renderInventory();
}

function renderDonors(){
  const q=(document.getElementById("globalSearch").value||"").toLowerCase();
  const fb=document.getElementById("filterBlood").value;
  const fe=document.getElementById("filterEligible").value;
  const tbody=document.getElementById("donorTable");
  tbody.innerHTML="";
  let list=[...donors];
  if(q) list=list.filter(d=> (d.name+d.bloodGroup+d.location+d.phone).toLowerCase().includes(q));
  if(fb) list=list.filter(d=>d.bloodGroup===fb);
  if(fe==="eligible") list=list.filter(isEligible);
  if(fe==="not") list=list.filter(d=>!isEligible(d));
  document.getElementById("donorEmpty").classList.toggle("hidden", list.length!==0);
  document.getElementById("donorSubtitle").textContent = `${list.length} donor(s) • ${list.filter(isEligible).length} eligible`;
  list.forEach(d=>{
    const ds = d.lastDonation ? `${d.lastDonation} (${daysSince(d.lastDonation)} days ago)` : "Never";
    const elig = isEligible(d);
    tbody.innerHTML+=`<tr>
      <td><b>${d.name}</b><div style="color:#64748b;font-size:12px">${d.age} yrs • ${d.phone}</div></td>
      <td><span class="bg-pill">${d.bloodGroup}</span></td>
      <td>${d.location}</td>
      <td style="font-size:12px">${ds}</td>
      <td><span class="status ${elig?'eligible':'not'}">${elig?'Eligible':'Not Eligible'}</span></td>
      <td><b>${d.totalDonations}</b></td>
      <td style="display:flex;gap:6px">
        <button class="btn-sm primary" onclick="openDonate('${d.id}')" ${!elig?'disabled style="opacity:.5;cursor:not-allowed"':''}>Donate</button>
        <button class="btn-sm" onclick="deleteDonor('${d.id}')"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>`;
  });
}

function renderRequests(){
  const statusFilter=document.getElementById("filterRequestStatus").value;
  const q=(document.getElementById("globalSearch").value||"").toLowerCase();
  const grid=document.getElementById("requestGrid"); grid.innerHTML="";
  let list=[...requests].sort((a,b)=> new Date(b.date)-new Date(a.date));
  if(statusFilter) list=list.filter(r=>r.status===statusFilter);
  if(q) list=list.filter(r=> (r.patientName+r.bloodGroup+r.hospital).toLowerCase().includes(q));
  document.getElementById("requestEmpty").classList.toggle("hidden", list.length!==0);
  list.forEach(r=>{
    const matches = donors.filter(d=> COMPAT[r.bloodGroup].includes(d.bloodGroup) && isEligible(d)).length;
    grid.innerHTML+=`<div class="req-card">
      <div style="display:flex;justify-content:space-between;align-items:center"><span class="bg-pill">${r.bloodGroup}</span><span class="status ${r.urgency}">${r.urgency}</span></div>
      <h4 style="margin-top:8px">${r.patientName}</h4>
      <div class="req-meta">${r.hospital} • ${r.units} unit(s) • ${new Date(r.date).toLocaleDateString()}<br>${r.contact}</div>
      <div style="font-size:12px;color:#64748b"><i class="fa-solid fa-users"></i> ${matches} compatible donors available</div>
      <div style="margin:6px 0"><span class="status ${r.status}">${r.status}</span></div>
      <div class="req-actions">
        ${r.status==="pending"?`<button class="btn-sm primary" onclick="fulfillRequest('${r.id}')">Fulfill</button><button class="btn-sm" onclick="updateRequestStatus('${r.id}','cancelled')">Cancel</button>`:`<button class="btn-sm" onclick="updateRequestStatus('${r.id}','pending')">Reopen</button>`}
        <button class="btn-sm" onclick="deleteRequest('${r.id}')">Delete</button>
      </div>
    </div>`;
  });
}

function renderInventory(){
  const inv=inventory();
  const grid=document.getElementById("inventoryGrid"); grid.innerHTML="";
  BLOOD_GROUPS.forEach(g=>{
    const units=inv[g];
    let status="Healthy"; let color="#16a34a";
    if(units<=4){status="Critical"; color="#dc2626"} else if(units<=7){status="Low"; color="#ea580c"}
    grid.innerHTML+=`<div class="inv-card"><span>${g}</span><h4 style="color:${color}">${units}</h4><small>${status}</small></div>`;
  });
  const logBody=document.getElementById("inventoryLog"); logBody.innerHTML="";
  ;[...inventoryLog].reverse().forEach(l=>{
    logBody.innerHTML+=`<tr><td>${new Date(l.date).toLocaleString()}</td><td>${l.action}</td><td><span class="bg-pill">${l.group}</span></td><td>${l.units}</td><td>${l.note}</td></tr>`;
  });
}

// Actions
function openDonate(id){
  donateTargetId=id;
  const d=donors.find(x=>x.id===id);
  if(!isEligible(d)){ toast("Donor not eligible yet (56 days required)"); return; }
  document.getElementById("donateText").textContent = `Record a blood donation for ${d.name} (${d.bloodGroup})? This will add 1 unit to inventory and update last donation date to today.`;
  openModal("donateModal");
}
function deleteDonor(id){
  if(!confirm("Delete this donor?")) return;
  donors=donors.filter(d=>d.id!==id); save(); renderAll(); toast("Donor removed");
}
function deleteRequest(id){
  if(!confirm("Delete this request?")) return;
  requests=requests.filter(r=>r.id!==id); save(); renderAll(); toast("Request removed");
}
function fulfillRequest(id){
  const r=requests.find(x=>x.id===id);
  const inv=inventory();
  if((inv[r.bloodGroup]||0) < r.units){ toast("Insufficient stock for "+r.bloodGroup); return; }
  r.status="fulfilled";
  inventoryLog.push({date:new Date().toISOString(),action:"Issued",group:r.bloodGroup,units:r.units,note:`Fulfilled request for ${r.patientName}`});
  save(); renderAll(); toast("Request fulfilled — stock deducted");
}
function updateRequestStatus(id,status){
  const r=requests.find(x=>x.id===id); r.status=status; save(); renderAll(); toast("Request "+status);
}

// Modals
function openModal(id){ document.getElementById(id).classList.add("open"); }
function closeModal(id){ document.getElementById(id).classList.remove("open"); }

document.getElementById("openDonorModal").onclick=()=>openModal("donorModal");
document.getElementById("openRequestModal").onclick=()=>openModal("requestModal");
document.querySelectorAll("[data-close]").forEach(b=> b.onclick=()=> closeModal(b.dataset.close));
document.querySelectorAll(".modal").forEach(m=> m.addEventListener("click", e=>{ if(e.target===m) closeModal(m.id)}));

document.getElementById("donorForm").addEventListener("submit", e=>{
  e.preventDefault();
  const fd=new FormData(e.target);
  const d={
    id:uid(),
    name:fd.get("name").trim(),
    age:Number(fd.get("age")),
    bloodGroup:fd.get("bloodGroup"),
    phone:fd.get("phone").trim(),
    location:fd.get("location").trim(),
    lastDonation: fd.get("lastDonation")||null,
    totalDonations: Number(fd.get("totalDonations")||0)
  };
  donors.unshift(d); save(); renderAll(); closeModal("donorModal"); e.target.reset(); toast("Donor registered");
});

document.getElementById("requestForm").addEventListener("submit", e=>{
  e.preventDefault();
  const fd=new FormData(e.target);
  const r={
    id:uid(),
    patientName:fd.get("patientName").trim(),
    bloodGroup:fd.get("bloodGroup"),
    units:Number(fd.get("units")),
    hospital:fd.get("hospital").trim(),
    contact:fd.get("contact").trim(),
    urgency:fd.get("urgency"),
    status:"pending",
    date:new Date().toISOString()
  };
  requests.unshift(r); save(); renderAll(); closeModal("requestModal"); e.target.reset(); toast("Request created — matching donors...");
  switchView("requests");
});

document.getElementById("confirmDonate").onclick=()=>{
  const d=donors.find(x=>x.id===donateTargetId);
  if(!d) return;
  d.lastDonation = new Date().toISOString().slice(0,10);
  d.totalDonations += 1;
  inventoryLog.push({date:new Date().toISOString(),action:"Donation",group:d.bloodGroup,units:1,note:`Donation by ${d.name}`});
  save(); renderAll(); closeModal("donateModal"); toast("Donation recorded — thank you!");
};

function switchView(name){
  document.querySelectorAll(".nav-item").forEach(b=> b.classList.toggle("active", b.dataset.view===name));
  document.querySelectorAll(".view").forEach(v=> v.classList.toggle("active", v.id==="view-"+name));
  document.getElementById("sidebar").classList.remove("open");
}
document.querySelectorAll(".nav-item").forEach(b=> b.onclick=()=> switchView(b.dataset.view));
document.getElementById("hamburger").onclick=()=> document.getElementById("sidebar").classList.toggle("open");

document.getElementById("globalSearch").addEventListener("input", renderAll);
document.getElementById("filterBlood").addEventListener("change", renderDonors);
document.getElementById("filterEligible").addEventListener("change", renderDonors);
document.getElementById("filterRequestStatus").addEventListener("change", renderRequests);

document.getElementById("matcherSelect").addEventListener("change", e=>{
  const g=e.target.value;
  const out=document.getElementById("matcherResult");
  if(!g){ out.innerHTML=""; return; }
  const compat=COMPAT[g];
  const matched=donors.filter(d=> compat.includes(d.bloodGroup));
  const eligible=matched.filter(isEligible);
  out.innerHTML=`<div style="font-size:13px"><b>Compatible groups:</b> ${compat.join(", ")}<br><b>Registered donors:</b> ${matched.length} • <span style="color:#16a34a">${eligible.length} eligible now</span></div>
  <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px">${matched.slice(0,6).map(d=>`<span style="border:1px solid #e2e8f0;padding:4px 8px;border-radius:999px;font-size:12px">${d.name} (${d.bloodGroup}) ${isEligible(d)?"✓":"⏳"}</span>`).join("")}</div>`;
});

function toast(msg){
  const t=document.getElementById("toast"); t.textContent=msg; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),2200);
}

// expose for inline handlers
window.openDonate=openDonate; window.deleteDonor=deleteDonor; window.deleteRequest=deleteRequest;
window.fulfillRequest=fulfillRequest; window.updateRequestStatus=updateRequestStatus; window.switchView=switchView;

renderAll();
