
/*! six_diag_fab_v33.js */
(function(){
  if(window.__BDC_SIX_V33_LOADED) return; window.__BDC_SIX_V33_LOADED = true;
  function q(sel,root){ return (root||document).querySelector(sel); }
  function qa(sel,root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }
  function t(el){ return (el && (el.innerText||el.textContent)||'').trim(); }
  function ensureFAB(){
    if(q('#bdc_fab')) return;
    var b = document.createElement('button');
    b.id = 'bdc_fab'; b.title = '診断/再計算 (Alt+Shift+Enter / Ctrl+Alt+B)'; b.textContent = '再';
    b.style.cssText = 'position:fixed;right:14px;bottom:14px;width:52px;height:52px;border-radius:50%;border:1px solid rgba(255,255,255,.35);background:#2d3d6e;color:#fff;font-weight:700;font-size:18px;box-shadow:0 8px 24px rgba(0,0,0,.35);cursor:pointer;z-index:100000';
    b.addEventListener('click', run); document.body.appendChild(b);
  }
  function pickCards(rootSel){
    var root = q(rootSel), out=[]; if(!root) return out;
    qa('.six-card', root).forEach(function(c){
      var cb = c.querySelector('input[type="checkbox"]'); if(cb){ if(cb.checked) out.push(c); }
    });
    if(!out.length) out = qa('.six-card', root).slice(0,6); return out;
  }
  function nameOf(card){ var el = card && card.querySelector('.name'); return el ? (el.value||'').trim() : ''; }
  function hasMove(card){ var k=['.m1n','.m2n','.m3n','.m4n']; for(var i=0;i<k.length;i++){ var el=card.querySelector(k[i]); if(el && (el.value||'').trim()) return true; } return false; }
  function diagnose(){
    var probs=[], my=pickCards('#six_my'), opp=pickCards('#six_opp');
    if(!my.length) probs.push('自分側カードが見つかりません');
    if(!opp.length) probs.push('相手側カードが見つかりません');
    if(!my.some(function(c){return !!nameOf(c);})){ probs.push('自分側のポケモン名が未入力（最低1体）'); }
    if(!opp.some(function(c){return !!nameOf(c);})){ probs.push('相手側のポケモン名が未入力（最低1体）'); }
    if(!my.some(hasMove)){ probs.push('自分側の技が未入力（最低1つ）'); }
    return probs;
  }
  function toast(msg){ var t=document.createElement('div'); t.textContent=msg; t.style.cssText='position:fixed;left:12px;bottom:12px;background:#233357;color:#fff;border:1px solid rgba(255,255,255,.25);padding:.45rem .6rem;border-radius:8px;z-index:100001'; document.body.appendChild(t); setTimeout(function(){ t.remove(); }, 2200); }
  function tryKnown(){
    var f=['six_calc_all','calcAll','computeAll','runAll','recalcAll','doBulkCalc'];
    for(var i=0;i<f.length;i++){ var fn=window[f[i]]; if(typeof fn==='function'){ try{ fn(); return true; }catch(e){} } }
    for(var k in window){ try{ if(typeof window[k]==='function' && /calc/i.test(k) && /all/i.test(k)){ try{ window[k](); return true; }catch(e){} } }catch(e){} }
    return false;
  }
  function clickButtons(){
    var root=q('#six')||document; var btns=qa('button,.btn',root).filter(function(b){ return /一括計算|計算開始|ダメージ計算/.test(t(b)); });
    btns.forEach(function(b){ try{ b.click(); }catch(e){} }); return btns.length>0;
  }
  function fireInputs(){
    var root=q('#six')||document, cnt=0;
    qa('input,select', root).forEach(function(el){ try{ el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); cnt++; }catch(e){} });
    return cnt>0;
  }
  function run(){
    var probs = diagnose();
    if(probs.length){ alert('不足:\n' + probs.map(function(x){return '・'+x;}).join('\n')); return; }
    toast('一括計算を試行'); if(tryKnown()){ toast('既存関数を実行しました'); return; }
    if(clickButtons()){ toast('ボタン経由で実行しました'); return; }
    if(fireInputs()){ toast('再計算を誘発しました'); return; }
    alert('計算トリガが見つかりませんでした');
  }
  function onKey(e){ if((e.altKey&&e.shiftKey&&e.key==='Enter')||(e.ctrlKey&&e.altKey&&(e.key==='b'||e.key==='B'))){ e.preventDefault(); run(); } }
  function init(){ ensureFAB(); document.addEventListener('keydown', onKey, true); }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();