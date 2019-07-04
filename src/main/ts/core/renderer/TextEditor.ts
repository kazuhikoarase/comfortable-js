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

}
