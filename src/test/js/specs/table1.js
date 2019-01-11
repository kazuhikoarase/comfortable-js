
describe('table1', function() {

  beforeEach(function() {
    document.body.innerHTML = '';
  });

  it('raw table', function(done) {

    var table = comfortable.createTable();
    $('BODY').append(table.$el);
    table.invalidate();

    expect(table.getLockLeft() ).toBe(0);
    expect(table.getLockTop() ).toBe(0);

    SpecUtil.nextTick(function() {
      done();

    }, 1000);

  });

});
