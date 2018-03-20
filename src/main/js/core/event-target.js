//
// comfortable - event-target
//
// Copyright (c) 2017 Kazuhiko Arase
//
// URL: https://github.com/kazuhikoarase/comfortable/
//
// Licensed under the MIT license:
//  http://www.opensource.org/licenses/mit-license.php
//

!function($c) {

  'use strict';

  var createEventTarget = function() {
    var map = {};
    var listeners = function(type) { return map[type] || (map[type] = []); };
    return {
      trigger : function(type, detail) {
        var ctx = this;
        listeners(type).forEach(function(listener) {
          listener.call(ctx, { type : type }, detail);
        });
        return this;
      },
      on : function(type, listener) {
        listeners(type).push(listener);
        return this;
      },
      off : function(type, listener) {
        map[type] = listeners(type).filter(function(l) {
          return listener != l;
        });
        return this;
      }
    };
  };

  var createUIEventTarget = function() {
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

  $c.createEventTarget = createEventTarget;
  $c.createUIEventTarget = createUIEventTarget;

}(comfortable);
