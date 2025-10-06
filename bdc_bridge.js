
/*! BDC public bridge v1 */
(function(){
  // --- guard ---
  (function(){
    if(window.__BDC_ERR__) return; window.__BDC_ERR__=true;
    function box(){ var b=document.getElementById('bdc_err'); if(b) return b;
      b=document.createElement('div'); b.id='bdc_err'; b.innerHTML='<button>閉</button>'; document.addEventListener('DOMContentLoaded',function(){ document.body.appendChild(b); }); 
      b.querySelector('button').addEventListener('click', function(){ b.style.display='none'; });
      return b; }
    function show(m){ var b=box(); var p=document.createElement('div'); p.textContent=m; b.insertBefore(p, b.firstChild); b.style.display='block'; }
    window.addEventListener('error', function(e){ show('[JS] '+(e.message||'')+' @'+(e.filename||'')+':'+(e.lineno||'')); }, true);
    window.addEventListener('unhandledrejection', function(e){ var m=(e.reason&&(e.reason.message||e.reason))||'(no message)'; show('[Promise] '+m); });
  })();

  function q(sel,root){ return (root||document).querySelector(sel); }
  function qa(sel,root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }
  function after(el, node){ if(el && el.parentNode){ el.parentNode.insertBefore(node, el.nextSibling); } }
  function key(s){ return (s||'').trim(); }

  // --- load moves (prod: JSON, dev: ?dev=1 allows manual CSV) ---
  var DEV = /[?&]dev=1\b/.test(location.search);
  var MAP = new Map(); // name -> {type,category,power}

  function setMoves(rows){
    MAP.clear();
    (rows||[]).forEach(function(r){
      var name = r.name || r.n; if(!name) return;
      MAP.set(key(name), {type: r.type || r.t || '', category: r.category || r.c || '', power: Number(r.power || r.p || 0) || 0});
    });
    updateDiag();
    ensureAllBindings();
  }

  function fetchJSON(url){
    return fetch(url, {cache:'no-store'}).then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); });
  }

  function loadMoves(){
    // public JSON path
    fetchJSON('./data/moves.min.json')
      .then(setMoves)
      .catch(function(){ console.warn('moves.min.json not found'); setMoves([]); });
  }

  // --- UI decorate + hidden bridge ---
  function ensureHidden(parent){
    var t = parent.querySelector('input[type="hidden"].mtype');
    if(!t){ t=document.createElement('input'); t.type='hidden'; t.className='mtype'; parent.appendChild(t); }
    var c = parent.querySelector('input[type="hidden"].mcat');
    if(!c){ c=document.createElement('input'); c.type='hidden'; c.className='mcat'; parent.appendChild(c); }
    var p = parent.querySelector('input[type="hidden"].mpower');
    if(!p){ p=document.createElement('input'); p.type='hidden'; p.className='mpower'; parent.appendChild(p); }
    return {t:t,c:c,p:p};
  }

  function ensureChip(input){
    var chip = input.nextElementSibling;
    if(!(chip && chip.classList && chip.classList.contains('bdc-chip'))){
      chip = document.createElement('span'); chip.className='bdc-chip'; chip.textContent='—'; after(input, chip);
    }
    var hint = chip.nextElementSibling;
    if(!(hint && hint.classList && hint.classList.contains('bdc-hint'))){
      hint = document.createElement('span'); hint.className='bdc-hint'; chip.parentNode.insertBefore(hint, chip.nextSibling);
    }
    return {chip:chip, hint:hint};
  }

  function updateOne(input){
    var name = key(input.value);
    var info = MAP.get(name);
    var deco = ensureChip(input);
    var hid = ensureHidden(input.parentElement || input.closest('div') || document.body);
    if(info){
      deco.chip.textContent = info.type || '?';
      deco.chip.title = (info.type||'?')+' / '+(info.category||'?')+' / 威力 '+(info.power||0);
      deco.hint.textContent = (info.category? (info.category==='変化'?'変化':'('+info.category+')') : '') + (info.power? ' '+info.power : (info.category==='変化'?' 0':''));
      hid.t.value = info.type || ''; hid.c.value = info.category || ''; hid.p.value = String(info.power||0);
      hid.t.dispatchEvent(new Event('change', {bubbles:true}));
      hid.c.dispatchEvent(new Event('change', {bubbles:true}));
      hid.p.dispatchEvent(new Event('change', {bubbles:true}));
      input.dispatchEvent(new CustomEvent('bdc:move:resolved', {bubbles:true, detail:info}));
    }else{
      deco.chip.textContent = '—'; deco.hint.textContent='';
      hid.t.value=''; hid.c.value=''; hid.p.value='0';
    }
  }

  function ensureAllBindings(){
    var sel = 'input.m1n, input.m2n, input.m3n, input.m4n, input[name*="move" i], input[name*="技"]';
    qa(sel).forEach(function(inp){
      if(!inp.__bdc_bound){
        inp.addEventListener('input', function(){ updateOne(inp); });
        inp.addEventListener('change', function(){ updateOne(inp); });
        inp.__bdc_bound = true;
      }
      updateOne(inp);
    });
  }

  // --- matrix calc hook: ensure data bridged before bulk calc ---
  function hookBulkCalc(){
    var six = q('#six');
    if(!six) return;
    // find a button that contains text "一括計算"
    var btns = qa('button, a', six);
    var target = btns.find ? btns.find(function(b){ return /一括計算/.test((b.textContent||'').trim()); }) : (function(){
      for(var i=0;i<btns.length;i++){ if(/一括計算/.test((btns[i].textContent||'').trim())) return btns[i]; }
    })();
    if(target && !target.__bdc_hooked){
      target.addEventListener('click', function(){ ensureAllBindings(); }, true); // capturing: run before app-handler
      target.__bdc_hooked = true;
    }
  }

  // --- small diag on toolbar ---
  function updateDiag(){
    var six = q('#six'); if(!six) return;
    var bar = six.querySelector('.toolbar') || six.querySelector('.tabbar') || six.firstElementChild || six;
    if(!bar) return;
    var el = q('#bdc_diag'); if(!el){ el = document.createElement('span'); el.id='bdc_diag'; bar.appendChild(el); }
    el.textContent = '[moves '+MAP.size+'件'+(DEV?' dev':'')+']';
  }

  // --- dev manual loader (hidden in prod) ---
  function devLoader(){
    if(!DEV) return;
    var six = q('#six'); if(!six) return;
    var bar = six.querySelector('.toolbar') || six.querySelector('.tabbar') || six.firstElementChild || six;
    if(!bar) return;
    var btn = document.createElement('button');
    btn.textContent = 'moves読込';
    btn.style.cssText = 'margin-left:.5rem;border:1px solid rgba(255,255,255,.3);border-radius:8px;padding:.25rem .6rem;background:#2c3a64;color:#fff;cursor:pointer;font-size:12px;';
    btn.addEventListener('click', function(){
      var input = document.createElement('input'); input.type='file'; input.accept='.csv,.tsv,.txt,.json';
      input.addEventListener('change', function(){
        var f=this.files&&this.files[0]; if(!f) return;
        var reader = new FileReader();
        reader.onload = function(ev){
          var txt = ev.target.result||'';
          // try JSON first
          try{ var j=JSON.parse(txt); if(Array.isArray(j)){ setMoves(j); return; } }catch(e){}
          // parse CSV/TSV
          var isTab = (txt.indexOf('\t')>-1) && (txt.split('\t').length > txt.split(',').length);
          var delim = isTab ? '\t' : ',';
          var lines = txt.split(/\r?\n/).filter(function(x){return x.trim()!=='';});
          if(!lines.length){ setMoves([]); return; }
          var head = lines[0].split(delim).map(function(h){ return h.trim().toLowerCase().replace(/\ufeff/g,''); });
          function idx(){ var args=[].slice.call(arguments); for(var i=0;i<args.length;i++){ var k=args[i].toLowerCase(); var p=head.indexOf(k); if(p>=0) return p; } return -1; }
          var iN=idx('name','move','技名'), iT=idx('type','タイプ','type_label'), iC=idx('category','分類'), iP=idx('power','威力');
          var out=[];
          for(var i=1;i<lines.length;i++){
            var cols = lines[i].split(delim);
            var nm=(cols[iN]||'').trim(); if(!nm) continue;
            var tp=(cols[iT]||'').trim(), ct=(cols[iC]||'').trim(), pw=(cols[iP]||'0').trim();
            out.push({name:nm, type:tp, category:ct, power:Number(pw)||0});
          }
          setMoves(out);
        };
        reader.readAsText(f, 'utf-8');
      });
      input.click();
    });
    bar.appendChild(btn);
  }

  function init(){
    loadMoves();
    ensureAllBindings();
    hookBulkCalc();
    devLoader();
  }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();