/* Mada Premium visual perks + admin button guard */
(function(){
  const sb=window.sb;
  const badgeIcon={crown:'👑',diamond:'💎'};
  const cache=new Map();
  async function decorate(){
    const posts=[...document.querySelectorAll('#feed article.post[data-post-id]')];if(!posts.length||!sb)return;
    const ids=posts.map(x=>x.dataset.postId).filter(Boolean);
    const {data:rows,error}=await sb.from('posts').select('id,author_id,profiles!posts_author_id_fkey(id,display_name,avatar_url,is_premium,badge,custom_color,reward_premium_tag,reward_crown,reward_fire,reward_bold,reward_gold_frame)').in('id',ids);
    if(error){console.warn('premium profiles unavailable',error);return;}
    (rows||[]).forEach(p=>cache.set(p.id,p.profiles||{}));
    posts.forEach(post=>{const p=cache.get(post.dataset.postId);if(!p)return;const paid=!!p.is_premium;post.classList.toggle('premium-post',paid);post.classList.toggle('reward-gold-frame',paid&&!!p.reward_gold_frame);const head=post.querySelector('.post-head'),avatar=head?.querySelector('.avatar'),name=head?.querySelector('.post-name');if(!head||!avatar||!name)return;avatar.classList.toggle('premium-avatar',paid&&(!!p.reward_gold_frame||!!p.reward_premium_tag));if(p.avatar_url){avatar.style.backgroundImage=`url(\"${String(p.avatar_url).replace(/\"/g,'&quot;')}\")`;avatar.textContent='';}name.classList.toggle('premium-name',paid||!!p.reward_bold);name.classList.toggle('reward-bold',!!p.reward_bold);if(p.custom_color&&/^#[0-9a-f]{3,8}$/i.test(p.custom_color))name.style.color=p.custom_color;name.querySelectorAll('.premium-badge,.reward-crown,.reward-fire').forEach(x=>x.remove());if(paid&&p.reward_premium_tag){const badge=document.createElement('span');badge.className='premium-badge';badge.textContent=badgeIcon[p.badge]||'💎';badge.title='تاج Premium';name.appendChild(badge);}if(paid&&p.reward_crown){const x=document.createElement('span');x.className='reward-crown';x.textContent='👑';x.title='مكافأة التاج';name.appendChild(x);}if(paid&&p.reward_fire){const x=document.createElement('span');x.className='reward-fire';x.textContent='🔥';x.title='مكافأة الحماسة';name.appendChild(x);}});
  }
  async function guardAdminButton(){const btn=document.getElementById('adminLoginBtn');if(!btn||!sb)return;const {data:{session}}=await sb.auth.getSession();if(!session){btn.hidden=true;return;}const {data:p}=await sb.from('profiles').select('role,is_banned').eq('id',session.user.id).maybeSingle();btn.hidden=!(p?.role==='admin'&&!p?.is_banned);}
  window.madaDecoratePremium=decorate;new MutationObserver(()=>setTimeout(decorate,0)).observe(document.getElementById('feed')||document.body,{childList:true,subtree:true});document.addEventListener('DOMContentLoaded',()=>{setTimeout(decorate,1200);guardAdminButton();});
})();