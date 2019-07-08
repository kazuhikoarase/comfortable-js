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

/// <reference path="UIEventTarget.ts" />

namespace comfortable {

  interface CellRect {
    left : number;
    top : number;
    width : number;
    height : number;
  }

  interface CellSizeCache {
    viewWidth : number;
    viewHeight : number;
    rects : CellRect[];
    rowCount : number;
    columnCount :number;
    lockTop : number;
    lockLeft : number;
    lockBottom : number;
    lockRight : number;
    width : number;
    height : number;
  }

  interface RenderParams {
    width : number;
    height : number;
    rects : CellRect[],
    viewWidth : number;
    viewHeight : number;
    scrWidth : number;
    scrHeight : number;
  }

  interface TargetColumn {
    colFrom : number;
    colTo : number;
    i : number;
    left : number;
    distance : number;
  }

  interface ColResizeHandle {
    $el : HTMLElement;
    col? : number;
    left? : number;
  }

  /**
   * @internal
   */
  export interface InternalEditor extends Editor {
    impl : any;
    cell : { row : number, col : number };
    beginEdit : (row : number, col : number, makeVisible? : boolean) => void;
    endEdit : () => void;
  }

  /**
   * @internal
   */
  export var tableEventTypes = [
    'mousedown', 'mouseover', 'mouseout',
    'click', 'dblclick', 'contextmenu' ];

  export var createTable = function() : Table {
    return new TableImpl(new DefaultTableModel() );
  }

  // Left-Top
  var LT_INDEX = 0;
  // Center-Middle
  var CM_INDEX = 4;
  // Right-Bottom
  var RB_INDEX = 8;

  /**
   * @internal
   */
  export class TableImpl extends UIEventTargetImpl implements Table {

    constructor(model : TableModel) {
      super();
      this.model = model;
    }

