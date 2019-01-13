
var createTemplateTable = function() {

  var cols = [];
  for (var i = 0; i < 50; i += 1) {
    cols.push({
      label: 'Label#' + i,
      dataField: 'field' + i,
      backgroundColor: '#ccffcc',
    });
  }

  var tmpl = {
    thead : [[]],
  };
  cols.forEach(function(col) {
    tmpl.thead[0].push(col);
  });

  var rand = SpecUtil.rand();

  var table = comfortable.fromTemplate(tmpl);

  var items = [];
  for (var r = 0; r < 100; r += 1) {
    var record = {};
    for (var c = 0; c < tmpl.thead[0].length; c += 1) {
      var dataField = tmpl.thead[0][c].dataField;
      record[dataField] = SpecUtil.nextAlp(rand) + ~~(rand() * 10000);
    }
    items.push(record);
  }

  $('BODY').append($(table.$el).addClass('my-table').
      css({ width : '800px', height : '600px'}) );

  // before items
  table.model.setValueAt(1, 0, 'QWERT');
  table.model.items = items;
  // after items
  table.model.setValueAt(1, 0, 'ABCDE');

  table.invalidate();

  return table;
};

describe('template-table3', function() {

  beforeEach(function() {
    document.body.innerHTML = '';
  });

  it('test', function(done) {

    var table = createTemplateTable();

    // test

    expect(table.getLockLeft() ).toBe(0);
    expect(table.getLockTop() ).toBe(1);

    SpecUtil.nextTick(200, function() {

    }).nextTick(100, function() {

      var $heads = $('.ctj-header');
      expect($heads.length).toBe(8);
      var target = $heads[1];
      var off = $(target).offset();
      var w = $(target).outerWidth();
      var h = $(target).outerHeight();

      SpecUtil.triggerMouseEvent(target, 'mousedown', function(event) {
        event.pageX = off.left + w / 2;
        event.pageY = off.top + h / 2;
      });

      this.mousemove = function() {
        SpecUtil.triggerMouseEvent(document, 'mousemove', function(event) {
          event.pageX = off.left + w / 2 + w * 2;
          event.pageY = off.top + h / 2;
        });
      };

      this.mouseup = function() {
        SpecUtil.triggerMouseEvent(document, 'mouseup', function(event) {
          event.pageX = off.left + w / 2 + w * 2;
          event.pageY = off.top + h / 2;
        });
      };

    }).nextTick(100, function() {

      this.mousemove();

    }).nextTick(100, function() {

      this.mouseup();

    }).nextTick(100, function() {

      var targetIndex = 1;

      var $heads = $('.ctj-header');
      expect($heads.length).toBe(8);
      var target = $heads[targetIndex];
      var off = $(target).offset();
      var w = $(target).outerWidth();
      var h = $(target).outerHeight();

      var $resizeHandles = $('.ctj-v-resize-line').parent();
      expect($resizeHandles.length).toBe(8);

      SpecUtil.triggerMouseEvent($resizeHandles[targetIndex],
          'mousedown', function(event) {
        event.pageX = off.left + w;
        event.pageY = off.top + h / 2;
      });

      this.mousemove = function() {
        SpecUtil.triggerMouseEvent(document, 'mousemove', function(event) {
          event.pageX = off.left + w + w * 0.5;
          event.pageY = off.top + h / 2;
        });
      };

      this.mouseup = function() {
        SpecUtil.triggerMouseEvent(document, 'mouseup', function(event) {
          event.pageX = off.left + w + w * 0.5;
          event.pageY = off.top + h / 2;
        });
      };

    }).nextTick(100, function() {

      this.mousemove();

    }).nextTick(100, function() {

      this.mouseup();

    }).nextTick(1000, function() {

      done();

    });

  });

});
