
/*! custom_autocomplete_v21.js
 * パーティータブ/6対6（自分側）の「ポケモン名・技名」をカスタムUIでオートコンプリート化
 * - datalistに依存しない：独自ドロップダウンを生成（クリック/矢印/Enter操作対応）
 * - データは window.POKE/MOVES か、同階層の pokemon_master.json / moves.csv をロード
 */
(function(){
  function q(sel,root){ return (root||document).querySelector(sel); }
  function qa(sel,root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }
  function uniq(arr){ var s={}, out=[]; for(var i=0;i<arr.length;i++){ var v=arr[i]; if(!v||s[v]) continue; s[v]=1; out.push(v);} return out; }
  function parseCSV(text){
    var lines = text.replace(/\r\n?/g,'\n').split('\n'); if(!lines.length) return [];
    var head = lines.shift().split(','), out=[];
    for(var i=0;i<lines.length;i++){ var ln=lines[i]; if(!ln.trim()) continue; var cols=ln.split(','), o={};
      for(var c=0;c<head.length;c++){ o[head[c]]=(cols[c]||'').trim(); } out.push(o);
    } return out;
  }
  function canFetch(){ return /^https?:/i.test(location.protocol); }
  var DB = {pokes:[], moves:[]};

  function loadPokes(){
    if(DB.pokes.length) return Promise.resolve(DB.pokes);
    if(window.POKE||window.POKE_INLINE){
      var arr = window.POKE||window.POKE_INLINE||[];
      DB.pokes = uniq(arr.map(function(r){ return r['名前']||r.name||r.Name||r.pokemon||''; }));
      return Promise.resolve(DB.pokes);
    }
    if(!canFetch()) return Promise.resolve([]);
    return fetch('./pokemon_master.json').then(r=>r.json()).then(function(js){
      var arr = Array.isArray(js)? js : (js.pokemon||js.data||js.list||[]);
      DB.pokes = uniq(arr.map(function(r){ return r['名前']||r.name||r.Name||r.pokemon||''; }));
      return DB.pokes;
    }).catch(function(){ return []; });
  }
  function loadMoves(){
    if(DB.moves.length) return Promise.resolve(DB.moves);
    if(window.MOVES||window.MOVES_INLINE){
      var arr = window.MOVES||window.MOVES_INLINE||[];
      DB.moves = uniq(arr.map(function(r){ return r['技名']||r['技']||r['わざ']||r.name||r.Name||''; }));
      return Promise.resolve(DB.moves);
    }
    if(!canFetch()) return Promise.resolve([]);
    return fetch('./moves.csv').then(r=>r.text()).then(function(txt){
      var rows = parseCSV(txt);
      DB.moves = uniq(rows.map(function(r){ return r['技名']||r['技']||r['わざ']||r.name||r.Name||''; }));
      return DB.moves;
    }).catch(function(){ return []; });
  }

  // --- Dropdown ---
  var DD = (function(){
    var box=null, items=[], active=-1, currentInput=null, currentList=[];
    function ensureBox(){
      if(box) return box;
      box=document.createElement('div');
      box.style.cssText='position:absolute; z-index:99999; min-width:180px; max-height:220px; overflow:auto; border:1px solid rgba(255,255,255,.25); background:#0f1730; color:#fff; border-radius:8px; box-shadow:0 8px 20px rgba(0,0,0,.35); display:none;';
      document.body.appendChild(box);
      box.addEventListener('mousedown', function(e){ e.preventDefault(); }); // keep focus on input
      box.addEventListener('click', function(e){
        var el=e.target.closest('.dd-item'); if(!el) return;
        choose(parseInt(el.getAttribute('data-ix'),10)||0);
      });
      return box;
    }
    function layoutFor(input){
      var r=input.getBoundingClientRect();
      box.style.left=(window.scrollX+r.left)+'px';
      box.style.top=(window.scrollY+r.bottom+2)+'px';
      box.style.width=r.width+'px';
    }
    function render(list){
      box.innerHTML='';
      items=[]; active=-1;
      for(var i=0;i<list.length;i++){
        var div=document.createElement('div');
        div.className='dd-item';
        div.setAttribute('data-ix', i);
        div.textContent=list[i];
        div.style.cssText='padding:.35rem .5rem; cursor:pointer; border-bottom:1px solid rgba(255,255,255,.08)';
        box.appendChild(div); items.push(div);
      }
      if(!list.length){
        var emp=document.createElement('div');
        emp.textContent='候補なし';
        emp.style.cssText='padding:.35rem .5rem; opacity:.7;';
        box.appendChild(emp);
      }
    }
    function show(input, list){
      ensureBox(); currentInput=input; currentList=list.slice(0,50);
      layoutFor(input); render(currentList); box.style.display='block';
    }
    function hide(){ if(box) box.style.display='none'; currentInput=null; currentList=[]; }
    function choose(ix){
      if(!currentInput || !currentList.length) return;
      currentInput.value = currentList[ix] || '';
      currentInput.dispatchEvent(new Event('input',{bubbles:true}));
      currentInput.dispatchEvent(new Event('change',{bubbles:true}));
      hide();
    }
    function move(delta){
      if(!items.length) return;
      active = (active+delta+items.length) % items.length;
      items.forEach(function(it, i){ it.style.background = (i===active? '#20325f' : 'transparent'); });
    }
    function onKey(e){
      if(!box || box.style.display==='none') return false;
      if(e.key==='ArrowDown'){ move(1); e.preventDefault(); return true; }
      if(e.key==='ArrowUp'){ move(-1); e.preventDefault(); return true; }
      if(e.key==='Enter'){ if(active>=0){ choose(active); e.preventDefault(); return true; } }
      if(e.key==='Escape'){ hide(); e.preventDefault(); return true; }
      return false;
    }
    window.addEventListener('resize', function(){ if(currentInput && box && box.style.display!=='none'){ layoutFor(currentInput); } });
    window.addEventListener('scroll', function(){ if(currentInput && box && box.style.display!=='none'){ layoutFor(currentInput); } }, true);
    document.addEventListener('click', function(e){ if(box && box.style.display!=='none'){ if(!e.target.closest('.dd-item')){ hide(); } }});
    return {show:show, hide:hide, onKey:onKey};
  })();

  function attachAC(inputs, listGetter){
    inputs.forEach(function(inp){
      var cached=[];
      inp.setAttribute('autocomplete','off');
      inp.addEventListener('input', function(){
        var v=(inp.value||'').trim();
        if(!v){ DD.hide(); return; }
        listGetter().then(function(arr){
          cached = arr.filter(function(nm){ return nm && nm.indexOf(v)>=0; }).slice(0,50);
          DD.show(inp, cached);
        });
      });
      inp.addEventListener('keydown', function(e){ if(DD.onKey(e)) return; });
      inp.addEventListener('blur', function(){ setTimeout(DD.hide, 180); });
      inp.addEventListener('focus', function(){
        var v=(inp.value||'').trim();
        listGetter().then(function(arr){
          var list = v? arr.filter(function(nm){ return nm && nm.indexOf(v)>=0; }) : arr.slice(0,50);
          DD.show(inp, list);
        });
      });
    });
  }

  function init(){
    loadPokes(); loadMoves();
    // Party
    attachAC(qa('#party .party-card .p_name'), loadPokes);
    attachAC([].concat(
      qa('#party .party-card .p_m1'),
      qa('#party .party-card .p_m2'),
      qa('#party .party-card .p_m3'),
      qa('#party .party-card .p_m4')
    ), loadMoves);
    // 6x6 自分側の技名
    attachAC([].concat(
      qa('#six_my .six-card .m1n'),
      qa('#six_my .six-card .m2n'),
      qa('#six_my .six-card .m3n'),
      qa('#six_my .six-card .m4n')
    ), loadMoves);
  }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();