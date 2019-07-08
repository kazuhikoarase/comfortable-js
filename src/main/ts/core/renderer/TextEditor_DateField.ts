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

namespace comfortable.renderer {

  export var createTextEditorDateField =
      function(editor : TextEditor) : TextEditorDelegator {

    var getDate = function() : Date {
      if (editor.isValid() ) {
        var value = <string>editor.getValue();
        if (value) {
          return new Date(
            +value.substring(0, 4),
            +value.substring(4, 6) - 1,
            +value.substring(6, 8) );
        }
      }
      return null;
    };

    var setSelectedDate = (date : Date) => {
      editor.textfield.value = util.formatDate(util.parseDate(date) );
    };

    var rollDate = (offset : number) => {
      var date = getDate();
      if (date) {
        date.setDate(date.getDate() + offset);
        setSelectedDate(date);
      }
    };

    util.set(editor.textfield, {
      style : { flex: '1 1 0%' },
        on : {
          keydown : (event) => {

          if (!editor.cell.editable) {
            return;
          }

          var canceled = false;
          switch(event.keyCode) {
          case 27: // Esc
            // fall through.
            canceled = true;
          case 13: // Enter
            if (cal) {
              event.preventDefault();
              event.stopPropagation();
              hideCal();
              editor.textfield.select();
            } else {
              if (canceled) {
                editor.setValue(editor.defaultValue);
              }
            }
            break;
          case 32: // Space
            event.preventDefault();
            if (cal) {
            } else {
              showCal();
            }
            break;
          case 37: // Left
            if (cal != null) {
              event.preventDefault();
              cal.rollDate(-1);
              setSelectedDate(cal.getSelectedDate() );
            }
            break;
          case 38: // Up
            event.preventDefault();
            if (cal != null) {
              cal.rollDate(-7);
              setSelectedDate(cal.getSelectedDate() );
            } else {
              rollDate(-1);
              editor.textfield.select();
            }
            break;
          case 39: // Right
            if (cal != null) {
              event.preventDefault();
              cal.rollDate(1);
              setSelectedDate(cal.getSelectedDate() );
            }
            break;
          case 40: // Down
            event.preventDefault(); 
            if (cal != null) {
              cal.rollDate(7);
              setSelectedDate(cal.getSelectedDate() );
            } else {
              rollDate(1);
              editor.textfield.select();
            }
            break;
          default:
            break;
          }
        },
        blur : function() {
          hideCal();
        }
      }
    });

    var cal : any = null;

    var mousedownHandler = function(event : any) {
      if (cal && util.closest(event.target, { $el: cal.$el }) ) {
      } else if (util.closest(event.target, { $el: button }) ) {
      } else {
        hideCal();
      }
    };
    var showCal = function() {
      if (cal) {
        hideCal();
      }
      cal = ui.createCalendar(getDate() || new Date() )
        .on('click', function(event : any, date : Date) {
          setSelectedDate(date);
          hideCal();
        });
      editor.enableEvent = false;
      var off = util.offset(editor.textfield);
      util.set(cal.$el, { style: {
        position: 'absolute',
        left : off.left + 'px',
        top : (off.top + editor.textfield.offsetHeight) + 'px' } });
      document.body.appendChild(cal.$el);
      util.$(document).on('mousedown', mousedownHandler);
    };
    var hideCal = function() {
      if (cal) {
        document.body.removeChild(cal.$el);
        util.$(document).off('mousedown', mousedownHandler);
        cal = null;
        editor.enableEvent = true;
      }
    };
    var button = util.createElement('span', {
      attrs : { 'class' : '${prefix}-cal-icon-button' },
      on : {
        mousedown : function(event) {
          event.preventDefault();
        },
        click : (event) => {
          if (!editor.cell.editable) {
            return;
          }
          if (cal) {
            hideCal();
          } else {
            showCal() ;
          }
        }
      }
    }, [ ui.createCalIcon(), ui.createSpacer() ]);

    var setValue = function(value : any)  {
      value = util.formatDate(value);
      editor.textfield.value = (value === null)? '' : value;
    };
    var getValue = function() : any  {
      return util.parseDate(
          util.toNarrowNumber(editor.textfield.value) );
    };
    var visibleState = 'flex';

    return {
      body : util.createElement('div', {
          style : { display: visibleState,
            width: '100%', height: '100%' }
        }, [ editor.textfield, button ] ),
      button : button,
      setValue : setValue,
      getValue : getValue,
      visibleState : visibleState
    };
  }
}
