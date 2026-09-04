(()=>{
 const sb=()=>window.MADA_SUPABASE_CLIENT||window.sb;
 const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
 function handle(button,e){
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  if(button.dataset.finalLikeBusy==='1')return;
  const client=sb();if(!client)return;
  const id=button.dataset.id,liked=button.dataset.liked==='true';
  const oldText=button.textContent||'';const m=oldText.match(/(\d+)\s*$/);const oldCount=m?Number(m[1]):0;
  const next=!liked,count=Math.max(0,oldCount+(next?1:-1));
  button.dataset.finalLikeBusy='1';button.dataset.liked=String(next);button.classList.toggle('liked',next);button.textContent=`${next?'💙':'👍'} إعجاب ${count}`;
  (async()=>{try{const a=await client.auth.getUser(),me=a.data?.user;if(!me)throw new Error('يجب تسجيل الدخول أولًا');const q=next?await client.from('post_likes').insert({post_id:id,user_id:me.id}):await client.from('post_likes').delete().eq('post_id',id).eq('user_id',me.id);if(q.error)throw q.error}catch(err){button.dataset.liked=String(liked);button.classList.toggle('liked',liked);button.textContent=oldText;console.error('Mada like',err)}finally{button.dataset.finalLikeBusy='0'}})();
 }
 function convert(){document.querySelectorAll('#modal .profile-like').forEach(b=>{if(b.dataset.finalLikeReady==='1')return;b.dataset.finalLikeReady='1';b.classList.remove('profile-like');b.classList.add('mada-profile-like');b.addEventListener('click',e=>handle(b,e),true)})}
 const obs=new MutationObserver(convert);obs.observe(document.body,{childList:true,subtree:true});convert();window.MadaFinalLikeFix={run:convert};
})();
