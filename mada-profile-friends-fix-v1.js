/* Mada Profile Friends Fix v2 — compatibility bridge only. */
(function(){'use strict';
if(window.__MADA_PROFILE_FRIENDS_FIX_V2)return;
window.__MADA_PROFILE_FRIENDS_FIX_V2=true;
function openProfile(id){if(!id)return;if(window.ProfileUI?.open)return window.ProfileUI.open(id);if(window.openProfile)return window.openProfile(id)}
window.MadaProfileFriendsFixV1={openProfile};
})();
