//
// comfortable - default-header-cell-renderer-factory
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

  // selector of sort order
  var createSelector = function() {
    var rect = $c.util.createElement('span', {
      attrs : { 'class' : $c.classNamePrefix + 'selector-body' }, 
      style : { display:'inline-block', width:'12px', height : '12px' }
    });
    return {
      $el : rect,
      selected : false,
      setSelected : function(selected) {
        this.selected = selected;
        $c.util.$(rect).addClass(
            $c.classNamePrefix + 'selected', !selected);
      },
      isSelected : function() {
        return this.selected;
      }
    };
  };

  // filter checkbox
  var createCheckbox = function() {
    var path = $c.util.createSVGElement('path', { attrs : {
        'class' : $c.classNamePrefix + 'checkbox-check',
        d : 'M 2 5 L 5 9 L 10 3'
      } });
    return {
      $el : $c.util.createElement('span', {
        attrs : { 'class' : $c.classNamePrefix + 'checkbox-body' }, 
        style : { display : 'inline-block', width : '12px', height : '12px' }
        }, [
          $c.util.createSVGElement('svg', {
            attrs : { width : 12, height : 12 } }, [ path ])
        ] ),
      checked : true,
      setIncomplete : function(incomplete) {
        $c.util.$(path).addClass(
            $c.classNamePrefix + 'checkbox-incomplete-check', !incomplete);
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

  var createFilterDialog = function(opts, cell) {

    var messages = $c.i18n.getMessages();
    var SortOrder = $c.SortOrder;
    var labelStyle = { marginLeft : '4px', verticalAlign : 'middle' };

    var createSortButton = function(label) {
      var selector = createSelector();
      selector.$el.style.verticalAlign = 'middle';
      return {
        selector : selector,
        $el : $c.util.createElement('div', [
          selector.$el,
          $c.util.createElement('span', {
            style : labelStyle, props : { textContent : label } })
        ], { attrs : { 'class' : $c.classNamePrefix + 'clickable-op' }, on : {
          mousedown : function(event) { event.preventDefault(); },
          click : function() { dialog.trigger('sortclick',
              { label : label }); }
        } })
      };
    };

    var sortAscButton = createSortButton(messages.SORT_ASC);
    var sortDescButton = createSortButton(messages.SORT_DESC);

    var filterItems = [ messages.SELECT_ALL ].concat(opts.filterValues).
      map(function(value, i) {
        return {
          index : i,
          label : (i > 0)? opts.labelFunction(value, cell) : value,
          value : value,
          checked : (i > 0)? !opts.rejects[value] : true,
          color : false
        };
      });

    var filterItemList = $c.util.extend($c.createList(), {
      items : filterItems,
      getItemAt : function(row) { return this.items[row]; },
      getItemCount : function() { return this.items.length; },
      createCell : function() {
        var checkbox = createCheckbox();
        var label = $c.util.createElement('span', { style : labelStyle,
          props : { textContent : 'M' } });
        checkbox.$el.style.verticalAlign = 'middle';
        var $public = {
          row : 0,
          checkbox : checkbox,
          setLabel : function(text) {
            label.textContent = text || messages.SELECT_BLANK;
          },
          $el : $c.util.createElement('div', {
            attrs : { 'class' : $c.classNamePrefix + 'clickable-op' },
            on : {
              mousedown : function(event) { event.preventDefault(); },
              click : function() {
                dialog.trigger('filterclick', { index : $public.index });
              }
            }
          }, [ checkbox.$el, label ])
        };
        return $public;
      },
      renderCell : function(cell, item) {
        cell.index = item.index;
        cell.setLabel(item.label);
        cell.checkbox.setChecked(item.checked);
        cell.checkbox.setIncomplete(item.incomplete);
      },
      height : 0,
      maxHeight : 150
    }).on('rendered', function(event, detail) {
      var height = Math.min(this.maxHeight,
          this.cellHeight * this.getItemCount() );
      if (this.height != height) {
        this.height = height;
        this.$el.style.height = height + 'px';
        this.invalidate();
      }
    });
    filterItemList.$el.style.width = '150px';
    filterItemList.$el.style.height = '0px';
    filterItemList.invalidate();

    var dialog = $c.util.extend($c.ui.createDialog([
      // sort
      sortAscButton.$el,
      sortDescButton.$el,
      // search box
      $c.util.createElement('input', { attrs : { type : 'text' },
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
      $c.util.createElement('div', { style :
          { marginTop : '4px', display : 'inline-block', float : 'right' } },
        [
          $c.ui.createButton(messages.OK, function() {
            dialog.dispose();
            dialog.trigger('applyfilter');
          }),
          $c.ui.createButton(messages.CANCEL, function() {
            dialog.dispose();
          })
        ])
    ]), {
      sortOrder : opts.sortOrder, rejects : opts.rejects
    } ).on('sortclick', function(event, detail) {

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

    } ).on('filterclick', function(event, detail) {

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

      var rejects = {};
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

  var createFilterButton = function() {
    return {
      $el : $c.util.createSVGElement('svg',
          { attrs : { width : 15, height : 15,
            'class' : $c.classNamePrefix + 'clickable-op' } }),
      filtered : false,
      sortOrder : null,
      setFiltered : function(filtered) {
        this.filtered = filtered;
        this.update();
      },
      setSortOrder : function(sortOrder) {
        this.sortOrder = sortOrder;
        this.update();
      },
      update : function() {
        // remove all children
        while (this.$el.firstChild) {
          this.$el.removeChild(this.$el.firstChild);
        }
        // outer rect
        this.$el.appendChild($c.util.createSVGElement('rect', {
          attrs : { 'class' : $c.classNamePrefix + 'filter-body',
            x : 0, y : 0, width: 15, height : 15, rx: 3, ry : 3 } }) );
        // and others.
        var fillClass = $c.classNamePrefix + 'filter-fill';
        var strokeClass = $c.classNamePrefix + 'filter-stroke';
        if (this.filtered) {
          this.$el.appendChild($c.util.createSVGElement('path', {
            attrs : { 'class' : fillClass,
              d : 'M 5 4 L 8 7 L 8 12 L 11 12 L 11 7 L 14 4 Z' } }) );
          if (this.sortOrder == null) {
            this.$el.appendChild($c.util.createSVGElement('path', {
              attrs : { 'class' : fillClass, d: 'M 0 8 L 3 12 L 6 8 Z' } }) );
          }
        } else if (this.sortOrder == null) {
          this.$el.appendChild($c.util.createSVGElement('path', {
            attrs : { 'class' : fillClass, d: 'M 1 4 L 7 11 L 13 4 Z' } }) );
        } else {
          this.$el.appendChild($c.util.createSVGElement('path', {
            attrs : { 'class' : fillClass, d: 'M 4 5 L 9 11 L 14 5 Z' } }) );
        }
        if (this.sortOrder != null) {
          this.$el.appendChild($c.util.createSVGElement('path', {
            attrs : { 'class' : strokeClass, d: 'M 3 2 L 3 12'} } ) );
          if (this.sortOrder == $c.SortOrder.ASC) {
            this.$el.appendChild($c.util.createSVGElement('path', {
              attrs : { 'class' : strokeClass, d: 'M 1 5 L 3 2 L 5 5'} }) );
          } else {
            this.$el.appendChild($c.util.createSVGElement('path', {
              attrs : { 'class' : strokeClass, d : 'M 1 9 L 3 12 L 5 9' } }) );
          }
        }
        return this;
      }
    }.update();
  };

  var getFilterValues = function(tableModel, dataField, comparator) {
    var exists = {};
    var filterValues = [];
    var items = tableModel.items;
    for (var i = 0; i < items.length; i += 1) {
      var value = items[i][dataField];
      if (typeof value == 'undefined') {
        continue;
      }
      if (!exists[value]) {
        if (value !== '') {
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

  var createDefaultHeaderCellRendererFactory = function(opts) {

    opts = $c.util.extend($c.createDefaultCellRendererFactoryOpts(), opts || {});

    return function(td) {

      var labelRenderer = $c.createMultiLineLabelRenderer(td.$el);

      var tableModel = td.tableModel;
      var filterButton = null;
      var dialog = null;

      var showFilterDialog = function() {
        var filterContext = tableModel.filterContext;
        var dataField = filterButton.cell.dataField;
        var filterValues = getFilterValues(tableModel, dataField,
            filterButton.cell.comparator);
        var dialog = createFilterDialog($c.util.extend({
          sortOrder : filterContext.sort &&
            filterContext.sort.dataField == dataField?
            filterContext.sort.sortOrder : null,
          rejects : filterContext.filters[dataField] || {},
          filterValues : filterValues
        }, opts), filterButton.cell).on('applysort', function() {
          filterContext['.comparator'] = filterButton.cell.comparator;
          filterContext.sort = this.sortOrder?
              { dataField : dataField, sortOrder : this.sortOrder } :null;
          tableModel.trigger('filterchange');
        }).on('applyfilter', function() {
          filterContext.filters[dataField] = this.rejects;
          tableModel.trigger('filterchange');
        });
        var off = $c.util.offset(td.$el);
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
              $c.util.set(filterButton.$el, {
                style : { position : 'absolute', right : '4px' },
                on : { mousedown : function(event) {
                    event.preventDefault();
                    if (dialog == null) {
                      // wait for end edit then show dialog.
                      $c.util.callLater(function() {
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
        }
      };
    };
  };

  $c.createDefaultHeaderCellRendererFactory = createDefaultHeaderCellRendererFactory;

}(window.comfortable || (window.comfortable = {}) );
