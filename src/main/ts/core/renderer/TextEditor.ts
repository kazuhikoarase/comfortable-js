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
  export interface TextEditorDelegator {
    body : HTMLElement;
    button : HTMLElement;
    getValue() : any;
    setValue(value : any) : void;
    visibleState : string;
    readOnlyText? : boolean;
    beginEdit? : (td : TdWrapper, cell : TableCell) => void;
  }

  export class TextEditor
  implements CellEditor<HTMLElement,TextEditorOptions> {

    private lastStyle : any;

    public defaultValue : any;
    private valueType : string;

    private tableModel : TableModel;
    public cell : TableCell;

    public $el : HTMLElement;
    public textfield : HTMLInputElement;
    public enableEvent = true;

    private dataType : string;
    private decimalDigits : number;
    private delegator : TextEditorDelegator;

    constructor(dataType : string) {

      this.dataType = dataType;

      this.lastStyle = {};

      if (dataType == 'multi-line-string') {
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

      if (dataType == 'date') {

        var df = createTextEditorDateField(this);

        this.$el = df.body;
        this.delegator = df;

      } else if (dataType == 'select-one') {

        var sb = createTextEditorSelectBox(this);

        this.$el = sb.body;
        this.delegator = sb;

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
        this.delegator = null;
      }
    }

    public init(opts : TextEditorOptions) {
      delete this.textfield.style.imeMode;
      delete this.textfield.maxLength;
      this.decimalDigits = opts.decimalDigits;
      if (typeof opts.imeMode == 'string') {
        this.textfield.style.imeMode = opts.imeMode;
      } else {
        if (this.dataType == 'number' ||
            this.dataType == 'date' ||
            this.dataType == 'select-one') {
          this.textfield.style.imeMode = 'disabled';
        }
      }
      if (typeof opts.maxLength == 'number') {
        this.textfield.maxLength = opts.maxLength;
      }
    }

    public setVisible(visible : boolean) {
      if (this.delegator) {
        this.$el.style.display = visible?
          this.delegator.visibleState : 'none';
      } else {
        this.$el.style.display = visible? '' : 'none';
      }
    }

    public beginEdit(td : TdWrapper, cell : TextEditorCell) {

      this.tableModel = td.tableModel;
      this.cell = cell;

      var readOnly = !cell.editable;
      if (this.delegator && this.delegator.readOnlyText) {
        // force readOnly
        readOnly = true;
      }

      var cs = window.getComputedStyle(td.$el, null);
      var opts : ElementOptions = {
          props : { readOnly : readOnly },
          attrs : { tabindex : cell.editable? '0' : '-1' },
          style : this.getChangedStyle({
            textAlign : cs.textAlign,
            verticalAlign : cs.verticalAlign,
            color : cs.color,
            backgroundColor : 'transparent',
            fontFamily : cs.fontFamily,
            fontSize : cs.fontSize,
            fontWeight : cs.fontWeight,
            outline : cell.editable? '' : 'none'
          })
        };
      util.set(this.textfield, opts);
      if (this.delegator) {
        this.delegator.button.style.opacity = cell.editable? '' : '0.5';
        if (this.delegator.beginEdit) {
          this.delegator.beginEdit(td, cell);
        }
      }
    }
    private getChangedStyle(style : any) : any {
      var changed : any = {};
      for (var k in style) {
        var v = style[k];
        if (this.lastStyle[k] !== v) {
          this.lastStyle[k] = changed[k] = v;
        }
      }
      return changed;
    }
    public focus() {
      this.textfield.focus();
      this.textfield.select();
    }
    public blur() {
      this.textfield.blur();
      // deselect
      var value =  this.textfield.value;
      this.textfield.value = '';
      this.textfield.value = value;
    }
    public setValue(value : any) {
      this.defaultValue = value;
      this.valueType = typeof value;
      if (this.delegator) {
        this.delegator.setValue(value);
      //} else if (this.opts.dataType == 'number') {
      } else {
        this.textfield.value = (value === null)? '' : value;
      }
    }
    public getValue() {
      if (this.defaultValue === null && this.textfield.value == '') {
        return null;
      } else if (this.delegator) {
        return this.delegator.getValue();
      } else if (this.dataType == 'number') {
        var value = util.formatNumber(
            util.toNarrowNumber(this.textfield.value),
            this.decimalDigits, '');
        return this.valueType == 'number'? +value : value;
      } else {
        return util.rtrim(this.textfield.value);
      }
    }
    public isValid() {
      if (this.dataType == 'number') {
        return !!('' + this.getValue() ).match(util.numRe);
      } else if (this.dataType == 'date') {
        return !!('' + this.getValue() ).match(/^(\d{8})?$/);
      }
      return true;
    }
  }
}
