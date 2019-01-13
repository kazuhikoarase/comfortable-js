
window.SpecUtil = {

    //https://stackoverflow.com/questions/26596123/internet-explorer-9-10-11-event-constructor-doesnt-work
    /*
    (function () {
      if ( typeof window.CustomEvent === "function" ) return false; //If not IE
    
      function CustomEvent ( event, params ) {
        params = params || { bubbles: false, cancelable: false, detail: undefined };
        var evt = document.createEvent( 'CustomEvent' );
        evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
        return evt;
       }
    
      CustomEvent.prototype = window.Event.prototype;
    
      window.CustomEvent = CustomEvent;
    })();
    */
  /**
   * 
   */
  _triggerMouseEvent: function(elm, type, init) {
    var params ={ bubbles: true, cancelable: true, view: window };
    if (init) {
      init(params);
    }
    var event = new CustomEvent(type, params);
    elm.dispatchEvent(event);
  },

  triggerMouseEvent: function(elm, type, init) {
    var event = document.createEvent('MouseEvents');
    var params = {};
    if (init) {
      init(params);
    }

    /*
     * !! IE11 does not support instantiate a MouseEvent. !!
     *
      type, canBubble, cancelable, view,
      detail, screenX, screenY, clientX, clientY,
      ctrlKey, altKey, shiftKey, metaKey,
      button, relatedTarget)
     */ 
    event.initMouseEvent(
      type, true, true, window,
      0, 0, 0, params.pageX || 0, params.pageY || 0,
      false, false, false, false,
      0, null );
    elm.dispatchEvent(event);
  },

  /** 
   * 
   */
  triggerContextMenu: function(elm, init) {
    var event = document.createEvent('HTMLEvents');
    event.initEvent('contextmenu', true, false);
    if (init) {
      init(event);
    }
    elm.dispatchEvent(event);
  },

  /**
   * 
   */
  nextTick: function() {

    var tasks = [];
    var alive = false;
    var ctx = {};

    var push = function(cb, timeout) {
      if (typeof timeout == 'function') {
        tasks.push({ cb: timeout, timeout: cb });
      } else {
        tasks.push({ cb: cb, timeout: timeout || 0 });
      }
      notify();
    };

    var notify = function() {
      if (alive || tasks.length == 0) {
        return;
      }
      var task = tasks.shift();
      alive = true;
      window.setTimeout(function() {
        task.cb.apply(ctx);
        alive = false;
        notify();
      }, task.timeout);
    }

    var nextTick = function(cb, timeout) {
      push(cb, timeout);
      return nextTick;
    };
    return nextTick;
  }(),

  rand : function() {
    var seed1 = 1.3;
    var seed2 = 3.14;
    var val = 0.2;
    return function() {
      val = (seed1 * val + seed2) % 1;
      return val;
    }
  },

  nextAlp : function(rand) {
    return String.fromCharCode('A'.charCodeAt(0) + ~~(rand() * 26) );
  },
};

