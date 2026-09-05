/* Mada Messenger List Pro — conversation list, last message, unread counts, realtime refresh. */
(function(){
'use strict';
const S=()=>window.MADA_SUPABASE_CLIENT||window.sb,U=()=>window.madaUser?.()||window.user||null;
const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
let channel=null;
async function list(){
 const s=S(),u=U(); if(!s||!u)return;
 const cm=await s.from('conversation_members').select('conversation_id').eq('user_id',u.id);
 if(cm.error){return window.showModal?.('💬 الرسائل','<div class="card empty">تعذر تحميل المحادثات.</div>')}
 const ids=[...new Set((cm.data||[]).map(x=>x.conversation_id))];
 if(!ids.length){window.showModal?.('💬 الرسائل','<div class="mlp-empty">لا توجد محادثات بعد.<br><small>افتح ملف صديق وابدأ محادثة جديدة.</small></div>');return}
 const members=await s.from('conversation_members').select('conversation_id,user_id').in('conversation_id',ids);
 const otherIds=[...new Set((members.data||[]).filter(x=>x.user_id!==u.id).map(x=>x.user_id))];
 const profiles=otherIds.length?await s.from('profiles').select('id,display_name,username,avatar_url').in('id',otherIds):{data:[]};
 const pm=new Map((profiles.data||[]).map(x=>[x.id,x]));
 const last=await Promise.all(ids.map(async cid=>{const r=await s.from('messages').select('id,body,sender_id,created_at,read_at,message_type,deleted_at').eq('conversation_id',cid).order('created_at',{ascending:false}).limit(1).maybeSingle();return [cid,r.data||null]}));
 const unread=await Promise.all(ids.map(async cid=>{const r=await s.from('messages').select('id',{count:'exact',head:true}).eq('conversation_id',cid).neq('sender_id',u.id).is('read_at',null);return [cid,r.count||0]}));
 const lm=new Map(last),um=new Map(unread);
 const rows=ids.map(cid=>{const oid=(members.data||[]).find(x=>x.conversation_id===cid&&x.user_id!==u.id)?.user_id;return {cid,oid,p:pm.get(oid)||{},m:lm.get(cid),unread:um.get(cid)||0}}).sort((a,b)=>new Date(b.m?.created_at||0)-new Date(a.m?.created_at||0));
 const body=`<div class="mlp-search"><input id="mlpSearch" placeholder="🔎 البحث في المحادثات..."></div><div id="mlpList" class="mlp-list">${rows.map(row=>rowHtml(row)).join('')}</div>`;
 window.showModal?.('💬 الرسائل',body);bind(rows);subscribe();
}
function rowHtml(r){const p=r.p||{},m=r.m;let text=m?(m.deleted_at?'تم حذف الرسالة':m.message_type&&m.message_type!=='text'?'📎 ملف':(m.body||'رسالة')):'ابدأ المحادثة';return `<button class="mlp-row" data-open-chat="${esc(r.oid||'')}" data-conversation="${esc(r.cid)}" data-name="${esc((p.display_name||p.username||'').toLowerCase())}"><span class="mlp-avatar">${p.avatar_url?`<img src="${esc(p.avatar_url)}">`:esc((p.display_name||'م').charAt(0))}</span><span class="mlp-main"><b>${esc(p.display_name||p.username||'مستخدم Mada')}</b><small>${esc(text)}</small></span><span class="mlp-side"><time>${m?new Date(m.created_at).toLocaleDateString('ar-EG',{day:'numeric',month:'short'}):''}</time>${r.unread?`<em>${r.unread>99?'99+':r.unread}</em>`:''}</span></button>`}
function bind(rows){const input=document.getElementById('mlpSearch');input?.addEventListener('input',()=>{const q=input.value.trim().toLowerCase();document.querySelectorAll('.mlp-row').forEach(x=>x.hidden=!!q&&!x.dataset.name.includes(q))});}
function subscribe(){const s=S(),u=U();if(!s||!u)return;if(channel)s.removeChannel(channel);channel=s.channel('mada-message-list-'+u.id).on('postgres_changes',{event:'*',schema:'public',table:'messages'},()=>list()).on('postgres_changes',{event:'*',schema:'public',table:'conversation_members'},()=>list()).subscribe()}
function css(){if(document.getElementById('mlp-style'))return;const st=document.createElement('style');st.id='mlp-style';st.textContent=`.mlp-search{padding:4px 0 10px}.mlp-search input{width:100%;box-sizing:border-box;padding:12px 14px;border:1px solid #d8dee8;border-radius:18px;background:transparent;color:inherit}.mlp-list{display:grid;gap:4px;max-height:70vh;overflow:auto}.mlp-row{display:grid;grid-template-columns:48px 1fr auto;gap:10px;align-items:center;border:0;background:transparent;color:inherit;text-align:right;padding:10px 6px;border-radius:14px;cursor:pointer}.mlp-row:hover{background:rgba(127,127,127,.08)}.mlp-row[hidden]{display:none}.mlp-avatar{width:46px;height:46px;border-radius:50%;overflow:hidden;background:#e9eef5;display:grid;place-items:center;font-weight:800}.mlp-avatar img{width:100%;height:100%;object-fit:cover}.mlp-main{display:grid;gap:4px;min-width:0}.mlp-main b,.mlp-main small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mlp-main small{opacity:.65}.mlp-side{display:grid;justify-items:end;gap:5px}.mlp-side time{font-size:10px;opacity:.55}.mlp-side em{font-style:normal;min-width:20px;height:20px;border-radius:10px;background:#1877f2;color:#fff;display:grid;place-items:center;font-size:10px;font-weight:800}.mlp-empty{text-align:center;padding:35px 10px;opacity:.65}`;document.head.appendChild(st)}
css();window.MadaMessengerList={open:list,refresh:list};window.messages=list;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{},300));
})();