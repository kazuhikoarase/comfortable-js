//
// comfortable - default-cell-renderer-factory
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

  var createTextEditor = function(opts) {
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
      beginEdit : function(td, cell) {
        var cs = window.getComputedStyle(td.$el, null);
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
    return {
      $el : util.createElement('input', {
        attrs : { type : 'checkbox' },
        style : {
          padding : '0px', margin : '0px',
          border : 'none'
        }
      }),
      beginEdit : function(td, cell) {
        var cs = window.getComputedStyle(td.$el, null);
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
      },
      isValid : function(editor) {
        return true;
      }
    };
  };

  var createSelectBox = function(opts) {
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
      beginEdit : function(td, cell) {
        var cs = window.getComputedStyle(td.$el, null);
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
        for (;i < select.childNodes.length; i += 1) {
          select.childNodes[i].style.display = 'none';
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
        if (value === null || typeof value == 'undefined') {
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
        render : function(cell, tableModel) {
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

//
// comfortable - event-target
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

  var createEventTarget = function() {
    var map = {};
    var listeners = function(type) { return map[type] || (map[type] = []); };
    return {
      trigger : function(type, detail) {
        var ctx = this;
        listeners(type).forEach(function(listener) {
          listener.call(ctx, { type : type }, detail);
        });
        return this;
      },
      on : function(type, listener) {
        listeners(type).push(listener);
        return this;
      },
      off : function(type, listener) {
        map[type] = listeners(type).filter(function(l) {
          return listener != l;
        });
        return this;
      }
    };
  };

  var createUIEventTarget = function() {
    return $c.util.extend(createEventTarget(), {
      valid : true,
      invalidate : function() {
        this.valid = false;
        $c.util.callLater(function() {
          if (!this.valid) {
            this.valid = true;
            this.render();
          }
        }.bind(this) );
      },
      render : function() {
      }
    });
  };

  $c.createEventTarget = createEventTarget;
  $c.createUIEventTarget = createUIEventTarget;

}(window.comfortable || (window.comfortable = {}) );

//
// comfortable - i18n
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

  var getInstance = function(lang) {
    lang = lang || navigator.language || navigator.userLanguage;
    return $c.util.extend({}, $c.i18n.en, $c.i18n[lang] ||
        $c.i18n[lang.replace(/\-\w+$/, '')] || {});
  };

  var getMessages = function() {
    return $c.util.extend(
        this.getInstance('en').messages,
        this.getInstance().messages);
  };

  $c.i18n = $c.i18n || {};
  $c.i18n.getInstance = getInstance;
  $c.i18n.getMessages = getMessages;

}(window.comfortable || (window.comfortable = {}) );

//
// comfortable - i18n - en
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

  ($c.i18n = $c.i18n || {}).en = {
    messages : {
      RESET_FILTER : 'Clear Sort and Filters',
      EDIT_COLUMNS : 'Column Visibility and Order',
      SORT_ASC : 'Sort Ascending',
      SORT_DESC : 'Sort Descending',
      APPLY : 'Apply',
      OK : 'OK',
      CANCEL : 'Cancel',
      RESET : 'Reset',
      LOCK_COLUMN : '< Lock Column >',
      SELECT_BLANK : '(Space)',
      SELECT_ALL : '(Select All)'
    }
  };

}(window.comfortable || (window.comfortable = {}) );

//
// comfortable - i18n - ja
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

  ($c.i18n = $c.i18n || {}).ja = {
    messages : {
      RESET_FILTER : '並び替えとフィルタをクリア',
      EDIT_COLUMNS : '列の表示と順序',
      SORT_ASC : '昇順',
      SORT_DESC : '降順',
      APPLY : '適用',
      OK : 'OK',
      CANCEL : 'キャンセル',
      RESET : '初期値に戻す',
      LOCK_COLUMN : '< 列固定位置 >',
      SELECT_BLANK : '(空白)',
      SELECT_ALL : '(全て選択)'
    }
  };

}(window.comfortable || (window.comfortable = {}) );

//
// comfortable - list
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

  var createList = function() {

    var util = $c.util;

    var listContent = util.createElement('div', {
      style : { position : 'absolute' } });
    var list = { $el :  util.createElement('div', {
      style : { position : 'absolute',
        overflow : 'hidden', whiteSpace:'nowrap' } }, [ listContent ]) };

    var scr = util.createElement('div', {
      style : { position : 'absolute' } });

    var viewPane = util.createElement('div', {
        style : { position : 'absolute',
          overflowX : 'hidden', overflowY : 'auto' },
        on : { scroll : function(event) { $public.render(); } }
      }, [scr]);
  
    var frame = util.createElement('div', {
        style : { position : 'relative', overflow : 'hidden',
          width : '100px', height : '100px' },
          wheel : function(event) {
            viewPane.scrollLeft += event.deltaX;
            viewPane.scrollTop += event.deltaY;
          } },[ viewPane, list.$el ]);

    var cells = [];
    var getOrCrt = function(index) {
      if (index < cells.length) {
        return cells[index];
      }
      var cell = $public.createCell();
      listContent.appendChild(cell.$el);
      cells.push(cell);
      return cell;
    };

    var $public = util.extend($c.createUIEventTarget(), {
      $el : frame,
      getItemAt : function(index) { return 'item' + index; },
      getItemCount : function() { return 100000; },
      createCell : function() {
        return { $el : $c.util.createElement('div', {
          props : { textContent : 'M' },
          style : { borderBottom : '1px solid silver' }
        }) };
      },
      renderCell : function(cell, item) {
        cell.$el.textContent = item;
      },
      cellHeight : -1,
      render : function() {

        util.set(viewPane, { style : {
          left : '0px', top : '0px',
          width : this.$el.offsetWidth + 'px',
          height : this.$el.offsetHeight + 'px'
        } });

        if (this.cellHeight == -1) {
          this.cellHeight = getOrCrt(0).$el.offsetHeight;
        }
        var viewHeight = this.cellHeight * this.getItemCount();
        var scrHeight = Math.min(viewHeight, 1E6);

        var listTop = -(scrHeight > viewPane.clientHeight?
            util.translate(viewPane.scrollTop,
            0, scrHeight - viewPane.clientHeight,
            0, viewHeight - viewPane.clientHeight,
            'list.top') : 0);

        var minRow = Math.floor(-listTop / this.cellHeight);
        var maxRow = Math.min(this.getItemCount() - 1,
            Math.floor( (-listTop + viewPane.clientHeight) / this.cellHeight) );
        var top = listTop + minRow * this.cellHeight;

        util.set(listContent, { style : { left : '0px', top : top + 'px' } });

        var cellIndex = 0;
        for (var row = minRow; row <= maxRow; row += 1) {
          var cell = getOrCrt(cellIndex);
          cell.row = row;
          cell.$el.style.display = '';
          this.renderCell(cell, this.getItemAt(row) );
          cellIndex += 1;
        }
        for (; cellIndex < cells.length; cellIndex += 1) {
          cells[cellIndex].$el.style.display = 'none';
        }

        util.set(scr, { style : {
          left : '0px', top : '0px',
          width : this.$el.offsetWidth + 'px',
          height : scrHeight + 'px'
        } });

        util.set(list.$el, { style : {
          whiteSpace : 'nowrap',
          width : viewPane.clientWidth + 'px',
          height : viewPane.clientHeight + 'px'
        } });

        this.trigger('rendered', {
          listState : { minRow : minRow, maxRow : maxRow } } );
      }
    });

    return $public;
  };

  $c.createList = createList;

}(window.comfortable || (window.comfortable = {}) );

//
// comfortable - num-util
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
        while (iPart.length > 1 && iPart.charAt(0) == '0') {
          iPart = iPart.substring(1);
        }
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

  $c.numUtil = numUtil;

}(window.comfortable || (window.comfortable = {}) );

//
// comfortable - style
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

  $c.classNamePrefix = 'ctj-';

}(window.comfortable || (window.comfortable = {}) );

