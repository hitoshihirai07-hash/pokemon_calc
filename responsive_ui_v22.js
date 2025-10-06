
// responsive_ui_v22.js
(function(){
  function q(sel,root){ return (root||document).querySelector(sel); }
  function qa(sel,root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }
  var pref = localStorage.getItem('pcalc_view_mode'); // 'pc' | 'sp' | ''

  function applyMode(){
    document.body.classList.remove('force-pc','force-sp');
    if(pref==='pc'){ document.body.classList.add('force-pc'); }
    else if(pref==='sp'){ document.body.classList.add('force-sp'); }
  }
  function toggleMode(){
    if(pref==='pc'){ pref='sp'; }
    else if(pref==='sp'){ pref=''; }
    else { pref='pc'; }
    localStorage.setItem('pcalc_view_mode', pref);
    applyMode(); initSticky(); initAccordions(); flash('表示モード: ' + (pref||'自動'));
  }
  function ensureToggle(){
    if(q('#view_toggle')) return;
    var b=document.createElement('button');
    b.id='view_toggle'; b.textContent='📱/🖥'; b.title='表示モード切替（PC↔モバイル↔自動）';
    b.addEventListener('click', toggleMode);
    document.body.appendChild(b);
  }

  var sticky;
  function initSticky(){
    if(!sticky){
      sticky=document.createElement('div');
      sticky.id='sticky_actions';
      sticky.innerHTML='<button class="btn" id="sa_calc">一括計算</button><button class="btn" id="sa_top">上へ</button>';
      document.body.appendChild(sticky);
      q('#sa_top').addEventListener('click', function(){ window.scrollTo({top:0,behavior:"smooth"}); });
      q('#sa_calc').addEventListener('click', fireCalcAll);
    }
  }
  function fireCalcAll(){
    var cands = qa('button, .btn');
    var hit = null;
    for(var i=0;i<cands.length;i++){
      var t=(cands[i].textContent||'').trim();
      if(/一括計算|計算開始|ダメージ計算/.test(t)){ hit=cands[i]; break; }
    }
    if(hit){ hit.click(); return; }
    try{
      if(typeof window.six_calc_all==='function'){ window.six_calc_all(); return; }
      if(typeof window.calcAll==='function'){ window.calcAll(); return; }
    }catch(e){}
  }

  function initAccordions(){
    var forceSp = document.body.classList.contains('force-sp');
    var forcePc = document.body.classList.contains('force-pc');
    var isMobile = forceSp || (window.matchMedia('(max-width: 900px)').matches && !forcePc);
    if(!isMobile) return;
    qa('#six .six-card .ev, #six .six-card .moves').forEach(function(el){
      if(el && el.style.display!=='none'){ el.style.display='none'; }
    });
  }

  function flash(msg){
    var t=document.createElement('div');
    t.textContent=msg;
    t.style.cssText='position:fixed;left:12px;bottom:12px;background:#233357;color:#fff;border:1px solid rgba(255,255,255,.25);padding:.45rem .6rem;border-radius:8px;z-index:99999';
    document.body.appendChild(t); setTimeout(function(){ t.remove(); }, 1800);
  }

  document.addEventListener('DOMContentLoaded', function(){
    applyMode(); ensureToggle(); initSticky(); initAccordions();
  });
  window.addEventListener('resize', function(){ initAccordions(); });
})();