    private tables = ( () => {

      var tables : InternalTable[] = [];
      for (var i = 0; i < 9; i += 1) {
        tables.push(new InternalTableImpl() );
      }

      tables.forEach( (table, i) => {
        table.row = ~~(i / 3);
        table.col = i % 3;
        var cellEventHandler = function(handler :
            (event : Event, td : ElmCache) => void) : EventListener {
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
        var delegateHandler = cellEventHandler( (event, td) => {
          this.trigger(event.type,
              { originalEvent : event, row : td.row, col : td.col }); });
        var delegates : {[type : string] : EventListener} = {};
        tableEventTypes.forEach(function(type) {
          delegates[type] = delegateHandler;
        });
        util.set(table.$el, {
          on : delegates
        });
        util.set(table.$el, {
          style : { position : 'absolute' },
          on : {
            mousedown: cellEventHandler( (event, td) => {
              if (event.which != 1) {
                return;
              }
              if (td.row < this.model.getLockTop() &&
                  this.model.isColumnDraggable() &&
                  !event.defaultPrevented) {
                event.preventDefault();
                var mousemoveHandler = (event : Event) => {
                  updateMarker(event.pageX - dragPoint.x);
                };
                var mouseupHandler = (event : Event) => {
                  util.$(document).off('mousemove', mousemoveHandler).
                    off('mouseup', mouseupHandler);
                  this.frame.removeChild(dragProxy);
                  this.frame.removeChild(marker);
                  if (targetColumn != null) {
                    tableModel.trigger('columndragged', {
                      colFrom : targetColumn.colFrom,
                      colSpan : cell.colSpan,
                      colTo : targetColumn.colTo });
                    this.invalidate();
                  }
                };
                util.$(document).on('mousemove', mousemoveHandler).
                  on('mouseup', mouseupHandler);
                var getTargetColumn = (centerX : number) => {
                  var targetColumn : TargetColumn = null;
                  tables.forEach( (tbl, i) => {
                    if (tbl.row == table.row) {
                      var tableState = tbl.tableState;
                      var rect = this.getCellSizeCache().rects[i];
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
                var updateMarker = function(delta : number) {
                  var left = getLeft(delta);
                  targetColumn = getTargetColumn(left + colWidth / 2);
                  dragProxy.style.left = left + 'px';
                  marker.style.left = (targetColumn.left - markerStyle.gap - 1) + 'px';
                };
                var tableModel = this.model;
                var tableState = table.tableState;
                var targetColumn : TargetColumn = null;
                var rect = this.getCellSizeCache().rects[i];
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
                var getLeft = function(delta : number) {
                  return tableState.left + rect.left + colLeft + delta;
                };
                var dragPoint = { x : event.pageX, y : event.pageY };
                var dragProxy = util.createElement('div', {
                  attrs : { 'class' : '${prefix}-column-drag-proxy' },
                  style : { position : 'absolute', top : '0px',
                    width : colWidth + 'px',
                    height : rect.height + 'px' }
                });
                var markerStyle = { gap : 2 };
                var marker = util.createElement('div', {
                  attrs : { 'class' : '${prefix}-column-drag-marker' },
                  style : { position : 'absolute', top : '0px',
                    width : (markerStyle.gap * 2 + 1) + 'px',
                    height : rect.height + 'px' }
                });
                updateMarker(0);
                this.frame.appendChild(dragProxy);
                this.frame.appendChild(marker);
                return;
              }
              // begin edit by logical row and col
              if (this.editor.cell != null &&
                  this.editor.cell.row == td.row &&
                  this.editor.cell.col == td.col) {
              } else if (this.isEditableAt(td.row, td.col) ) {
                event.preventDefault();
                this.editor.beginEdit(td.row, td.col, true);
              }
            })
          }
        } );
      });

      return tables;
    })();

    private barSize : { width : number, height : number } = null;
    private measureBarSize() {
      if (this.barSize == null) {

        var scr = util.createElement('div', {
          style : { position : 'absolute' } });
  
        var viewPane = util.createElement('div', {
          style : { position : 'absolute', overflow : 'auto' },
          on : { scroll : (event) => { this.render(); } }
        }, [ scr ]);

        util.extend(scr.style, {
          width : '200px', height : '200px' });
        util.extend(viewPane.style, {
          left : '0px', top : '0px', width : '100px', height : '100px' });

        this.frame.appendChild(viewPane);
        var barSize = {
          width : viewPane.offsetWidth - viewPane.clientWidth,
          height : viewPane.offsetHeight - viewPane.clientHeight
        };
        this.frame.removeChild(viewPane);
        if (barSize.width > 0 && barSize.height > 0) {
          // cache
          this.barSize = barSize;
        } else {
          return barSize;
        }
      }
      return this.barSize;
    };

    private hScr = util.createElement('div', {
        style : { position : 'absolute' } });

    private hViewPane = util.createElement('div', {
        style : { position : 'absolute',
          overflowX : 'auto', overflowY : 'hidden' },
        on : { scroll : (event) => { this.render(); } }
      }, [ this.hScr ]);

    private vScr = util.createElement('div', {
        style : { position : 'absolute' } });

    private vViewPane = util.createElement('div', {
        style : { position : 'absolute',
          overflowX : 'hidden', overflowY : 'auto' },
        on : { scroll : (event) => { this.render(); } }
      }, [ this.vScr ]);

    private frame = util.createElement('div', {
        style : { position : 'relative', overflow : 'hidden',
          width : '400px', height : '200px' },
        on : {
          mousedown : (event) => {
            if (util.closest(event.target, {
                $el : this.hViewPane, root : this.frame }) ) {
              this.editor.endEdit();
              this.render();
            } else if (util.closest(event.target, {
                $el : this.vViewPane, root : this.frame }) ) {
              this.editor.endEdit();
              this.render();
            }
          },
          keydown : (event) => {
            switch(event.keyCode) {
            case 9: // Tab
              event.preventDefault();
              this.move({ row : 0, col : event.shiftKey? -1 : 1 });
              break;
            case 13: // Enter
              event.preventDefault();
              this.move({ row : event.shiftKey? -1 : 1, col : 0 });
              break;
            }
          },
          wheel : (event) => {
            event.preventDefault();
            this.editor.endEdit();
            this.hViewPane.scrollLeft += event.deltaX;
            this.vViewPane.scrollTop += event.deltaY;
          }
        }
      }, [this.hViewPane, this.vViewPane].concat(
          this.tables.map(function(table) { return table.$el; }) ) );

    private lockLines : HTMLElement[] = [];
    private colResizeHandles : ColResizeHandle[] = [];

    private getCellRect(row : number, col : number) {
      var tableModel = this.tables[CM_INDEX].model;
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
    }
    private makeVisible(renderParams : RenderParams, row : number, col : number) {
      var ltRect = renderParams.rects[LT_INDEX];
      var scrollRect = renderParams.rects[CM_INDEX];
      var delta = { left : 0, top : 0 };
      var cellRect = this.getCellRect(row, col);
      var left = cellRect.left + this.tables[CM_INDEX].left;
      var top = cellRect.top + this.tables[CM_INDEX].top;
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
        left : renderParams.viewWidth > this.hViewPane.clientWidth?
            util.translate(-this.tables[CM_INDEX].left + delta.left,
            ltRect.width,
            ltRect.width + renderParams.viewWidth - this.hViewPane.clientWidth,
            0, renderParams.scrWidth - this.hViewPane.clientWidth, 'scroll.left') : 0,
        top : renderParams.viewHeight > this.vViewPane.clientHeight?
            util.translate(-this.tables[CM_INDEX].top + delta.top,
            ltRect.height,
            ltRect.height + renderParams.viewHeight - this.vViewPane.clientHeight,
            0, renderParams.scrHeight - this.vViewPane.clientHeight, 'scroll.top') : 0
      };
      if (row >= this.model.getLockTop() ) {
        this.vViewPane.scrollTop = scroll.top;
      }
      if (col >= this.model.getLockLeft() ) {
        this.hViewPane.scrollLeft = scroll.left;
      }
    }
    private cellSizeCache : CellSizeCache = null;
    private beforeCellSizeChangeHandler : EventListener = null;
    private getCellSizeCache() : CellSizeCache {
      var width = this.$el.clientWidth;
      var height = this.$el.clientHeight;
      var tableModel = this.model;
      if (this.beforeCellSizeChangeHandler == null) {
        this.beforeCellSizeChangeHandler = (event : Event, detail : any) => {
          // note: 'this' bind to table's.
          this.cellSizeCache = null;
        };
      }
      // observe cache size.
      tableModel.off('beforecellsizechange', this.beforeCellSizeChangeHandler);
      tableModel.on('beforecellsizechange', this.beforeCellSizeChangeHandler);
      //
      var rowCount = tableModel.getRowCount();
      var columnCount = tableModel.getColumnCount();
      var lockTop = tableModel.getLockTop();
      var lockLeft = tableModel.getLockLeft();
      var lockBottom = tableModel.getLockBottom();
      var lockRight = tableModel.getLockRight();
      if (!this.cellSizeCache ||
          this.cellSizeCache.rowCount != rowCount ||
          this.cellSizeCache.columnCount != columnCount ||
          this.cellSizeCache.lockTop != lockTop ||
          this.cellSizeCache.lockLeft != lockLeft ||
          this.cellSizeCache.lockBottom != lockBottom ||
          this.cellSizeCache.lockRight != lockRight ||
          this.cellSizeCache.width != width ||
          this.cellSizeCache.height != height) {
        var rowPos = [ 0, lockTop, rowCount - lockBottom, rowCount ];
        var colPos = [ 0, lockLeft, columnCount - lockRight, columnCount ];
        var cw = colPos.slice(1).map(function() { return 0; });
        var ch = rowPos.slice(1).map(function() { return 0; });
        var idx : number, count : number;
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
        var rects = this.tables.map(function(table) {
          var rect = { left : 0, top : 0, width : 0, height : 0 };
          for (var row = 0; row <= table.row; row += 1) {
            (<any>rect)[row < table.row ? 'top' : 'height'] += ch[row];
          }
          for (var col = 0; col <= table.col; col += 1) {
            (<any>rect)[col < table.col? 'left' : 'width'] += cw[col];
          }
          return rect;
        });

        var rbRect = rects[RB_INDEX];
        this.tables.forEach(function(table, i) {
          var rect = rects[i];
          if (table.col == 1) {
            rect.width = Math.max(0,
              Math.min(rect.width, width - rect.left - rbRect.width) );
          } else if (table.col == 2) {
            rect.left = width - rbRect.width;
          }
          if (table.row == 1) {
            rect.height = Math.max(0,
              Math.min(rect.height, height - rect.top - rbRect.height) );
          } else if (table.row == 2) {
            rect.top = height - rbRect.height;
          }
        });

        this.cellSizeCache = {
          viewWidth : cw[1],
          viewHeight : ch[1],
          rects : rects,
          rowCount : rowCount, columnCount : columnCount,
          lockTop : lockTop, lockLeft : lockLeft,
          lockBottom : lockBottom, lockRight : lockRight,
          width : width, height : height
        };
      }
      return this.cellSizeCache;
    }
    private getRenderParams() {
      var width = this.$el.clientWidth;
      var height = this.$el.clientHeight;
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
    }
    private getTargetTable(row : number, col : number) {
      var tableModel = this.model;
      var t = tableModel.getLockTop();
      var b = tableModel.getRowCount() - tableModel.getLockBottom();
      var l = tableModel.getLockLeft();
      var r = tableModel.getColumnCount() - tableModel.getLockRight();
      return this.tables.filter( (table) => {
        return table.row == (row < t? 0 : row >= b? 2 : 1) &&
          table.col == (col < l? 0 : col >= r? 2 : 1);
      })[0];
    }
    private isEditableAt(row : number, col : number) {
      return this.model.getCellAt(row, col).editable;
    }
    private move(offset : { row : number, col : number }) {

      if (this.editor.cell == null) {
        return;
      }
      var row = this.editor.cell.row;
      var col = this.editor.cell.col;
      var tableModel = this.model;

      var beginEditIfEditable = () => {
        if (this.isEditableAt(row, col) ) {
          this.editor.beginEdit(row, col, true);
          return true;
        }
        return false;
      };

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
    }
    private renderColumnResizeHandlers(renderParams : RenderParams) {
      var mousedownHandler = (event : Event) => {
        var mouseupHandler = (event : Event) => {
          util.$(document).off('mousemove', mousemoveHandler).
            off('mouseup', mouseupHandler);
          this.frame.removeChild(block);
          util.set(handle.$el.childNodes[0],
              { style : { display : 'none' } });
          var deltaX = event.pageX - dragPoint.x;
          var cellWidth = tableModel.getCellWidthAt(handle.col);
          tableModel.trigger('beforecellsizechange');
          tableModel.trigger('cellsizechange', {
            col : handle.col,
            cellWidth : Math.max(tableModel.minCellWidth,
                cellWidth + deltaX) });
          this.invalidate();
        };
        var mousemoveHandler = function(event : Event) {
          var deltaX = event.pageX - dragPoint.x;
          var cellWidth = tableModel.getCellWidthAt(handle.col);
          deltaX = Math.max(tableModel.minCellWidth,
              cellWidth + deltaX) - cellWidth;
          handle.$el.style.left = (handle.left + deltaX) + 'px';
        };
        if (event.which != 1) {
          return;
        }
        event.preventDefault();
        this.editor.endEdit();
        var handleIndex = this.colResizeHandles.map(function(handle) {
          return handle.$el; } ).indexOf(event.currentTarget);
        var handle = this.colResizeHandles[handleIndex];
        var dragPoint = { x : event.pageX, y : event.pageY };
        util.set(handle.$el.childNodes[0], { style : { display : '' } });
        var block = util.createElement('div', {
          style : {
            position : 'absolute', left : '0px', top : '0px',
            backgroundColor : handleStyle.backgroundColor,
            cursor : handleStyle.cursor,
            width : clientWidth + 'px',
            height : clientHeight + 'px'
          }
        });
        this.frame.appendChild(block);
        util.$(document).on('mousemove', mousemoveHandler).
          on('mouseup', mouseupHandler);
      };
      var getOrCrt = () : ColResizeHandle => {
        if (handleIndex < this.colResizeHandles.length) {
          return this.colResizeHandles[handleIndex];
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
        }, [util.createElement('div', {
          attrs : { 'class' : '${prefix}-v-resize-line' },
          style : {
            position : 'absolute',
            left : handleStyle.offset + 'px', top : '0px', width : '0px',
            borderLeftWidth : handleStyle.lineWidth + 'px' }
        })]) };
        this.frame.appendChild(handle.$el);
        this.colResizeHandles.push(handle);
        return handle;
      };
      var handleStyle = {
        offset : 3,
        lineWidth : 1,
        cursor : 'ew-resize',
        backgroundColor : 'rgba(0,0,0,0)'
      };
      var handleIndex = 0;
      var tableModel = this.model;
      var rbRect = renderParams.rects[RB_INDEX];
      var clientWidth = rbRect.left + rbRect.width;
      var clientHeight = rbRect.top + rbRect.height;
      this.tables.forEach( (table, i) => {
        if (table.row == 0) {
          // header
          var rect = renderParams.rects[i];
          var tableState = table.tableState;
          var left = tableState.left + rect.left -
            handleStyle.offset - handleStyle.lineWidth;
          var height = rect.height;
          for (var col = tableState.minCol; col <= tableState.maxCol;
              col += 1, handleIndex += 1) {
            var handle = getOrCrt();
            left += tableModel.getCellWidthAt(col);
            if (left > rect.left + rect.width) {
              break;
            }
            if (!this.model.isColumnResizableAt(col) ) {
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
      for (; handleIndex < this.colResizeHandles.length; handleIndex += 1) {
        util.set(this.colResizeHandles[handleIndex].$el, {
          style : { display : 'none', left : '0px', height : '0px' } });
      }
    }
    public render(visibleCell? : { row : number, col : number },
        cellStyleOnly? : boolean) {

      var renderParams = this.getRenderParams();

      var ltRect = renderParams.rects[LT_INDEX];
      var rbRect = renderParams.rects[RB_INDEX];

      var viewWidth = renderParams.width - ltRect.width;
      var viewHeight = renderParams.height - ltRect.height;

      // check if scrollbar shown.
      var barSize = this.measureBarSize();
      var vBarShown = renderParams.scrWidth >
        viewWidth - rbRect.width - barSize.width;
      var hBarShown = renderParams.scrHeight >
        viewHeight - rbRect.height - barSize.height;

      util.extend(this.hScr.style, {
        width : renderParams.scrWidth + 'px', height : '1px' });
      util.extend(this.hViewPane.style, {
        left : ltRect.width + 'px', top : ltRect.height + 'px',
        width : (viewWidth - rbRect.width -
          (hBarShown? barSize.width : 0) ) + 'px',
        height : viewHeight + 'px' });

      util.extend(this.vScr.style, {
        width : '1px', height : renderParams.scrHeight + 'px' });
      util.extend(this.vViewPane.style, {
        left : ltRect.width + 'px', top : ltRect.height + 'px',
        width : viewWidth + 'px',
        height : (viewHeight - rbRect.height -
          (vBarShown? barSize.height : 0) ) + 'px' });

      var hViewPane = this.hViewPane;
      var vViewPane = this.vViewPane;
      var barWidth = vViewPane.offsetWidth - vViewPane.clientWidth;
      var barHeight = hViewPane.offsetHeight - hViewPane.clientHeight;

      this.tables.forEach( (table, i) => {
        var rect = renderParams.rects[i];
        if (rbRect.left + rbRect.width + barWidth > renderParams.width) {
          if (table.col == 1) {
            if (rect.left + rect.width > rbRect.left - barWidth) {
              rect.width = Math.max(0, rbRect.left - barWidth - rect.left);
            }
          }
          if (table.col == 2) {
            rect.left -= barWidth;
          }
        }
        if (rbRect.top + rbRect.height + barHeight > renderParams.height) {
          if (table.row == 1) {
            if (rect.top + rect.height > rbRect.top - barHeight) {
              rect.height = Math.max(0, rbRect.top - barHeight - rect.top);
            }
          }
          if (table.row == 2) {
            rect.top -= barHeight;
          }
        }
      });

      if (visibleCell) {
        this.makeVisible(renderParams, visibleCell.row, visibleCell.col);
      }

      this.tables.forEach( (table, i) => {
        var rect = renderParams.rects[i];
        if (table.col == 1) {
          table.left = -(renderParams.scrWidth > hViewPane.clientWidth?
                util.translate(hViewPane.scrollLeft,
                0, renderParams.scrWidth - hViewPane.clientWidth,
                ltRect.width,
                ltRect.width +
                  renderParams.viewWidth - hViewPane.clientWidth,
                'table.left') : ltRect.width);
        }
        if (table.row == 1) {
          table.top = -(renderParams.scrHeight > vViewPane.clientHeight?
                util.translate(vViewPane.scrollTop,
                0, renderParams.scrHeight - vViewPane.clientHeight,
                ltRect.height,
                ltRect.height +
                  renderParams.viewHeight - vViewPane.clientHeight,
                'table.top') : ltRect.height);
        }
        if (table.col == 2) {
          table.left = -(ltRect.width + renderParams.viewWidth);
        }
        if (table.row == 2) {
          table.top = -(ltRect.height + renderParams.viewHeight);
        }

        table.model = this.model;
        util.extend(table.$el.style, {
          left : rect.left + 'px', top : rect.top + 'px',
          width : rect.width + 'px', height : rect.height + 'px' });
        table.render(!!cellStyleOnly);

      });

      if (this.editor.cell != null && !cellStyleOnly) {
        this.editor.beginEdit(this.editor.cell.row, this.editor.cell.col);
      }

      // lock lines.
      ( () => {
        while (this.lockLines.length < 4) {
          var line = util.createElement('div', {
            style : { position : 'absolute' } });
          this.frame.appendChild(line);
          this.lockLines.push(line);
        }
        var width = renderParams.width - barWidth;
        var height = renderParams.height - barHeight;
        // top
        util.set(this.lockLines[0], {
          attrs :{ 'class' : '${prefix}-h-lock-line' },
          style : {
            display : this.model.getLockTop() == 0? 'none' : '', left : '0px',
            top : (ltRect.height - 1) + 'px', width : width + 'px'
          } });
        // left
        util.set(this.lockLines[1], {
          attrs :{ 'class' : '${prefix}-v-lock-line' },
          style : {
            display : this.model.getLockLeft() == 0? 'none' : '', top : '0px',
            left : (ltRect.width - 1) + 'px', height : height + 'px'
          } });
        // bottom
        util.set(this.lockLines[2], {
          attrs :{ 'class' : '${prefix}-h-lock-line' },
          style : {
            display : this.model.getLockBottom() == 0? 'none' : '', left : '0px',
            top : (height - rbRect.height - 1) + 'px', width : width + 'px'
          } });
        // right
        util.set(this.lockLines[3], {
          attrs :{ 'class' : '${prefix}-v-lock-line' },
          style : {
            display : this.model.getLockRight() == 0? 'none' : '', top : '0px',
            left : (width - rbRect.width - 1) + 'px', height : height + 'px'
          } });
      } )();

      // resize handles.
      if (this.model.getLockTop() > 0) {
        this.renderColumnResizeHandlers(renderParams);
      }

      this.trigger('rendered', {
        tableStates : this.tables.map(function(table) {
          return table.tableState;
        })
      } );
    }

    private createInternalEditor() : InternalEditor {
      var table = this;
      var valuecommitHandler = function(event : any, detail : any) {
        if (editor.cell && detail.row == editor.cell.row &&
            detail.col == editor.cell.col) {
          // still editing after lost focus.
          // then, force end edit.
          editor.endEdit();
          table.invalidate();
        }
      };
      var editor : InternalEditor = {
        impl : null,
        cell : null,
        beginEdit : function(row, col, makeVisible) {
          if (this.cell && !(this.cell.row == row && this.cell.col == col) ) {
            // current editing cell changed.
            this.endEdit();
          }
          if (makeVisible) {
            table.render({ row : row, col : col });
          }
          this.cell = { row : row, col : col };
          var target = table.getTargetTable(row, col);
          var index = target.tableState.indexById[util.getCellId(row, col)];
          if (index) {
            var td = target.tbody.children[index.trIndex].children[index.tdIndex];
            this.impl = td.renderer.beginEdit(table.model.getCellAt(row, col) );
            this.impl.focus();
            table.model.on('valuecommit', valuecommitHandler);
          }
        },
        endEdit : function() {
          if (this.impl != null) {
            table.model.off('valuecommit', valuecommitHandler);
            var endState = this.impl.endEdit();
            if (endState && !(endState.oldValue === endState.newValue) ) {
              table.model.trigger('valuechange', {
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
      return editor;
    }

    public $el = this.frame;
    public forEachCells(callback : any) {
      for (var t = 0; t < this.tables.length; t += 1) {
        var rows = this.tables[t].tbody.children || [];
        for (var r = 0; r < rows.length; r += 1) {
          var cells = rows[r].children || [];
          for (var c = 0; c < cells.length; c += 1) {
            if (callback(cells[c]) === true) {
              return;
            }
          }
        }
      }
    }
    public editor = this.createInternalEditor();
    public model : TableModel = null;
  }

}