//
// comfortable - table
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

  var createDefaultTableModel = function() {
    var util = $c.util;
    return util.extend($c.createEventTarget(), {
      defaultCellWidth : 100,
      defaultCellHeight : 28,
      defaultCellStyle : { rowSpan : 1, colSpan : 1, editable : true },
      defaultCellRendererFactory : $c.createDefaultCellRendererFactory(),
      maxRowSpan : 8,
      maxColSpan : 8,
      minCellWidth : 8,
      getRowCount : function() { return 1E5; },
      getColumnCount : function() { return 1E5; },
      getLineRowAt : function(row) { return row; },
      getLineRowCountAt : function(row) { return this.getRowCount(); },
      getValueAt : function(row, col) { return row + ',' + col; },
      getCellStyleAt : function(row, col) { return {}; },
      getCellRendererFactoryAt : function(row, col) { return this.defaultCellRendererFactory; },
      getCellWidthAt : function(col) { return this.defaultCellWidth; },
      getCellHeightAt : function(row) { return this.defaultCellHeight; },
      getCellAt : function(row, col) {
        return util.extend({
            row : row, col : col, value : this.getValueAt(row, col) },
            this.defaultCellStyle, this.getCellStyleAt(row, col) );
      },
      checkSpaned : function(row, col) {
        var minRow = Math.max(0, row - this.maxRowSpan);
        var minCol = Math.max(0, col - this.maxColSpan);
        for (var r = row; r >= minRow; r -= 1) {
          for (var c = col; c >= minCol; c -= 1) {
            if (r != row || c != col) {
              var cell = this.getCellAt(r, c);
              if (row < r + cell.rowSpan && col < c + cell.colSpan) {
                return { row : r, col : c };
              }
            }
          }
        }
        return null;
      },
      isColumnResizableAt : function(col) { return true; },
      isColumnDraggableAt : function(col) { return true; }
    } );
  };

  var createInternalTable = function() {

    var util = $c.util;

    var colgroup = util.createElement('colgroup');
    var tbody = util.createElement('tbody');

    var table = util.createElement('table', {
        attrs : { cellspacing : '0' },
        style : {
          tableLayout : 'fixed', position : 'absolute', lineHeight : 1
        }
      }, [ colgroup, tbody ]);
    var view = util.createElement('div', {
      style : { overflow : 'hidden', position : 'relative' },
      on : { scroll : function(event) {
        view.scrollLeft = 0; view.scrollTop = 0; } }
    }, [ table ]);

    var getOrCrt = function(tagName, index, parent, init) {
      if (parent.children && index < parent.children.length) {
        return parent.children[index];
      }
      if (!parent.children) {
        parent.children = [];
      }
      var elm = { $el : document.createElement(tagName) };
      if (init) {
        init(elm);
      }
      parent.$el.appendChild(elm.$el);
      parent.children.push(elm);
      return elm;
    };

    var createTableState = function() {
      return {
        left : 0, top : 0, width : 0, height : 0,
        minRow : 0, maxRow : 0, minCol : 0, maxCol : 0,
        indexById : {}
      };
    };

    var getCellStyle = function(cell) {
      return {
        attrs : { 'class' : cell.className },
        style : {
          textAlign : cell.textAlign,
          color : cell.color,
          backgroundColor : cell.backgroundColor,
          fontWeight : cell.fontWeight,
          borderLeft : cell.borderLeft,
          borderRight : cell.borderRight,
          borderTop : cell.borderTop,
          borderBottom : cell.borderBottom
        }
      };
    };

    return {

      $el : view,
      colgroup : { $el : colgroup },
      tbody : { $el : tbody },
      left : 0, top : 0, model : null,
      tableState : createTableState(),

      offsetCache : null,
      beforeCellSizeChangeHandler : null,
      calcCellPosition : function(left, top) {

        var tableModel = this.model;

        // offset cache
        if (this.beforeCellSizeChangeHandler == null) {
          this.beforeCellSizeChangeHandler = function(event, detail) {
            this.offsetCache = null;
          }.bind(this);
        }
        tableModel.off('beforecellsizechange', this.beforeCellSizeChangeHandler);
        tableModel.on('beforecellsizechange', this.beforeCellSizeChangeHandler);
        this.offsetCache = this.offsetCache || { left : {}, top : {} };
        var prec = 1000;
        var offsetLeftCache = this.offsetCache.left;
        var offsetTopCache = this.offsetCache.top;
        var offsetLeft = 0;
        var offsetTop = 0;

        var rowCount = tableModel.getRowCount();
        var columnCount = tableModel.getColumnCount();
        var cellWidth = 0;
        var cellHeight = 0;
        var col = 0;
        var row = 0;

        var leftCache = null;
        var topCache = null;
        for (var i = 0; typeof offsetLeftCache[i] == 'number'; i += prec) {
          if (left + offsetLeftCache[i] <= 0) {
            leftCache = { col : i, offset : offsetLeftCache[i] };
          }
        }
        for (var i = 0; typeof offsetTopCache[i] == 'number'; i += prec) {
          if (top + offsetTopCache[i] <= 0) {
            topCache = { row : i, offset : offsetTopCache[i] };
          }
        }
        if (leftCache) {
          col = leftCache.col;
          left += leftCache.offset;
          offsetLeft += leftCache.offset;
        }
        if (topCache) {
          row = topCache.row;
          top += topCache.offset;
          offsetTop += topCache.offset;
        }

        for (; col < columnCount; col += 1,
            left += cellWidth, offsetLeft += cellWidth) {
          if (col % prec == 0) {
            offsetLeftCache[col] = offsetLeft;
          }
          cellWidth = tableModel.getCellWidthAt(col);
          if (left + cellWidth <= 0) {
            continue;
          }
          break;
        }
        for (; row < rowCount; row += 1,
            top += cellHeight, offsetTop += cellHeight) {
          if (row % prec == 0) {
            offsetTopCache[row] = offsetTop;
          }
          cellHeight = tableModel.getCellHeightAt(row);
          if (top + cellHeight <= 0) {
            continue;
          }
          break;
        }
        if (row < rowCount && col < columnCount) {
          var spaned = tableModel.checkSpaned(row, col);
          if (spaned) {
            while (row > spaned.row) {
              row -= 1;
              top -= tableModel.getCellHeightAt(row);
            }
            while (col > spaned.col) {
              col -= 1;
              left -= tableModel.getCellWidthAt(col);
            }
          }
        }
        return { left : left, col : col, top : top, row : row };
      },

      preRender : function() {

        var width = this.$el.offsetWidth;
        var height = this.$el.offsetHeight;
        var rowCount = this.model.getRowCount();
        var columnCount = this.model.getColumnCount();

        var cellPos = this.calcCellPosition(this.left, this.top);

        var tableState = createTableState();
        tableState.top = cellPos.top;
        tableState.minRow = cellPos.row;
        tableState.left = cellPos.left;
        tableState.minCol = cellPos.col;

        var top = cellPos.top;
        var row = cellPos.row;
        var trIndex = 0;
        while (row < rowCount && top < height) {
          var cellHeight = this.model.getCellHeightAt(row);
          getOrCrt('tr', trIndex, this.tbody).
            $el.style.height = cellHeight + 'px';
          tableState.height += cellHeight;
          top += cellHeight;
          row += 1;
          trIndex += 1;
        }
        for (;trIndex < tbody.childNodes.length; trIndex += 1) {
          tbody.childNodes[trIndex].style.height = '0px';
        }
        tableState.maxRow = Math.min(rowCount, tableState.minRow +
            (this.tbody.children? this.tbody.children.length : 0) ) - 1;

        var left = cellPos.left;
        var col = cellPos.col;
        var colIndex = 0;
        while (col < columnCount && left < width) {
          var cellWidth = this.model.getCellWidthAt(col);
          getOrCrt('col', colIndex, this.colgroup).
            $el.style.width = cellWidth + 'px';
          tableState.width += cellWidth;
          left += cellWidth;
          col += 1;
          colIndex += 1;
        }
        for (;colIndex < colgroup.childNodes.length; colIndex += 1) {
          colgroup.childNodes[colIndex].style.width = '0px';
        }
        tableState.maxCol = Math.min(columnCount, tableState.minCol +
            (this.colgroup.children? this.colgroup.children.length : 0) ) - 1;

        return tableState;
      },

      render : function() {

        var tableState = this.preRender();
        var spaned = {};

        var setSpaned = function(row, col, td, cell) {
          td.rowSpan = cell.rowSpan;
          td.colSpan = cell.colSpan;
          if (cell.rowSpan == 1 && cell.colSpan == 1) {
            return;
          }
          for (var r = 0; r < cell.rowSpan; r += 1) {
            for (var c = 0; c < cell.colSpan; c += 1) {
              if (r != 0 || c != 0) {
                var id = util.getCellId(row + r, col + c);
                spaned[id] = true;
              }
            }
          }
        };

        var tableModel = this.model;
        var initCell = function(td) {
          td.renderer = null;
          td.tableModel = tableModel;
          td.$el.style.overflow = 'hidden';
          td.$el.style.whiteSpace = 'nowrap';
        };

        for (var row = tableState.minRow; row <= tableState.maxRow; row += 1) {

          var trIndex = row - tableState.minRow;
          var tr = this.tbody.children[trIndex];

          var tdIndex = 0;
          for (var col = tableState.minCol; col <= tableState.maxCol; col += 1) {

            var id = util.getCellId(row, col);
            if (spaned[id]) {
              continue;
            }
            tableState.indexById[id] = { trIndex : trIndex, tdIndex : tdIndex };

            var td = getOrCrt('td', tdIndex, tr, initCell);
            td.row = row;
            td.col = col;

            var cell = tableModel.getCellAt(row, col);
            setSpaned(row, col, td.$el, cell);

            var factory = tableModel.getCellRendererFactoryAt(row, col);
            if (td.factory != factory) {
              td.factory = factory;
              td.$el.innerHTML = '';
              td.renderer = td.factory(td);
            }

            util.set(td.$el, getCellStyle(cell) );
            td.renderer.render(cell);

            tdIndex += 1;
          }
        }

        util.extend(table.style, {
          left : tableState.left + 'px',
          top : tableState.top + 'px',
          width : tableState.width + 'px',
          height : tableState.height + 'px'
        });

        this.tableState = tableState;
      }
    };
  };

  var createTable = function() {

    var util = $c.util;

    var tables = function() {
      var tables = [];
      for (var i = 0; i < 4; i += 1) {
        tables.push(createInternalTable() );
      }
      return tables;
    }();

    tables.forEach(function(table, i) {
      table.row = ~~(i / 2);
      table.col = i % 2;
      var cellEventHandler = function(handler) {
        return function(event) {
          var col = util.indexOf(util.closest(event.target,
              { tagName : 'TD', root : table.$el }) );
          var row = util.indexOf(util.closest(event.target,
              { tagName : 'TR', root : table.$el }) );
          if (col != -1 && row != -1) {
            handler(event, table.tbody.children[row].children[col]);
          }
        };
      };
      var delegateHandler = cellEventHandler(function(event, td) {
        $public.trigger(event.type,
            { originalEvent : event, row : td.row, col : td.col }); });
      var delegates = {};
      $c.tableEventTypes.forEach(function(type) {
        delegates[type] = delegateHandler;
      });
      util.set(table.$el, {
        on : delegates
      });
      util.set(table.$el, {
        style : { position : 'absolute' },
        on : {
          mousedown: cellEventHandler(function(event, td) {
            if (event.which != 1) {
              return;
            }
            if (td.row < $public.getLockRow() &&
                $public.model.isColumnDraggableAt(td.col) &&
                !event.defaultPrevented) {
              event.preventDefault();
              var mousemoveHandler = function(event) {
                updateMarker(event.pageX - dragPoint.x);
              };
              var mouseupHandler = function(event) {
                util.$(document).off('mousemove', mousemoveHandler).
                  off('mouseup', mouseupHandler);
                frame.removeChild(dragProxy);
                frame.removeChild(marker);
                if (targetColumn != null) {
                  tableModel.trigger('columndragged', {
                    colFrom : targetColumn.colFrom,
                    colSpan : cell.colSpan,
                    colTo : targetColumn.colTo });
                  $public.invalidate();
                }
              };
              util.$(document).on('mousemove', mousemoveHandler).
                on('mouseup', mouseupHandler);
              var getTargetColumn = function(centerX) {
                var targetColumn = null;
                tables.forEach(function(tbl, i) {
                  if (tbl.row == table.row) {
                    var tableState = tbl.tableState;
                    var rect = $private.getCellSizeCache().rects[i];
                    var left = rect.left + tableState.left;
                    for (var col = tableState.minCol; col <= tableState.maxCol; col += 1) {
                      var distance = Math.abs(left - centerX);
                      if ( (targetColumn == null ||
                              distance < targetColumn.distance) &&
                            !tableModel.checkSpaned(0, col) ) {
                        targetColumn = { colFrom : colFrom, colTo : col,
                            i : i, left : left, distance : distance };
                      }
                      left += tableModel.getCellWidthAt(col);
                    }
                  }
                });
                return targetColumn;
              };
              var updateMarker = function(delta) {
                var left = getLeft(delta);
                targetColumn = getTargetColumn(left + colWidth / 2);
                dragProxy.style.left = left + 'px';
                marker.style.left = (targetColumn.left - markerStyle.gap - 1) + 'px';
              };
              var tableModel = $public.model;
              var tableState = table.tableState;
              var targetColumn = null;
              var rect = $private.getCellSizeCache().rects[i];
              var colFrom = td.col;
              var spaned = tableModel.checkSpaned(0, colFrom);
              if (spaned) {
                colFrom = spaned.col;
              }
              var cell = tableModel.getCellAt(0, colFrom);
              var colLeft = function() {
                var left = 0;
                for (var col = tableState.minCol; col < colFrom; col += 1) {
                  left += tableModel.getCellWidthAt(col);
                }
                return left;
              }();
              var colWidth = function() {
                var width = 0;
                for (var col = 0; col < cell.colSpan; col += 1) {
                  width += tableModel.getCellWidthAt(colFrom + col);
                }
                return width;
              }();
              var getLeft = function(delta) {
                return tableState.left + rect.left + colLeft + delta;
              };
              var dragPoint = { x : event.pageX, y : event.pageY };
              var dragProxy = util.createElement('div', {
                style : { position : 'absolute', top : '0px',
                  width : colWidth + 'px', height : rect.height + 'px',
                  backgroundColor : 'rgba(0,0,0,0.1)' }
              });
              var markerStyle = {
                gap : 2
              };
              var marker = util.createElement('div', {
                style : { position : 'absolute', top : '0px',
                  width : (markerStyle.gap * 2 + 1) + 'px',
                  height : rect.height + 'px',
                  backgroundColor : 'rgba(0,0,0,0.5)' }
              });
              updateMarker(0);
              frame.appendChild(dragProxy);
              frame.appendChild(marker);
              return;
            }
            // begin edit by logical row and col
            if (editor.cell != null &&
                editor.cell.row == td.row &&
                editor.cell.col == td.col) {
            } else {
              event.preventDefault();
              editor.beginEdit(td.row, td.col, true);
            }
          })
        }
      } );
    });

    var scr = util.createElement('div', {
        style : { position : 'absolute' } });

    var viewPane = util.createElement('div', {
        style : { position : 'absolute', overflow : 'auto' },
        on : { scroll : function(event) { $public.render(); } }
      }, [scr]);

    var frame = util.createElement('div', {
        style : { position : 'relative', overflow : 'hidden',
          width : '400px', height : '200px' },
        on : {
          mousedown : function(event) {
            if (util.closest(event.target, { $el : viewPane, root : frame }) ) {
              editor.endEdit();
              $public.render();
            }
          },
          keydown : function(event) {
            switch(event.keyCode) {
            case 9 : // Tab
              event.preventDefault();
              $private.move({ row : 0, col : event.shiftKey? -1 : 1 });
              break;
            case 13 : // Enter
              event.preventDefault();
              $private.move({ row : event.shiftKey? -1 : 1, col : 0 });
              break;
            }
          },
          wheel : function(event) {
            viewPane.scrollLeft += event.deltaX;
            viewPane.scrollTop += event.deltaY;
          }
        }
      }, [viewPane].concat(
          tables.map(function(table) { return table.$el; }) ) );

    var lockLines = [];
    var colResizeHandles = [];

    var $private = {
      getCellRect : function(row, col) {
        var tableModel = tables[3].model;
        var left = 0;
        var top = 0;
        for (var r = 0; r < row; r += 1) {
          top += tableModel.getCellHeightAt(r);
        }
        for (var c = 0; c < col; c += 1) {
          left += tableModel.getCellWidthAt(c);
        }
        return { left : left, top : top,
          width : tableModel.getCellWidthAt(col),
          height : tableModel.getCellHeightAt(row) };
      },
      makeVisible : function(renderParams, row, col) {
        var cornerRect = renderParams.rects[0];
        var scrollRect = renderParams.rects[3];
        var delta = { left : 0, top : 0 };
        var cellRect = this.getCellRect(row, col);
        var left = cellRect.left + tables[3].left;
        var top = cellRect.top + tables[3].top;
        if (left < 0) {
          delta.left = left;
        } else if (left + cellRect.width > scrollRect.width) {
          delta.left = left + cellRect.width - scrollRect.width;
        }
        if (top < 0) {
          delta.top = top;
        } else if (top + cellRect.height > scrollRect.height) {
          delta.top = top + cellRect.height - scrollRect.height;
        }
        var scroll = {
          left : renderParams.viewWidth > viewPane.clientWidth?
              util.translate(-tables[3].left + delta.left,
              cornerRect.width,
              cornerRect.width + renderParams.viewWidth - viewPane.clientWidth,
              0, renderParams.scrWidth - viewPane.clientWidth, 'scroll.left') : 0,
          top : renderParams.viewHeight > viewPane.clientHeight?
              util.translate(-tables[3].top + delta.top,
              cornerRect.height,
              cornerRect.height + renderParams.viewHeight - viewPane.clientHeight,
              0, renderParams.scrHeight - viewPane.clientHeight, 'scroll.top') : 0
        };
        if (row >= $public.getLockRow() ) {
          viewPane.scrollTop = scroll.top;
        }
        if (col >= $public.getLockColumn() ) {
          viewPane.scrollLeft = scroll.left;
        }
      },
      cellSizeCache : null,
      beforeCellSizeChangeHandler : function(event, detail) {
        // note: 'this' is tableModel!
        $private.cellSizeCache = null;
      },
      getCellSizeCache : function() {
        var width = $public.$el.clientWidth;
        var height = $public.$el.clientHeight;
        var tableModel = $public.model;
        // observe cache size.
        tableModel.off('beforecellsizechange', this.beforeCellSizeChangeHandler);
        tableModel.on('beforecellsizechange', this.beforeCellSizeChangeHandler);
        //
        var rowCount = tableModel.getRowCount();
        var columnCount = tableModel.getColumnCount();
        var lockRow = $public.getLockRow();
        var lockColumn = $public.getLockColumn();
        if (!this.cellSizeCache ||
            this.cellSizeCache.rowCount != rowCount ||
            this.cellSizeCache.columnCount != columnCount ||
            this.cellSizeCache.lockRow != lockRow ||
            this.cellSizeCache.lockColumn != lockColumn ||
            this.cellSizeCache.width != width ||
            this.cellSizeCache.height != height) {
          var rowPos = [ 0, lockRow, rowCount ];
          var colPos = [ 0, lockColumn, columnCount ];
          var cw = colPos.slice(1).map(function() { return 0; });
          var ch = rowPos.slice(1).map(function() { return 0; });;
          var idx, count;
          idx = colPos.shift();
          cw.forEach(function(_, i) {
            for (count = colPos.shift(); idx < count; idx += 1) {
              cw[i] += tableModel.getCellWidthAt(idx);
            }
          });
          idx = rowPos.shift();
          ch.forEach(function(_, i) {
            for (count = rowPos.shift(); idx < count; idx += 1) {
              ch[i] += tableModel.getCellHeightAt(idx);
            }
          });
          var rects = tables.map(function(table) {
            var rect = { left : 0, top : 0, width : 0, height : 0 };
            for (var row = 0; row <= table.row; row += 1) {
              rect[row < table.row ? 'top' : 'height'] += ch[row];
            }
            for (var col = 0; col <= table.col; col += 1) {
              rect[col < table.col? 'left' : 'width'] += cw[col];
            }
            rect.width = Math.max(0, Math.min(rect.width, width - rect.left) );
            rect.height = Math.max(0, Math.min(rect.height, height - rect.top) );
            return rect;
          });
          this.cellSizeCache = {
            viewWidth : cw[cw.length - 1],
            viewHeight : ch[ch.length - 1],
            rects : rects,
            rowCount : rowCount, columnCount : columnCount,
            lockRow : lockRow, lockColumn : lockColumn,
            width : width, height : height
          };
        }
        return this.cellSizeCache;
      },
      getRenderParams : function() {
        var width = $public.$el.clientWidth;
        var height = $public.$el.clientHeight;
        var cellSizeCache = this.getCellSizeCache();
        var viewWidth = cellSizeCache.viewWidth;
        var viewHeight = cellSizeCache.viewHeight;
        var maxScr = 1E6;
        var scrWidth = Math.min(viewWidth, maxScr);
        var scrHeight = Math.min(viewHeight, maxScr);
        return {
          width : width,
          height : height,
          rects : cellSizeCache.rects,
          viewWidth : viewWidth,
          viewHeight : viewHeight,
          scrWidth : scrWidth,
          scrHeight : scrHeight
        };
      },
      getTargetTable : function(row, col) {
        return tables.filter(function(table) {
          return table.row == (row < $public.getLockRow()? 0 : 1) &&
            table.col == (col < $public.getLockColumn()? 0 : 1);
        })[0];
      },
      isEditableAt : function(row, col) {
        return $public.model.getCellAt(row, col).editable;
      },
      move : function(offset) {

        if (editor.cell == null) {
          return;
        }
        var row = editor.cell.row;
        var col = editor.cell.col;
        var tableModel = $public.model;

        var beginEditIfEditable = function() {
          if (this.isEditableAt(row, col) ) {
            editor.beginEdit(row, col, true);
            return true;
          }
          return false;
        }.bind(this);

        var rowCount = tableModel.getRowCount();
        var columnCount = tableModel.getColumnCount();

        if (offset.row == -1 || offset.row == 1) {

          do {
            do {
              var lineRowCount = tableModel.getLineRowCountAt(row);
              var lineRow = tableModel.getLineRowAt(row);
              var rowOffset = row - lineRow;
              lineRow += offset.row;
              if (lineRow < 0) {
                lineRow = lineRowCount - 1;
                col -= 1;
                if (col < 0) {
                  lineRow = -1;
                  col = columnCount - 1;
                }
              } else if (lineRow >= lineRowCount) {
                lineRow = 0;
                col += 1;
                if (col >= columnCount) {
                  lineRow = lineRowCount;
                  col = 0;
                }
              }
              row = rowOffset + lineRow;
              if (row < 0) {
                row = rowCount - 1;
              } else if (row >= rowCount) {
                row = 0;
              }
            } while (tableModel.checkSpaned(row, col) );
          } while (!beginEditIfEditable() );

        } else if (offset.col == -1 || offset.col == 1) {

          do {
            do {
              col += offset.col;
              if (col < 0) {
                col = columnCount - 1;
                row = (row - 1 + rowCount) % rowCount;
              } else if (col >= columnCount) {
                col = 0;
                row = (row + 1) % rowCount;
              }
            } while (tableModel.checkSpaned(row, col) );
          } while (!beginEditIfEditable() );
        }
      },
      renderColumnResizeHandlers : function(renderParams) {
        var mousedownHandler = function(event) {
          var mouseupHandler = function(event) {
            util.$(document).off('mousemove', mousemoveHandler).
              off('mouseup', mouseupHandler);
            frame.removeChild(block);
            util.set(handle.$el.childNodes[0],
                { style : { display : 'none' } });
            var deltaX = event.pageX - dragPoint.x;
            var cellWidth = tableModel.getCellWidthAt(handle.col);
            tableModel.trigger('beforecellsizechange');
            tableModel.trigger('cellsizechange', {
              col : handle.col,
              cellWidth : Math.max(tableModel.minCellWidth, cellWidth + deltaX) });
            $public.invalidate();
          };
          var mousemoveHandler = function(event) {
            var deltaX = event.pageX - dragPoint.x;
            var cellWidth = tableModel.getCellWidthAt(handle.col);
            deltaX = Math.max(tableModel.minCellWidth, cellWidth + deltaX) - cellWidth;
            handle.$el.style.left = (handle.left + deltaX) + 'px';
          };
          if (event.which != 1) {
            return;
          }
          event.preventDefault();
          editor.endEdit();
          var handleIndex = colResizeHandles.map(function(handle) {
            return handle.$el; } ).indexOf(event.currentTarget);
          var handle = colResizeHandles[handleIndex];
          var dragPoint = { x : event.pageX, y : event.pageY };
          util.set(handle.$el.childNodes[0], { style : { display : '' } });
          var block = util.createElement('div', {
            style : {
              position : 'absolute', left : '0px', top : '0px',
              backgroundColor : handleStyle.backgroundColor,
              cursor : handleStyle.cursor,
              width : (scrollRect.left + scrollRect.width) + 'px',
              height : (scrollRect.top + scrollRect.height) + 'px'
            }
          });
          frame.appendChild(block);
          util.$(document).on('mousemove', mousemoveHandler).
            on('mouseup', mouseupHandler);
        };
        var getOrCrt = function() {
          if (handleIndex < colResizeHandles.length) {
            return colResizeHandles[handleIndex];
          }
          var handle = { $el : util.createElement('div', {
            style : {
              position : 'absolute',
              backgroundColor : handleStyle.backgroundColor,
              overflow : 'visible', top : '0px',
              width : (handleStyle.offset * 2 + handleStyle.lineWidth) + 'px',
              cursor : handleStyle.cursor
            },
            on : { mousedown : mousedownHandler }
          }, [util.createElement('div',{
            attrs : { 'class' : '${prefix}v-resize-line' },
            style : {
              position : 'absolute',
              left : handleStyle.offset + 'px', top : '0px', width : '0px',
              borderLeftWidth : handleStyle.lineWidth + 'px' }
          })]) };
          frame.appendChild(handle.$el);
          colResizeHandles.push(handle);
          return handle;
        };
        var handleStyle = {
          offset : 3,
          lineWidth : 1,
          cursor : 'ew-resize',
          backgroundColor : 'rgba(0,0,0,0)'
        };
        var handleIndex = 0;
        var tableModel = $public.model;
        var scrollRect = renderParams.rects[3];
        tables.forEach(function(table, i) {
          if (table.row == 0) {
            var rect = renderParams.rects[i];
            var tableState = table.tableState;
            var left = tableState.left + rect.left -
              handleStyle.offset - handleStyle.lineWidth;
            var height = rect.height;
            var clientWidth = scrollRect.left + scrollRect.width;
            var clientHeight = scrollRect.top + scrollRect.height;
            for (var col = tableState.minCol; col <= tableState.maxCol;
                col += 1, handleIndex += 1) {
              var handle = getOrCrt();
              left += tableModel.getCellWidthAt(col);
              if (left > clientWidth) {
                break;
              }
              if (!$public.model.isColumnResizableAt(col) ) {
                continue;
              }
              util.set(handle.$el, { style : { display : '',
                left : left + 'px', height : height + 'px' } });
              util.set(handle.$el.childNodes[0], {
                style : { display : 'none', height : clientHeight + 'px' } });
              handle.col = col;
              handle.left = left;
            }
          }
        });
        for (; handleIndex < colResizeHandles.length; handleIndex += 1) {
          util.set(colResizeHandles[handleIndex].$el, {
            style : { display : 'none', left : '0px', height : '0px' } });
        }
      },
      render : function(visibleCell) {

        var renderParams = this.getRenderParams();
        var cornerRect = renderParams.rects[0];

        util.extend(scr.style, {
          width : renderParams.scrWidth + 'px',
          height : renderParams.scrHeight + 'px' });
        util.extend(viewPane.style, {
          left : cornerRect.width + 'px', top : cornerRect.height + 'px',
          width : (renderParams.width - cornerRect.width) + 'px',
          height : (renderParams.height - cornerRect.height) + 'px' });

        var barWidth = viewPane.offsetWidth - viewPane.clientWidth;
        var barHeight = viewPane.offsetHeight - viewPane.clientHeight;

        tables.forEach(function(table, i) {
          var rect = renderParams.rects[i];
          if (table.col == 1 &&
              rect.width + barWidth > renderParams.width - rect.left) {
            rect.width = renderParams.width - rect.left - barWidth;
          }
          if (table.row == 1 &&
              rect.height + barHeight > renderParams.height - rect.top) {
            rect.height = renderParams.height - rect.top - barHeight;
          }
        });

        if (visibleCell) {
          this.makeVisible(renderParams, visibleCell.row, visibleCell.col);
        }

        tables.forEach(function(table, i) {
          var rect = renderParams.rects[i];
          if (table.col == 1) {
            table.left = -(renderParams.scrWidth > viewPane.clientWidth?
                  util.translate(viewPane.scrollLeft,
                  0, renderParams.scrWidth - viewPane.clientWidth,
                  cornerRect.width,
                  cornerRect.width +
                    renderParams.viewWidth - viewPane.clientWidth,
                  'table.left') : cornerRect.width);
          }
          if (table.row == 1) {
            table.top = -(renderParams.scrHeight > viewPane.clientHeight?
                  util.translate(viewPane.scrollTop,
                  0, renderParams.scrHeight - viewPane.clientHeight,
                  cornerRect.height,
                  cornerRect.height +
                    renderParams.viewHeight - viewPane.clientHeight,
                  'table.top') : cornerRect.height);
          }
          table.model = $public.model;
          util.extend(table.$el.style, {
            left : rect.left + 'px', top : rect.top + 'px',
            width : rect.width + 'px', height : rect.height + 'px' });
          table.render();

        });

        if (editor.cell != null) {
          editor.beginEdit(editor.cell.row, editor.cell.col);
        }

        // lock lines.
        !function() {
          while (lockLines.length < 2) {
            var line = util.createElement('div', {
              style : { position : 'absolute' } });
            frame.appendChild(line);
            lockLines.push(line);
          }
          var width = 0;
          var height = 0;
          tables.forEach(function(table, i) {
            var rect = renderParams.rects[i];
            if (table.row == 0) { width += rect.width; }
            if (table.col == 0) { height += rect.height; }
          });
          // horizontal
          util.set(lockLines[0], {
            attrs :{ 'class' : '${prefix}h-lock-line' },
            style : {
              display : $public.getLockRow() == 0? 'none' : '', left : '0px',
              top : (cornerRect.height - 1) + 'px', width : width + 'px'
            } });
          // vertical
          util.set(lockLines[1], {
            attrs :{ 'class' : '${prefix}v-lock-line' },
            style : {
              display : $public.getLockColumn() == 0? 'none' : '', top : '0px',
              left : (cornerRect.width - 1) + 'px', height : height + 'px'
            } });
        }();

        // resize handles.
        if ($public.getLockRow() > 0) {
          this.renderColumnResizeHandlers(renderParams);
        }

        $public.trigger('rendered', {
          tableStates : tables.map(function(table) {
            return table.tableState;
          })
        } );
      }
    };

    var editor = {
      beginEdit : function(row, col, makeVisible) {
        this.endEdit();
        if (!$private.isEditableAt(row, col) ) {
          return;
        }
        if (makeVisible) {
          $public.render({ row : row, col : col });
        }
        this.cell = { row : row, col : col };
        var target = $private.getTargetTable(row, col);
        var index = target.tableState.indexById[util.getCellId(row, col)];
        if (index) {
          var td = target.tbody.children[index.trIndex].children[index.tdIndex];
          this.impl = td.renderer.beginEdit($public.model.getCellAt(row, col) );
          this.impl.focus();
        }
      },
      endEdit : function() {
        if (this.impl != null) {
          var endState = this.impl.endEdit();
          if (endState) {
            $public.model.trigger('valuechange', {
              row : this.cell.row,
              col : this.cell.col,
              oldValue : endState.oldValue,
              newValue : endState.newValue
            });
          }
          this.impl = null;
        }
        this.cell = null;
      }
    };

    var $public = util.extend($c.createUIEventTarget(), {
      $el : frame,
      lockRow : 0,
      lockColumn : 0,
      getLockRow : function() { return this.lockRow; },
      getLockColumn : function() { return this.lockColumn; },
      editor : editor,
      model : createDefaultTableModel(),
      render : function(visibleCell) {
        $private.render(visibleCell);
      }
    });

    return $public;
  };

  $c.tableEventTypes = [
    'mousedown', 'mouseover', 'mouseout',
    'click', 'dblclick', 'contextmenu' ];
  $c.createTable = createTable;

  // export
  !function($c) {
    if (typeof exports === 'object') {
      module.exports = $c;
    }
  }($c);

}(window.comfortable || (window.comfortable = {}) );

