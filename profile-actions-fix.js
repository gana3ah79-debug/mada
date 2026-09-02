(()=>{
 const sb=()=>window.MADA_SUPABASE_CLIENT||window.sb;
 const $=id=>document.getElementById(id);
 const msg=t=>{if(window.showModal)window.showModal('Mada',`<div class="empty">${t}</div>`);else alert(t)};
 async function user(){const s=await sb().auth.getUser();return s.data?.user||null}
 async function wire(){
  const page=document.querySelector('#modal .profile-page'); if(!page||page.dataset.actionsFixed==='1')return;
  page.dataset.actionsFixed='1'; const id=window.__MADA_PROFILE_ID, me=await user(); if(!me||!id)return;
  const own=id===me.id;
  const add=$('addFriend'),accept=$('acceptFriend'),follow=$('followBtn'),chat=$('chatProfile'),edit=$('editProfile');
  async function relation(){
   const [f,fo]=await Promise.all([
    sb().from('friendships').select('id,requester_id,addressee_id,status').or(`and(requester_id.eq.${me.id},addressee_id.eq.${id}),and(requester_id.eq.${id},addressee_id.eq.${me.id})`).maybeSingle(),
    sb().from('follows').select('follower_id,following_id').eq('follower_id',me.id).eq('following_id',id).maybeSingle()
   ]);return {f:f.data,follow:!!fo.data};
  }
  async function refresh(){window.__MADA_PROFILE_ID=id; if(window.ProfileUI?.open) return window.ProfileUI.open(id); window.location.reload()}
  async function friend(){
   const r=await relation();
   if(r.f?.status==='accepted')return msg('أنتما أصدقاء بالفعل.');
   if(r.f?.status==='pending'){
    if(r.f.requester_id===me.id)return msg('طلب الصداقة مُرسل بالفعل.');
    const q=await sb().from('friendships').update({status:'accepted',updated_at:new Date().toISOString()}).eq('id',r.f.id).eq('addressee_id',me.id);
    if(q.error)return msg('تعذر قبول طلب الصداقة: '+q.error.message);return refresh();
   }
   const q=await sb().from('friendships').insert({requester_id:me.id,addressee_id:id,status:'pending'});
   if(q.error)return msg('تعذر إرسال طلب الصداقة: '+q.error.message);return refresh();
  }
  async function doFollow(){
   const r=await relation();
   const q=r.follow?await sb().from('follows').delete().eq('follower_id',me.id).eq('following_id',id):await sb().from('follows').insert({follower_id:me.id,following_id:id});
   if(q.error)return msg('تعذر تحديث المتابعة: '+q.error.message);return refresh();
  }
  async function doChat(){
   if(window.openChatWithUser)return window.openChatWithUser(id);
   if(window.startConversation)return window.startConversation(id);
   if($('msgBtn')){$('closeModal')?.click();setTimeout(()=>$('msgBtn').click(),100);return}
   msg('تم فتح الرسائل، اختر هذا المستخدم لبدء المحادثة.');
  }
  async function doEdit(){
   if(window.ProfileUI?.edit)return window.ProfileUI.edit();
   if(typeof window.edit==='function')return window.edit();
   if(typeof window.showProfileEdit==='function')return window.showProfileEdit();
   msg('وظيفة تعديل الملف غير متاحة حاليًا.');
  }
  add?.addEventListener('click',e=>{e.preventDefault();friend()});
  accept?.addEventListener('click',e=>{e.preventDefault();friend()});
  follow?.addEventListener('click',e=>{e.preventDefault();doFollow()});
  chat?.addEventListener('click',e=>{e.preventDefault();doChat()});
  edit?.addEventListener('click',e=>{e.preventDefault();doEdit()});
  page.querySelectorAll('[data-delete-post]').forEach(b=>b.addEventListener('click',async e=>{
   e.preventDefault(); if(!confirm('هل تريد حذف هذا المنشور نهائيًا؟'))return;
   const q=await sb().from('posts').delete().eq('id',b.dataset.deletePost).eq('author_id',me.id);
   if(q.error)return msg('تعذر حذف المنشور: '+q.error.message);
   b.closest('.profile-post')?.remove(); msg('تم حذف المنشور بنجاح ✓');
  }));
 }
 const obs=new MutationObserver(()=>setTimeout(wire,80));obs.observe(document.body,{childList:true,subtree:true});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else setTimeout(wire,200);
 window.MadaProfileActionsFix={wire};
})();
