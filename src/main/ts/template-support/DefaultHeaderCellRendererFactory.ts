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

namespace comfortable {

  'use strict';

  interface Selector {
    $el : HTMLElement,
    selected : boolean,
    setSelected : (selected : boolean) => void;
    isSelected : () => boolean;
  }

  interface CheckBox {
    $el : HTMLElement;
    checked : boolean;
    setIncomplete : (incomplete : boolean) => void;
    setChecked : (checked : boolean) => void;
    isChecked : () => boolean;
  }

  interface FilterButton {
    $el : HTMLElement;
    cell : TemplateTableCell;
    filtered : boolean;
    sortOrder : string;
    setFiltered : (filtered : boolean) => void;
    setSortOrder : (sortOrder : string) => void;
    update : () => void;
  }

  interface FilterDialogOptions extends CellRendererFactoryOpts {
    sortOrder : string;
    filterValues : any[];
    rejects : Rejects;
  }

  interface FilterDialog extends EventTarget {
    render : (cell : TableCell) => void;
    beginEdit : (cell : TableCell) => {
      focus : () => void;
      endEdit : () => void;
    };
    dispose : () => void;
  }

  interface FilterItem {
    index: number;
    label: any;
    value: string;
    checked: boolean;
    color: boolean;
    incomplete? : boolean;
  }

  export var SortOrder = { ASC : 'asc', DESC : 'desc' };

  // selector of sort order
  var createSelector = function() : Selector {
    var rect = util.createElement('span', {
      attrs : { 'class' : '${prefix}-selector-body' }, 
      style : { display:'inline-block', width:'12px', height : '12px' }
    });
    return {
      $el : rect,
      selected : false,
      setSelected : function(selected) {
        this.selected = selected;
        util.$(rect).addClass('${prefix}-selected', !selected);
      },
      isSelected : function() {
        return this.selected;
      }
    };
  };

