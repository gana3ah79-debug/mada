// Native Android notification bubble bridge + Mada UI fixes.
(function () {
  function showMessageBubble(conversationId, title, message) {
    if (!conversationId) return false;
    try {
      if (window.MadaNative && typeof window.MadaNative.showMessageBubble === 'function') {
        window.MadaNative.showMessageBubble(String(conversationId), String(title || 'Mada'), String(message || 'رسالة جديدة'));
        return true;
      }
    } catch (e) { console.warn('Mada bubble unavailable', e); }
    return false;
  }
  window.showMadaMessageBubble = showMessageBubble;
  window.openMadaConversation = function (conversationId) {
    window.dispatchEvent(new CustomEvent('mada:open-conversation', { detail: { conversationId: String(conversationId || '') } }));
    if (typeof window.openMessages === 'function') { try { window.openMessages(String(conversationId || '')); } catch (e) {} }
  };
  window.addEventListener('mada:new-message', function (event) {
    var d = event && event.detail ? event.detail : {};
    showMessageBubble(d.conversationId || d.conversation_id, d.title || d.senderName || 'Mada', d.message || d.text || 'رسالة جديدة');
  });

  function bindUIFixes(){
    var friends=document.getElementById('friendsNav');
    if(friends){friends.onclick=function(e){e.preventDefault();e.stopPropagation();if(typeof window.openFriends==='function')window.openFriends();};}
    var feed=document.getElementById('feed');
    if(feed&&!feed.dataset.madaEnterComments){
      feed.dataset.madaEnterComments='1';
      feed.addEventListener('keydown',function(e){
        var input=e.target.closest('.comment-box input[data-comment]');
        if(input&&e.key==='Enter'&&!e.shiftKey){e.preventDefault();var b=feed.querySelector('[data-send="'+CSS.escape(input.dataset.comment)+'"]');if(b)b.click();}
      },true);
    }
    var actions=document.querySelector('.composer-actions');
    if(actions&&!document.getElementById('madaVideoBtn')){
      var post=document.getElementById('postBtn');
      var b=document.createElement('button');b.id='madaVideoBtn';b.type='button';b.textContent='🎥 فيديو';
      var inp=document.createElement('input');inp.id='madaVideoInput';inp.type='file';inp.accept='video/*,.mp4,.webm,.mov,.m4v,.3gp';inp.hidden=true;document.body.appendChild(inp);
      actions.insertBefore(b,post||null);
      b.onclick=function(){inp.click();};
      inp.onchange=function(){var f=inp.files&&inp.files[0];if(!f)return;window.__madaVideoFile=f;var pi=document.getElementById('postInput');if(pi)pi.placeholder='اكتب وصف الفيديو ثم اضغط نشر';};
      if(post){
        post.addEventListener('click',async function(e){
          if(!window.__madaVideoFile)return;
          e.preventDefault();e.stopImmediatePropagation();
          var f=window.__madaVideoFile,sb=window.sb,u=window.user,pi=document.getElementById('postInput');
          if(!sb||!u)return;
          if(f.size>25*1024*1024){alert('حجم الفيديو يجب ألا يتجاوز 25 ميجابايت');return;}
          post.disabled=true;var old=post.textContent;post.textContent='جارٍ رفع الفيديو…';
          try{
            var ext=(f.name.split('.').pop()||'mp4').toLowerCase().replace(/[^a-z0-9]/g,'')||'mp4';
            var path=u.id+'/'+crypto.randomUUID()+'.'+ext;
            var up=await sb.storage.from('mada-media').upload(path,f,{contentType:f.type||'video/mp4',upsert:false});
            if(up.error)throw up.error;
            var url=sb.storage.from('mada-media').getPublicUrl(path).data.publicUrl;
            var ins=await sb.from('posts').insert({author_id:u.id,body:pi&&pi.value.trim()||null,media_url:url,visibility:'public'});
            if(ins.error)throw ins.error;
            if(pi){pi.value='';pi.placeholder='بماذا تفكر؟';}window.__madaVideoFile=null;inp.value='';
            if(typeof window.loadFeed==='function')await window.loadFeed();
            alert('تم نشر الفيديو بنجاح ✓');
          }catch(err){console.error(err);alert('تعذر نشر الفيديو: '+(err&&err.message||'خطأ غير متوقع'));}
          finally{post.disabled=false;post.textContent=old;}
        },true);
      }
    }
  }
  document.addEventListener('DOMContentLoaded',function(){setTimeout(bindUIFixes,150);setTimeout(bindUIFixes,1200);});
})();
