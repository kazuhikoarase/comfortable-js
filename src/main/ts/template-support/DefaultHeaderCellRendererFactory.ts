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

  interface FilterButton {
    $el : HTMLElement;
    cell : TemplateTableCell;
    filtered : boolean;
    sortOrder : string;
    setFiltered : (filtered : boolean) => void;
    setSortOrder : (sortOrder : string) => void;
    update : () => void;
  }

  export interface FilterDialogOptions extends CellRendererFactoryOpts {
    sortOrder : string;
    filterState : any;
  }

  interface FilterDialog extends EventTarget {
    render : (cell : TableCell) => void;
    beginEdit : (cell : TableCell) => {
      focus : () => void;
      endEdit : () => void;
    };
    dispose : () => void;
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

  export var filterLabelStyle : { [ k : string ] : string } =
      { marginLeft : '4px', verticalAlign : 'middle' };

  var createFilterDialog = function(
      opts : FilterDialogOptions, filterUI : HTMLElement) {

    var messages = i18n.getMessages();

    var createSortButton = function(label : string) {
      var selector = createSelector();
      selector.$el.style.verticalAlign = 'middle';
      return {
        selector : selector,
        $el : util.createElement('div', [
          selector.$el,
          util.createElement('span', {
            style : filterLabelStyle, props : { textContent : label } })
        ], { attrs : { 'class' : '${prefix}-clickable-op' }, on : {
          mousedown : function(event) { event.preventDefault(); },
          click : function() { dialog.trigger('sortclick',
              { label : label }); }
        } })
      };
    };

    var sortAscButton = createSortButton(messages.SORT_ASC);
    var sortDescButton = createSortButton(messages.SORT_DESC);

    var dialog = util.extend(ui.createDialog([
      // sort
      sortAscButton.$el,
      sortDescButton.$el,
      filterUI,
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
    ]), opts).on('sortclick', function(event : Event, detail : any) {

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

    } ).trigger('sortchange');

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

        var dataField = filterButton.cell.dataField;
        var sort = tableModel.sort;
        var filter = tableModel.getFilter(dataField);

        opts = util.extend({
          sortOrder : (sort && sort.dataField == dataField)? sort.order : null
        }, opts);

        var filterUI = filter.createUI(
            () => dialog,
            <FilterDialogOptions>opts,
            tableModel, filterButton.cell);
        filterUI.setState(filter.getState() );

        var dialog : any = createFilterDialog(
            <FilterDialogOptions>opts, filterUI.$el
          ).on('applysort', function() {
            tableModel.sort = this.sortOrder?
                { dataField : dataField, order : this.sortOrder } :null;
            tableModel.trigger('filterchange');
          }).on('applyfilter', function() {
            filter.setState(filterUI.getState() );
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
            var sort = tableModel.sort;
            var filter = tableModel.getFilter(cell.dataField);
            filterButton.setSortOrder(
              (sort && sort.dataField == cell.dataField)? sort.order : null);
            filterButton.setFiltered(filter.enabled() );
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
