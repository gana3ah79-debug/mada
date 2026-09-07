/* Mada media feature gates + final reaction touch fix. */
(function(){'use strict';
  const sb=()=>window.MADA_SUPABASE_CLIENT||window.sb;
  function hide(el){if(!el)return;el.dataset.madaFeatureHidden='1';el.style.setProperty('display','none','important')}
  async function apply(){
    const client=sb(); if(!client)return;
    const r=await client.from('payment_settings').select('stories_visible,reels_visible').eq('id',true).maybeSingle();
    if(r.error)return;
    const d=r.data||{};
    if(d.stories_visible===false){['.stories','#storyRow','#addStoryBtn','#allStoriesBtn'].forEach(s=>document.querySelectorAll(s).forEach(hide));}
    if(d.reels_visible===false){['#reelsBtn','[data-reels]','.reels','.reels-section'].forEach(s=>document.querySelectorAll(s).forEach(hide));}
  }
  function loadReactionFix(){
    if(document.getElementById('mada-final-reaction-fix'))return;
    const s=document.createElement('script');s.id='mada-final-reaction-fix';s.src='mada-reaction-final-fix-v1.js?v20260907-1';document.body.appendChild(s);
  }
  function boot(){apply();setTimeout(apply,1000);setTimeout(apply,3000);setTimeout(loadReactionFix,50)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
