/* Mada menu UI v5 — restore Messenger entry and keep menu actions aligned. */
(function(){
'use strict';
if(window.__MADA_MENU_UI_V5__)return;window.__MADA_MENU_UI_V5__=true;
const prev=window.MadaMenuUI;
function action(n){const m={messenger:()=>window.MadaMessenger?.open?.()||window.messagesView?.(),messages:()=>window.MadaMessenger?.open?.()||window.messagesView?.()};try{m[n]?.()}catch(e){console.warn('Mada menu action',e)}prev?.close?.()}
function restore(){const d=document.getElementById('madaDrawer');if(!d)return;const body=d.querySelector('.mada-drawer-body');if(!body)return;const old=body.querySelector('[data-mada-menu="messages"]');if(old){old.dataset.madaMenu='messenger';const b=old.querySelector('.mada-menu-copy b');const s=old.querySelector('.mada-menu-copy small');if(b)b.textContent='Mada Messenger';if(s)s.textContent='المحادثات والرسائل الخاصة';old.onclick=e=>{e.preventDefault();e.stopPropagation();action('messenger')}}}
function open(){if(prev?.open){prev.open();setTimeout(restore,60)}}
window.MadaMenuUI={open,close:()=>prev?.close?.(),render:()=>{prev?.render?.();setTimeout(restore,30)}};
document.addEventListener('click',e=>{const t=e.target?.closest?.('[data-mada-menu="messages"],[data-mada-menu="messenger"]');if(t){e.preventDefault();e.stopPropagation();action('messenger')}},true);
})();