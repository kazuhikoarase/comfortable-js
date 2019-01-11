
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

describe('template-table0', function() {

  beforeEach(function() {
    document.body.innerHTML = '';
  });

  it('test', function(done) {

    var table = createTemplateTable();

    // test

    expect(table.getLockLeft() ).toBe(0);
    expect(table.getLockTop() ).toBe(1);

    SpecUtil.nextTick(200, function() {

    })(100, function() {

      var $heads = $('.ctj-header'); 
      expect($heads.length).toBe(8);
      var target = $heads[1];
      var off = $(target).offset();
      var w = $(target).outerWidth();
      var h = $(target).outerHeight();
 $(document).on('mousemove mouseup',function(event) {
   console.log('ja,', event.type, event.which, event.pageX, event.pageY);
 });
 
      console.log('mousedown', w, h);
      SpecUtil.triggerMouseEvent(target, 'mousedown', function(event) {
        event.pageX = off.left + w / 2;
        event.pageY = off.top + h / 2;
      });

      this.mousemove1 = function() {
        console.log('mousemove');
        SpecUtil.triggerMouseEvent(document, 'mousemove', function(event) {
          event.pageX = off.left + w / 2 + w * 1;
          event.pageY = off.top + h / 2;
          console.log('page::', event.pageX, event.pageY);
        });
      };
      this.mousemove2 = function() {
        console.log('mousemove');
        SpecUtil.triggerMouseEvent(document, 'mousemove', function(event) {
          event.pageX = off.left + w / 2 + w * 2;
          event.pageY = off.top + h / 2;
        });
      };

      this.mouseup = function() {
        console.log('mouseup');
        SpecUtil.triggerMouseEvent(document, 'mouseup', function(event) {
          event.pageX = off.left + w / 2 + w * 2;
          event.pageY = off.top + h / 2;
        });
      };
 
    })(100, function() {

      this.mousemove1();

    })(100, function() {

      this.mousemove2();

    })(100, function() { 

      this.mouseup();
 
    })(2000, function() {
console.log('goal');
      done(); 

    });

  });

});
