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

/// <reference path="UIEventTarget.ts" />

namespace comfortable {

  'use strict';

  export interface ElmCache {
    $el : HTMLElement;
    tableModel? : TableModel; 
    row? : number;
    col? : number;
    children? : ElmCache[];
    renderer? : TableCellRenderer;
    factory? : TableCellRendererFactory;
  }

  export interface TableState {
    left : number;
    top : number;
    width : number;
    height : number;
    minRow : number;
    maxRow : number;
    minCol : number;
    maxCol : number;
    indexById : { [id : string] : { trIndex : number, tdIndex : number} };
  }

  export interface OffsetCache {
    left : { [i : number] : number };
    top : { [i : number] : number };
  }

  export interface InternalTable {
    $el : HTMLElement;
    left : number;
    top : number;
    colgroup : ElmCache;
    tbody : ElmCache;
    row? : number;
    col? : number;
    model : TableModel;
    tableState : TableState;
    beforeCellSizeChangeHandler : EventListener;
    offsetCache : OffsetCache;
    calcCellPosition : (left : number, top : number) => {
      left : number, top : number, row : number, col : number};
    preRender : () => TableState;
    render : () => void;
  }

  var createTableState = function() : TableState {
    return {
      left : 0, top : 0, width : 0, height : 0,
      minRow : 0, maxRow : 0, minCol : 0, maxCol : 0,
      indexById : {}
    };
  }

  export class InternalTableImpl implements InternalTable {

    private _colgroup = util.createElement('colgroup');
    private _tbody = util.createElement('tbody');

    private table = util.createElement('table', {
        attrs : { cellspacing : '0' },
        style : {
          tableLayout : 'fixed', position : 'absolute', lineHeight : '1'
        }
      }, <HTMLElement[]>[ this._colgroup, this._tbody ]);
    private view = util.createElement('div', {
      style : { overflow : 'hidden', position : 'relative' },
      on : { scroll : (event) => {
         this.view.scrollLeft = 0;  this.view.scrollTop = 0; } }
    }, [ this.table ]);

    private getOrCrt(tagName : string, index : number,
        parent : ElmCache, init? : (elm : ElmCache) => void ) {
      if (parent.children && index < parent.children.length) {
        return parent.children[index];
      }
      if (!parent.children) {
        parent.children = [];
      }
      var elm : ElmCache = { $el : document.createElement(tagName) };
      if (init) {
        init(elm);
      }
      parent.$el.appendChild(elm.$el);
      parent.children.push(elm);
      return elm;
    }

    private getCellStyle(cell : TableCellStyle) : util.ElementOptions {
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
    }
    public $el = this.view;
    public colgroup : ElmCache = { $el : this._colgroup };
    public tbody : ElmCache = { $el : this._tbody };
    public left = 0;
    public top = 0;
    public model : TableModel = null;
    public tableState = createTableState();

    public offsetCache : OffsetCache = null;
    public beforeCellSizeChangeHandler : EventListener = null;
    public calcCellPosition(left : number, top : number) {

      var tableModel : TableModel = this.model;

      // offset cache
      if (this.beforeCellSizeChangeHandler == null) {
        this.beforeCellSizeChangeHandler = (event : Event, detail : any) => {
          // note: 'this' bind to inner-table's.
          this.offsetCache = null;
        };
      }
      tableModel.off('beforecellsizechange', this.beforeCellSizeChangeHandler);
      tableModel.on('beforecellsizechange', this.beforeCellSizeChangeHandler);
      this.offsetCache = this.offsetCache || { left : {}, top : {} };
      var prec = 1000;
      var offsetLeftCache : {[i : number] : number} = this.offsetCache.left;
      var offsetTopCache : {[i : number] : number} = this.offsetCache.top;
      var offsetLeft = 0;
      var offsetTop = 0;

      var rowCount = tableModel.getRowCount();
      var columnCount = tableModel.getColumnCount();
      var cellWidth = 0;
      var cellHeight = 0;
      var col = 0;
      var row = 0;

      var leftCache : { col : number, offset : number } = null;
      var topCache : { row : number, offset : number } = null;
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
    }

    public preRender() {

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
        this.getOrCrt('tr', trIndex, this.tbody).
          $el.style.height = cellHeight + 'px';
        tableState.height += cellHeight;
        top += cellHeight;
        row += 1;
        trIndex += 1;
      }
      for (;trIndex < this._tbody.childNodes.length; trIndex += 1) {
        (<HTMLElement>this._tbody.childNodes[trIndex]).style.height = '0px';
      }
      tableState.maxRow = Math.min(rowCount, tableState.minRow +
          (this.tbody.children? this.tbody.children.length : 0) ) - 1;

      var left = cellPos.left;
      var col = cellPos.col;
      var colIndex = 0;
      while (col < columnCount && left < width) {
        var cellWidth = this.model.getCellWidthAt(col);
        this.getOrCrt('col', colIndex, this.colgroup).
          $el.style.width = cellWidth + 'px';
        tableState.width += cellWidth;
        left += cellWidth;
        col += 1;
        colIndex += 1;
      }
      for (;colIndex < this._colgroup.childNodes.length; colIndex += 1) {
        (<HTMLElement>this._colgroup.childNodes[colIndex]).style.width = '0px';
      }
      tableState.maxCol = Math.min(columnCount, tableState.minCol +
          (this.colgroup.children? this.colgroup.children.length : 0) ) - 1;

      return tableState;
    }

    public render() {

      var tableState = this.preRender();
      var spaned : { [id : string] : boolean } = {};

      var setSpaned = function(row : number, col : number,
          td : HTMLTableDataCellElement, cell : TableCellStyle) {
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

      var tableModel : TableModel = this.model;
      var initCell = function(td : ElmCache) {
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

          var td = this.getOrCrt('td', tdIndex, tr, initCell);
          td.row = row;
          td.col = col;

          var cell = tableModel.getCellAt(row, col);
          setSpaned(row, col, <HTMLTableDataCellElement>td.$el, cell);

          var factory = tableModel.getCellRendererFactoryAt(row, col);
          if (td.factory != factory) {
            td.factory = factory;
            if (td.renderer) {
              td.renderer.dispose();
            }
            td.$el.innerHTML = '';
            td.renderer = td.factory(<TdWrapper>td);
          }

          util.set(td.$el, this.getCellStyle(cell) );
          td.renderer.render(cell);

          tdIndex += 1;
        }
      }

      util.extend(this.table.style, {
        left : tableState.left + 'px',
        top : tableState.top + 'px',
        width : tableState.width + 'px',
        height : tableState.height + 'px'
      });

      this.tableState = tableState;
    }
  }
}