//
// comfortable - default-cell-renderer-factory
//
// Copyright (c) 2018 Kazuhiko Arase
//
// URL: https://github.com/kazuhikoarase/comfortable-js/
//
// Licensed under the MIT license:
//  http://www.opensource.org/licenses/mit-license.php
//

!function($c) {

  'use strict';

  var createTextEditor = function(opts) {
    var util = $c.util;
    return {
      $el : util.createElement('input', {
        attrs : { type : 'text', 'class' : '${prefix}-editor' }
      }),
      beginEdit : function(td, cell) {
        var cs = window.getComputedStyle(td.$el, null);
        var opts = {
            props : {},
            style : {
              textAlign : cs.textAlign,
              verticalAlign : cs.verticalAlign,
              color : cs.color,
              backgroundColor : cs.backgroundColor,
              fontFamily : cs.fontFamily,
              fontSize : cs.fontSize,
              fontWeight : cs.fontWeight
            }
          };
        if (typeof cell.maxLength == 'number') {
          opts.props.maxLength = cell.maxLength;
        }
        util.set(this.$el, opts);
      },
      focus : function() {
        this.$el.focus();
        this.$el.select();
      },
      blur : function() {
        this.$el.blur();
      },
      setValue : function(value) {
        this.$el.value = value;
        this.valueType = typeof value;
      },
      getValue : function() {
        if (opts.dataType == 'number') {
          var value = $c.numUtil.format(
              $c.numUtil.toNarrow(this.$el.value),
              opts.decimalDigits, '');
          return this.valueType == 'number'? +value : value;
        }
        return this.$el.value;
      },
      isValid : function(editor) {
        if (opts.dataType == 'number') {
          return !!$c.numUtil.toNarrow(this.getValue() ).match($c.numUtil.re);
        }
        return true;
      }
    };
  };

  var createCheckBox = function(opts) {
    var util = $c.util;
    var booleanValues = null;
    return {
      $el : util.createElement('input', {
        attrs : { type : 'checkbox', 'class' : '${prefix}-editor' }
      }),
      beginEdit : function(td, cell) {
        var cs = window.getComputedStyle(td.$el, null);
        util.set(this.$el, {
          style : {
          }
        });
        booleanValues = cell.booleanValues || [false, true];
      },
      focus : function() {
        this.$el.focus();
      },
      blur : function() {
        this.$el.blur();
      },
      setValue : function(value) {
        this.$el.checked = (value === booleanValues[1]);
      },
      getValue : function() {
        return booleanValues[this.$el.checked? 1 : 0];
      },
      isValid : function(editor) {
        return true;
      }
    };
  };

  var createSelectBox = function(opts) {
    var util = $c.util;
    var select = util.createElement('select', {
      attrs : { 'class' : '${prefix}-editor' }
    });
    return {
      $el : select,
      beginEdit : function(td, cell) {
        var cs = window.getComputedStyle(td.$el, null);
        util.set(this.$el, {
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
        var options = getOptions(cell);
        while (select.childNodes.length < options.length) {
          select.appendChild(util.createElement('option') );
        }
        var labelField = cell.labelField || 'label';
        var valueField = cell.valueField || 'value';
        var i = 0;
        for (; i < options.length; i += 1) {
          var option = options[i];
          util.set(select.childNodes[i], {
            style : { display : '' },
            props : { textContent : option[labelField],
              value : option[valueField] }
          });
        }
        while (select.childNodes.length > options.length) {
          select.removeChild(select.lastChild);
        }
        // IE9 does not support style.display=none.
        /*
        for (;i < select.childNodes.length; i += 1) {
          select.childNodes[i].style.display = 'none';
        }
        */
      },
      focus : function() {
        this.$el.focus();
      },
      blur : function() {
        this.$el.blur();
      },
      setValue : function(value) {
        this.$el.value = value;
      },
      getValue : function() {
        return this.$el.value;
      },
      isValid : function(editor) {
        return true;
      }
    };
  };

  var getOptions = function(cell) {
    var options = cell.options;
    if (typeof options == 'function') {
      options = options(cell.row, cell.col);
    }
    return options || [];
  };

  var createDefaultCellRendererFactoryOpts = function() {
    return {
      // value to label
      labelFunction : function(value, cell) {
        if (cell.labelFunction) {
          return cell.labelFunction(value);
        } else if (value === null || typeof value == 'undefined') {
          return '';
        } else if (this.dataType == 'number') {
          return $c.numUtil.format(value, this.decimalDigits);
        } else if (this.dataType == 'select-one') {
          var options = getOptions(cell);
          if (typeof options.splice != 'function') {
            return options[value] || '';
          }
          var labelField = cell.labelField || 'label';
          var valueField = cell.valueField || 'value';
          for (var i = 0; i < options.length; i += 1) {
            var option = options[i];
            if (option[valueField] == value) {
              return option[labelField];
            }
          }
          return '';
        } else {
          return '' + value;
        }
      },
      // create a editor
      createEditor : function() {
        if (this.dataType == 'select-one') {
          return createSelectBox(this);
        } else if (this.dataType == 'boolean') {
          return createCheckBox(this);
        }
        return createTextEditor(this);
      }
    };
  };

  var createDefaultCellRendererFactory = function(opts) {

    opts = $c.util.extend($c.createDefaultCellRendererFactoryOpts(), opts || {});

    return function(td) {

      var labelRenderer = createMultiLineLabelRenderer(td.$el);
      var editor = null;
      var oldValue = null;

      var beginEdit = function(cell) {
        if (editor == null) {
          editor = opts.createEditor();
          td.$el.appendChild(editor.$el);
        }
        labelRenderer.setVisible(false);
        editor.beginEdit(td, cell);
        editor.$el.style.display = '';
        editor.setValue(oldValue = cell.value);
      };

      var renderIsEditor = opts.renderIsEditor;
      if (typeof renderIsEditor == 'undefined') {
        renderIsEditor = opts.dataType == 'boolean' ||
          opts.dataType == 'select-one';
      }

      return {
        render : function(cell) {
          if (!renderIsEditor) {
            labelRenderer.setLabel(opts.labelFunction(cell.value, cell) );
            if (opts.dataType == 'number') {
              td.$el.style.textAlign = 'right';
            }
          } else {
            beginEdit(cell);
          }
        },
        beginEdit : function(cell) {
          beginEdit(cell);
          return {
            focus : function() {
              editor.focus();
            },
            endEdit : function() {
              if (!renderIsEditor) {
                labelRenderer.setVisible(true);
                editor.$el.style.display = 'none';
              } else {
                editor.blur();
              }
              return { oldValue : oldValue,
                newValue : editor.isValid()? editor.getValue() : oldValue };
            }
          };
        },
        dispose : function() {
        }
      };
    };
  };

  var linesRe = /\r?\n/g;
  var createMultiLineLabelRenderer = function(parent) {
    var elms = null;
    return {
      setLabel : function(label) {
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
      setVisible : function(visible) {
        if (elms != null) {
          for (var i = 0; i < elms.length; i += 1) {
            elms[i].style.display = visible? '' : 'none';
          }
        }
      }
    };
  };

  $c.createDefaultCellRendererFactoryOpts = createDefaultCellRendererFactoryOpts;
  $c.createDefaultCellRendererFactory = createDefaultCellRendererFactory;
  $c.createMultiLineLabelRenderer = createMultiLineLabelRenderer;

}(window.comfortable || (window.comfortable = {}) );
