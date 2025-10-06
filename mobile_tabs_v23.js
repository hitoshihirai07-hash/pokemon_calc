
// mobile_tabs_v23.js
(function(){
  function q(sel,root){ return (root||document).querySelector(sel); }
  function qa(sel,root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }
  function on(el,ev,fn){ el&&el.addEventListener(ev,fn); }

  // 既存タブ候補を収集
  function collectTabs(){
    var tabs = [];
    // .tab（data-tab-target付きが多い）
    qa('.tab').forEach(function(b){
      var label = (b.textContent||'').trim();
      if(!label) return;
      tabs.push({label:label, click:function(){ b.click(); }});
    });
    // data-tab-target の付いたボタン以外も拾う
    qa('[data-tab-target]').forEach(function(b){
      var label = (b.textContent||'').trim();
      if(!label) return;
      tabs.push({label:label, click:function(){ b.click(); }});
    });
    // a[href^="#xxx"] による切替にも対応
    qa('a[href^="#"]').forEach(function(a){
      var label = (a.textContent||'').trim();
      var href = a.getAttribute('href');
      if(!label || !href) return;
      tabs.push({label:label, click:function(){ location.hash = href; a.click&&a.click(); }});
    });
    // ラベルが重複するものを除外（先勝ち）
    var seen = {};
    tabs = tabs.filter(function(t){
      if(seen[t.label]) return false; seen[t.label]=1; return true;
    });
    // 有名タブの優先順でソート
    var order = ['ダメージ計算','ダメージ','1対3','構築記事','6対6','パーティー'];
    tabs.sort(function(a,b){
      var ia = order.indexOf(a.label); var ib = order.indexOf(b.label);
      if(ia<0 && ib<0) return 0; if(ia<0) return 1; if(ib<0) return -1; return ia-ib;
    });
    return tabs;
  }

  function buildBar(){
    if(q('#mobile_tabs_bar')) return;
    var tabs = collectTabs();
    if(!tabs.length) return;
    var bar = document.createElement('div');
    bar.id='mobile_tabs_bar';
    bar.innerHTML = '<div class="arrow" id="mt_left">‹</div><div id="mobile_tabs_scroller"></div><div class="arrow" id="mt_right">›</div>';
    document.body.appendChild(bar);
    var sc = q('#mobile_tabs_scroller');
    tabs.forEach(function(t,ix){
      var b=document.createElement('button');
      b.className='mtab';
      b.textContent=t.label;
      b.addEventListener('click', function(){
        t.click();
        // active 表示
        qa('#mobile_tabs_bar .mtab').forEach(function(x){ x.classList.remove('active'); });
        b.classList.add('active');
      });
      sc.appendChild(b);
      if(ix===0) b.classList.add('active');
    });
    // スクロール矢印
    function scrollBy(dx){ sc.scrollBy({left:dx, behavior:'smooth'}); }
    on(q('#mt_left'), 'click', function(){ scrollBy(-160); });
    on(q('#mt_right'), 'click', function(){ scrollBy(160); });
  }

  function init(){
    buildBar();
  }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();