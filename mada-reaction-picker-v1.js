/* Mada Reaction Picker v1 - dynamic reactions that fan out from the hand button. */
(function(){'use strict';
const reactions=[['👍','إعجاب'],['❤️','حب'],['😂','ضحك'],['😮','واو'],['😢','حزن'],['😡','غضب']];
let openPicker=null;
function close(){if(openPicker){openPicker.remove();openPicker=null}}
function make(btn){close();const wrap=document.createElement('div');wrap.className='mada-reaction-pop';wrap.setAttribute('role','menu');reactions.forEach(([emoji,label],i)=>{const b=document.createElement('button');b.type='button';b.className='mada-reaction-item';b.dataset.reaction=label;b.title=label;b.textContent=emoji;b.style.setProperty('--reaction-i',i);b.onclick=e=>{e.stopPropagation();btn.dataset.reaction=label;btn.dataset.emoji=emoji;btn.innerHTML=`<span class="mada-hand-reaction">${emoji}</span><span>إعجاب</span>`;btn.classList.add('mada-reacted');close();btn.dispatchEvent(new CustomEvent('mada:reaction',{bubbles:true,detail:{reaction:label,emoji}}))};wrap.appendChild(b)});document.body.appendChild(wrap);const r=btn.getBoundingClientRect();const w=wrap.getBoundingClientRect();let left=r.left+r.width/2-w.width/2;left=Math.max(8,Math.min(left,innerWidth-w.width-8));let top=r.top-w.height-10;if(top<8)top=r.bottom+10;wrap.style.left=left+'px';wrap.style.top=top+'px';openPicker=wrap;requestAnimationFrame(()=>wrap.classList.add('show'))}
document.addEventListener('click',e=>{const btn=e.target.closest('[data-rp-like],[data-rp-reaction]');if(btn){e.preventDefault();e.stopPropagation();make(btn)}else if(!e.target.closest('.mada-reaction-pop'))close()},true);
document.addEventListener('scroll',close,true);window.addEventListener('resize',close);window.MadaReactionPicker={open:make,close};
})();
