/* Mada publish/session guard. Publish directly from the current Supabase session so a stale/null app user can never crash publishing. */
(function(){
  async function getClient(){
    if(window.sb?.auth)return window.sb;
    if(window.supabase?.createClient&&window.MADA_SUPABASE_URL&&window.MADA_SUPABASE_KEY)
      return window.supabase.createClient(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY);
    return null;
  }

  async function publishFromSession(){
    const c=await getClient();
    if(!c?.auth){alert('تعذر الاتصال بخدمة الحسابات.');return false;}
    const {data:{session},error:sessionError}=await c.auth.getSession();
    const uid=session?.user?.id;
    if(sessionError||!uid){alert('جلسة الحساب غير متاحة حاليًا. أغلق Mada وافتحه مرة أخرى.');return false;}

    window.user=session.user;
    const text=(document.getElementById('postInput')?.value||'').trim();
    const file=document.getElementById('imageInput')?.files?.[0]||null;
    if(!text&&!file)return false;
    if(text.length>1000){alert('الحد الأقصى 1000 حرف.');return false;}
    if(file){
      if(!file.type.startsWith('image/')){alert('اختر صورة صحيحة.');return false;}
      if(file.size>8*1024*1024){alert('حجم الصورة يجب ألا يتجاوز 8 ميجابايت.');return false;}
    }

    const btn=document.getElementById('postBtn');
    if(btn){btn.disabled=true;btn.dataset.madaOldText=btn.textContent;btn.textContent='جارٍ النشر…';}
    try{
      let media_url=null;
      if(file){
        const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';
        const path=uid+'/'+crypto.randomUUID()+'.'+ext;
        const up=await c.storage.from('mada-media').upload(path,file,{contentType:file.type,upsert:false});
        if(up.error)throw up.error;
        media_url=c.storage.from('mada-media').getPublicUrl(path).data.publicUrl;
      }
      const {error}=await c.from('posts').insert({author_id:uid,body:text||null,media_url,visibility:'public'});
      if(error)throw error;
      const input=document.getElementById('postInput');
      const imageInput=document.getElementById('imageInput');
      if(input){input.value='';input.placeholder='بماذا تفكر؟';}
      if(imageInput)imageInput.value='';
      if(typeof window.loadFeed==='function')await window.loadFeed();
      return true;
    }catch(e){console.error('Mada publish',e);alert('تعذر نشر المنشور: '+(e?.message||'حدث خطأ غير متوقع'));return false;}
    finally{if(btn){btn.disabled=false;btn.textContent=btn.dataset.madaOldText||'نشر';delete btn.dataset.madaOldText;}}
  }

  function init(){
    const btn=document.getElementById('postBtn');
    if(!btn)return;
    btn.onclick=function(e){e?.preventDefault?.();publishFromSession();};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else setTimeout(init,0);
  window.madaPublishFromSession=publishFromSession;
})();
