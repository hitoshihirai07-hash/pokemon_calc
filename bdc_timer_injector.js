
/*! BDC Timer Injector v1 (ES5, no try/await/arrow) */
(function(){
  // ====== 注入先（上から順に探索） ======
  var TARGETS = [
    '.funcTabs', '#funcTabs',
    'header', '.header',
    '.topbar', '.topBar',
    '.nav', '.navbar'
  ];

  // ====== タイマー状態 ======
  var tInt = null;
  var initMs = 20*60*1000;   // 初期 20分
  var remainMs = initMs;
  var running = false;
  var lastTs  = 0;

  // ====== util ======
  function byId(id){ return document.getElementById(id); }
  function pad2(n){ return (n<10?'0':'')+n; }

  // ====== 表示 ======
  function render(){
    var d = byId('bdcTimerDisplay'); if(!d) return;
    var ms = remainMs; if(ms<0) ms=0;
    var s  = Math.floor(ms/1000);
    var m  = Math.floor(s/60);
    var ss = s%60;
    d.textContent = pad2(m)+':'+pad2(ss);
  }

  // ====== 入力変更（停止中のみ即反映） ======
  function onMinutes(){
    var el = byId('bdcTimerMinutes'); if(!el) return;
    var m = parseInt(el.value,10);
    if(!(m>0)){ m=20; el.value='20'; }
    initMs = m*60*1000;
    if(!running){ remainMs = initMs; render(); }
  }

  // ====== tick ======
  function tick(){
    if(!running) return;
    var now = Date.now();
    var dt  = now - (lastTs||now);
    lastTs  = now;
    remainMs -= dt;
    if(remainMs <= 0){
      remainMs = 0;
      running  = false;
      if(tInt){ clearInterval(tInt); tInt = null; }
    }
    render();
  }

  // ====== 操作 ======
  function start(){
    if(running) return;
    if(remainMs <= 0) remainMs = initMs;
    running = true;
    lastTs  = Date.now();
    if(tInt){ clearInterval(tInt); }
    tInt = setInterval(tick, 250);
  }
  function stop(){
    running = false;
    if(tInt){ clearInterval(tInt); tInt = null; }
  }
  function reset(){
    stop();
    remainMs = initMs;
    render();
  }

  // ====== スタイル注入（最小限） ======
  function injectStyles(){
    if(byId('bdcTimerStyles')) return;
    var css = ''
      + '.bdcTimerBar{margin-left:auto;display:flex;gap:8px;align-items:center}'
      + '.bdcTimerLabel{opacity:.8;font-size:12px}'
      + '#bdcTimerMinutes{width:64px}'
      + '#bdcTimerDisplay{min-width:64px;display:inline-block;text-align:center}'
      + '.bdcTimerBtn{padding:3px 8px;border:1px solid #334;'
      + 'background:transparent;color:inherit;border-radius:8px;cursor:pointer}';
    var st = document.createElement('style');
    st.id = 'bdcTimerStyles';
    st.appendChild(document.createTextNode(css));
    (document.head||document.documentElement).appendChild(st);
  }

  // ====== UI 注入（見出しバーの右側） ======
  function injectUI(host){
    if(!host) return;
    if(byId('bdcTimerDisplay')) return; // 二重生成防止

    var wrap = document.createElement('div');
    wrap.className = 'bdcTimerBar';
    wrap.setAttribute('role','group');
    wrap.setAttribute('aria-label','タイマー');

    var label = document.createElement('span');
    label.className = 'bdcTimerLabel';
    label.appendChild(document.createTextNode('タイマー'));

    var minutes = document.createElement('input');
    minutes.id   = 'bdcTimerMinutes';
    minutes.type = 'number';
    minutes.min  = '1';
    minutes.max  = '600';
    minutes.value= '20';
    minutes.setAttribute('aria-label','分');

    var unit = document.createTextNode('分');

    var disp = document.createElement('span');
    disp.id = 'bdcTimerDisplay';
    disp.className = 'mono';
    disp.appendChild(document.createTextNode('20:00'));

    var bS = document.createElement('button');
    bS.id = 'bdcTimerStart'; bS.className='bdcTimerBtn';
    bS.appendChild(document.createTextNode('スタート'));

    var bP = document.createElement('button');
    bP.id = 'bdcTimerStop';  bP.className='bdcTimerBtn';
    bP.appendChild(document.createTextNode('ストップ'));

    var bR = document.createElement('button');
    bR.id = 'bdcTimerReset'; bR.className='bdcTimerBtn';
    bR.appendChild(document.createTextNode('初期化'));

    wrap.appendChild(label);
    wrap.appendChild(minutes);
    wrap.appendChild(unit);
    wrap.appendChild(disp);
    wrap.appendChild(bS);
    wrap.appendChild(bP);
    wrap.appendChild(bR);

    host.appendChild(wrap);

    // イベント
    minutes.addEventListener('change', onMinutes);
    minutes.addEventListener('input',  onMinutes);
    bS.addEventListener('click', start);
    bP.addEventListener('click', stop);
    bR.addEventListener('click', reset);

    render();
  }

  // ====== 注入先を探して注入（最大10秒リトライ） ======
  function waitAndInject(){
    var tries = 0, maxTries = 40, iv = setInterval(function(){
      var host = null, i, sel, el;
      for(i=0;i<TARGETS.length;i++){
        sel = TARGETS[i];
        if (document.querySelector){ el = document.querySelector(sel); }
        if (el){ host = el; break; }
      }
      if (host){
        clearInterval(iv);
        injectStyles();
        injectUI(host);
      } else {
        tries++;
        if(tries>=maxTries) clearInterval(iv);
      }
    }, 250);
  }

  // ====== 起動 ======
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', waitAndInject);
  } else {
    waitAndInject();
  }
})();
