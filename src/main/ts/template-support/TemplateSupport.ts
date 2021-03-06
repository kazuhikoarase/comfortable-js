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

namespace comfortable {

  var createDefaultOrderedColumnIndices = function(tableModel : TableModel) {
    var orderedColumnIndices : number[] = [];
    var columnCount = tableModel.getColumnCount();
    for (var i = 0; i < columnCount; i += 1) {
      orderedColumnIndices.push(i);
    }
    return orderedColumnIndices;
  };

  var showColumnEditDialog = function(table : TemplateTable) {

    var messages = i18n.getMessages();
    var tableModel = <TemplateTableModel>table.model;
    var lockLeft : number = (<any>tableModel).lockLeft;

    var ColumnType = { LOCK_COLUMN : 'lockColumn', COLUMN : 'column' };

    interface ColumnItem {
      type : string;
      label : string;
      hidden : boolean;
      col? : number;
      colSpan? : number;
    }

    var columns = function() {
      var columns : ColumnItem[] = [];
      var columnCount = tableModel.getColumnCount();
      for (var col = 0; col <= columnCount;) {
        if (col == lockLeft) {
          columns.push({ type : ColumnType.LOCK_COLUMN,
            label : messages.LOCK_COLUMN,
            hidden : !tableModel.enableLockColumn });
        }
        if (col < columnCount) {
          var cell = tableModel.getCellAt(0, col);
          var style : any = tableModel.getCellStyleAt(0, col);
          var desc = style.description;
          var label = typeof desc == 'function'? desc(tableModel) : 
            typeof desc == 'undefined'? tableModel.getValueAt(0, col) : desc;
          var orderedCol = tableModel.getOrderedColumnIndexAt(col);
          columns.push({ type : ColumnType.COLUMN,
            label : label,
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
      return util.createElement('div', {
          attrs : { 'class' : '${prefix}-listitem ${prefix}-clickable' +
            (column.type == ColumnType.LOCK_COLUMN?
                ' ${prefix}-column-edit-lock-column' : '') },
          on : { mousedown : function(event) {
            event.preventDefault();
            if (event.which != 1) {
              return;
            }
            columnItems.forEach(function(elm) {
              util.$(elm).removeClass('${prefix}-clickable');
            });
            var mousemoveHandler = function(event : Event) {
              if (!started && Math.abs(event.pageY - dragPoint.y) > 4) {
                started = true;
              }
              if (!started) {
                return;
              }
              var listitem = util.closest(event.target,
                  { className : '${prefix}-listitem', root : dialog.$el });
              if (!listitem) {
                if (!scroll.active) {
                  scroll.active = true;
                  scroll.event = event;
                  var scrollTarget = dialog.$el.firstChild;
                  var off = util.offset(scrollTarget);
                  var top : number = off.top + scrollTarget.scrollTop;
                  var scrollHandler = function() {
                    var pageY = scroll.event.pageY;
                    var delta = 0;
                    if (pageY < top) {
                      delta = -scroll.delta;
                    } else if (top + scrollTarget.offsetHeight < pageY) {
                      delta = scroll.delta;
                    }
                    if (delta != 0) {
                      scrollTarget.scrollTop += delta;
                      bar.style.display = 'none';
                    }
                    if (scroll.active) {
                      window.setTimeout(scrollHandler, scroll.timeout);
                    }
                  };
                  scrollHandler();
                } else {
                  scroll.event = event;
                }
                return;
              }
              indexTo = columnItems.indexOf(listitem);
              var off = util.offset(listitem);
              var top = listitem.offsetTop - 2 -
                    (<HTMLElement>listitem.parentNode).scrollTop;
              if (off.top + listitem.offsetHeight / 2 < event.pageY) {
                indexTo += 1;
                top += listitem.offsetHeight;
              }
              bar.style.display = '';
              bar.style.top = top + 'px';
              scroll.active = false;
            };
            var mouseupHandler = function(event : Event) {
              scroll.active = false;
              util.$(document).off('mousemove', mousemoveHandler).
                off('mouseup', mouseupHandler);
              columnItems.forEach(function(elm) {
                util.$(elm).addClass('${prefix}-clickable');
              });
              lastTarget = target;
              dialog.$el.removeChild(bar);
              if (indexTo != -1 && indexFrom != indexTo) {
                var parent = target.parentNode;
                var ref = columnItems[indexTo];
                columns = util.moveSublist(columns, indexFrom, 1, indexTo);
                columnItems = util.moveSublist(columnItems, indexFrom, 1, indexTo);
                parent.removeChild(target);
                if (ref) {
                  parent.insertBefore(target, ref);
                } else {
                  parent.appendChild(target);
                }
              }
            };
            util.$(document).on('mousemove', mousemoveHandler).
              on('mouseup', mouseupHandler);
            var target = event.currentTarget;
            var bar = util.createElement('div', {
              attrs : { 'class' : '${prefix}-column-edit-bar' },
              style : { position : 'absolute', left : '0px',
                display : 'none', width : target.offsetWidth + 'px' }
            });
            var indexFrom = columnItems.indexOf(target);
            var indexTo = -1;
            var started = false;
            var scroll = {
              active : false,
              event : null as Event,
              delta : 16,
              timeout : 100
            };
            var dragPoint = { x : event.pageX, y : event.pageY };
            dialog.$el.appendChild(bar);
            if (lastTarget != null) {
              util.$(lastTarget).removeClass('${prefix}-selected');
            }
            util.$(target).addClass('${prefix}-selected');
          }}
        },[
        util.createElement('input', {
          attrs : { type : 'checkbox' },
          props : { checked : !column.hidden },
          style : { verticalAlign : 'middle' },
          on:{ click : function(event) {
            var target = event.currentTarget;
            var index = util.indexOf(target.parentNode);
            columns[index].hidden = !target.checked;
          }}
        }),
        util.createElement('span', {
          style : { verticalAlign : 'middle' },
          props : { textContent : column.label }
        }) ]);
    });

    var lastTarget : HTMLElement = null;

    var dialog =  util.extend(ui.createDialog([
      // columns
      util.createElement('div',
        { style : { overflow : 'auto',  height : '200px' } }, columnItems),
      // buttons
      util.createElement('div', { style : { float : 'right'} }, [
        ui.createButton(messages.RESET, function() {
          dialog.dispose();
          tableModel.orderedColumnIndices = null;
          tableModel.hiddenColumns = {};
          tableModel.trigger('beforecellsizechange');
          tableModel.setLockLeft(tableModel.defaultLockColumn);
          tableModel.enableLockColumn = true;
          table.invalidate();
        }),
        ui.createButton(messages.APPLY, function() {
          dialog.dispose();
          var orderedColumnIndices : number[] = [];
          var hiddenColumns : { [ orderedCol : number ] : boolean } = {};
          var lockColumn = 0;
          var enableLockColumn = true;
          columns.forEach(function(column) {
            if (column.type == 'column') {
              for (var i = 0; i < column.colSpan; i += 1) {
                orderedColumnIndices.push(i + column.col);
                if (column.hidden) {
                  hiddenColumns[i + column.col] = true;
                }
              }
            } else if (column.type == ColumnType.LOCK_COLUMN) {
              var col = orderedColumnIndices.length;
              lockColumn = col < columns.length - 1? col : 0;
              enableLockColumn = !column.hidden;
            }
          });
          tableModel.orderedColumnIndices = orderedColumnIndices;
          tableModel.hiddenColumns = hiddenColumns;
          tableModel.trigger('beforecellsizechange');
          tableModel.setLockLeft(lockColumn);
          tableModel.enableLockColumn = enableLockColumn;
          table.invalidate();
        }),
        ui.createButton(messages.CANCEL, function() {
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

  var enableHover = function(table : Table) {
    var tableModel = <TemplateTableModel>table.model;
    var setHoverRowImpl = function(row : number, hover : boolean) {
      table.forEachCells(function(td) {
        var itemIndex = tableModel.getItemIndexAt(td.row, td.col);
        if (itemIndex.row != row) {
          // skip
          return;
        }
        util.$(td.$el).addClass('${prefix}-item-hover', !hover);
        //var cs = null;
        for (var i = 0; i < td.$el.childNodes.length; i += 1) {
          var child = td.$el.childNodes[i];
          /*
          if (child.tagName == 'INPUT' || child.tagName == 'SELECT') {
            if (cs == null) {
              cs = window.getComputedStyle(td.$el, null);
            }
            child.style.backgroundColor = cs.backgroundColor;
          }
          */
        }
        return false;
      });
    };

    var setHoverRow = function(hoverRow : number) {
      if (tableModel.hoverRow != hoverRow) {
        if (tableModel.hoverRow != -1) {
          setHoverRowImpl(tableModel.hoverRow, false);
        }
        tableModel.hoverRow = hoverRow;
        if (tableModel.hoverRow != -1) {
          setHoverRowImpl(tableModel.hoverRow, true);
        }
      }
    };

    return table.on('mouseover', function(event, detail) {
        setHoverRow(detail.itemIndex.row);
      }).
      on('mouseout', function(event, detail) {
        setHoverRow(-1);
      });
  };

  var enableRowSelect = function(table : Table) {
    return table.on('click', function(event, detail) {
      if (detail.itemIndex.row != -1) {
        var lastSelectedRows : { [row : string] : boolean } = {};
        for (var k in this.model.selectedRows) {
          lastSelectedRows[k] = true;
        }
        if (this.model.multipleRowsSelectable && detail.originalEvent.ctrlKey) {
          // ctrl + click : toggle selection
          if (!this.model.selectedRows[detail.itemIndex.row]) {
            this.model.selectedRows[detail.itemIndex.row] = true;
          } else {
            delete this.model.selectedRows[detail.itemIndex.row];
          }
        } else {
          this.model.selectedRows = {};
          this.model.selectedRows[detail.itemIndex.row] = true;
        }

        // check changed.
        var changed = false;
        for (var k in this.model.selectedRows) {
          if (lastSelectedRows[k]) {
            delete lastSelectedRows[k];
          } else {
            changed = true;
            break;
          }
        }
        for (var k in lastSelectedRows) {
          changed = true;
          break;
        }

        if (changed) {
          this.render(null, true);
          this.model.trigger('rowselectionchange',
              { selectedRows : this.model.selectedRows, reason : 'click' });
        }
      }
    });
  };

  var setupDefaults = function(template : TableTemplate) {

    // body => head,foot
    var inheritFromBody = [ 'dataType',
      'options', 'labelField', 'valueField',
      'decimalDigits', 'booleanValues' ];
    var bodyDataCells : any = {};
    template.tbody.forEach(function(tr) {
      tr.forEach(function(cell) {
        if (typeof cell.dataField == 'string' &&
            !bodyDataCells[cell.dataField]) {
          bodyDataCells[cell.dataField] = cell;
        }
      });
    });
    template.thead.forEach(function(tr) {
      tr.forEach(function(cell) {
        if (typeof cell.dataField == 'string') {
          var bodyDataCell = bodyDataCells[cell.dataField];
          if (bodyDataCell) {
            inheritFromBody.forEach(function(prop) {
              if (bodyDataCell[prop] &&
                  typeof (<any>cell)[prop] == 'undefined') {
                (<any>cell)[prop] = bodyDataCell[prop];
              }
            });
          }
        }
      });
    });
    template.tfoot.forEach(function(tr) {
      tr.forEach(function(cell) {
        if (typeof cell.dataField == 'string') {
          var bodyDataCell = bodyDataCells[cell.dataField];
          if (bodyDataCell) {
            inheritFromBody.forEach(function(prop) {
              if (bodyDataCell[prop] &&
                  typeof (<any>cell)[prop] == 'undefined') {
                (<any>cell)[prop] = bodyDataCell[prop];
              }
            });
          }
        }
      });
    });

    template.thead.forEach(function(row) {
      row.forEach(function(cell) {
        if (!cell.factory && cell.dataType) {
          cell.factory = createDefaultHeaderCellRendererFactory(cell);
        }
      });
    });
    template.tbody.forEach(function(row) {
      row.forEach(function(cell) {
        if (!cell.factory && cell.dataType) {
          cell.factory = createDefaultCellRendererFactory(cell);
        }
      });
    });
    template.tfoot.forEach(function(row) {
      row.forEach(function(cell) {
        if (!cell.factory && cell.dataType) {
          cell.factory = createDefaultCellRendererFactory(cell);
        }
      });
    });
  };

  export var fromTemplate =
      function(template : TableTemplate) : TemplateTable {

    if (template.thead && !template.tbody) {
      // set default tbody if not exists.
      var cloneIfExists = function(src : any, props : string[]) {
        var dst : any = {};
        props.forEach(function(prop) {
          !src[prop] || (dst[prop] = src[prop]);
        });
        return dst;
      };
      var props = [ 'colSpan', 'rowSpan', 'dataField' ];
      template.tbody = template.thead.map(function(tr) {
        return tr.map(function(headCell) {
          return cloneIfExists(headCell, props);
        });
      });
    }

    template.thead = template.thead || [];
    template.tbody = template.tbody || [];
    template.tfoot = template.tfoot || [];

    // setup defaults.
    setupDefaults(template);

    var columnCount = 0;
    var cellWidth : { [k : number] : number } = {};
    var cellHeight : { [k : number] : number } = {};
    var columnResizable : { [k : number] : boolean } = {};

    var styles = function() {
      var spaned : { [ id : string ] : boolean } = {};
      var setSpaned = function(row : number, col : number, cell : TableCell) {
        for (var r = 0; r < cell.rowSpan; r += 1) {
          for (var c = 0; c < cell.colSpan; c += 1) {
            spaned[util.getCellId(row + r, col + c)] = true;
          }
        }
      };
      return template.thead
          .concat(template.tbody)
          .concat(template.tfoot).map(function(tr, row) {
        var style : { [ col : number ] : TableTemplateCellStyle } = {};
        var col = 0;
        var c = 0;
        while (c < tr.length) {
          var id = util.getCellId(row, col);
          if (spaned[id]) {
            col += 1;
            continue;
          }
          var td = tr[c];
          var cell = util.extend({ rowSpan : 1, colSpan : 1 }, td);
          setSpaned(row, col, cell);
          if (typeof cell.width == 'number') {
            cellWidth[col] = cell.width;
          }
          if (typeof cell.height == 'number') {
            cellHeight[row] = cell.height;
          }
          if (typeof cell.columnResizable == 'boolean') {
            columnResizable[col] = cell.columnResizable;
          }
          (<any>td)['.col'] = col;
          style[col] = td;
          col += cell.colSpan;
          c += 1;
        }
        columnCount = Math.max(columnCount, col);
        return style;
      });
    }();

    var getCellsByDataField = function(cellList: TableTemplateCellStyle[][]) {
      var cells : { [ dataField : string ] : TableTemplateCellStyle } = {};
      cellList.forEach(function(tr, row) {
        tr.forEach(function(td : any) {
          if (td.dataField && !cells[td.dataField]) {
            cells[td.dataField] = util.extend(
              { row: row, col: td['.col']}, td);
          }
          // delete temporary.
          delete td['.col'];
        });
      });
      return cells;
    };

    var getCellStyleAt = function(
        model : TemplateTableModel, row : number, col : number) {
      if (row < headLength) {
        return styles[row][col] || {};
      } else if (row >= model.getRowCount() - footLength) {
        return styles[row - bodyLength * (model.getItemCount() - 1)][col] || {};
      } else {
        return styles[headLength + (row - headLength) % bodyLength][col] || {};
      }
    };

    var headLength = template.thead.length;
    var bodyLength = template.tbody.length;
    var footLength = template.tfoot.length;

    class TemplateTableImpl extends TableImpl implements TemplateTable {

      public getContextMenuItems() {
        var messages = i18n.getMessages();
        var tableModel = table.model as TemplateTableModel;
        return [
          {
            label : messages.RESET_FILTER,
            action : function() {
              tableModel.resetFilter();
            }
          },
          {
            label : messages.EDIT_COLUMNS,
            action : function() {
              showColumnEditDialog(table);
            }
          }
        ].filter(function(menuitem, i) {
            return !(!table.model.isColumnDraggable() &&
              menuitem.label == messages.EDIT_COLUMNS);
        });
      }
    }

    class TemplateTableModelImpl
    extends DefaultTableModel implements TemplateTableModel {
      public headCells = getCellsByDataField(template.thead);
      public bodyCells = getCellsByDataField(template.tbody);
      public footCells = getCellsByDataField(template.tfoot);
      public lockLeft = template.lockColumn || 0;
      public lockRight = 0;
      public enableLockColumn = true;
      // keep default value for restore.
      public defaultLockColumn = this.lockLeft;

      public setLockLeft(lockLeft : number) {
        this.lockLeft = lockLeft;
      }
      public getLockLeft() {
        return !this.enableLockColumn? 0 : this.lockLeft;
      }
      public getLockTop() { return headLength; }

      public setLockRight(lockRight : number) {
        this.lockRight = lockRight;
      }
      public getLockRight() {
        return this.lockRight;
      }
      public getLockBottom() { return footLength; }

      // user defines
      public defaultHeaderCellRendererFactory =
        createDefaultHeaderCellRendererFactory();
      public cellWidth = cellWidth;
      public cellHeight = cellHeight;
      public columnDraggable = template.columnDraggable;
      public columnResizable = columnResizable;
      public orderedColumnIndices : number[] = null;
      public sort : Sort = null;
      private filters : { [ dataField : string ] : Filter } = {};
      public filterFactory(dataField : string) : Filter {
        return new DefaultFilter(this.headCells[dataField].dataType || 'string');
      }
      public getFilter(dataField : string) : Filter {
        return this.filters[dataField] ||
          (this.filters[dataField] = this.filterFactory(dataField) );
      }
      public hiddenColumns : { [ orderedCol : number ] : boolean } = {};
      public isColumnHiddenAt(col : number) {
        var orderedCol = this.getOrderedColumnIndexAt(col);
        return this.hiddenColumns[orderedCol];
      }
      public items : any[] = [];
      public filteredItems : any[] = null;
      public hoverRow = -1;
      public editingCell : { row : number, col : number } = null;
      public multipleRowsSelectable = false;
      public selectedRows : { [ row : number ] : boolean } = {};
      public resetFilter() {
        this.sort = null;
        for (var dataField in this.headCells) {
          this.getFilter(dataField).setState(null);
        }
        this.filteredItems = null;
        table.invalidate();
      }
      public getItemCount() {
        return (this.filteredItems || this.items).length;
      }
      public getItemAt(row : number) {
        return (this.filteredItems || this.items)[row];
      }
      private getOrderedColumnIndices() {
        if (this.orderedColumnIndices == null) {
          this.orderedColumnIndices = createDefaultOrderedColumnIndices(this);
        }
        return this.orderedColumnIndices;
      }
      public getOrderedColumnIndexAt(col : number) {
        return this.getOrderedColumnIndices()[col];
      }
      public getRawColumnAt(col : number) {
        var indices = this.getOrderedColumnIndices();
        for (var i = 0; i < indices.length; i += 1) {
          if (indices[i] == col) {
            return i;
          }
        }
        return 0;
      }
      public forEachItemCells(
          callback : (
            cell : TableTemplateCellStyle,
            item : any, row : number, col : number) => boolean) : void {

        var cells : { dataField : string, row : number, col : number}[]= [];
        !function() {
          for (var dataField in this.bodyCells) {
            var cell = this.bodyCells[dataField];
            cells.push({
              dataField : dataField,
              row : cell.row,
              col : this.getRawColumnAt(cell.col)
            });
          }
        }.bind(this)();
        cells.sort(function(c1, c2) {
          if (c1.row != c2.row) {
            return c1.row < c2.row? -1 : 1;
          }
          return c1.col < c2.col? -1 : 1;
        });

        var lineRowOffset = this.getLockTop() > 0? this.getLineRowCountAt(0) : 0;
        var lineRowCount = this.getLineRowCountAt(this.getLockTop() );
        var items = this.filteredItems || this.items;

        for (var r = 0; r < items.length; r += 1) {
          var item = items[r];
          for (var c = 0; c < cells.length; c += 1) {
            var cell = cells[c];
            var col = cell.col;
            var row = lineRowOffset + r * lineRowCount + cell.row;
            if (callback(cell, item, row, col) ) {
              return;
            }
          }
        }
      }
      public getItemIndexAt(row : number, col : number) : ItemIndex {
        if (row < headLength) {
          return { row : -1, col : -1 };
        } else if (row >= this.getRowCount() - footLength) {
          return { row : -1, col : -1 };
        } else {
          var orderedCol = this.getOrderedColumnIndexAt(col);
          var style = getCellStyleAt(this, row, orderedCol);
          row -= headLength;
          return {
            row : Math.floor(row / bodyLength),
            col : style.dataField ||
              ( (row % bodyLength) * this.getColumnCount() + orderedCol)
          };
        }
      }
      public setValueAt(row : number, col : number, value : any) {
        if (row < headLength) {
        } else if (row >= this.getRowCount() - footLength) {
        } else {
          var itemIndex = this.getItemIndexAt(row, col);
          var item = this.getItemAt(itemIndex.row);
          if (item) {
            item[itemIndex.col] = value;
          }
        }
      }
      // overrides
      public getRowCount() { return headLength +
        bodyLength * this.getItemCount() + footLength; }
      public getColumnCount() { return columnCount; }
      public getLineRowCountAt(row : number) {
        return row < headLength? headLength :
          row >= this.getRowCount() - footLength? footLength :
          bodyLength; }
      public getLineRowAt(row : number) {
        return row < headLength? row :
          row >= this.getRowCount() - footLength?
              row - (this.getRowCount() - footLength) :
          (row - headLength) % bodyLength; }
      public getCellWidthAt(col : number) {
        var orderedCol = this.getOrderedColumnIndexAt(col);
        if (this.hiddenColumns[orderedCol]) {
          return 0;
        }
        var v = this.cellWidth[orderedCol];
        return typeof v == 'number'? v : this.defaultCellWidth;
      }
      public getCellHeightAt(row : number) {
        var r = row < headLength? row :
          row >= this.getRowCount() - footLength?
              row - (this.getRowCount() - footLength) +
                headLength + bodyLength :
          (row - headLength) % bodyLength + headLength;
        var v = this.cellHeight[r];
        return typeof v == 'number'? v : this.defaultCellHeight;
      }
      public isColumnDraggable() {
        var v = this.columnDraggable;
        return typeof v == 'boolean'? v : true;
      }
      public isColumnResizableAt(col : number) {
        var orderedCol = this.getOrderedColumnIndexAt(col);
        var v = this.columnResizable[orderedCol];
        return typeof v == 'boolean'? v : true;
      }
      public getCellRendererFactoryAt(row : number, col : number) :
          TableCellRendererFactory {
        var orderedCol = this.getOrderedColumnIndexAt(col);
        return getCellStyleAt(this, row, orderedCol).factory ||
          (row < headLength?
            this.defaultHeaderCellRendererFactory :
            this.defaultCellRendererFactory);
      }
      public getCellStyleAt(row : number, col : number) : TableCellStyle {

        var orderedCol = this.getOrderedColumnIndexAt(col);
        var style = util.extend({}, getCellStyleAt(this, row, orderedCol) );
        style.className = style.className || '';

        if (this.editingCell &&
            this.editingCell.row == row &&
            this.editingCell.col == col) {
          style.className += ' ${prefix}-editing';
        }

        if (row < headLength) {
          style.className += ' ${prefix}-header';
          style.editable = false;
        } else if (row >= this.getRowCount() - footLength) {
          style.className += ' ${prefix}-footer';
          style.editable = false;
        } else {
          var itemIndex = this.getItemIndexAt(row, col);
          row -= headLength;
          style.className += ' ${prefix}-' +
            (itemIndex.row % 2 == 0? 'even' : 'odd');
          if (this.selectedRows[itemIndex.row]) {
            style.className += ' ${prefix}-item-selected';
          }
          if (this.getItemStyleAt) {
            util.extend(style, this.getItemStyleAt(itemIndex) );
          }
        }

        if (style.editable === false) {
          style.className += ' ${prefix}-readonly';
        }

        return style;
      }

      public getItemStyleAt :
        (itemIndex : ItemIndex) => TableCellStyle = null;

      public getValueAt(row : number, col : number) : any {
        var orderedCol = this.getOrderedColumnIndexAt(col);
        if (row < headLength || row >= this.getRowCount() - footLength) {
          var label : any = getCellStyleAt(this, row, orderedCol).label || '';
          return typeof label == 'function'? label(this) : label;
        } else {
          var itemIndex = this.getItemIndexAt(row, col);
          var value = this.getItemAt(itemIndex.row)[itemIndex.col];
          return typeof value != 'undefined'? value : '';
        }
      }
      public tooltipSuffix = 'Tooltip';
      public getTooltipAt(row : number, col : number) : any {
        var orderedCol = this.getOrderedColumnIndexAt(col);
        if (row < headLength || row >= this.getRowCount() - footLength) {
          return '';
        } else {
          var itemIndex = this.getItemIndexAt(row, col);
          var value = this.getItemAt(itemIndex.row)
            [itemIndex.col + this.tooltipSuffix];
          return typeof value != 'undefined'? value : '';
        }
      }
      public setTableState(tableState : TemplateTableState) {

        tableState = JSON.parse(JSON.stringify(tableState) );

        tableState.lockColumn = tableState.lockColumn || 0;
        tableState.enableLockColumn = !!tableState.enableLockColumn;
        tableState.cellWidths = tableState.cellWidths || [];
        tableState.cellHeights = tableState.cellHeights || [];
        tableState.hiddenColumns = tableState.hiddenColumns || [];
        tableState.sort = tableState.sort || null;
        tableState.filters = tableState.filters || {};
        tableState.orderedColumnIndices =
          tableState.orderedColumnIndices || null;

        var cellWidth : { [ col : number ] : number } = {};
        var cellHeight : { [ row : number ] : number } = {};
        var hiddenColumns : { [ orderedCol : number ] : boolean } = {};
        tableState.cellWidths.forEach(
            function(cw : { col : number, width : number }){
          cellWidth[cw.col] = cw.width;
        });
        tableState.cellHeights.forEach(
            function(ch : { row : number, height : number }) {
          cellHeight[ch.row] = ch.height;
        });
        tableState.hiddenColumns.forEach(function(orderedCol : number) {
          hiddenColumns[orderedCol] = true;
        });
        this.lockLeft = tableState.lockColumn;
        this.enableLockColumn = tableState.enableLockColumn;
        this.cellWidth = cellWidth;
        this.cellHeight = cellHeight;
        this.hiddenColumns = hiddenColumns;
        this.sort = tableState.sort;
        var filtered = false;
        if (this.sort) {
          filtered = true;
        }
        for (var dataField in this.headCells) {
          var filter = tableState.filters[dataField];
          this.getFilter(dataField).setState(filter || null);
          if (filter) {
            filtered = true;
          }
        }
        this.orderedColumnIndices = tableState.orderedColumnIndices;
        if (filtered) {
          this.trigger('filterchange');
        }
      }
      public getTableState() : TemplateTableState {
        var cellWidths : { col : number, width : number}[] = [];
        var cellHeights : { row : number, height : number}[] = [];
        var hiddenColumns : number[] = [];
        var filters : { [ dataField : string ] : any } = {};
        var col : any, row : any;
        for (col in this.cellWidth) {
          cellWidths.push({ col : col, width : this.cellWidth[col] });
        }
        for (row in this.cellHeight) {
          cellHeights.push({ row : row, height : this.cellHeight[row] });
        }
        for (col in this.hiddenColumns) {
          hiddenColumns.push(col);
        }
        for (var dataField in this.headCells) {
          var filter = this.getFilter(dataField);
          if (filter.enabled() ) {
            filters[dataField] = filter.getState();
          }
        }
        var tableState : TemplateTableState = {
          lockColumn : this.lockLeft,
          enableLockColumn : this.enableLockColumn,
          cellWidths : cellWidths,
          cellHeights : cellHeights,
          hiddenColumns : hiddenColumns,
          sort : this.sort,
          filters : filters,
          orderedColumnIndices : this.getOrderedColumnIndices()
        };
        return JSON.parse(JSON.stringify(tableState) );
      }
    }

    var table = new TemplateTableImpl(
        new TemplateTableModelImpl() );

    // append itemIndex to events.
    [ 'valuechange' ].
    forEach(function(type) {
      table.model.on(type, function(event : Event, detail : any) {
        detail.itemIndex = this.getItemIndexAt(detail.row, detail.col);
      });
    });
    tableEventTypes.forEach(function(type) {
      table.on(type, function(event : Event, detail : any) {
        detail.itemIndex = this.model.getItemIndexAt(detail.row, detail.col);
      });
    });

    table.on('mousedown', function(event : Event, detail : any) {
      if (detail.row < this.model.getLockTop() ) {
        // on header.
        this.editor.endEdit();
        this.invalidate();
      }
    }).on('contextmenu', function(event : Event, detail : any) {

      if (!(detail.row < table.model.getLockTop() ) ) {
        return;
      }

      detail.originalEvent.preventDefault();
      this.trigger('showcontextmenu', {
        x: detail.originalEvent.pageX,
        y: detail.originalEvent.pageY });

    }).on('showcontextmenu', function(event : Event, detail : any) {

      var menuItems = this.getContextMenuItems();
      if (!menuItems || menuItems.length == 0) {
        return;
      }

      util.callLater(function() {
        ui.showMenu(detail.x, detail.y, menuItems);
      });

    });

    util.set(table.$el, {
      on : {
        contextmenu : function(event) {

          var menu = util.closest(event.target,
            { className : '${prefix}-contextmenu', root : table.$el });
          if (menu != null) {
            return;
          }

          var tbl = util.closest(event.target,
            { tagName : 'TABLE', root : table.$el });
          if (tbl == null) {
            event.preventDefault();
            table.trigger('showcontextmenu', {
              x: event.pageX, y: event.pageY });
          }
        }
      }
    });

    table.model.on('valuechange', function(event : Event, detail : any) {
      this.trigger('beforevaluechange', detail);
      this.setValueAt(detail.row, detail.col, detail.newValue);
    }).on('editingcellchange', function(event : Event, detail : any) {
      this.editingCell = detail.cell;
    }).on('cellsizechange', function(event : Event, detail : any) {
      if (typeof detail.col == 'number') {
        var orderedCol = this.getOrderedColumnIndexAt(detail.col);
        this.cellWidth[orderedCol] = detail.cellWidth;
      }
    }).on('columndragged', function(event : Event, detail : any) {
      var tableModel = <TemplateTableModelImpl>table.model;
      this.orderedColumnIndices = util.moveSublist(
          this.orderedColumnIndices, detail.colFrom, detail.colSpan, detail.colTo);
      if (detail.colFrom < tableModel.lockLeft &&
          tableModel.lockLeft <= detail.colTo) {
        tableModel.lockLeft -= detail.colSpan;
      } else if (detail.colTo < tableModel.lockLeft &&
          tableModel.lockLeft <= detail.colFrom) {
        tableModel.lockLeft += detail.colSpan;
      }
    }).on('filterchange', function() {

      // apply filter

      // clear selected rows.
      this.selectedRows = {};
      this.trigger('rowselectionchange',
          { selectedRows : this.selectedRows, reason : 'filterchange' });

      var filters : { [ dataField : string ] : Filter } = {};
      !function() {
        for (var dataField in this.headCells) {
          var filter = this.getFilter(dataField);
          if (filter.enabled() ) {
            filters[dataField] = filter;
          }
        }  
      }.bind(this)();

      var filteredItems : any[] = this.items.filter(function(item : any) {
        var filtered = false;
        for (var dataField in filters) {
          var value = item[dataField];
          if (typeof value == 'undefined') {
            continue;
          }
          var filter = filters[dataField];
          if (!filter.accept(value) ) {
            filtered = true;
            break;
          }
        }
        return !filtered;
      } );

      var sort = this.sort;
      if (sort) {
        var order = sort.order == SortOrder.ASC? 1 : -1;
        var dataField = sort.dataField;
        var indexField = '.index';
        var sortKeyField = '.sortKey';

        // sort by custom comparator or default.
        var comparator = this.headCells[dataField].comparator ||
          function(v1 : any, v2 : any) { return v1 < v2? -1 : 1; };

        filteredItems.forEach(function(item, i) {
          item[indexField] = i;
          item[sortKeyField] = (item[dataField] === null ||
              typeof item[dataField] == 'undefined')? '' : item[dataField];
        });

        filteredItems.sort(function(item1, item2) {
          var v1 = item1[sortKeyField];
          var v2 = item2[sortKeyField];
          if (v1 === '' && v2 !== '') {
            return 1;
          } else if (v1 !== '' && v2 === '') {
            return -1;
          }
          var result = (v1 === v2)? 0 : comparator(v1, v2);
          if (result != 0) {
            return order * result;
          }
          // index order.
          return order * (item1[indexField] < item2[indexField]? -1 : 1);
        });

        filteredItems.forEach(function(item) {
          delete item[indexField];
          delete item[sortKeyField];
        });
      }
      this.filteredItems = filteredItems;
      table.invalidate();
    });

    enableHover(table);
    enableRowSelect(table);

    return table;
  }

}
