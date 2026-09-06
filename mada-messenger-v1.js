/* Mada Messenger v1 — single active Messenger UI */
(()=>{
'use strict';
if(window.__MADA_MESSENGER_V1)return;window.__MADA_MESSENGER_V1=true;
const S=()=>window.MADA_SUPABASE_CLIENT||window.supabase;
let sb,user,channel,activeId=null,activeName='',activeCid=null,friendCache=[];
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
const ini=n=>(n||'م').trim().charAt(0);
const mobile=()=>window.matchMedia&&window.matchMedia('(max-width:720px)').matches;
function toast(t){const x=document.createElement('div');x.className='mada-ms-toast';x.textContent=t;document.body.appendChild(x);setTimeout(()=>x.remove(),2800)}
async function friends(){
 const f=await sb.from('friendships').select('requester_id,addressee_id').or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`).eq('status','accepted');
 if(f.error){console.error(f.error);toast('تعذر تحميل الأصدقاء');return[]}
 const ids=(f.data||[]).map(x=>x.requester_id===user.id?x.addressee_id:x.requester_id);
 if(!ids.length)return[];
 const p=await sb.from('profiles').select('id,display_name,avatar_url').in('id',ids);
 if(p.error){console.error(p.error);toast('تعذر تحميل ملفات الأصدقاء');return[]}
 return p.data||[];
}
function shell(){
 document.querySelector('.mada-messenger-overlay')?.remove();
 const o=document.createElement('div');o.className='mada-messenger-overlay';
 o.innerHTML=`<div class="mada-messenger"><aside class="mada-ms-side"><div class="mada-ms-brand"><span>💬</span><b>Mada Messenger</b></div><div class="mada-ms-tools"><button id="madaMsFriends" class="active" type="button">👥 الأصدقاء</button><button id="madaMsNew" type="button">✚ محادثة</button></div><input class="mada-ms-search" id="madaMsSearch" placeholder="ابحث عن صديق…"><div class="mada-ms-list" id="madaMsList"></div></aside><section class="mada-ms-chat"><header class="mada-ms-head"><button class="back" id="madaMsBack" type="button">‹</button><div class="mada-ms-avatar" id="madaMsHeadAvatar">م</div><div class="mada-ms-head-info"><b id="madaMsHeadName">اختر صديقًا</b><div class="mada-ms-status" id="madaMsStatus">متصل داخل Mada</div></div><button class="mada-ms-head-action" id="madaMsCall" title="اتصال" type="button">📞</button><button class="mada-ms-buzz" id="madaMsBuzz" title="Buzz" type="button">📳</button></header><div class="mada-ms-body" id="madaMsBody"><div class="mada-ms-empty"><strong>Mada Messenger</strong><span>اختر صديقًا لبدء المحادثة أو أرسل له Buzz 🔔</span></div></div><div class="mada-ms-compose"><button class="mada-ms-emoji" id="madaMsEmoji" title="إيموجي" type="button">😊</button><input id="madaMsInput" placeholder="اكتب رسالة…"><button id="madaMsSend" type="button">إرسال</button><div class="mada-ms-emoji-panel" id="madaMsEmojiPanel">😀 😃 😄 😁 😆 😅 😂 🤣 😊 😍 🥰 😘 😎 🤩 🥳 😢 😭 😡 😱 👍 👎 ❤️ 💙 💚 💛 🔥 🎉 👏 🙏 😂 🤔 😉</div></div></section></div>`;
 document.body.appendChild(o);
 o.addEventListener('click',e=>{if(e.target===o)close()});
 $('madaMsFriends').onclick=()=>{document.querySelectorAll('.mada-ms-tools button').forEach(b=>b.classList.remove('active'));$('madaMsFriends').classList.add('active');renderList()};
 $('madaMsNew').onclick=()=>{$('madaMsSearch').focus();document.querySelectorAll('.mada-ms-tools button').forEach(b=>b.classList.remove('active'));$('madaMsNew').classList.add('active');toast('ابحث عن صديق لبدء محادثة')};
 $('madaMsBack').onclick=()=>{if(mobile()){$('.mada-ms-chat').style.display='none';$('.mada-ms-side').style.display='flex'}};
 $('madaMsEmoji').onclick=()=>$('madaMsEmojiPanel').classList.toggle('show');
 $('madaMsEmojiPanel').onclick=e=>{if(e.target===e.currentTarget)return;const i=$('madaMsInput');i.value+=e.target.textContent;i.focus()};
 $('madaMsCall').onclick=()=>{if(!activeId)return toast('اختر صديقًا أولًا');toast('📞 الاتصال الصوتي سيتم تفعيله قريبًا')};
 return o;
}
function close(){if(channel){sb.removeChannel(channel);channel=null}document.querySelector('.mada-messenger-overlay')?.remove();activeId=null;activeCid=null}
async function renderList(){
 const list=$('madaMsList');if(!list)return;friendCache=await friends();
 const draw=arr=>{list.innerHTML=arr.length?arr.map(p=>`<button type="button" class="mada-ms-user" data-id="${p.id}" data-name="${esc(p.display_name)}"><div class="mada-ms-avatar">${p.avatar_url?`<img src="${esc(p.avatar_url)}" alt="">`:ini(p.display_name)}<i class="mada-ms-online"></i></div><div class="mada-ms-user-info"><b>${esc(p.display_name)}</b><small>صديق · مراسلة الآن</small></div></button>`).join(''):`<div class="mada-ms-empty">لا يوجد أصدقاء بعد.<br><small>أضف أصدقاء من صفحة الأصدقاء في Mada.</small></div>`;
 list.querySelectorAll('.mada-ms-user').forEach(b=>{b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();open(b.dataset.id,b.dataset.name)},{passive:false})});
 };
 draw(friendCache);
 const search=$('madaMsSearch');if(search)search.oninput=()=>{const q=search.value.trim().toLowerCase();draw(friendCache.filter(x=>(x.display_name||'').toLowerCase().includes(q)))};
}
async function getConversation(other){
 const rpc=await sb.rpc('mada_get_or_create_direct_conversation',{p_other:other});
 if(!rpc.error&&rpc.data){const id=typeof rpc.data==='string'?rpc.data:(rpc.data.id||rpc.data.conversation_id||rpc.data[0]?.id||rpc.data[0]?.conversation_id);if(id)return id}
 if(rpc.error)console.warn('Mada conversation RPC:',rpc.error);
 // Fallback for databases where the RPC is unavailable.
 const mine=await sb.from('conversation_members').select('conversation_id').eq('user_id',user.id);
 if(mine.error)throw mine.error;
 for(const row of mine.data||[]){const x=await sb.from('conversation_members').select('conversation_id').eq('conversation_id',row.conversation_id).eq('user_id',other).maybeSingle();if(x.data?.conversation_id)return x.data.conversation_id}
 const c=await sb.from('conversations').insert({is_group:false}).select('id').single();
 if(c.error)throw c.error;
 const add=await sb.from('conversation_members').insert([{conversation_id:c.data.id,user_id:user.id},{conversation_id:c.data.id,user_id:other}]);
 if(add.error)throw add.error;
 return c.data.id;
}
async function open(other,name){
 if(!other||!user)return;
 activeId=other;activeName=name||'مستخدم Mada';
 // Give instant visual feedback on mobile instead of waiting on the database.
 if(mobile()){$('.mada-ms-side').style.display='none';$('.mada-ms-chat').style.display='flex'}
 $('madaMsHeadName').textContent=activeName;$('madaMsHeadAvatar').textContent=ini(activeName);$('madaMsStatus').textContent='جاري فتح المحادثة…';
 document.querySelectorAll('.mada-ms-user').forEach(x=>x.classList.toggle('active',x.dataset.id===other));
 const body=$('madaMsBody');if(body)body.innerHTML='<div class="mada-ms-empty"><strong>جاري فتح المحادثة…</strong><span>لحظة واحدة</span></div>';
 try{activeCid=await getConversation(other)}catch(e){console.error('Mada Messenger open error',e);if(body)body.innerHTML='<div class="mada-ms-empty"><strong>تعذر فتح المحادثة</strong><span>اضغط رجوع ثم جرّب مرة أخرى.</span></div>';toast('تعذر فتح المحادثة: '+(e?.message||'خطأ غير معروف'));return}
 $('madaMsStatus').textContent='متصل داخل Mada';
 const r=await sb.from('messages').select('id,sender_id,body,created_at,message_type,read_at').eq('conversation_id',activeCid).is('deleted_at',null).order('created_at',{ascending:true}).limit(300);
 if(r.error){console.error(r.error);return toast('تعذر تحميل الرسائل: '+(r.error.message||''))}
 body.innerHTML='';(r.data||[]).forEach(m=>renderMessage(m,false));await markRead();
 if(channel)sb.removeChannel(channel);
 channel=sb.channel('mada-messenger-'+activeCid).on('postgres_changes',{event:'*',schema:'public',table:'messages',filter:`conversation_id=eq.${activeCid}`},async p=>{if(p.eventType==='INSERT'&&p.new.sender_id!==user.id){renderMessage(p.new,true);await markRead()}if(p.eventType==='UPDATE'&&p.new.sender_id===user.id)updateCheck(p.new)}).subscribe();
 $('madaMsSend').onclick=()=>send(activeCid);$('madaMsInput').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send(activeCid)}};$('madaMsBuzz').onclick=()=>sendBuzz(activeCid);
}
function check(m){if(m.sender_id!==user.id)return'';return `<span class="mada-ms-check ${m.read_at?'read':''}" title="${m.read_at?'تمت القراءة':'تم الإرسال'}">✓✓</span>`}
function renderMessage(m,incoming){const b=$('madaMsBody');if(!b)return;const d=document.createElement('div');d.dataset.messageId=m.id;if(m.message_type==='buzz'){d.className='mada-ms-msg buzz'+(incoming?' incoming':'');d.innerHTML=`📳 <b>${m.sender_id===user.id?'أرسلت Buzz':'وصلك Buzz من '+esc(activeName)}</b>${check(m)}<span class="mada-ms-time">${new Date(m.created_at).toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'})}</span>`}else{d.className='mada-ms-msg '+(m.sender_id===user.id?'mine':'theirs');d.innerHTML=`${esc(m.body)}${check(m)}<span class="mada-ms-time">${new Date(m.created_at).toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'})}</span>`}b.appendChild(d);b.scrollTop=b.scrollHeight;if(incoming&&m.message_type==='buzz'){if(navigator.vibrate)navigator.vibrate([100,50,100,50,250]);toast('📳 وصلك Buzz من '+activeName)}}
function updateCheck(m){const d=document.querySelector(`[data-message-id="${m.id}"] .mada-ms-check`);if(d){d.classList.toggle('read',!!m.read_at);d.title=m.read_at?'تمت القراءة':'تم الإرسال'}}
async function markRead(){if(!activeCid)return;const r=await sb.rpc('mada_mark_messages_read',{p_conversation_id:activeCid});if(r.error)console.warn('read receipt',r.error)}
async function send(cid){const i=$('madaMsInput'),body=i?.value.trim();if(!body)return;const r=await sb.from('messages').insert({conversation_id:cid,sender_id:user.id,body,message_type:'text'});if(r.error)return toast('تعذر إرسال الرسالة: '+(r.error.message||''));i.value='';$('madaMsEmojiPanel').classList.remove('show')}
async function sendBuzz(cid){const r=await sb.from('messages').insert({conversation_id:cid,sender_id:user.id,body:'Buzz',message_type:'buzz'});if(r.error)return toast('تعذر إرسال Buzz: '+(r.error.message||''));buzzEffect();toast('📳 تم إرسال Buzz إلى '+activeName)}
function buzzEffect(){const m=document.querySelector('.mada-messenger');if(!m)return;m.classList.remove('mada-buzz-shake');void m.offsetWidth;m.classList.add('mada-buzz-shake');if(navigator.vibrate)navigator.vibrate([80,40,80,40,180])}
async function start(){sb=S();if(!sb)return toast('محرك Supabase غير جاهز');const s=await sb.auth.getSession();user=s.data?.session?.user;if(!user)return toast('سجّل الدخول أولًا');shell();await renderList()}
window.MadaMessenger={open:start,openFriend:open,close};
document.addEventListener('click',e=>{if(e.target.closest('#msgBtn,#msgBtn2,[data-messenger-open]')){e.preventDefault();e.stopImmediatePropagation();start()}},true);
})();