//
// comfortable - ui
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

  var createButton = function(label, action) {
    return $c.util.createElement('div',{
      style : { display : 'inline-block' },
      props : { textContent : label },
      attrs : { 'class' : '${prefix}button ${prefix}clickable' },
      on : { mousedown : function(event) {
        event.preventDefault();
      }, click : function(event) { action(event); } } });
  };

  var createDialog = function(children) {
    var dialog = $c.util.extend($c.createEventTarget(), {
      $el : $c.util.createElement('div', {
          attrs : { 'class' : '${prefix}dialog' },
          style : { position : 'absolute' }
      }, children),
      show : function() {
        document.body.appendChild(this.$el);
        this.trigger('beforeshow');
        $c.util.callLater(function() {
          $c.util.$(document).on('mousedown', mousedownHandler);
        });
      },
      dispose : function() {
        if (this.$el) {
          $c.util.$(document).off('mousedown', mousedownHandler);
          document.body.removeChild(this.$el);
          this.$el = null;
          this.trigger('dispose');
        }
      }
    } );
    var mousedownHandler = function(event) {
      if (!$c.util.closest(event.target,
          { $el : dialog.$el, root : document.body }) ) {
        dialog.dispose();
      }
    };
    return dialog;
  };

  var showMenu = function(left, top, menuItems) {
    var subMenu = null;
    var menu = $c.util.createElement('div', {
      attrs : { 'class' : '${prefix}contextmenu' },
      style : { position : 'absolute', left : left + 'px', top : top + 'px' } },
      menuItems.map(function(menuItem) {
        return $c.util.createElement('div', {
            attrs : { 'class' : '${prefix}menuitem ${prefix}clickable' },
            props : { textContent : menuItem.label },
            style : { position : 'relative', whiteSpace : 'nowrap' },
            on : {
              mouseover : function(event) {
                if (subMenu != null) {
                  subMenu.dispose();
                  subMenu = null;
                }
                if (subMenu == null && menuItem.children) {
                  subMenu = showMenu(
                      left + event.target.offsetWidth,
                      top + event.target.offsetTop,
                      menuItem.children() );
                }
              },
              mousedown : function(event) {
                if (menuItem.action) {
                  menuItem.action(event);
                }
              }
            }
          } );
        }) );
    var dispose = function() {
      if (menu != null) {
        document.body.removeChild(menu);
        menu = null;
      }
    };
    var mousedownHandler = function(event) {
      $c.util.$(document).off('mousedown', mousedownHandler);
      dispose();
    };
    $c.util.$(document).on('mousedown', mousedownHandler);
    document.body.appendChild(menu);
    return { dispose : dispose };
  };

  $c.ui = {
    createButton : createButton,
    createDialog : createDialog,
    showMenu : showMenu
  };

}(window.comfortable || (window.comfortable = {}) );

