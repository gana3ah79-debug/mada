/* Mada Push Service Worker — foreground Buzz popup + background notification */
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('push',event=>{
  event.waitUntil((async()=>{
    let data={};
    try{data=event.data?.json()||{}}catch(_){data={body:event.data?.text()||'وصلك Buzz على Mada'}}
    const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    let focused=false;
    for(const client of clients){
      try{
        if(client.visibilityState==='visible')focused=true;
        client.postMessage({type:'MADA_BUZZ_PUSH',title:data.title||'Mada',body:data.body||'📳 وصلك Buzz',sender_id:data.sender_id||'',conversation_id:data.conversation_id||''});
      }catch(_){}
    }
    /* When Mada is open, show the centered in-page Buzz popup instead of a browser notification. */
    if(focused)return;
    const title=data.title||'Mada';
    const options={body:data.body||'📳 وصلك Buzz',icon:data.icon||'/favicon.ico',badge:data.badge||'/favicon.ico',tag:data.tag||('mada-buzz-'+Date.now()),renotify:true,vibrate:[180,70,180,70,320],requireInteraction:true,data:{url:data.url||'/',sender_id:data.sender_id||'',conversation_id:data.conversation_id||''}};
    await self.registration.showNotification(title,options);
  })());
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const d=event.notification.data||{};
  const target=new URL(d.url||'/',self.location.origin);
  if(d.sender_id)target.searchParams.set('madaBuzz',d.sender_id);
  event.waitUntil((async()=>{
    const list=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of list){
      if('focus' in client){try{await client.focus();client.postMessage({type:'MADA_BUZZ',sender_id:d.sender_id||'',conversation_id:d.conversation_id||''});return}catch(_){}}}
    if(self.clients.openWindow)await self.clients.openWindow(target.href);
  })());
});
