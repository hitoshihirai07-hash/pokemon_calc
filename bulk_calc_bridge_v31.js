
/*! bulk_calc_bridge_v31.js
 * 目的: 6対6の「一括計算」が無反応な環境でも、確実に計算を走らせるブリッジ。
 * 手順:
 *  - 既存の一括関数があればそれを呼び出す（six_calc_all / calcAll / computeAll など）
 *  - 無ければ #six 内の「計算」や同等ボタンを総クリック
 *  - さらに各カードの入力に change/input を発火させてリアクティブ再計算を誘発
 *  - デモ選択後も自動で一括再計算をトリガー
 */
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

  // 1) 探して呼ぶ
  function tryCallKnown(){
    var fns = ['six_calc_all','calcAll','computeAll','runAll','recalcAll','doBulkCalc'];
    for(var i=0;i<fns.length;i++){
      var fn = window[fns[i]];
      if(typeof fn==='function'){
        try{ fn(); return true; }catch(e){ console.debug('call failed', fns[i], e); }
      }
    }
    // window内をざっくり探索（危険なので「calc」「all」両方を含む関数名のみ）
    for(var k in window){
      try{
        if(typeof window[k]==='function' && /calc/i.test(k) && /all/i.test(k)){
          try{ window[k](); return true; }catch(e){}
        }
      }catch(e){}
    }
    return false;
  }

  // 2) ボタン総クリック（#six範囲）
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

  // 3) セルやカードを再計算させるため、入力にイベントを撒く
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

  // 実体
  function bridgeBulkCalc(){
    toast('一括計算を開始');
    if(tryCallKnown()){ toast('内蔵関数で計算しました'); return; }
    if(clickCalcButtons()){ toast('ボタン経由で計算しました'); return; }
    if(pokeReactive()){ toast('再計算を誘発しました'); return; }
    toast('計算関数が見つかりません。');
  }

  // 既存の「一括計算」ボタンにフック
  function hookButtons(){
    var root = document;
    qa('button,.btn', root).forEach(function(b){
      var t=txt(b);
      if(/^\s*(一括計算|計算開始|ダメージ計算)\s*$/.test(t)){
        b.removeEventListener('__bulk_bridge', bridgeBulkCalc);
        b.addEventListener('click', function(e){
          // 元の挙動がある場合は先に走らせ、結果無ければブリッジ
          var handled=false;
          setTimeout(function(){
            if(!handled){ bridgeBulkCalc(); } // 応答が無い場合の保険
          }, 50);
        });
        // マーカーを付けて二重登録防止
        b.addEventListener('__bulk_bridge', bridgeBulkCalc);
      }
    });
    // 無い場合は #six 上部に追加
    if(!q('#bulk_calc_bridge_btn')){
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

  // デモ選択後（JSONロード等）の再計算も捕まえる
  function hookFileInputs(){
    document.addEventListener('change', function(e){
      var t=e.target;
      if(t && t.type==='file'){
        // 反映されるのを少し待ってから一括計算
        setTimeout(bridgeBulkCalc, 300);
      }
    }, true);
  }

  function init(){
    hookButtons();
    hookFileInputs();
  }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();