//
// comfortable - util
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

  var util = {

    extend : function() {
      var o = arguments[0];
      for (var i = 1; i < arguments.length; i += 1) {
        var a = arguments[i];
        for (var k in a) {
          o[k] = a[k];
        };
      }
      return o;
    },

    callLater : function(cb) {
      window.setTimeout(cb, 0);
    },

    replaceClassNamePrefix : function() {
      var classNamePrefixRe = /\$\{prefix\}/g;
      return function(className) {
        return className.replace(classNamePrefixRe, $c.classNamePrefix);
      };
    }(),

    set : function(elm, opts) {
      if (opts.attrs) {
        for (var k in opts.attrs) {
          var v = opts.attrs[k];
          var t = typeof v;
          if (t == 'number' || t == 'boolean') {
            v = '' + v;
          } else if (t == 'undefined') {
            v = '';
          }
          if (typeof v != 'string') {
            throw 'bad attr type for ' + k + ':' + (typeof v);
          }
          if (k == 'class') {
            v = this.replaceClassNamePrefix(v);
          }
          elm.setAttribute(k, v);
        }
      }
      if (opts.props) {
        for (var k in opts.props) {
          elm[k] = opts.props[k];
        }
      }
      if (opts.style) {
        for (var k in opts.style) {
          elm.style[k] = opts.style[k] || '';
        }
      }
      if (opts.on) {
        for (var k in opts.on) {
          elm.addEventListener(k, opts.on[k]);
        }
      }
      return elm;
    },

    parseArguments : function(args) {
      var children = [];
      var opts = {};
      for (var i = 1; i < args.length; i += 1) {
        var a = args[i];
        if (typeof a == 'object') {
          if (typeof a.splice == 'function') {
            children = a;
          } else {
            opts = a;
          }
        }
      }
      return { children : children, opts : opts };
    },

    createElement : function(tagName) {
      var args = this.parseArguments(arguments);
      var elm = document.createElement(tagName);
      args.children.forEach(function(child) { elm.appendChild(child); });
      return this.set(elm, args.opts);
    },

    createSVGElement : function(tagName) {
      var args = this.parseArguments(arguments);
      var elm = document.createElementNS('http://www.w3.org/2000/svg', tagName);
      args.children.forEach(function(child) { elm.appendChild(child); });
      return this.set(elm, args.opts);
    },

    $ : function(elm) {
      return {
        on : function(type, listener) {
          elm.addEventListener(type, listener);
          return this;
        },
        off : function(type, listener) {
          elm.removeEventListener(type, listener);
          return this;
        },
        addClass : function(className, remove) {
          className = util.replaceClassNamePrefix(className);
          var classes = '';
          (elm.getAttribute('class') || '').split(/\s+/g).forEach(function(c) {
            if (c != className) {
              classes += ' ' + c;
              return;
            }
          } );
          if (!remove) {
            classes += ' ' + className;
          }
          elm.setAttribute('class', classes);
          return this;
        },
        removeClass : function(className) {
          return this.addClass(className, true);
        }
      };
    },

    closest : function(elm, opts) {
      if (typeof opts.className == 'string') {
        opts.className = this.replaceClassNamePrefix(opts.className);
      }
      while (elm != null && elm.nodeType == 1 && elm != opts.root) {
        if (typeof opts.tagName == 'string' && elm.tagName == opts.tagName) {
          return elm;
        } else if (typeof opts.$el == 'object' && elm == opts.$el) {
          return elm;
        } else if (typeof opts.className == 'string' &&
            (elm.getAttribute('class') || '').split(/\s+/g).indexOf(opts.className)!= -1) {
          return elm;
        }
        elm = elm.parentNode;
      }
      return null;
    },

    indexOf : function(elm) {
      if (elm == null) {
        return -1;
      }
      return Array.prototype.indexOf.call(elm.parentNode.childNodes, elm);
    },

    offset : function(elm) {
      var off = { left : 0, top : 0 };
      var base = null;
      for (var e = elm; e.parentNode != null; e = e.parentNode) {
        if (e.offsetParent != null) {
          base = e;
          break;
        }
      }
      if (base != null) {
        for (var e = base; e.offsetParent != null; e = e.offsetParent) {
          off.left += e.offsetLeft;
          off.top += e.offsetTop;
        }
      }
      for (var e = elm; e.parentNode != null &&
            e != document.body; e = e.parentNode) {
        off.left -= e.scrollLeft;
        off.top -= e.scrollTop;
      }
      return off;
    }
  };

  util = util.extend(util, {
    moveSublist : function(list, from, length, to) {
      var i1 = list.slice(from, from + length);
      var i2 = list.slice(0, from).concat(list.slice(from + length) );
      to = from < to? to - length : to; 
      return i2.slice(0, to).concat(i1).concat(i2.slice(to) );
    },
    getCellId : function(row, col) {
      return row + ':' + col;
    },
    translate : function(val1, min1, max1, min2, max2) {
      var val2 = (val1 - min1) * (max2 - min2) / (max1 - min1) + min2;
      return Math.max(min2, Math.min(Math.round(val2), max2) );
    }
  });

  $c.util = util;

}(window.comfortable || (window.comfortable = {}) );

