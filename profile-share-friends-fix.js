(()=>{
  const getSB=()=>window.MADA_SUPABASE_CLIENT||window.sb;
  async function currentUser(){
    const s=getSB();
    if(!s)return null;
    const r=await s.auth.getUser();
    return r.data?.user||null;
  }
  async function getShareCount(id){
    const s=getSB(); if(!s)return 0;
    const r=await s.from('post_shares').select('*',{count:'exact',head:true}).eq('post_id',id);
    return r.count||0;
  }
  function setShareCount(btn,count){
    if(!btn)return;
    const old=btn.querySelector('.share-count')?.textContent;
    if(old===String(count))return;
    btn.dataset.shareCount=String(count);
    btn.innerHTML=`↗️ مشاركة <span class="share-count">${count}</span>`;
  }
  async function enhanceCounts(root){
    if(!root)return;
    const buttons=[...root.querySelectorAll('.profile-share[data-id]')];
    await Promise.all(buttons.map(async btn=>setShareCount(btn,await getShareCount(btn.dataset.id))));
  }
  function addSharedCopy(btn){
    const article=btn?.closest('.profile-post');
    const list=document.getElementById('profilePosts');
    if(!article||!list)return;
    const postId=article.dataset.post;
    if(list.querySelector(`.profile-post[data-shared-copy="${CSS.escape(postId)}"]`))return;
    const copy=article.cloneNode(true);
    copy.dataset.sharedCopy=postId;
    copy.dataset.post=postId;
    const label=document.createElement('div');
    label.className='shared-post-label';
    label.textContent='↗️ منشور مُشارك في الملف الشخصي';
    copy.querySelector('.post-head')?.after(label);
    copy.querySelectorAll('[data-delete-post]').forEach(x=>x.remove());
    list.prepend(copy);
    enhanceCounts(copy);
  }
  async function loadExistingShares(){
    const s=getSB();
    const me=await currentUser();
    if(!s||!me||window.__MADA_PROFILE_ID!==me.id)return;
    const r=await s.from('post_shares').select('post_id,created_at').eq('target_user_id',me.id).order('created_at',{ascending:false}).limit(30);
    (r.data||[]).forEach(row=>{
      const btn=document.querySelector(`.profile-share[data-id="${CSS.escape(row.post_id)}"]`);
      if(btn)addSharedCopy(btn);
    });
  }
  async function shareToProfile(id){
    const s=getSB();
    const me=await currentUser();
    if(!s||!me)return alert('تعذر تنفيذ المشاركة. سجّل الدخول مرة أخرى.');
    const r=await s.from('post_shares').insert({post_id:id,user_id:me.id,target_user_id:me.id});
    if(r.error){
      if(/duplicate|unique/i.test(r.error.message||''))return alert('هذا المنشور موجود بالفعل في ملفك الشخصي.');
      return alert('تعذر مشاركة المنشور داخل الملف الشخصي: '+r.error.message);
    }
    const btn=document.querySelector(`.profile-share[data-id="${CSS.escape(id)}"]`);
    const count=await getShareCount(id);
    setShareCount(btn,count);
    addSharedCopy(btn);
    alert('تمت مشاركة المنشور داخل الملف الشخصي ✓');
  }
  function boot(){
    document.addEventListener('click',e=>{
      const share=e.target.closest('.profile-share');
      if(!share)return;
      e.preventDefault();
      e.stopImmediatePropagation();
      shareToProfile(share.dataset.id);
    },true);
    const modal=document.getElementById('modal');
    if(!modal)return;
    const observer=new MutationObserver(()=>{
      enhanceCounts(modal);
      if(window.__MADA_PROFILE_ID)loadExistingShares();
    });
    observer.observe(modal,{childList:true,subtree:true});
    enhanceCounts(modal);
    setTimeout(loadExistingShares,200);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();