declare var require: any, describe : any, it : any, expect : any;

describe('util', function() {

  var util = require('./comfortable').util;

  it('getCellId', function() {
    expect(util.getCellId(0, 0) ).toEqual('0:0');
    expect(util.getCellId(1, 1) ).toEqual('1:1');
    expect(util.getCellId(02, 3) ).toEqual('2:3');
    expect(util.getCellId(3, 04) ).toEqual('3:4');
  });

  it('formatNumber', function() {

    expect(util.formatNumber(null) ).toEqual('');
    expect(util.formatNumber('') ).toEqual('');

    expect(util.formatNumber(0) ).toEqual('0');
    expect(util.formatNumber(-0) ).toEqual('0');
    expect(util.formatNumber(+0) ).toEqual('0');
    expect(util.formatNumber('0') ).toEqual('0');
    expect(util.formatNumber('+0') ).toEqual('0');
    expect(util.formatNumber('-0') ).toEqual('0');

    expect(util.formatNumber(1) ).toEqual('1');
    expect(util.formatNumber(-1) ).toEqual('-1');
    expect(util.formatNumber(+1) ).toEqual('1');
    expect(util.formatNumber('1') ).toEqual('1');
    expect(util.formatNumber('+1') ).toEqual('1');
    expect(util.formatNumber('-1') ).toEqual('-1');

    expect(util.formatNumber(01) ).toEqual('1');
    expect(util.formatNumber(-01) ).toEqual('-1');
    expect(util.formatNumber(+01) ).toEqual('1');
    expect(util.formatNumber('01') ).toEqual('1');
    expect(util.formatNumber('+01') ).toEqual('1');
    expect(util.formatNumber('-01') ).toEqual('-1');

    expect(util.formatNumber(1.0) ).toEqual('1');
    expect(util.formatNumber(-1.0) ).toEqual('-1');
    expect(util.formatNumber(+1.0) ).toEqual('1');
    expect(util.formatNumber('01.0') ).toEqual('1');
    expect(util.formatNumber('+01.0') ).toEqual('1');
    expect(util.formatNumber('-01.0') ).toEqual('-1');

    expect(util.formatNumber(1.0, 1) ).toEqual('1.0');
    expect(util.formatNumber(-1.0, 2) ).toEqual('-1.00');
    expect(util.formatNumber(+1.0, 1) ).toEqual('1.0');
    expect(util.formatNumber('01.0', 1) ).toEqual('1.0');
    expect(util.formatNumber('+01.0', 2) ).toEqual('1.00');
    expect(util.formatNumber('-01.0', 1) ).toEqual('-1.0');

    expect(util.formatNumber(123) ).toEqual('123');
    expect(util.formatNumber('123') ).toEqual('123');
    expect(util.formatNumber(1234) ).toEqual('1,234');
    expect(util.formatNumber('1234') ).toEqual('1,234');
    expect(util.formatNumber(-1234) ).toEqual('-1,234');
    expect(util.formatNumber('-1234') ).toEqual('-1,234');
    expect(util.formatNumber('12345678901234567890') ).
      toEqual('12,345,678,901,234,567,890');
    
  })

})
