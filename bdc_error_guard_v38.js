
/*! bdc_error_guard_v38.js: prevent white screen & show last error unobtrusively */
(function(){
  if(window.__BDC_ERR_GUARD__) return; window.__BDC_ERR_GUARD__=true;
  var box;
  function ensure(){
    if(box) return box;
    box=document.createElement('div');
    box.id='bdc_err_box';
    box.style.cssText='position:fixed;left:8px;bottom:8px;max-width:62vw;background:rgba(26,34,60,.96);color:#ffe;z-index:100000;border:1px solid rgba(255,255,255,.25);border-radius:10px;padding:.4rem .6rem;font-size:12px;line-height:1.35;display:none;';
    var close=document.createElement('button'); close.textContent='閉'; close.style.cssText='margin-left:.5rem;background:#33406f;color:#fff;border:1px solid rgba(255,255,255,.25);border-radius:6px;padding:.1rem .4rem;cursor:pointer;';
    close.addEventListener('click', function(){ box.style.display='none'; });
    box.appendChild(close);
    document.body.appendChild(box);
    return box;
  }
  function show(msg){
    var b=ensure();
    var p=document.createElement('div'); p.textContent=msg;
    b.insertBefore(p, b.firstChild);
    b.style.display='block';
  }
  window.addEventListener('error', function(e){
    show('[JSエラー] ' + (e.message||'unknown') + ' @ ' + (e.filename||'') + ':' + (e.lineno||''));
  }, true);
  window.addEventListener('unhandledrejection', function(e){
    var m=(e.reason && (e.reason.message||e.reason)) || '(no message)';
    show('[Promise] ' + m);
  });
})();