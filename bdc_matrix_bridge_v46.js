
/*! BDC matrix bridge v46 */
(function(){
  function q(s,r){return (r||document).querySelector(s);} function qa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}
  function key(s){return (s||'').trim();}
  function fire(el){ try{ el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); }catch(e){} try{ if(window.jQuery) window.jQuery(el).trigger('change').trigger('input'); }catch(e){} }
  var TYPE_JA=['ノーマル','ほのお','みず','でんき','くさ','こおり','かくとう','どく','じめん','ひこう','エスパー','むし','いわ','ゴースト','ドラゴン','あく','はがね','フェアリー'];
  var CAT_JA=['物理','特殊','変化'];

  function classifySelect(sel){
    var texts = qa('option', sel).map(function(o){ return key(o.textContent||o.value); });
    var tHits = texts.filter(function(t){ return TYPE_JA.indexOf(t)>=0; }).length;
    var cHits = texts.filter(function(t){ return CAT_JA.indexOf(t)>=0; }).length;
    if(tHits >= 8) return 'type';
    if(cHits >= 2) return 'cat';
    return '';
  }

  function nearestRow(el){
    var p = el.closest('.row, tr, .move-row, .six-row, .line, .block, .flex, .grid, .container');
    return p || el.parentElement || document;
  }

  function setVisibleSelectsForInput(moveInput, typeJa, catJa){
    var row = nearestRow(moveInput);
    var sels = qa('select', row);
    var typeSel=null, catSel=null;
    sels.forEach(function(s){
      var kind = classifySelect(s);
      if(kind==='type' && !typeSel) typeSel=s;
      if(kind==='cat' && !catSel) catSel=s;
    });
    var changed=false;
    if(typeSel){
      var ok=false;
      for(var i=0;i<typeSel.options.length;i++){
        var txt=key(typeSel.options[i].textContent||typeSel.options[i].value);
        if(txt===typeJa){ typeSel.selectedIndex=i; ok=true; break; }
      }
      if(ok){ typeSel.classList.add('bdc-type-patched'); fire(typeSel); changed=true; }
    }
    if(catSel){
      var ok2=false;
      for(var j=0;j<catSel.options.length;j++){
        var txt2=key(catSel.options[j].textContent||catSel.options[j].value);
        if(txt2===catJa){ catSel.selectedIndex=j; ok2=true; break; }
      }
      if(ok2){ catSel.classList.add('bdc-cat-patched'); fire(catSel); changed=true; }
    }
    return changed;
  }

  // listen move-resolve events from existing bridges
  document.addEventListener('bdc:move:resolved', function(ev){
    var info=ev.detail||{};
    var inp=ev.target;
    setVisibleSelectsForInput(inp, key(info.type||''), key(info.category||''));
  }, true);
  document.addEventListener('bdc:move:compat', function(ev){
    var info=ev.detail||{};
    var inp=ev.target;
    var typeJa = (info.type&&info.type.ja) || info.type || '';
    var catJa  = (info.category&&info.category.ja) || info.category || '';
    setVisibleSelectsForInput(inp, key(typeJa), key(catJa));
  }, true);

  function syncAll(){
    // try to read dataset values we wrote previously
    var inps = qa('input.m1n, input.m2n, input.m3n, input.m4n, input[name*="move" i], input[name*="技"]');
    inps.forEach(function(inp){
      var typeJa = key(inp.dataset.moveTypeJa || '');
      var catJa  = key(inp.dataset.moveCategoryJa || '');
      if(!typeJa || !catJa){
        // fallback: look at hidden we may have written
        var row = nearestRow(inp);
        var t = row.querySelector('input[name="mtype"], input[name="type"]'); var c = row.querySelector('input[name="mcat"], input[name="category"]');
        if(t) typeJa = typeJa || key(t.value);
        if(c) catJa  = catJa  || key(c.value);
      }
      if(typeJa || catJa) setVisibleSelectsForInput(inp, typeJa, catJa);
    });
  }

  // run before bulk calc
  function hookBulk(){
    var six = q('#six'); if(!six) return;
    var nodes = qa('button, a', six);
    nodes.forEach(function(btn){
      var t=(btn.textContent||'').trim();
      if(/一括計算|診断|再計算/.test(t) && !btn.__bdc_mx_v46){
        btn.addEventListener('click', function(){ syncAll(); }, true);
        btn.__bdc_mx_v46 = true;
      }
    });
  }

  function init(){ hookBulk(); }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();