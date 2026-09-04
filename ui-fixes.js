/* Mada UI fixes: comments typing, friends button, video posting. */
(function(){
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  let videoFile=null;
  function toast(msg){if(window.showToast)return window.showToast(msg);alert(msg)}
  function bind(){
    const friends=$('friendsNav');
    if(friends){friends.onclick=e=>{e.preventDefault();e.stopPropagation();if(typeof window.openFriends==='function')window.openFriends();};}
    const feed=$('feed');
    if(feed&&!feed.dataset.madaTypingFix){
      feed.dataset.madaTypingFix='1';
      feed.addEventListener('keydown',e=>{
        const input=e.target.closest('.comment-box input[data-comment]');
        if(input&&e.key==='Enter'&&!e.shiftKey){e.preventDefault();const id=input.dataset.comment;const btn=feed.querySelector(`[data-send="${CSS.escape(id)}"]`);if(btn)btn.click();}
      },true);
    }
    const composer=document.querySelector('.composer-actions');
    if(composer&&!$('madaVideoBtn')){
      const btn=document.createElement('button');btn.id='madaVideoBtn';btn.type='button';btn.textContent='🎥 فيديو';
      const post=$('postBtn');composer.insertBefore(btn,post||null);
      const inp=document.createElement('input');inp.id='madaVideoInput';inp.type='file';inp.accept='video/*,.mp4,.webm,.mov,.m4v,.3gp';inp.hidden=true;document.body.appendChild(inp);
      btn.onclick=()=>inp.click();
      inp.onchange=()=>{videoFile=inp.files?.[0]||null;if(videoFile){$('postInput').placeholder='اكتب وصف الفيديو ثم اضغط نشر';toast('تم اختيار الفيديو ✓');}};
      btn.dataset.bound='1';
      if(post){post.onclick=async e=>{if(!videoFile)return;await publishVideo(post);};}
    }
  }
  async function publishVideo(btn){
    const sb=window.sb,u=window.user,input=$('postInput');
    if(!sb||!u||!videoFile)return;
    if(videoFile.size>25*1024*1024)return toast('حجم الفيديو يجب ألا يتجاوز 25 ميجابايت');
    btn.disabled=true;const old=btn.textContent;btn.textContent='جارٍ رفع الفيديو…';
    try{
      const ext=(videoFile.name.split('.').pop()||'mp4').toLowerCase().replace(/[^a-z0-9]/g,'')||'mp4';
      const path=`${u.id}/${crypto.randomUUID()}.${ext}`;
      const up=await sb.storage.from('mada-media').upload(path,videoFile,{contentType:videoFile.type||'video/mp4',upsert:false});
      if(up.error)throw up.error;
      const media_url=sb.storage.from('mada-media').getPublicUrl(path).data.publicUrl;
      const {error}=await sb.from('posts').insert({author_id:u.id,body:input.value.trim()||null,media_url,visibility:'public'});
      if(error)throw error;
      input.value='';videoFile=null;$('madaVideoInput').value='';input.placeholder='بماذا تفكر؟';
      if(typeof window.loadFeed==='function')await window.loadFeed();
      toast('تم نشر الفيديو بنجاح ✓');
    }catch(e){console.error(e);toast('تعذر نشر الفيديو: '+(e?.message||'خطأ غير متوقع'));}
    finally{btn.disabled=false;btn.textContent=old;}
  }
  document.addEventListener('DOMContentLoaded',()=>setTimeout(bind,100));
  const mo=new MutationObserver(()=>bind());
  document.addEventListener('DOMContentLoaded',()=>mo.observe(document.body,{childList:true,subtree:true}));
})();
