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

  export class SelectBox implements CellEditor<HTMLSelectElement> {

    private opts : SelectBoxOptions;
    private defaultValue : any;
    private lastOptions : any[];

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
      var labelField = cell.labelField || 'label';
      var valueField = cell.valueField || 'value';

      var changed = function() {
        if (!this.lastOptions || this.lastOptions.length != options.length) {
          return true;
        }
        for (var i = 0; i < options.length; i += 1) {
          var option = options[i];
          var lastOption = this.lastOptions[i];
          if (option[labelField] != option[labelField] ||
              option[valueField] != option[valueField]) {
            return true;
          }
        }
        return false;
      }.bind(this)();
      console.log('beginEdit, changed:' + changed);
      if (changed) {
        while (this.$el.childNodes.length < options.length) {
          this.$el.appendChild(util.createElement('option') );
        }
        var i = 0;
        for (; i < options.length; i += 1) {
          var option = options[i];
          util.set(this.$el.childNodes[i], {
            style : { display : '' },
            props : { textContent : option[labelField],
              value : option[valueField] || '' }
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

        this.lastOptions = options;
      }
    }
    public focus() {
      this.$el.focus();
    }
    public blur() {
      this.$el.blur();
    }
    public setValue(value : any) {
      this.defaultValue = value;
      this.$el.value = value || '';
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
}
