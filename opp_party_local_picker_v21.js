
/*! opp_party_local_picker_v21.js
 * 6対6 相手パーティーをローカルJSONから“選んで”反映できるモーダル付きピッカー
 */
(function(){
  function q(sel,root){ return (root||document).querySelector(sel); }
  function qa(sel,root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }

  function ensureUI(){
    if(q('#opp_local_modal')) return;
    var host = q('#opp_party_loader') || q('#six');
    if(!host) return;
    // ボタン＆input
    var wrap = document.createElement('span');
    wrap.style.marginLeft = '.35rem';
    var input = document.createElement('input');
    input.type='file'; input.accept='.json,application/json'; input.id='opp_local_picker_file'; input.style.display='none';
    var btn = document.createElement('button');
    btn.className='btn'; btn.textContent='ローカルJSONから相手へ（選択）';
    btn.style.cssText='padding:.35rem .7rem;border-radius:8px;border:1px solid rgba(255,255,255,.25);background:#2c3a64;color:#fff;cursor:pointer;';
    btn.addEventListener('click', function(){ input.click(); });
    wrap.appendChild(btn); wrap.appendChild(input);
    host.appendChild(wrap);

    // モーダル
    var modal = document.createElement('div');
    modal.id='opp_local_modal';
    modal.style.cssText='display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;align-items:center;justify-content:center;';
    modal.innerHTML = '<div style="background:#101933;border:1px solid rgba(255,255,255,.15);border-radius:10px;padding:12px; width:min(820px,92vw);">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem;"><strong>相手パーティーを選択</strong>'
      + '<button id="opp_local_close" style="padding:.2rem .5rem;">×</button></div>'
      + '<div id="opp_local_list" style="max-height:320px;overflow:auto;display:flex;flex-direction:column;gap:.35rem;"></div>'
      + '<div style="display:flex;gap:.5rem;justify-content:flex-end;margin-top:.6rem;">'
      + '<button id="opp_local_apply" class="btn" style="padding:.35rem .7rem;border-radius:8px;border:1px solid rgba(255,255,255,.25);background:#243255;color:#fff;">選択を相手へ反映</button>'
      + '</div>'
      + '</div>';
    document.body.appendChild(modal);

    // 挙動
    var parsedTeams=[]; var selectedIx=-1;
    function normalize(obj){
      // 受け入れ：単一チーム（長さ6配列） or {team:[…]} or {teams:[{team:[…]},…]} など
      if(Array.isArray(obj)){
        if(obj.length && Array.isArray(obj[0])){ return obj.map(function(x){ return {team:x}; }); }
        // 6体配列なら単一チーム
        if(obj.length===6 && (typeof obj[0]==='object')) return [{team:obj}];
        // それ以外は [ {team:obj} ] 扱い
        return [{team:obj}];
      }
      if(obj && Array.isArray(obj.team)) return [{team:obj.team}];
      if(obj && Array.isArray(obj.teams)) return obj.teams.filter(function(t){ return Array.isArray(t.team); });
      if(obj && Array.isArray(obj.party)) return [{team:obj.party}];
      if(obj && Array.isArray(obj.pokemon)) return [{team:obj.pokemon}];
      return [];
    }
    function pokeName(rec){ return rec.name || rec.pokemon || rec['名前'] || ''; }
    function renderList(teams){
      var box = q('#opp_local_list'); box.innerHTML='';
      teams.forEach(function(t,ix){
        var names = (t.team||[]).map(pokeName).filter(Boolean).slice(0,6);
        var row = document.createElement('div');
        row.className='opp_row';
        row.setAttribute('data-ix', ix);
        row.style.cssText='border:1px solid rgba(255,255,255,.12);border-radius:8px;padding:.35rem .5rem;cursor:pointer;';
        row.textContent = '#'+(ix+1)+'  '+ names.slice(0,3).join(' / ') + (names.length>3? ' …' : '');
        row.addEventListener('click', function(){
          qa('#opp_local_list .opp_row').forEach(function(el){ el.style.background='transparent'; });
          row.style.background='#243255'; selectedIx=ix;
        });
        box.appendChild(row);
      });
      selectedIx = teams.length? 0 : -1;
      if(teams.length){ box.firstChild.style.background='#243255'; }
    }
    function applyEVPolicy(card, p){
      card.dataset.evHp=card.dataset.evDef=card.dataset.evSpd=card.dataset.evAtk=card.dataset.evSpe=card.dataset.evSpA='0';
      if(p==='H252D252'){ card.dataset.evHp='252'; card.dataset.evSpd='252'; }
      else if(p==='H252B252'){ card.dataset.evHp='252'; card.dataset.evDef='252'; }
      else if(p==='C252S252'){ card.dataset.evSpA='252'; card.dataset.evSpe='252'; }
      else if(p==='A252S252'){ card.dataset.evAtk='252'; card.dataset.evSpe='252'; }
    }
    function applyTeam(teamRec){
      var cards = qa('#six_opp .six-card');
      var policySel = q('#opp_ev_policy');
      var policy = policySel ? policySel.value : 'H252D252';
      var mem = teamRec.team||[];
      for(var i=0;i<cards.length;i++){
        var d = mem[i] || {};
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

    input.addEventListener('change', function(){
      var f = input.files && input.files[0]; if(!f) return;
      var fr = new FileReader();
      fr.onload = function(){
        try{
          var obj = JSON.parse(fr.result);
          parsedTeams = normalize(obj);
          if(!parsedTeams.length){ alert('パーティーを抽出できませんでした'); return; }
          renderList(parsedTeams);
          modal.style.display='flex';
        }catch(e){ alert('JSON解析に失敗しました: '+e.message); }
      };
      fr.readAsText(f, 'utf-8');
    });
    q('#opp_local_close').addEventListener('click', function(){ modal.style.display='none'; });
    q('#opp_local_apply').addEventListener('click', function(){
      if(selectedIx<0 || !parsedTeams[selectedIx]){ alert('チームを選択してください'); return; }
      applyTeam(parsedTeams[selectedIx]);
      modal.style.display='none';
    });
  }

  function init(){ ensureUI(); }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();