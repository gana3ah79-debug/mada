(function(){
  const {createClient}=window.supabase;
  const sb=createClient(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY);
  async function isAdmin(){try{const{data:{session}}=await sb.auth.getSession();if(!session)return false;const{data:p}=await sb.from('profiles').select('role,is_banned').eq('id',session.user.id).single();return p?.role==='admin'&&!p.is_banned}catch(e){return false}}
  async function openAdmin(){if(!(await isAdmin()))return alert('هذه الصفحة متاحة للمسؤولين فقط.');window.location.href='admin.html?v=20260906-restore'}
  function addButton(){
    if(document.getElementById('adminInlineBtn'))return true;
    const q=document.querySelector('.quick-grid');if(!q)return false;
    const b=document.createElement('button');b.id='adminInlineBtn';b.type='button';b.className='admin-home-btn';b.innerHTML='<span>⚙️</span><b>لوحة تحكم الأدمن</b>';b.setAttribute('aria-label','لوحة تحكم الأدمن');b.onclick=openAdmin;q.appendChild(b);return true;
  }
  async function init(){if(!(await isAdmin()))return;addButton();const obs=new MutationObserver(()=>addButton());obs.observe(document.body,{childList:true,subtree:true});[300,800,1500,3000].forEach(t=>setTimeout(addButton,t));}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();