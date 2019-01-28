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

  var setToList = function(s : any) : any[] {
    var l : any[] = [];
    for (var v in s) { l.push(v); }
    return l;
  };

  var listToSet = function(l : any[]) : any {
    var s : any = {};
    l.forEach(function(v) { s[v] = true; });
    return s;
  };

  export class DefaultFilter implements Filter {

    public createUI(
      dialog : () => EventTarget,
      opts : FilterDialogOptions,
      tableModel : TemplateTableModel,
      cell : TemplateTableCell
    ) : FilterUI {

      var messages = i18n.getMessages();

      var dataField = cell.dataField;
      var filterValues = getFilterValues(tableModel, dataField);

      var rejects : any = {};

      var filterItems : FilterItem[] = [ messages.SELECT_ALL ]
        .concat(filterValues)
        .map(function(value, i) {
          return {
            index : i,
            label : (i > 0)? opts.labelFunction(value, cell) : value,
            value : value,
            checked : false,
            olor : false
          };
        });

      class FilterItemCell implements ListCell {
        public checkbox = (() => {
          var checkbox = createCheckbox();
          checkbox.$el.style.verticalAlign = 'middle';
          return checkbox;
        })();
        private label = util.createElement('span', {
          style : filterLabelStyle,
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
                filterclick(this.index);
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

      var filterclick = function(index : number) {

        if (index == 0) {
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
          var filterItem = filterItems[index];
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

        filterchange();
      };

      var filterchange = function() {

        var rejectCount = 0;
        for (var value in rejects) {
          rejectCount += 1;
        }

        // update 'select all' checkbox
        filterItems[0].checked = rejectCount != filterItems.length - 1;
        filterItems[0].incomplete = rejectCount != 0;

        filterItemList.invalidate();
      };

      var customFilterButton = function(filterTitle : string) {
        var checkbox = createCheckbox();
        util.extend(checkbox.$el.style,
          { border : 'none', verticalAlign : 'middle' });
        checkbox.setChecked(false);
        var label = util.createElement('span', {
              attrs : { 'class' : '${prefix}-clickable-op' },
              style : filterLabelStyle,
              props : { textContent : filterTitle }
            } );
        return {
          $el : util.createElement('div', [ checkbox.$el, label ],
            { on : {
                click : function(event) {
                  (<any>dialog() ).dispose();
                  showFilterDialog(filterTitle);
                }
              }
            })
        };
      }(messages.NUMBER_FILTERS);

      var showFilterDialog = function(filterTitle : string) {
        // TODO
        var opOpts = [
          { value : '', label : '' },
          { value : 'eq', label : messages.EQUALS },
          { value : 'ne', label : messages.NOT_EQUALS },
          { value : 'gt', label : messages.GREATER_THAN },
          { value : 'ge', label : messages.GREATER_THAN_OR_EQUALS },
          { value : 'lt', label : messages.LESS_THAN },
          { value : 'Le', label : messages.LESS_THAN_OR_EQUALS }
        ];
        var createOpUI = function() {
          var op = util.createElement('select',
            opOpts.map(function(item) {
              return util.createElement('option', {
                props : { textContent : item.label,
                    value : item.value } });
            }) );
          var tx = util.createElement('input',
            { attrs : { type : 'text' },
              style : { width : '200px' }  } );
          var opBody = util.createElement('div');
          if (messages.OP_LAYOUT == 'L') {
            opBody.appendChild(op);
          }
          opBody.appendChild(tx);
          if (messages.OP_LAYOUT == 'R') {
            opBody.appendChild(op);
          }
          return opBody;
        };
        var createRadio = function(label : string) {
          var radio = util.createElement('input',
            { attrs : { type : 'radio' } });
          var radioBody = util.createElement('label',
            [ radio, <any>document.createTextNode(label) ]);
          return { $el : radioBody };
        };
        var rd1 = createRadio('and');
        var rd2 = createRadio('or');
        var cdBody = util.createElement('div', [ rd1.$el, rd2.$el ]);
        var op1 = createOpUI();
        var op2 = createOpUI();
        var dialog = ui.createDialog([
          util.createElement('div',
            { props : { textContent : filterTitle } }),
          op1, cdBody, op2,
          util.createElement('div',
            { style : { textAlign : 'right' } }, [
            ui.createButton(messages.OK, (event)=>{
              dialog.dispose();
            }),
            ui.createButton(messages.CANCEL, (event)=>{
              dialog.dispose();
            })
          ])
        ]).on('beforeshow', function() {
          var left = (window.innerWidth -
                        dialog.$el.offsetWidth) / 2;
          var top = (window.innerHeight -
                        dialog.$el.offsetHeight) / 2;
          dialog.$el.style.left = left + 'px';
          dialog.$el.style.top = top + 'px';
        });

        dialog.show();
      };
      
      return {
        setState : (state : any) => {
          rejects = listToSet(state.rejects);
          filterItems.forEach(function(filterItem, i) {
            if (i > 0) {
              filterItem.checked = !rejects[filterItem.value];
            }
          });
          filterchange();
        },
        getState : () => {
          return { rejects : setToList(rejects) };
        },
        $el : util.createElement('div', { props : {} }, [
          /*customFilterButton.$el,*/
          // search box
          util.createElement('input', { attrs : { type : 'text',
              placeHolder: messages.SEARCH },
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
        ])
      };
    }

    public enabled() {
      var enabled = false;
      for (var reject in this.rejects) {
        enabled = true;
        break;
      }
      return enabled;
    }

    public accept(value : any) {
      return !this.rejects[value];
    }

    private rejects : any = {};

    public setState(state : any) {
      this.rejects = listToSet(
        state && state.rejects? state.rejects : []);
    }

    public getState() : any {
      return { rejects : setToList(this.rejects) };
    }
  }
}