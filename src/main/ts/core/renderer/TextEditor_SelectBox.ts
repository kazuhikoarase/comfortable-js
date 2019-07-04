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
  var createOptions = function() {
    return util.extend(new EventTargetImpl(), {
      $el: util.createElement('div', { props : { textContent : 'hi!' } }) });
  }

  export var createTextEditorSelectBox =
      function(editor : TextEditor) : TextEditorDelegator {

    var setSelectedDate = (date : Date) => {
      editor.textfield.value = util.formatDate(util.parseDate(date) );
    };

    util.set(editor.textfield, {
      style : { flex: '1 1 0%' },
      on : { keydown : (event) => {

        if (!editor.cell.editable) {
          return;
        }

        var canceled = false;
        switch(event.keyCode) {
        case 27: // Esc
          // fall through.
          canceled = true;
        case 13: // Enter
          if (options) {
            event.preventDefault();
            event.stopPropagation();
            hideOptions();
            editor.textfield.select();
          } else {
            if (canceled) {
              editor.setValue(editor.defaultValue);
            }
          }
          break;
        case 32: // Space
          event.preventDefault();
          if (options) {
          } else {
            showOptions();
          }
          break;
        case 37: // Left
          break;
        case 38: // Up
          event.preventDefault();
          if (options != null) {
//            cal.rollDate(-7);
//            setSelectedDate(cal.getSelectedDate() );
          } else {
//            rollDate(-1);
//            editor.textfield.select();
          }
          break;
        case 39: // Right
          break;
        case 40: // Down
          event.preventDefault(); 
          if (options != null) {
//            cal.rollDate(7);
//            setSelectedDate(cal.getSelectedDate() );
          } else {
//            rollDate(1);
//            editor.textfield.select();
          }
          break;
        default:
          break;
        }
      } }
    });

    var options : any = null;

    var mousedownHandler = function(event : any) {
      if (options && util.closest(event.target, { $el: options.$el }) ) {
      } else if (util.closest(event.target, { $el: button }) ) {
      } else {
        hideOptions();
      }
    };
    var showOptions = function() {
      if (options) {
        hideOptions();
      }
      options = createOptions()
        .on('click', function(event : any, date : Date) {
          setSelectedDate(date);
          hideOptions();
        });
      editor.enableEvent = false;
      var off = util.offset(editor.textfield);
      util.set(options.$el, { style: {
        position: 'absolute',
        left : off.left + 'px',
        top : (off.top + editor.textfield.offsetHeight) + 'px' } });
      document.body.appendChild(options.$el);
      util.$(document).on('mousedown', mousedownHandler);
    };
    var hideOptions = function() {
      if (options) {
        document.body.removeChild(options.$el);
        util.$(document).off('mousedown', mousedownHandler);
        options = null;
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
          if (options) {
            hideOptions();
          } else {
            showOptions() ;
          }
        }
      }
    }, [ ui.createCalIcon(), ui.createSpacer() ]);

    var setValue = function(value : any)  {
      value = util.formatDate(value);
      editor.textfield.value = (value === null)? '' : value;
    }
    var getValue = function() : any  {
      return util.parseDate(
          util.toNarrowNumber(editor.textfield.value) );
    }
    var visibleState = 'flex';

    return {
      body : util.createElement('div', {
          style : { display: visibleState,
            width: '100%', height: '100%' }
        }, [ editor.textfield, button ] ),
      button : button,
      setValue : setValue,
      getValue : getValue,
      visibleState : visibleState,
      readOnlyText : true
    };
  }
}
