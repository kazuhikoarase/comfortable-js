/*!
 * comfortable
 *
 * Copyright (c) 2018 Kazuhiko Arase
 *
 * URL: https://github.com/kazuhikoarase/comfortable-js/
 *
 * Licensed under the MIT license:
 *  http://www.opensource.org/licenses/mit-license.php
 */

namespace comfortable {

  'use strict';

  export interface Menu {
    dispose : () => void;
  }

  export interface MenuItem {
    label : string;
    action? : (event? : Event) => void;
    children? : () => MenuItem[];
  }

  export interface CheckBox {
    $el : HTMLElement;
    checked : boolean;
    setIncomplete : (incomplete : boolean) => void;
    setChecked : (checked : boolean) => void;
    isChecked : () => boolean;
  }

  export interface Dialog extends EventTarget {
    $el : HTMLElement;
    show : () => void;
    dispose : () => void;
  }

  export var ui = {

    createButton : function(
        label : string, action : (event : Event) => void) {
      return util.createElement('button',{
        props : { textContent : label },
        attrs : { 'class' : '${prefix}-button' },
        style : { verticalAlign : 'top' },
        on : { mousedown : function(event : Event) {
          event.preventDefault();
        }, click : function(event : Event) { action(event); } } });
    },

    // three state checkbox
    createCheckbox : function() : CheckBox {
  
      // fix for layout collapse by bootstrap.
      var antiBsGlobals : { [k : string] : string } = {
          verticalAlign :'baseline',
          boxSizing : 'content-box',
          lineHeight : '1' };
  
      var path = util.createSVGElement('path', { attrs : {
          'class' : '${prefix}-checkbox-check',
          d : 'M 2 5 L 5 9 L 10 3'
        },
        style : antiBsGlobals });
      return {
        $el : util.createElement('span', {
          attrs : { 'class' : '${prefix}-checkbox-body' },
          style : util.extend(antiBsGlobals, { display : 'inline-block',
            width : '12px', height : '12px' }
          )}, [
            util.createSVGElement('svg', {
              attrs : { width : '12', height : '12' },
              style : antiBsGlobals }, [ path ])
          ] ),
        checked : true,
        setIncomplete : function(incomplete) {
          util.$(path).addClass(
              '${prefix}-checkbox-incomplete-check', !incomplete);
        },
        setChecked : function(checked) {
          this.checked = checked;
          path.style.display = this.checked? '' : 'none';
        },
        isChecked : function() {
          return this.checked;
        }
      };
    },

    createDialog : function(children : HTMLElement[]) : Dialog {
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
    },

    showMenu : function(
        left : number, top : number, menuItems : MenuItem[]) : Menu {
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
                    subMenu = ui.showMenu(
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

}
