/* Mada Profile Post Visibility v1 — optional profile publishing without changing the main feed. */
(function(){'use strict';
if(window.__MADA_PROFILE_POST_VISIBILITY_V1)return;
window.__MADA_PROFILE_POST_VISIBILITY_V1=true;
const C=()=>window.MADA_SUPABASE_CLIENT||window.sb;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
let busy=false;
function addChoice(){
  const row=$('.publish-row');
  if(!row||$('postProfileVisible'))return;
  const wrap=document.createElement('label');
  wrap.className='mada-profile-post-visibility';
  wrap.innerHTML='<input id="postProfileVisible" type="checkbox" checked><span>إظهار المنشور في الملف الشخصي</span>';
  row.insertBefore(wrap,row.firstChild);
}
async function isPremium(user){
  try{
    const c=C();
    const r=await c.from('subscriptions').select('status,current_period_end').eq('user_id',user.id).in('status',['trialing','active']).order('current_period_end',{ascending:false}).limit(1).maybeSingle();
    return !!r.data&&(!r.data.current_period_end||new Date(r.data.current_period_end)>new Date());
  }catch{return false}
}
async function publish(){
  if(busy)return;
  const c=C(),input=$('postInput'),fileInput=$('imageInput');
  const user=(await c?.auth?.getUser?.())?.data?.user;
  if(!c||!user||!input)return;
  const text=input.value.trim(),premium=await isPremium(user),max=premium?5000:1000,file=fileInput?.files?.[0]||null;
  if(text.length>max){alert(`الحد الأقصى ${max} حرف`);return}
  if(!text&&!file)return;
  busy=true;
  try{
    let media_url=null;
    if(file){
      const ext=(file.name.split('.').pop()||'jpg').toLowerCase();
      const path=`${user.id}/${crypto.randomUUID()}.${ext}`;
      const up=await c.storage.from('mada-media').upload(path,file,{contentType:file.type||'image/jpeg',upsert:false});
      if(up.error)throw new Error('تعذر رفع الصورة: '+up.error.message);
      media_url=c.storage.from('mada-media').getPublicUrl(path).data.publicUrl;
    }
    const profile_visible=$('postProfileVisible')?.checked!==false;
    const r=await c.from('posts').insert({author_id:user.id,body:text||null,media_url,visibility:'public',profile_visible});
    if(r.error)throw new Error('تعذر نشر المنشور: '+r.error.message);
    input.value='';input.placeholder='اكتب منشورك...';
    if(fileInput)fileInput.value='';
    if(window.madaReloadFeed)await window.madaReloadFeed();
    else if(window.loadFeedPage)await window.loadFeedPage(true);
    else if(window.loadFeed)await window.loadFeed();
  }catch(e){alert(e?.message||'تعذر نشر المنشور')}finally{busy=false}
}
function filterProfilePosts(){
  const box=$('mfpContent'),target=window.__MADA_PROFILE_ID;
  if(!box||!target)return;
  const nodes=[...box.querySelectorAll('.fb-post[data-post-id]')];
  if(!nodes.length)return;
  const ids=nodes.map(n=>n.dataset.postId).filter(Boolean);
  C().from('posts').select('id,profile_visible').in('id',ids).then(r=>{
    if(r.error)return;
    const hidden=new Set((r.data||[]).filter(x=>x.profile_visible===false).map(x=>x.id));
    nodes.forEach(n=>{if(hidden.has(n.dataset.postId))n.remove()});
    const empty=box.querySelector('.fb-empty');
    if(!box.querySelector('.fb-post')&&!empty){const d=document.createElement('div');d.className='fb-empty';d.textContent='لا توجد منشورات معروضة في الملف الشخصي.';box.appendChild(d)}
  }).catch(()=>{});
}
function boot(){
  addChoice();
  document.addEventListener('click',e=>{
    const b=e.target?.closest?.('#postBtn');
    if(b){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();publish();return}
    if(e.target?.closest?.('#mfpPostsTab'))setTimeout(filterProfilePosts,50);
  },true);
  const obs=new MutationObserver(()=>{addChoice();filterProfilePosts()});
  obs.observe(document.body,{childList:true,subtree:true});
  setInterval(filterProfilePosts,1200);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();