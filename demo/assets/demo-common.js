//

// IE9 does not have console object when the developer tool is closed.
if (!window.console) {
  window.console = { log : function() {} };
}
