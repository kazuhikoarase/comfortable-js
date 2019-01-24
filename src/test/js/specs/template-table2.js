
var createTemplateTable = function() {

  var cols = [];
  for (var i = 0; i < 50; i += 1) {
    cols.push({
      label: 'Label#' + i + '\n#',
      dataField: 'field' + i,
      backgroundColor: '#ccccff',
      height : 30
    });
  }

  var dataTypes = [
    '',           // 0
    'string',     // 1
    'number',     // 2
    'number',     // 3
    'boolean',    // 4
    'select-one'  // 5
    ];

  var tmpl = {
    thead : [[]],
    tbody : [[]],
  };
  cols.forEach(function(col, i) {
    var cell = { dataField : col.dataField };
    if (i < dataTypes.length) {
      cell.dataType = dataTypes[i];
    }
    tmpl.thead[0].push(col);
    tmpl.tbody[0].push(cell);
  });

  var rand = SpecUtil.rand();

  var table = comfortable.fromTemplate(tmpl);

  var items = [];
  for (var r = 0; r < 100; r += 1) {
    var record = {};
    for (var c = 0; c < tmpl.thead[0].length; c += 1) {
      var dataField = tmpl.thead[0][c].dataField;
      record[dataField] = '' + ~~(rand() * 10000);
      if (c == 3) {
        record[dataField] = +record[dataField];
      } else if (c == 4) {
        record[dataField] = r % 2 == 0;
      }
    }
    items.push(record);
  }

  $('BODY').append($(table.$el).addClass('my-table').
      css({ width : '800px', height : '400px'}) );
  table.model.items = items;
  table.invalidate();

  return table;
};

describe('template-table2', function() {

  beforeEach(function() {
    document.body.innerHTML = '';
  });

  it('sort asc, desc', function(done) {

    var table = createTemplateTable();

    // test

    expect(table.model.getLockLeft() ).toBe(0);
    expect(table.model.getLockTop() ).toBe(1);


    SpecUtil.nextTick(200, function() {

      var $flts = $('.ctj-filter-button');
      expect($flts.length).toBe(8);
      SpecUtil.triggerMouseEvent($flts[2], 'mousedown');

    }).nextTick(50, function() {

      SpecUtil.triggerMouseEvent(document, 'mouseup');

    }).nextTick(200, function() {

      var $sortChks = $('.ctj-dialog > .ctj-clickable-op');
      expect($sortChks.length).toBe(2);

      SpecUtil.triggerMouseEvent($sortChks[1], 'click');

    }).nextTick(200, function() {

      var $flts = $('.ctj-filter-button');
      expect($flts.length).toBe(8);
      SpecUtil.triggerMouseEvent($flts[3], 'mousedown');

    }).nextTick(50, function() {

      SpecUtil.triggerMouseEvent(document, 'mouseup');

    }).nextTick(200, function() {

      var $sortChks = $('.ctj-dialog > .ctj-clickable-op');
      expect($sortChks.length).toBe(2);

      SpecUtil.triggerMouseEvent($sortChks[0], 'click');

    }).nextTick(1000, function() {

      done();

    });

  });

  it('filter check', function(done) {

    var table = createTemplateTable();

    // test

    expect(table.model.getLockLeft() ).toBe(0);
    expect(table.model.getLockTop() ).toBe(1);


    SpecUtil.nextTick(200, function() {

      //---------------------------------------------------------
      // open filter

      var $flts = $('.ctj-filter-button');
      expect($flts.length).toBe(8);
      SpecUtil.triggerMouseEvent($flts[4], 'mousedown');

    }).nextTick(50, function() {

      SpecUtil.triggerMouseEvent(document, 'mouseup');

    }).nextTick(200, function() {

      var $sortChks = $('.ctj-dialog .ctj-clickable-op');
      expect($sortChks.length).toBe(5);

      // checked.
      SpecUtil.triggerMouseEvent($sortChks[3], 'click');

    }).nextTick(200, function() {

      var $btn = $('.ctj-dialog .ctj-button');
      expect($btn.length).toBe(2);
      SpecUtil.triggerMouseEvent($btn[0], 'click');

      // click ok.
      //---------------------------------------------------------

    }).nextTick(200, function() {

      //---------------------------------------------------------
      // open filter

      var $flts = $('.ctj-filter-button');
      expect($flts.length).toBe(8);
      SpecUtil.triggerMouseEvent($flts[4], 'mousedown');

    }).nextTick(50, function() {

      SpecUtil.triggerMouseEvent(document, 'mouseup');

    }).nextTick(200, function() {

      var $sortChks = $('.ctj-dialog .ctj-clickable-op');
      expect($sortChks.length).toBe(5);

      // checked.
      SpecUtil.triggerMouseEvent($sortChks[3], 'click');
      SpecUtil.triggerMouseEvent($sortChks[4], 'click');

    }).nextTick(200, function() {

      var $btn = $('.ctj-dialog .ctj-button');
      expect($btn.length).toBe(2);
      SpecUtil.triggerMouseEvent($btn[0], 'click');

      // click ok.
      //---------------------------------------------------------

    }).nextTick(200, function() {

      //---------------------------------------------------------
      // open filter

      var $flts = $('.ctj-filter-button');
      expect($flts.length).toBe(8);
      SpecUtil.triggerMouseEvent($flts[4], 'mousedown');

    }).nextTick(50, function() {

      SpecUtil.triggerMouseEvent(document, 'mouseup');

    }).nextTick(200, function() {

      var $sortChks = $('.ctj-dialog .ctj-clickable-op');
      expect($sortChks.length).toBe(5);

      // select all
      SpecUtil.triggerMouseEvent($sortChks[2], 'click');

    }).nextTick(200, function() {

      var $btn = $('.ctj-dialog .ctj-button');
      expect($btn.length).toBe(2);
      SpecUtil.triggerMouseEvent($btn[0], 'click');

      // click ok.
      //---------------------------------------------------------

    }).nextTick(1000, function() {

      done();

    });

  });

  it('context-menu(clear filter)', function(done) {

    var table = createTemplateTable();

    // test

    expect(table.model.getLockLeft() ).toBe(0);
    expect(table.model.getLockTop() ).toBe(1);

    SpecUtil.nextTick(200, function() {

      var $flts = $('.ctj-filter-button');
      expect($flts.length).toBe(8);
      SpecUtil.triggerMouseEvent($flts[2], 'mousedown');

    }).nextTick(50, function() {

      SpecUtil.triggerMouseEvent(document, 'mouseup');

    }).nextTick(200, function() {

      var $sortChks = $('.ctj-dialog > .ctj-clickable-op');
      expect($sortChks.length).toBe(2);
      SpecUtil.triggerMouseEvent($sortChks[1], 'click');

    }).nextTick(200, function() {

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
         SpecUtil.triggerMouseEvent($menuitem[0], 'mousedown');
      }

    }).nextTick(50, function() {

      SpecUtil.triggerMouseEvent(document, 'mouseup');

    }).nextTick(1000, function() {

      done();

    });

  });

});
