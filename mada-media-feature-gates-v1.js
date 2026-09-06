/* Mada media feature gates: admin-controlled Stories/Reels visibility. */
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
  function boot(){apply();setTimeout(apply,1000);setTimeout(apply,3000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
