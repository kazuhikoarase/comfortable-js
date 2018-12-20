//
// comfortable - default-table-model
//
// Copyright (c) 2018 Kazuhiko Arase
//
// URL: https://github.com/kazuhikoarase/comfortable-js/
//
// Licensed under the MIT license:
//  http://www.opensource.org/licenses/mit-license.php
//

namespace comfortable {

  'use strict';

  export class DefaultTableModel extends EventTargetImpl implements TableModel {
    public defaultCellWidth = 100;
    public defaultCellHeight = 28;
    public defaultCellStyle = { rowSpan : 1, colSpan : 1, editable : true };
    public defaultCellRendererFactory = createDefaultCellRendererFactory();
    public maxRowSpan = 8;
    public maxColSpan = 8;
    public minCellWidth = 8;
    public getRowCount() { return 1E5; }
    public getColumnCount() { return 1E5; }
    public getLineRowAt(row : number) { return row; }
    public getLineRowCountAt(row : number) { return this.getRowCount(); }
    public getValueAt(row : number, col : number) { return row + ',' + col; }
    public getCellStyleAt(row : number, col : number) { return {}; }
    public getCellRendererFactoryAt(row : number, col : number) { return this.defaultCellRendererFactory; }
    public getCellWidthAt(col : number) { return this.defaultCellWidth; }
    public getCellHeightAt(row : number) { return this.defaultCellHeight; }
    public getCellAt(row : number, col : number) {
      return util.extend({
          row : row, col : col, value : this.getValueAt(row, col) },
          this.defaultCellStyle, this.getCellStyleAt(row, col) );
    }
    public checkSpaned(row : number, col : number) {
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
    }
    public isColumnResizableAt(col : number) { return true; }
    public isColumnDraggableAt(col : number) { return true; }
  }

}
