
/*! datalist_autocomplete_v20.js
 * 目的: パーティータブ/6対6で ポケモン名・技名 のオートコンプリートを確実に出す
 * - <datalist id="dl_pokemon"> / <datalist id="dl_moves"> を必ず用意し、空なら自動で埋める
 * - 埋め込みが無い場合は ./pokemon_master.json と ./moves.csv を fetch して補完
 * - それでも空なら（file://等）起動時に軽い通知を表示
 * - すべての該当 input に list 属性を強制付与
 */
(function(){
  function q(sel,root){ return (root||document).querySelector(sel); }
  function qa(sel,root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }
  function uniq(arr){ var s={}, out=[]; for(var i=0;i<arr.length;i++){ var v=arr[i]; if(!v||s[v]) continue; s[v]=1; out.push(v);} return out; }
  function parseCSV(text){
    var lines = text.replace(/\r\n?/g,'\n').split('\n'); if(!lines.length) return [];
    var head = lines.shift().split(','); var out=[];
    for(var i=0;i<lines.length;i++){ var ln=lines[i]; if(!ln.trim()) continue; var cols=ln.split(','); var obj={};
      for(var c=0;c<head.length;c++){ obj[head[c]]= (cols[c]||'').trim(); }
      out.push(obj);
    }
    return out;
  }
  function ensureDatalist(id){
    var dl = q('#'+id);
    if(!dl){ dl = document.createElement('datalist'); dl.id=id; (document.head||document.body).appendChild(dl); }
    return dl;
  }
  function fillFromEmbedded(dl, selector, keys){
    if(dl && dl.options && dl.options.length>0) return true; // already filled
    var names=[];
    qa(selector).forEach(function(el){
      for(var i=0;i<keys.length;i++){ var k=keys[i]; if(el[k]){ names.push(String(el[k])); break; } }
    });
    if(!names.length) return false;
    names = uniq(names);
    var frag = document.createDocumentFragment();
    names.forEach(function(n){ var o=document.createElement('option'); o.value=n; frag.appendChild(o); });
    dl.innerHTML=''; dl.appendChild(frag);
    return true;
  }
  function assignLists(){
    qa('#party .party-card .p_name').forEach(function(el){ el.setAttribute('list','dl_pokemon'); el.setAttribute('placeholder','ポケモン名'); });
    for(var k=1;k<=4;k++){ qa('#party .party-card .p_m'+k).forEach(function(el){ el.setAttribute('list','dl_moves'); }); }
    for(var k=1;k<=4;k++){ qa('#six_my .six-card .m'+k+'n').forEach(function(el){ el.setAttribute('list','dl_moves'); }); }
  }
  function toast(msg){
    var t=document.createElement('div');
    t.textContent=msg;
    t.style.cssText='position:fixed;left:12px;bottom:12px;background:#233357;color:#fff;border:1px solid rgba(255,255,255,.25);padding:.45rem .6rem;border-radius:8px;z-index:99999';
    document.body.appendChild(t); setTimeout(function(){ t.remove(); }, 4200);
  }

  function main(){
    var dlP = ensureDatalist('dl_pokemon');
    var dlM = ensureDatalist('dl_moves');

    // 1) 試しに既存埋め込みデータから構築（window.POKE_INLINE/MOVES_INLINE など）
    var okP = false, okM = false;
    if(window.POKE || window.POKE_INLINE){
      var arr = window.POKE || window.POKE_INLINE || [];
      okP = fillFromEmbedded(dlP, arr, ['名前','name','Name','pokemon']);
    }
    if(window.MOVES || window.MOVES_INLINE){
      var arr2 = window.MOVES || window.MOVES_INLINE || [];
      okM = fillFromEmbedded(dlM, arr2, ['技名','技','わざ','name','Name']);
    }

    // 2) datalist が空ならローカル同階層のファイルから読み込む
    function needFillP(){ return !dlP || dlP.options.length===0; }
    function needFillM(){ return !dlM || dlM.options.length===0; }
    var pFetch = Promise.resolve(), mFetch = Promise.resolve();
    if(needFillP()){
      pFetch = fetch('./pokemon_master.json').then(function(r){return r.json();}).then(function(js){
        var arr = Array.isArray(js)? js : (js.pokemon||js.data||js.list||[]);
        fillFromEmbedded(dlP, arr, ['名前','name','Name','pokemon']);
      }).catch(function(){ /* ignore */ });
    }
    if(needFillM()){
      mFetch = fetch('./moves.csv').then(function(r){return r.text();}).then(function(txt){
        var rows = parseCSV(txt);
        fillFromEmbedded(dlM, rows, ['技名','技','わざ','name','Name']);
      }).catch(function(){ /* ignore */ });
    }

    Promise.all([pFetch, mFetch]).then(function(){
      assignLists();
      if(dlP.options.length===0 || dlM.options.length===0){
        toast('候補リストが空です。ローカルで開いている場合は GitHub Pages 等から開くか、後述の手動ロードをご利用ください。');
      }
    });
  }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', main); } else { main(); }
})();