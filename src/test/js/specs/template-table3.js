
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

  it('move column, resize column', function(done) {

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

  it('move column by dialog', function(done) {

    var table = createTemplateTable();

    // test

    expect(table.getLockLeft() ).toBe(0);
    expect(table.getLockTop() ).toBe(1);

    SpecUtil.nextTick(200, function() {

      var $heads = $('.ctj-header');
      expect($heads.length).toBe(8);

      if ($heads.length == 8) {
        var target = $heads[2];
        var off = $(target).offset();
        SpecUtil.triggerContextMenu(target, function(event) {
          event.pageX = off.left + 8;
          event.pageY = off.top + 8;
        });
      }

    }).nextTick(200, function() {

      var $menuitem = $('.ctj-menuitem');
      expect($menuitem.length).toBe(2);
      if ($menuitem.length == 2) {
         SpecUtil.triggerMouseEvent($menuitem[1], 'mousedown');
      }
 
    }).nextTick(50, function() {

      SpecUtil.triggerMouseEvent(document, 'mouseup');

    }).nextTick(100, function() {

      expect($('.ctj-dialog').length).toBe(1);
      var $cols = $('.ctj-dialog .ctj-listitem');
      expect($cols.length).toBe(50 + 1);

      var target = $cols[1];
      var off = $(target).offset();
      var w = $(target).outerWidth();
      var h = $(target).outerHeight();
      var ch = -1.25;

      expect(document.elementFromPoint(off.left, off.top) ).toBe(target);

      SpecUtil.triggerMouseEvent(target, 'mousedown', function(event) {
        event.pageX = off.left + w / 2;
        event.pageY = off.top + h / 2;
      });

      var toCoord = { left: off.left + w / 2, top: off.top + h / 2 + h * ch };
      var toTarget = document.elementFromPoint(toCoord.left, toCoord.top);

      this.mousemove = function() {
        SpecUtil.triggerMouseEvent(toTarget, 'mousemove', function(event) {
          event.pageX = toCoord.left;
          event.pageY = toCoord.top;
        });
      };

      this.mouseup = function() {
        SpecUtil.triggerMouseEvent(toTarget, 'mouseup', function(event) {
          event.pageX = toCoord.left;
          event.pageY = toCoord.top;
        });
      };

    }).nextTick(100, function() {

      this.mousemove();

    }).nextTick(100, function() {

      this.mouseup();

    }).nextTick(100, function() {

      var $btn = $('.ctj-dialog .ctj-button');
      expect($btn.length).toBe(3);

      // click apply
      SpecUtil.triggerMouseEvent($btn[1], 'click');

    }).nextTick(1000, function() {
      done();
    });
  });

});
