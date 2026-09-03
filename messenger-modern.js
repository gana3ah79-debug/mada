/* Mada Messenger - modern Messenger-style UI */
(function(){
  const $=id=>document.getElementById(id), esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  let sb=null,user=null,channel=null,current=null;
  const get=()=>{sb=window.sb||sb;user=window.user||user;return sb&&user};
  const toast=m=>window.showToast?window.showToast(m):console.log(m);
  function avatar(p){return p?.avatar_url?'<img src="'+esc(p.avatar_url)+'" alt="">':esc((p?.display_name||p?.username||'م').charAt(0))}
  function shell(){
    let o=$('madaMessenger'); if(o){o.hidden=false;loadConversations();return o}
    o=document.createElement('div');o.id='madaMessenger';o.className='mada-messenger';
    o.innerHTML='<div class="mm-head"><button id="mmBack" type="button">←</button><div><b>الرسائل</b><small>محادثاتك في Mada</small></div><button id="mmNew" type="button">✎</button></div><div class="mm-search"><span>⌕</span><input id="mmFilter" placeholder="ابحث في المحادثات" autocomplete="off"></div><div id="mmList" class="mm-list"></div><div id="mmChat" class="mm-chat" hidden><div class="mm-chat-head"><button id="mmChatBack" type="button">←</button><div id="mmChatUser" class="mm-chat-user"></div><button id="mmChatMore" type="button">⋯</button></div><div id="mmMessages" class="mm-messages"></div><div class="mm-compose"><button id="mmPlus" type="button">＋</button><textarea id="mmInput" rows="1" placeholder="اكتب رسالة..." maxlength="5000"></textarea><button id="mmSend" type="button">➤</button></div></div>';
    document.body.appendChild(o);
    $('mmBack').onclick=close; $('mmChatBack').onclick=()=>showList(); $('mmNew').onclick=()=>{window.madaSearchFix?.();};
    $('mmFilter').oninput=e=>filterList(e.target.value); $('mmSend').onclick=send; $('mmInput').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}};
    loadConversations();return o;
  }
  function close(){if(channel){sb?.removeChannel(channel);channel=null}const o=$('madaMessenger');if(o)o.hidden=true}
  async function loadConversations(){
    if(!get())return;const list=$('mmList');if(!list)return;list.innerHTML='<div class="mm-loading">جاري تحميل المحادثات…</div>';
    try{
      const {data:members,error}=await sb.from('conversation_members').select('conversation_id,user_id').eq('user_id',user.id);if(error)throw error;
      const ids=(members||[]).map(x=>x.conversation_id);if(!ids.length){list.innerHTML='<div class="mm-empty"><div>💬</div><b>لا توجد محادثات</b><span>ابدأ محادثة من زر البحث 🔎</span></div>';return}
      const {data:all,error:e2}=await sb.from('conversation_members').select('conversation_id,user_id').in('conversation_id',ids);if(e2)throw e2;
      const other=[...new Set((all||[]).filter(x=>x.user_id!==user.id).map(x=>x.user_id))];
      const {data:people,error:e3}=other.length?await sb.from('profiles').select('id,username,display_name,avatar_url').in('id',other):{data:[],error:null};if(e3)throw e3;
      const pmap=new Map((people||[]).map(p=>[p.id,p]));const convMap=new Map();
      (all||[]).forEach(x=>{if(x.user_id!==user.id&&!convMap.has(x.conversation_id))convMap.set(x.conversation_id,pmap.get(x.user_id)||{id:x.user_id,display_name:'مستخدم Mada'})});
      const {data:msgs}=await sb.from('messages').select('id,conversation_id,sender_id,body,created_at').in('conversation_id',ids).order('created_at',{ascending:false}).limit(100);
      const latest=new Map();(msgs||[]).forEach(m=>{if(!latest.has(m.conversation_id))latest.set(m.conversation_id,m)});
      const rows=ids.map(cid=>({cid,p:convMap.get(cid),m:latest.get(cid)})).filter(x=>x.p);
      list.innerHTML=rows.map(x=>'<button class="mm-row" type="button" data-cid="'+esc(x.cid)+'" data-uid="'+esc(x.p.id)+'"><span class="mm-avatar">'+avatar(x.p)+'</span><span class="mm-info"><b>'+esc(x.p.display_name||'مستخدم Mada')+'</b><small>@'+esc(x.p.username||'')+'</small><em>'+esc(x.m?.body||'ابدأ المحادثة')+'</em></span><span class="mm-time">'+time(x.m?.created_at)+'</span></button>').join('');
      list.querySelectorAll('.mm-row').forEach(r=>r.onclick=()=>openChat(r.dataset.uid,r.dataset.cid));
    }catch(e){console.error(e);list.innerHTML='<div class="mm-empty"><b>تعذر تحميل الرسائل</b><span>تحقق من الاتصال وحاول مرة أخرى</span></div>'}
  }
  function filterList(q){document.querySelectorAll('.mm-row').forEach(r=>r.style.display=r.innerText.toLowerCase().includes(q.toLowerCase())?'flex':'none')}
  function time(v){if(!v)return '';try{return new Date(v).toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'})}catch{return ''}}
  async function openChat(uid,cid){
    if(!get())return;current={uid,cid};$('mmList').parentElement.querySelector('.mm-search').hidden=true;$('mmList').hidden=true;$('mmChat').hidden=false;
    const {data:p}=await sb.from('profiles').select('id,username,display_name,avatar_url').eq('id',uid).maybeSingle();const pu=p||{display_name:'مستخدم Mada'};
    $('mmChatUser').innerHTML='<span class="mm-avatar">'+avatar(pu)+'</span><span><b>'+esc(pu.display_name)+'</b><small>@'+esc(pu.username||'')+'</small></span>';
    await loadMessages();subscribe();setTimeout(()=>$('mmInput')?.focus(),100);
  }
  function showList(){if(channel){sb?.removeChannel(channel);channel=null}current=null;$('mmChat').hidden=true;$('mmList').hidden=false;$('mmList').parentElement.querySelector('.mm-search').hidden=false;loadConversations()}
  async function loadMessages(){
    const out=$('mmMessages');out.innerHTML='<div class="mm-loading">جاري تحميل الرسائل…</div>';
    const {data,error}=await sb.from('messages').select('id,sender_id,body,created_at').eq('conversation_id',current.cid).order('created_at',{ascending:true}).limit(300);if(error){out.innerHTML='<div class="mm-empty">تعذر تحميل المحادثة</div>';return}
    out.innerHTML=(data||[]).map(messageHtml).join('')||'<div class="mm-empty chat-empty"><div>👋</div><b>ابدأ المحادثة</b><span>قل مرحباً!</span></div>';scrollBottom();
  }
  function messageHtml(m){const mine=m.sender_id===user.id;return '<div class="mm-bubble '+(mine?'mine':'theirs')+'"><div>'+esc(m.body||'')+'</div><small>'+time(m.created_at)+'</small></div>'}
  function subscribe(){if(channel)sb.removeChannel(channel);channel=sb.channel('mada-chat-'+current.cid).on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:'conversation_id=eq.'+current.cid},p=>{if(p.new.sender_id!==user.id){const out=$('mmMessages');out.querySelector('.chat-empty')?.remove();out.insertAdjacentHTML('beforeend',messageHtml(p.new));scrollBottom();toast('وصلتك رسالة جديدة 💬')}}).subscribe()}
  async function send(){if(!get()||!current)return;const input=$('mmInput'),body=input.value.trim();if(!body)return;const btn=$('mmSend');btn.disabled=true;try{const {data,error}=await sb.from('messages').insert({conversation_id:current.cid,sender_id:user.id,body}).select('id,sender_id,body,created_at').single();if(error)throw error;input.value='';$('mmMessages').insertAdjacentHTML('beforeend',messageHtml(data));scrollBottom()}catch(e){console.error(e);toast('تعذر إرسال الرسالة')}finally{btn.disabled=false}}
  function scrollBottom(){const x=$('mmMessages');if(x)setTimeout(()=>x.scrollTop=x.scrollHeight,20)}
  function bind(){const b=$('msgBtn');if(!b||b.dataset.mmBound==='1')return;b.dataset.mmBound='1';b.onclick=e=>{e.preventDefault();e.stopImmediatePropagation();shell()};}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();[300,800,1500,3000].forEach(ms=>setTimeout(bind,ms));
  window.madaMessenger=shell;window.madaMessengerClose=close;
})();