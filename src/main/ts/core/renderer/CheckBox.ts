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

  export class CheckBox implements CellEditor<HTMLInputElement> {

    private booleanValues : any[] = null;
    private defaultValue : any;

    private tableModel : TableModel;
    private cell : TableCell;

    constructor() {
    }

    public $el = <HTMLInputElement>util.createElement('input', {
      attrs : { type : 'checkbox', 'class' : '${prefix}-editor',
        tabindex : '-1' },
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
}
