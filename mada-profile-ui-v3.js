/* Mada Profile UI v5 — polished visual layer for Profile Runtime v8. */
(function(){'use strict';
if(window.__MADA_PROFILE_UI_V5)return;window.__MADA_PROFILE_UI_V5=true;
const css=()=>{if(document.getElementById('mada-profile-ui-v5-css'))return;const s=document.createElement('style');s.id='mada-profile-ui-v5-css';s.textContent=`
#modal .mada-fast-profile{width:100%;max-width:780px;margin:0 auto;background:var(--card,#fff);color:var(--text,#172033);border-radius:24px;overflow:hidden;box-shadow:0 12px 40px rgba(15,23,42,.12);contain:layout paint style}
#modal .mada-fast-cover{height:205px!important;background:linear-gradient(135deg,#1877f2 0%,#6d5dfc 55%,#e94b9b 100%) center/cover no-repeat!important;position:relative}
#modal .mada-fast-cover:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 45%,rgba(0,0,0,.28));pointer-events:none}
#modal .mada-cover-label{position:absolute;left:16px;bottom:12px;color:#fff;font-weight:900;font-size:12px;letter-spacing:1px;opacity:.85;z-index:1}
#modal .mada-fast-main{padding:0 18px 18px!important}
#modal .mada-fast-avatar{width:112px!important;height:112px!important;margin:-56px 0 12px auto!important;border:5px solid var(--card,#fff)!important;border-radius:50%!important;overflow:hidden!important;box-shadow:0 8px 26px rgba(15,23,42,.20)!important;position:relative;z-index:3;display:grid!important;place-items:center!important;background:#edf2f7!important;font-size:38px!important;font-weight:900!important}
#modal .mada-fast-avatar img{width:100%!important;height:100%!important;object-fit:cover!important}
#modal .mada-fast-main h2{display:flex!important;align-items:center!important;gap:8px!important;flex-wrap:wrap!important;margin:0!important;font-size:25px!important;font-weight:950!important;line-height:1.3!important;direction:rtl}
#modal .mada-fast-main h2>.mada-h4-badge{display:inline-flex!important;flex:0 0 20px!important;width:20px!important;height:20px!important}
#modal .mada-fast-main h2>.mada-h4-badge svg{width:20px!important;height:20px!important}
#modal .mada-fast-meta{display:flex!important;gap:8px!important;align-items:center!important;flex-wrap:wrap!important;margin:5px 0!important;color:#718096!important;font-size:13px!important;font-weight:750!important}
#modal .mada-fast-meta span{background:#f5f7fa;border-radius:999px;padding:4px 9px}
#modal .mada-fast-bio{margin:11px 0 5px!important;line-height:1.8!important;color:#536174!important;font-size:14px!important;white-space:pre-wrap!important}
#modal .mada-fast-stats{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:8px!important;margin:15px 0 0!important;padding-top:2px!important;border:0!important}
#modal .mada-fast-stats button{min-width:0!important;padding:12px 5px!important;border:1px solid #e8edf3!important;border-radius:15px!important;background:#f8fafc!important;color:inherit!important;text-align:center!important;font:inherit!important;cursor:pointer!important;display:flex!important;flex-direction:column!important;align-items:center!important;gap:3px!important;transition:transform .12s ease,background .12s ease,border-color .12s ease!important}
#modal .mada-fast-stats button:hover{background:#f0f6ff!important;border-color:#cfe0f8!important}
#modal .mada-fast-stats button:active{transform:scale(.97)!important}
#modal .mada-fast-stats b{font-size:19px!important;font-weight:950!important;line-height:1.1!important}
#modal .mada-fast-stats span{font-size:11px!important;color:#7b8798!important;font-weight:800!important}
#modal .mada-fast-actions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;margin-top:12px!important}
#modal .mada-fast-actions button{min-height:46px!important;border:1px solid #dce4ed!important;border-radius:14px!important;background:#f5f7fa!important;color:inherit!important;font:inherit!important;font-weight:900!important;box-shadow:none!important;transition:transform .12s ease,opacity .12s ease!important;cursor:pointer!important}
#modal .mada-fast-actions button:active{transform:scale(.98)!important}
#modal .mada-fast-actions .primary{background:linear-gradient(135deg,#1877f2,#0ea5e9)!important;color:#fff!important;border-color:transparent!important}
#modal .mada-fast-tabs{display:flex!important;margin-top:2px!important;border-bottom:1px solid #e9eef4!important}
#modal .mada-fast-tabs button{flex:1!important;padding:14px 8px!important;border:0!important;background:transparent!important;color:#7a8799!important;font:inherit!important;font-weight:900!important;cursor:pointer!important;position:relative!important}
#modal .mada-fast-tabs button.active{color:#1877f2!important}
#modal .mada-fast-tabs button.active:after{content:"";position:absolute;left:22%;right:22%;bottom:-1px;height:3px;border-radius:3px;background:#1877f2}
#modal .mada-fast-posts{padding:10px 14px!important}
#modal .mada-fast-post{content-visibility:auto!important;contain-intrinsic-size:0 180px!important;padding:14px!important;margin:7px 0!important;border:1px solid #edf1f5!important;border-radius:16px!important;background:var(--card,#fff)!important;box-shadow:0 3px 12px rgba(15,23,42,.035)!important}
#modal .mada-fast-post p{margin:7px 0!important;line-height:1.8!important;white-space:pre-wrap!important;overflow-wrap:anywhere!important}
#modal .mada-fast-post img{display:block!important;width:100%!important;max-height:420px!important;object-fit:cover!important;border-radius:13px!important;margin-top:9px!important}
#modal .mada-fast-post time{display:block!important;margin-top:9px!important;color:#8a95a5!important;font-size:11px!important}
#modal .mada-pinned{display:inline-block!important;padding:4px 8px!important;border-radius:999px!important;background:#eef6ff!important;color:#1877f2!important;font-weight:900!important}
#modal .mada-fast-loading{padding:28px 14px!important;text-align:center!important;color:#7c899b!important;font-weight:750!important}
#modal .mada-about{display:grid!important;gap:10px!important;padding:18px 6px!important;color:#59677a!important;line-height:1.8!important;font-size:14px!important}
#modal .mada-about>div{padding:13px 14px!important;border:1px solid #edf1f5!important;border-radius:14px!important;background:#fafbfd!important}
#modal .mada-fast-main .mada-auth-meta.verified,#modal .mada-fast-main .mada-auth-meta-line .verified,#modal .mada-fast-main h2>.mada-vfix-badge{display:none!important}
.dark #modal .mada-fast-profile{background:#101b2d!important;color:#fff!important}.dark #modal .mada-fast-meta span{background:#18263a!important}.dark #modal .mada-fast-meta,.dark #modal .mada-fast-bio,.dark #modal .mada-fast-stats span{color:#aeb8c7!important}.dark #modal .mada-fast-avatar{border-color:#101b2d!important}.dark #modal .mada-fast-stats button,.dark #modal .mada-fast-actions button,.dark #modal .mada-about>div{background:#18263a!important;color:#fff!important;border-color:#2b3a50!important}.dark #modal .mada-fast-stats button:hover{background:#20324c!important}.dark #modal .mada-fast-tabs,.dark #modal .mada-fast-post{border-color:#29374d!important}.dark #modal .mada-fast-post{background:#111e31!important}.dark #modal .mada-pinned{background:#17365b!important}
@media(max-width:600px){#modal .mada-fast-profile{border-radius:20px}#modal .mada-fast-cover{height:165px!important}#modal .mada-fast-main{padding:0 12px 13px!important}#modal .mada-fast-avatar{width:98px!important;height:98px!important;margin:-49px 0 10px auto!important;border-width:4px!important;font-size:32px!important}#modal .mada-fast-main h2{font-size:21px!important}#modal .mada-fast-meta{font-size:12px!important}#modal .mada-fast-bio{font-size:13px!important}#modal .mada-fast-stats{gap:5px!important}#modal .mada-fast-stats button{padding:10px 2px!important;border-radius:12px!important}#modal .mada-fast-stats b{font-size:16px!important}#modal .mada-fast-actions{gap:6px!important}#modal .mada-fast-actions button{min-height:43px!important;border-radius:12px!important;font-size:12px!important}#modal .mada-fast-posts{padding-inline:8px!important}}
`;
document.head.appendChild(s)};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',css,{once:true});else css();
window.MadaProfileUIV4={refresh:css};window.MadaProfileUIV5={refresh:css};
})();
