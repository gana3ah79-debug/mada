/* Mada profile photo controls v1 */
(function(){
  'use strict';
  const STYLE_ID='mada-profile-photo-edit-style-v1';
  const CSS=`
    #modal .profile-photo-edit{position:absolute;display:flex;align-items:center;justify-content:center;width:34px;height:34px;border:2px solid #fff;border-radius:50%;background:#1877f2;color:#fff;box-shadow:0 3px 10px rgba(0,0,0,.22);cursor:pointer;z-index:8;font-size:16px;padding:0}
    #modal .profile-avatar-wrap{position:relative;width:max-content;margin:-48px auto 0;z-index:6}
    #modal .profile-avatar-wrap .profile-avatar{margin:0}
    #modal .profile-avatar-wrap .profile-photo-edit{right:-2px;bottom:2px}
    #modal .profile-cover-wrap{position:relative}
    #modal .profile-cover-wrap .profile-photo-edit{left:14px;bottom:14px}
    #modal .edit-profile{padding:10px}
    #modal .edit-profile label{display:flex;flex-direction:column;gap:8px;padding:12px;margin:10px 0;background:#f5f7fa;border:1px solid #e4e6eb;border-radius:14px;font-weight:700;color:#1c1e21}
    #modal .edit-profile input[type=file]{display:block;width:100%;padding:10px;background:#fff;border:1px dashed #1877f2;border-radius:10px;box-sizing:border-box}
    #modal .edit-photo-preview{display:none;width:100%;max-height:180px;object-fit:cover;border-radius:12px;margin-top:8px}
  `;
  function style(){if(document.getElementById(STYLE_ID))return;const s=document.createElement('style');s.id=STYLE_ID;s.textContent=CSS;document.head.appendChild(s)}
  function waitFor(selector,cb){let n=0;const t=setInterval(()=>{const el=document.querySelector(selector);if(el){clearInterval(t);cb(el)}else if(++n>30)clearInterval(t)},80)}
  function openEditor(type){
    const edit=document.getElementById('editProfile');
    if(!edit)return;
    edit.click();
    waitFor(type==='avatar'?'#editAvatar':'#editCover',input=>input.click());
  }
  function decorate(root){
    if(!root||root.dataset.photoEditBound==='1')return;
    const edit=document.getElementById('editProfile');
    if(!edit)return;
    root.dataset.photoEditBound='1';
    const cover=root.querySelector('.cover');
    if(cover&&!cover.parentElement.classList.contains('profile-cover-wrap')){
      const wrap=document.createElement('div');wrap.className='profile-cover-wrap';cover.parentNode.insertBefore(wrap,cover);wrap.appendChild(cover);
      const b=document.createElement('button');b.type='button';b.className='profile-photo-edit';b.title='تعديل صورة الغلاف';b.setAttribute('aria-label','تعديل صورة الغلاف');b.textContent='📷';b.onclick=()=>openEditor('cover');wrap.appendChild(b);
    }
    const avatar=root.querySelector('.profile-avatar');
    if(avatar&&!avatar.parentElement.classList.contains('profile-avatar-wrap')){
      const wrap=document.createElement('div');wrap.className='profile-avatar-wrap';avatar.parentNode.insertBefore(wrap,avatar);wrap.appendChild(avatar);
      const b=document.createElement('button');b.type='button';b.className='profile-photo-edit';b.title='تعديل صورة الملف الشخصي';b.setAttribute('aria-label','تعديل صورة الملف الشخصي');b.textContent='📷';b.onclick=()=>openEditor('avatar');wrap.appendChild(b);
    }
  }
  function decorateEdit(){
    const a=document.getElementById('editAvatar'),c=document.getElementById('editCover');
    if(!a&&!c)return;
    [a,c].forEach(input=>{if(!input||input.dataset.photoPreview==='1')return;input.dataset.photoPreview='1';const img=document.createElement('img');img.className='edit-photo-preview';input.parentElement.appendChild(img);input.addEventListener('change',()=>{const f=input.files&&input.files[0];if(!f){img.style.display='none';return}img.src=URL.createObjectURL(f);img.style.display='block'})});
  }
  function scan(){style();decorate(document.querySelector('#modal .profile-page'));decorateEdit()}
  new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',scan);
  setTimeout(scan,500);
})();
