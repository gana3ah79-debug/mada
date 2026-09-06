/* Mada Messenger Typing v1 — realtime "يكتب الآن..." */
(()=>{
'use strict';
if(window.__MADA_MESSENGER_TYPING_V1)return;window.__MADA_MESSENGER_TYPING_V1=true;
const S=()=>window.MADA_SUPABASE_CLIENT||window.supabase;
let sb,user,channel,cid,otherId,timer,ready=false;
const qs=s=>document.querySelector(s);
function style(){if(document.getElementById('madaTypingStyle'))return;const s=document.createElement('style');s.id='madaTypingStyle';s.textContent=`.mada-ms-typing{display:none;align-items:center;gap:7px;padding:5px 14px;color:#64748b;font-size:12px;font-weight:800}.mada-ms-typing.show{display:flex}.mada-ms-typing-dots{display:flex;gap:3px}.mada-ms-typing-dots i{width:5px;height:5px;border-radius:50%;background:currentColor;animation:madaTypingDot 1s infinite}.mada-ms-typing-dots i:nth-child(2){animation-delay:.15s}.mada-ms-typing-dots i:nth-child(3){animation-delay:.3s}@keyframes madaTypingDot{0%,60%,100%{transform:translateY(0);opacity:.45}30%{transform:translateY(-4px);opacity:1}}`;document.head.appendChild(s)}
function ensureUI(){const body=qs('#madaMsBody');if(!body)return null;let x=document.getElementById('madaMsTyping');if(!x){x=document.createElement('div');x.id='madaMsTyping';x.className='mada-ms-typing';x.innerHTML='<span class="mada-ms-typing-dots"><i></i><i></i><i></i></span><span>يكتب الآن...</span>';body.parentNode.insertBefore(x,body.nextSibling)}return x}
function show(v){const x=ensureUI();if(x)x.classList.toggle('show',!!v)}
async function setup(id){if(!sb||!user||!id)return;try{const r=await sb.rpc('mada_get_or_create_direct_conversation',{p_other:id});const next=typeof r.data==='string'?r.data:(r.data?.id||r.data?.conversation_id||r.data?.[0]?.id);if(!next)return;cid=next;otherId=id;if(channel)sb.removeChannel(channel);channel=sb.channel('mada-typing-'+cid).on('presence',{event:'sync'},()=>{const state=channel.presenceState();let typing=false;Object.values(state).flat().forEach(x=>{if(x.user_id===id&&x.typing)typing=true});show(typing)}).on('presence',{event:'join'},()=>{}).on('presence',{event:'leave'},()=>{show(false)}).subscribe(async status=>{if(status==='SUBSCRIBED'){ready=true;await channel.track({user_id:user.id,typing:false})}})}catch(e){console.warn('Typing setup failed',e)}}
async function track(v){if(!channel||!ready)return;try{await channel.track({user_id:user.id,typing:v});}catch(e){}}
function bind(){const input=qs('#madaMsInput');if(!input||input.__madaTypingBound)return;input.__madaTypingBound=true;input.addEventListener('input',()=>{if(!cid)return;const v=!!input.value.trim();track(v);clearTimeout(timer);if(v)timer=setTimeout(()=>track(false),1800)});input.addEventListener('blur',()=>{clearTimeout(timer);track(false)});}
function watch(){const list=qs('#madaMsList');if(list&&!list.__madaTypingBound){list.__madaTypingBound=true;list.addEventListener('click',e=>{const b=e.target.closest('.mada-ms-user');if(b)setTimeout(()=>setup(b.dataset.id),350)});list.addEventListener('touchend',e=>{const b=e.target.closest('.mada-ms-user');if(b)setTimeout(()=>setup(b.dataset.id),350)},{passive:true})}bind()}
async function init(){sb=S();if(!sb)return;const s=await sb.auth.getSession();user=s.data?.session?.user;if(!user)return;style();ensureUI();watch();setInterval(watch,700)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
