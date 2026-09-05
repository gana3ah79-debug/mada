(function(){'use strict';
function q(id){return document.getElementById(id)}
function call(name){try{var fn=window[name];if(typeof fn==='function'){return fn.apply(window,[].slice.call(arguments,1))}}catch(e){console.warn('Mada action',name,e)} }
function bind(){
  var app=q('app'); if(!app||app.hidden)return;
  // Never allow a stale loading state to block the UI.
  var feed=q('feed');
  if(feed && /جاري تحميل المنشورات/.test(feed.textContent||'') && window.user && typeof window.loadFeed==='function'){
    if(!window.__madaFeedKick){window.__madaFeedKick=1;setTimeout(function(){window.loadFeed(true)},80)}
  }
  var map={
    searchBtn:function(){call('searchUsersView')||call('openSearch')||window.MadaUnifiedSearch?.open?.()},
    msgBtn:function(){call('messagesView')||window.MessengerPro?.open?.()},
    msgBtn2:function(){call('messagesView')||window.MessengerPro?.open?.()},
    notifyBtn:function(){call('notifications')},
    notifyNav:function(){call('notifications')},
    profileNav:function(){call('openProfile',window.user?.id)},
    friendsNav:function(){call('friendsView')||window.Social?.center?.()},
    friendsBottom:function(){call('friendsView')||window.Social?.center?.()},
    createNav:function(){var x=q('postInput');if(x){x.focus();x.scrollIntoView({behavior:'smooth',block:'center'})}},
    createBottom:function(){var x=q('postInput');if(x){x.focus();x.scrollIntoView({behavior:'smooth',block:'center')}},
    themeBtn:function(){call('applyTheme',!document.body.classList.contains('dark'))},
    postBtn:function(){call('addPost')},
    photoBtn:function(){q('imageInput')?.click()},
    videoBtn:function(){q('imageInput')?.click()},
    premiumBannerAction:function(){q('premiumBtn')?.click()}
  };
  Object.keys(map).forEach(function(id){var b=q(id);if(!b||b.dataset.madaStableBound)return;b.dataset.madaStableBound='1';b.addEventListener('click',function(e){try{map[id](e)}catch(err){console.warn('Mada button',id,err)}})})
  if(!window.__madaFeedRetryBound&&feed){window.__madaFeedRetryBound=1;feed.addEventListener('click',function(e){var r=e.target.closest?.('[data-retry-feed]');if(r){e.preventDefault();call('loadFeed',true)}})}
}
function css(){if(q('mada-startup-stability-style'))return;var s=document.createElement('style');s.id='mada-startup-stability-style';s.textContent='html,body{overscroll-behavior-y:none}button{touch-action:manipulation}#modal[hidden]{display:none!important}.modal[hidden]{display:none!important}.bottom-nav{z-index:1000!important}.topbar{z-index:1001!important}.feed,.page-wrap{contain:layout style}img.post-image{content-visibility:auto;contain-intrinsic-size:300px 220px}';document.head.appendChild(s)}
function boot(){css();bind();setTimeout(bind,700);setTimeout(bind,1600);setTimeout(bind,3000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();