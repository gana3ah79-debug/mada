/* Mada Premium visual perks */
(function(){
  const sb=window.sb;
  const badgeIcon={crown:'👑',diamond:'💎'};
  const cache=new Map();
  async function decorate(){
    const posts=[...document.querySelectorAll('#feed article.post[data-post-id]')];
    if(!posts.length||!sb)return;
    const ids=posts.map(x=>x.dataset.postId).filter(Boolean);
    const {data:rows,error}=await sb.from('posts').select('id,author_id,profiles!posts_author_id_fkey(id,display_name,avatar_url,is_premium,badge,custom_color)').in('id',ids);
    if(error){console.warn('premium profiles unavailable',error);return;}
    (rows||[]).forEach(p=>cache.set(p.id,p.profiles||{}));
    posts.forEach(post=>{const p=cache.get(post.dataset.postId);if(!p?.is_premium)return;const head=post.querySelector('.post-head'),avatar=head?.querySelector('.avatar'),name=head?.querySelector('.post-name');if(!head||!avatar||!name)return;post.classList.add('premium-post');avatar.classList.add('premium-avatar');if(p.avatar_url){avatar.style.backgroundImage=`url("${String(p.avatar_url).replace(/"/g,'&quot;')}")`;avatar.textContent='';}name.classList.add('premium-name');if(p.custom_color&&/^#[0-9a-f]{3,8}$/i.test(p.custom_color))name.style.color=p.custom_color;let badge=name.querySelector('.premium-badge');if(!badge){badge=document.createElement('span');badge.className='premium-badge';name.appendChild(badge);}badge.textContent=badgeIcon[p.badge]||'💎';badge.title='Mada Premium';});
  }
  window.madaDecoratePremium=decorate;
  new MutationObserver(()=>setTimeout(decorate,0)).observe(document.getElementById('feed')||document.body,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',()=>setTimeout(decorate,1200));
})();