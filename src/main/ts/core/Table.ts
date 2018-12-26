/*!
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

  'use strict';

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
      for (var i = 0; i < 4; i += 1) {
        tables.push(new InternalTableImpl() );
      }

      tables.forEach( (table, i) => {
        table.row = ~~(i / 2);
        table.col = i % 2;
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
              if (td.row < this.getLockTop() &&
                  this.model.isColumnDraggableAt(td.col) &&
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

    private scr = util.createElement('div', {
        style : { position : 'absolute' } });

    private viewPane = util.createElement('div', {
        style : { position : 'absolute', overflow : 'auto' },
        on : { scroll : (event) => { this.render(); } }
      }, [this.scr]);

    private frame = util.createElement('div', {
        style : { position : 'relative', overflow : 'hidden',
          width : '400px', height : '200px' },
        on : {
          mousedown : (event) => {
            if (util.closest(event.target, { $el : this.viewPane, root : this.frame }) ) {
              this.editor.endEdit();
              this.render();
            }
          },
          keydown : (event) => {
            switch(event.keyCode) {
            case 9 : // Tab
              event.preventDefault();
              this.move({ row : 0, col : event.shiftKey? -1 : 1 });
              break;
            case 13 : // Enter
              event.preventDefault();
              this.move({ row : event.shiftKey? -1 : 1, col : 0 });
              break;
            }
          },
          wheel : (event) => {
            this.viewPane.scrollLeft += event.deltaX;
            this.viewPane.scrollTop += event.deltaY;
          }
        }
      }, [this.viewPane].concat(
          this.tables.map(function(table) { return table.$el; }) ) );

    private lockLines : HTMLElement[] = [];
    private colResizeHandles : ColResizeHandle[] = [];

    private getCellRect(row : number, col : number) {
      var tableModel = this.tables[3].model;
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
      var cornerRect = renderParams.rects[0];
      var scrollRect = renderParams.rects[3];
      var delta = { left : 0, top : 0 };
      var cellRect = this.getCellRect(row, col);
      var left = cellRect.left + this.tables[3].left;
      var top = cellRect.top + this.tables[3].top;
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
        left : renderParams.viewWidth > this.viewPane.clientWidth?
            util.translate(-this.tables[3].left + delta.left,
            cornerRect.width,
            cornerRect.width + renderParams.viewWidth - this.viewPane.clientWidth,
            0, renderParams.scrWidth - this.viewPane.clientWidth, 'scroll.left') : 0,
        top : renderParams.viewHeight > this.viewPane.clientHeight?
            util.translate(-this.tables[3].top + delta.top,
            cornerRect.height,
            cornerRect.height + renderParams.viewHeight - this.viewPane.clientHeight,
            0, renderParams.scrHeight - this.viewPane.clientHeight, 'scroll.top') : 0
      };
      if (row >= this.getLockTop() ) {
        this.viewPane.scrollTop = scroll.top;
      }
      if (col >= this.getLockLeft() ) {
        this.viewPane.scrollLeft = scroll.left;
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
      var lockTop = this.getLockTop();
      var lockLeft = this.getLockLeft();
      if (!this.cellSizeCache ||
          this.cellSizeCache.rowCount != rowCount ||
          this.cellSizeCache.columnCount != columnCount ||
          this.cellSizeCache.lockTop != lockTop ||
          this.cellSizeCache.lockLeft != lockLeft ||
          this.cellSizeCache.width != width ||
          this.cellSizeCache.height != height) {
        var rowPos = [ 0, lockTop, rowCount ];
        var colPos = [ 0, lockLeft, columnCount ];
        var cw = colPos.slice(1).map(function() { return 0; });
        var ch = rowPos.slice(1).map(function() { return 0; });;
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
          rect.width = Math.max(0, Math.min(rect.width, width - rect.left) );
          rect.height = Math.max(0, Math.min(rect.height, height - rect.top) );
          return rect;
        });
        this.cellSizeCache = {
          viewWidth : cw[cw.length - 1],
          viewHeight : ch[ch.length - 1],
          rects : rects,
          rowCount : rowCount, columnCount : columnCount,
          lockTop : lockTop, lockLeft : lockLeft,
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
      return this.tables.filter( (table) => {
        return table.row == (row < this.getLockTop()? 0 : 1) &&
          table.col == (col < this.getLockLeft()? 0 : 1);
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
            cellWidth : Math.max(tableModel.minCellWidth, cellWidth + deltaX) });
          this.invalidate();
        };
        var mousemoveHandler = function(event : Event) {
          var deltaX = event.pageX - dragPoint.x;
          var cellWidth = tableModel.getCellWidthAt(handle.col);
          deltaX = Math.max(tableModel.minCellWidth, cellWidth + deltaX) - cellWidth;
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
            width : (scrollRect.left + scrollRect.width) + 'px',
            height : (scrollRect.top + scrollRect.height) + 'px'
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
        }, [util.createElement('div',{
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
      var scrollRect = renderParams.rects[3];
      this.tables.forEach( (table, i) => {
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
    public render(visibleCell? : { row : number, col : number }) {

      var renderParams = this.getRenderParams();
      var cornerRect = renderParams.rects[0];

      util.extend(this.scr.style, {
        width : renderParams.scrWidth + 'px',
        height : renderParams.scrHeight + 'px' });
      util.extend(this.viewPane.style, {
        left : cornerRect.width + 'px', top : cornerRect.height + 'px',
        width : (renderParams.width - cornerRect.width) + 'px',
        height : (renderParams.height - cornerRect.height) + 'px' });

      var viewPane = this.viewPane;
      var barWidth = viewPane.offsetWidth - viewPane.clientWidth;
      var barHeight = viewPane.offsetHeight - viewPane.clientHeight;

      this.tables.forEach( (table, i) => {
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

      this.tables.forEach( (table, i) => {
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
        table.model = this.model;
        util.extend(table.$el.style, {
          left : rect.left + 'px', top : rect.top + 'px',
          width : rect.width + 'px', height : rect.height + 'px' });
        table.render();

      });

      if (this.editor.cell != null) {
        this.editor.beginEdit(this.editor.cell.row, this.editor.cell.col);
      }

      // lock lines.
      ( () => {
        while (this.lockLines.length < 2) {
          var line = util.createElement('div', {
            style : { position : 'absolute' } });
          this.frame.appendChild(line);
          this.lockLines.push(line);
        }
        var width = 0;
        var height = 0;
        this.tables.forEach(function(table, i) {
          var rect = renderParams.rects[i];
          if (table.row == 0) { width += rect.width; }
          if (table.col == 0) { height += rect.height; }
        });
        // horizontal
        util.set(this.lockLines[0], {
          attrs :{ 'class' : '${prefix}-h-lock-line' },
          style : {
            display : this.getLockTop() == 0? 'none' : '', left : '0px',
            top : (cornerRect.height - 1) + 'px', width : width + 'px'
          } });
        // vertical
        util.set(this.lockLines[1], {
          attrs :{ 'class' : '${prefix}-v-lock-line' },
          style : {
            display : this.getLockLeft() == 0? 'none' : '', top : '0px',
            left : (cornerRect.width - 1) + 'px', height : height + 'px'
          } });
      } )();

      // resize handles.
      if (this.getLockTop() > 0) {
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
      return {
        impl : null,
        cell : null,
        beginEdit : function(row, col, makeVisible) {
          this.endEdit();
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
          }
        },
        endEdit : function() {
          if (this.impl != null) {
            var endState = this.impl.endEdit();
            if (endState) {
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
    }

    public $el = this.frame;
    public getLockTop() { return 0; }
    public getLockLeft() { return 0; }
    public forEachCells(callback : any) {
      this.tables.forEach(function(table) {
        (table.tbody.children || []).forEach(function(tr) {
          (tr.children || []).forEach(function(cell) {
            callback(<any>cell);
          });
        });
      });
    }
    public editor = this.createInternalEditor();
    public model : TableModel = null;
  }

}
