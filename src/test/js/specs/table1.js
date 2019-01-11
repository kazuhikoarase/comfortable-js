
describe('table1', function() {

  it('raw table', function(done) {

    var table = comfortable.createTable();
    $('BODY').append(table.$el);
    table.invalidate();

    expect(table.getLockLeft() ).toBe(0);
    expect(table.getLockTop() ).toBe(0);

    SpecUtil.nextTick(function() {
      $('BODY').children().remove();
      done();
    }, 1000);

  });

});
