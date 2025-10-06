
/*! BDC force-row mapper v49 */
(function(){
  function q(s,r){return (r||document).querySelector(s);} function qa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}
  function key(s){return (s||'').trim();}
  function fireAll(el){
    try{
      ['input','change','blur','click','keyup','keydown','update'].forEach(function(t){
        el.dispatchEvent(new Event(t,{bubbles:true,cancelable:true}));
      });
      if(window.jQuery){ try{ window.jQuery(el).trigger('change').trigger('input').trigger('select2:select'); }catch(e){} }
    }catch(e){}
  }
  function nearestRow(el){
    var p=el.closest('.row, tr, .move-row, .six-row, .line, .block, .inputs, .grid, .flex, .container');
    return p || el.parentElement || document;
  }
  var TYPE_JA=['ノーマル','ほのお','みず','でんき','くさ','こおり','かくとう','どく','じめん','ひこう','エスパー','むし','いわ','ゴースト','ドラゴン','あく','はがね','フェアリー'];
  var CAT_JA=['物理','特殊','変化'];
  var TYPE_ALT={'ノ':'ノーマル','炎':'ほのお','水':'みず','電':'でんき','草':'くさ','氷':'こおり','闘':'かくとう','毒':'どく','地':'じめん','飛':'ひこう','超':'エスパー','虫':'むし','岩':'いわ','霊':'ゴースト','竜':'ドラゴン','悪':'あく','鋼':'はがね','妖':'フェアリー'};
  function normTypeJa(s){ s=key(s); return TYPE_ALT[s]||s; }

  function setByPosition(row, typeJa, catJa, power){
    var selects = qa('select', row);
    // まずは数的に2つ ⇒ [0]=タイプ, [1]=分類 とみなす
    var typeSel=null, catSel=null;
    if(selects.length>=2){
      typeSel = selects[0]; catSel = selects[selects.length-1];
    }
    // それでもダメなら label テキストに基づく補正
    selects.forEach(function(s){
      var txts = qa('option', s).map(function(o){ return key(o.textContent||o.value); });
      var tHits = txts.filter(function(t){ return TYPE_JA.indexOf(normTypeJa(t))>=0; }).length;
      var cHits = txts.filter(function(t){ return CAT_JA.indexOf(t)>=0; }).length;
      if(tHits>=8) typeSel=s;
      if(cHits>=2) catSel=s;
    });
    var changed=false;
    if(typeSel){
      typeJa = normTypeJa(typeJa||'');
      for(var i=0;i<typeSel.options.length;i++){
        var txt=normTypeJa(key(typeSel.options[i].textContent||typeSel.options[i].value));
        if(txt===typeJa){ typeSel.selectedIndex=i; fireAll(typeSel); changed=true; break; }
      }
    }
    if(catSel){
      for(var j=0;j<catSel.options.length;j++){
        var ct=key(catSel.options[j].textContent||catSel.options[j].value);
        if(ct===catJa){ catSel.selectedIndex=j; fireAll(catSel); changed=true; break; }
      }
    }
    // 威力：数値入力/テキスト入力を探す（move名称入力の近傍）
    var pow = row.querySelector('input[type="number"]') || row.querySelector('input.power, input[name*="power"], input[placeholder*="威力"]');
    if(pow && (power||power===0)){
      try{ pow.value = String(power||0); }catch(e){}
      fireAll(pow); changed=true;
    }
    return changed;
  }

  function syncFromDatasets(){
    var inps = qa('#six input.m1n, #six input.m2n, #six input.m3n, #six input.m4n, #six input[name*="move" i], #six input[name*="技"]');
    inps.forEach(function(inp){
      var t = inp.dataset.moveTypeJa || '';
      var c = inp.dataset.moveCategoryJa || '';
      var p = Number(inp.dataset.movePower||0)||0;
      if(!t && !c) return;
      var row = nearestRow(inp);
      setByPosition(row, t, c, p);
    });
  }

  // 既存ブリッジからのイベントを捕捉
  document.addEventListener('bdc:move:resolved', function(ev){
    var info = ev.detail||{}; var inp=ev.target; if(!inp) return;
    var row = nearestRow(inp);
    setByPosition(row, key(info.type||''), key(info.category||''), Number(info.power||0)||0);
  }, true);
  document.addEventListener('bdc:move:compat', function(ev){
    var d=ev.detail||{}; var inp=ev.target; if(!inp) return;
    var t = (d.type&&d.type.ja) || d.type || ''; var c=(d.category&&d.category.ja)||d.category||''; var p=Number((d.power&&d.power.p)||d.power||0)||0;
    var row = nearestRow(inp);
    setByPosition(row, key(t), key(c), p);
  }, true);

  // 一括計算/診断/再計算 の直前に全行を可視セレクトへ反映
  function hookBulk(){
    var six=q('#six'); if(!six) return;
    var nodes = qa('button, a', six);
    nodes.forEach(function(btn){
      var t=(btn.textContent||'').trim();
      if(/一括計算|診断|再計算/.test(t) && !btn.__bdc_force_v49){
        btn.addEventListener('click', function(){ syncFromDatasets(); }, true);
        btn.__bdc_force_v49=true;
      }
    });
  }
  function init(){ hookBulk(); }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();