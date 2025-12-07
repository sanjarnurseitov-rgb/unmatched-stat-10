
// Full client-side app for Unmatched stats (final)
const $ = id => document.getElementById(id);

let heroes = [];
let maps = [];
let matches = [];
let players = [];
// ==========================
// Searchable Select Component
// ==========================
function createSearchSelect(id, items, onSelect) {
  const container = document.getElementById(id);
  container.classList.add("search-select");

  container.innerHTML = `
    <input type="text" placeholder="Поиск...">
    <div class="dropdown"></div>
  `;

  const input = container.querySelector("input");
  const dropdown = container.querySelector(".dropdown");

  function render(list) {
    dropdown.innerHTML = "";
    list.forEach(item => {
      const el = document.createElement("div");
      el.textContent = item;
      el.onclick = () => {
        input.value = item;
        dropdown.style.display = "none";
        onSelect(item);
      };
      dropdown.appendChild(el);
    });
  }

  render(items);

  input.addEventListener("input", () => {
    const val = input.value.toLowerCase();
    render(items.filter(x => x.toLowerCase().includes(val)));
    dropdown.style.display = "block";
  });

  input.addEventListener("focus", () => {
    dropdown.style.display = "block";
  });

  document.addEventListener("click", (e) => {
    if (!container.contains(e.target)) {
      dropdown.style.display = "none";
    }
  });
}

async function loadStatic(){
  try{ heroes = await fetch('data/heroes.json').then(r=>r.json()); }catch(e){ heroes=[]; console.error(e); }
  try{ maps = await fetch('data/maps.json').then(r=>r.json()); }catch(e){ maps=[]; console.error(e); }
  loadLocal();
  renderPlayersList();
  buildTeamsForm();
  populateMap();
  updateAll();
}
function createSearchSelect(elementId, items, onSelect) {
  const container = document.getElementById(elementId);
  container.classList.add("search-select");

  container.innerHTML = `
    <input type="text" placeholder="Поиск..." />
    <div class="dropdown"></div>
  `;

  const input = container.querySelector("input");
  const dropdown = container.querySelector(".dropdown");

  function render(list) {
    dropdown.innerHTML = "";
    list.forEach(item => {
      const opt = document.createElement("div");
      opt.textContent = item;
      opt.onclick = () => {
        input.value = item;
        dropdown.style.display = "none";
        onSelect(item);
      };
      dropdown.appendChild(opt);
    });
  }

  render(items);

  input.addEventListener("input", () => {
    const text = input.value.toLowerCase();
    const filtered = items.filter(i => i.toLowerCase().includes(text));
    render(filtered);
    dropdown.style.display = "block";
  });

  input.addEventListener("focus", () => {
    dropdown.style.display = "block";
  });

  document.addEventListener("click", (e) => {
    if (!container.contains(e.target)) {
      dropdown.style.display = "none";
    }
  });
}

function saveLocal(){ if(!$('saveLocal').checked) return; localStorage.setItem('unmatched_matches', JSON.stringify(matches)); localStorage.setItem('unmatched_players', JSON.stringify(players)); }
function loadLocal(){ try{ matches = JSON.parse(localStorage.getItem('unmatched_matches')) || []; }catch(e){ matches=[] } try{ players = JSON.parse(localStorage.getItem('unmatched_players')) || []; }catch(e){ players=[] } }

function addPlayer(name){ if(!name) return; if(!players.includes(name)) players.push(name); saveLocal(); renderPlayersList(); rebuildPlayerSelects(); }
// ---------- Players UI: render, edit, delete ----------
function renderPlayersList(){
  const box = document.getElementById('playersList');
  box.innerHTML = '';

  players.forEach((p, idx) => {
    const row = document.createElement('div');
    row.className = 'player-item';
    row.dataset.index = idx;

    // static view (name + buttons)
    row.innerHTML = `
      <div class="player-view">
        <div class="meta">${escapeHtml(p)}</div>
        <div class="actions">
          <button class="btn ghost edit-btn" data-i="${idx}">Изменить</button>
          <button class="btn ghost delete-btn" data-i="${idx}">Удалить</button>
        </div>
      </div>
    `;
    box.appendChild(row);
  });

  // attach handlers (delegation)
  box.querySelectorAll('.delete-btn').forEach(b=>{
    b.addEventListener('click', (e)=>{
      const i = Number(e.currentTarget.dataset.i);
      if(!confirm('Удалить игрока "' + players[i] + '"?')) return;
      players.splice(i,1);
      saveLocal();
      renderPlayersList();
      rebuildPlayerSelects(); // обновляем селекты
    });
  });

  box.querySelectorAll('.edit-btn').forEach(b=>{
    b.addEventListener('click', (e)=>{
      const i = Number(e.currentTarget.dataset.i);
      enterEditMode(i);
    });
  });
}

// helper: create edit controls in place of static view
function enterEditMode(index){
  const box = document.getElementById('playersList');
  const row = box.querySelector(`.player-item[data-index="${index}"]`);
  if(!row) return;
  const oldName = players[index];

  // replace content with inline edit form
  row.innerHTML = `
    <div class="player-edit">
      <input class="edit-input" value="${escapeHtmlAttr(oldName)}" />
      <div class="actions">
        <button class="btn save-edit" data-i="${index}">Сохранить</button>
        <button class="btn ghost cancel-edit" data-i="${index}">Отмена</button>
      </div>
    </div>
  `;

  const input = row.querySelector('.edit-input');
  input.focus();
  input.select();

  // save handler
  row.querySelector('.save-edit').addEventListener('click', ()=>{
    const val = input.value.trim();
    if(!val){
      alert('Имя не может быть пустым');
      input.focus();
      return;
    }
    players[index] = val;
    saveLocal();
    renderPlayersList();
    rebuildPlayerSelects();
  });

  // cancel handler
  row.querySelector('.cancel-edit').addEventListener('click', ()=>{
    renderPlayersList();
  });

  // keyboard: Enter = save, Esc = cancel
  input.addEventListener('keydown', (ev)=>{
    if(ev.key === 'Enter'){
      ev.preventDefault();
      row.querySelector('.save-edit').click();
    } else if(ev.key === 'Escape'){
      ev.preventDefault();
      row.querySelector('.cancel-edit').click();
    }
  });
}

// small helpers to avoid XSS if names contain special chars
function escapeHtml(s){
  return String(s || '').replace(/[&<>"']/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]; });
}
function escapeHtmlAttr(s){
  return escapeHtml(s).replace(/"/g,'&quot;');
}


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
