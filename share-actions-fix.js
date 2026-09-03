/* Mada share sheet actions: make the two compact utility buttons useful on mobile. */
(function(){
  function setup(){
    const sheet=document.getElementById('share-modal');
    if(!sheet||sheet.dataset.actionsReady==='1')return;
    sheet.dataset.actionsReady='1';
    const extras=sheet.querySelectorAll('.share-extra button');
    const tagBtn=extras[0],emojiBtn=extras[1];
    if(tagBtn){
      tagBtn.type='button';tagBtn.title='مشاركة من الهاتف';tagBtn.setAttribute('aria-label','مشاركة من الهاتف');
      tagBtn.textContent='↗';
      tagBtn.onclick=async function(){
        const title='مشاركة منشور من Mada';
        const text=(document.getElementById('share-quote')?.value||'').trim()||'شاهد هذا المنشور على Mada';
        try{
          if(navigator.share){await navigator.share({title,text,url:location.href});}
          else if(navigator.clipboard){await navigator.clipboard.writeText(location.href);if(typeof window.madaMessage==='function')window.madaMessage('تم نسخ رابط Mada');}
        }catch(e){if(e?.name!=='AbortError')console.warn('native share unavailable',e)}
      };
    }
    if(emojiBtn){
      emojiBtn.type='button';emojiBtn.title='إضافة تعبير';emojiBtn.setAttribute('aria-label','إضافة تعبير');emojiBtn.textContent='😊';
      emojiBtn.onclick=function(){
        let menu=sheet.querySelector('.share-emoji-menu');
        if(!menu){
          menu=document.createElement('div');menu.className='share-emoji-menu';menu.hidden=true;
          ['❤️','😂','😍','🔥','👏','😮'].forEach(function(em){
            const b=document.createElement('button');b.type='button';b.textContent=em;b.dataset.emoji=em;
            b.onclick=function(){const ta=document.getElementById('share-quote');if(ta){const a=ta.selectionStart??ta.value.length,z=ta.selectionEnd??a;ta.value=ta.value.slice(0,a)+em+ta.value.slice(z);ta.focus();ta.setSelectionRange(a+em.length,a+em.length);}menu.hidden=true;};menu.appendChild(b);
          });
          sheet.querySelector('.share-sheet-actions')?.appendChild(menu);
        }
        menu.hidden=!menu.hidden;
      };
    }
  }
  const mo=new MutationObserver(setup);mo.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();
