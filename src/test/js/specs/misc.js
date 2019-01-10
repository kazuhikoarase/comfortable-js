
describe('basic', function() {

  it('first table', function() {

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
  
  });

});
