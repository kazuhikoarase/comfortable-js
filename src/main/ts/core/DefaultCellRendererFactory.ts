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

          var options = renderer.SelectBox.getOptions(cell);
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
      editorPool : createEditorPool()
    };
  };

  var createEditorPool = function() : EditorPool {
    var pool : { [ dataType : string ] : CellEditor<any>[] } = {}
    var getPool = function(dataType :  string) : CellEditor<any>[] {
      return pool[dataType] || (pool[dataType] = []);
    };
    return {
      /**
       * create or get an editor.
       */
      getEditor : function(dataType : string) : CellEditor<any> {
        var pool = getPool(dataType);
        if (pool.length > 0) {
          return pool.shift();
        }
        if (this.dataType == 'select-one') {
          //return new renderer.SelectBox(this);
        } else if (dataType == 'boolean') {
          return new renderer.CheckBox();
        }
        return new renderer.TextEditor(dataType);
      },
      releaseEditor : function(dataType : string, editor : CellEditor<any>) {
        getPool(dataType).push(editor);
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

      var beginEdit = function(cell : EditorCell) {
        if (editor == null) {
          editor = opts.editorPool.getEditor(opts.dataType);
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
        getCellStyle : function(cell) : ElementOptions {
          if (!renderIsEditor) {
            if (!cell.textAlign && opts.dataType == 'number') {
              return { style : { textAlign : 'right' } };
            }
          }
          return {};
        },
        render : function(cell) {
          if (!renderIsEditor) {
            labelRenderer.setLabel(opts.labelFunction(cell.value, cell) );
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
              if (!editor) {
                // disposed.
                return null;
              }
              editing = false;
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
          if (editor != null) {
            td.$el.removeChild(editor.$el);
            opts.editorPool.releaseEditor(opts.dataType, editor);
            editor = null;
          }
        }
      };
    };
  };

  var linesRe = /\r?\n/g;

  export var createMultiLineLabelRenderer = function(parent : HTMLElement) {
    var elms : HTMLElement[] = null;
    var lastLabel : string = null;
    return {
      setLabel : function(label : string) {
        if (lastLabel === label) {
          return;
        }
        lastLabel = label;
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
