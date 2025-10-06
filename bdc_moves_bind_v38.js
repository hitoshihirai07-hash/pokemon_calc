
/*! bdc_moves_bind_v38.js */
(function(){
  var MAP=new Map();
  function q(sel,root){ return (root||document).querySelector(sel); }
  function qa(sel,root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }
  function after(el, node){ if(el && el.parentNode){ el.parentNode.insertBefore(node, el.nextSibling); } }
  function key(s){ return (s||'').trim(); }

  function buildMap(rows){
    MAP.clear();
    rows.forEach(function(r){ if(r && r.name){ MAP.set(key(r.name), {type:r.type||'',category:r.category||'',power:Number(r.power||0)||0}); } });
  }

  function ensureChip(input){
    var chip = input.nextElementSibling;
    if(!(chip && chip.classList && chip.classList.contains('bdc-mtype-chip'))){
      chip = document.createElement('span');
      chip.className='bdc-mtype-chip'; chip.textContent='—';
      chip.style.cssText='margin-left:6px;padding:2px 6px;border-radius:10px;background:#3b5cc9;color:#fff;font-size:12px;display:inline-block;min-width:38px;text-align:center;vertical-align:middle;';
      after(input, chip);
    }
    return chip;
  }
  function ensureHint(input){
    // place a subtle hint right after the chip
    var chip = ensureChip(input);
    var hint = chip.nextElementSibling;
    if(!(hint && hint.classList && hint.classList.contains('bdc-mpow-hint'))){
      hint = document.createElement('span');
      hint.className='bdc-mpow-hint';
      hint.style.cssText='margin-left:6px;opacity:.8;font-size:12px;color:#d8e1ff;';
      chip.parentNode.insertBefore(hint, chip.nextSibling);
    }
    return hint;
  }

  function update(input){
    var info = MAP.get(key(input.value));
    var chip = ensureChip(input);
    var hint = ensureHint(input);
    if(info){
      chip.textContent = info.type || '?';
      chip.title = (info.type||'?') + ' / ' + (info.category||'?') + ' / 威力 ' + (info.power||0);
      hint.textContent = (info.category? (info.category==='変化'?'変化':'('+info.category+')') : '') + (info.power? ' ' + info.power : (info.category==='変化'?' 0':''));
      // bubble for calculators
      input.dispatchEvent(new CustomEvent('bdc:move:resolved', {bubbles:true, detail:info}));
    }else{
      chip.textContent='—'; chip.title='未登録の技名';
      hint.textContent='';
    }
  }

  function bindAll(){
    var sel = 'input.m1n, input.m2n, input.m3n, input.m4n, input[name*="move" i], input[name*="技"]';
    qa(sel).forEach(function(inp){
      inp.addEventListener('input', function(){ update(inp); });
      inp.addEventListener('change', function(){ update(inp); });
      update(inp);
    });
  }

  function fetchJSON(){ return fetch('./moves_cache_v38.json',{cache:'no-store'}).then(function(r){ if(!r.ok) throw 0; return r.json(); }); }
  function fetchCSV(){
    return fetch('./moves.csv',{cache:'no-store'}).then(function(r){ if(!r.ok) throw 0; return r.text(); }).then(function(txt){
      var lines=txt.split(/\r?\n/).filter(Boolean); if(lines.length<2) return [];
      var head=lines[0].split(',');
      function idx(k){ var i=head.findIndex(function(h){ return (h||'').trim().toLowerCase().replace(/\ufeff/g,'')===k; }); return i; }
      var iN=idx('name'), iT=idx('type'), iC=idx('category'), iP=idx('power');
      var out=[];
      for(var i=1;i<lines.length;i++){
        var cols=lines[i].split(',');
        var nm=(cols[iN]||'').trim(); if(!nm) continue;
        out.push({name:nm,type:(cols[iT]||'').trim(),category:(cols[iC]||'').trim(),power:Number((cols[iP]||'0').trim())||0});
      }
      return out;
    });
  }

  function init(){
    fetchJSON().then(function(rows){ buildMap(rows); bindAll(); })
               .catch(function(){ fetchCSV().then(function(rows){ buildMap(rows); bindAll(); }); });
  }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();