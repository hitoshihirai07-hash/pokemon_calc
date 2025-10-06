
/*! select_datalist_guard_v35.js
 * 目的: 何らかのイベント後に select/datalist が空欄化・選択不能になる現象を自動復旧。
 * 対象: #party, #six を中心に、ポケモン名/技名の select/input[list] をスナップショット→消えたら復元。
 */
(function(){
  var snapshots = new Map();
  function snapshot(){
    var roots = [document.getElementById('party'), document.getElementById('six')];
    roots.forEach(function(root){
      if(!root) return;
      // select
      root.querySelectorAll('select').forEach(function(sel){
        var key = sel.id || sel.name || ('sel@'+(Math.random()));
        if(!snapshots.has(sel)){
          var html = sel.innerHTML;
          snapshots.set(sel, html);
        }
      });
      // datalist
      root.querySelectorAll('input[list]').forEach(function(inp){
        var listId = inp.getAttribute('list');
        if(!listId) return;
        var dl = document.getElementById(listId);
        if(!dl) return;
        if(!snapshots.has(dl)){
          snapshots.set(dl, dl.innerHTML);
        }
      });
    });
  }
  function restoreIfEmpty(){
    snapshots.forEach(function(html, el){
      if(!el || !el.parentNode) return;
      if(el.tagName==='SELECT'){
        if(!el.options || el.options.length===0){
          el.innerHTML = html;
        }
      }else if(el.tagName==='DATALIST'){
        if(!el.children || el.children.length===0){
          el.innerHTML = html;
        }
      }
    });
  }
  function init(){
    snapshot();
    // 遅延で2回ほどスナップショット更新（動的生成への追従）
    setTimeout(snapshot, 500);
    setTimeout(snapshot, 1500);
    // 監視して空になったら復元
    var mo = new MutationObserver(function(){
      restoreIfEmpty();
    });
    mo.observe(document.body, {childList:true, subtree:true});
    // フォールバック: 定期的に軽くチェック
    setInterval(restoreIfEmpty, 1200);
  }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();