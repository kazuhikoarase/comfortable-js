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

  interface FilterItem {
    index: number;
    label: any;
    value: string;
    checked: boolean;
    color: boolean;
    incomplete? : boolean;
  }

  interface CheckBox {
    $el : HTMLElement;
    checked : boolean;
    setIncomplete : (incomplete : boolean) => void;
    setChecked : (checked : boolean) => void;
    isChecked : () => boolean;
  }

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

  export function createDefaultFilterUI(
      opts : FilterDialogOptions,
      tableModel : TemplateTableModel,
      cell : TemplateTableCell,
      dialog : () => any) {

    var messages = i18n.getMessages();
    var labelStyle : { [ k : string ] : string } =
      { marginLeft : '4px', verticalAlign : 'middle' };
    
    var dataField = cell.dataField;
    var filterValues = getFilterValues(tableModel, dataField);

    var rejects : any = {};
    if (opts.filterState && opts.filterState.rejects) {
      rejects = opts.filterState && opts.filterState.rejects;
    }

    var filterItems : FilterItem[] = [ messages.SELECT_ALL ]
      .concat(filterValues)
      .map(function(value, i) {
        return {
          index : i,
          label : (i > 0)? opts.labelFunction(value, cell) : value,
          value : value,
          checked : (i > 0)? !rejects[value] : true,
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
              dialog().trigger('filterclick', { index : this.index });
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

    util.callLater(function() {

      dialog().on('filterclick', function(event : Event, detail : any) {
  
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
  
        rejects = function() {
          var rejects : any = {};
          filterItems.forEach(function(filterItem, i) {
            if (i > 0 && !filterItem.checked) {
              rejects[filterItem.value] = true;
            }
          });
          return rejects;
        }();

//        (this.filterState || (this.filterState = {}) ).rejects = rejects;
        this.trigger('filterchange');

      }).on('filterchange', function() {

        var rejectCount = 0;
        for (var value in rejects) {
          rejectCount += 1;
        }

        // update 'select all' checkbox
        filterItems[0].checked = rejectCount != filterItems.length - 1;
        filterItems[0].incomplete = rejectCount != 0;

        filterItemList.invalidate();

      }).trigger('filterchange');
    });
    return util.createElement('div', { props : {} }, [

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
      filterItemList.$el
    ]);
  }


}