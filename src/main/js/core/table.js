//
// comfortable - table
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
          verticalAlign : cell.verticalAlign,
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
              if (td.renderer) {
                td.renderer.dispose();
              }
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
                attrs : { 'class' : '${prefix}column-drag-proxy' },
                style : { position : 'absolute', top : '0px',
                  width : colWidth + 'px',
                  height : rect.height + 'px' }
              });
              var markerStyle = { gap : 2 };
              var marker = util.createElement('div', {
                attrs : { 'class' : '${prefix}column-drag-marker' },
                style : { position : 'absolute', top : '0px',
                  width : (markerStyle.gap * 2 + 1) + 'px',
                  height : rect.height + 'px' }
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
      forEachCells : function(callback) {
        tables.forEach(function(table) {
          (table.tbody.children || []).forEach(function(tr) {
            (tr.children || []).forEach(function(cell) {
              callback(cell);
            });
          });
        });
      },
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
