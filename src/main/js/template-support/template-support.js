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
      var cell;
      for (var col = 0; col < tableModel.getColumnCount(); col += cell.colSpan) {
        cell = tableModel.getCellAt(0, col);
        var orderedCol = tableModel.getOrderedColumnIndexAt(col);
        if (col == table.lockColumn) {
          columns.push({ type : 'lockColumn', label : messages.LOCK_COLUMN,
            hidden : !table.enableLockColumn });
        }
        columns.push({ type : 'column', label : tableModel.getValueAt(0, col),
          hidden : !!tableModel.hiddenColumns[orderedCol],
          col : orderedCol, colSpan : cell.colSpan });
      }
      return columns;
    }();

    var columnItems = columns.map(function(column) {
      return $c.util.createElement('div', {
          attrs : { 'class' : $c.classNamePrefix + 'listitem' },
          style : { color : column.type == 'lockColumn'? 'blue' : '' },
          on : { mousedown : function(event) {
            event.preventDefault();
            var mousemoveHandler = function(event) {
              if (!started && Math.abs(event.pageY - dragPoint.y) > 4) {
                started = true;
              }
              if (!started) {
                return;
              }
              var listitem = $c.util.closest(event.target,
                  { className : $c.classNamePrefix + 'listitem', root : dialog.$el });
              indexTo = $c.util.indexOf(listitem);
              if (indexTo != -1 && indexFrom != indexTo) {
                var top = listitem.offsetTop - 2 -
                  listitem.parentNode.scrollTop;
                bar.style.display = '';
                bar.style.top = top + 'px';
              } else {
                bar.style.display = 'none';
              }
            };
            var mouseupHandler = function(event) {
              $c.util.$(document).off('mousemove', mousemoveHandler).
                off('mouseup', mouseupHandler);
              lastTarget = target;
              dialog.$el.removeChild(bar);
              if (indexTo != -1 && indexFrom != indexTo) {
                var parent = target.parentNode;
                var ref = parent.childNodes[indexTo];
                columns = $c.util.moveSublist(columns, indexFrom, 1, indexTo);
                parent.removeChild(target);
                parent.insertBefore(target, ref);
              }
            };
            $c.util.$(document).on('mousemove', mousemoveHandler).
              on('mouseup', mouseupHandler);
            var target = event.currentTarget;
            var bar = $c.util.createElement('div', {
              attrs : { 'class' : $c.classNamePrefix + 'column-edit-bar' },
              style : { position : 'absolute', left : '0px',
                display : 'none', width : target.offsetWidth + 'px' }
            });
            var indexFrom = $c.util.indexOf(target);
            var indexTo = -1;
            var started = false;
            var dragPoint = { x : event.pageX, y : event.pageY };
            dialog.$el.appendChild(bar);
            if (lastTarget != null) {
              $c.util.$(lastTarget).removeClass($c.classNamePrefix + 'listitem-selected');
            }
            $c.util.$(target).addClass($c.classNamePrefix + 'listitem-selected');
          }}
        },[
        $c.util.createElement('input',{
          attrs : { type : 'checkbox' },
          props : { checked : !column.hidden },
          style : { verticalAlign : 'middle' },
          on:{ click : function(event) {
            var target = event.currentTarget;
            var index = $c.util.indexOf(target.parentNode);
            columns[index].hidden = !target.checked;
          }}
        }),
        $c.util.createElement('span',{
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
              lockColumn = col;
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
          style.className += ' ' + $c.classNamePrefix + 'header';
          style.editable = false;
        } else {
          var itemIndex = this.getItemIndexAt(row, col);
          row -= headLength;
          style.className += ' ' + $c.classNamePrefix +
            (itemIndex.row % 2 == 0? 'even' : 'odd');
          if (style.editable === false) {
            style.className += ' ' + $c.classNamePrefix + 'disabled';
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
          if (filters[dataField][item[dataField] || '']) {
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

}(comfortable);
