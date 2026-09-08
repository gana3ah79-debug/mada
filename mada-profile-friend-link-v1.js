/* Mada Profile Friend Link v1 — make the four profile friends open their own profiles. */
(function(){'use strict';
if(window.__MADA_PROFILE_FRIEND_LINK_V1)return;
window.__MADA_PROFILE_FRIEND_LINK_V1=true;
function open(id){
  if(!id)return;
  if(window.ProfileUI?.open){window.ProfileUI.open(id);return}
  if(window.openProfile){window.openProfile(id);return}
  window.__MADA_PENDING_PROFILE_ID=id;
}
function install(){
  document.addEventListener('click',function(e){
    const b=e.target?.closest?.('.fb-friend-card[data-profile-id]');
    if(!b)return;
    const id=b.dataset.profileId;
    if(!id)return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    open(id);
  },true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
window.MadaProfileFriendLinkV1={open};
})();