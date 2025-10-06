
/* party_autocomplete_hotfix_v19.js
 * - 修正: パーティータブの「list="dl_pokemon"」が文字として表示される不具合
 * - 対策: 正しい <input.p_name list="dl_pokemon"> を挿入し、不要なテキストノードを除去
 * - 併せて .p_m1..p_m4 / 6対6自分側の m1n..m4n に list="dl_moves" を強制付与
 * - 既存の datalist (dl_pokemon, dl_moves) はそのまま利用
 */
(function(){
  function q(sel,root){ return (root||document).querySelector(sel); }
  function qa(sel,root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }

  function ensureDatalistIds(){
    // もし存在しない場合は空の datalist を作る（候補は既存を前提）
    if(!q('#dl_pokemon')){
      var dl = document.createElement('datalist'); dl.id='dl_pokemon'; document.head.appendChild(dl);
    }
    if(!q('#dl_moves')){
      var dl2 = document.createElement('datalist'); dl2.id='dl_moves'; document.head.appendChild(dl2);
    }
  }
  function fixPartyNameRows(){
    qa('#party .party-card').forEach(function(card){
      var head = card.firstElementChild;
      if(!head || head.tagName!=='DIV') return;
      // 探索: 検索ボタン
      var searchBtn = head.querySelector('.p_search');
      // すでに正しい .p_name があれば attributes を整えて終了
      var nameInput = head.querySelector('.p_name');
      if(nameInput){
        if(!nameInput.getAttribute('list')) nameInput.setAttribute('list','dl_pokemon');
        nameInput.setAttribute('placeholder','ポケモン名');
        return;
      }
      // 挿入位置を決める: strong の後〜検索ボタンの直前に input を差し込む
      var input = document.createElement('input');
      input.className = 'p_name';
      input.setAttribute('list','dl_pokemon');
      input.setAttribute('placeholder','ポケモン名');
      input.setAttribute('style','flex:1;background:#1f2947;color:#fff;border:1px solid rgba(122,162,255,.55);border-radius:8px;padding:.3rem .5rem;');
      if(searchBtn){
        head.insertBefore(input, searchBtn);
      }else{
        head.appendChild(input);
      }
      // strong 直後に紛れ込んだテキストノード（list="dl_pokemon" など）を掃除
      var strongEl = head.querySelector('strong');
      if(strongEl){
        var n = strongEl.nextSibling;
        while(n && n !== input){
          var next = n.nextSibling;
          if(n.nodeType === Node.TEXT_NODE || (n.nodeType===Node.ELEMENT_NODE && n.tagName==='SPAN' && n.textContent.indexOf('list=')>=0)){
            head.removeChild(n);
          }
          n = next;
        }
      }
    });
  }
  function enforceListAttributes(){
    qa('#party .party-card .p_name').forEach(function(el){ if(!el.getAttribute('list')) el.setAttribute('list','dl_pokemon'); });
    for(var k=1;k<=4;k++){
      qa('#party .party-card .p_m'+k).forEach(function(el){ if(!el.getAttribute('list')) el.setAttribute('list','dl_moves'); });
    }
    for(var k=1;k<=4;k++){
      qa('#six_my .six-card .m'+k+'n').forEach(function(el){ if(!el.getAttribute('list')) el.setAttribute('list','dl_moves'); });
    }
  }

  function run(){
    ensureDatalistIds();
    fixPartyNameRows();
    enforceListAttributes();
  }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', run); } else { run(); }

  // 6体フォームを再生成する実装の場合もあるので、クリック操作でたまに再適用
  document.addEventListener('click', function(e){
    var t = e.target;
    if(t && (t.id==='party_new' || t.classList.contains('p_search'))){
      setTimeout(run, 0);
    }
  }, true);
})();