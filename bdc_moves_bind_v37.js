
/*! bdc_moves_bind_v37.js */
(function(){
  var MOVES = null, MAP = new Map();
  function q(sel,root){ return (root||document).querySelector(sel); }
  function qa(sel,root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }
  function after(el, node){ el && el.parentNode && el.parentNode.insertBefore(node, el.nextSibling); }
  function toKey(s){ return (s||"").trim(); }

  function buildMap(rows){
    MAP.clear();
    rows.forEach(function(r){
      if(!r || !r.name) return;
      MAP.set(toKey(r.name), {
        type: r.type || "",
        category: r.category || "",
        power: Number(r.power||0) || 0
      });
    });
  }

  function ensureChip(forInput){
    var chip = forInput.nextElementSibling;
    if(!chip || !chip.classList || !chip.classList.contains('bdc-mtype-chip')){
      chip = document.createElement('span');
      chip.className = 'bdc-mtype-chip';
      chip.style.cssText = 'margin-left:6px; padding:2px 6px; border-radius:10px; background:#3b5cc9; color:#fff; font-size:12px; vertical-align:middle; display:inline-block; min-width:38px; text-align:center;';
      after(forInput, chip);
    }
    return chip;
  }

  function updateFor(input){
    var name = toKey(input.value);
    var info = MAP.get(name);
    var chip = ensureChip(input);
    if(info){
      chip.textContent = info.type || '?';
      chip.title = (info.type||'?') + ' / ' + (info.category||'?') + ' / 威力 ' + (info.power||0);
      input.dispatchEvent(new CustomEvent('bdc:move:resolved', {bubbles:true, detail:info}));
    }else{
      chip.textContent = '—';
      chip.title = '未登録の技名です（moves.csv になければ解決できません）';
    }
  }

  function bindInputs(){
    var sel = 'input.m1n, input.m2n, input.m3n, input.m4n, input[name*=\"move\" i], input[name*=\"技\"]';
    qa(sel).forEach(function(inp){
      inp.addEventListener('input', function(){ updateFor(inp); });
      inp.addEventListener('change', function(){ updateFor(inp); });
      updateFor(inp);
    });
  }

  function loadJSON(){
    return fetch('./moves_cache_v37.json', {cache:'no-store'}).then(function(r){
      if(!r.ok) throw new Error('cache missing');
      return r.json();
    });
  }
  function loadCSV(){
    return fetch('./moves.csv', {cache:'no-store'}).then(function(r){
      if(!r.ok) throw new Error('csv missing'); return r.text();
    }).then(function(txt){
      var lines = txt.split(/\r?\n/).filter(Boolean);
      if(lines.length<2) return [];
      var head = lines[0].split(',');
      function idx(k){ var i=head.findIndex(function(h){ return h.trim().toLowerCase().replace(/\ufeff/g,'')===k; }); return i; }
      var iName=idx('name'), iType=idx('type'), iCat=idx('category'), iPow=idx('power');
      var out=[];
      for(var i=1;i<lines.length;i++){
        var cols = lines[i].split(',');
        var name = (cols[iName]||'').trim();
        if(!name) continue;
        out.push({ name: name, type: (cols[iType]||'').trim(), category: (cols[iCat]||'').trim(), power: Number((cols[iPow]||'0').trim())||0 });
      }
      return out;
    });
  }

  function init(){
    loadJSON().then(function(rows){ MOVES=rows; buildMap(rows); bindInputs(); })
              .catch(function(){ loadCSV().then(function(rows){ MOVES=rows; buildMap(rows); bindInputs(); }); });
  }

  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();