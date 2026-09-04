// Native Android notification bubble bridge.
// Safe on the web/PWA version: it simply does nothing when the Android bridge is unavailable.
(function () {
  function showMessageBubble(conversationId, title, message) {
    if (!conversationId) return false;
    try {
      if (window.MadaNative && typeof window.MadaNative.showMessageBubble === 'function') {
        window.MadaNative.showMessageBubble(String(conversationId), String(title || 'Mada'), String(message || 'رسالة جديدة'));
        return true;
      }
    } catch (e) {
      console.warn('Mada bubble unavailable', e);
    }
    return false;
  }

  window.showMadaMessageBubble = showMessageBubble;
  window.openMadaConversation = function (conversationId) {
    // The messages UI can provide this hook when it is ready.
    window.dispatchEvent(new CustomEvent('mada:open-conversation', { detail: { conversationId: String(conversationId || '') } }));
    if (typeof window.openMessages === 'function') {
      try { window.openMessages(String(conversationId || '')); } catch (e) {}
    }
  };

  window.addEventListener('mada:new-message', function (event) {
    var d = event && event.detail ? event.detail : {};
    showMessageBubble(d.conversationId || d.conversation_id, d.title || d.senderName || 'Mada', d.message || d.text || 'رسالة جديدة');
  });
})();
