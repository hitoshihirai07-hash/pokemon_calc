
/*! BDC auto-fill v2 (public) */
(function(){
  function q(s,r){return (r||document).querySelector(s);} function qa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}
  function key(s){return (s||'').trim();}
  var MOVES=[], POKE_TYPES=new Map(); // name -> [type1,type2]

  function fetchJSON(url){ return fetch(url,{cache:'no-store'}).then(function(r){ if(!r.ok) throw 0; return r.json(); }); }

  function loadData(){
    // moves.min.json is required
    fetchJSON('./data/moves.min.json').then(function(rows){
      MOVES = Array.isArray(rows) ? rows.map(function(r){ return {name: r.name||r.n, type: r.type||r.t, category: r.category||r.c, power: Number(r.power||r.p||0)||0}; }) : [];
    }).catch(function(){ MOVES=[]; });
    // pokemon_master.json is optional
    fetchJSON('./data/pokemon_master.json').then(function(list){
      try{
        (list||[]).forEach(function(p){
          var n=p.name||p.jp_name||p.ja||p['日本語名']||p['name_ja']||p['name'];
          var t1=p.type1||p.type_1||p['type1']||p.types?.[0]||p['タイプ1']||p['type_ja1']||'';
          var t2=p.type2||p.type_2||p['type2']||p.types?.[1]||p['タイプ2']||p['type_ja2']||'';
          if(n){ POKE_TYPES.set(key(n), [key(t1), key(t2)]); }
        });
      }catch(e){}
    }).catch(function(){});
  }

  function bestMoveFor(types){
    var pool = MOVES.filter(function(m){ return m && m.category && m.category!=='変化'; });
    if(types && types.length){
      var stab = pool.filter(function(m){ return types.indexOf(key(m.type))>=0; });
      stab.sort(function(a,b){ return (b.power||0)-(a.power||0); });
      if(stab[0]) return stab[0];
    }
    pool.sort(function(a,b){ return (b.power||0)-(a.power||0); });
    return pool[0] || null;
  }

  function guessPokeTypesFromRow(row){
    // try visible chips first
    var chips = qa('.type-chip,.bdc-type,.ptype1,.ptype2,.auto-type', row).map(function(e){ return key(e.textContent||''); }).filter(Boolean);
    if(chips.length){ return chips; }
    // try reading text near name
    var nameInp = q('input[name*="name" i], input.pokename, input[name*="ポケ"]', row);
    var nm = key(nameInp && nameInp.value);
    if(nm && POKE_TYPES.has(nm)){ return POKE_TYPES.get(nm); }
    return [];
  }

  function fillEmptyMovesInSix(){
    var six = q('#six'); if(!six) return;
    // find rows that look like attackers (left side) – fall back to all rows
    var rows = qa('.six-row', six); if(rows.length===0) rows = qa('tr, .row', six);
    rows.forEach(function(row){
      // find 4 move inputs in this row
      var mInps = qa('input.m1n, input.m2n, input.m3n, input.m4n, input[name*="move" i], input[name*="技"]', row).slice(0,4);
      if(!mInps.length) return;
      var types = guessPokeTypesFromRow(row);
      for(var i=0;i<mInps.length;i++){
        var inp = mInps[i];
        if(key(inp.value)) continue; // already chosen
        var mv = bestMoveFor(types);
        if(mv){
          inp.value = mv.name;
          // notify listeners
          inp.dispatchEvent(new Event('input', {bubbles:true}));
          inp.dispatchEvent(new Event('change', {bubbles:true}));
        }
      }
    });
  }

  function addToggle(){
    var six=q('#six'); if(!six) return;
    var bar = six.querySelector('.toolbar') || six.querySelector('.tabbar') || six.firstElementChild || six;
    if(!bar) return;
    if(q('#bdc_autofill_toggle', bar)) return;
    var w = document.createElement('label'); w.id='bdc_autofill_toggle';
    w.style.cssText='margin-left:.6rem;display:inline-flex;align-items:center;gap:.25rem;font-size:12px;';
    w.innerHTML = '<input type="checkbox" checked style="vertical-align:middle"><span>未選択技を自動補完(STAB→威力)</span>';
    bar.appendChild(w);
  }

  function hookBulk(){
    var six=q('#six'); if(!six) return;
    var btns = qa('button, a', six);
    var target = null;
    for(var i=0;i<btns.length;i++){
      var t=(btns[i].textContent||'').trim();
      if(/一括計算/.test(t)){ target=btns[i]; break; }
    }
    if(target && !target.__bdc_auto_hooked){
      target.addEventListener('click', function(e){
        var on = q('#bdc_autofill_toggle input'); if(on && on.checked){ fillEmptyMovesInSix(); }
      }, true); // capture, run before app handler
      target.__bdc_auto_hooked = true;
    }
  }

  function optimizeInputs(){
    // we won't touch existing handlers; we only avoid our own heavy reflow (none here)
    // optional future: lazy-hydrate autocomplete on focus
  }

  function init(){
    loadData(); addToggle(); hookBulk(); optimizeInputs();
  }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();