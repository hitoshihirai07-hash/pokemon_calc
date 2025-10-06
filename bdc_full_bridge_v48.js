
/*! BDC full bridge v48 */
(function(){
  function q(s,r){return (r||document).querySelector(s);} function qa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}
  function after(el,node){ if(el&&el.parentNode){ el.parentNode.insertBefore(node, el.nextSibling);} }
  function key(s){return (s||'').trim();}
  function fire(el){ try{ el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); }catch(e){} try{ if(window.jQuery) window.jQuery(el).trigger('change').trigger('input'); }catch(e){} }
  function debounce(fn,ms){ var t; return function(){ var th=this,a=arguments; clearTimeout(t); t=setTimeout(function(){ fn.apply(th,a); }, ms); }; }

  var TYPE_JA=['ノーマル','ほのお','みず','でんき','くさ','こおり','かくとう','どく','じめん','ひこう','エスパー','むし','いわ','ゴースト','ドラゴン','あく','はがね','フェアリー'];
  var CAT_JA =['物理','特殊','変化'];
  var TYPE_ALT={'ノ':'ノーマル','炎':'ほのお','水':'みず','電':'でんき','草':'くさ','氷':'こおり','闘':'かくとう','毒':'どく','地':'じめん','飛':'ひこう','超':'エスパー','虫':'むし','岩':'いわ','霊':'ゴースト','竜':'ドラゴン','悪':'あく','鋼':'はがね','妖':'フェアリー'};
  function normTypeJa(s){ s=key(s); return TYPE_ALT[s]||s; }

  var MOVES = new Map();
  function fetchJSON(u){ return fetch(u,{cache:'no-store'}).then(function(r){ if(!r.ok) throw 0; return r.json(); }); }
  function loadMoves(){
    fetchJSON('./data/moves.min.json').then(function(rows){
      (rows||[]).forEach(function(r){ var n=(r.name||r.n||'').trim(); if(!n) return; MOVES.set(n, {type:r.type||r.t||'', category:r.category||r.c||'', power:Number(r.power||r.p||0)||0}); });
      updatePanel();
      bindAll();
    }).catch(function(){ updatePanel(); });
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

  function classifySelect(sel){
    var texts = qa('option', sel).map(function(o){ return key(o.textContent||o.value); });
    var tHits = texts.filter(function(t){ return TYPE_JA.indexOf(normTypeJa(t))>=0; }).length;
    var cHits = texts.filter(function(t){ return CAT_JA.indexOf(t)>=0; }).length;
    if(tHits >= 8) return 'type';
    if(cHits >= 2) return 'cat';
    return '';
  }

  function nearestRow(el){
    return el.closest('.row, tr, .move-row, .six-row, .line, .block, .flex, .grid, .container, .inputs') || el.parentElement || document;
  }

  function setVisibleSelectsForInput(inp, typeJa, catJa, power){
    var row = nearestRow(inp);
    var sels = qa('select', row);
    var typeSel=null, catSel=null;
    sels.forEach(function(s){
      var kind = classifySelect(s);
      if(kind==='type' && !typeSel) typeSel=s;
      if(kind==='cat'  && !catSel)  catSel=s;
    });
    var changed=false;
    if(typeSel && typeJa){
      typeJa = normTypeJa(typeJa);
      for(var i=0;i<typeSel.options.length;i++){
        var txt=normTypeJa(key(typeSel.options[i].textContent||typeSel.options[i].value));
        if(txt===typeJa){ typeSel.selectedIndex=i; fire(typeSel); typeSel.classList.add('bdc-type-patched'); changed=true; break; }
      }
    }
    if(catSel && catJa){
      for(var j=0;j<catSel.options.length;j++){
        var txt2=key(catSel.options[j].textContent||catSel.options[j].value);
        if(txt2===catJa){ catSel.selectedIndex=j; fire(catSel); catSel.classList.add('bdc-cat-patched'); changed=true; break; }
      }
    }
    // power hidden (よくある name)
    var p= row.querySelector('input[name*="power"], input[name="mpower"], input[name="movePower"], input[name="move_power"]');
    if(p && (power||power===0)){ p.value=String(power||0); fire(p); }
    return changed;
  }

  var doUpdate = debounce(function(inp){
    var mv = MOVES.get(key(inp.value));
    var deco = ensureChip(inp);
    if(mv){
      deco.chip.textContent = mv.type || '?';
      deco.chip.title = (mv.type||'?')+' / '+(mv.category||'?')+' / 威力 '+(mv.power||0);
      deco.hint.textContent = (mv.category? (mv.category==='変化'?'変化':'('+mv.category+')') : '') + (mv.power? ' '+mv.power : (mv.category==='変化'?' 0':''));
      setVisibleSelectsForInput(inp, key(mv.type), key(mv.category), mv.power);
      inp.dataset.moveTypeJa = key(mv.type);
      inp.dataset.moveCategoryJa = key(mv.category);
      inp.dataset.movePower = String(mv.power||0);
    }else{
      deco.chip.textContent='—'; deco.hint.textContent='';
    }
    updatePanel();
  }, 80);

  function bindAll(){
    var sel='input.m1n, input.m2n, input.m3n, input.m4n, input[name*="move" i], input[name*="技"]';
    qa(sel).forEach(function(inp){
      if(!inp.__bdc_full_v48){
        inp.addEventListener('input', function(){ doUpdate(inp); });
        inp.addEventListener('change', function(){ doUpdate(inp); });
        inp.__bdc_full_v48 = true;
      }
      doUpdate(inp);
    });
  }

  function syncAll(){
    var inps = qa('input.m1n, input.m2n, input.m3n, input.m4n, input[name*="move" i], input[name*="技"]');
    inps.forEach(function(inp){
      var t=inp.dataset.moveTypeJa||''; var c=inp.dataset.moveCategoryJa||''; var p=Number(inp.dataset.movePower||0)||0;
      if(t||c) setVisibleSelectsForInput(inp, t, c, p);
    });
  }

  function hookBulk(){
    var six = q('#six'); if(!six) return;
    var nodes = qa('button, a', six);
    nodes.forEach(function(btn){
      var t=(btn.textContent||'').trim();
      if(/一括計算|診断|再計算/.test(t) && !btn.__bdc_full_v48){
        btn.addEventListener('click', function(){ syncAll(); }, true);
        btn.__bdc_full_v48 = true;
      }
    });
  }

  // self-diagnostic panel
  function ensurePanel(){
    var six=q('#six'); if(!six) return;
    var panel=q('#bdc_panel'); if(panel) return panel;
    panel=document.createElement('div'); panel.id='bdc_panel';
    panel.innerHTML='<div class="row"><span class="pill" id="p_moves">moves: -</span><span class="pill" id="p_first">row検出: -</span><button id="p_sync">強制同期</button></div>';
    six.insertBefore(panel, six.firstChild);
    q('#p_sync', panel).addEventListener('click', function(){ syncAll(); });
    return panel;
  }
  function updatePanel(){
    var panel=ensurePanel(); if(!panel) return;
    var cnt = MOVES.size;
    q('#p_moves', panel).textContent = 'moves: '+cnt;
    // first row check
    var firstInp = q('input.m1n, input[name*="move" i], input[name*="技"]', q('#six'));
    if(firstInp){
      var row = firstInp.closest('.row, tr, .move-row, .six-row, .line, .block, .flex, .grid, .container, .inputs') || firstInp.parentElement;
      var sels = qa('select', row).length;
      q('#p_first', panel).textContent = 'row検出: select '+sels+'個';
    }
  }

  function init(){
    loadMoves();
    bindAll();
    hookBulk();
    ensurePanel();
  }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();