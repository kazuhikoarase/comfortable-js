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

  var getFilterValues = function(
      tableModel : TemplateTableModel, dataField : string) {
    var comparator = tableModel.headCells[dataField].comparator;
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
    }
    // blank is always last.
    if (exists['']) {
      filterValues.push('');
    }
    return filterValues;
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

  var operators = {
    EQUALS : 'eq',
    NOT_EQUALS : 'ne',
    GREATER_THAN : 'gt',
    GREATER_THAN_OR_EQUALS : 'ge',
    LESS_THAN : 'lt',
    LESS_THAN_OR_EQUALS : 'le',
    STARTS_WITH : 'sw',
    NOT_STARTS_WITH : 'nsw',
    ENDS_WITH : 'ew',
    NOT_ENDS_WITH : 'new',
    CONTAINS : 'ct',
    NOT_CONTAINS : 'nct',
  };

  var activeCustomFilter = function(customFilter : any) {
    return customFilter.op1 && customFilter.const1 ||
        customFilter.op2 && customFilter.const2
  };

  var createDefaultCustomFilter = function() {
    return {
      op : 'and', // 'and' or 'or'
      op1 : '',
      const1 : '',
      op2 : '',
      const2 : '',
      dataType : ''
    };
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
      var valid = true;

      var filterItems : FilterItem[] = [ messages.SELECT_ALL ]
        .concat(filterValues)
        .map(function(value, i) {
          return {
            index : i,
            label : (i > 0)? opts.labelFunction(value, cell) : value,
            value : value,
            checked : false
          };
        });

      class FilterItemCell implements ListCell {
        public checkBox = (() => {
          var checkBox = ui.createCheckBox();
          checkBox.$el.style.verticalAlign = 'middle';
          return checkBox;
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
          }, [ this.checkBox.$el, this.label ])
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
          cell.checkBox.setChecked(item.checked);
          cell.checkBox.setIncomplete(item.incomplete);
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

        // update 'select all' checkBox
        filterItems[0].checked = rejectCount != filterItems.length - 1;
        filterItems[0].incomplete = rejectCount != 0;

        filterItemList.invalidate();
      };

      //---------------------------------------------------------
      // custom filter

      var customFilter = createDefaultCustomFilter();

      var createClearButton = function() {
        var checkBox = ui.createCheckBox();
        util.extend(checkBox.$el.style,
          { border : 'none', verticalAlign : 'middle' });
        checkBox.setChecked(false);
        var label = util.createElement('span', {
              attrs : { 'class' : '${prefix}-clickable-op' },
              style : filterLabelStyle,
              props : { textContent :
                util.format(messages.CLEAR_FILTER_FROM, (<any>cell).label) }
            } );
        return {
          $el : util.createElement('div', [ checkBox.$el, label ],
            { on : {
                click : function(event) {
                  (<any>dialog() ).dispose();
                  rejects = {};
                  customFilter = createDefaultCustomFilter();
                  dialog().trigger('applyfilter');
                }
              }
            }),
          checkBox : checkBox
        };
      };

      var createFilterButton = function(filterTitle : string) {
        var checkBox = ui.createCheckBox();
        util.extend(checkBox.$el.style,
          { border : 'none', verticalAlign : 'middle' });
        checkBox.setChecked(false);
        var label = util.createElement('span', {
              attrs : { 'class' : '${prefix}-clickable-op' },
              style : filterLabelStyle,
              props : { textContent : filterTitle }
            } );
        return {
          $el : util.createElement('div', [ checkBox.$el, label ],
            { on : {
                click : function(event) {
                  (<any>dialog() ).dispose();
                  showFilterDialog(filterTitle);
                }
              }
            }),
          checkBox : checkBox
        };
      };

      var showFilterDialog = function(title : string) {
        var optMap = function(k : string) {
          return { value : (<any>operators)[k], label : (<any>messages)[k] };
        };
        var opOpts : any[] = [ { value : '', label : '' } ];
        opOpts = opOpts.concat([
          'EQUALS',
          'NOT_EQUALS',
          'GREATER_THAN',
          'GREATER_THAN_OR_EQUALS',
          'LESS_THAN',
          'LESS_THAN_OR_EQUALS'].map(optMap) );
        if (dataType == 'string' || dataType == 'date') {
          opOpts = opOpts.concat([
            'STARTS_WITH',
            'NOT_STARTS_WITH',
            'ENDS_WITH',
            'NOT_ENDS_WITH',
            'CONTAINS',
            'NOT_CONTAINS'].map(optMap) );
        }
        var createOpUI = function(op : string, value : string) {
          var sel :any = util.createElement('select',
            opOpts.map(function(opOpt) {
              return util.createElement('option', {
                props : { textContent : opOpt.label,
                    value : opOpt.value,
                    selected : op == opOpt.value } });
            }) );
          var txt : any = util.createElement('input',
            { attrs : { type : 'text' },
              style : { width : '200px' },
              props : { value : sel.value? value : '' } } );
          var opBody = util.createElement('div',
            { style : { whiteSpace: 'nowrap' } });
          if (messages.OP_LAYOUT == 'L') {
            opBody.appendChild(sel);
            txt.style.marginLeft = '2px';
          }
          opBody.appendChild(txt);
          if (messages.OP_LAYOUT == 'R') {
            txt.style.marginRight = '2px';
            opBody.appendChild(sel);
          }
          return { $el : opBody, sel : sel, txt : txt };
        };

        var updateRadios = function() {
          customFilter.op = customFilter.op || 'and';
          rd1.radio.checked = rd1.radio.value == customFilter.op;
          rd2.radio.checked = rd2.radio.value == customFilter.op;
        };
        var createRadio = function(value : string, label : string) {
          var radio : any = util.createElement('input',
            { attrs : { type : 'radio' }, props : { value : value },
              on : { click : function() {
                customFilter.op = value;
                updateRadios();
              } } });
          var radioBody = util.createElement('label',
            [ radio, <any>document.createTextNode(label) ]);
          return { $el : radioBody, radio : radio };
        };

        var rd1 = createRadio('and', messages.AND);
        var rd2 = createRadio('or', messages.OR);
        var rdGrp = util.createElement('div', [ rd1.$el, rd2.$el ]);
        updateRadios();

        var op1 = createOpUI(customFilter.op1, customFilter.const1);
        var op2 = createOpUI(customFilter.op2, customFilter.const2);

        var dialogPos = { left : 0, top : 0 };

        var cfDialog = <ui.Dialog>ui.createDialog([
          util.createElement('div', { props : { textContent : title },
            style : { margin : '2px' },
            on: {
              mousedown: function(event) {
                var mousemoveHandler = function(event : any) {
                  dialogPos.left = event.pageX - dragPoint.left;
                  dialogPos.top = event.pageY - dragPoint.top;
                  cfDialog.$el.style.left = dialogPos.left + 'px';
                  cfDialog.$el.style.top = dialogPos.top + 'px';
                };
                var mouseupHandler = function(event : any) {
                  util.$(document)
                    .off('mousemove', mousemoveHandler)
                    .off('mouseup', mouseupHandler);
                };

                event.preventDefault();
                util.$(document)
                  .on('mousemove', mousemoveHandler)
                  .on('mouseup', mouseupHandler);
                var dragPoint = {
                  left: event.pageX - dialogPos.left,
                  top: event.pageY - dialogPos.top
                };
              }
            } }),
          util.createElement('fieldset', [
            util.createElement('legend', { props : {
              textContent: '"' + (<any>cell).label +'"' } }),
            op1.$el, rdGrp, op2.$el ]),
          util.createElement('div',
            { style : { textAlign : 'right' } }, [
            ui.createButton(messages.OK, (event)=>{
              var flt = function(val : string) : string {
                val = util.trim(val);
                if (dataType == 'number') {
                  val = util.toNarrowNumber(val);
                }
                return val;
              };
              customFilter.op1 = op1.sel.value;
              customFilter.const1 = customFilter.op1? flt(op1.txt.value) : '';
              customFilter.op2 = op2.sel.value;
              customFilter.const2 = customFilter.op2? flt(op2.txt.value) : '';
              cfDialog.dispose();
              dialog().trigger('applyfilter');
            }),
            ui.createButton(messages.CANCEL, (event)=>{
              cfDialog.dispose();
            })
          ])
        ]).on('beforeshow', function() {
          dialogPos.left = document.documentElement.scrollLeft +
            ( (window.innerWidth - this.$el.offsetWidth) / 2 );
          dialogPos.top = document.documentElement.scrollTop +
            ( (window.innerHeight - this.$el.offsetHeight) / 2 );
          this.$el.style.left = dialogPos.left + 'px';
          this.$el.style.top = dialogPos.top + 'px';
        });

        cfDialog.show();
      };

      var dataType = (<any>cell).dataType || 'string';
      var customFilterButton = createFilterButton(
        dataType == 'number'? messages.NUMBER_FILTERS :
        dataType == 'date'? messages.DATE_FILTERS :
        messages.TEXT_FILTERS);

      if (!(dataType == 'string' ||
          dataType == 'number' ||
          dataType == 'date') ) {
        customFilterButton.$el.style.display = 'none';
      }

      // horizontal bar
      var hr = () => util.createElement('div', { style : {
        borderTop : '1px solid #000', opacity : '0.2', margin : '4px 0px'
      } });

      return {
        setState : (state : any) => {
          rejects = listToSet(state.rejects);
          filterItems.forEach(function(filterItem, i) {
            if (i > 0) {
              filterItem.checked = !rejects[filterItem.value];
            }
          });
          filterchange();
          customFilter = state.customFilter;
          customFilterButton.checkBox.setChecked(
            activeCustomFilter(customFilter) );
        },
        getState : () => {

          if (!valid) {
            rejects = {};
            filterItems.forEach(function(filterItem, i) {
              if (i > 0) {
                rejects[filterItem.value] = true;
              }
            });
            filterItemList.items.forEach(function(filterItem) {
              if (filterItem.checked) {
                delete rejects[filterItem.value];
              }
            });
            valid = true;
          }

          customFilter.dataType = dataType;
          return {
            rejects : setToList(rejects),
            customFilter : customFilter
          };
        },
        $el : util.createElement('div', { props : {} }, [
          hr(),
          createClearButton().$el,
          customFilterButton.$el,
          hr(),
          // search box
          util.createElement('input', { attrs : { type : 'text',
              placeHolder: messages.SEARCH },
            style : { width : '150px', margin : '4px 0px' },
            on : { keyup : function(event) {
              valid = false;
              var value = event.currentTarget.value;
              filterItemList.items = filterItems.
                  filter(function(filterItem, i) {
                return !(i > 0 && value &&
                  filterItem.label.indexOf(value) == -1);
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
      if (activeCustomFilter(this.customFilter) ) {
        enabled = true;
      }
      return enabled;
    }

    public accept(value : any) {
      if (this.rejects[value]) {
        return false;
      } else if (!this.customFilterAccept(value) ) {
        return false;
      } else {
        return true;
      }
    }

    private createCustomFilterAccept(customFilter : any) :
        (value : any) => boolean {

      if (activeCustomFilter(customFilter) ) {

        var creOp = function(op : string, constVal : any) :
            (value : any) => boolean {

          if (customFilter.dataType == 'number') {

            // number

            constVal = +constVal;

            switch(op) {

            case operators.EQUALS :
              return (value : any) => +value == constVal;
            case operators.NOT_EQUALS :
              return (value : any) => !(+value == constVal);
            case operators.GREATER_THAN :
              return (value : any) => +value > constVal;
            case operators.GREATER_THAN_OR_EQUALS :
              return (value : any) => +value >= constVal;
            case operators.LESS_THAN :
              return (value : any) => +value < constVal;
            case operators.LESS_THAN_OR_EQUALS :
              return (value : any) => +value <= constVal;

            default :
              throw 'bad op:' + op;
            }

          } else {

            // string

            switch(op) {

            case operators.EQUALS :
              return (value : any) => value == constVal;
            case operators.NOT_EQUALS :
              return (value : any) => value != constVal;
            case operators.GREATER_THAN :
              return (value : any) => value > constVal;
            case operators.GREATER_THAN_OR_EQUALS :
              return (value : any) => value >= constVal;
            case operators.LESS_THAN :
              return (value : any) => value < constVal;
            case operators.LESS_THAN_OR_EQUALS :
              return (value : any) => value <= constVal;

            case operators.STARTS_WITH :
              return (value : any) => value.indexOf(constVal) == 0;
            case operators.NOT_STARTS_WITH :
              return (value : any) => value.indexOf(constVal) != 0;
            case operators.ENDS_WITH :
              return (value : any) => value && value.indexOf(constVal) ==
                value.length - constVal.length;
            case operators.NOT_ENDS_WITH :
              return (value : any) => !(value && value.indexOf(constVal) ==
                value.length - constVal.length);
            case operators.CONTAINS :
              return (value : any) => value.indexOf(constVal) != -1;
            case operators.NOT_CONTAINS :
              return (value : any) => value.indexOf(constVal) == -1;

            default :
              throw 'bad op:' + op;
            }
          }
        };

        var ops : any[] = [];
        if (customFilter.const1) {
          ops.push(creOp(customFilter.op1, customFilter.const1) );
        }
        if (customFilter.const2) {
          ops.push(creOp(customFilter.op2, customFilter.const2) );
        }

        return ops.length == 1? ops[0] :
          customFilter.op == 'and'?
            (value : any) => ops[0](value) && ops[1](value) :
            (value : any) => ops[0](value) || ops[1](value);

      } else {
        return () => true;
      }
    }

    private rejects : any = {};
    private customFilter : any = {};
    private customFilterAccept : (value : any) => boolean = () => true;

    public setState(state : any) {
      this.rejects = listToSet(
        state && state.rejects? state.rejects : []);
      this.customFilter =
        state && state.customFilter? state.customFilter : {};
      this.customFilterAccept =
        this.createCustomFilterAccept(this.customFilter);
    }

    public getState() : any {
      return {
        rejects : setToList(this.rejects),
        customFilter : this.customFilter
      };
    }
  }
}
