(() => {
  const toast = (m) => {
    if (typeof window.showMadaToast === 'function') return window.showMadaToast(m);
    let t = document.getElementById('madaReelToast');
    if (!t) { t=document.createElement('div'); t.id='madaReelToast'; t.style.cssText='position:fixed;z-index:999999;left:12px;right:12px;bottom:90px;padding:16px;border-radius:14px;background:#111;color:#fff;text-align:center;font-size:16px;box-shadow:0 8px 30px #0008'; document.body.appendChild(t); }
    t.textContent=m; t.hidden=false; clearTimeout(t._x); t._x=setTimeout(()=>t.hidden=true,6000);
  };
  const getUser = async () => { try { const {data}=await sb.auth.getUser(); return data?.user||null; } catch(e){ console.error(e); return null; } };
  window.openReelUploader = async () => {
    const input=document.getElementById('reelUploadInput');
    if(!input){toast('زر اختيار الفيديو غير موجود');return;}
    input.removeAttribute('capture'); input.setAttribute('accept','video/*,.mp4,.webm,.mov,.m4v,.3gp');
    toast('اختار فيديو من المعرض 📁');
    input.onchange=async()=>{
      const file=input.files?.[0]; input.value='';
      if(!file){toast('لم يتم اختيار فيديو');return;}
      toast('تم اختيار الفيديو ✅');
      const u=await getUser();
      if(!u){toast('سجّل الدخول أولاً ثم جرّب نشر الريلز');return;}
      if(file.size>25*1024*1024){toast('الفيديو أكبر من 25MB');return;}
      const v=document.createElement('video'); const url=URL.createObjectURL(file); v.preload='metadata';
      v.onloadedmetadata=async()=>{ const d=v.duration; URL.revokeObjectURL(url); if(d>60){toast('مدة الريلز يجب ألا تتجاوز 60 ثانية');return;} toast('جاري رفع الريلز الآن…'); try { const path=`${u.id}/${crypto.randomUUID()}.mp4`; const {error}=await sb.storage.from('reels').upload(path,file,{contentType:'video/mp4',cacheControl:'3600',upsert:false}); if(error)throw error; toast('تم رفع الفيديو، جاري حفظ الريلز…'); const {data:p}=sb.storage.from('reels').getPublicUrl(path); const {error:e}=await sb.from('reels').insert({author_id:u.id,video_url:p.publicUrl,caption:null}); if(e)throw e; toast('تم نشر الريلز بنجاح 🎬'); if(typeof window.loadReels==='function')await window.loadReels(); } catch(e){ console.error(e); toast('فشل رفع الفيديو: '+(e.message||'خطأ غير معروف')); } };
      v.onerror=()=>{URL.revokeObjectURL(url);toast('الفيديو غير صالح');}; v.src=url;
    };
    input.click();
  };
})();