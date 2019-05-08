/**
 * comfortable
 *
 * Copyright (c) 2018 Kazuhiko Arase
 *
 * URL: https://github.com/kazuhikoarase/comfortable-js/
 *
 * Licensed under the MIT license:
 *  http://www.opensource.org/licenses/mit-license.php
 */

namespace comfortable.ui {

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

  export var createButton = function(
      label : string, action : (event : Event) => void) {
    return util.createElement('button',{
      props : { textContent : label },
      attrs : { 'class' : '${prefix}-button' },
      style : { verticalAlign : 'top' },
      on : { mousedown : function(event : Event) {
        event.preventDefault();
      }, click : function(event : Event) { action(event); } } });
  };

  // three state checkbox
  export var createCheckBox = function() : CheckBox {

    // fix for layout collapse by bootstrap.
    var antiBsGlobals : { [k : string] : string } = {
        verticalAlign :'top',
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
  };

  export var createDialog = function(children : HTMLElement[]) : Dialog {
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
  };

  export var showMenu = function(
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
  };

  var createCalTable = function(
      year : number, month : number, current : Date, selected : Date) {

    var base = new Date(year, month, 1);
    var weekdays = i18n.getMessages().WEEKDAYS.split(/,/g);

    var thead = util.createElement('thead');
    var tbody = util.createElement('tbody');

    thead.appendChild(util.createElement('tr', weekdays.map(function(wd, day) {
      var className = '';
      if (day == 0 || day == 6) {
        className += ' ${prefix}-holiday';
      }
      return util.createElement('th',
          { props: { textContent : wd }, attrs: { 'class': className } })
    }) ) );

    var d = 0;
    for (var r = 0; r < 6; r += 1) {
      tbody.appendChild(util.createElement('tr', weekdays.map(function() {
        var date = new Date(
            base.getFullYear(),
            base.getMonth(),
            base.getDate() - base.getDay() + d);
        d += 1;
        var className = '';
        if (util.isHoliday(date) ) {
          className += ' ${prefix}-holiday';
        }
        if (date.getMonth() == base.getMonth() ) {
          className += ' ${prefix}-this-month';
          if (date.getFullYear() == selected.getFullYear() &&
              date.getMonth() == selected.getMonth() &&
              date.getDate() == selected.getDate() ) {
            className += ' ${prefix}-selected-date';
          }
          if (date.getFullYear() == current.getFullYear() &&
              date.getMonth() == current.getMonth() &&
              date.getDate() == current.getDate() ) {
            className += ' ${prefix}-current-date';
          }
        }
        return util.createElement('td',
            { props: { textContent: '' + date.getDate() },
              attrs: { 'class': className },
              on: { mousedown: function(event) { event.preventDefault(); },
                click: function() {
                  table.trigger('click', date);
                } } });
      }) ) );
    }
    var table = util.extend(new EventTargetImpl(), {
      $el: util.createElement('table',
        { attrs: { 'class': '${prefix}-cal-table' } }, [ thead, tbody ])
    });
    return table;
  };

  var createCalButton = function(prev : boolean, action : () => void) {
    return util.createElement('span',
        { style: { display: 'inline-block', float: prev? 'left' : 'right' },
          attrs: { 'class': '${prefix}-cal-button' },
          on: { mousedown: function(event) { event.preventDefault(); },
            click: action } },
        [ util.createSVGElement('svg',
            { attrs: { width: '16', height: '16',
              'class': '${prefix}-cal-button-symbol' },
              style: { verticalAlign: 'middle' } },
            [ util.createSVGElement('path',
                { attrs: { d: 'M3 2L13 8L3 14Z',
                  transform: prev?
                    'translate(8,8) rotate(180) translate(-8,-8)' : '' } }) ]),
          createSpacer()
        ]);
  };

  export var createSpacer = function() {
    return util.createElement('span',{ style: { verticalAlign:'middle',
        display:'inline-block', height: '100%' } });
  };

  export var createCalIcon = function(r? : number) {
    r = r || 3;
    var w = r * 5 + 1;
    var calIcon = util.createElement('canvas', {
      style : { verticalAlign: 'middle' },
      props : { width: '' + w, height: '' + w,
         },
      on : {
        click : function(event) {
        }
      }
    });
    var ctx = (<any>calIcon).getContext('2d');
    ctx.clearRect(0, 0, w, w);
    for (var x = 0; x < w; x += 1) {
      for (var y = 0; y < w; y += 1) {
        if (x % r== 0 || y % r == 0) {
          if (0 < y && y < r && r < x && x < r * 4) {
          } else {
            ctx.fillStyle = '#333';
            ctx.fillRect(x, y, 1, 1);
          }
        } else if (~~(x / r) == 3 && ~~(y / r) == 3) {
          ctx.fillStyle = '#f96';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    return calIcon;
  };

  export var createCalendar = function(selectedDate : Date) {

    var displayDate : Date = null;
    var setDisplayDate = function(date : Date) {
      displayDate = new Date(date.getFullYear(), date.getMonth(), 1);
    }

    var defaultSelected = selectedDate;
    setDisplayDate(defaultSelected);

    var prev = createCalButton(true, function() {
      displayDate = new Date(displayDate.getFullYear(),
        displayDate.getMonth() - 1, 1);
      update();
    });
    var next = createCalButton(false, function() {
      displayDate = new Date(displayDate.getFullYear(),
        displayDate.getMonth() + 1, 1);
      update();
    });

    var title = util.createElement('span',
        { style: { verticalAlign: 'middle' } });
    var titleBody = util.createElement('span',
        { style: { flex: '1 1 0%', textAlign: 'center' },
          on: { mousedown: function(event : any) { event.preventDefault(); },
            click: function() {
              setDisplayDate(defaultSelected);
              update();
            } } }, [ title, createSpacer() ]);
    var header = util.createElement('div',
        { style: { display: 'flex' } }, [ prev, titleBody, next ]);

    var cal = util.extend(new EventTargetImpl(), {
      $el: util.createElement('div', [ header ],
        { attrs: { 'class': '${prefix}-calendar' } }),
      rollDate: function(offset : number) {
        selectedDate = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(), 
          selectedDate.getDate() + offset);
        setDisplayDate(selectedDate);
        update();
      },
      getSelectedDate : function() {
        return selectedDate;
      }
    });
    var table : any = null;

    var update = function() {
      title.textContent = util.formatYM(
          displayDate.getFullYear(),
          displayDate.getMonth() );
      if (table) {
        cal.$el.removeChild(table.$el);
        table = null;
      }
      table = createCalTable(
          displayDate.getFullYear(),
          displayDate.getMonth(), 
          selectedDate,
          defaultSelected).on('click',
        function(event : any, date : Date) {
          cal.trigger(event.type, date);
        });
      cal.$el.appendChild(table.$el);
    };
    update();

    return cal;
  };

}
