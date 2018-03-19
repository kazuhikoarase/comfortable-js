//
// comfortable - default-cell-renderer
//
// Copyright (c) 2017 Kazuhiko Arase
//
// URL: https://github.com/kazuhikoarase/comfortable/
//
// Licensed under the MIT license:
//  http://www.opensource.org/licenses/mit-license.php
//

!function($c) {

  'use strict';

  // number utility
  var numUtil = {
    re : /^([\+\-]?)([0-9]*)(\.[0-9]*)?$/,
    format : function(value, digits, s1, s2) {
      digits = digits || 0;
      s1 = typeof s1 == 'string'? s1 : ',';
      s2 = typeof s2 == 'string'? s2 : '.';
      if (typeof value == 'number') {
        value = '' + value;
      }
      if (typeof value != 'string') {
        return '';
      }
      var mat = value.match(this.re);
      if (mat) {
        if (mat[2].length == 0 && (!mat[3] || mat[3].length == 1) ) {
          return '';
        }
        var iPart = mat[2].length > 0? mat[2] : '0';
        var neg = mat[1] == '-';
        var s = '';
        while (iPart.length > 3) {
          s = s1 + iPart.substring(iPart.length - 3) + s;
          iPart = iPart.substring(0, iPart.length - 3);
        }
        s = iPart + s;
        if (digits > 0) {
          var fPart = mat[3] || s2;
          s += s2;
          for (var i = 0; i < digits; i += 1) {
            s += (i + 1 < fPart.length)? fPart[i + 1] : '0';
          }
        }
        return neg? '-' + s : s;
      }
      return value;
    },
    toNarrow : function() {
      var wide = '０１２３４５６７８９＋－．，';
      var narrow = '0123456789+-.,';
      if (wide.length != narrow.length) {
        throw wide + ',' + narrow;
      }
      return function(value) {
        var s = '';
        for (var i = 0; i < value.length; i += 1) {
          var c = value.charAt(i);
          var index = wide.indexOf(c);
          s += (index != -1)? narrow.charAt(index) : c;
        }
        return s;
      };
    }()
  };

  var createTextEditor = function() {
    var util = $c.util;
    return {
      $el : util.createElement('input', {
        attrs : { type : 'text' },
        style : {
          width : '100%', height : '100%',
          padding : '0px', margin : '0px',
          border : 'none'
        }
      }),
      init : function(td) {
        var cs = window.getComputedStyle(td, null);
        util.set(this.$el, {
          style : {
            textAlign : cs.textAlign,
            color : cs.color,
            backgroundColor : cs.backgroundColor,
            fontFamily : cs.fontFamily,
            fontSize : cs.fontSize,
            fontWeight : cs.fontWeight
          }
        });
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
      },
      getValue : function() {
        return this.$el.value;
      }
    };
  };

  var createCheckBox = function() {
    var util = $c.util;
    return {
      $el : util.createElement('input', {
        attrs : { type : 'checkbox' },
        style : {
          padding : '0px', margin : '0px',
          border : 'none'
        }
      }),
      init : function(td) {
        var cs = window.getComputedStyle(td, null);
        util.set(this.$el, {
          style : {
          }
        });
      },
      focus : function() {
        this.$el.focus();
      },
      blur : function() {
        this.$el.blur();
      },
      setValue : function(value) {
        this.$el.checked = value;
      },
      getValue : function() {
        return this.$el.checked;
      }
    };
  };

  var createSelectBox = function() {
    var util = $c.util;
    var select = util.createElement('select', {
      style : {
        width : '100%', height : '100%',
        padding : '0px', margin : '0px',
        border : 'none'
      }
    });
    return {
      $el : select,
      init : function(td, cell) {
        var cs = window.getComputedStyle(td, null);
        util.set(this.$el, {
          style : {
            textAlign : cs.textAlign,
            color : cs.color,
            backgroundColor : cs.backgroundColor,
            fontFamily : cs.fontFamily,
            fontSize : cs.fontSize,
            fontWeight : cs.fontWeight
          }
        });
        while (select.firstChild) {
          select.removeChild(select.firstChild);
        }
        var options = getOptions(cell);
        var labelField = cell.labelField || 'label';
        var valueField = cell.valueField || 'value';
        for (var i = 0; i < options.length; i += 1) {
          var option = options[i];
          select.appendChild(util.createElement('option', {
            props : { textContent : option[labelField],
              value : option[valueField] }
          }));
        }
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

  var createDefaultCellRendererOpts = function() {
    return {
      // value to label
      labelFunction : function(value, cell) {
        if (this.dataType == 'select-one') {
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
        }
        if (this.dataType == 'number') {
          return numUtil.format(value, this.decimalDigits);
        }
        return value;
      },
      // create a editor
      createEditor : function() {
        if (this.dataType == 'select-one') {
          return createSelectBox();
        } else if (this.dataType == 'boolean') {
          return createCheckBox();
        }
        return createTextEditor();
      },
      // validate editor
      isValid : function(editor) {
        if (this.dataType == 'number') {
          return numUtil.toNarrow(editor.getValue() ).match(numUtil.re);
        }
        return true;
      },
      setEditorValue : function(editor, value) {
        if (this.dataType == 'number') {
        }
        editor.valueType = typeof value;
        editor.setValue(value);
      },
      getEditorValue : function(editor) {
        if (this.dataType == 'number') {
          var value = numUtil.format(
              numUtil.toNarrow(editor.getValue() ),
              this.decimalDigits, '');
          return editor.valueType == 'number'? +value : value;
        }
        return editor.getValue();
      }
    };
  };

  var createDefaultCellRenderer = function(opts) {

    opts = $c.util.extend($c.createDefaultCellRendererOpts(), opts || {});

    return function(td) {

      var labelRenderer = createMultiLineLabelRenderer(td);
      var editor = null;
      var oldValue = null;

      var beginEdit = function(cell) {
        if (editor == null) {
          editor = opts.createEditor();
          td.appendChild(editor.$el);
        }
        labelRenderer.setVisible(false);
        editor.init(td, cell);
        editor.$el.style.display = '';
        oldValue = cell.value;
        opts.setEditorValue(editor, oldValue);
      };

      var renderIsEditor = opts.renderIsEditor;
      if (typeof renderIsEditor == 'undefined') {
        renderIsEditor = opts.dataType == 'boolean' ||
          opts.dataType == 'select-one';
      }

      return {
        render : function(cell, tableModel) {
          if (!renderIsEditor) {
            labelRenderer.setLabel(opts.labelFunction(cell.value, cell) );
            if (opts.dataType == 'number') {
              td.style.textAlign = 'right';
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
                newValue : opts.isValid(editor)?
                  opts.getEditorValue(editor) : oldValue };
            }
          };
        }
      };
    };
  };

  var linesRe = /\r?\n/g;
  var createMultiLineLabelRenderer = function(td) {
    var elms = null;
    return {
      setLabel : function(label) {
        if (elms == null) {
          elms = [ document.createElement('span') ];
          td.appendChild(elms[0]);
        }
        var lines = label.split(linesRe);
        elms[0].textContent = lines[0];
        var elmIndex = 1;
        for (var i = 1; i < lines.length; i += 1) {
          if (elmIndex + 1 >= elms.length) {
            elms.push(document.createElement('br') );
            elms.push(document.createElement('span') );
            td.appendChild(elms[elmIndex]);
            td.appendChild(elms[elmIndex + 1]);
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

  $c.createDefaultCellRendererOpts = createDefaultCellRendererOpts;
  $c.createDefaultCellRenderer = createDefaultCellRenderer;
  $c.createMultiLineLabelRenderer = createMultiLineLabelRenderer;

}(window.comfortable || (window.comfortable = {}) );
