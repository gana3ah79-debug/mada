/* Mada Social Center v2 — stable navigation layer */
(function(){'use strict';
const $=id=>document.getElementById(id);
function stop(e){e.preventDefault();e.stopImmediatePropagation();}
function run(name){const fn=window.MadaSocialCenter?.[name];if(typeof fn==='function')fn();else if(name==='friends'&&window.Social?.center)window.Social.center('requests');else if(name==='search'&&window.MadaCoreControls?.search)window.MadaCoreControls.search();}
function bind(){const map={friendsNav:'friends',friendsBottom:'friends',msgBtn:'messages',msgBtn2:'messages',notifyBtn:'notifications',notifyNav:'notifications',notifyBottom:'notifications',searchBtn:'search'};Object.entries(map).forEach(([id,name])=>{const el=$(id);if(!el||el.dataset.msscV2)return;el.dataset.msscV2='1';el.addEventListener('click',e=>{stop(e);run(name)},true)});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
window.MadaSocialCenterV2={bind};
})();