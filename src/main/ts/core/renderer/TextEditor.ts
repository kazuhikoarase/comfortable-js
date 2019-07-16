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

  export class TextEditor implements CellEditor<HTMLElement> {

    private opts : TextEditorOptions;
    private lastStyle : any;

    public defaultValue : any;
    private valueType : string;

    private tableModel : TableModel;
    public cell : TableCell;

    public $el : HTMLElement;
    public textfield : HTMLInputElement;
    public enableEvent = true;

    private delegator : TextEditorDelegator;

    constructor(opts : TextEditorOptions) {

      this.opts = opts;
      this.lastStyle = {};

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

      if (typeof this.opts.imeMode == 'string') {
        this.textfield.style.imeMode = this.opts.imeMode;
      } else {
        if (this.opts.dataType == 'number' ||
            this.opts.dataType == 'date' ||
            this.opts.dataType == 'select-one') {
          this.textfield.style.imeMode = 'disabled';
        }
      }

      if (typeof this.opts.maxLength == 'number') {
        this.textfield.maxLength = this.opts.maxLength;
      }

      if (this.opts.dataType == 'date') {

        var df = createTextEditorDateField(this);

        this.$el = df.body;
        this.delegator = df;

      } else if (this.opts.dataType == 'select-one') {

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
          style : this.getChangedStyle({
            textAlign : cs.textAlign,
            verticalAlign : cs.verticalAlign,
            color : cs.color,
            backgroundColor : cs.backgroundColor,
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
      } else if (this.opts.dataType == 'number') {
        var value = util.formatNumber(
            util.toNarrowNumber(this.textfield.value),
            this.opts.decimalDigits, '');
        return this.valueType == 'number'? +value : value;
      } else {
        return util.rtrim(this.textfield.value);
      }
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
}
