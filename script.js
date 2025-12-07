
// Full client-side app for Unmatched stats (final)
const $ = id => document.getElementById(id);

let heroes = [];
let maps = [];
let matches = [];
let players = [];

async function loadStatic(){
  try{ heroes = await fetch('data/heroes.json').then(r=>r.json()); }catch(e){ heroes=[]; console.error(e); }
  try{ maps = await fetch('data/maps.json').then(r=>r.json()); }catch(e){ maps=[]; console.error(e); }
  loadLocal();
  renderPlayersList();
  buildTeamsForm();
  populateMap();
  updateAll();
}

function saveLocal(){ if(!$('saveLocal').checked) return; localStorage.setItem('unmatched_matches', JSON.stringify(matches)); localStorage.setItem('unmatched_players', JSON.stringify(players)); }
function loadLocal(){ try{ matches = JSON.parse(localStorage.getItem('unmatched_matches')) || []; }catch(e){ matches=[] } try{ players = JSON.parse(localStorage.getItem('unmatched_players')) || []; }catch(e){ players=[] } }

function addPlayer(name){ if(!name) return; if(!players.includes(name)) players.push(name); saveLocal(); renderPlayersList(); rebuildPlayerSelects(); }
function renderPlayersList(){ const box=$('playersList'); box.innerHTML=''; players.forEach(p=>{ const d=document.createElement('div'); d.className='player-item'; d.innerHTML=`<div class="meta">${p}</div><div><button class="btn ghost" data-player="${p}">Удалить</button></div>`; box.appendChild(d); }); box.querySelectorAll('button[data-player]').forEach(b=>b.addEventListener('click',e=>{ const name=e.currentTarget.dataset.player; if(!confirm('Удалить '+name+'?')) return; players=players.filter(x=>x!==name); saveLocal(); renderPlayersList(); rebuildPlayerSelects(); })); }

function buildTeamsForm(){ const c=$('teamsContainer'); c.innerHTML=''; const mode=$('mode').value; if(mode==='1v1'){ c.appendChild(teamNode('A',1)); c.appendChild(teamNode('B',1)); } else { c.appendChild(teamNode('A',2)); c.appendChild(teamNode('B',2)); } rebuildPlayerSelects(); }

function teamNode(letter,slots){ const box=document.createElement('div'); box.className='team-box'; box.innerHTML=`<div class="team-title">Команда ${letter}</div>`; for(let i=1;i<=slots;i++){ const slot=document.createElement('div'); slot.className='slot'; slot.innerHTML=`<select class="player-select" data-team="${letter}" data-slot="${i}"><option value="">-- Игрок --</option></select><select class="hero-select" data-team="${letter}" data-slot="${i}"><option value="">-- Герой --</option></select>`; box.appendChild(slot); } return box; }

function rebuildPlayerSelects(){ document.querySelectorAll('.player-select').forEach(sel=>{ const cur=sel.value; sel.innerHTML=`<option value="">-- Игрок --</option>`; players.forEach(p=> sel.insertAdjacentHTML('beforeend', `<option value="${p}">${p}</option>`)); sel.value=cur||''; }); document.querySelectorAll('.hero-select').forEach(sel=>{ const cur=sel.value; sel.innerHTML=`<option value="">-- Герой --</option>`; heroes.forEach(h=> sel.insertAdjacentHTML('beforeend', `<option value="${h.name_en}">${h.name_ru}</option>`)); sel.value=cur||''; }); }

function populateMap(){ const m=$('map'); m.innerHTML=`<option value="">-- Выбрать поле --</option>`; maps.forEach(x=> m.insertAdjacentHTML('beforeend', `<option value="${x}">${x}</option>`)); }

function collectMatch(){ const mode=$('mode').value; const map=$('map').value; const result=$('result').value; const teams={A:[],B:[]}; document.querySelectorAll('.player-select').forEach(ps=>{ const team=ps.dataset.team; const slot=ps.dataset.slot; const player=ps.value; const hero=document.querySelector(`.hero-select[data-team="${team}"][data-slot="${slot}"]`).value; if(player) teams[team].push({player,hero}); }); return {mode,teams,map,result,ts:Date.now()}; }

function validateMatch(m){ if(!m.map){ alert('Выберите поле'); return false;} const need = m.mode==='1v1'?1:2; if(m.teams.A.length<need || m.teams.B.length<need){ alert('Заполните всех игроков'); return false;} return true; }

function addMatch(){ const m=collectMatch(); if(!validateMatch(m)) return; matches.push(m); ['A','B'].forEach(t=> m.teams[t].forEach(s=>{ if(s.player && !players.includes(s.player)) players.push(s.player); })); saveLocal(); renderPlayersList(); updateAll(); alert('Матч сохранён'); }

