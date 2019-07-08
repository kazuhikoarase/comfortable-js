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

  /**
   * @internal
   */
  export interface OptionsData {
    selectedIndex : number;
    options : any[];
    labelField : string;
    valueField : string;
  }

  export var createTextEditorSelectBox =
      function(editor : TextEditor) : TextEditorDelegator {

    var setSelectedIndex = (index : number) => {
      optionsData.selectedIndex = index;
      editor.textfield.value = index == -1? '' :
        optionsData.options[index][optionsData.labelField];
    };
    var rollIndex = (offset : number) => {
      var index = Math.max(0,
        Math.min(optionsData.selectedIndex + offset,
          optionsData.options.length - 1) );
      if (0 <= index && index < optionsData.options.length) {
        setSelectedIndex(index);
      } else {
        setSelectedIndex(-1);
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
              options.rollIndex(-1);
              setSelectedIndex(options.getSelectedIndex() );
            } else {
              rollIndex(-1);
              editor.textfield.select();
            }
            break;
          case 39: // Right
            break;
          case 40: // Down
            event.preventDefault(); 
            if (options != null) {
              options.rollIndex(1);
              setSelectedIndex(options.getSelectedIndex() );
            } else {
              rollIndex(1);
              editor.textfield.select();
            }
            break;
          default:
            break;
          }
        },
        blur : function() {
          hideOptions();
        }
      }
    });

    var options : any = null;
    var optionsData : OptionsData = null;

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

      options = ui.createOptions(optionsData)
        .on('click', function(event : any, detail : any) {
          setSelectedIndex(detail.index);
          hideOptions();
        });
      editor.enableEvent = false;
      var target = editor.$el;
      var off = util.offset(target);
      util.set(options.$el, { style: {
        position: 'absolute',
        left : off.left + 'px',
        top : (off.top + target.offsetHeight) + 'px',
        minWidth : target.offsetWidth + 'px',
        maxHeight : '200px' } });
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
      attrs : { 'class' : '${prefix}-options-icon-button' },
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
    }, [ ui.createOptionsIcon(), ui.createSpacer() ]);

    var setValue = function(value : any)  {
      var selectedIndex = -1;
      optionsData.options.forEach(function(option, i) {
        if (selectedIndex == -1 &&
            option[optionsData.valueField] === value) {
          selectedIndex = i;
        }
      });
      setSelectedIndex(selectedIndex);
    };
    var getValue = function() : any  {
      return optionsData.selectedIndex == -1? null :
        optionsData.options[optionsData.selectedIndex]
        [optionsData.valueField];
    };
    var visibleState = 'flex';
    var beginEdit = function(td : TdWrapper, cell : SelectBoxCell) {
      optionsData = {
        selectedIndex : -1,
        options : SelectBox.getOptions(cell),
        labelField : cell.labelField || 'label',
        valueField : cell.valueField || 'value'
      };
    };

    return {
      body : util.createElement('div', {
          style : { display: visibleState,
            width: '100%', height: '100%' }
        }, [ editor.textfield, button ] ),
      button : button,
      setValue : setValue,
      getValue : getValue,
      visibleState : visibleState,
      readOnlyText : true,
      beginEdit : beginEdit
    };
  }
}
