//
// comfortable - ui
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

  var createButton = function(label, action) {
    return $c.util.createElement('div',{
      style : { display : 'inline-block' },
      props : { textContent : label },
      attrs : { 'class' : '${prefix}button ${prefix}clickable' },
      on : { mousedown : function(event) {
        event.preventDefault();
      }, click : function(event) { action(event); } } });
  };

  var createDialog = function(children) {
    var dialog = $c.util.extend($c.createEventTarget(), {
      $el : $c.util.createElement('div', {
          attrs : { 'class' : '${prefix}dialog' },
          style : { position : 'absolute' }
      }, children),
      show : function() {
        document.body.appendChild(this.$el);
        this.trigger('beforeshow');
        $c.util.callLater(function() {
          $c.util.$(document).on('mousedown', mousedownHandler);
        });
      },
      dispose : function() {
        if (this.$el) {
          $c.util.$(document).off('mousedown', mousedownHandler);
          document.body.removeChild(this.$el);
          this.$el = null;
          this.trigger('dispose');
        }
      }
    } );
    var mousedownHandler = function(event) {
      if (!$c.util.closest(event.target,
          { $el : dialog.$el, root : document.body }) ) {
        dialog.dispose();
      }
    };
    return dialog;
  };

  var showMenu = function(left, top, menuItems) {
    var subMenu = null;
    var menu = $c.util.createElement('div', {
      attrs : { 'class' : '${prefix}contextmenu' },
      style : { position : 'absolute', left : left + 'px', top : top + 'px' } },
      menuItems.map(function(menuItem) {
        return $c.util.createElement('div', {
            attrs : { 'class' : '${prefix}menuitem ${prefix}clickable' },
            props : { textContent : menuItem.label },
            style : { position : 'relative', whiteSpace : 'nowrap' },
            on : {
              mouseover : function(event) {
                if (subMenu != null) {
                  subMenu.dispose();
                  subMenu = null;
                }
                if (subMenu == null && menuItem.children) {
                  subMenu = showMenu(
                      left + event.target.offsetWidth,
                      top + event.target.offsetTop,
                      menuItem.children() );
                }
              },
              mousedown : function(event) {
                if (menuItem.action) {
                  menuItem.action(event);
                }
              }
            }
          } );
        }) );
    var dispose = function() {
      if (menu != null) {
        document.body.removeChild(menu);
        menu = null;
      }
    };
    var mousedownHandler = function(event) {
      $c.util.$(document).off('mousedown', mousedownHandler);
      dispose();
    };
    $c.util.$(document).on('mousedown', mousedownHandler);
    document.body.appendChild(menu);
    return { dispose : dispose };
  };

  $c.ui = {
    createButton : createButton,
    createDialog : createDialog,
    showMenu : showMenu
  };

}(window.comfortable || (window.comfortable = {}) );
