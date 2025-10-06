
/*! bulk_calc_bridge_v31.js */
(function(){
  function q(sel,root){ return (root||document).querySelector(sel); }
  function qa(sel,root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }
  function txt(el){ return (el && (el.innerText||el.textContent)||'').trim(); }
  function toast(msg){
    var t=document.createElement('div');
    t.textContent=msg;
    t.style.cssText='position:fixed;left:12px;bottom:12px;background:#233357;color:#fff;border:1px solid rgba(255,255,255,.25);padding:.45rem .6rem;border-radius:8px;z-index:99999';
    document.body.appendChild(t); setTimeout(function(){ t.remove(); }, 2200);
  }
  function tryCallKnown(){
    var fns = ['six_calc_all','calcAll','computeAll','runAll','recalcAll','doBulkCalc'];
    for(var i=0;i<fns.length;i++){
      var fn = window[fns[i]];
      if(typeof fn==='function'){
        try{ fn(); return true; }catch(e){ console.debug('call failed', fns[i], e); }
      }
    }
    for(var k in window){
      try{
        if(typeof window[k]==='function' && /calc/i.test(k) && /all/i.test(k)){
          try{ window[k](); return true; }catch(e){}
        }
      }catch(e){}
    }
    return false;
  }
  function clickCalcButtons(){
    var root = q('#six') || document;
    var btns = qa('button,.btn', root).filter(function(b){
      return /一括計算|計算開始|ダメージ計算|全計算|全て計算/.test(txt(b));
    });
    if(btns.length){
      btns.forEach(function(b){ try{ b.click(); }catch(e){} });
      return true;
    }
    return false;
  }
  function pokeReactive(){
    var root = q('#six') || document;
    var inputs = qa('input,select', root);
    inputs.forEach(function(el,ix){
      try{
        el.dispatchEvent(new Event('input', {bubbles:true}));
        el.dispatchEvent(new Event('change', {bubbles:true}));
      }catch(e){}
    });
    return inputs.length>0;
  }
  function bridgeBulkCalc(){
    toast('一括計算を開始');
    if(tryCallKnown()){ toast('内蔵関数で計算しました'); return; }
    if(clickCalcButtons()){ toast('ボタン経由で計算しました'); return; }
    if(pokeReactive()){ toast('再計算を誘発しました'); return; }
    toast('計算関数が見つかりません。');
  }
  function hookButtons(){
    var root = document;
    qa('button,.btn', root).forEach(function(b){
      var t=(b.textContent||'').trim();
      if(/^\s*(一括計算|計算開始|ダメージ計算)\s*$/.test(t)){
        b.addEventListener('click', function(){
          setTimeout(function(){ bridgeBulkCalc(); }, 80);
        }, { once:false });
      }
    });
    if(!document.getElementById('bulk_calc_bridge_btn')){
      var six = q('#six');
      if(six){
        var bar = six.querySelector('.toolbar') || six.querySelector('.tabbar') || six;
        var btn = document.createElement('button');
        btn.id='bulk_calc_bridge_btn';
        btn.className='btn';
        btn.textContent='一括計算';
        btn.style.cssText='margin:.25rem .4rem; padding:.35rem .7rem; border-radius:8px; border:1px solid rgba(255,255,255,.25); background:#2c3a64; color:#fff;';
        btn.addEventListener('click', function(e){ e.preventDefault(); bridgeBulkCalc(); });
        bar.insertBefore(btn, bar.firstChild);
      }
    }
  }
  function hookFileInputs(){
    document.addEventListener('change', function(e){
      var t=e.target;
      if(t && t.type==='file'){
        setTimeout(bridgeBulkCalc, 300);
      }
    }, true);
  }
  function init(){ hookButtons(); hookFileInputs(); }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();