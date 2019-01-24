
var createTemplateTable = function() {

  var cols = [];
  for (var i = 0; i < 50; i += 1) {
    cols.push({
      label: 'Label#' + i,
      dataField: 'field' + i,
      backgroundColor: '#ffcccc',
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
      css({ width : '800px', height : '400px'}) );

  // before items
  table.model.setValueAt(1, 0, 'QWERT');
  table.model.items = items;
  // after items
  table.model.setValueAt(1, 0, 'ABCDE');

  table.invalidate();

  return table;
};

describe('template-table1', function() {

  beforeEach(function() {
    document.body.innerHTML = '';
  });

  it('sort asc, desc', function(done) {

    var table = createTemplateTable();

    // test

    expect(table.getLockLeft() ).toBe(0);
    expect(table.getLockTop() ).toBe(1);

    SpecUtil.nextTick(200, function() {

      var $flts = $('.ctj-filter-button');
      expect($flts.length).toBe(8);
      SpecUtil.triggerMouseEvent($flts[0], 'mousedown');

    }).nextTick(50, function() {

      SpecUtil.triggerMouseEvent(document, 'mouseup');

    }).nextTick(200, function() {

      var $sortChks = $('.ctj-dialog > .ctj-clickable-op');
      expect($sortChks.length).toBe(2);

      SpecUtil.triggerMouseEvent($sortChks[1], 'click');

    }).nextTick(200, function() {

      var $flts = $('.ctj-filter-button');
      expect($flts.length).toBe(8);
      SpecUtil.triggerMouseEvent($flts[0], 'mousedown');

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

});
