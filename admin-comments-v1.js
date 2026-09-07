(()=>{
  const sb=window.supabase.createClient(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY);
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const $=id=>document.getElementById(id);
  let page=0,pageSize=50,total=0,loading=false;
  function addTab(){
    const aside=document.querySelector('aside'); if(!aside||aside.querySelector('[data-admin-comments-tab]')) return;
    const sep=document.createElement('div'); sep.className='more-sep'; sep.textContent='إدارة المحتوى';
    const anchor=aside.querySelector('[data-more-tab="notifications"]')||aside.lastElementChild;
    if(anchor) aside.insertBefore(sep,anchor);
    const b=document.createElement('button'); b.type='button'; b.dataset.adminCommentsTab='1'; b.innerHTML='<i>💬</i> التعليقات';
    b.onclick=()=>render(); aside.insertBefore(b,sep.nextSibling);
  }
  function styles(){
    if($('adminCommentsStyles')) return;
    const s=document.createElement('style'); s.id='adminCommentsStyles'; s.textContent=`
      .ac-toolbar{display:grid;grid-template-columns:minmax(180px,1fr) 150px auto;gap:8px;margin:12px 0}
      .ac-toolbar input,.ac-toolbar select{width:100%;padding:10px 12px;border:1px solid #dce3ec;border-radius:11px;background:#fff}
      .ac-list{display:grid;gap:9px}.ac-item{border:1px solid #e2e8f0;border-radius:14px;padding:12px;background:#fff}
      .ac-head{display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap}.ac-author{font-weight:900}.ac-meta{font-size:12px;color:#7b8798}
      .ac-body{white-space:pre-wrap;word-break:break-word;margin:9px 0;line-height:1.6}.ac-actions{display:flex;gap:7px;flex-wrap:wrap}.ac-actions button{border:0;border-radius:9px;padding:8px 10px;font-weight:800;cursor:pointer}
      .ac-danger{background:#fff0f0;color:#b42318}.ac-pin{background:#eef4ff;color:#2563eb}.ac-muted{background:#eef2f7;color:#334155}.ac-badge{display:inline-block;padding:4px 8px;border-radius:999px;font-size:11px;font-weight:900;background:#fff7df;color:#8a5a00}
      .ac-pager{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:12px}.ac-pager button{border:0;border-radius:9px;padding:8px 13px;font-weight:800}.ac-pager button:disabled{opacity:.45}
      body.dark .ac-toolbar input,body.dark .ac-toolbar select,body.dark .ac-item{background:#121d30;border-color:#2b3b55;color:#edf3ff}
      @media(max-width:650px){.ac-toolbar{grid-template-columns:1fr 1fr}.ac-toolbar input{grid-column:1/-1}}
    `;document.head.appendChild(s);
  }
  async function render(){
    styles(); page=0; await load();
    document.querySelectorAll('aside button').forEach(b=>b.classList.toggle('active',b.dataset.adminCommentsTab==='1'));
  }
  async function load(){
    if(loading)return; loading=true;
    $('content').innerHTML='<div class="card"><h2>💬 إدارة التعليقات</h2><p>جاري تحميل التعليقات…</p></div>';
    const from=page*pageSize,to=from+pageSize-1;
    const r=await sb.from('comments').select('id,post_id,author_id,parent_comment_id,body,created_at,edited_at,is_pinned',{count:'exact'}).order('is_pinned',{ascending:false}).order('created_at',{ascending:false}).range(from,to);
    if(r.error){$('content').innerHTML=`<div class="card"><h2>💬 إدارة التعليقات</h2><p class="danger">تعذر تحميل التعليقات: ${esc(r.error.message)}</p></div>`;loading=false;return}
    total=r.count||0;
    const rows=r.data||[], userIds=[...new Set(rows.map(x=>x.author_id).filter(Boolean))], postIds=[...new Set(rows.map(x=>x.post_id).filter(Boolean))];
    const [pr,po]=await Promise.all([
      userIds.length?sb.from('profiles').select('id,display_name,username').in('id',userIds):Promise.resolve({data:[]} ),
      postIds.length?sb.from('posts').select('id,body').in('id',postIds):Promise.resolve({data:[]} )
    ]);
    const users=Object.fromEntries((pr.data||[]).map(x=>[x.id,x]));
    const posts=Object.fromEntries((po.data||[]).map(x=>[x.id,x]));
    $('content').innerHTML=`<div class="admin-title"><div><h2>💬 إدارة التعليقات</h2><small>${total} تعليق — صفحة ${page+1}</small></div><button class="ac-muted" id="acRefresh">↻ تحديث</button></div>
      <div class="card"><div class="ac-toolbar"><input id="acSearch" placeholder="🔎 بحث في التعليقات والاسم"><select id="acFilter"><option value="all">كل التعليقات</option><option value="pinned">📌 المثبتة</option><option value="replies">↩️ الردود</option><option value="top">💬 الرئيسية</option></select><button class="ac-muted" id="acClear">مسح البحث</button></div>
      <div id="acList" class="ac-list">${rows.map(x=>row(x,users[x.author_id],posts[x.post_id])).join('')||'<div class="empty">لا توجد تعليقات.</div>'}</div>
      <div class="ac-pager"><button id="acPrev">السابق</button><span>${page+1} / ${Math.max(1,Math.ceil(total/pageSize))}</span><button id="acNext">التالي</button></div></div>`;
    $('acPrev').disabled=page===0;$('acNext').disabled=from+rows.length>=total;
    $('acRefresh').onclick=()=>load();$('acPrev').onclick=async()=>{if(page){page--;await load()}};$('acNext').onclick=async()=>{if(from+rows.length<total){page++;await load()}};
    $('acSearch').oninput=filter;$('acFilter').onchange=filter;$('acClear').onclick=()=>{$('acSearch').value='';$('acFilter').value='all';filter()};
    loading=false;
  }
  function row(x,u,p){
    const name=u?.display_name||u?.username||x.author_id||'مستخدم';
    const post=(p?.body||'').trim().replace(/\s+/g,' '); const postPreview=post?post.slice(0,90)+(post.length>90?'…':''):'منشور بدون نص';
    return `<article class="ac-item" data-search="${esc((name+' '+(u?.username||'')+' '+(x.body||'')+' '+post).toLowerCase())}" data-pinned="${!!x.is_pinned}" data-reply="${!!x.parent_comment_id}">
      <div class="ac-head"><div><span class="ac-author">${esc(name)}</span>${u?.username?` <span class="ac-meta">@${esc(u.username)}</span>`:''} ${x.is_pinned?'<span class="ac-badge">📌 مثبت</span>':''}</div><span class="ac-meta">${new Date(x.created_at).toLocaleString('ar-EG')}${x.edited_at?' · معدل':''}</span></div>
      <div class="ac-body">${esc(x.body||'')}</div><div class="ac-meta">${x.parent_comment_id?'↩️ رد':'💬 تعليق رئيسي'} · المنشور: ${esc(postPreview)}</div>
      <div class="ac-actions"><button class="ac-pin" onclick="window.madaAdminToggleCommentPin('${x.id}',${!!x.is_pinned})">${x.is_pinned?'📌 إلغاء التثبيت':'📌 تثبيت'}</button><button class="ac-danger" onclick="window.madaAdminDeleteComment('${x.id}')">🗑️ حذف</button></div>
    </article>`;
  }
  function filter(){const q=($('acSearch')?.value||'').trim().toLowerCase(),f=$('acFilter')?.value||'all';document.querySelectorAll('.ac-item').forEach(x=>{const okQ=!q||(x.dataset.search||'').includes(q);const okF=f==='all'||(f==='pinned'&&x.dataset.pinned==='true')||(f==='replies'&&x.dataset.reply==='true')||(f==='top'&&x.dataset.reply==='false');x.hidden=!(okQ&&okF)})}
  window.madaAdminToggleCommentPin=async(id,pinned)=>{const r=await sb.from('comments').update({is_pinned:!pinned}).eq('id',id);if(r.error){alert('تعذر تغيير التثبيت: '+r.error.message);return}await load()};
  window.madaAdminDeleteComment=async id=>{if(!confirm('حذف هذا التعليق نهائيًا؟'))return;const r=await sb.from('comments').delete().eq('id',id);if(r.error){alert('تعذر حذف التعليق: '+r.error.message);return}await load()};
  function boot(){addTab();styles();}
  boot();
})();
