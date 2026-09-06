/* Mada Like No-Refresh v1: prevent legacy like handlers from reloading the feed. */
(function(){
  'use strict';
  function patchButton(btn){
    if(!btn)return;
    btn.type='button';
    btn.dataset.madaNoRefresh='1';
  }
  function scan(){document.querySelectorAll('.post-actions .like[data-id]').forEach(patchButton)}
  // Legacy app.js toggleLike used to call loadFeed() after every like.
  // Keep the function compatible for older handlers, but never reload/rebuild the feed here.
  if(typeof window.toggleLike==='function' && !window.__MADA_TOGGLELIKE_NO_REFRESH){
    window.__MADA_TOGGLELIKE_NO_REFRESH=true;
    window.toggleLike=async function(id,liked){
      const client=window.MADA_SUPABASE_CLIENT||window.sb;
      let me=window.MadaCurrentUser||window.user||null;
      if(!me && client){try{me=(await client.auth.getUser()).data?.user||null}catch(e){}}
      if(!client||!me)return;
      const r=liked
        ? await client.from('post_likes').delete().eq('post_id',id).eq('user_id',me.id)
        : await client.from('post_likes').insert({post_id:id,user_id:me.id});
      if(r.error)alert('تعذر حفظ الإعجاب: '+r.error.message);
    };
  }
  scan();
  const obs=new MutationObserver(scan);
  obs.observe(document.documentElement,{childList:true,subtree:true});
})();
