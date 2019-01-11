

window.SpecUtil = {

  /**
   * 
   */
  triggerMouseEvent: function(node, type) {
    var event = document.createEvent('MouseEvents');
    event.initEvent(type, true, true);
    node.dispatchEvent(event);
  },

  /**
   * 
   */
  nextTick: function() {

    var tasks = [];
    var alive = false;

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
        task.cb();
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
  }
};

