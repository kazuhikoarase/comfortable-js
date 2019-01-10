
const triggerMouseEvent = function(node, type) {
  var event = document.createEvent('MouseEvents');
  event.initEvent(type, true, true);
  node.dispatchEvent(event);
};

const nextTick = function(cb, timeout) {
  (nextTick.queue || (nextTick.queue = []) ).
    push({ cb : cb, timeout : timeout || 0 });
  var tick = function() {
    var qitem = nextTick.queue.shift();
    setTimeout(function() {
      qitem.cb();
      if (nextTick.queue.length) {
        tick();
      }
    }, qitem.timeout);
  };
  tick();
  return nextTick;
};

/*
const nextTick = function(cb) {
  var tick = function() {
    cb();
    if (tick.next) {
      tick.next();
    }
  }
  window.setTimeout(tick, 0);
  return function(cb) {
    tick.next = cb;
  }
};
*/
describe('basic', function() {

  it('direct table', function() {

    var table = comfortable.createTable();
    expect(table.getLockLeft() ).toBe(0);
    expect(table.getLockTop() ).toBe(0);

  });

  it('template table', function(done) {

    var cols = [];
    for (var i = 0; i < 100; i += 1) {
      cols.push({
        label : 'Label' + i,
        dataField : 'field' + i
      });
    }

    var tmpl = {
      thead : [[]],
    };
    cols.forEach(function(col) {
      tmpl.thead[0].push(col);
    });

    var table = comfortable.fromTemplate(tmpl);

    var items = [];
    for (var r = 0; r < 1000; r += 1) {
      var record = {};
      for (var c = 0; c < tmpl.thead[0].length; c += 1) {
        var dataField = tmpl.thead[0][c].dataField;
        record[dataField] = r + 'x' +  dataField;
      }
      items.push(record);
    } 

    $('BODY').append($(table.$el).addClass('my-table').
        css({ width : '800px', height : '600px'}) );
    table.model.items = items;
    table.invalidate();

    // test
    
    expect(table.getLockLeft() ).toBe(0);
    expect(table.getLockTop() ).toBe(1);

    nextTick(function() {

      expect($('.ctj-filter-button').length).toBe(8);
      triggerMouseEvent($('.ctj-filter-button')[0], 'mousedown');

    })(function() {
   
//      triggerMouseEvent($('.ctj-dialog > .ctj-clickable-op')[1], 'click');

    })(function() {

      triggerMouseEvent($('.ctj-filter-button')[0], 'mousedown');

    })(function() {
   
//      triggerMouseEvent($('.ctj-dialog > .ctj-clickable-op')[0], 'click');
  
    })(function() {

      done();

    });



  });

});
