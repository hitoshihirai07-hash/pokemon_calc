
/*! BDC force toggle + run v51 */
(function(){
  function q(s,r){return (r||document).querySelector(s);} function qa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}
  function key(s){return (s||'').trim();}
  function fire(el){ try{ el.dispatchEvent(new Event('click',{bubbles:true})); }catch(e){} }
  function fireAll(el){
    try{ ['input','change','blur','click','keyup','keydown'].forEach(function(t){ el.dispatchEvent(new Event(t,{bubbles:true})); }); }catch(e){}
    try{ if(window.jQuery){ window.jQuery(el).trigger('change').trigger('input'); } }catch(e){}
  }
  var TYPE_JA=['ノーマル','ほのお','みず','でんき','くさ','こおり','かくとう','どく','じめん','ひこう','エスパー','むし','いわ','ゴースト','ドラゴン','あく','はがね','フェアリー'];
  var CAT_JA=['物理','特殊','変化'];
  var TYPE_ALT={'ノ':'ノーマル','炎':'ほのお','水':'みず','電':'でんき','草':'くさ','氷':'こおり','闘':'かくとう','毒':'どく','地':'じめん','飛':'ひこう','超':'エスパー','虫':'むし','岩':'いわ','霊':'ゴースト','竜':'ドラゴン','悪':'あく','鋼':'はがね','妖':'フェアリー'};
  function normTypeJa(s){ s=key(s); return TYPE_ALT[s]||s; }

  function openDetail(){
    var six = q('#six'); if(!six) return 0;
    var cnt = 0;
    var nodes = qa('button, a', six);
    nodes.forEach(function(b){
      var t=(b.textContent||'').trim();
      if(/技詳細を表示/.test(t)){ fire(b); cnt++; }
      if(/技詳細を隠す/.test(t)){ /* already open */ }
    });
    return cnt;
  }

  function nearestRow(el){ return el.closest('.row, tr, .move-row, .six-row, .line, .block, .inputs, .flex, .grid, .container') || el.parentElement || document; }

  function setRow(row, typeJa, catJa, power){
    var sels = qa('select', row); var typeSel=null, catSel=null;
    if(sels.length>=2){ typeSel=sels[0]; catSel=sels[sels.length-1]; }
    // heuristic by options
    sels.forEach(function(s){
      var opts = qa('option', s).map(function(o){return (o.textContent||o.value).trim();});
      var tHits = opts.filter(function(t){ return TYPE_JA.indexOf(normTypeJa(t))>=0; }).length;
      var cHits = opts.filter(function(t){ return CAT_JA.indexOf(t)>=0; }).length;
      if(tHits>=8) typeSel=s;
      if(cHits>=2) catSel=s;
    });
    if(typeSel){
      typeJa = normTypeJa(typeJa||'');
      for(var i=0;i<typeSel.options.length;i++){
        var txt=normTypeJa((typeSel.options[i].textContent||typeSel.options[i].value).trim());
        if(txt===typeJa){ typeSel.selectedIndex=i; fireAll(typeSel); break; }
      }
    }
    if(catSel){
      for(var j=0;j<catSel.options.length;j++){
        var txt2=(catSel.options[j].textContent||catSel.options[j].value).trim();
        if(txt2===catJa){ catSel.selectedIndex=j; fireAll(catSel); break; }
      }
    }
    var pow = row.querySelector('input[type="number"]') || row.querySelector('input.power, input[name*="power"], input[placeholder*="威力"]');
    if(pow&& (power||power===0)){ try{ pow.value=String(power||0); }catch(e){} fireAll(pow); }
  }

  function syncAll(){
    var inps = qa('#six input.m1n, #six input.m2n, #six input.m3n, #six input.m4n, #six input[name*="move" i], #six input[name*="技"]');
    inps.forEach(function(inp){
      var t=inp.dataset.moveTypeJa||''; var c=inp.dataset.moveCategoryJa||''; var p=Number(inp.dataset.movePower||0)||0;
      if(!t&&!c&&!p) return;
      setRow(nearestRow(inp), t, c, p);
    });
  }

  function runBulk(){
    var six=q('#six'); if(!six) return;
    var btn = qa('button, a', six).find(function(b){ return /一括計算/.test((b.textContent||'').trim()); });
    if(btn){ fire(btn); }
  }

  function init(){
    // expose global helper for緊急時
    window.__BDC_FORCE__ = {openDetail:openDetail, syncAll:syncAll, runBulk:runBulk};
    // typical flow: open detail -> sync -> run
    setTimeout(function(){
      openDetail();
      setTimeout(function(){
        syncAll();
        setTimeout(runBulk, 100);
      }, 100);
    }, 200);
  }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();