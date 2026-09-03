/* Final runtime bridge: loaded last so feature modules cannot overwrite the canonical header actions. */
(function(){
  function bind(){
    const msg=document.getElementById('msgBtn');
    if(msg){
      msg.type='button';
      msg.onclick=function(e){
        e.preventDefault();
        e.stopPropagation();
        if(typeof window.madaMessenger==='function') return window.madaMessenger();
        if(typeof window.openMessages==='function') return window.openMessages();
        if(typeof window.madaSearch==='function') return window.madaSearch();
      };
    }
    const search=document.getElementById('searchBtn');
    if(search){
      search.type='button';
      search.onclick=function(e){
        e.preventDefault();
        e.stopPropagation();
        if(typeof window.madaSearch==='function') return window.madaSearch();
        if(typeof window.madaSearchFix==='function') return window.madaSearchFix();
      };
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bind,{once:true});
  else bind();
  [250,750,1500].forEach(ms=>setTimeout(bind,ms));
})();