/* Mada Profile UI v4 — visual-only profile layer. No renderer, no observers, no Supabase requests. */
(function(){'use strict';
if(window.__MADA_PROFILE_UI_V4)return;window.__MADA_PROFILE_UI_V4=true;
const css=()=>{if(document.getElementById('mada-profile-ui-v4-css'))return;const s=document.createElement('style');s.id='mada-profile-ui-v4-css';s.textContent=`
#modal .mada-fast-profile{width:100%;max-width:760px;margin:0 auto;background:var(--card,#fff);color:var(--text,#172033);border-radius:24px;overflow:hidden;box-shadow:0 8px 30px rgba(15,23,42,.08);contain:layout paint style}
#modal .mada-fast-cover{height:190px!important;background:#e9eef5 center/cover no-repeat!important;position:relative}
#modal .mada-fast-cover:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 55%,rgba(0,0,0,.10));pointer-events:none}
#modal .mada-fast-main{padding:0 16px 16px!important}
#modal .mada-fast-avatar{width:104px!important;height:104px!important;margin:-52px 0 10px auto!important;border:5px solid var(--card,#fff)!important;box-shadow:0 5px 20px rgba(15,23,42,.16)!important;position:relative;z-index:3}
#modal .mada-fast-main h2{display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:7px!important;flex-wrap:wrap!important;margin:0!important;font-size:23px!important;font-weight:900!important;line-height:1.35!important;direction:rtl}
#modal .mada-fast-main h2>.mada-h4-badge{display:inline-flex!important;flex:0 0 19px!important;width:19px!important;height:19px!important;min-width:19px!important;margin:0!important}
#modal .mada-fast-main h2>.mada-h4-badge svg{width:19px!important;height:19px!important}
#modal .mada-fast-meta{display:flex!important;gap:8px!important;align-items:center!important;flex-wrap:wrap!important;margin:4px 0!important;color:#728096!important;font-size:13px!important;font-weight:700!important}
#modal .mada-fast-bio{margin:9px 0 4px!important;line-height:1.75!important;color:#526176!important;font-size:14px!important}
#modal .mada-fast-stats{display:grid!important;grid-template-columns:repeat(4,1fr)!important;gap:0!important;margin:13px 0 0!important;border-block:1px solid #edf1f5!important}
#modal .mada-fast-stats div{min-width:0!important;padding:11px 3px!important;text-align:center!important}
#modal .mada-fast-stats b{font-size:17px!important;font-weight:900!important}
#modal .mada-fast-stats span{font-size:11px!important;color:#7c899b!important}
#modal .mada-fast-actions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;margin-top:12px!important}
#modal .mada-fast-actions button{min-height:44px!important;border:1px solid #dce4ed!important;border-radius:13px!important;background:#f4f7fa!important;color:inherit!important;font:inherit!important;font-weight:850!important;box-shadow:none!important;transition:transform .12s ease,opacity .12s ease!important}
#modal .mada-fast-actions button:active{transform:scale(.98)!important}
#modal .mada-fast-actions .primary{background:linear-gradient(135deg,#1877f2,#0ea5e9)!important;color:#fff!important;border-color:transparent!important}
#modal .mada-fast-tabs{display:flex!important;margin-top:4px!important;border-bottom:1px solid #edf1f5!important}
#modal .mada-fast-tabs button{flex:1!important;padding:13px 8px!important;border:0!important;background:transparent!important;color:#78869a!important;font:inherit!important;font-weight:850!important}
#modal .mada-fast-tabs button.active{color:#1877f2!important;border-bottom:3px solid #1877f2!important}
#modal .mada-fast-posts{padding:8px 13px!important}
#modal .mada-fast-post{content-visibility:auto!important;contain-intrinsic-size:0 180px!important;padding:11px 2px!important;border-bottom:1px solid #edf1f5!important}
#modal .mada-fast-loading{padding:22px!important;text-align:center!important;color:#7c899b!important}
#modal .mada-fast-profile img{content-visibility:auto!important}
#modal .mada-fast-main .mada-auth-meta.verified,#modal .mada-fast-main .mada-auth-meta-line .verified{display:none!important}
#modal .mada-fast-main h2>.mada-vfix-badge{display:none!important}
@media(max-width:600px){#modal .mada-fast-profile{border-radius:20px}#modal .mada-fast-cover{height:155px!important}#modal .mada-fast-avatar{width:96px!important;height:96px!important;margin:-48px 0 9px auto!important;border-width:4px!important}#modal .mada-fast-main{padding:0 13px 13px!important}#modal .mada-fast-main h2{font-size:21px!important}#modal .mada-fast-meta{font-size:12px!important}#modal .mada-fast-bio{font-size:13px!important}#modal .mada-fast-stats div{padding:10px 2px!important}#modal .mada-fast-stats b{font-size:16px!important}#modal .mada-fast-actions{gap:7px!important}#modal .mada-fast-actions button{min-height:42px!important;border-radius:12px!important}#modal .mada-fast-posts{padding-inline:10px!important}}
.dark #modal .mada-fast-profile{background:#101b2d!important;color:#fff!important}.dark #modal .mada-fast-meta,.dark #modal .mada-fast-bio,.dark #modal .mada-fast-stats span{color:#aeb8c7!important}.dark #modal .mada-fast-avatar{border-color:#101b2d!important}.dark #modal .mada-fast-actions button{background:#18263a!important;color:#fff!important;border-color:#2b3a50!important}.dark #modal .mada-fast-stats,.dark #modal .mada-fast-tabs,.dark #modal .mada-fast-post{border-color:#29374d!important}
`;document.head.appendChild(s)};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',css,{once:true});else css();
window.MadaProfileUIV4={refresh:css};
})();
