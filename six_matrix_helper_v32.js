
/*! six_matrix_helper_v32.js
 * 6x6ダメージマトリクスが「— // 0」のままになる時の診断＆再計算ボタンを追加
 * - 条件チェック：自分側の技入力・選出、相手側の選出、計算トリガ
 * - 問題があれば理由を表示、OKなら一括計算ブリッジ（v31）があればそれも呼び出す
 */
(function(){
  function q(sel,root){ return (root||document).querySelector(sel); }
  function qa(sel,root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }
  function txt(el){ return (el && (el.innerText||el.textContent)||'').trim(); }

  function ensureUI(){
    var six = q('#six');
    if(!six || q('#six_diag')) return;
    var bar = six.querySelector('.toolbar') || six.querySelector('.tabbar') || six;
    var wrap = document.createElement('span');
    wrap.id = 'six_diag';
    wrap.style.marginLeft = '.5rem';
    wrap.innerHTML = '<button class="btn" id="six_diag_btn" style="padding:.35rem .7rem;border-radius:8px;border:1px solid rgba(255,255,255,.25);background:#2c3a64;color:#fff;">診断/再計算</button>';
    bar.appendChild(wrap);
    q('#six_diag_btn').addEventListener('click', diagnoseAndCalc);
  }

  function pickSelectedCards(rootSel){
    var root = q(rootSel);
    if(!root) return [];
    var cards = qa('.six-card', root);
    // 「選出」チェックボックスを優先。無ければ全カード。
    var out = [];
    cards.forEach(function(c){
      var cb = c.querySelector('input[type="checkbox"]');
      if(cb){ if(cb.checked) out.push(c); }
    });
    if(!out.length) out = cards;
    return out.slice(0,6);
  }

  function cardName(card){ var el = card && card.querySelector('.name'); return el ? (el.value||'').trim() : ''; }
  function moves(card){
    var ary=[];
    ['.m1n','.m2n','.m3n','.m4n'].forEach(function(sel){
      var el = card.querySelector(sel);
      var v = el ? (el.value||'').trim() : '';
      if(v) ary.push(v);
    });
    return ary;
  }

  function diagnose(){
    var problems=[];
    var mySel = pickSelectedCards('#six_my');
    var oppSel = pickSelectedCards('#six_opp');

    if(!mySel.length){ problems.push('自分側のカードが見つかりません'); }
    if(!oppSel.length){ problems.push('相手側のカードが見つかりません'); }

    var myNamed = mySel.filter(function(c){ return !!cardName(c); });
    if(!myNamed.length){ problems.push('自分側のポケモン名が未入力（少なくとも1体）'); }

    var haveMove = mySel.some(function(c){ return moves(c).length>0; });
    if(!haveMove){ problems.push('自分側の技が未入力（少なくとも1つ）'); }

    // 相手は名前のみでOK
    var oppNamed = oppSel.filter(function(c){ return !!cardName(c); });
    if(!oppNamed.length){ problems.push('相手側のポケモン名が未入力（少なくとも1体）'); }

    // ブリッジ有無（v31）
    var bridge = (typeof window.six_calc_all==='function') ||
                 (typeof window.calcAll==='function') ||
                 (typeof window.computeAll==='function') ||
                 (typeof window.doBulkCalc==='function') ||
                 (!!document.getElementById('bulk_calc_bridge_btn'));
    if(!bridge){ problems.push('「一括計算」トリガが未接続（bulk_calc_bridge_v31 を読み込むと改善）'); }

    return problems;
  }

  function toast(msg){
    var t=document.createElement('div');
    t.textContent=msg;
    t.style.cssText='position:fixed;left:12px;bottom:12px;background:#233357;color:#fff;border:1px solid rgba(255,255,255,.25);padding:.45rem .6rem;border-radius:8px;z-index:99999';
    document.body.appendChild(t); setTimeout(function(){ t.remove(); }, 2400);
  }

  function tryBulk(){
    if(typeof window.six_calc_all==='function'){ window.six_calc_all(); return true; }
    if(typeof window.calcAll==='function'){ window.calcAll(); return true; }
    if(typeof window.computeAll==='function'){ window.computeAll(); return true; }
    if(typeof window.doBulkCalc==='function'){ window.doBulkCalc(); return true; }
    var btns = qa('button,.btn', q('#six')||document).filter(function(b){
      var t=txt(b); return /一括計算|計算開始|ダメージ計算/.test(t);
    });
    if(btns.length){ btns.forEach(function(b){ try{ b.click(); }catch(e){} }); return true; }
    var aux = document.getElementById('bulk_calc_bridge_btn');
    if(aux){ aux.click(); return true; }
    return false;
  }

  function diagnoseAndCalc(){
    var probs = diagnose();
    if(probs.length){
      alert('6×6マトリクスを計算できません。\\n\\n' + probs.map(function(p){ return '・'+p; }).join('\\n'));
      return;
    }
    toast('一括計算を実行します');
    if(!tryBulk()){
      alert('一括計算の実行に失敗しました。');
    }
  }

  function init(){
    ensureUI();
  }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();