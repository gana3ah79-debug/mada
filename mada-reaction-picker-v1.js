/* Mada Reaction Picker v2 - disabled duplicate. The reply panel owns the reaction picker. */
(function(){'use strict';
  window.MadaReactionPicker={open:function(btn){
    if(window.MadaReplyPanel?.openReactionPicker) return window.MadaReplyPanel.openReactionPicker(btn);
  },close:function(){}};
})();