  // filter checkbox
  var createCheckbox = function() : CheckBox {

    // fix for layout collapse by bootstrap.
    var antiBsGlobals : { [k : string] : string } = {
        verticalAlign :'baseline',
        boxSizing : 'content-box',
        lineHeight : '1' };

    var path = util.createSVGElement('path', { attrs : {
        'class' : '${prefix}-checkbox-check',
        d : 'M 2 5 L 5 9 L 10 3'
      },
      style : antiBsGlobals });
    return {
      $el : util.createElement('span', {
        attrs : { 'class' : '${prefix}-checkbox-body' }, 
        style : util.extend(antiBsGlobals, { display : 'inline-block',
          width : '12px', height : '12px' }
        )}, [
          util.createSVGElement('svg', {
            attrs : { width : '12', height : '12' },
            style : antiBsGlobals }, [ path ])
        ] ),
      checked : true,
      setIncomplete : function(incomplete) {
        util.$(path).addClass(
            '${prefix}-checkbox-incomplete-check', !incomplete);
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

  var createFilterDialog = function(opts : FilterDialogOptions, cell : TemplateTableCell) {

    var messages = i18n.getMessages();
    var labelStyle : { [ k : string ] : string } =
      { marginLeft : '4px', verticalAlign : 'middle' };

    var createSortButton = function(label : string) {
      var selector = createSelector();
      selector.$el.style.verticalAlign = 'middle';
      return {
        selector : selector,
        $el : util.createElement('div', [
          selector.$el,
          util.createElement('span', {
            style : labelStyle, props : { textContent : label } })
        ], { attrs : { 'class' : '${prefix}-clickable-op' }, on : {
          mousedown : function(event) { event.preventDefault(); },
          click : function() { dialog.trigger('sortclick',
              { label : label }); }
        } })
      };
    };

    var sortAscButton = createSortButton(messages.SORT_ASC);
    var sortDescButton = createSortButton(messages.SORT_DESC);

    var filterItems : FilterItem[] = [ messages.SELECT_ALL ]
      .concat(opts.filterValues)
      .map(function(value, i) {
        return {
          index : i,
          label : (i > 0)? opts.labelFunction(value, cell) : value,
          value : value,
          checked : (i > 0)? !opts.rejects[value] : true,
          color : false
        };
      });

    class FilterItemCell implements ListCell {
      public checkbox = (() => {
        var checkbox = createCheckbox();
        checkbox.$el.style.verticalAlign = 'middle';
        return checkbox;
      })();
      private label = util.createElement('span', { style : labelStyle,
        props : { textContent : 'M' } });
      public index = 0;
      public row = 0;
      public setLabel(text : string) {
        this.label.textContent = text || messages.SELECT_BLANK;
        this.$el.setAttribute('title', this.label.textContent);
      }
      public $el = util.createElement('div', {
          attrs : { 'class' : '${prefix}-clickable-op' },
          on : {
            mousedown : (event) => { event.preventDefault(); },
            click : () => {
              dialog.trigger('filterclick', { index : this.index });
            }
          }
        }, [ this.checkbox.$el, this.label ])
    }

    class FilterItemList extends ListImpl<FilterItem,FilterItemCell> {
      public items = filterItems;
      public getItemAt(row : number) { return this.items[row]; }
      public getItemCount() { return this.items.length; }
      public createCell() {
        return new FilterItemCell();
      }
      public renderCell(cell : FilterItemCell, item : FilterItem) {
        cell.index = item.index;
        cell.setLabel(item.label);
        cell.checkbox.setChecked(item.checked);
        cell.checkbox.setIncomplete(item.incomplete);
      }
      public height = 0;
      public maxHeight = 150;
    }

    var filterItemList = new FilterItemList();
    filterItemList.on('rendered', function(event : Event, detail : any) {
      var height = Math.min(this.maxHeight,
          this.cellHeight * this.getItemCount() );
      if (this.height != height) {
        this.height = height;
        this.$el.style.height = height + 'px';
        this.invalidate();
      }
    })
    filterItemList.$el.style.width = '150px';
    filterItemList.$el.style.height = '0px';
    filterItemList.invalidate();

    var dialog = util.extend(ui.createDialog([
      // sort
      sortAscButton.$el,
      sortDescButton.$el,
      // search box
      util.createElement('input', { attrs : { type : 'text' },
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
      util.createElement('div', { style :
          { marginTop : '4px', display : 'inline-block', float : 'right' } },
        [
          ui.createButton(messages.OK, function() {
            dialog.dispose();
            dialog.trigger('applyfilter');
          }),
          ui.createButton(messages.CANCEL, function() {
            dialog.dispose();
          })
        ])
    ]), {
      sortOrder : opts.sortOrder, rejects : opts.rejects
    } ).on('sortclick', function(event : Event, detail : any) {

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

    } ).on('filterclick', function(event : Event, detail : any) {

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

      var rejects : Rejects = {};
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

  var createFilterButton = function() : FilterButton {
    return {
      $el : util.createSVGElement('svg',
          { style : { position : 'absolute' },
            attrs : { width : '15', height : '15',
            'class' : '${prefix}-filter-button ${prefix}-clickable-op' } }),
      filtered : false,
      sortOrder : null,
      setFiltered : function(filtered : boolean) {
        this.filtered = filtered;
        this.update();
      },
      setSortOrder : function(sortOrder : string) {
        this.sortOrder = sortOrder;
        this.update();
      },
      update : function() {
        // remove all children
        while (this.$el.firstChild) {
          this.$el.removeChild(this.$el.firstChild);
        }
        // outer rect
        this.$el.appendChild(util.createSVGElement('rect', {
          attrs : { 'class' : '${prefix}-filter-body',
            x : '0', y : '0', width: '15', height : '15',
            rx: '3', ry : '3' } }) );
        // and others.
        var fillClass = '${prefix}-filter-fill';
        var strokeClass = '${prefix}-filter-stroke';
        if (this.filtered) {
          this.$el.appendChild(util.createSVGElement('path', {
            attrs : { 'class' : fillClass,
              d : 'M 5 4 L 8 7 L 8 12 L 11 12 L 11 7 L 14 4 Z' } }) );
          if (this.sortOrder == null) {
            this.$el.appendChild(util.createSVGElement('path', {
              attrs : { 'class' : fillClass, d: 'M 0 8 L 3 12 L 6 8 Z' } }) );
          }
        } else if (this.sortOrder == null) {
          this.$el.appendChild(util.createSVGElement('path', {
            attrs : { 'class' : fillClass, d: 'M 1 4 L 7 11 L 13 4 Z' } }) );
        } else {
          this.$el.appendChild(util.createSVGElement('path', {
            attrs : { 'class' : fillClass, d: 'M 4 5 L 9 11 L 14 5 Z' } }) );
        }
        if (this.sortOrder != null) {
          this.$el.appendChild(util.createSVGElement('path', {
            attrs : { 'class' : strokeClass, d: 'M 3 2 L 3 12'} } ) );
          if (this.sortOrder == SortOrder.ASC) {
            this.$el.appendChild(util.createSVGElement('path', {
              attrs : { 'class' : strokeClass, d: 'M 1 5 L 3 2 L 5 5'} }) );
          } else {
            this.$el.appendChild(util.createSVGElement('path', {
              attrs : { 'class' : strokeClass, d : 'M 1 9 L 3 12 L 5 9' } }) );
          }
        }
        return this;
      }
    }.update();
  };

  var getFilterValues = function(
      tableModel : TemplateTableModel, dataField : string) {
    var comparator = tableModel.headerCells[dataField].comparator;
    var exists : { [ value : string ] : boolean } = {};
    var filterValues : string[] = [];
    var items = tableModel.items;
    for (var i = 0; i < items.length; i += 1) {
      var value = items[i][dataField];
      if (typeof value == 'undefined') {
        continue;
      }
      value = '' + value;
      if (!exists[value]) {
        if (value != '') {
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

  export var createDefaultHeaderCellRendererFactory =
      function(opts? : CellRendererFactoryOpts) :
        TableCellRendererFactory {

    opts = util.extend(createDefaultCellRendererFactoryOpts(), opts || {});

    return function(td) : TableCellRenderer {

      var labelRenderer = createMultiLineLabelRenderer(td.$el);

      var tableModel : TemplateTableModel = <any>td.tableModel;
      var filterButton : FilterButton = null;
      var dialog : FilterDialog = null;

      var showFilterDialog = function() : FilterDialog {
        var filterContext = tableModel.filterContext;
        var dataField = filterButton.cell.dataField;
        var filterValues = getFilterValues(tableModel, dataField);
        var dialog = createFilterDialog(util.extend({
          sortOrder : filterContext.sort &&
            filterContext.sort.dataField == dataField?
            filterContext.sort.sortOrder : null,
          rejects : filterContext.filters[dataField] || {},
          filterValues : filterValues
        }, opts), filterButton.cell).on('applysort', function() {
          filterContext.sort = this.sortOrder?
              { dataField : dataField, sortOrder : this.sortOrder } :null;
          tableModel.trigger('filterchange');
        }).on('applyfilter', function() {
          filterContext.filters[dataField] = this.rejects;
          tableModel.trigger('filterchange');
        });
        var off = util.offset(td.$el);
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
              util.set(filterButton.$el, {
                on : { mousedown : function(event) {
                    event.preventDefault();
                    if (dialog == null) {
                      // wait for end edit then show dialog.
                      util.callLater(function() {
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
        },
        dispose : function() {
        }
      };
    };
  }

}
