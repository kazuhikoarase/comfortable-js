//
// comfortable - util
//
// Copyright (c) 2018 Kazuhiko Arase
//
// URL: https://github.com/kazuhikoarase/comfortable-js/
//
// Licensed under the MIT license:
//  http://www.opensource.org/licenses/mit-license.php
//

!function($c) {

  'use strict';

  var util = function() {

    var parseArguments = function(args) {
      var children = [];
      var opts = {};
      for (var i = 1; i < args.length; i += 1) {
        var a = args[i];
        if (typeof a == 'object') {
          if (typeof a.splice == 'function') {
            children = a;
          } else {
            opts = a;
          }
        }
      }
      return { children : children, opts : opts };
    };

    return {

      extend : function() {
        var o = arguments[0];
        for (var i = 1; i < arguments.length; i += 1) {
          var a = arguments[i];
          for (var k in a) {
            o[k] = a[k];
          };
        }
        return o;
      },

      callLater : function(cb) {
        window.setTimeout(cb, 0);
      },

      replaceClassNamePrefix : function() {
        var classNamePrefixRe = /\$\{prefix\}/g;
        return function(className) {
          return className.replace(classNamePrefixRe, $c.classNamePrefix);
        };
      }(),

      set : function(elm, opts) {
        if (opts.attrs) {
          for (var k in opts.attrs) {
            var v = opts.attrs[k];
            var t = typeof v;
            if (t == 'number' || t == 'boolean') {
              v = '' + v;
            } else if (t == 'undefined') {
              v = '';
            }
            if (typeof v != 'string') {
              throw 'bad attr type for ' + k + ':' + (typeof v);
            }
            if (k == 'class') {
              v = this.replaceClassNamePrefix(v);
            }
            elm.setAttribute(k, v);
          }
        }
        if (opts.props) {
          for (var k in opts.props) {
            elm[k] = opts.props[k];
          }
        }
        if (opts.style) {
          for (var k in opts.style) {
            elm.style[k] = opts.style[k] || '';
          }
        }
        if (opts.on) {
          for (var k in opts.on) {
            elm.addEventListener(k, opts.on[k]);
          }
        }
        return elm;
      },

      createElement : function(tagName) {
        var args = parseArguments(arguments);
        var elm = document.createElement(tagName);
        args.children.forEach(function(child) { elm.appendChild(child); });
        return this.set(elm, args.opts);
      },

      createSVGElement : function(tagName) {
        var args = this.parseArguments(arguments);
        var elm = document.createElementNS('http://www.w3.org/2000/svg', tagName);
        args.children.forEach(function(child) { elm.appendChild(child); });
        return this.set(elm, args.opts);
      },

      $ : function(elm) {
        return {
          on : function(type, listener) {
            elm.addEventListener(type, listener);
            return this;
          },
          off : function(type, listener) {
            elm.removeEventListener(type, listener);
            return this;
          },
          addClass : function(className, remove) {
            className = util.replaceClassNamePrefix(className);
            var classes = '';
            (elm.getAttribute('class') || '').split(/\s+/g).forEach(function(c) {
              if (c != className) {
                classes += ' ' + c;
                return;
              }
            } );
            if (!remove) {
              classes += ' ' + className;
            }
            elm.setAttribute('class', classes);
            return this;
          },
          removeClass : function(className) {
            return this.addClass(className, true);
          }
        };
      },

      closest : function(elm, opts) {
        if (typeof opts.className == 'string') {
          opts.className = this.replaceClassNamePrefix(opts.className);
        }
        while (elm != null && elm.nodeType == 1 && elm != opts.root) {
          if (typeof opts.tagName == 'string' && elm.tagName == opts.tagName) {
            return elm;
          } else if (typeof opts.$el == 'object' && elm == opts.$el) {
            return elm;
          } else if (typeof opts.className == 'string' &&
              (elm.getAttribute('class') || '').split(/\s+/g).indexOf(opts.className)!= -1) {
            return elm;
          }
          elm = elm.parentNode;
        }
        return null;
      },

      indexOf : function(elm) {
        if (elm == null) {
          return -1;
        }
        return Array.prototype.indexOf.call(elm.parentNode.childNodes, elm);
      },

      offset : function(elm) {
        var off = { left : 0, top : 0 };
        var base = null;
        for (var e = elm; e.parentNode != null; e = e.parentNode) {
          if (e.offsetParent != null) {
            base = e;
            break;
          }
        }
        if (base != null) {
          for (var e = base; e.offsetParent != null; e = e.offsetParent) {
            off.left += e.offsetLeft;
            off.top += e.offsetTop;
          }
        }
        for (var e = elm; e.parentNode != null &&
              e != document.body; e = e.parentNode) {
          off.left -= e.scrollLeft;
          off.top -= e.scrollTop;
        }
        return off;
      }
    };
  }();

  util = util.extend(util, {
    moveSublist : function(list, from, length, to) {
      var i1 = list.slice(from, from + length);
      var i2 = list.slice(0, from).concat(list.slice(from + length) );
      to = from < to? to - length : to; 
      return i2.slice(0, to).concat(i1).concat(i2.slice(to) );
    },
    getCellId : function(row, col) {
      return row + ':' + col;
    },
    translate : function(val1, min1, max1, min2, max2) {
      var val2 = (val1 - min1) * (max2 - min2) / (max1 - min1) + min2;
      return Math.max(min2, Math.min(Math.round(val2), max2) );
    }
  });

  $c.util = util;

}(window.comfortable || (window.comfortable = {}) );
