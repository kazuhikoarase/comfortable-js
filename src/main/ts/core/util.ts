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

  var $c = comfortable;

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
    return className.replace(classNamePrefixRe,
       $c.classNamePrefix);
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

}
