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

namespace comfortable.editor {

  'use strict';

  export class TextEditor implements CellEditor<HTMLElement> {

    private opts : TextEditorOptions;
    public defaultValue : any;
    private valueType : string;

    private tableModel : TableModel;
    public cell : TableCell;

    public $el : HTMLElement;
    public textfield : HTMLInputElement;
    private button : HTMLElement;
    public enableEvent = true;

    constructor(opts : TextEditorOptions) {

      this.opts = opts;

      if (opts.dataType == 'multi-line-string') {
        this.textfield = <HTMLInputElement>util.createElement('textarea', {
          attrs : { 'class' : '${prefix}-editor', rows : '1' },
          on : {
            blur : (event) => {
              this.tableModel.trigger('valuecommit', this.cell);
            },
            keydown : (event) => {
              if (event.keyCode == 13) { // Enter
                event.stopPropagation();
              }
            }
          }
        });
      } else {
        this.textfield = <HTMLInputElement>util.createElement('input', {
          attrs : { type : 'text', 'class' : '${prefix}-editor' },
          on : { blur : (event) => {
            if (this.enableEvent) {
              this.tableModel.trigger('valuecommit', this.cell); } }
            }
        });
      }

      if (this.opts.dataType == 'number' ||
          this.opts.dataType == 'date') {
        this.textfield.style.imeMode = 'disabled';
      }

      if (this.opts.dataType == 'date') {

        var df = createDateField(this);

        this.$el = df.body;
        this.button = df.button;

      } else {

        util.set(this.textfield, {
          on : { keydown : (event) => {

            if (!this.cell.editable) {
              return;
            }

            switch(event.keyCode) {
            case 27: // Esc
              this.setValue(this.defaultValue);
              break;
            }
          } }
        });

        this.$el = this.textfield;
        this.button = null;
      }
    }

    public setVisible(visible : boolean) {
      if (this.opts.dataType == 'date') {
        this.$el.style.display = visible? 'flex' : 'none';
      } else {
        this.$el.style.display = visible? '' : 'none';
      }
    }

    public beginEdit(td : TdWrapper, cell : TextEditorCell) {

      this.tableModel = td.tableModel;
      this.cell = cell;

      var cs = window.getComputedStyle(td.$el, null);
      var opts : ElementOptions = {
          props : { readOnly : !cell.editable },
          style : {
            textAlign : cs.textAlign,
            verticalAlign : cs.verticalAlign,
            color : cs.color,
            backgroundColor : cs.backgroundColor,
            fontFamily : cs.fontFamily,
            fontSize : cs.fontSize,
            fontWeight : cs.fontWeight,
            outline : cell.editable? '' : 'none'
          }
        };
      if (typeof cell.maxLength == 'number') {
        (<any>opts.props).maxLength = cell.maxLength;
      }
      util.set(this.textfield, opts);
      if (this.button) {
        this.button.style.opacity = cell.editable? '' : '0.5';
      }
    }
    public focus() {
      this.textfield.focus();
      this.textfield.select();
    }
    public blur() {
      this.textfield.blur();
    }
    public setValue(value : any) {
      this.defaultValue = value;
      this.valueType = typeof value;
      if (this.opts.dataType == 'number') {
      } else if (this.opts.dataType == 'date') {
        value = util.formatDate(value);
      }
      this.textfield.value = (value === null)? '' : value;
    }
    public getValue() {
      if (this.opts.dataType == 'number') {
        var value = util.formatNumber(
            util.toNarrowNumber(this.textfield.value),
            this.opts.decimalDigits, '');
        return this.valueType == 'number'? +value : value;
      } else if (this.opts.dataType == 'date') {
        return util.parseDate(
            util.toNarrowNumber(this.textfield.value) );
      }
      return util.rtrim(this.textfield.value);
    }
    public isValid() {
      if (this.opts.dataType == 'number') {
        return !!('' + this.getValue() ).match(util.numRe);
      } else if (this.opts.dataType == 'date') {
        return !!('' + this.getValue() ).match(/^(\d{8})?$/);
      }
      return true;
    }
  }

  var createDateField = function(editor : TextEditor) {

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
      } }
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

    return { body : util.createElement('div', {
      style : { display: 'flex', width: '100%', height: '100%' },
    }, [ editor.textfield, button ] ), button : button };
  }
}
