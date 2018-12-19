//
// comfortable - event-target
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

  export interface Event {
    type : string;
    target? : any;
    currentTarget? : any;
    preventDefault? : () => void;
    which? : number;
    defaultPrevented? : boolean;
    pageX? : number;
    pageY? : number;

  }

  export type EventListener = (event : Event, detail? : any) => void;

  export interface EventTarget {
    trigger : (type : string, detail? : any) => EventTarget;
    on : (type : string, listener : EventListener) => EventTarget;
    off : (type : string, listener : EventListener) => EventTarget;
  }

  export interface UIEventTarget extends EventTarget {
    invalidate : () => void;
    render : () => void;
  }

  export var createEventTarget = function() : EventTarget {
    var map : { [ type : string ] : EventListener[] } = {};
    var listeners = function(type : string) {
       return map[type] || (map[type] = []); };
    return {
      trigger : function(type : string, detail : any) {
        var ctx = this;
        listeners(type).forEach(function(listener) {
          listener.call(ctx, { type : type }, detail);
        });
        return this;
      },
      on : function(type : string, listener : EventListener) {
        listeners(type).push(listener);
        return this;
      },
      off : function(type : string, listener : EventListener) {
        map[type] = listeners(type).filter(function(l) {
          return listener != l;
        });
        return this;
      }
    };
  };

  export var createUIEventTarget = function() : UIEventTarget {
    return $c.util.extend(createEventTarget(), {
      valid : true,
      invalidate : function() {
        this.valid = false;
        $c.util.callLater(function() {
          if (!this.valid) {
            this.valid = true;
            this.render();
          }
        }.bind(this) );
      },
      render : function() {
      }
    });
  };

}
