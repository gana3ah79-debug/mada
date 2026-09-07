/* Mada comment deletion v1 — owner/post-owner/admin safe delete. */
(function(){'use strict';
function boot(){
  const list=document.getElementById('commentsList');
  const client=window.MADA_SUPABASE_CLIENT||window.sb;
  if(!list||!client)return;
  list.addEventListener('click',async function(e){
    const b=e.target.closest('button[data-delete]');
    if(!b)return;
    e.stopImmediatePropagation();
    const article=b.closest('[data-id]'),id=article?.dataset.id;
    if(!id)return;
    const {data:{session}}=await client.auth.getSession();
    const user=session?.user;
    if(!user){alert('سجّل الدخول أولاً');return;}
    b.disabled=true;
    const {data:c,error:ce}=await client.from('comments').select('id,author_id,post_id').eq('id',id).maybeSingle();
    if(ce||!c){b.disabled=false;return;}
    let can=c.author_id===user.id;
    if(!can){const {data:p}=await client.from('posts').select('author_id').eq('id',c.post_id).maybeSingle();can=p?.author_id===user.id;}
    if(!can){const {data:p}=await client.from('profiles').select('role').eq('id',user.id).maybeSingle();can=p?.role==='admin';}
    if(!can){b.disabled=false;return;}
    if(!confirm('حذف التعليق؟')){b.disabled=false;return;}
    const {error}=await client.from('comments').delete().eq('id',id);
    if(error){b.disabled=false;return;}
    article.remove();
    const t=document.getElementById('toast');
    if(t){t.textContent='تم حذف التعليق';t.hidden=false;clearTimeout(window.madaDeleteToast);window.madaDeleteToast=setTimeout(()=>t.hidden=true,2500);}
  },true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
