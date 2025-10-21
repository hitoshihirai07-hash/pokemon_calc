// v5: integrate with triple-checkbox-toggle-with-count.js
// - datalist id 'pkmList' for count script
// - expose window.loadPokemonMaster() so the toggle can reload species list

const rows = [
  { key:'hp',  label:'H' },
  { key:'atk', label:'A' },
  { key:'def', label:'B' },
  { key:'spa', label:'C' },
  { key:'spd', label:'D' },
  { key:'spe', label:'S' },
];

const $ = (s,el=document)=>el.querySelector(s);

const natureMap = {
  'いじっぱり': {up:'atk',down:'spa'},
  'ようき': {up:'spe',down:'spa'},
  'ひかえめ': {up:'spa',down:'atk'},
  'おくびょう': {up:'spe',down:'atk'},
  'ずぶとい': {up:'def',down:'atk'},
  'しんちょう': {up:'spd',down:'spa'},
  'のんき': {up:'def',down:'spe'},
  'なまいき': {up:'spd',down:'spe'},
  'ゆうかん': {up:'atk',down:'spe'},
  'れいせい': {up:'spa',down:'spe'},
  'まじめ': {up:'',down:''},
  '': {up:'',down:''},
};

const state = {
  speciesMap: new Map(),
  aliasMap: new Map(),
};

function clamp(n, lo, hi){ n = parseInt(n,10); if (isNaN(n)) n=0; return Math.max(lo, Math.min(hi, n)); }
function metaNature(){ const n = $('#nature').value || ''; return natureMap[n] || natureMap['']; }
function norm(s){ return (s||'').toString().replace(/\s+/g,'').replace(/　/g,'').toLowerCase(); }

function buildTable(){
  const tbody = document.getElementById('tbody');
  tbody.innerHTML='';
  rows.forEach(r => {
    const tr = document.createElement('div');
    tr.className='tr'; tr.setAttribute('role','row');
    tr.innerHTML = `
      <div class="td colStat" role="cell">${r.label}</div>
      <div class="td" role="cell"><input id="base_${r.key}" type="number" min="1" max="255" class="readonly" readonly></div>
      <div class="td" role="cell">
        <div class="flex">
          <input id="iv_${r.key}" type="number" min="0" max="31" value="31">
          <div class="btns">
            <button type="button" data-tgt="iv_${r.key}" data-val="31">31</button>
            <button type="button" data-tgt="iv_${r.key}" data-val="0">0</button>
          </div>
        </div>
      </div>
      <div class="td" role="cell">
        <div class="flex">
          <input id="ev_${r.key}" type="number" min="0" max="252" value="0">
          <div class="btns">
            <button type="button" data-tgt="ev_${r.key}" data-val="252">252</button>
            <button type="button" data-tgt="ev_${r.key}" data-val="0">0</button>
          </div>
        </div>
      </div>
      <div class="td" role="cell"><input id="real_${r.key}" type="number" class="readonly" readonly></div>
    `;
    tbody.appendChild(tr);
  });
}

function calcAll(){
  const L = clamp(document.getElementById('level').value, 1, 100);
  const nat = metaNature();
  let evSum = 0;
  rows.forEach(r => {
    const base = clamp(document.getElementById('base_'+r.key).value, 1, 255);
    const iv   = clamp(document.getElementById('iv_'+r.key).value, 0, 31);
    const ev   = clamp(document.getElementById('ev_'+r.key).value, 0, 252);
    evSum += ev;
    let real;
    if (r.key==='hp'){
      if (base===1){ real = 1; }
      else { real = Math.floor(((2*base + iv + Math.floor(ev/4)) * L) / 100) + L + 10; }
    } else {
      const pre = Math.floor(((2*base + iv + Math.floor(ev/4)) * L) / 100) + 5;
      let mod = 1.0;
      if (nat.up===r.key) mod = 1.1;
      if (nat.down===r.key) mod = 0.9;
      real = Math.floor(pre * mod);
    }
    document.getElementById('real_'+r.key).value = real || 0;
  });
  document.getElementById('evRemain').textContent = `EV合計 ${evSum} / 残り ${Math.max(0, 510-evSum)}`;
}

