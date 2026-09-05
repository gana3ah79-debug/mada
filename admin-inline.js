(function(){
  const {createClient}=window.supabase; const sb=createClient(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY);
  async function isAdmin(){const{data:{session}}=await sb.auth.getSession();if(!session)return false;const{data:p}=await sb.from('profiles').select('role,is_banned').eq('id',session.user.id).single();return p?.role==='admin'&&!p.is_banned}
  async function openAdmin(){if(!(await isAdmin()))return alert('هذه الصفحة متاحة للمسؤولين فقط.');window.location.href='admin.html?v=20260906-restore'}
  window.MadaAdminInline={open:openAdmin};
  document.addEventListener('DOMContentLoaded',async()=>{if(!(await isAdmin()))return;const q=document.querySelector('.quick-grid');if(q&&!document.getElementById('adminInlineBtn')){const b=document.createElement('button');b.id='adminInlineBtn';b.type='button';b.innerHTML='<span>⚙️</span>لوحة الإدارة';b.onclick=openAdmin;q.appendChild(b)}});
})();