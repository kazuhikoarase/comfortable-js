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

namespace comfortable {

  'use strict';

  class TextEditor implements CellEditor<HTMLElement> {

    private opts : TextEditorOptions;
    private defaultValue : any;
    private valueType : string;

    private tableModel : TableModel;
    private cell : TableCell;

    public $el : HTMLElement;
    private textfield : HTMLInputElement;
    private button : HTMLElement;
    private enableEvent = true;

    constructor(opts : TextEditorOptions) {
      this.opts = opts;

      if (opts.dataType == 'multi-line-string') {
        this.textfield = <HTMLInputElement>util.createElement('textarea', {
          attrs : { 'class' : '${prefix}-editor', rows : '1' },
          on : {
            blur : (event) => {
              if (this.$el.style.display) {
                this.tableModel.trigger('valuecommit', this.cell);
              }
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
            if (this.enableEvent && this.$el.style.display) {
              this.tableModel.trigger('valuecommit', this.cell); } }
            }
        });
      }

      if (this.opts.dataType == 'number' ||
          this.opts.dataType == 'date') {
        this.textfield.style.imeMode = 'disabled';
      }

      if (this.opts.dataType == 'date') {

        var df = this.createDateField();

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

    private createDateField() {
      var setSelectedDate = (date : Date) => {
        this.textfield.value = util.formatDate(util.parseDate(date) );
      };
      var rollDate = (offset : number) => {
        var date = this.getDate();
        if (date) {
          date.setDate(date.getDate() + offset);
          setSelectedDate(date);
        }
      };
      util.set(this.textfield, {
        style : { flex: '1 1 0%' },
        on : { keydown : (event) => {

          if (!this.cell.editable) {
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
              this.textfield.select();
            } else {
              if (canceled) {
                this.setValue(this.defaultValue);
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
              this.textfield.select();
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
              this.textfield.select();
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
        cal = ui.createCalendar(this.getDate() || new Date() )
          .on('click', function(event : any, date : Date) {
            setSelectedDate(date);
            hideCal();
          });
        this.enableEvent = false;
        var off = util.offset(this.textfield);
        util.set(cal.$el, { style: {
          position: 'absolute',
          left : off.left + 'px',
          top : (off.top + this.textfield.offsetHeight) + 'px' } });
        document.body.appendChild(cal.$el);
        util.$(document).on('mousedown', mousedownHandler);
      }.bind(this);
      var hideCal = function() {
        if (cal) {
          document.body.removeChild(cal.$el);
          util.$(document).off('mousedown', mousedownHandler);
          cal = null;
          this.enableEvent = true;
        }
      }.bind(this);
      var button = util.createElement('span', {
        attrs : { 'class' : '${prefix}-cal-icon-button' },
        on : {
          mousedown : function(event) {
            event.preventDefault();
          },
          click : (event) => {
            if (!this.cell.editable) {
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
      }, [ this.textfield, button ] ), button : button };
    }

    private getDate() : Date {
      if (this.isValid() ) {
        var value = <string>this.getValue();
        if (value) {
          return new Date(
            +value.substring(0, 4),
            +value.substring(4, 6) - 1,
            +value.substring(6, 8) );
        }
      }
      return null;
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
      this.textfield.value = value || '';
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

  class CheckBox implements CellEditor<HTMLInputElement> {

    private opts : CheckBoxOptions;
    private booleanValues : any[] = null;
    private defaultValue : any;

    private tableModel : TableModel;
    private cell : TableCell;

    constructor(opts : CheckBoxOptions) {
      this.opts = opts;
    }

    public $el = <HTMLInputElement>util.createElement('input', {
      attrs : { type : 'checkbox', 'class' : '${prefix}-editor' },
      on : {
        blur : (event) => {
          this.tableModel.trigger('valuecommit', this.cell);
        },
        keydown : (event) => {

          if (!this.cell.editable) {
            return;
          }

          switch(event.keyCode) {
          case 27: // Esc
            this.setValue(this.defaultValue);
            break;
          }
        }
      }
    });

    public setVisible(visible : boolean) {
      this.$el.style.display = visible? '' : 'none';
    }

    public beginEdit(td : TdWrapper, cell : CheckBoxCell) {

      this.tableModel = td.tableModel;
      this.cell = cell;

      var cs = window.getComputedStyle(td.$el, null);
      util.set(this.$el, {
        props : { disabled : !cell.editable },
        style : {
        }
      });
      this.booleanValues = cell.booleanValues || [false, true];
    }
    public focus() {
      this.$el.focus();
      this.$el.select();
    }
    public blur() {
      this.$el.blur();
    }
    public setValue(value : any) {
      this.defaultValue = value;
      this.$el.checked = (value === this.booleanValues[1]);
    }
    public getValue() {
      return this.booleanValues[this.$el.checked? 1 : 0];
    }
    public isValid() {
      return true;
    }
  }

  class SelectBox implements CellEditor<HTMLSelectElement> {

    private opts : SelectBoxOptions;
    private defaultValue : any;

    private tableModel : TableModel;
    private cell : TableCell;

    constructor(opts : SelectBoxOptions) {
      this.opts = opts;
    }

    public $el = <HTMLSelectElement>util.createElement('select', {
      attrs : { 'class' : '${prefix}-editor' },
      on : {
        blur : (event) => {
          this.tableModel.trigger('valuecommit', this.cell);
        },
        keydown : (event) => {

          if (!this.cell.editable) {
            return;
          }

          switch(event.keyCode) {
          case 27: // Esc
            this.setValue(this.defaultValue);
            break;
          }
        }
      }
    });

    public setVisible(visible : boolean) {
      this.$el.style.display = visible? '' : 'none';
    }

    public beginEdit(td : TdWrapper, cell : SelectBoxCell) {

      this.tableModel = td.tableModel;
      this.cell = cell;

      var cs = window.getComputedStyle(td.$el, null);
      util.set(this.$el, {
        props : { disabled : !cell.editable },
        style : {
          textAlign : cs.textAlign,
          verticalAlign : cs.verticalAlign,
          color : cs.color,
          backgroundColor : cs.backgroundColor,
          fontFamily : cs.fontFamily,
          fontSize : cs.fontSize,
          fontWeight : cs.fontWeight
        }
      });
      var options = SelectBox.getOptions(cell);
      while (this.$el.childNodes.length < options.length) {
        this.$el.appendChild(util.createElement('option') );
      }
      var labelField = cell.labelField || 'label';
      var valueField = cell.valueField || 'value';
      var i = 0;
      for (; i < options.length; i += 1) {
        var option = options[i];
        util.set(this.$el.childNodes[i], {
          style : { display : '' },
          props : { textContent : option[labelField],
            value : option[valueField] }
        });
      }
      while (this.$el.childNodes.length > options.length) {
        this.$el.removeChild(this.$el.lastChild);
      }
      // IE9 does not support style.display=none for option.
      /*
      for (;i < select.childNodes.length; i += 1) {
        select.childNodes[i].style.display = 'none';
      }
      */
    }
    public focus() {
      this.$el.focus();
    }
    public blur() {
      this.$el.blur();
    }
    public setValue(value : any) {
      this.defaultValue = value;
      this.$el.value = value;
    }
    public getValue() {
      return this.$el.value;
    }
    public isValid() {
      return true;
    }

    public static getOptions(cell : SelectBoxCell) : any[] {
      var options : any = cell.options;
      if (typeof options == 'function') {
        options = options(cell.row, cell.col);
      }
      return options || [];
    }
  }

  interface Tooltip {
    $el : HTMLElement;
    text : string;
    dispose : () => void;
  }

  var createTooltip = function(td : TdWrapper) : Tooltip {
    var size = 6;
    var tooltip : { dispose : () => void } = null;
    var mouseoverHandler = function(event : any) {
      if (!mark.text) {
        return;
      }
      dispose();
      tooltip = showTooltip(td, mark.text);
    };
    var mouseoutHandler = function(event : any) {
      dispose();
    };
    var dispose = function() {
      if (tooltip) {
        tooltip.dispose();
        tooltip = null;
      }
    };
    util.$(td.$el)
      .on('mouseover', mouseoverHandler)
      .on('mouseout', mouseoutHandler);
    var mark = {
      $el : util.createSVGElement('svg', {
        style : { position : 'absolute', right : '0px', top : '0px'},
          attrs : { width : '' + size, height : '' + size,
        'class' : '${prefix}-tooltip-corner' } }, [
        util.createSVGElement('path', {
          attrs : { d : 'M0 0L' + size + ' 0L' + size + ' ' + size + 'Z' }
        })
      ]),
      text : '',
      dispose : function() {
        util.$(td.$el)
          .off('mouseover', mouseoverHandler)
          .off('mouseout', mouseoutHandler);
        dispose();
      }
    };
    return mark;
  };

  var showTooltip = function(td : TdWrapper, text : string) {

    var barW = 10;
    var barH = 6;

    var box = util.createElement('div', {
      style : { position : 'absolute' },
      attrs : { 'class' : '${prefix}-tooltip-box' } });
    var bar = util.createSVGElement('svg', {
        style : { position : 'absolute' },
        attrs : { width : '' + barW, height : '' + barH } },
      [ util.createSVGElement('path', {
          attrs : { d : 'M0 ' + barH + 'L' + barW + ' 0' } }) ]);
    document.body.appendChild(box);
    document.body.appendChild(bar);

    var cs = window.getComputedStyle(box, null);
    bar.style.stroke = cs.borderColor || cs.borderBottomColor;
    bar.style.fill = 'none';

    var off = util.offset(td.$el);
    //box.textContent = text;
    createMultiLineLabelRenderer(box).setLabel(text);

    box.style.left = (off.left + td.$el.offsetWidth + barW - 1) + 'px';
    box.style.top = (off.top - barH + 1) + 'px';
    bar.style.left = (off.left + td.$el.offsetWidth) + 'px';
    bar.style.top = (off.top - barH + 1) + 'px';

    return {
      dispose : function() {
        document.body.removeChild(box);
        document.body.removeChild(bar);
      }
    };
  };

  export var createDefaultCellRendererFactoryOpts =
      function() : CellRendererFactoryOpts {
    return {
      // value to label
      labelFunction : function(value, cell) {

        if (typeof cell.labelFunction == 'function') {

          return cell.labelFunction(value, cell);

        } else if (value === null || typeof value == 'undefined') {

          return '';

        } else if (this.dataType == 'number') {

          return util.formatNumber(value, this.decimalDigits);

        } else if (this.dataType == 'date') {

          return util.formatDate(value);

        } else if (this.dataType == 'select-one') {

          var options = SelectBox.getOptions(cell);
          if (typeof options.splice != 'function') {
            // not an Array.
            return options[value] || '';
          }

          var labelField = (<SelectBoxCell>cell).labelField || 'label';
          var valueField = (<SelectBoxCell>cell).valueField || 'value';
          for (var i = 0; i < options.length; i += 1) {
            var option = options[i];
            if (option[valueField] == value) {
              return option[labelField];
            }
          }
          return '';
 
        } else {

          // by default, to string.
          return '' + value;

        }
      },
      // create an editor
      createEditor : function() {
        if (this.dataType == 'select-one') {
          return new SelectBox(this);
        } else if (this.dataType == 'boolean') {
          return new CheckBox(this);
        }
        return new TextEditor(this);
      }
    };
  };

  export var createDefaultCellRendererFactory =
      function(opts? : CellRendererFactoryOpts) :
        TableCellRendererFactory {

    opts = util.extend(createDefaultCellRendererFactoryOpts(), opts || {});

    return function(td : TdWrapper) : TableCellRenderer {

      var labelRenderer = createMultiLineLabelRenderer(td.$el);
      var editor : CellEditor<any> = null;
      var oldValue : any = null;

      var tooltip : Tooltip = null;

      var beginEdit = function(cell : EditorCell) {
        if (editor == null) {
          editor = opts.createEditor();
          td.$el.appendChild(editor.$el);
        }
        labelRenderer.setVisible(false);
        editor.beginEdit(td, cell);
        editor.setVisible(true);
        editor.setValue(oldValue = cell.value);
      };

      var renderIsEditor = opts.renderIsEditor;
      if (typeof renderIsEditor == 'undefined') {
        renderIsEditor = opts.dataType == 'boolean' ||
          opts.dataType == 'select-one' ||
          opts.dataType == 'date' ||
          opts.dataType == 'multi-line-string';
      }

      var editing = false;

      return {
        render : function(cell) {

          if (cell.tooltip) {
            if (!tooltip) {
              tooltip = createTooltip(td);
              td.$el.appendChild(tooltip.$el);
            }
            tooltip.text = cell.tooltip;
            tooltip.$el.style.display = '';
          } else {
            if (tooltip) {
              tooltip.text = '';
              tooltip.$el.style.display = 'none';
            }
          }

          if (!renderIsEditor) {
            labelRenderer.setLabel(opts.labelFunction(cell.value, cell) );
            if (!cell.textAlign && opts.dataType == 'number') {
              td.$el.style.textAlign = 'right';
            }
          } else {
            // render is editor.
            if (!editing) {
              beginEdit(cell);
            }
          }
        },
        beginEdit : function(cell) {
          editing = true;
          beginEdit(cell);
          return {
            focus : function() {
              editor.focus();
            },
            endEdit : function() {
              editing =false;
              if (!renderIsEditor) {
                labelRenderer.setVisible(true);
                editor.setVisible(false);
              } else {
                editor.blur();
              }
              return { oldValue : oldValue,
                newValue : editor.isValid()? editor.getValue() : oldValue };
            }
          };
        },
        dispose : function() {
          if (tooltip) {
            tooltip.dispose();
            tooltip = null;
          }
        }
      };
    };
  };

  var linesRe = /\r?\n/g;

  export var createMultiLineLabelRenderer = function(parent : HTMLElement) {
    var elms : HTMLElement[] = null;
    return {
      setLabel : function(label : string) {
        if (elms == null) {
          elms = [ document.createElement('span') ];
          parent.appendChild(elms[0]);
        }
        var lines = label.split(linesRe);
        elms[0].textContent = lines[0];
        var elmIndex = 1;
        for (var i = 1; i < lines.length; i += 1) {
          if (elmIndex + 1 >= elms.length) {
            elms.push(document.createElement('br') );
            elms.push(document.createElement('span') );
            parent.appendChild(elms[elmIndex]);
            parent.appendChild(elms[elmIndex + 1]);
          }
          elms[elmIndex].style.display = '';
          elms[elmIndex + 1].style.display = '';
          elms[elmIndex + 1].textContent = lines[i];
          elmIndex += 2;
        }
        for (; elmIndex < elms.length; elmIndex += 1) {
          elms[elmIndex].style.display = 'none';
        }
      },
      setVisible : function(visible : boolean) {
        if (elms != null) {
          for (var i = 0; i < elms.length; i += 1) {
            elms[i].style.display = visible? '' : 'none';
          }
        }
      }
    };
  }

}