function applySpecies(rec){
  if (!rec){
    document.getElementById('type1').textContent = '';
    document.getElementById('type2').textContent = '';
    rows.forEach(r => { document.getElementById('base_'+r.key).value = 0; document.getElementById('real_'+r.key).value = 0; });
    return;
  }
  document.getElementById('type1').textContent = rec.タイプ1 || '';
  document.getElementById('type2').textContent = rec.タイプ2 || '';
  const map = { hp:rec.HP, atk:rec.攻撃, def:rec.防御, spa:rec.特攻, spd:rec.特防, spe:rec.素早 };
  rows.forEach(r => { document.getElementById('base_'+r.key).value = map[r.key] ?? 0; });
  calcAll();
}

function resolveSpecies(inputValue){
  const n = norm(inputValue);
  if (!n) return null;
  const exact = state.aliasMap.get(n);
  if (exact) return state.speciesMap.get(exact);
  for (const name of state.speciesMap.keys()){
    const k = norm(name);
    if (k.startsWith(n)) return state.speciesMap.get(name);
  }
  for (const name of state.speciesMap.keys()){
    const k = norm(name);
    if (k.includes(n)) return state.speciesMap.get(name);
  }
  return null;
}

function wire(){
  document.addEventListener('click', e=>{
    const t=e.target;
    if (t.matches('[data-tgt]')){
      e.preventDefault();
      const id=t.getAttribute('data-tgt'), val=t.getAttribute('data-val');
      const inp = document.getElementById(id);
      if (inp){ inp.value = val; inp.dispatchEvent(new Event('input',{bubbles:true})); }
    }
  });
  document.getElementById('level').addEventListener('change', calcAll);
  document.getElementById('nature').addEventListener('change', calcAll);
  rows.forEach(r=>{
    document.getElementById('iv_'+r.key).addEventListener('input', calcAll);
    document.getElementById('ev_'+r.key).addEventListener('input', calcAll);
  });
  const sp = document.getElementById('speciesInput');
  sp.addEventListener('input', ()=>{ const rec = resolveSpecies(sp.value); if (rec) applySpecies(rec); });
  sp.addEventListener('change', ()=>{ const rec = resolveSpecies(sp.value); applySpecies(rec); });
  sp.addEventListener('blur',   ()=>{ const rec = resolveSpecies(sp.value); applySpecies(rec); });
}

async function loadPokemonMaster(){ // exposed for triple-checkbox script
  // ここで pokemon_master.json を fetch（トグルが差し替える）
  const res = await fetch('./pokemon_master.json', { cache:'no-store' });
  const list = await res.json();
  state.speciesMap.clear(); state.aliasMap.clear();
  const dl = document.getElementById('pkmList');
  dl.innerHTML = '';
  (Array.isArray(list)? list : []).forEach(obj=>{
    if (!obj || !obj.名前) return;
    state.speciesMap.set(obj.名前, obj);
    state.aliasMap.set(norm(obj.名前), obj.名前);
    const opt = document.createElement('option'); opt.value = obj.名前; dl.appendChild(opt);
  });
}

window.loadPokemonMaster = loadPokemonMaster;

