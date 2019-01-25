
'use strict';

window.addEventListener('load', function(event) {

  var list = function(size) {
    var items = [];
    for (var i = 0; i < size; i += 1) {
      items.push({});
    }
    return items;
  };

  var width = 200;
  var height = 150;

  var createTable = function(numRows, numCols,
        lockTop, lockBottom, lockLeft, lockRight) {
    var table = comfortable.fromTemplate({
      thead: list(lockTop).map(function() {
        return list(numCols).map(function(cell, i) {
          cell.label = 'C#' + i;
          cell.width = 50;
          cell.dataField = 'field' + i;
          cell.backgroundColor = '#ccccff';
          return cell;
        })
      }),
      tfoot: list(lockBottom).map(function() {
        return list(numCols).map(function(cell, i) {
          cell.label = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
          return cell;
        })
      })
    });
    table.model.items = list(numRows).map(function(item, row) {
      list(numCols).forEach(function(_, col) {
        item['field' + col] = row + ':' + col +
          '@ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      });
      return item;
    });
    table.model.setLockLeft(lockLeft);
    table.model.setLockRight(lockRight);
    table.invalidate();
    table.$el.style.float = 'left';
    table.$el.style.marginLeft = '4px';
    table.$el.style.marginTop = '4px';
    table.$el.style.width = width + 'px';
    table.$el.style.height = height + 'px';
    table.$el.setAttribute('class', 'demo-tbl');
    return table;
  };

  var breakFloat = function() {
    var br = document.createElement('br');
    br.style.clear = 'both';
    document.body.appendChild(br);
  };

  [0, 3, 10].forEach(function(numRows) {
    [0, 2, 10].forEach(function(numCols) {
      var lockTop = 1;
      var lockBottom = 1;
      var lockLeft = 1;
      var lockRight = 1;
      var table = createTable(numRows, numCols,
          lockTop, lockBottom, lockLeft, lockRight);
      document.body.appendChild(table.$el);
    });
    breakFloat();
  });

  [0, 1].forEach(function(lockBottom) {
    [0, 1].forEach(function(lockRight) {
      [1].forEach(function(lockTop) {
        [0, 1].forEach(function(lockLeft) {
          var numRows = 10;
          var numCols = 10;
          var table = createTable(numRows, numCols,
              lockTop, lockBottom, lockLeft, lockRight);
          document.body.appendChild(table.$el);
        });
      });
    });
    breakFloat();
  });

});
