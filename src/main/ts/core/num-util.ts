//
// comfortable - num-util
//
// Copyright (c) 2018 Kazuhiko Arase
//
// URL: https://github.com/kazuhikoarase/comfortable-js/
//
// Licensed under the MIT license:
//  http://www.opensource.org/licenses/mit-license.php
//

namespace comfortable {

  'use strict';

  var $c = comfortable;

  export var numUtil = {
    re : /^([\+\-]?)([0-9]*)(\.[0-9]*)?$/,
    format : function(value : string,
        digits? : number, s1? : string, s2? : string) {
      digits = digits || 0;
      s1 = typeof s1 == 'string'? s1 : ',';
      s2 = typeof s2 == 'string'? s2 : '.';
      if (typeof value == 'number') {
        value = '' + value;
      }
      if (typeof value != 'string') {
        return '';
      }
      var mat = value.match(this.re);
      if (mat) {
        if (mat[2].length == 0 && (!mat[3] || mat[3].length == 1) ) {
          return '';
        }
        var iPart = mat[2].length > 0? mat[2] : '0';
        while (iPart.length > 1 && iPart.charAt(0) == '0') {
          iPart = iPart.substring(1);
        }
        var neg = mat[1] == '-';
        var s = '';
        while (iPart.length > 3) {
          s = s1 + iPart.substring(iPart.length - 3) + s;
          iPart = iPart.substring(0, iPart.length - 3);
        }
        s = iPart + s;
        if (digits > 0) {
          var fPart = mat[3] || s2;
          s += s2;
          for (var i = 0; i < digits; i += 1) {
            s += (i + 1 < fPart.length)? fPart[i + 1] : '0';
          }
        }
        return neg? '-' + s : s;
      }
      return value;
    },
    toNarrow : function() {
      var wide = '０１２３４５６７８９＋－．，';
      var narrow = '0123456789+-.,';
      if (wide.length != narrow.length) {
        throw wide + ',' + narrow;
      }
      return function(value : string) {
        var s = '';
        for (var i = 0; i < value.length; i += 1) {
          var c = value.charAt(i);
          var index = wide.indexOf(c);
          s += (index != -1)? narrow.charAt(index) : c;
        }
        return s;
      };
    }()
  };

}
