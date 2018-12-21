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

namespace comfortable.ui {

  'use strict';

  export var createButton = function(
      label : string, action : (event : Event) => void) {
    return util.createElement('button',{
      props : { textContent : label },
      attrs : { 'class' : '${prefix}-button' },
      on : { mousedown : function(event : Event) {
        event.preventDefault();
      }, click : function(event : Event) { action(event); } } });
  }

  export var createDialog = function(children : HTMLElement[]) {
    var dialog = util.extend(new EventTargetImpl(), {
      $el : util.createElement('div', {
          attrs : { 'class' : '${prefix}-dialog' },
          style : { position : 'absolute' }
      }, children),
      show : function() {
        document.body.appendChild(this.$el);
        this.trigger('beforeshow');
        util.callLater(function() {
          util.$(document).on('mousedown', mousedownHandler);
        });
      },
      dispose : function() {
        if (this.$el) {
          util.$(document).off('mousedown', mousedownHandler);
          document.body.removeChild(this.$el);
          this.$el = null;
          this.trigger('dispose');
        }
      }
    } );
    var mousedownHandler = function(event : Event) {
      if (!util.closest(event.target,
          { $el : dialog.$el, root : document.body }) ) {
        dialog.dispose();
      }
    };
    return dialog;
  }

  export interface Menu {
    dispose : () => void;
  }

  export interface MenuItem {
    label : string;
    action? : (event? : Event) => void;
    children? : () => MenuItem[];
  }

  export var showMenu = function(left : number, top : number, menuItems : MenuItem[]) : Menu {
    var subMenu : Menu = null;
    var menu = util.createElement('div', {
      attrs : { 'class' : '${prefix}-contextmenu' },
      style : { position : 'absolute', left : left + 'px', top : top + 'px' } },
      <HTMLElement[]>menuItems.map(function(menuItem) {
        return util.createElement('div', {
            attrs : { 'class' : '${prefix}-menuitem ${prefix}-clickable' },
            props : { textContent : menuItem.label },
            style : { position : 'relative', whiteSpace : 'nowrap' },
            on : {
              mouseover : function(event : Event) {
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
              mousedown : function(event : Event) {
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
    var mousedownHandler = function(event : Event) {
      util.$(document).off('mousedown', mousedownHandler);
      dispose();
    };
    util.$(document).on('mousedown', mousedownHandler);
    document.body.appendChild(menu);
    return { dispose : dispose };
  }

}