function stripBOM(s){ return s && s.charCodeAt(0)===0xFEFF ? s.slice(1) : s; }
function guessDelimiter(firstLine){
  const cands=[',',';','\t','|'];
  let best=',', bestCount=-1;
  for (const d of cands){
    const cnt = (firstLine.split(d).length-1);
    if (cnt>bestCount){ bestCount=cnt; best=d; }
  }
  return best;
}
function parseCSV(text, delim=','){
  const rows=[]; let row=[]; let i=0; let cur=''; let q=false;
  while(i<text.length){
    const c=text[i++];
    if (q){
      if (c==='\"'){
        if (text[i]==='\"'){ cur+='\"'; i++; } else { q=false; }
      } else { cur+=c; }
    } else {
      if (c==='\"'){ q=true; }
      else if (c===delim){ row.push(cur); cur=''; }
      else if (c==='\n'){ row.push(cur); rows.push(row); row=[]; cur=''; }
      else if (c==='\r'){ /* skip */ }
      else { cur+=c; }
    }
  }
  if (cur!=='' || row.length){ row.push(cur); rows.push(row); }
  return rows;
}
function pickMoveNameIndex(cols){
  const lowers = cols.map(c=> (c||'').toString().toLowerCase().replace(/^\ufeff/,''));
  const keys = ['技名','わざ名','わざ','技','name_ja','move_ja','move-ja','ja','日本語名','name','move','move_name'];
  for (const k of keys){
    const idx = lowers.findIndex(h => h === k);
    if (idx>=0) return idx;
  }
  let idx = lowers.findIndex(h => /(技名|わざ|move|name)/.test(h));
  return idx>=0 ? idx : 0;
}
async function loadMoves(){
  try{
    const res = await fetch('./moves.csv', {cache:'no-store'});
    let text = await res.text();
    text = stripBOM(text);
    const firstLine = text.split(/\r?\n/)[0] || '';
    const delim = guessDelimiter(firstLine);
    const arr = parseCSV(text, delim).filter(r=>r && r.length>0);
    if (!arr.length) return;
    const head = arr[0];
    const idx = pickMoveNameIndex(head);
    const set = new Set();
    for (let i=1;i<arr.length;i++){
      const name = (arr[i][idx]||'').trim();
      if (name) set.add(name);
    }
    const dl = document.getElementById('movesList');
    dl.innerHTML='';
    Array.from(set).forEach(n=>{
      const opt = document.createElement('option'); opt.value = n; dl.appendChild(opt);
    });
  }catch(e){ /* ignore */ }
}

async function init(){
  buildTable();
  wire();
  await loadPokemonMaster(); // 初期読込。トグルスクリプトが後から fetch を差し替えたら、向こうから再実行される。
  loadMoves();
  calcAll();
}

document.addEventListener('DOMContentLoaded', init);


// ===== BDC Save/Load bridge (localStorage) =====
function collectState(){
  const data = {
    species: document.getElementById('speciesInput').value || '',
    level: document.getElementById('level').value || '50',
    nature: document.getElementById('nature').value || '',
    base: {}, iv: {}, ev: {}, real: {},
    moves: [document.getElementById('move1')?.value||'',
            document.getElementById('move2')?.value||'',
            document.getElementById('move3')?.value||'',
            document.getElementById('move4')?.value||'']
  };
  rows.forEach(r=>{
    data.base[r.key] = document.getElementById('base_'+r.key).value || '0';
    data.iv[r.key]   = document.getElementById('iv_'+r.key).value || '0';
    data.ev[r.key]   = document.getElementById('ev_'+r.key).value || '0';
    data.real[r.key] = document.getElementById('real_'+r.key).value || '0';
  });
  return data;
}
function applyStateData(d){
  if (!d) return;
  if (typeof d.species==='string'){ document.getElementById('speciesInput').value = d.species; const rec = resolveSpecies(d.species); if (rec) applySpecies(rec); }
  if (d.level) document.getElementById('level').value = String(d.level);
  if (d.nature) document.getElementById('nature').value = d.nature;
  if (d.base){ rows.forEach(r=>{ const v=d.base[r.key]; if (v!=null) document.getElementById('base_'+r.key).value = v; }); }
  if (d.iv){ rows.forEach(r=>{ const v=d.iv[r.key]; if (v!=null) document.getElementById('iv_'+r.key).value = v; }); }
  if (d.ev){ rows.forEach(r=>{ const v=d.ev[r.key]; if (v!=null) document.getElementById('ev_'+r.key).value = v; }); }
  if (d.moves){ const arr=d.moves; ['move1','move2','move3','move4'].forEach((id,i)=>{ if (arr[i]!=null) document.getElementById(id).value = arr[i]; }); }
  calcAll();
}
function syncCurrent(){
  try{
    localStorage.setItem('BDC_CURRENT', JSON.stringify(collectState()));
    localStorage.setItem('BDC_UPDATED', String(Date.now()));
  }catch(e){ /* ignore */ }
}
window.addEventListener('storage', (e)=>{
  if (e.key==='BDC_APPLY'){
    try{
      const d = JSON.parse(localStorage.getItem('BDC_CURRENT')||'{}');
      applyStateData(d);
    }catch(_){}
  }
});
function hookSync(){
  const ids = ['speciesInput','level','nature','move1','move2','move3','move4'];
  ids.forEach(id=>{ const el=document.getElementById(id); if (el){ el.addEventListener('input', syncCurrent); el.addEventListener('change', syncCurrent); } });
  rows.forEach(r=>{
    ['iv_','ev_'].forEach(p=>{ const el=document.getElementById(p+r.key); if (el){ el.addEventListener('input', syncCurrent); } });
  });
  try{
    const d = JSON.parse(localStorage.getItem('BDC_CURRENT')||'null');
    if (d) applyStateData(d);
  }catch(_){}
  syncCurrent();
}