//
// comfortable - default-header-cell-renderer-factory
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

  // selector of sort order
  var createSelector = function() {
    var rect = $c.util.createElement('span', {
      attrs : { 'class' : '${prefix}selector-body' }, 
      style : { display:'inline-block', width:'12px', height : '12px' }
    });
    return {
      $el : rect,
      selected : false,
      setSelected : function(selected) {
        this.selected = selected;
        $c.util.$(rect).addClass(
            '${prefix}selected', !selected);
      },
      isSelected : function() {
        return this.selected;
      }
    };
  };

  // filter checkbox
  var createCheckbox = function() {
    var path = $c.util.createSVGElement('path', { attrs : {
        'class' : '${prefix}checkbox-check',
        d : 'M 2 5 L 5 9 L 10 3'
      } });
    return {
      $el : $c.util.createElement('span', {
        attrs : { 'class' : '${prefix}checkbox-body' }, 
        style : { display : 'inline-block', width : '12px', height : '12px' }
        }, [
          $c.util.createSVGElement('svg', {
            attrs : { width : 12, height : 12 } }, [ path ])
        ] ),
      checked : true,
      setIncomplete : function(incomplete) {
        $c.util.$(path).addClass(
            '${prefix}checkbox-incomplete-check', !incomplete);
      },
      setChecked : function(checked) {
        this.checked = checked;
        path.style.display = this.checked? '' : 'none';
      },
      isChecked : function() {
        return this.checked;
      }
    };
  };

  var createFilterDialog = function(opts, cell) {

    var messages = $c.i18n.getMessages();
    var SortOrder = $c.SortOrder;
    var labelStyle = { marginLeft : '4px', verticalAlign : 'middle' };

    var createSortButton = function(label) {
      var selector = createSelector();
      selector.$el.style.verticalAlign = 'middle';
      return {
        selector : selector,
        $el : $c.util.createElement('div', [
          selector.$el,
          $c.util.createElement('span', {
            style : labelStyle, props : { textContent : label } })
        ], { attrs : { 'class' : '${prefix}clickable-op' }, on : {
          mousedown : function(event) { event.preventDefault(); },
          click : function() { dialog.trigger('sortclick',
              { label : label }); }
        } })
      };
    };

    var sortAscButton = createSortButton(messages.SORT_ASC);
    var sortDescButton = createSortButton(messages.SORT_DESC);

    var filterItems = [ messages.SELECT_ALL ].concat(opts.filterValues).
      map(function(value, i) {
        return {
          index : i,
          label : (i > 0)? opts.labelFunction(value, cell) : value,
          value : value,
          checked : (i > 0)? !opts.rejects[value] : true,
          color : false
        };
      });

    var filterItemList = $c.util.extend($c.createList(), {
      items : filterItems,
      getItemAt : function(row) { return this.items[row]; },
      getItemCount : function() { return this.items.length; },
      createCell : function() {
        var checkbox = createCheckbox();
        var label = $c.util.createElement('span', { style : labelStyle,
          props : { textContent : 'M' } });
        checkbox.$el.style.verticalAlign = 'middle';
        var $public = {
          row : 0,
          checkbox : checkbox,
          setLabel : function(text) {
            label.textContent = text || messages.SELECT_BLANK;
          },
          $el : $c.util.createElement('div', {
            attrs : { 'class' : '${prefix}clickable-op' },
            on : {
              mousedown : function(event) { event.preventDefault(); },
              click : function() {
                dialog.trigger('filterclick', { index : $public.index });
              }
            }
          }, [ checkbox.$el, label ])
        };
        return $public;
      },
      renderCell : function(cell, item) {
        cell.index = item.index;
        cell.setLabel(item.label);
        cell.checkbox.setChecked(item.checked);
        cell.checkbox.setIncomplete(item.incomplete);
      },
      height : 0,
      maxHeight : 150
    }).on('rendered', function(event, detail) {
      var height = Math.min(this.maxHeight,
          this.cellHeight * this.getItemCount() );
      if (this.height != height) {
        this.height = height;
        this.$el.style.height = height + 'px';
        this.invalidate();
      }
    });
    filterItemList.$el.style.width = '150px';
    filterItemList.$el.style.height = '0px';
    filterItemList.invalidate();

    var dialog = $c.util.extend($c.ui.createDialog([
      // sort
      sortAscButton.$el,
      sortDescButton.$el,
      // search box
      $c.util.createElement('input', { attrs : { type : 'text' },
        style : { width : '150px', margin : '4px 0px' },
        on : { keyup : function(event) {
          var value = event.currentTarget.value;
          filterItemList.items = filterItems.filter(function(filterItem) {
            return !(value && filterItem.label.indexOf(value) == -1);
          });
          filterItemList.invalidate();
        }} }),
      // filter items
        filterItemList.$el,
      // buttons
      $c.util.createElement('div', { style :
          { marginTop : '4px', display : 'inline-block', float : 'right' } },
        [
          $c.ui.createButton(messages.OK, function() {
            dialog.dispose();
            dialog.trigger('applyfilter');
          }),
          $c.ui.createButton(messages.CANCEL, function() {
            dialog.dispose();
          })
        ])
    ]), {
      sortOrder : opts.sortOrder, rejects : opts.rejects
    } ).on('sortclick', function(event, detail) {

      if (detail.label == messages.SORT_ASC) {
        this.sortOrder = this.sortOrder == SortOrder.ASC? null : SortOrder.ASC;
      }
      if (detail.label == messages.SORT_DESC) {
        this.sortOrder = this.sortOrder == SortOrder.DESC? null : SortOrder.DESC;
      }

      this.trigger('sortchange');

      this.dispose();
      this.trigger('applysort');

    }).on('sortchange', function() {

      sortAscButton.selector.setSelected(this.sortOrder == SortOrder.ASC);
      sortDescButton.selector.setSelected(this.sortOrder == SortOrder.DESC);

    } ).on('filterclick', function(event, detail) {

      if (detail.index == 0) {
        // select all
        var selectCount = 0;
        filterItems.forEach(function(filterItem, i) {
          if (i > 0 && filterItem.checked) {
            selectCount += 1;
          }
        });
        var selectAll = selectCount != filterItems.length - 1;
        filterItems.forEach(function(filterItem, i) {
          if (i > 0) {
            filterItem.checked = selectAll;
          }
        });
      } else {
        var filterItem = filterItems[detail.index];
        filterItem.checked = !filterItem.checked;
      }

      var rejects = {};
      filterItems.forEach(function(filterItem, i) {
        if (i > 0 && !filterItem.checked) {
          rejects[filterItem.value] = true;
        }
      });

      this.rejects = rejects;
      this.trigger('filterchange');

    }).on('filterchange', function() {

      var rejectCount = 0;
      for (var value in this.rejects) {
        rejectCount += 1;
      }

      // update 'select all' checkbox
      filterItems[0].checked = rejectCount != filterItems.length - 1;
      filterItems[0].incomplete = rejectCount != 0;

      filterItemList.invalidate();

    }).trigger('sortchange').trigger('filterchange');

    return dialog;
  };

  var createFilterButton = function() {
    return {
      $el : $c.util.createSVGElement('svg',
          { attrs : { width : 15, height : 15,
            'class' : '${prefix}clickable-op' } }),
      filtered : false,
      sortOrder : null,
      setFiltered : function(filtered) {
        this.filtered = filtered;
        this.update();
      },
      setSortOrder : function(sortOrder) {
        this.sortOrder = sortOrder;
        this.update();
      },
      update : function() {
        // remove all children
        while (this.$el.firstChild) {
          this.$el.removeChild(this.$el.firstChild);
        }
        // outer rect
        this.$el.appendChild($c.util.createSVGElement('rect', {
          attrs : { 'class' : '${prefix}filter-body',
            x : 0, y : 0, width: 15, height : 15, rx: 3, ry : 3 } }) );
        // and others.
        var fillClass = '${prefix}filter-fill';
        var strokeClass = '${prefix}filter-stroke';
        if (this.filtered) {
          this.$el.appendChild($c.util.createSVGElement('path', {
            attrs : { 'class' : fillClass,
              d : 'M 5 4 L 8 7 L 8 12 L 11 12 L 11 7 L 14 4 Z' } }) );
          if (this.sortOrder == null) {
            this.$el.appendChild($c.util.createSVGElement('path', {
              attrs : { 'class' : fillClass, d: 'M 0 8 L 3 12 L 6 8 Z' } }) );
          }
        } else if (this.sortOrder == null) {
          this.$el.appendChild($c.util.createSVGElement('path', {
            attrs : { 'class' : fillClass, d: 'M 1 4 L 7 11 L 13 4 Z' } }) );
        } else {
          this.$el.appendChild($c.util.createSVGElement('path', {
            attrs : { 'class' : fillClass, d: 'M 4 5 L 9 11 L 14 5 Z' } }) );
        }
        if (this.sortOrder != null) {
          this.$el.appendChild($c.util.createSVGElement('path', {
            attrs : { 'class' : strokeClass, d: 'M 3 2 L 3 12'} } ) );
          if (this.sortOrder == $c.SortOrder.ASC) {
            this.$el.appendChild($c.util.createSVGElement('path', {
              attrs : { 'class' : strokeClass, d: 'M 1 5 L 3 2 L 5 5'} }) );
          } else {
            this.$el.appendChild($c.util.createSVGElement('path', {
              attrs : { 'class' : strokeClass, d : 'M 1 9 L 3 12 L 5 9' } }) );
          }
        }
        return this;
      }
    }.update();
  };

  var getFilterValues = function(tableModel, dataField, comparator) {
    var exists = {};
    var filterValues = [];
    var items = tableModel.items;
    for (var i = 0; i < items.length; i += 1) {
      var value = items[i][dataField];
      if (typeof value == 'undefined') {
        continue;
      }
      if (!exists[value]) {
        if (value !== '') {
          filterValues.push(value);
        }
        exists[value] = true;
      }
    }
    if (comparator) {
      filterValues.sort(comparator);
    } else {
      filterValues.sort();
    }
    // blank is always last.
    if (exists['']) {
      filterValues.push('');
    }
    return filterValues;
  };

  var createDefaultHeaderCellRendererFactory = function(opts) {

    opts = $c.util.extend($c.createDefaultCellRendererFactoryOpts(), opts || {});

    return function(td) {

      var labelRenderer = $c.createMultiLineLabelRenderer(td.$el);

      var tableModel = td.tableModel;
      var filterButton = null;
      var dialog = null;

      var showFilterDialog = function() {
        var filterContext = tableModel.filterContext;
        var dataField = filterButton.cell.dataField;
        var filterValues = getFilterValues(tableModel, dataField,
            filterButton.cell.comparator);
        var dialog = createFilterDialog($c.util.extend({
          sortOrder : filterContext.sort &&
            filterContext.sort.dataField == dataField?
            filterContext.sort.sortOrder : null,
          rejects : filterContext.filters[dataField] || {},
          filterValues : filterValues
        }, opts), filterButton.cell).on('applysort', function() {
          filterContext['.comparator'] = filterButton.cell.comparator;
          filterContext.sort = this.sortOrder?
              { dataField : dataField, sortOrder : this.sortOrder } :null;
          tableModel.trigger('filterchange');
        }).on('applyfilter', function() {
          filterContext.filters[dataField] = this.rejects;
          tableModel.trigger('filterchange');
        });
        var off = $c.util.offset(td.$el);
        dialog.$el.style.left = off.left + 'px',
        dialog.$el.style.top = (off.top + td.$el.offsetHeight) + 'px';
        dialog.show();
        return dialog;
      };

      return {
        render : function(cell) {

          labelRenderer.setLabel(cell.value || '\u00a0');

          if (cell.dataField) {

            if (!filterButton) {
              filterButton = createFilterButton();
              $c.util.set(filterButton.$el, {
                style : { position : 'absolute', right : '4px' },
                on : { mousedown : function(event) {
                    event.preventDefault();
                    if (dialog == null) {
                      // wait for end edit then show dialog.
                      $c.util.callLater(function() {
                        dialog = showFilterDialog();
                        dialog.on('dispose', function() {
                          dialog = null;
                        });
                      });
                    } else {
                      dialog.dispose();
                    }
                  }
                }
              });
              td.$el.style.position = 'relative';
              td.$el.appendChild(filterButton.$el);
            }

            filterButton.cell = cell;
            var filterContext = tableModel.filterContext;
            filterButton.setSortOrder(filterContext.sort &&
                filterContext.sort.dataField == cell.dataField?
                    filterContext.sort.sortOrder : null);
            var rejects = filterContext.filters[cell.dataField] || {};
            var filtered = false;
            for (var value in rejects) { filtered = true; break; }
            filterButton.setFiltered(filtered);
          }
          if (filterButton) {
            filterButton.$el.style.display = cell.dataField? '' : 'none';
          }
        },
        beginEdit : function(cell) {
          return { focus : function() {}, endEdit : function() {} };
        }
      };
    };
  };

  $c.createDefaultHeaderCellRendererFactory = createDefaultHeaderCellRendererFactory;

}(window.comfortable || (window.comfortable = {}) );

