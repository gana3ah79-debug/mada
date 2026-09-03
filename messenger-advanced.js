/* Mada Messenger advanced features: video, GIF, emoji, reply, delete, share */
(function(){
  const $=id=>document.getElementById(id), q=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  let sb=null,user=null,current=null,replyTo=null,menu=null;
  const get=()=>{sb=window.sb||sb;user=window.user||user;return sb&&user};
  const toast=m=>window.showToast?window.showToast(m):console.log(m);
  const emojis=['😀','😂','😍','🥰','😘','😎','🤩','😢','😭','😡','🤔','😴','🥳','🤗','👍','👎','👏','🙏','❤️','🔥','🎉','💯','🤣','😅','😉','😇','🤝','💔','✨','🚀','🎁','⚽','🍕','☕','🙌','💪','👀','💙','💚','💛','🖤','🤍','🌹','😱','😮','🤦','🤷'];
  function currentChat(){return window.madaMessengerCurrent||current}
  function ensure(){current=currentChat();if(!get()||!current?.cid)return false;return true}
  function inject(){
    const compose=q('.mm-compose');
    if(!compose||$('mmAdvancedReady'))return;
    const mark=document.createElement('span');mark.id='mmAdvancedReady';mark.hidden=true;compose.appendChild(mark);
    const video=document.createElement('input');video.id='mmVideoInput';video.type='file';video.accept='video/mp4,video/webm,video/quicktime';video.hidden=true;document.body.appendChild(video);
    const gif=document.createElement('input');gif.id='mmGifInput';gif.type='file';gif.accept='image/gif';gif.hidden=true;document.body.appendChild(gif);
    const emoji=document.createElement('button');emoji.id='mmEmoji';emoji.type='button';emoji.textContent='😊';emoji.className='mm-emoji-btn';compose.insertBefore(emoji,compose.firstChild);
    const em=document.createElement('div');em.id='mmEmojiPanel';em.className='mm-emoji-panel';em.hidden=true;em.innerHTML=emojis.map(e=>'<button type="button" data-emoji="'+e+'">'+e+'</button>').join('');compose.appendChild(em);
    const reply=document.createElement('div');reply.id='mmReplyBar';reply.className='mm-reply-bar';reply.hidden=true;reply.innerHTML='<span>↩️ <b id="mmReplyText">رد على الرسالة</b></span><button type="button" id="mmReplyCancel">×</button>';compose.insertBefore(reply,compose.firstChild);
    const picker=document.createElement('div');picker.id='mmAdvancedPicker';picker.className='mm-advanced-picker';picker.hidden=true;picker.innerHTML='<button type="button" id="mmPickVideo">🎬 فيديو</button><button type="button" id="mmPickGif">GIF</button>';compose.appendChild(picker);
    emoji.onclick=e=>{e.stopPropagation();em.hidden=!em.hidden};
    em.onclick=e=>{const b=e.target.closest('[data-emoji]');if(!b)return;const input=$('mmInput');if(input){input.value+=(b.dataset.emoji||'');input.focus()}em.hidden=true};
    $('mmReplyCancel').onclick=clearReply;
    video.onchange=e=>{const f=e.target.files[0];if(f)sendMedia(f,'video');e.target.value=''};
    gif.onchange=e=>{const f=e.target.files[0];if(f)sendMedia(f,'gif');e.target.value=''};
    const plus=$('mmPlus');if(plus&&!plus.dataset.advancedPlus){plus.dataset.advancedPlus='1';plus.addEventListener('click',e=>{e.stopPropagation();picker.hidden=!picker.hidden})}
    $('mmPickVideo').onclick=()=>{$('mmAdvancedPicker').hidden=true;$('mmVideoInput').click()};
    $('mmPickGif').onclick=()=>{$('mmAdvancedPicker').hidden=true;$('mmGifInput').click()};
    const input=$('mmInput');
    if(input&&!input.dataset.advancedSend){input.dataset.advancedSend='1';input.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendText()}}}
    const send=$('mmSend');if(send&&!send.dataset.advancedSend){send.dataset.advancedSend='1';send.onclick=sendText}
    const out=$('mmMessages');if(out&&!out.dataset.advancedBound){out.dataset.advancedBound='1';out.addEventListener('click',messageClick)}
    document.addEventListener('click',closePanels);refreshReplyBar();
  }
  function closePanels(e){if(!e.target.closest('#mmEmoji,#mmEmojiPanel'))$('mmEmojiPanel')?.setAttribute('hidden','');if(!e.target.closest('#mmPlus,#mmAdvancedPicker'))$('mmAdvancedPicker')?.setAttribute('hidden','')}
  async function upload(file){if(file.size>15*1024*1024)throw new Error('الحد الأقصى 15 ميجابايت');const ext=(file.name.split('.').pop()||'bin').toLowerCase().replace(/[^a-z0-9]/g,'')||'bin';const path=user.id+'/'+crypto.randomUUID()+'.'+ext;const {error}=await sb.storage.from('messages-media').upload(path,file,{contentType:file.type||'application/octet-stream',upsert:false});if(error)throw error;return sb.storage.from('messages-media').getPublicUrl(path).data.publicUrl}
  async function sendMedia(file,type){if(!ensure())return;try{const url=await upload(file);const {data,error}=await sb.from('messages').insert({conversation_id:current.cid,sender_id:user.id,body:null,message_type:type,media_url:url,file_name:file.name,file_size:file.size,reply_to_id:replyTo?.id||null}).select('id,conversation_id,sender_id,body,created_at,read_at,message_type,media_url,file_name,file_size,reply_to_id,deleted_at,shared_from_id').single();if(error)throw error;append(data);clearReply()}catch(e){console.error(e);toast('تعذر إرسال '+(type==='video'?'الفيديو':'GIF'))}}
  async function sendText(){if(!ensure())return;const input=$('mmInput'),body=input.value.trim();if(!body)return;try{const {data,error}=await sb.from('messages').insert({conversation_id:current.cid,sender_id:user.id,body,message_type:'text',reply_to_id:replyTo?.id||null}).select('id,conversation_id,sender_id,body,created_at,read_at,message_type,media_url,file_name,file_size,reply_to_id,deleted_at,shared_from_id').single();if(error)throw error;input.value='';input.style.height='auto';append(data);clearReply()}catch(e){console.error(e);toast('تعذر إرسال الرسالة')}}
  function append(m){const out=$('mmMessages');out?.querySelector('.chat-empty')?.remove();const html=window.madaMessengerRenderMessage?window.madaMessengerRenderMessage(m):fallback(m);out?.insertAdjacentHTML('beforeend',html);if(out)out.scrollTop=out.scrollHeight}
  function fallback(m){const mine=m.sender_id===user.id;let c=m.message_type==='video'?'<video class="mm-media-video" controls playsinline src="'+esc(m.media_url)+'"></video>':m.message_type==='gif'?'<img class="mm-media-img" src="'+esc(m.media_url)+'" alt="GIF">':'<div>'+esc(m.body||'')+'</div>';return '<div class="mm-bubble '+(mine?'mine':'theirs')+'" data-message-id="'+esc(m.id)+'">'+c+'<small>الآن'+(mine?'<span class="mm-read">✓</span>':'')+'</small></div>'}
  function messageClick(e){const bubble=e.target.closest('.mm-bubble');if(!bubble||bubble.classList.contains('deleted'))return;const id=bubble.dataset.messageId;if(!id)return;const text=(bubble.innerText||'').replace(/\s+/g,' ').trim().slice(0,80);showMenu(bubble,id,text)}
  function showMenu(bubble,id,text){menu?.remove();menu=document.createElement('div');menu.className='mm-message-menu';const mine=bubble.classList.contains('mine');menu.innerHTML='<button type="button" data-act="reply">↩️ رد</button><button type="button" data-act="share">↗️ مشاركة</button><button type="button" data-act="copy">📋 نسخ</button>'+(mine?'<button type="button" data-act="delete" class="danger">🗑️ حذف</button>':'');document.body.appendChild(menu);const r=bubble.getBoundingClientRect();menu.style.top=Math.max(8,r.top+window.scrollY-menu.offsetHeight-6)+'px';menu.style.left=Math.max(8,Math.min(window.innerWidth-190,r.left+window.scrollX))+'px';menu.onclick=async e=>{const b=e.target.closest('[data-act]');if(!b)return;const act=b.dataset.act;menu.remove();menu=null;if(act==='reply')startReply(id,text);if(act==='share')await shareMessage(id);if(act==='copy')copyMessage(bubble);if(act==='delete')await deleteMessage(id)};}
  async function fetchMessage(id){const {data,error}=await sb.from('messages').select('id,conversation_id,sender_id,body,created_at,read_at,message_type,media_url,file_name,file_size,reply_to_id,deleted_at,shared_from_id').eq('id',id).maybeSingle();if(error)throw error;return data}
  async function startReply(id,text){const m=await fetchMessage(id);if(!m)return;replyTo=m;$('mmReplyText').textContent=(text||preview(m)||'رسالة').slice(0,90);refreshReplyBar();$('mmInput')?.focus()}
  function preview(m){if(m.deleted_at)return 'تم حذف الرسالة';if(m.message_type==='image')return '🖼️ صورة';if(m.message_type==='video')return '🎬 فيديو';if(m.message_type==='gif')return 'GIF';if(m.message_type==='audio')return '🎤 تسجيل صوتي';if(m.message_type==='file')return '📎 ملف';return m.body||''}
  function refreshReplyBar(){const b=$('mmReplyBar');if(b)b.hidden=!replyTo}
  function clearReply(){replyTo=null;refreshReplyBar()}
  async function deleteMessage(id){if(!ensure())return;try{const {error}=await sb.from('messages').update({deleted_at:new Date().toISOString(),deleted_by:user.id}).eq('id',id).eq('sender_id',user.id);if(error)throw error;const row=document.querySelector('[data-message-id="'+CSS.escape(id)+'"]');if(row){row.outerHTML=window.madaMessengerRenderMessage?window.madaMessengerRenderMessage({id,sender_id:user.id,deleted_at:new Date().toISOString(),created_at:new Date().toISOString()}):'<div class="mm-bubble mine deleted" data-message-id="'+esc(id)+'"><div>🚫 تم حذف هذه الرسالة</div></div>'}}catch(e){console.error(e);toast('تعذر حذف الرسالة')}}
  async function shareMessage(id){if(!ensure())return;try{const m=await fetchMessage(id);if(!m)return;const {data,error}=await sb.from('messages').insert({conversation_id:current.cid,sender_id:user.id,body:m.body,message_type:m.message_type||'text',media_url:m.media_url||null,file_name:m.file_name||null,file_size:m.file_size||null,shared_from_id:m.id}).select('id,conversation_id,sender_id,body,created_at,read_at,message_type,media_url,file_name,file_size,reply_to_id,deleted_at,shared_from_id').single();if(error)throw error;append(data)}catch(e){console.error(e);toast('تعذر مشاركة الرسالة')}}
  async function copyMessage(bubble){const t=(bubble.innerText||'').replace(/\n/g,' ').trim();if(!t)return;try{await navigator.clipboard.writeText(t);toast('تم نسخ الرسالة')}catch{toast('لا يمكن النسخ على هذا الجهاز')}}
  function hook(){if(q('.mm-chat:not([hidden])')||q('.mm-compose'))inject()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hook);else hook();[300,800,1500,3000,5000].forEach(ms=>setTimeout(hook,ms));
  const observer=new MutationObserver(()=>hook());observer.observe(document.documentElement,{childList:true,subtree:true});
  window.madaMessengerAdvanced={afterLoad(){setTimeout(inject,0)},afterMessage(){inject()}};
})();