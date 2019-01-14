
var createTemplateTable = function() {

  var cols = [];
  for (var i = 0; i < 50; i += 1) {
    cols.push({
      label: 'Label#' + i + '\n#',
      dataField: 'field' + i,
      backgroundColor: '#ffffcc',
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
      css({ width : '800px', height : '600px'}) );
  table.model.items = items;
  table.invalidate();

  return table;
};

describe('template-table2', function() {

  beforeEach(function() {
    document.body.innerHTML = '';
  });

  it('editing', function(done) {

    var table = createTemplateTable();

    // test

    expect(table.getLockLeft() ).toBe(0);
    expect(table.getLockTop() ).toBe(1);


    SpecUtil.nextTick(200, function() {

    }).nextTick(100, function() {

      var $heads = $('.ctj-header');
      expect($heads.length).toBe(8);

      var target = $heads[0];
      var off = $(target).offset();
      var w = $(target).outerWidth();
      var h = $(target).outerHeight();

      var ch = 1;
      var toCoord = { left: off.left + w / 2, top: off.top + h / 2 + h * ch };
      var toTarget = document.elementFromPoint(toCoord.left, toCoord.top);

      SpecUtil.triggerMouseEvent(toTarget, 'mousedown', function(event) {
        event.pageX = toCoord.left;
        event.pageY = toCoord.top;
      });

      this.mouseup = function() {
        SpecUtil.triggerMouseEvent(toTarget, 'mouseup', function(event) {
          event.pageX = toCoord.left;
          event.pageY = toCoord.top;
        });
      };

    }).nextTick(100, function() {

      this.mouseup();

    }).nextTick(2000, function() {

      done();

    });

  });

});
