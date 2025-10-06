
/*! opp_party_local_import_v20.js
 * 目的: 6対6の相手パーティーを「ローカルのJSONファイル」から読み込んで反映
 * - ツールバーに [ローカルJSONから相手へ] のボタンを追加（accept=.json）
 * - sV/PokeDB 形式や配列形式など、よくあるキーを吸収
 */
(function(){
  function q(sel,root){ return (root||document).querySelector(sel); }
  function qa(sel,root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }

  function ensureButton(){
    var bar = q('#opp_party_loader') || q('#opp_team_picker') || q('#six_party_loader') || q('#six'); // 適切な上部バーを探す
    if(!bar || q('#opp_local_file')) return;
    var wrap = document.createElement('span');
    wrap.style.marginLeft = '.25rem';
    var input = document.createElement('input');
    input.type = 'file'; input.accept = '.json,application/json'; input.id='opp_local_file';
    input.style.display = 'none';
    var btn = document.createElement('button');
    btn.textContent = 'ローカルJSONから相手へ';
    btn.className = 'btn';
    btn.style.cssText = 'padding:.35rem .7rem;border-radius:8px;border:1px solid rgba(255,255,255,.25);background:#2c3a64;color:#fff;cursor:pointer;';
    btn.addEventListener('click', function(){ input.click(); });
    input.addEventListener('change', function(){
      var f = input.files && input.files[0]; if(!f) return;
      var fr = new FileReader();
      fr.onload = function(){
        try{
          var obj = JSON.parse(fr.result);
          var list = normalize(obj);
          if(!list || !list.length){ alert('JSONからパーティーを抽出できませんでした'); return; }
          applyOppParty(list);
        }catch(e){ alert('JSONの解析に失敗しました: '+e.message); }
      };
      fr.readAsText(f, 'utf-8');
    });
    wrap.appendChild(btn); wrap.appendChild(input);
    // insert near top
    if(bar.firstElementChild) bar.insertBefore(wrap, bar.firstElementChild.nextSibling);
    else bar.appendChild(wrap);
  }

  function normalize(obj){
    // 受け入れ形式を広めに：配列 / {party:[]} / {pokemon:[]} / {team:[]} / {teams:[{team:[]},…]}
    if(Array.isArray(obj)) return obj;
    if(obj && Array.isArray(obj.party)) return obj.party;
    if(obj && Array.isArray(obj.pokemon)) return obj.pokemon;
    if(obj && Array.isArray(obj.team)) return obj.team;
    if(obj && Array.isArray(obj.teams) && obj.teams.length && Array.isArray(obj.teams[0].team)) return obj.teams[0].team;
    return [];
  }

  function applyOppParty(list){
    var cards = qa('#six_opp .six-card');
    var policySel = q('#opp_ev_policy');
    var policy = policySel ? policySel.value : 'H252D252';
    function applyEVPolicy(card, p){
      card.dataset.evHp=card.dataset.evDef=card.dataset.evSpd=card.dataset.evAtk=card.dataset.evSpe=card.dataset.evSpA='0';
      if(p==='H252D252'){ card.dataset.evHp='252'; card.dataset.evSpd='252'; }
      else if(p==='H252B252'){ card.dataset.evHp='252'; card.dataset.evDef='252'; }
      else if(p==='C252S252'){ card.dataset.evSpA='252'; card.dataset.evSpe='252'; }
      else if(p==='A252S252'){ card.dataset.evAtk='252'; card.dataset.evSpe='252'; }
    }
    for(var i=0;i<cards.length;i++){
      var d = list[i] || {};
      var name = d.name || d.pokemon || d['名前'] || '';
      var tera = d.tera || d.terastal || d['テラスタル'] || d['テラス'] || '';
      var item = d.item || d['持ち物'] || '';
      var card = cards[i];
      var nm = card.querySelector('.name');
      if(nm){ nm.value = name; nm.dispatchEvent(new Event('input',{bubbles:true})); nm.dispatchEvent(new Event('change',{bubbles:true})); }
      card.dataset.tera = tera; card.dataset.item = item;
      applyEVPolicy(card, policy);
      var st = card.querySelector('.opp-preset-status'); if(st) st.textContent='適用: '+policy;
    }
  }

  function init(){
    ensureButton();
  }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();