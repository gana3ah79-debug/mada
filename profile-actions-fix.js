(()=>{
 const sb=()=>window.MADA_SUPABASE_CLIENT||window.sb;
 const $=id=>document.getElementById(id);
 const msg=t=>{if(window.showModal)window.showModal('Mada',`<div class="empty">${t}</div>`);else alert(t)};
 async function user(){const s=await sb().auth.getUser();return s.data?.user||null}
 function stop(e){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()}
 function setLikeUI(button,liked,count){button.dataset.liked=String(liked);button.classList.toggle('liked',liked);button.textContent=`${liked?'💙':'👍'} إعجاب ${Math.max(0,count)}`}
 async function wire(){
  const page=document.querySelector('#modal .profile-page');
  if(page&&!page.dataset.actionsFixed){
   const id=window.__MADA_PROFILE_ID, me=await user(); if(!me||!id)return;
   page.dataset.actionsFixed='1';
   const own=id===me.id;
   const add=$('addFriend'),accept=$('acceptFriend'),follow=$('followBtn'),chat=$('chatProfile'),edit=$('editProfile');
   async function relation(){
    const [f,fo]=await Promise.all([
     sb().from('friendships').select('id,requester_id,addressee_id,status').or(`and(requester_id.eq.${me.id},addressee_id.eq.${id}),and(requester_id.eq.${id},addressee_id.eq.${me.id})`).maybeSingle(),
     sb().from('follows').select('follower_id,following_id').eq('follower_id',me.id).eq('following_id',id).maybeSingle()
    ]);return {f:f.data,follow:!!fo.data};
   }
   async function refresh(){window.__MADA_PROFILE_ID=id;if(window.ProfileUI?.open)return window.ProfileUI.open(id);window.location.reload()}
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
    if(window.openChat)return window.openChat(id);
    if($('msgBtn')){$('closeModal')?.click();setTimeout(()=>$('msgBtn').click(),100);return}
    msg('تم فتح الرسائل، اختر هذا المستخدم لبدء المحادثة.');
   }
   async function doEdit(){
    if(window.ProfileUI?.edit)return window.ProfileUI.edit();
    if(typeof window.edit==='function')return window.edit();
    if(typeof window.showProfileEdit==='function')return window.showProfileEdit();
    msg('وظيفة تعديل الملف غير متاحة حاليًا.');
   }
   page.querySelectorAll('.profile-like').forEach(button=>{
    if(button.dataset.madaLikeFixed==='1')return;
    button.dataset.madaLikeFixed='1';
    button.addEventListener('click',async e=>{
     stop(e);
     if(button.dataset.busy==='1')return;
     const postId=button.dataset.id,wasLiked=button.dataset.liked==='true';
     const oldText=button.textContent,oldLiked=wasLiked;
     const match=oldText.match(/(\d+)\s*$/),oldCount=match?Number(match[1]):0;
     const nextLiked=!wasLiked,nextCount=oldCount+(nextLiked?1:-1);
     button.dataset.busy='1';
     setLikeUI(button,nextLiked,nextCount);
     try{
      const q=nextLiked?await sb().from('post_likes').insert({post_id:postId,user_id:me.id}):await sb().from('post_likes').delete().eq('post_id',postId).eq('user_id',me.id);
      if(q.error)throw q.error;
     }catch(err){
      setLikeUI(button,oldLiked,oldCount);button.textContent=oldText;
      msg('تعذر حفظ الإعجاب: '+(err?.message||err));
     }finally{button.dataset.busy='0'}
    },true);
   });
   add?.addEventListener('click',e=>{stop(e);friend()},true);
   accept?.addEventListener('click',e=>{stop(e);friend()},true);
   follow?.addEventListener('click',e=>{stop(e);doFollow()},true);
   chat?.addEventListener('click',e=>{stop(e);doChat()},true);
   edit?.addEventListener('click',e=>{stop(e);doEdit()},true);
   page.querySelectorAll('[data-delete-post]').forEach(b=>b.addEventListener('click',async e=>{
    stop(e);if(!confirm('هل تريد حذف هذا المنشور نهائيًا؟'))return;
    const q=await sb().from('posts').delete().eq('id',b.dataset.deletePost).eq('author_id',me.id);
    if(q.error)return msg('تعذر حذف المنشور: '+q.error.message);
    b.closest('.profile-post')?.remove();
   },true));
  }
  wireSave();
 }
 function wireSave(){
  const save=$('saveProfile');if(!save||save.dataset.madaSaveFixed==='1')return;
  save.dataset.madaSaveFixed='1';
  save.addEventListener('click',async e=>{
   stop(e);
   const me=await user();
   const root=document.querySelector('#modalBody .edit-profile')||document.querySelector('#modal .edit-profile');
   const name=root?.querySelector('#epName'),username=root?.querySelector('#epUser'),bio=root?.querySelector('#epBio');
   if(!me||!root||!name||!username||!bio)return msg('تعذر قراءة بيانات التعديل. أغلق النافذة وافتح تعديل الملف مرة أخرى.');
   const status=root.querySelector('#uploadStatus');
   const avatarImg=root.querySelector('#avatarPreview img');
   const coverImg=root.querySelector('#coverPreview img');
   save.disabled=true;save.textContent='⏳ جاري الحفظ…';
   try{
    const q=await sb().from('profiles').update({
     display_name:name.value.trim(),
     username:username.value.trim()||null,
     bio:bio.value.trim(),
     avatar_url:avatarImg?.src||null,
     cover_url:coverImg?.src||null,
     updated_at:new Date().toISOString()
    }).eq('id',me.id);
    if(q.error)throw q.error;
    if(status)status.textContent='✅ تم حفظ التعديلات';
    window.MadaProfileActionsFix._saved=true;
    setTimeout(()=>window.ProfileUI?.open?.(me.id),150);
   }catch(err){
    if(status)status.textContent='❌ تعذر الحفظ: '+(err?.message||err);
    else alert('تعذر الحفظ: '+(err?.message||err));
    save.disabled=false;save.textContent='💾 حفظ التعديلات';
   }
  },true);
 }
 const obs=new MutationObserver(()=>setTimeout(wire,80));obs.observe(document.body,{childList:true,subtree:true});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else setTimeout(wire,200);
 window.MadaProfileActionsFix={wire};
})();