//
// comfortable - template-support
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

  $c.SortOrder = { ASC : 'asc', DESC : 'desc' };

  var createFilterContext = function() {
    return { sort : null, filters : {} };
  };

  var createDefaultOrderedColumnIndices = function(tableModel) {
    var orderedColumnIndices = [];
    var columnCount = tableModel.getColumnCount();
    for (var i = 0; i < columnCount; i += 1) {
      orderedColumnIndices.push(i);
    }
    return orderedColumnIndices;
  };

  var showColumnEditDialog = function(table) {

    var messages = $c.i18n.getMessages();
    var tableModel = table.model;

    var columns = function() {
      var columns = [];
      var columnCount = tableModel.getColumnCount();
      for (var col = 0; col <= columnCount;) {
        if (col == table.lockColumn) {
          columns.push({ type : 'lockColumn', label : messages.LOCK_COLUMN,
            hidden : !table.enableLockColumn });
        }
        if (col < columnCount) {
          var cell = tableModel.getCellAt(0, col);
          var orderedCol = tableModel.getOrderedColumnIndexAt(col);
          columns.push({ type : 'column', label : tableModel.getValueAt(0, col),
            hidden : !!tableModel.hiddenColumns[orderedCol],
            col : orderedCol, colSpan : cell.colSpan });
          col += cell.colSpan;
        } else {
          col += 1;
        }
      }
      return columns;
    }();

    var columnItems = columns.map(function(column) {
      return $c.util.createElement('div', {
          attrs : { 'class' : '${prefix}listitem ${prefix}clickable' },
          style : { color : column.type == 'lockColumn'? 'blue' : '' },
          on : { mousedown : function(event) {
            event.preventDefault();
            columnItems.forEach(function(elm) {
              $c.util.$(elm).removeClass('${prefix}clickable');
            });
            var mousemoveHandler = function(event) {
              if (!started && Math.abs(event.pageY - dragPoint.y) > 4) {
                started = true;
              }
              if (!started) {
                return;
              }
              var listitem = $c.util.closest(event.target,
                  { className : '${prefix}listitem', root : dialog.$el });
              if (!listitem) {
                return;
              }
              indexTo = columnItems.indexOf(listitem);
              var off = $c.util.offset(listitem);
              var top = listitem.offsetTop - 2 - listitem.parentNode.scrollTop;
              if (off.top + listitem.offsetHeight / 2 < event.pageY) {
                indexTo += 1;
                top += listitem.offsetHeight;
              }
              bar.style.display = '';
              bar.style.top = top + 'px';
            };
            var mouseupHandler = function(event) {
              $c.util.$(document).off('mousemove', mousemoveHandler).
                off('mouseup', mouseupHandler);
              columnItems.forEach(function(elm) {
                $c.util.$(elm).addClass('${prefix}clickable');
              });
              lastTarget = target;
              dialog.$el.removeChild(bar);
              if (indexTo != -1 && indexFrom != indexTo) {
                var parent = target.parentNode;
                var ref = columnItems[indexTo];
                columns = $c.util.moveSublist(columns, indexFrom, 1, indexTo);
                columnItems = $c.util.moveSublist(columnItems, indexFrom, 1, indexTo);
                parent.removeChild(target);
                if (ref) {
                  parent.insertBefore(target, ref);
                } else {
                  parent.appendChild(target);
                }
              }
            };
            $c.util.$(document).on('mousemove', mousemoveHandler).
              on('mouseup', mouseupHandler);
            var target = event.currentTarget;
            var bar = $c.util.createElement('div', {
              attrs : { 'class' : '${prefix}column-edit-bar' },
              style : { position : 'absolute', left : '0px',
                display : 'none', width : target.offsetWidth + 'px' }
            });
            var indexFrom = columnItems.indexOf(target);
            var indexTo = -1;
            var started = false;
            var dragPoint = { x : event.pageX, y : event.pageY };
            dialog.$el.appendChild(bar);
            if (lastTarget != null) {
              $c.util.$(lastTarget).removeClass('${prefix}selected');
            }
            $c.util.$(target).addClass('${prefix}selected');
          }}
        },[
        $c.util.createElement('input', {
          attrs : { type : 'checkbox' },
          props : { checked : !column.hidden },
          style : { verticalAlign : 'middle' },
          on:{ click : function(event) {
            var target = event.currentTarget;
            var index = $c.util.indexOf(target.parentNode);
            columns[index].hidden = !target.checked;
          }}
        }),
        $c.util.createElement('span', {
          style : { verticalAlign : 'middle' },
          props : { textContent : column.label }
        }) ]);
    });

    var lastTarget = null;

    var dialog =  $c.util.extend($c.ui.createDialog([
      // columns
      $c.util.createElement('div',
        { style : { overflow : 'auto',  height : '200px' } }, columnItems),
      // buttons
      $c.util.createElement('div', { style : { float : 'right'} }, [
        $c.ui.createButton(messages.RESET, function() {
          dialog.dispose();
          tableModel.orderedColumnIndices = null;
          tableModel.hiddenColumns = {};
          tableModel.trigger('beforecellsizechange');
          table.lockColumn = table.defaultLockColumn;
          table.enableLockColumn = true;
          table.invalidate();
        }),
        $c.ui.createButton(messages.APPLY, function() {
          dialog.dispose();
          var orderedColumnIndices = [];
          var hiddenColumns = {};
          var lockColumn = 0;
          var enableLockColumn = true;
          columns.forEach(function(column, col) {
            if (column.type == 'column') {
              for (var i = 0; i < column.colSpan; i += 1) {
                orderedColumnIndices.push(i + column.col);
              }
              if (column.hidden) {
                hiddenColumns[tableModel.getOrderedColumnIndexAt(column.col)] = true;
              }
            } else if (column.type == 'lockColumn') {
              lockColumn = col < columns.length - 1? col : 0;
              enableLockColumn = !column.hidden;
            }
          });
          tableModel.orderedColumnIndices = orderedColumnIndices;
          tableModel.hiddenColumns = hiddenColumns;
          tableModel.trigger('beforecellsizechange');
          table.lockColumn = lockColumn;
          table.enableLockColumn = enableLockColumn;
          table.invalidate();
        }),
        $c.ui.createButton(messages.CANCEL, function() {
          dialog.dispose();
        })
      ])
    ])).on('beforeshow', function() {
      var left = document.documentElement.scrollLeft +
        ( (window.innerWidth - this.$el.offsetWidth) / 2 );
      var top = document.documentElement.scrollTop +
        ( (window.innerHeight - this.$el.offsetHeight) / 2 );
      this.$el.style.left = left + 'px';
      this.$el.style.top = top + 'px';
    });
    dialog.show();
  };

  var fromTemplate = function(template) {

    template.thead = template.thead || [[]];
    template.tbody = template.tbody || [[]];

    template.thead.forEach(function(row) {
      row.forEach(function(cell) {
        if (!cell.factory && cell.dataType) {
          cell.factory = $c.createDefaultHeaderCellRendererFactory(cell);
        }
      });
    });
    template.tbody.forEach(function(row) {
      row.forEach(function(cell) {
        if (!cell.factory && cell.dataType) {
          cell.factory = $c.createDefaultCellRendererFactory(cell);
        }
      });
    });

    var columnCount = 0;
    var cellWidth = {};
    var cellHeight = {};
    var styles = function() {
      var spaned = {};
      var setSpaned = function(row, col, cell) {
        for (var r = 0; r < cell.rowSpan; r += 1) {
          for (var c = 0; c < cell.colSpan; c += 1) {
            spaned[$c.util.getCellId(row + r, col + c)] = true;
          }
        }
      };
      return template.thead.concat(template.tbody).map(function(tr, row) {
        var style = {};
        var col = 0;
        var c = 0;
        while (c < tr.length) {
          var id = $c.util.getCellId(row, col);
          if (spaned[id]) {
            col += 1;
            continue;
          }
          var td = tr[c];
          var cell = $c.util.extend({ rowSpan : 1, colSpan : 1 }, td);
          setSpaned(row, col, cell);
          if (typeof cell.width == 'number') {
            cellWidth[col] = cell.width;
          }
          if (typeof cell.height == 'number') {
            cellHeight[row] = cell.height;
          }
          style[col] = td;
          col += cell.colSpan;
          c += 1;
        }
        columnCount = Math.max(columnCount, col);
        return style;
      });
    }();

    var getCellStyleAt = function(row, col) {
      if (row < headLength) {
        return styles[row][col] || {};
      } else {
        return styles[headLength + (row - headLength) % bodyLength][col] || {};
      }
    };

    var headLength = template.thead.length;
    var bodyLength = template.tbody.length;

    var table = $c.util.extend($c.createTable(), {
      lockRow : headLength,
      lockColumn : template.lockColumn || 0,
      enableLockColumn : true,
      defaultLockColumn : 0,
      getLockColumn : function() {
        return !this.enableLockColumn? 0 : this.lockColumn;
      }
    }).on('mousedown', function(event, detail) {
      if (detail.row < this.getLockRow() ) {
        // on header.
        this.editor.endEdit();
        this.invalidate();
      }
    }).on('contextmenu', function(event, detail) {

      if (!(detail.row < table.getLockRow() ) ) {
        return;
      }
/*
      var tableModel = table.model;
      var col = detail.col;
      var orderedCol = tableModel.orderedColumnIndices[col];
*/
      var messages = $c.i18n.getMessages();
      var tableModel = table.model;

      var menuItems = [
        { label : messages.RESET_FILTER, action : function() {
            tableModel.filterContext = createFilterContext();
            tableModel.filteredItems = null;
            table.invalidate();
        }},
        { label : messages.EDIT_COLUMNS, action : function() {
            showColumnEditDialog(table);
        }}
      ];

      detail.originalEvent.preventDefault();
      $c.util.callLater(function() {
        $c.ui.showMenu(
            detail.originalEvent.pageX,
            detail.originalEvent.pageY,
            menuItems);
      });
    });

    // keep default value for restore.
    table.defaultLockColumn = table.lockColumn;

    table.model = $c.util.extend(table.model, {
      // user defines
      defaultHeaderCellRendererFactory : $c.createDefaultHeaderCellRendererFactory(),
      cellWidth : cellWidth,
      cellHeight : cellHeight,
      orderedColumnIndices : null,
      filterContext : createFilterContext(),
      hiddenColumns : {},
      items : [],
      filteredItems : null,
      getItemCount : function() { return (this.filteredItems || this.items).length; },
      getItemAt : function(row) { return (this.filteredItems || this.items)[row]; },
      getOrderedColumnIndexAt : function(col) {
        if (this.orderedColumnIndices == null) {
          this.orderedColumnIndices = createDefaultOrderedColumnIndices(this);
        }
        return this.orderedColumnIndices[col];
      },
      getItemIndexAt : function(row, col) {
        if (row < headLength) {
          return { row : -1, col : -1 };
        } else {
          var orderedCol = this.getOrderedColumnIndexAt(col);
          var style = getCellStyleAt(row, orderedCol);
          row -= headLength;
          return {
            row : ~~(row / bodyLength),
            col : style.dataField ||
              ( (row % bodyLength) * this.getColumnCount() + orderedCol)
          };
        }
      },
      setValueAt : function(row, col, value) {
        if (row < headLength) {
        } else {
          var itemIndex = this.getItemIndexAt(row, col);
          this.getItemAt(itemIndex.row)[itemIndex.col] = value;
        }
      },
      // overrides
      getRowCount : function() { return headLength +
        bodyLength * this.getItemCount(); },
      getColumnCount : function() { return columnCount; },
      getLineRowCountAt : function(row) {
        return row < headLength? headLength : bodyLength; },
      getLineRowAt : function(row) {
        return row < headLength? row : (row - headLength) % bodyLength; },
      getCellWidthAt : function(col) {
        var orderedCol = this.getOrderedColumnIndexAt(col);
        if (this.hiddenColumns[orderedCol]) {
          return 0;
        }
        return this.cellWidth[orderedCol] || this.defaultCellWidth;
      },
      getCellHeightAt : function(row) {
        return this.cellHeight[row] || this.defaultCellHeight;
      },
      getCellRendererFactoryAt : function(row, col) {
        var orderedCol = this.getOrderedColumnIndexAt(col);
        return getCellStyleAt(row, orderedCol).factory || (row < headLength?
            this.defaultHeaderCellRendererFactory :
            this.defaultCellRendererFactory);
      },
      getCellStyleAt : function(row, col) {
        var orderedCol = this.getOrderedColumnIndexAt(col);
        var style = $c.util.extend({}, getCellStyleAt(row, orderedCol) );
        style.className = style.className || '';
        if (row < headLength) {
          style.className += ' ' + '${prefix}header';
          style.editable = false;
        } else {
          var itemIndex = this.getItemIndexAt(row, col);
          row -= headLength;
          style.className += ' ${prefix}' +
            (itemIndex.row % 2 == 0? 'even' : 'odd');
          if (style.editable === false) {
            style.className += ' ' + '${prefix}disabled';
          }
        }
        return style;
      },
      getValueAt : function(row, col) {
        var orderedCol = this.getOrderedColumnIndexAt(col);
        if (row < headLength) {
          return getCellStyleAt(row, orderedCol).label || '';
        } else {
          var itemIndex = this.getItemIndexAt(row, col);
          var value = this.getItemAt(itemIndex.row)[itemIndex.col];
          return typeof value != 'undefined'? value : '';
        }
      }
    }).on('valuechange', function(event, detail) {
      this.setValueAt(detail.row, detail.col, detail.newValue);
    }).on('cellsizechange', function(event, detail) {
      if (typeof detail.col == 'number') {
        var orderedCol = this.getOrderedColumnIndexAt(detail.col);
        this.cellWidth[orderedCol] = detail.cellWidth;
      }
    }).on('columndragged', function(event, detail) {
      this.orderedColumnIndices = $c.util.moveSublist(
          this.orderedColumnIndices, detail.colFrom, detail.colSpan, detail.colTo);
      if (detail.colFrom < table.lockColumn && table.lockColumn <= detail.colTo) {
        table.lockColumn -= detail.colSpan;
      } else if (detail.colTo < table.lockColumn && table.lockColumn <= detail.colFrom) {
        table.lockColumn += detail.colSpan;
      }
    }).on('filterchange', function() {

      // apply filter

      var filters = this.filterContext.filters;
      var filteredItems = this.items.filter(function(item) {
        var filtered = false;
        for (var dataField in filters) {
          if (filters[dataField][item[dataField]]) {
            filtered = true;
            break;
          }
        }
        return !filtered;
      } );

      var sort = this.filterContext.sort;
      if (sort) {
        var order = sort.sortOrder == $c.SortOrder.ASC? 1 : -1;
        var dataField = sort.dataField;
        var indexField = '.index';
        var sortKeyField = '.sortKey';
        var comparator = this.filterContext['.comparator'];
        filteredItems.forEach(function(item, i) {
          item[indexField] = i;
          item[sortKeyField] = (item[dataField] === null ||
              typeof item[dataField] == 'undefined')? '' : item[dataField];
        });
        if (comparator) {
          // sort by custom comparator.
          delete this.filterContext['.comparator'];
          filteredItems.sort(function(item1, item2) {
            var result = comparator(item1[sortKeyField], item2[sortKeyField]);
            if (result != 0) {
              return order * result;
            }
            return order * (item1[indexField] < item2[indexField]? -1 : 1);
          });
        } else {
          filteredItems.sort(function(item1, item2) {
            if (item1[sortKeyField] != item2[sortKeyField]) {
              return order * (item1[sortKeyField] < item2[sortKeyField]? -1 : 1);
            }
            return order * (item1[indexField] < item2[indexField]? -1 : 1);
          });
        }
        filteredItems.forEach(function(item) {
          delete item[indexField];
          delete item[sortKeyField];
        });
      }
      this.filteredItems = filteredItems;
      table.invalidate();
    });

    // append itemIndex to events.
    [ 'valuechange' ].
    forEach(function(type) {
      table.model.on(type, function(event, detail) {
        detail.itemIndex = this.getItemIndexAt(detail.row, detail.col);
      });
    });
    $c.tableEventTypes.forEach(function(type) {
      table.on(type, function(event, detail) {
        detail.itemIndex = this.model.getItemIndexAt(detail.row, detail.col);
      });
    });

    return table;
  };

  $c.fromTemplate = fromTemplate;

}(window.comfortable || (window.comfortable = {}) );
