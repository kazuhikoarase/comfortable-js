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

namespace comfortable.util {

  'use strict';

  var parseArguments = function(args : IArguments) {
    var children : any[] = [];
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

  export var extend = function(arg : any, ...args : any[]) : any {
    var o = arguments[0];
    for (var i = 1; i < arguments.length; i += 1) {
      var a = arguments[i];
      for (var k in a) {
        o[k] = a[k];
      };
    }
    return o;
  };

  export var callLater = function(cb : () => void) {
    window.setTimeout(cb, 0);
  };

  var classNamePrefixRe = /\$\{prefix\}/g;
  export var replaceClassNamePrefix = function(className : string) {
    return className.replace(classNamePrefixRe, classNamePrefix);
  };

  export interface ElementOptions {
    attrs? : { [ key : string ] : string };
    style? : { [ key : string ] : string };
    props? : { [ key : string ] : any };
    on? : { [ type : string ] : (event : any) => void };
  }

  export var set = function(
      elm : Node, opts : ElementOptions) {
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
        (<any>elm).setAttribute(k, v);
      }
    }
    if (opts.props) {
      for (var k in opts.props) {
        (<any>elm)[k] = opts.props[k];
      }
    }
    if (opts.style) {
      for (var k in opts.style) {
        (<any>elm).style[k] = opts.style[k] || '';
      }
    }
    if (opts.on) {
      for (var k in opts.on) {
        elm.addEventListener(k, opts.on[k]);
      }
    }
    return elm;
  };
/*
  :
    ((tagName : string, opts? : ElementOptions, children? : HTMLElement[]) => HTMLElement) |
    ((tagName : string, children? : HTMLElement[], opts? : ElementOptions) => HTMLElement) =
*/
  export interface CreateElement {
    (tagName : string, opts? : ElementOptions, children? : HTMLElement[]) : HTMLElement;
    (tagName : string, children? : HTMLElement[], opts? : ElementOptions) : HTMLElement;
  }
  
  export var createElement : CreateElement = function(tagName : string) {
    var args = parseArguments(arguments);
    var elm = document.createElement(tagName);
    args.children.forEach(function(child) { elm.appendChild(child); });
    return this.set(elm, args.opts);
  };

  export var createSVGElement : CreateElement = function(tagName : string) {
    var args = parseArguments(arguments);
    var elm = document.createElementNS('http://www.w3.org/2000/svg', tagName);
    args.children.forEach(function(child) { elm.appendChild(child); });
    return this.set(elm, args.opts);
  };

  export var $ = function(elm : HTMLElement|Document) {
    return {
      on : function(type : string, listener : EventListener) {
        elm.addEventListener(type, listener);
        return this;
      },
      off : function(type : string, listener : EventListener) {
        elm.removeEventListener(type, listener);
        return this;
      },
      addClass : function(className : string, remove? : boolean) {
        className = util.replaceClassNamePrefix(className);
        var classes = '';
        ((<HTMLElement>elm).getAttribute('class') || '').split(/\s+/g).
            forEach(function(c : string) {
          if (c != className) {
            classes += ' ' + c;
            return;
          }
        } );
        if (!remove) {
          classes += ' ' + className;
        }
        (<HTMLElement>elm).setAttribute('class', classes);
        return this;
      },
      removeClass : function(className : string) {
        return this.addClass(className, true);
      }
    };
  };

  export var closest = function(elm : HTMLElement,
      opts : { className? : string,
        tagName? : string, root? : HTMLElement, $el? : HTMLElement} ) {
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
      elm = <HTMLElement>elm.parentNode;
    }
    return null;
  };

  export var indexOf = function(elm : Node) {
    if (elm == null) {
      return -1;
    }
    return Array.prototype.indexOf.call(elm.parentNode.childNodes, elm);
  };

  export var offset = function(elm : HTMLElement) {
    var off = { left : 0, top : 0 };
    var e : HTMLElement;
    var base : HTMLElement = null;
    for (e = elm; e.parentNode != null; e = <HTMLElement>e.parentNode) {
      if (e.offsetParent != null) {
        base = e;
        break;
      }
    }
    if (base != null) {
      for (e = base; e.offsetParent != null; e = <HTMLElement>e.offsetParent) {
        off.left += e.offsetLeft;
        off.top += e.offsetTop;
      }
    }
    for (e = elm; e.parentNode != null &&
          e != document.body; e = <HTMLElement>e.parentNode) {
      off.left -= e.scrollLeft;
      off.top -= e.scrollTop;
    }
    return off;
  }

  export var moveSublist = function(list : any[],
      from : number, length : number, to : number) {
    var i1 = list.slice(from, from + length);
    var i2 = list.slice(0, from).concat(list.slice(from + length) );
    to = from < to? to - length : to; 
    return i2.slice(0, to).concat(i1).concat(i2.slice(to) );
  };

  export var getCellId = function(row : number, col : number) {
    return row + ':' + col;
  };

  export var translate = function(
      val1 : number,
      min1 : number, max1 : number,
      min2 : number, max2 : number,
      log? : string) {
    var val2 = (val1 - min1) * (max2 - min2) / (max1 - min1) + min2;
    return Math.max(min2, Math.min(Math.round(val2), max2) );
  };

  // num utils

  export var numRe = /^([\+\-]?)([0-9]*)(\.[0-9]*)?$/;
  export var formatNumber = function(value : string,
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
    var mat = value.match(numRe);
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
      return (neg && s != '0')? '-' + s : s;
    }
    return value;
  }

  var wideNumChars = '０１２３４５６７８９＋－．，';
  var narrowNumChars = '0123456789+-.,';
  if (wideNumChars.length != narrowNumChars.length) {
    throw wideNumChars + ',' + narrowNumChars;
  }
  export var toNarrowNumber = function(value : string) {
    var s = '';
    for (var i = 0; i < value.length; i += 1) {
      var c = value.charAt(i);
      var index = wideNumChars.indexOf(c);
      s += (index != -1)? narrowNumChars.charAt(index) : c;
    }
    return s;
  }

}
