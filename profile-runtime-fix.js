/* Mada profile hardening: auth restore, safe back navigation, tabs and action feedback. */
(function(){
  const $=id=>document.getElementById(id);
  async function restoreAuth(){
    try{
      const c=window.supabase?.createClient&&window.MADA_SUPABASE_URL&&window.MADA_SUPABASE_KEY
        ? window.supabase.createClient(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY):null;
      if(!c)return null;
      const {data:{session}}=await c.auth.getSession();
      if(!session){location.replace('index.html');return null;}
      window.user=session.user; return session;
    }catch(e){console.warn('Mada profile auth',e);return null;}
  }
  function back(){
    if(history.length>1) history.back(); else location.replace('index.html');
  }
  function install(){
    $('profileBack')?.addEventListener('click',e=>{e.preventDefault();back();});
    document.querySelectorAll('.profile-tabs button').forEach(btn=>btn.addEventListener('click',()=>{
      document.querySelectorAll('.profile-tabs button').forEach(x=>x.classList.remove('active'));btn.classList.add('active');
      const tab=btn.dataset.tab;
      const posts=document.querySelector('.profile-posts');
      if(!posts)return;
      if(tab==='posts'){posts.style.display='';return;}
      if(tab==='photos'){
        const imgs=posts.querySelectorAll('article.profile-post > img, article.profile-post .shared-box img');
        posts.style.display='';
        posts.querySelectorAll('article.profile-post').forEach(a=>a.style.display=a.querySelector('img')?'':'none');
        if(!imgs.length)posts.innerHTML='<div class="profile-loading">لا توجد صور حتى الآن.</div>';
      }else if(tab==='groups'){
        posts.innerHTML='<div class="profile-loading">قسم المجموعات سيظهر هنا عند إضافة مجموعات لهذا العضو.</div>';
      }
    }));
    window.addEventListener('pageshow',()=>restoreAuth());
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{restoreAuth();install()});else{restoreAuth();install()}
})();
