declare var require: any, describe : any, it : any, expect : any;

describe('util', function() {

  var util = require('./comfortable').util;

  it('getCellId', function() {
    expect('1:1').toEqual(util.getCellId(1, 1) );
  });

});
