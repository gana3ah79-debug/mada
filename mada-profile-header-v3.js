/* Mada profile header v3: username, verification, city and clear profile actions. */
(function(){'use strict';
  const sb=()=>window.MADA_SUPABASE_CLIENT||window.sb;
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const modal=()=>document.getElementById('modal');
  let lastId=null;
  async function enhance(){
    const p=document.querySelector('#modal .profile-page'),id=window.__MADA_PROFILE_ID;
    if(!p||!id||id===lastId&&p.dataset.madaHeaderV3==='1')return;
    const client=sb();if(!client)return;
    const r=await client.from('profiles').select('id,username,city,is_verified,verification_type,role').eq('id',id).maybeSingle();
    if(r.error||!r.data)return;
    const d=r.data,main=p.querySelector('.profile-main'),name=p.querySelector('h2');if(!main||!name)return;
    p.dataset.madaHeaderV3='1';lastId=id;
    const meta=document.createElement('div');meta.className='mada-profile-meta-v3';
    const verified=d.is_verified===true?'<span class="mada-verified-v3" title="حساب موثّق" aria-label="حساب موثّق">✓</span>':'';
    const username=d.username?`<span class="mada-username-v3">@${esc(d.username)}</span>`:'';
    const city=d.city?`<span class="mada-city-v3">📍 ${esc(d.city)}</span>`:'';
    meta.innerHTML=verified+username+city;
    name.insertAdjacentElement('afterend',meta);
    const actions=p.querySelector('.profile-actions');
    if(actions){
      const own=id===window.__MADA_CURRENT_USER_ID;
      if(!own){
        const friend=actions.querySelector('#addFriend,.success,#acceptFriend');
        if(friend&&!friend.dataset.madaFriendsWired){friend.dataset.madaFriendsWired='1';friend.addEventListener('click',function(e){if(this.classList.contains('success')){e.preventDefault();e.stopImmediatePropagation();window.ProfileUI?.friends?.(id)}})}
      }
    }
  }
  function enhanceEdit(){
    const box=document.querySelector('#modal .edit-profile'),save=document.getElementById('saveProfile');
    if(!box||!save||box.dataset.madaCityAdded==='1')return;
    box.dataset.madaCityAdded='1';
    const wrap=document.createElement('label');wrap.className='mada-city-edit-v3';wrap.innerHTML='المدينة (اختياري)<input id="editCity" type="text" maxlength="80" placeholder="مثال: القاهرة">';
    const bio=document.getElementById('editBio');if(bio)bio.insertAdjacentElement('afterend',wrap);else box.insertBefore(wrap,save);
    const id=window.__MADA_PROFILE_ID;
    const client=sb();
    if(client&&id)client.from('profiles').select('city').eq('id',id).maybeSingle().then(r=>{if(!r.error&&r.data&&document.getElementById('editCity'))document.getElementById('editCity').value=r.data.city||''});
    const original=save.onclick;save.onclick=async function(){const city=document.getElementById('editCity')?.value.trim()||null;const result=original?await original.call(this):null;if(client&&id){const u=await client.from('profiles').update({city}).eq('id',id);if(u.error)alert('تعذر حفظ المدينة: '+u.error.message)}return result};
  }
  function run(){enhance();enhanceEdit()}
  const observer=new MutationObserver(()=>{clearTimeout(observer.t);observer.t=setTimeout(run,80)});
  function boot(){const m=modal();if(m)observer.observe(m,{childList:true,subtree:true});run()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();