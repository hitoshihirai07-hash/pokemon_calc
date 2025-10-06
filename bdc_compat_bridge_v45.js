
/*! BDC compat bridge v45 */
(function(){
  function q(s,r){return (r||document).querySelector(s);} function qa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}
  function after(el, node){ if(el&&el.parentNode){ el.parentNode.insertBefore(node, el.nextSibling); } }
  function key(s){return (s||'').trim();}
  function debounce(fn,ms){ var t; return function(){ var th=this, a=arguments; clearTimeout(t); t=setTimeout(function(){ fn.apply(th,a); }, ms); }; }

  // error guard
  (function(){
    if(window.__BDC_ERR__) return; window.__BDC_ERR__=true;
    function box(){ var b=document.getElementById('bdc_err'); if(b) return b;
      b=document.createElement('div'); b.id='bdc_err'; b.innerHTML='<button>閉</button>'; document.addEventListener('DOMContentLoaded', function(){ document.body.appendChild(b); });
      b.querySelector('button').addEventListener('click', function(){ b.style.display='none'; });
      return b; }
    function show(m){ var b=box(); var p=document.createElement('div'); p.textContent=m; b.insertBefore(p, b.firstChild); b.style.display='block'; }
    window.addEventListener('error', function(e){ show('[JS] '+(e.message||'')+' @'+(e.filename||'')+':'+(e.lineno||'')); }, true);
    window.addEventListener('unhandledrejection', function(e){ var m=(e.reason&&(e.reason.message||e.reason))||'(no message)'; show('[Promise] '+m); });
  })();

  // mapping
  var TYPE_JA=['ノーマル','ほのお','みず','でんき','くさ','こおり','かくとう','どく','じめん','ひこう','エスパー','むし','いわ','ゴースト','ドラゴン','あく','はがね','フェアリー'];
  var TYPE_EN=['normal','fire','water','electric','grass','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy'];
  var TYPE_ALT={'ノ':'ノーマル','炎':'ほのお','水':'みず','電':'でんき','草':'くさ','氷':'こおり','闘':'かくとう','毒':'どく','地':'じめん','飛':'ひこう','超':'エスパー','虫':'むし','岩':'いわ','霊':'ゴースト','竜':'ドラゴン','悪':'あく','鋼':'はがね','妖':'フェアリー'};
  function normTypeJa(s){ s=key(s); if(TYPE_ALT[s]) return TYPE_ALT[s]; return s; }
  function typeToAll(s){
    var ja = normTypeJa(s); var id = TYPE_JA.indexOf(ja);
    var en = id>=0 ? TYPE_EN[id] : '';
    return {ja:ja, en:en, id:id};
  }
  var CAT_JA=['物理','特殊','変化']; var CAT_EN=['physical','special','status'];
  function catToAll(s){
    var ja = key(s); var id = CAT_JA.indexOf(ja);
    var en = id>=0 ? CAT_EN[id] : '';
    return {ja:ja, en:en, id:id};
  }

  // moves JSON
  var MAP=new Map(); var loaded=false;
  function fetchJSON(u){ return fetch(u,{cache:'no-store'}).then(function(r){ if(!r.ok) throw 0; return r.json(); }); }
  function loadMoves(){
    fetchJSON('./data/moves.min.json').then(function(rows){
      (rows||[]).forEach(function(r){
        var nm=(r.name||r.n||'').trim(); if(!nm) return;
        var tp=r.type||r.t||''; var ct=r.category||r.c||''; var pw=Number(r.power||r.p||0)||0;
        MAP.set(nm, {type:tp, category:ct, power:pw});
      }); loaded=true; diag(); bindAll();
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

  function ensureHiddenSet(container){
    function mkHidden(name){ var el=container.querySelector('input[type="hidden"][name="'+name+'"]'); if(!el){ el=document.createElement('input'); el.type='hidden'; el.name=name; container.appendChild(el);} return el; }
    // multipath names for compatibility
    return {
      // type
      mtype: mkHidden('mtype'),
      type: mkHidden('type'),
      moveType: mkHidden('moveType'),
      move_type: mkHidden('move_type'),
      typeId: mkHidden('typeId'),
      moveTypeId: mkHidden('moveTypeId'),
      typeEn: mkHidden('typeEn'),
      moveTypeEn: mkHidden('moveTypeEn'),
      // category
      mcat: mkHidden('mcat'),
      category: mkHidden('category'),
      moveCategory: mkHidden('moveCategory'),
      move_category: mkHidden('move_category'),
      catId: mkHidden('catId'),
      moveCategoryId: mkHidden('moveCategoryId'),
      catEn: mkHidden('catEn'),
      moveCategoryEn: mkHidden('moveCategoryEn'),
      // power
      mpower: mkHidden('mpower'),
      power: mkHidden('power'),
      movePower: mkHidden('movePower'),
      move_power: mkHidden('move_power')
    };
  }

  function writeAllTargets(inp, info){
    var t=typeToAll(info.type||''), c=catToAll(info.category||''), p=Number(info.power||0)||0;
    var container = inp.closest('.row, tr, .move-row, .six-row, .line, .block') || inp.parentElement || document.body;
    var hs = ensureHiddenSet(container);
    // dataset (for code reading dataset)
    inp.dataset.moveTypeJa=t.ja; inp.dataset.moveTypeEn=t.en; inp.dataset.moveTypeId=String(t.id);
    inp.dataset.moveCategoryJa=c.ja; inp.dataset.moveCategoryEn=c.en; inp.dataset.moveCategoryId=String(c.id);
    inp.dataset.movePower=String(p);
    // hidden values (multiple names)
    [hs.mtype,hs.type,hs.moveType,hs.move_type,hs.typeEn,hs.moveTypeEn].forEach(function(el){ el.value = t.en || t.ja || ''; el.dispatchEvent(new Event('change',{bubbles:true})); });
    [hs.typeId,hs.moveTypeId].forEach(function(el){ el.value = String(t.id); el.dispatchEvent(new Event('change',{bubbles:true})); });
    [hs.mcat,hs.category,hs.moveCategory,hs.move_category,hs.catEn,hs.moveCategoryEn].forEach(function(el){ el.value = c.en || c.ja || ''; el.dispatchEvent(new Event('change',{bubbles:true})); });
    [hs.catId,hs.moveCategoryId].forEach(function(el){ el.value = String(c.id); el.dispatchEvent(new Event('change',{bubbles:true})); });
    [hs.mpower,hs.power,hs.movePower,hs.move_power].forEach(function(el){ el.value = String(p); el.dispatchEvent(new Event('change',{bubbles:true})); });
    // move-detail area text if present
    var detail = container.querySelector('.move-detail, #moveDetail, #move-detail, .技詳細') || document;
    var typeEl = detail.querySelector('.mvtype, .move-type, .type, .タイプ');
    if(typeEl){ typeEl.textContent = t.ja || t.en || '—'; }
    var hintEl = detail.querySelector('.mv-hint, .move-hint, .hint');
    if(hintEl){ hintEl.textContent = (c.ja? (c.ja==='変化'?'変化':'('+c.ja+')') : '') + (p? (' '+p) : (c.ja==='変化'?' 0':'')); }
    // custom event
    inp.dispatchEvent(new CustomEvent('bdc:move:compat',{bubbles:true,detail:{type:t,category:c,power:p,container:container}}));
  }

  var doUpdate = debounce(function(inp){
    var info = MAP.get(key(inp.value));
    var deco = ensureChip(inp);
    if(info){
      deco.chip.textContent = info.type || '?';
      deco.chip.title = (info.type||'?')+' / '+(info.category||'?')+' / 威力 '+(info.power||0);
      deco.hint.textContent = (info.category? (info.category==='変化'?'変化':'('+info.category+')') : '') + (info.power? ' '+info.power : (info.category==='変化'?' 0':''));
      writeAllTargets(inp, info);
    }else{
      deco.chip.textContent='—'; deco.hint.textContent='';
    }
  }, 80);

  function bindAll(){
    var sel='input.m1n, input.m2n, input.m3n, input.m4n, input[name*="move" i], input[name*="技"]';
    qa(sel).forEach(function(inp){
      if(!inp.__bdc_bound_v45){
        inp.addEventListener('input', function(){ doUpdate(inp); });
        inp.addEventListener('change', function(){ doUpdate(inp); });
        inp.__bdc_bound_v45=true;
      }
      doUpdate(inp);
    });
  }

  function hookBulk(){
    var six=q('#six'); if(!six) return;
    var nodes=qa('button, a', six); var targets=[];
    for(var i=0;i<nodes.length;i++){ var t=(nodes[i].textContent||'').trim(); if(/一括計算|診断|再計算/.test(t)) targets.push(nodes[i]); }
    targets.forEach(function(btn){
      if(!btn.__bdc_bulk_v45){
        btn.addEventListener('click', function(){ bindAll(); document.dispatchEvent(new CustomEvent('bdc:bulk:pre')); }, true);
        btn.__bdc_bulk_v45=true;
      }
    });
  }

  // bind only when tab visible to avoid heavy init
  function onVisibleBind(){
    var six=q('#six'); if(!six){ bindAll(); hookBulk(); return; }
    var obs=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ bindAll(); hookBulk(); obs.disconnect(); } }); });
    obs.observe(six);
  }

  function init(){ loadMoves(); onVisibleBind(); }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();