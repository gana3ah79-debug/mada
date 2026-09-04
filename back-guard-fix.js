/* Mada Android/browser back guard: keep the SPA mounted and close the top active layer first. */
(function(){
  const KEY='madaBackGuardV2';
  const $=id=>document.getElementById(id);
  function appVisible(){return !!$('app')&&!$('app').hidden;}
  function ensure(){if(!appVisible())return;try{if(!history.state?.[KEY]){history.replaceState({...history.state,[KEY]:true},'',location.href);history.pushState({...history.state,[KEY]:true},'',location.href);}}catch(e){}}
  function closeLayer(){
    const modal=$('modal');if(modal&&!modal.hidden){typeof window.closeModal==='function'?window.closeModal():modal.hidden=true;return true;}
    const comments=$('mada-comments-sheet');if(comments){window.madaCloseCommentsSheet?.();return true;}
    const share=$('share-modal');if(share&&!share.hidden){window.closeShareModal?.();share.hidden=true;return true;}
    const search=$('madaSearchOverlay');if(search){search.remove();return true;}
    const messenger=$('madaMessenger');if(messenger&&!messenger.hidden){window.madaMessengerClose?.();messenger.hidden=true;return true;}
    const reels=$('reelsSection');if(reels&&!reels.hidden){window.closeReelsSection?.();reels.hidden=true;return true;}
    const groups=document.querySelector('.groups-overlay');if(groups){groups.remove();return true;}
    const story=document.querySelector('.story-viewer');if(story){story.remove();return true;}
    return false;
  }
  window.addEventListener('popstate',function(){
    if(!appVisible())return;
    const closed=closeLayer();
    try{history.pushState({...history.state,[KEY]:true},'',location.href);}catch(e){}
    if(closed)setTimeout(ensure,30);
  });
  window.addEventListener('pageshow',ensure);
  document.addEventListener('DOMContentLoaded',()=>setTimeout(ensure,100));
  [500,1500,3000].forEach(ms=>setTimeout(ensure,ms));
})();
