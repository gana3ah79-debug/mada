(function(){
  const { createClient } = window.supabase;
  const sb = createClient(window.MADA_SUPABASE_URL, window.MADA_SUPABASE_KEY);
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const initials = n => (n || 'م').trim().charAt(0);
  const errorText = e => e?.message || 'حدث خطأ غير متوقع';
  let currentUser = null;
  let storyInput = null;

  function toast(message, ok=false){
    let el = $('madaToast');
    if(!el){ el=document.createElement('div'); el.id='madaToast'; el.className='mada-toast'; document.body.appendChild(el); }
    el.textContent=message; el.classList.toggle('ok',ok); el.classList.add('show');
    clearTimeout(el._t); el._t=setTimeout(()=>el.classList.remove('show'),2600);
  }

  function ensureModal(){
    let m=$('madaFeatureModal');
    if(m) return m;
    m=document.createElement('div'); m.id='madaFeatureModal'; m.className='feature-modal'; m.hidden=true;
    m.innerHTML='<div class="feature-sheet"><button class="feature-close" data-close-feature>×</button><h2 id="featureTitle"></h2><div id="featureBody"></div></div>';
    document.body.appendChild(m);
    m.addEventListener('click',e=>{if(e.target===m||e.target.closest('[data-close-feature]')) closeModal();});
    return m;
  }
  function openModal(title,body){const m=ensureModal();$('featureTitle').textContent=title;$('featureBody').innerHTML=body;m.hidden=false;document.body.classList.add('modal-open');}
  function closeModal(){const m=$('madaFeatureModal');if(m)m.hidden=true;document.body.classList.remove('modal-open');}

  async function getUser(){
    if(currentUser) return currentUser;
    const {data,error}=await sb.auth.getUser();
    if(error) throw error;
    currentUser=data?.user||null;
    return currentUser;
  }

  function fileExt(file,fallback='jpg'){
    const ext=(file?.name?.split('.').pop()||fallback).toLowerCase().replace(/[^a-z0-9]/g,'');
    return ext||fallback;
  }

  function makeStoryInput(){
    if(storyInput) return storyInput;
    storyInput=document.createElement('input'); storyInput.type='file'; storyInput.accept='image/*'; storyInput.hidden=true; storyInput.id='storyFileInput';
    document.body.appendChild(storyInput); storyInput.addEventListener('change',()=>{if(storyInput.files?.[0]) openStoryComposer(storyInput.files[0]);});
    return storyInput;
  }

  function openAddStory(){
    makeStoryInput();
    openModal('➕ إضافة قصة','<div class="story-create"><div class="story-drop" id="storyDrop">📸<b>أضف صورة للقصة</b><small>القصة تختفي تلقائيًا بعد 24 ساعة</small><button class="primary" id="chooseStory">اختيار صورة</button></div><p class="feature-hint">الحد الأقصى 8 ميجابايت — JPG أو PNG أو WebP.</p></div>');
    $('chooseStory').onclick=()=>storyInput.click();
    const drop=$('storyDrop');
    ['dragenter','dragover'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('dragging');}));
    ['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('dragging');}));
    drop.addEventListener('drop',e=>{const f=e.dataTransfer?.files?.[0];if(f)openStoryComposer(f);});
  }

  function openStoryComposer(file){
    if(!file.type.startsWith('image/')) return toast('اختر صورة فقط');
    if(file.size>8*1024*1024) return toast('حجم الصورة يجب ألا يتجاوز 8 ميجابايت');
    const url=URL.createObjectURL(file);
    openModal('مراجعة القصة',`<div class="story-preview"><img src="${url}" alt="معاينة القصة"><button class="primary wide" id="publishStory">نشر القصة الآن</button><button class="secondary wide" id="cancelStory">إلغاء</button><p id="storyMsg"></p></div>`);
    $('cancelStory').onclick=()=>{URL.revokeObjectURL(url);openAddStory();};
    $('publishStory').onclick=()=>publishStory(file,url);
  }

  async function publishStory(file,previewUrl){
    const btn=$('publishStory'),msg=$('storyMsg'); btn.disabled=true;btn.textContent='جارٍ نشر القصة…';
    try{
      const u=await getUser(); if(!u) throw new Error('سجّل الدخول أولًا');
      const path=`${u.id}/stories/${crypto.randomUUID()}.${fileExt(file)}`;
      const up=await sb.storage.from('mada-media').upload(path,file,{contentType:file.type,upsert:false,cacheControl:'3600'});
      if(up.error) throw up.error;
      const media_url=sb.storage.from('mada-media').getPublicUrl(path).data.publicUrl;
      const {error}=await sb.from('stories').insert({user_id:u.id,media_url,expires_at:new Date(Date.now()+24*60*60*1000).toISOString()});
      if(error){await sb.storage.from('mada-media').remove([path]).catch(()=>{});throw error;}
      URL.revokeObjectURL(previewUrl); closeModal(); toast('تم نشر قصتك بنجاح ✓',true); await loadStories();
    }catch(e){console.error(e);msg.textContent='تعذر نشر القصة: '+errorText(e);btn.disabled=false;btn.textContent='نشر القصة الآن';}
  }

  async function loadStories(){
    const box=document.querySelector('.stories'); if(!box) return;
    try{
      const u=await getUser(); if(!u) return;
      const {data:stories,error}=await sb.from('stories').select('id,user_id,media_url,created_at,expires_at').gt('expires_at',new Date().toISOString()).order('created_at',{ascending:false}).limit(30);
      if(error) throw error;
      const ids=[...new Set((stories||[]).map(s=>s.user_id))];
      let profiles=[];
      if(ids.length){const r=await sb.from('profiles').select('id,display_name,avatar_url').in('id',ids);profiles=r.data||[];}
      const pm=new Map(profiles.map(p=>[p.id,p]));
      box.innerHTML='';
      const add=document.createElement('button'); add.type='button';add.className='story add-story';add.innerHTML='＋<span>قصتك</span>';add.onclick=openAddStory;box.appendChild(add);
      const seen=new Set();
      (stories||[]).forEach(s=>{
        if(seen.has(s.user_id)) return; seen.add(s.user_id);
        const p=pm.get(s.user_id)||{display_name:'مستخدم Mada'};
        const b=document.createElement('button'); b.type='button'; b.className='story story-live'; b.dataset.storyUser=s.user_id;
        b.innerHTML=`<div class="story-avatar">${p.avatar_url?`<img src="${esc(p.avatar_url)}" alt="">`:esc(initials(p.display_name))}</div><span>${esc(p.display_name||'مستخدم')}</span>`;
        b.onclick=()=>openStoryViewer(s.user_id,stories,pm);box.appendChild(b);
      });
    }catch(e){console.warn('stories load failed',e);}
  }

  function openStoryViewer(userId,stories,pm){
    const own=stories.filter(s=>s.user_id===userId); if(!own.length)return;
    let i=0;
    const render=()=>{
      const s=own[i],p=pm.get(userId)||{display_name:'مستخدم Mada'};
      openModal(`قصة ${esc(p.display_name||'مستخدم')}`,`<div class="story-viewer"><img src="${esc(s.media_url)}" alt="قصة"><div class="story-meta">${new Date(s.created_at).toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'})}</div><div class="story-nav">${own.length>1?'<button id="storyPrev">‹ السابقة</button><button id="storyNext">التالية ›</button>':''}</div>${currentUser?.id===userId?'<button class="danger wide" id="deleteStory">حذف القصة</button>':''}</div>`);
      if($('storyPrev'))$('storyPrev').onclick=()=>{i=(i-1+own.length)%own.length;render();};
      if($('storyNext'))$('storyNext').onclick=()=>{i=(i+1)%own.length;render();};
      if($('deleteStory'))$('deleteStory').onclick=()=>deleteStory(s);
    }; render();
  }

  async function deleteStory(s){
    if(!confirm('هل تريد حذف هذه القصة؟'))return;
    const {error}=await sb.from('stories').delete().eq('id',s.id).eq('user_id',currentUser.id);
    if(error)return toast('تعذر حذف القصة: '+errorText(error));
    closeModal();toast('تم حذف القصة ✓',true);loadStories();
  }

  async function openEditProfile(){
    try{
      const u=await getUser();if(!u)throw new Error('سجّل الدخول أولًا');
      const {data:p,error}=await sb.from('profiles').select('id,username,display_name,avatar_url,cover_url,bio').eq('id',u.id).single();
      if(error)throw error;
      openModal('✏️ تعديل الملف الشخصي',`<form id="editProfileForm" class="edit-profile-form"><label>الاسم<input id="editDisplayName" maxlength="80" value="${esc(p.display_name||'')}"></label><label>اسم المستخدم<input id="editUsername" maxlength="30" value="${esc(p.username||'')}"><small>حروف إنجليزية وأرقام و _ فقط.</small></label><label>نبذة عنك<textarea id="editBio" maxlength="300">${esc(p.bio||'')}</textarea></label><div class="image-pickers"><label>الصورة الشخصية<input id="editAvatar" type="file" accept="image/*"></label><label>صورة الغلاف<input id="editCover" type="file" accept="image/*"></label></div><button class="primary wide" id="saveProfile">حفظ التعديلات</button><p id="profileMsg"></p></form>`);
      $('editProfileForm').onsubmit=e=>{e.preventDefault();saveProfile(p);};
    }catch(e){toast('تعذر فتح تعديل الملف: '+errorText(e));}
  }

  async function uploadProfileImage(file,u,kind){
    if(!file)return null;
    if(!file.type.startsWith('image/'))throw new Error('اختر صورة صحيحة');
    if(file.size>8*1024*1024)throw new Error('حجم الصورة يجب ألا يتجاوز 8 ميجابايت');
    const path=`${u.id}/${kind}/${crypto.randomUUID()}.${fileExt(file)}`;
    const up=await sb.storage.from('profile-images').upload(path,file,{contentType:file.type,upsert:false,cacheControl:'3600'});
    if(up.error)throw up.error;
    return sb.storage.from('profile-images').getPublicUrl(path).data.publicUrl;
  }

  async function saveProfile(oldProfile){
    const btn=$('saveProfile'),msg=$('profileMsg');btn.disabled=true;btn.textContent='جارٍ الحفظ…';
    try{
      const u=await getUser();
      const display_name=$('editDisplayName').value.trim();
      const username=$('editUsername').value.trim().toLowerCase();
      const bio=$('editBio').value.trim();
      if(display_name.length<2)throw new Error('الاسم يجب أن يكون حرفين على الأقل');
      if(username && !/^[a-z0-9_]{3,30}$/.test(username))throw new Error('اسم المستخدم يجب أن يكون 3-30 حرفًا إنجليزيًا أو رقمًا أو _');
      const patch={display_name,username:username||null,bio:bio||null};
      const av=$('editAvatar').files?.[0],cv=$('editCover').files?.[0];
      if(av)patch.avatar_url=await uploadProfileImage(av,u,'avatar');
      if(cv)patch.cover_url=await uploadProfileImage(cv,u,'cover');
      const {error}=await sb.from('profiles').update(patch).eq('id',u.id);if(error){if(error.code==='23505')throw new Error('اسم المستخدم مستخدم بالفعل');throw error;}
      closeModal();toast('تم حفظ الملف الشخصي ✓',true);
      if(location.pathname.endsWith('profile.html')){setTimeout(()=>location.reload(),350);}else if(window.loadProfile){await window.loadProfile();}
    }catch(e){console.error(e);msg.textContent='تعذر حفظ التعديلات: '+errorText(e);btn.disabled=false;btn.textContent='حفظ التعديلات';}
  }

  function wireProfileButtons(){
    document.addEventListener('click',e=>{
      const b=e.target.closest('.profile-actions button');
      if(b){e.preventDefault(); if(b.textContent.includes('إضافة إلى القصة'))openAddStory(); else if(b.textContent.includes('تعديل الملف الشخصي'))openEditProfile();}
      const tab=e.target.closest('.profile-tabs button');
      if(tab){document.querySelectorAll('.profile-tabs button').forEach(x=>x.classList.remove('active'));tab.classList.add('active');const posts=[...document.querySelectorAll('.profile-post')];if(tab.dataset.tab==='photos')posts.forEach(x=>x.hidden=!x.querySelector('img'));else if(tab.dataset.tab==='groups')posts.forEach(x=>x.hidden=true);else posts.forEach(x=>x.hidden=false);}
    },true);
  }

  async function init(){
    wireProfileButtons();
    if(document.querySelector('.stories')){makeStoryInput();loadStories();}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.madaAddStory=openAddStory;
  window.madaEditProfile=openEditProfile;
})();
