
/*! BDC hotfix bridge v44 */
(function(){
  function q(s,r){return (r||document).querySelector(s);} function qa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}
  function after(el, node){ if(el&&el.parentNode){ el.parentNode.insertBefore(node, el.nextSibling); } }
  function key(s){return (s||'').trim();}
  function debounce(fn,ms){ var t; return function(){ var th=this, a=arguments; clearTimeout(t); t=setTimeout(function(){ fn.apply(th,a); }, ms); }; }

  // error guard
  (function(){
    if(window.__BDC_ERR__) return; window.__BDC_ERR__=true;
    function box(){ var b=document.getElementById('bdc_err'); if(b) return b;
      b=document.createElement('div'); b.id='bdc_err'; b.innerHTML='<button>閉</button>';
      document.addEventListener('DOMContentLoaded', function(){ document.body.appendChild(b); });
      b.querySelector('button').addEventListener('click', function(){ b.style.display='none'; });
      return b; }
    function show(m){ var b=box(); var p=document.createElement('div'); p.textContent=m; b.insertBefore(p, b.firstChild); b.style.display='block'; }
    window.addEventListener('error', function(e){ show('[JS] '+(e.message||'')+' @'+(e.filename||'')+':'+(e.lineno||'')); }, true);
    window.addEventListener('unhandledrejection', function(e){ var m=(e.reason&&(e.reason.message||e.reason))||'(no message)'; show('[Promise] '+m); });
  })();

  // load moves JSON (public)
  var MAP=new Map(), loaded=false;
  function fetchJSON(url){ return fetch(url,{cache:'no-store'}).then(function(r){ if(!r.ok) throw 0; return r.json(); }); }
  function loadMoves(){
    fetchJSON('./data/moves.min.json').then(function(rows){
      (rows||[]).forEach(function(r){
        var nm = r.name||r.n; if(!nm) return;
        MAP.set(key(nm), {type:r.type||r.t||'', category:r.category||r.c||'', power:Number(r.power||r.p||0)||0});
      });
      loaded=true; diag();
      bindAll();
    }).catch(function(){ diag(); });
  }

  function diag(){
    var six=q('#six'); if(!six) return;
    var bar=six.querySelector('.toolbar')||six.querySelector('.tabbar')||six.firstElementChild||six;
    if(!bar) return;
    var el=q('#bdc_diag'); if(!el){ el=document.createElement('span'); el.id='bdc_diag'; bar.appendChild(el); }
    el.textContent='[moves '+MAP.size+'件'+(loaded?'':' (未読)')+']';
  }

  function ensureChip(inp){
    var chip=inp.nextElementSibling;
    if(!(chip&&chip.classList&&chip.classList.contains('bdc-chip'))){
      chip=document.createElement('span'); chip.className='bdc-chip'; chip.textContent='—'; after(inp, chip);
    }
    var hint=chip.nextElementSibling;
    if(!(hint&&hint.classList&&hint.classList.contains('bdc-hint'))){
      hint=document.createElement('span'); hint.className='bdc-hint'; chip.parentNode.insertBefore(hint, chip.nextSibling);
    }
    return {chip:chip, hint:hint};
  }

  function ensureGhosts(scope, inp){
    var box = scope || (inp && (inp.parentElement||inp.closest('div'))) || document.body;
    function need(name){ var s=box.querySelector('select[name*="'+name+'"]'); var i=box.querySelector('input[type="hidden"][name*="'+name+'"]'); return (!s && !i); }
    function makeSelect(name, options){
      var sel=document.createElement('select'); sel.className='bdc-ghost'; sel.name=name; options.forEach(function(v){
        var o=document.createElement('option'); o.value=v; o.textContent=v; sel.appendChild(o);
      }); box.appendChild(sel); return sel;
    }
    // type select (18種)
    var types=['ノーマル','ほのお','みず','でんき','くさ','こおり','かくとう','どく','じめん','ひこう','エスパー','むし','いわ','ゴースト','ドラゴン','あく','はがね','フェアリー'];
    var typeSel = box.querySelector('select[name*="type"]'); if(!typeSel && need('type')){ typeSel = makeSelect('type', types); }
    // category select (物理/特殊/変化)
    var cats=['物理','特殊','変化']; var catSel = box.querySelector('select[name*="category"]'); if(!catSel && need('category')){ catSel = makeSelect('category', cats); }
    // power input
    var powIn = box.querySelector('input[name*="power"]'); if(!powIn){ powIn = document.createElement('input'); powIn.type='hidden'; powIn.name='power'; powIn.className='bdc-ghost'; box.appendChild(powIn); }
    return {typeSel:typeSel, catSel:catSel, powIn:powIn};
  }

  var doUpdate = debounce(function(inp){
    var info = MAP.get(key(inp.value));
    var deco = ensureChip(inp);
    var ghosts = ensureGhosts(null, inp);

    if(info){
      // UI
      deco.chip.textContent = info.type || '?';
      deco.chip.title = (info.type||'?')+' / '+(info.category||'?')+' / 威力 '+(info.power||0);
      deco.hint.textContent = (info.category? (info.category==='変化'?'変化':'('+info.category+')') : '') + (info.power? ' '+info.power : (info.category==='変化'?' 0':''));
      // hidden inputs (dataset too)
      inp.dataset.type = info.type||''; inp.dataset.category=info.category||''; inp.dataset.power=String(info.power||0);
      // ghost fields for legacy matrix
      if(ghosts.typeSel){ ghosts.typeSel.value = info.type || ''; ghosts.typeSel.dispatchEvent(new Event('change',{bubbles:true})); }
      if(ghosts.catSel){ ghosts.catSel.value = info.category || ''; ghosts.catSel.dispatchEvent(new Event('change',{bubbles:true})); }
      if(ghosts.powIn){ ghosts.powIn.value = String(info.power||0); ghosts.powIn.dispatchEvent(new Event('change',{bubbles:true})); }
      // bubble custom event
      inp.dispatchEvent(new CustomEvent('bdc:move:resolved',{bubbles:true,detail:info}));
    }else{
      deco.chip.textContent='—'; deco.hint.textContent=''; inp.dataset.type=''; inp.dataset.category=''; inp.dataset.power='0';
    }
  }, 80);

  function bindAll(){
    var sel='input.m1n, input.m2n, input.m3n, input.m4n, input[name*="move" i], input[name*="技"]';
    qa(sel).forEach(function(inp){
      if(!inp.__bdc_bound_v44){
        inp.addEventListener('input', function(){ doUpdate(inp); });
        inp.addEventListener('change', function(){ doUpdate(inp); });
        inp.__bdc_bound_v44=true;
      }
      doUpdate(inp);
    });
  }

  function bindBulk(){
    var six=q('#six'); if(!six) return;
    var nodes = qa('button, a', six);
    for(var i=0;i<nodes.length;i++){
      var t=(nodes[i].textContent||'').trim();
      if(/一括計算/.test(t) && !nodes[i].__bdc_bulk_v44){
        nodes[i].addEventListener('click', function(){ bindAll(); }, true);
        nodes[i].__bdc_bulk_v44=true;
      }
      if(/診断|再計算/.test(t) && !nodes[i].__bdc_diag_v44){
        nodes[i].addEventListener('click', function(){ bindAll(); }, true);
        nodes[i].__bdc_diag_v44=true;
      }
    }
  }

  function init(){ loadMoves(); bindAll(); bindBulk(); }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();