// ===== Inline Save/Load UI =====
const SAVE_KEY = 'BDC_SAVES';
function savesLoad(){ try{return JSON.parse(localStorage.getItem(SAVE_KEY)||'[]')}catch(_){return []} }
function savesSave(arr){ localStorage.setItem(SAVE_KEY, JSON.stringify(arr)); }
function savesUUID(){ return 'xxxx-4xxx-yxxx'.replace(/[xy]/g, c => { const r=Math.random()*16|0; const v=c==='x'?r:(r&0x3|0x8); return v.toString(16); }); }
function savesRender(){
  const listEl = document.getElementById('saveList'); if (!listEl) return;
  listEl.innerHTML='';
  const arr = savesLoad().sort((a,b)=> (b.updated||0)-(a.updated||0));
  arr.forEach(rec=>{
    const opt = document.createElement('option');
    const t = new Date(rec.updated||0).toLocaleString();
    opt.value = rec.id; opt.textContent = `${rec.name}  (${t})`;
    listEl.appendChild(opt);
  });
}
function openPanel(){ document.getElementById('savePanel').classList.remove('hidden'); savesRender(); }
function closePanel(){ document.getElementById('savePanel').classList.add('hidden'); }
document.addEventListener('click', (e)=>{
  if (e.target?.id==='openSave') openPanel();
  if (e.target?.id==='closeSave') closePanel();
});
document.addEventListener('DOMContentLoaded', ()=>{
  const btnSave = document.getElementById('btnSave');
  const btnLoad = document.getElementById('btnLoad');
  const btnDel  = document.getElementById('btnDelete');
  const btnExp  = document.getElementById('btnExport');
  const btnImp  = document.getElementById('btnImport');
  if (btnSave) btnSave.addEventListener('click', ()=>{
    const name = document.getElementById('saveName').value.trim() || '未命名';
    const data = collectState();
    const arr = savesLoad();
    arr.push({id:savesUUID(), name, data, updated: Date.now()});
    savesSave(arr); document.getElementById('saveName').value=''; savesRender();
  });
  if (btnLoad) btnLoad.addEventListener('click', ()=>{
    const id = document.getElementById('saveList').value;
    if (!id) return;
    const rec = savesLoad().find(x=>x.id===id);
    if (rec){ applyStateData(rec.data); syncCurrent(); }
  });
  if (btnDel) btnDel.addEventListener('click', ()=>{
    const id = document.getElementById('saveList').value;
    if (!id) return;
    const arr = savesLoad().filter(x=>x.id!==id);
    savesSave(arr); savesRender();
  });
  if (btnExp) btnExp.addEventListener('click', ()=>{
    const blob = new Blob([localStorage.getItem(SAVE_KEY)||'[]'], {type:'application/json'});
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='bdc_saves.json'; a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
  });
  if (btnImp) btnImp.addEventListener('click', async ()=>{
    const input = document.getElementById('fileImport');
    if (!input.files || !input.files[0]) return;
    const text = await input.files[0].text();
    let arr = []; try{ arr = JSON.parse(text)||[]; }catch(e){ alert('JSONが不正です'); return; }
    if (!Array.isArray(arr)){ alert('配列JSONではありません'); return; }
    const cur = savesLoad(); const map = new Map(cur.map(r=>[r.id,r]));
    arr.forEach(r=>{ if (r && r.id && r.name && r.data){ map.set(r.id, r); } });
    savesSave(Array.from(map.values())); savesRender();
  });
  savesRender();
});
// ensure current state sync
document.addEventListener('DOMContentLoaded', ()=>{ setTimeout(hookSync, 0); });

