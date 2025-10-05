
(function(){
'use strict';
/* v36: fallback type-badge renderer */
function renderTypeBadges(elId, t1, t2){
  var host=document.getElementById(elId); if(!host) return;
  function chip(txt){ return '<span class="tb">'+String(txt)+'</span>'; }
  var html=''; if(t1){ html+=chip(t1); } if(t2 && t2!==t1){ html+=chip(t2); }
  host.innerHTML=html;
}

function $(id){return document.getElementById(id);}
function qa(sel,root){return Array.prototype.slice.call((root||document).querySelectorAll(sel));}
function toN(v,d){var n=parseFloat(v);return isFinite(n)?n:(d||0);}
function ready(fn){if(document.readyState!=='loading'){fn();}else{document.addEventListener('DOMContentLoaded',fn,false);}}


/* === v36+ manual STAB/相性 controls (non-overlapping) === */
function injectManualMods(){
  function mkSel(id, opts, label){
    var wrap = document.createElement('label');
    wrap.textContent = label;
    var sel = document.createElement('select'); sel.id = id;
    var opt0 = document.createElement('option'); opt0.value=''; opt0.textContent='自動';
    sel.appendChild(opt0);
    opts.forEach(function(v){
      var o=document.createElement('option');o.value=String(v);o.textContent=String(v); sel.appendChild(o);
    });
    wrap.appendChild(sel);
    return wrap;
  }
  function attachRow(container, rowId){
    if(!container || document.getElementById(rowId)) return;
    var row = document.createElement('div'); row.className='line opts-row'; row.id = rowId;
    row.appendChild(mkSel(container.id==='atk_fieldset'?'atk_stab_sel':'v13_stab_sel', [1,1.5,2], 'STAB'));
    row.appendChild(mkSel(container.id==='atk_fieldset'?'atk_eff_sel':'v13_eff_sel', [0.25,0.5,1,2,4], '相性'));
    // place below .move if exists, else append
    var mv = container.querySelector('.move');
    if(mv && mv.parentNode) mv.parentNode.insertBefore(row, mv.nextSibling); else container.appendChild(row);
  }
  // ダメージ計算（通常タブ）
  var atkFs = document.querySelector('#calc fieldset'); if (atkFs) { atkFs.id='atk_fieldset'; attachRow(atkFs, 'atk_opts_row'); }
  // 1対3（攻撃側）
  var v13Fs = document.querySelector('#v13 fieldset'); if (v13Fs) { attachRow(v13Fs, 'v13_opts_row'); }
}
function readManual(id){ var el=$(id); var v = el?parseFloat(el.value):NaN; return isFinite(v)?v:NaN; }
/* === end patch === */


/* === v13: actual stat badges & updater === */
function v13EnsureBadges(){
  // make small badge creator
  function ensureAfter(inputId, badgeId, label){
    var input = $(inputId); if(!input) return null;
    if($(badgeId)) return $(badgeId);
    var sp = document.createElement('span');
    sp.id = badgeId; sp.className='badge stat';
    sp.textContent = label + ' —';
    // place after the input
    input.parentNode.appendChild(sp);
    return sp;
  }
  // attacker badges
  ensureAfter('v13_atk_ev_攻撃','v13_atk_stat_攻撃','実数値');
  ensureAfter('v13_atk_ev_特攻','v13_atk_stat_特攻','実数値');
  ensureAfter('v13_a_iv_素早','v13_atk_stat_素早','実数値');
  // targets badges
  ['1','2','3'].forEach(function(i){
    ensureAfter('v13_def'+i+'_ev_HP','v13_def'+i+'_stat_HP','実数値');
    ensureAfter('v13_def'+i+'_ev_防御','v13_def'+i+'_stat_防御','実数値');
    ensureAfter('v13_def'+i+'_ev_特防','v13_def'+i+'_stat_特防','実数値');
  });
}
function v13UpdateBadges(){
  var lv = (typeof getLV==='function')?getLV():50;
  function pokeByName(nm){
    if(!nm) return null;
    for(var i=0;i<POKE.length;i++){ if(POKE[i]['名前']===nm) return POKE[i]; }
    // fallback inline
    if(typeof POKE_INLINE!=='undefined'){ for(var j=0;j<POKE_INLINE.length;j++){ if(POKE_INLINE[j]['名前']===nm) return POKE_INLINE[j]; } }
    return null;
  }
  function val(id, def){ var el=$(id); var v = el?parseInt(el.value||'0',10):def; if(!isFinite(v)) v=def; return v; }
  function setText(id, v){ var el=$(id); if(el) el.textContent = '実数値 ' + v; }
  // attacker
  var aName = $('v13_atk_name')?$('v13_atk_name').value:'';
  var a = pokeByName(aName) || {};
  var ivAtk=31, ivSpA=31, ivSpe=val('v13_a_iv_素早',31);
  var evAtk=val('v13_atk_ev_攻撃',0), evSpA=val('v13_atk_ev_特攻',0), evSpe=0;
  var atk = a['攻撃']? calcST(a['攻撃'], ivAtk, evAtk, lv, 1):0;
  var spa = a['特攻']? calcST(a['特攻'], ivSpA, evSpA, lv, 1):0;
  var spe = a['素早']? calcST(a['素早'], ivSpe, evSpe, lv, 1):0;
  setText('v13_atk_stat_攻撃', atk||'—');
  setText('v13_atk_stat_特攻', spa||'—');
  setText('v13_atk_stat_素早', spe||'—');
  // defenders
  ['1','2','3'].forEach(function(i){
    var dName = $('v13_def'+i+'_name')?$('v13_def'+i+'_name').value:'';
    var d = pokeByName(dName) || {};
    var evHP = val('v13_def'+i+'_ev_HP',0);
    var evDF = val('v13_def'+i+'_ev_防御',0);
    var evSD = val('v13_def'+i+'_ev_特防',0);
    var hp = d['HP']? calcHP(d['HP'],31,evHP,lv):0;
    var df = d['防御']? calcST(d['防御'],31,evDF,lv,1):0;
    var sd = d['特防']? calcST(d['特防'],31,evSD,lv,1):0;
    setText('v13_def'+i+'_stat_HP', hp||'—');
    setText('v13_def'+i+'_stat_防御', df||'—');
    setText('v13_def'+i+'_stat_特防', sd||'—');
  });
}
function bindV13Actuals(){
  v13EnsureBadges();
  ['v13_atk_name','v13_atk_ev_攻撃','v13_atk_ev_特攻','v13_a_iv_素早',
   'v13_def1_name','v13_def1_ev_HP','v13_def1_ev_防御','v13_def1_ev_特防',
   'v13_def2_name','v13_def2_ev_HP','v13_def2_ev_防御','v13_def2_ev_特防',
   'v13_def3_name','v13_def3_ev_HP','v13_def3_ev_防御','v13_def3_ev_特防'
  ].forEach(function(id){ var el=$(id); if(el) el.addEventListener('input', v13UpdateBadges); });
  // also when pokemon list ensured
  if(typeof ensurePoke==='function'){ ensurePoke().then(function(){ v13UpdateBadges(); }); } else { v13UpdateBadges(); }
}
/* === end v13 stat badges === */

function bindTabs(){
  var tabs = qa('.tabs .tab');
  function show(id){
    var panels = qa('.panel');
    for(var i=0;i<panels.length;i++){ var p=panels[i]; var on = ('#'+p.id===id); if(on){p.className=p.className.replace(/\bactive\b/g,'').trim()+' active'; p.style.display='';} else {p.className=p.className.replace(/\bactive\b/g,'').trim(); p.style.display='none';} }
    for(var j=0;j<tabs.length;j++){ var t=tabs[j]; var act=(t.getAttribute('data-tab-target')===id); if(act){ t.className=t.className.replace(/\bactive\b/g,'').trim()+' active'; } else { t.className=t.className.replace(/\bactive\b/g,'').trim(); } }
    try{ history.replaceState(null,'',id); }catch(e){}
  }
  for(var i=0;i<tabs.length;i++){ (function(t){ t.addEventListener('click', function(){ var id=t.getAttribute('data-tab-target'); if(id){ show(id); }}, false); })(tabs[i]); }
  if(location.hash && $(location.hash.slice(1))){ show(location.hash); } else { show('#calc'); }
}

/* fixed 20:00 timer */
function bindTimer(){
  var disp=$('tm_disp'); var remain=20*60; var running=false; var last=0;
  function fmt(s){ s=Math.max(0,Math.floor(s)); var m=('0'+Math.floor(s/60)).slice(-2); var ss=('0'+(s%60)).slice(-2); return m+':'+ss; }
  function render(){ if(disp){ disp.textContent=fmt(remain);} }
  function tick(){ if(!running) return; var now=Date.now(); var dt=(now-last)/1000; last=now; remain-=dt; if(remain<=0){ remain=0; running=false; } render(); if(running) setTimeout(tick,200); }
  function start(){ if(running) return; if(remain<=0) remain=20*60; running=true; last=Date.now(); setTimeout(tick,200); }
  function pause(){ running=false; }
  function reset(){ running=false; remain=20*60; render(); }
  var s=$('tm_start'), p=$('tm_pause'), r=$('tm_reset'); if(s) s.addEventListener('click', start,false); if(p) p.addEventListener('click', pause,false); if(r) r.addEventListener('click', reset,false);
  render();
}

/* data (external fallback to inline) */
var POKE=[], MOVES=[], IDX_MOVE={};
var POKE_INLINE = [{"No": 25, "名前": "ピカチュウ", "HP": 35, "攻撃": 55, "防御": 40, "特攻": 50, "特防": 50, "素早": 90, "type1": "でんき"}, {"No": 6, "名前": "リザードン", "HP": 78, "攻撃": 84, "防御": 78, "特攻": 109, "特防": 85, "素早": 100, "type1": "ほのお", "type2": "ひこう"}, {"No": 149, "名前": "カイリュー", "HP": 91, "攻撃": 134, "防御": 95, "特攻": 100, "特防": 100, "素早": 80, "type1": "ドラゴン", "type2": "ひこう"}];
var MOVES_INLINE = [{"name": "10まんボルト", "type": "でんき", "category": "特殊", "power": 90}, {"name": "かみなり", "type": "でんき", "category": "特殊", "power": 110}, {"name": "フレアドライブ", "type": "ほのお", "category": "物理", "power": 120}, {"name": "げきりん", "type": "ドラゴン", "category": "物理", "power": 120}, {"name": "りゅうせいぐん", "type": "ドラゴン", "category": "特殊", "power": 130}, {"name": "なみのり", "type": "みず", "category": "特殊", "power": 90}, {"name": "じしん", "type": "じめん", "category": "物理", "power": 100}, {"name": "ねこだまし", "type": "ノーマル", "category": "物理", "power": 40}];

function ensurePoke(){
  if(POKE.length) return Promise.resolve(POKE);
  return fetch('pokemon_master.json',{cache:'no-store'}).then(function(r){ if(!r.ok) throw 0; return r.json(); }).then(function(j){ POKE=Array.isArray(j)?j:[]; return POKE; }).catch(function(){ POKE=POKE_INLINE; return POKE; });
}
function ensureMoves(){
  if(MOVES.length) return Promise.resolve(MOVES);
  return fetch('moves.csv',{cache:'no-store'}).then(function(r){ if(!r.ok) throw 0; return r.text(); }).then(function(t){
    var lines=t.replace(/\r/g,'').split('\n'); var head=(lines[0]||'').split(',');
    function idx(key){ var i=head.indexOf(key); if(i>=0) return i; var alt={'name':['技','わざ'],'type':['タイプ'],'category':['分類','cat'],'power':['威力']}; var arr=alt[key]||[]; for(var k=0;k<arr.length;k++){ var j=head.indexOf(arr[k]); if(j>=0) return j; } return -1; }
    var iname=idx('name'), itype=idx('type'), icat=idx('category'), ipow=idx('power');
    MOVES=[]; IDX_MOVE={};
    for(var i=1;i<lines.length;i++){ var row=lines[i]; if(!row) continue; var a=row.split(','); var nm=(iname>=0?a[iname]:a[0])||''; if(!nm) continue; var mv={name:nm, type:(itype>=0?a[itype]:''), category:(icat>=0?a[icat]:''), power:(ipow>=0 && a[ipow]!==''?+a[ipow]:'')}; MOVES.push(mv); IDX_MOVE[String(nm).trim().toLowerCase()]=mv; }
    if(!MOVES.length) throw 0;
    return MOVES;
  }).catch(function(){ MOVES=MOVES_INLINE; IDX_MOVE={}; for(var i=0;i<MOVES.length;i++){ var m=MOVES[i]; IDX_MOVE[String(m.name).trim().toLowerCase()]=m; } return MOVES; });
}
function buildLists(){
  var dlp=$('dl_poke'); var dlm=$('dl_move'); if(!dlp||!dlm) return;
  var htmlP=[], htmlM=[], seen={};
  for(var i=0;i<POKE.length;i++){ var p=POKE[i]; var val=String(p.名前||p.name||p.No).replace(/"/g,'&quot;'); htmlP.push('<option value="'+val+'"></option>'); }
  for(var j=0;j<MOVES.length;j++){ var m=MOVES[j]; if(seen[m.name]) continue; seen[m.name]=1; var v=String(m.name).replace(/"/g,'&quot;'); htmlM.push('<option value="'+v+'"></option>'); }
  dlp.innerHTML=htmlP.join(''); dlm.innerHTML=htmlM.join('');
  // builds datalist
  var dlb=$('dl_build_names'); if(dlb){ dlb.innerHTML = htmlP.join(''); }
}

/* helper/math */
var KEYS=['HP','攻撃','防御','特攻','特防','素早'];
function bs(mon,k){ if(!mon) return 50; if(mon[k]!=null) return +mon[k]; var map={'HP':'hp','攻撃':'atk','防御':'def','特攻':'spa','特防':'spd','素早':'spe'}; var kk=map[k]; if(kk&&mon[kk]!=null) return +mon[kk]; return 50; }
function calcHP(b,iv,ev,lv){ return Math.floor(((b*2+iv+Math.floor(ev/4))*lv)/100)+lv+10; }
function calcST(b,iv,ev,lv,m){ var v=Math.floor(((b*2+iv+Math.floor(ev/4))*lv)/100)+5; if(m&&m!==1) v=Math.floor(v*m); return v; }
function findMon(name){ name=String(name||'').trim(); for(var i=0;i<POKE.length;i++){ var p=POKE[i]; if(!p) continue; if(p.名前===name||p.name===name||String(p.No)===name) return p; } return null; }
function stageMult(s){ s=parseInt(s||0,10); if(isNaN(s)) s=0; if(s>=0){ return (2+s)/2; } return 2/(2-s); }
var TYPE_CHART = {"ノーマル": {"いわ": 0.5, "はがね": 0.5, "ゴースト": 0}, "ほのお": {"くさ": 2, "こおり": 2, "むし": 2, "はがね": 2, "ほのお": 0.5, "みず": 0.5, "いわ": 0.5, "ドラゴン": 0.5}, "みず": {"ほのお": 2, "じめん": 2, "いわ": 2, "みず": 0.5, "くさ": 0.5, "ドラゴン": 0.5}, "でんき": {"みず": 2, "ひこう": 2, "でんき": 0.5, "くさ": 0.5, "ドラゴン": 0.5, "じめん": 0}, "くさ": {"みず": 2, "じめん": 2, "いわ": 2, "ほのお": 0.5, "くさ": 0.5, "どく": 0.5, "ひこう": 0.5, "むし": 0.5, "ドラゴン": 0.5, "はがね": 0.5}, "こおり": {"くさ": 2, "じめん": 2, "ひこう": 2, "ドラゴン": 2, "ほのお": 0.5, "みず": 0.5, "こおり": 0.5, "はがね": 0.5}, "かくとう": {"ノーマル": 2, "こおり": 2, "いわ": 2, "あく": 2, "はがね": 2, "どく": 0.5, "ひこう": 0.5, "エスパー": 0.5, "むし": 0.5, "フェアリー": 0.5, "ゴースト": 0}, "どく": {"くさ": 2, "フェアリー": 2, "どく": 0.5, "じめん": 0.5, "いわ": 0.5, "ゴースト": 0.5, "はがね": 0}, "じめん": {"ほのお": 2, "でんき": 2, "どく": 2, "いわ": 2, "はがね": 2, "くさ": 0.5, "むし": 0.5, "ひこう": 0}, "ひこう": {"くさ": 2, "かくとう": 2, "むし": 2, "でんき": 0.5, "いわ": 0.5, "はがね": 0.5}, "エスパー": {"かくとう": 2, "どく": 2, "エスパー": 0.5, "はがね": 0.5, "あく": 0}, "むし": {"くさ": 2, "エスパー": 2, "あく": 2, "ほのお": 0.5, "かくとう": 0.5, "どく": 0.5, "ひこう": 0.5, "ゴースト": 0.5, "はがね": 0.5, "フェアリー": 0.5}, "いわ": {"ほのお": 2, "こおり": 2, "ひこう": 2, "むし": 2, "かくとう": 0.5, "じめん": 0.5, "はがね": 0.5}, "ゴースト": {"エスパー": 2, "ゴースト": 2, "あく": 0.5, "ノーマル": 0}, "ドラゴン": {"ドラゴン": 2, "はがね": 0.5, "フェアリー": 0}, "あく": {"エスパー": 2, "ゴースト": 2, "かくとう": 0.5, "あく": 0.5, "フェアリー": 0.5}, "はがね": {"こおり": 2, "いわ": 2, "フェアリー": 2, "ほのお": 0.5, "みず": 0.5, "でんき": 0.5, "はがね": 0.5}, "フェアリー": {"かくとう": 2, "ドラゴン": 2, "あく": 2, "ほのお": 0.5, "どく": 0.5, "はがね": 0.5}};
function normType(t){ if(!t) return ''; t=String(t).trim(); var map={'ノ':'ノーマル','炎':'ほのお','火':'ほのお','水':'みず','雷':'でんき','電':'でんき','草':'くさ','氷':'こおり','闘':'かくとう','格闘':'かくとう','毒':'どく','地':'じめん','飛':'ひこう','超':'エスパー','虫':'むし','岩':'いわ','霊':'ゴースト','竜':'ドラゴン','悪':'あく','鋼':'はがね','妖':'フェアリー'}; if(map[t]) return map[t]; return t; }
function typeEff(moveType, t1, t2){ moveType=normType(moveType); t1=normType(t1); t2=normType(t2); var eff=1.0, row=TYPE_CHART[moveType]||{}; if(t1 && row[t1]!=null){ eff*=row[t1]; } if(t2 && t2!==t1 && row[t2]!=null){ eff*=row[t2]; } return eff; }

/* 252ボタン */
function bindEV252(){
  document.addEventListener('focusin', function(e){
    var t=e.target; if(!(t&&t.tagName==='INPUT')) return;
    if(!/_ev_/.test(t.id)) return; if(t.getAttribute('data-evbtn')) return;
    t.setAttribute('data-evbtn','1'); var b=document.createElement('button'); b.type='button'; b.className='ev252btn'; b.textContent='252';
    b.addEventListener('click', function(){ t.value='252'; try{ t.dispatchEvent(new Event('input',{bubbles:true})); t.dispatchEvent(new Event('change',{bubbles:true})); }catch(err){} }, false);
    t.parentNode.insertBefore(b, t.nextSibling);
  }, false);
}

/* Moves autofill */
function bindMovesAutofill(){
  function on(e){
    var t=e.target; if(!(t&&t.tagName==='INPUT')) return;
    if(t.id.indexOf('move_name')===-1) return;
    var mv = IDX_MOVE[String((t.value||'')).trim().toLowerCase()]; 
    var scope = t.closest ? (t.closest('fieldset')||document) : document;
    var pw = scope.querySelector('[id$="move_power"]'); if(pw && mv && (mv.power!=='' && mv.power!=null)) pw.value = mv.power;
    var ct = scope.querySelector('[id$="move_cat"]');
    if(ct && mv && mv.category){
      if(ct.tagName==='SELECT'){ var opts=ct.options; for(var i=0;i<opts.length;i++){ var o=opts[i]; if(o.value===mv.category || o.text===mv.category){ ct.value=o.value; break; } } } else { ct.value = mv.category; }
    }
    applyMoveTypeBehavior(scope, mv);
  }
  document.addEventListener('change', on, true);
  document.addEventListener('blur', on, true);
  document.addEventListener('input', function(e){ if(e.target && /move_name/.test(e.target.id)) on(e); }, true);
}

/* reflect stats + types */
function reflect(side){
  var nameEl=$(side+'_name'), lvEl=$(side+'_lv'); var lv=toN(lvEl&&lvEl.value,50); var mon=findMon(nameEl&&nameEl.value);
  var t1=$(side==='atk'?'atk_t1':'def_t1'); var t2=$(side==='atk'?'atk_t2':'def_t2');
  if(mon){ if(t1&&!t1.value&&(mon.type1||mon.タイプ1)) t1.value = mon.type1||mon.タイプ1; if(t2&&!t2.value&&(mon.type2||mon.タイプ2)) t2.value = mon.type2||mon.タイプ2; }
  renderTypeBadges(side==='atk'?'atk_types':'def_types', (t1?t1.value:''), (t2?t2.value:''));
  for(var i=0;i<KEYS.length;i++){ var k=KEYS[i]; var base=$(side+'_base_'+k); if(base) base.textContent=bs(mon,k);
    if(k==='HP'){ var fin=$(side+'_fin_HP'); var iv=$(side==='atk'?'a_iv_HP':'d_iv_HP'); var ev=$(side+'_ev_HP'); if(fin&&base) fin.textContent=calcHP(toN(base.textContent,50), toN(iv&&iv.value,31), toN(ev&&ev.value,0), lv); }
    else{ var fin2=$(side+'_fin_'+k); var iv2=$(side==='atk'?'a_iv_'+k:'d_iv_'+k); var ev2=$(side+'_ev_'+k); var mul=$(side+'_mul_'+k); if(fin2&&base) fin2.textContent=calcST(toN(base.textContent,50), toN(iv2&&iv2.value,31), toN(ev2&&ev2.value,0), lv, toN(mul&&mul.value,1)); }
  }
}
function bindReflect(){
  var sides=['atk','def'];
  for(var s=0;s<sides.length;s++){
    (function(side){
      var n=$(side+'_name'); if(n){ ['input','change','blur'].forEach(function(ev){ n.addEventListener(ev,function(){ reflect(side); }, false); }); }
      var lv=$(side+'_lv'); if(lv){ ['input','change'].forEach(function(ev){ lv.addEventListener(ev,function(){ reflect(side); }, false); }); }
      for(var i=0;i<KEYS.length;i++){
        var k=KEYS[i];
        if(k==='HP'){ var iv=$(side==='atk'?'a_iv_HP':'d_iv_HP'); var ev=$(side+'_ev_HP'); [iv,ev].forEach(function(x){ if(x){ ['input','change'].forEach(function(ev){ x.addEventListener(ev,function(){ reflect(side); }, false); }); } }); }
        else{ var iv2=$(side==='atk'?'a_iv_'+k:'d_iv_'+k); var ev2=$(side+'_ev_'+k); var mul=$(side+'_mul_'+k); [iv2,ev2,mul].forEach(function(x){ if(x){ ['input','change'].forEach(function(ev){ x.addEventListener(ev,function(){ reflect(side); }, false); }); } }); }
      }
    })(sides[s]);
  }
}

/* clear all + IV toggle + speed IV shortcuts */
function clearAll(){
  var ids=qa('input,select');
  for(var i=0;i<ids.length;i++){
    var el=ids[i];
    if(el.id.indexOf('_lv')>-1) el.value = '50';
    else if(/_ev_/.test(el.id)) el.value='0';
    else if(/_iv_/.test(el.id)) el.value=(/_素早$/.test(el.id)?'31':'31');
    else if(el.tagName==='SELECT') el.value = (el.options[0]?el.options[0].value:el.value);
    else if(el.type==='file'){ el.value=''; }
    else if(el.type==='number'){} else { el.value=''; }
  }
  var muls=qa('select[id*="_mul_"]'); for(var j=0;j<muls.length;j++){ muls[j].value='1'; }
  var outs=qa('output'); for(var k=0;k<outs.length;k++){ outs[k].value='—'; outs[k].textContent='—'; }
  reflect('atk'); reflect('def');
}
function bindClearAll(){ var b=$('btn_clear_all'); if(b) b.addEventListener('click', clearAll, false); }
function bindIVToggle(){
  if(document.body.className.indexOf('iv-compact')===-1){ document.body.className+=(document.body.className?' ':'')+'iv-compact'; }
  var btn=$('btn_iv_toggle'); if(!btn) return;
  btn.addEventListener('click', function(){ if(/\biv-compact\b/.test(document.body.className)){ document.body.className=document.body.className.replace(/\biv-compact\b/g,'').trim(); } else { document.body.className+=(document.body.className?' ':'')+'iv-compact'; } }, false);
}
function quickSpeedIV(){
  function attach(id){
    var el=$(id); if(!el) return; if(el.getAttribute('data-ivq')) return; el.setAttribute('data-ivq','1');
    var b0=document.createElement('button'); b0.type='button'; b0.className='ev252btn'; b0.textContent='最遅(0)';
    var b31=document.createElement('button'); b31.type='button'; b31.className='ev252btn'; b31.textContent='最大(31)';
    b0.addEventListener('click', function(){ el.value='0'; try{ el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); }catch(e){} }, false);
    b31.addEventListener('click', function(){ el.value='31'; try{ el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); }catch(e){} }, false);
    el.parentNode.appendChild(b0); el.parentNode.appendChild(b31);
  }
  attach('a_iv_素早'); attach('d_iv_素早'); attach('v13_a_iv_素早');
}

/* damage calc with STAB/type/rank/other */
function simpleDamage(){
  var cat=$('atk_move_cat')?$('atk_move_cat').value:'物理';
  var pwr=toN($('atk_move_power')?$('atk_move_power').value:0,0);
  var lvl=toN($('atk_lv')?$('atk_lv').value:50,50);
  var mvn=$('atk_move_name')?$('atk_move_name').value:''; var mv=IDX_MOVE[String((mvn||'')).trim().toLowerCase()]; var mt=(mv&&mv.type)?mv.type:'';
  var atk_t1=$('atk_t1')?$('atk_t1').value:''; var atk_t2=$('atk_t2')?$('atk_t2').value:'';
  var def_t1=$('def_t1')?$('def_t1').value:''; var def_t2=$('def_t2')?$('def_t2').value:'';
  var rkA=parseInt($('atk_rank')?$('atk_rank').value:0,10);
  var rkD=parseInt($('def_rank')?$('def_rank').value:0,10);
  var other=toN($('other_mod')?$('other_mod').value:1,1);
  var A=(cat==='物理')?toN($('atk_fin_攻撃')?$('atk_fin_攻撃').textContent:0,0):toN($('atk_fin_特攻')?$('atk_fin_特攻').textContent:0,0);
  var D=(cat==='物理')?toN($('def_fin_防御')?$('def_fin_防御').textContent:0,0):toN($('def_fin_特防')?$('def_fin_特防').textContent:0,0);
  A=Math.floor(A*stageMult(rkA)); D=Math.floor(D*stageMult(-rkD));
  if(!pwr||!A||!D){ if($('out_damage')) $('out_damage').value='—'; return; }
  var base = Math.floor(Math.floor((2*lvl)/5+2)*pwr*A/D/50)+2;
  var stab = (isFinite(readManual('atk_stab_sel'))?readManual('atk_stab_sel'):((normType(mt)===normType(atk_t1) || normType(mt)===normType(atk_t2))?1.5:1.0)); var eff = (isFinite(readManual('atk_eff_sel'))?readManual('atk_eff_sel'):(typeEff(mt, def_t1, def_t2))); var mod = stab * eff * other;
  var min = Math.floor(base*0.85*mod), max = Math.floor(base*mod);
  $('out_damage').value = min+' 〜 '+max+' （STAB:'+stab.toFixed(2)+' 相性:'+eff.toFixed(2)+'）';
}
function bindCalc(){ var b=$('btn_calc'); if(b) b.addEventListener('click', simpleDamage, false); }

/* 1v3 */
function simpleDamageOne(i){
  var cat=$('v13_move_cat')?$('v13_move_cat').value:'物理';
  var pwr=toN($('v13_move_power')?$('v13_move_power').value:0,0);
  var lvl=50;
  var atk=findMon($('v13_atk_name')?$('v13_atk_name').value:''), deff=findMon($('v13_def'+i+'_name')?$('v13_def'+i+'_name').value:'');
  function fin(mon, key, ev, mul){ if(!mon) return 0; var b=bs(mon,key); if(key==='HP') return calcHP(b,31,toN(ev,0),lvl); return calcST(b,31,toN(ev,0),lvl,toN(mul,1)); }
  var A = (cat==='物理') ? fin(atk,'攻撃',$('v13_atk_ev_攻撃')?$('v13_atk_ev_攻撃').value:0,1) : fin(atk,'特攻',$('v13_atk_ev_特攻')?$('v13_atk_ev_特攻').value:0,1);
  var D = (cat==='物理') ? fin(deff,'防御',$('v13_def'+i+'_ev_防御')?$('v13_def'+i+'_ev_防御').value:0,1) : fin(deff,'特防',$('v13_def'+i+'_ev_特防')?$('v13_def'+i+'_ev_特防').value:0,1);
  // ranks and other
  var rkA=parseInt($('v13_atk_rank')?$('v13_atk_rank').value:0,10);
  var rkD=parseInt($('v13_def_rank')?$('v13_def_rank').value:0,10);
  var other=toN($('v13_other_mod')?$('v13_other_mod').value:1,1);
  A=Math.floor(A*stageMult(rkA)); D=Math.floor(D*stageMult(-rkD));
  var mvn=$('v13_move_name')?$('v13_move_name').value:''; var mv=IDX_MOVE[String((mvn||'')).trim().toLowerCase()]; var mt=(mv&&mv.type)?mv.type:'';
  var atk_t1=(atk&&(atk.type1||atk.タイプ1))||''; var atk_t2=(atk&&(atk.type2||atk.タイプ2))||'';
  var t1=(deff&&(deff.type1||deff.タイプ1))||''; var t2=(deff&&(deff.type2||deff.タイプ2))||'';
  var base = (pwr && A && D) ? (Math.floor(Math.floor((2*lvl)/5+2)*pwr*A/D/50)+2) : 0;
  var stab = (isFinite(readManual('v13_stab_sel'))?readManual('v13_stab_sel'):((normType(mt)===normType(atk_t1) || normType(mt)===normType(atk_t2))?1.5:1.0)); var eff = (isFinite(readManual('v13_eff_sel'))?readManual('v13_eff_sel'):(typeEff(mt, t1, t2))); var mod = stab * eff * other;
  var min=Math.floor(base*0.85*mod), max=Math.floor(base*mod);
  var out=$('v13_out'+i); if(out) out.value=(base?(min+' 〜 '+max+'（STAB:'+stab.toFixed(2)+' 相性:'+eff.toFixed(2)+'）'):'—');
}
function bindV13(){ var b=$('v13_calc'); if(b) b.addEventListener('click', function(){ for(var i=1;i<=3;i++) simpleDamageOne(i); }, false); }
function bindV13TypeFill(){
  function att(id){
    var el=$(id); if(!el) return;
    el.addEventListener('change', function(){
      var m=findMon(el.value)||{};
      var suf=id.match(/def(\d+)_name/); if(suf){ var i=suf[1]; renderTypeBadges('v13_def'+i+'_types', (m.type1||m.タイプ1||''), (m.type2||m.タイプ2||'')); }
    }, false);
  }
  att('v13_def1_name'); att('v13_def2_name'); att('v13_def3_name');
  var a=$('v13_atk_name'); if(a){ a.addEventListener('change', function(){ var m=findMon(a.value)||{}; renderTypeBadges('v13_atk_types', (m.type1||m.タイプ1||''), (m.type2||m.タイプ2||'')); }, false); }
}

/* Builds */
function normalizeBuild(o){
  if(!o || typeof o!=='object') return null;
  function pick(keys){ for(var i=0;i<keys.length;i++){ var k=keys[i]; if(o[k]!=null && o[k]!== '') return o[k]; } return ''; }
  var mon = pick(['pokemon','ポケモン','name','名前','species','種族','poke','mon']);
  var item = pick(['item','持ち物','どうぐ','道具']);
  var tera = pick(['tera','teraType','teratype','terastyle','テラスタイプ','テラ','テラス']);
  var note = pick(['body','本文','description','備考','メモ','memo','comment']);
  var title = pick(['title','タイトル']);
  return {pokemon: String(mon||'').trim(), item: String(item||'').trim(), tera: String(tera||'').trim(), title: String(title||'').trim(), note: String(note||'').trim()};
}
function bindBuilds(){
  var file=$('builds_file'), q=$('builds_query'), list=$('builds_list'); var cards=[];
  function render(){
    var t=(q&&q.value?q.value:'').trim().toLowerCase(); var out=[];
    for(var i=0;i<cards.length;i++){
      var c=cards[i];
      // text for filter
      var text=c.title+' '+c.list.map(function(x){return x.pokemon+' '+x.item+' '+x.tera;}).join(' ');
      if(t && text.toLowerCase().indexOf(t)<0) continue;
      var h='<div class="card"><div><strong>'+c.title+'</strong></div><div class="team">';
      for(var j=0;j<c.list.length;j++){
        var m=c.list[j];
        h+='<div class="mon"><div class="head"><span>'+ (m.pokemon||'-') +'</span><span>'+ (m.item||'') +'</span></div>';
        if(m.tera) h+='<div class="sub">テラ: '+m.tera+'</div>';
        h+='<div class="type-badges">'+ (m.t1?('<span class="tb">'+m.t1+'</span>'):'') + (m.t2&&m.t2!==m.t1?(' <span class="tb">'+m.t2+'</span>'):'') +'</div></div>';
      }
      h+='</div></div>';
      out.push(h);
    }
    if(list) list.innerHTML = out.join('') || '<div class="card">表示できるデータがありません</div>';
  }
  if(file) file.addEventListener('change', function(){
    var f=file.files[0]; if(!f) return;
    var rd=new FileReader();
    rd.onload=function(){
      try{
        var j=JSON.parse(rd.result);
        var arrCards=[];
        if(isPokeDBOpenData(j)){ arrCards = parsePokeDBOpenData(j); }
        else {
          // Fallback to previous flexible format
          var arr = Array.isArray(j)?j:[j];
          for(var i=0;i<arr.length;i++){
            var n=normalizeBuild(arr[i]); if(n) arrCards.push({title:(n.title||n.pokemon||'記事'), list:[{pokemon:n.pokemon, item:n.item, tera:n.tera, t1:'', t2:''}]});
          }
        }
        cards = arrCards; render();
      }catch(e){ if(list) list.innerHTML='<div class="card">JSON解析に失敗しました</div>'; }
    };
    rd.readAsText(f,'utf-8');
  }, false);
  if(q) q.addEventListener('input', render, false);
}

/* v35: restore bindTypeBadgesRealtime */
function bindTypeBadgesRealtime(){
  var pairs=[
    ['atk_name','atk_types','atk_t1','atk_t2'],
    ['def_name','def_types','def_t1','def_t2'],
    ['v13_atk_name','v13_atk_types', null, null]
  ];
  function renderFrom(nameId, badgeId, t1Id, t2Id){
    var name=document.getElementById(nameId);
    var t1=t1Id?document.getElementById(t1Id):null;
    var t2=t2Id?document.getElementById(t2Id):null;
    function calc(){
      var mon=findMon(name && name.value);
      var a1=t1&&(t1.value)?t1.value:(mon?(mon.type1||mon.タイプ1||''):'');
      var a2=t2&&(t2.value)?t2.value:(mon?(mon.type2||mon.タイプ2||''):'');
      renderTypeBadges(badgeId, a1, a2);
    }
    if(name){ ['input','change','blur'].forEach(function(ev){ name.addEventListener(ev, calc, false);}); }
    if(t1){ ['input','change'].forEach(function(ev){ t1.addEventListener(ev, calc, false);}); }
    if(t2){ ['input','change'].forEach(function(ev){ t2.addEventListener(ev, calc, false);}); }
    calc();
  }
  for(var i=0;i<pairs.length;i++){ renderFrom.apply(null, pairs[i]); }

  // Targets (v13) — update badges on name change
  ['v13_def1_name','v13_def2_name','v13_def3_name'].forEach(function(id){
    var el=document.getElementById(id);
    if(!el) return;
    el.addEventListener('change', function(){
      var m=findMon(el.value)||{};
      var suf=id.match(/def(\d+)_name/); if(suf){
        var i=suf[1]; renderTypeBadges('v13_def'+i+'_types', (m.type1||m.タイプ1||''), (m.type2||m.タイプ2||''));
      }
    }, false);
  });
}

/* boot */
ready(function(){ bindV13Actuals();  injectManualMods(); 
  bindTabs(); bindTimer(); bindEV252(); bindMovesAutofill(); bindCalc(); bindV13(); bindV13TypeFill(); bindBuilds(); bindReflect(); bindTypeBadgesRealtime(); bindClearAll(); bindIVToggle(); quickSpeedIV();
  Promise.all([ensurePoke(), ensureMoves()]).then(function(){ buildLists(); reflect('atk'); reflect('def'); }).catch(function(){ buildLists(); reflect('atk'); reflect('def'); });
});
})();

/* v30: stronger PokeDB parser */
function isPokeDBOpenData(j){
  if(!j) return false;
  if(Array.isArray(j)){
    // array of team entries
    if(j.length && (j[0].team || j[0].Team || j[0].teams)) return true;
    // array of {teams:[...]} blocks
    for(var i=0;i<j.length;i++){ if(j[i] && (j[i].teams || j[i].Team)) return true; }
    return false;
  }
  if(typeof j==='object'){
    if(Array.isArray(j.teams) || Array.isArray(j.data)) return true;
  }
  return false;
}
function parsePokeDBOpenData(j){
  var res=[];
  function pushCard(t){
    var teamArr = t.team || t.Team || t.teams || t.Teams || [];
    if(Array.isArray(teamArr) && teamArr.length && teamArr[0] && !teamArr[0].pokemon && Array.isArray(teamArr[0].team)){
      // nested {teams:[{team:[...]}, ...]}
      for(var x=0;x<teamArr.length;x++){ pushCard(teamArr[x]); }
      return;
    }
    var title='チーム';
    if(t.rank!=null || t.rating_value!=null){ title='順位: '+(t.rank!=null?t.rank:'-')+' / レート: '+(t.rating_value!=null?t.rating_value:'-'); }
    var card={title:title, list:[]};
    for(var k=0;k<teamArr.length;k++){
      var m = teamArr[k]||{};
      var mon = String(m.pokemon || m.name || m.ポケモン || '').trim();
      var item = String(m.item || m.どうぐ || m.持ち物 || '').trim();
      var tera = String(m.terastal || m.tera || m.テラスタイプ || '').trim();
      var t1 = String(m.type1 || m.タイプ1 || '').trim();
      var t2 = String(m.type2 || m.タイプ2 || '').trim();
      if(mon || item || tera){ card.list.push({pokemon:mon, item:item, tera:tera, t1:t1, t2:t2}); }
    }
    if(card.list.length) res.push(card);
  }
  if(Array.isArray(j)){
    for(var i=0;i<j.length;i++){ pushCard(j[i]||{}); }
  }else if(j && (j.teams||j.data)){
    var arr = j.teams || j.data || []; for(var i2=0;i2<arr.length;i2++){ pushCard(arr[i2]||{}); }
  }
  return res;
}

/* v34: move type auto-change; Tera Blast manual type */
function isTeraBlastName(n){
  n = String(n||'').trim().toLowerCase();
  return n==='テラバースト' || n==='teraburst' || n==='tera blast' || n==='tera-blast' || n==='tera blast' || n.indexOf('テラバ')===0;
}
function applyMoveTypeBehavior(scope, mv){
  var tp = scope.querySelector('[id$="move_type"]');
  if(!tp) return;
  if(mv && mv.type && !isTeraBlastName(mv.name)){
    tp.value = mv.type;
    tp.readOnly = true;
    tp.title = '技タイプ（自動）';
  }else if(mv && isTeraBlastName(mv.name)){
    // let user choose tera type
    tp.readOnly = false;
    if(!tp.getAttribute('list')) tp.setAttribute('list','dl_type');
    if(!tp.value){ tp.placeholder='テラバースト: タイプを選択'; }
    tp.title = 'テラバースト用にタイプを選択';
  }else{
    tp.readOnly = false;
    tp.title = '';
  }
}
