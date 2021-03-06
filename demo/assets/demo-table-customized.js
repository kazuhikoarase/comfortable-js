//
// table customized list
//

var tableCustomized = function(targetId) {

  var $c = comfortable;

  var numCells = 10000;
  var headers = [ {},{} ];
  var footers = [ {} ];
  var columns = [];
  var items = [];
  for (var i = 0; i < numCells; i += 1) {
    columns.push({});
    items.push({});
  }

  headers[0][0] = { label : numCells + ' x ' + numCells + ' cells' };
  headers[0][4] = { label : 'Number' };
  columns[4].factory = $c.createDefaultCellRendererFactory({ dataType : 'number' });

  var table = $c.createTable();

  table.$el.style.width = '900px';
  table.$el.style.height  = '400px';
  table.$el.setAttribute('class', 'my-table');


  table.model = $c.util.extend(table.model, {
    getLockTop : function() { return headers.length; },
    getLockBottom : function() { return footers.length; },
    lockLeft : 2,
    lockRight : 1,
    getLockLeft : function() { return this.lockLeft; },
    setLockLeft : function(lockLeft) { this.lockLeft = lockLeft; },
    getLockRight : function() { return this.lockRight; },
    setLockRight : function(lockLeft) { this.lockRight = lockRight; },
    cellWidth : { 4 : 60 },
    cellHeight : { 8 : 50 },
    columnIndices : columns.map(function(c, i) { return i; }),
    setValueAt : function(row, col, value) {
      col = this.columnIndices[col];
      if (row < headers.length) {
      } else if (row >= headers.length + items.length) {
      } else {
        row -= headers.length;
        items[row][col] = value;
      }
    },
    //
    getRowCount : function() {
      return headers.length + items.length + footers.length; },
    getColumnCount : function() { return columns.length; },
    getLineRowAt : function(row) { return row % 2; },
    getLineRowCountAt : function(row) { return 2; },
    getCellWidthAt : function(col) {
      col = this.columnIndices[col];
      return this.cellWidth[col] || this.defaultCellWidth;
    },
    getCellHeightAt : function(row) {
      return this.cellHeight[row] || this.defaultCellHeight;
    },
    getCellRendererFactoryAt : function(row, col) {
      col = this.columnIndices[col];
      if (row < headers.length) {
        return this.defaultCellRendererFactory;
      } else if (row >= headers.length + items.length) {
        return this.defaultCellRendererFactory;
      } else {
        return columns[col].factory || this.defaultCellRendererFactory;
      }
    },
    getCellStyleAt : function(row, col) {
      col = this.columnIndices[col];
      var style = {};
      if (row < headers.length) {
        if (row == 0 && col == 0) {
          style.rowSpan = 2;
          style.colSpan = 2;
        }
        style.className = 'header';
        style.editable = false;
      } else if (row >= headers.length + items.length) {
        style.className = 'footer';
        style.editable = false;
      } else {
        row -= headers.length;
        style.className = '';
        if (row % 2 == 0) {
          style.className += ' even';
        }
        if (row == 0 && col == 2) {
          style.rowSpan = 3;
          style.colSpan = 2;
        }
        if (row == 6 && col == 5) {
          style.rowSpan = 2;
          style.colSpan = 2,
          style.editable = false;
        }
      }
      if (style.editable === false) {
        style.className += ' readonly';
      }
      return style;
    },
    getValueAt : function(row, col) {
      col = this.columnIndices[col];
      if (row < headers.length) {
        return headers[row][col]?
            headers[row][col].label || '' : '';
      } else if (row >= headers.length + items.length) {
        return '*';
      } else {
        row -= headers.length;
        if (typeof items[row][col] != 'undefined') {
          return items[row][col];
        } else if (row == 0 && col == 2) {
          return 'spaned';
        } else if (row == 6 && col == 5) {
          return 'not editable';
        } else if (col == 4) {
          return '' + row;
        } else {
          return '[' + row + ',' + col + ']';
        }
      }
    }
  });

  table.model.on('valuechange', function(event, detail) {
    this.setValueAt(detail.row, detail.col, detail.newValue);
  }).on('cellsizechange', function(event, detail) {
    if (typeof detail.col == 'number') {
      this.cellWidth[this.columnIndices[detail.col]] = detail.cellWidth;
    }
  }).on('columndragged', function(event, detail) {
    this.columnIndices = $c.util.moveSublist(
        this.columnIndices, detail.colFrom, detail.colSpan, detail.colTo);
    if (detail.colFrom < table.model.getLockLeft() && table.model.getLockLeft() <= detail.colTo) {
      table.setLockLeft(table.model.getLockLeft() - detail.colSpan);
    } else if (detail.colTo < table.model.getLockLeft() && table.model.getLockLeft() <= detail.colFrom) {
      table.setLockLeft(table.model.getLockLeft() + detail.colSpan);
    }
  });

  table.invalidate();

  document.getElementById(targetId).appendChild(table.$el);

};
