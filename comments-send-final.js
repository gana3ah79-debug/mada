/* Mada final comment sender: one handler, session recovery, clear diagnostics. */
(function(){
  let busy=false;
  function client(){
    if(window.sb)return window.sb;
    if(window.supabase?.createClient&&window.MADA_SUPABASE_URL&&window.MADA_SUPABASE_KEY){
      try{return window.sb=window.supabase.createClient(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage:window.localStorage}})}catch(e){}
    }
    return null;
  }
  async function session(){
    const d=client();if(!d)return null;
    for(let i=0;i<5;i++){
      try{const r=await d.auth.getSession();if(r.data?.session?.user){window.user=r.data.session.user;return r.data.session.user}}catch(e){}
      try{const r=await d.auth.getUser();if(r.data?.user){window.user=r.data.user;return r.data.user}}catch(e){}
      if(i<4)await new Promise(r=>setTimeout(r,300));
    }
    return window.user?.id?window.user:null;
  }
  async function send(){
    if(busy)return;
    const input=document.getElementById('mada-comments-input'),btn=document.getElementById('mada-comments-send');
    const sheet=document.getElementById('mada-comments-sheet');
    if(!input||!sheet)return;
    const postId=window.madaCommentsCurrentPost||window.__madaCurrentCommentPost||sheet.dataset.postId||null;
    const text=input.value.trim();
    if(!text){input.focus();return}
    const d=client();if(!d){alert('تعذر الاتصال بقاعدة البيانات.');return}
    busy=true;if(btn){btn.disabled=true;btn.textContent='جارٍ الإرسال…'}
    try{
      const u=await session();
      let pid=postId;
      if(!pid){const p=window.__madaCommentPostId||window.madaCurrentPostId;if(p)pid=p}
      if(!pid){throw new Error('لم يتم تحديد المنشور')}
      if(!u?.id)throw new Error('جلسة تسجيل الدخول غير متاحة. أغلق الصفحة وافتحها مرة أخرى.')
      const r=await d.from('comments').insert({post_id:pid,author_id:u.id,body:text}).select('id,post_id,author_id,body,created_at').single();
      if(r.error)throw r.error;
      input.value='';
      if(typeof window.madaOpenCommentsSheet==='function')await window.madaOpenCommentsSheet(pid);
      if(typeof window.madaRefreshPostStats==='function')window.madaRefreshPostStats(pid);
    }catch(e){console.error('Mada final comment sender:',e);alert('تعذر إرسال التعليق: '+(e?.message||'خطأ غير معروف'))}
    finally{busy=false;if(btn){btn.disabled=false;btn.textContent='إرسال'}}
  }
  document.addEventListener('click',e=>{if(e.target.closest('#mada-comments-send')){e.preventDefault();e.stopImmediatePropagation();send()}},true);
  window.madaFinalSendComment=send;
})();