function renderMatchesTable(){ const box=$('matchesTable'); if(matches.length===0){ box.innerHTML='<div class="small">Нет матчей</div>'; return;} let html='<table style="width:100%;border-collapse:collapse"><thead><tr><th>Время</th><th>Mode</th><th>Команда A</th><th>Команда B</th><th>Map</th><th>Победитель</th></tr></thead><tbody>'; matches.slice().reverse().forEach(m=>{ const t=new Date(m.ts).toLocaleString(); const a=m.teams.A.map(p=> `${p.player}${p.hero? ' ('+p.hero+')':''}`).join(', '); const b=m.teams.B.map(p=> `${p.player}${p.hero? ' ('+p.hero+')':''}`).join(', '); html+=`<tr><td>${t}</td><td>${m.mode}</td><td>${a}</td><td>${b}</td><td>${m.map}</td><td>${m.result}</td></tr>`; }); html+='</tbody></table>'; box.innerHTML=html; }

function calcHeroStats(){ const out={}; matches.forEach(m=>{ ['A','B'].forEach(t=> m.teams[t].forEach(p=>{ if(!p.hero) return; if(!out[p.hero]) out[p.hero]={win:0,loss:0,total:0}; if(m.result==='A' && t==='A') out[p.hero].win++; else if(m.result==='B' && t==='B') out[p.hero].win++; else out[p.hero].loss++; out[p.hero].total++; })); }); return out; }
function calcPlayerStats(){ const out={}; matches.forEach(m=>{ ['A','B'].forEach(t=> m.teams[t].forEach(p=>{ if(!p.player) return; if(!out[p.player]) out[p.player]={win:0,loss:0,total:0}; if(m.result==='A' && t==='A') out[p.player].win++; else if(m.result==='B' && t==='B') out[p.player].win++; else out[p.player].loss++; out[p.player].total++; })); }); return out; }

let heroChart=null, playerChart=null;
function renderHeroChart(data){ const labels=Object.keys(data); const wins=labels.map(l=>data[l].win); const loss=labels.map(l=>data[l].loss); const ctx=$('heroChart').getContext('2d'); if(heroChart) heroChart.destroy(); heroChart=new Chart(ctx,{type:'bar',data:{labels,datasets:[{label:'Победы',data:wins},{label:'Поражения',data:loss}]},options:{responsive:true,scales:{y:{beginAtZero:true}}}}); }
function renderPlayerChart(data){ const labels=Object.keys(data); const wins=labels.map(l=>data[l].win); const loss=labels.map(l=>data[l].loss); const ctx=$('playerChart').getContext('2d'); if(playerChart) playerChart.destroy(); playerChart=new Chart(ctx,{type:'bar',data:{labels,datasets:[{label:'Победы',data:wins},{label:'Поражения',data:loss}]},options:{responsive:true,scales:{y:{beginAtZero:true}}}}); }

function updateAll(){ renderMatchesTable(); renderHeroChart(calcHeroStats()); renderPlayerChart(calcPlayerStats()); rebuildPlayerSelects(); }
function resetAll(){ if(!confirm('Сбросить все данные?')) return; matches=[]; players=[]; saveLocal(); updateAll(); renderPlayersList(); }

function exportJSON(){ const blob=new Blob([JSON.stringify({matches,players},null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='unmatched_export.json'; a.click(); URL.revokeObjectURL(url); }
function importJSON(file){ const reader=new FileReader(); reader.onload=()=>{ try{ const d=JSON.parse(reader.result); if(Array.isArray(d.matches)) matches=d.matches; if(Array.isArray(d.players)) players=d.players; saveLocal(); updateAll(); renderPlayersList(); alert('Импорт завершён'); }catch(e){ alert('Ошибка импорта: '+e.message); } }; reader.readAsText(file); }

document.addEventListener('DOMContentLoaded',()=>{
  $('mode').addEventListener('change',()=>buildTeamsForm());
  $('addPlayerBtn').addEventListener('click',()=>{ addPlayer($('newPlayerName').value.trim()); $('newPlayerName').value=''; });
  $('addMatchBtn').addEventListener('click', addMatch);
  $('resetBtn').addEventListener('click', resetAll);
  $('exportBtn').addEventListener('click', exportJSON);
  $('importBtn').addEventListener('click', ()=>$('importFile').click());
  $('importFile').addEventListener('change',(e)=>{ if(e.target.files[0]) importJSON(e.target.files[0]); });
  loadStatic();
});
