
if (!window.console) {
  // IE9 does not have a console object without devmode.
  window.console = { log : function() {} };
}

window.addEventListener('load', function(event) {

  tableCustomized('customizedSample');
  tableFromTemplate('fromTemplateSample');

  hljs.highlightBlock(document.getElementById('gs') );

  var extractCode = function(fn) {
    var lines = fn.toString().split(/\n/g);
    lines = lines.filter(function (line, i) { return 0 < i && i < lines.length - 1; });
    var start = -1;
    lines.forEach(function(line) {
      var match = line.match(/^(\s*).*$/);
      if (match[1].length > 0) {
        start = start == -1? match[1].length : Math.min(start, match[1].length);
      }
    });
    return lines.map(function(line) {
        return line.length > start? line.substring(start) : line; }).
      join('\n');
  };

  var stringify = function(template) {
    var pat = '@';
    var all = (template.thead || []).concat(template.tbody || []);
    all.forEach(function(rows) {
      rows.forEach(function(row) {
        for (var k in row) {
          if (typeof row[k] == 'function') {
            row['.' + k] = row[k];
            row[k] = pat + row[k].toString() + pat;
          }
        }
      });
    });
    var s = JSON.stringify(template, null, 2);
    all.forEach(function(rows) {
      rows.forEach(function(row) {
        for (var k in row) {
          if (typeof row[k] == 'function') {
            row[k.substring(1)] = row[k];
            delete row[k];
          }
        }
      });
    });
    var start;
    while ( (start = s.indexOf('"' + pat) ) != -1) {
      var end = s.indexOf(pat + '"', start);
      s = s.substring(0, start) +
      s.substring(start + pat.length + 1, end).replace(/\\t/g, '\t').replace(/\\n/g, '\n') +
        s.substring(end + pat.length + 1);
    }
    return s.replace(/(\s)"(\w+)"\s*:/g, '$1$2:').replace(/"/g, '\'');
  };

  var samples = [
    {
      title : 'First Table',
      template : { thead : [[{ label : 'COL1' },{ label : 'COL2' }]] },
      code : function(table) {

        // set a three rows sample data.
        table.model.items = [ [ 'a', 'b' ], [ 'c', 'd' ], [ 'e', 'f' ] ];

        // request rendering.
        table.invalidate();
      }
    },
    {
      title : 'Styles',
      template : { thead : [
        [
          { rowSpan : 2, backgroundColor : '#ff6666' },
          { label : 'Right-Click\nMe!', colSpan : 3, color : '#f09',
            textAlign : 'right', verticalAlign : 'bottom',
            backgroundColor : '#ff6', height : 50 }
        ],[
          { label : 'A', textAlign : 'center', width : 50,
            backgroundColor : '#fc6', columnDraggable : false },
          { label : 'B', textAlign : 'center', width : 50,
            backgroundColor : '#6f6', columnResizable : false },
          { label : 'C', textAlign : 'center', width : 50,
            backgroundColor : '#66f' }
        ]
      ] },
      code : function(table) {

        // set border style.
        table.model.defaultCellStyle.borderRight = '1px solid silver';
        table.model.defaultCellStyle.borderBottom = '1px solid silver';
        table.$el.style.border = '1px solid silver';

        // set a big sample data.
        var items = [];
        for (var i = 0; i < 100000; i += 1) {
          items.push([ 'L' + (i + 1) ]);
        }
        table.model.items = items;

        // request rendering.
        table.invalidate();
      }
    },
    {
      title : 'Multi-Line Data',
      template : { thead : [
        [
          { rowSpan : 2 }, {}, {}
        ],[
        ]
      ],tbody : [
        [
          { rowSpan : 2 }, {}, {}
        ],[ { '//' : 'This cell will be shown at the second line.',
          color : 'blue' }
        ]
      ] },
      code : function(table) {

        // set border style.
        table.model.defaultCellStyle.borderRight = '1px solid silver';
        table.model.defaultCellStyle.borderBottom = '1px solid silver';
        table.$el.style.border = '1px solid silver';

        // 'd' will be spaned and not visible.
        table.model.items = [ ['a','b','c','d','e'],[],[],[],[],[] ];

        // request rendering.
        table.invalidate();
      }
    },
    {
      title : 'Named Field',
      template : { thead : [
        [
          { rowSpan : 2 }
        ],[
        ]
      ],tbody : [
        [
          { rowSpan : 2, dataField : 'a' },
          { dataField : 'b' }, { dataField : 'c' }
        ],[
          { dataField : 'd' }, { dataField : 'e' }
        ]
      ] },
      code : function(table) {

        // set border style.
        table.model.defaultCellStyle.borderRight = '1px solid silver';
        table.model.defaultCellStyle.borderBottom = '1px solid silver';
        table.$el.style.border = '1px solid silver';

        // 'd' will be shown correctly by setting dataField.
        table.model.items = [ { a: 'a', b: 'b', c: 'c', d: 'd', e: 'e' },{},{},{},{},{} ];

        // request rendering.
        table.invalidate();
      }
    },
    {
      title : 'Sort and Filter',
      template : { thead : [
        [
          { label : 'number', dataField : 'amount1' },
          { label : 'string', dataField : 'amount2' },
          { label : 'string', dataField : 'amount3',
            comparator : function(v1, v2) { return +v1 < +v2? -1 : 1; } }
        ]
      ],tbody : [
        [
          { dataField : 'amount1', dataType : 'number' },
          { dataField : 'amount2', dataType : 'number' },
          { dataField : 'amount3', dataType : 'number' }
        ]
      ] },
      code : function(table) {

        // set border style.
        table.model.defaultCellStyle.borderRight = '1px solid silver';
        table.model.defaultCellStyle.borderBottom = '1px solid silver';
        table.$el.style.border = '1px solid silver';

        // dataField of header enables sort and filter.
        // amount2 is sorted as string.
        // Although amount3 is string, sorted as number by custom comparator.
        var items = [];
        for (var i = 0; i < 10000; i += 1) {
          items.push({ amount1 : i, amount2 : '' + i, amount3 : '' + i });
        }
        table.model.items = items;

        // observe valuechange event.
        table.model.on('valuechange', function(event, detail) {
          console.log(event, detail);
        });

        // request rendering.
        table.invalidate();
      }
    },
    {
      title : 'Events',
      template : { thead : [
        [
          { label : 'string', dataField : 'val1' },
          { label : 'number', dataField : 'val2' },
          { label : 'boolean', dataField : 'val3', labelFunction :
            function(value) { return value == '1'? 'On' : 'Off'; } },
          { label : 'select-one', dataField : 'val4',
            options : [ { label : 'One', value : '1' },
                        { label : 'Two', value : '2' },
                        { label : 'Three', value : '3' } ] }
        ]
      ], tbody : [
        [
          { dataType : 'string', dataField : 'val1', maxLength : 5 },
          { dataType : 'number', dataField : 'val2' },
          { dataType : 'boolean', dataField : 'val3',
              booleanValues : [ '0', '1' ] },
          { dataType : 'select-one', dataField : 'val4',
            options : [ { label : 'One', value : '1' },
                        { label : 'Two', value : '2' },
                        { label : 'Three', value : '3' } ] }
        ]
      ] },
      code : function(table) {

        // set border style.
        table.model.defaultCellStyle.borderRight = '1px solid silver';
        table.model.defaultCellStyle.borderBottom = '1px solid silver';
        table.$el.style.border = '1px solid silver';

        var items = [];
        for (var i = 0; i < 100; i += 1) {
          items.push({
            val1 : '' + i,
            val2 : i,
            val3 : '' + (i % 2),
            val4 : '' + (i % 3 + 1) });
        }
        table.model.items = items;

        // observe events.
        table.on('mousedown', function(event, detail) {
          var mouseupHandler = function(event) {
            document.removeEventListener('mouseup', mouseupHandler);
            console.log(event, detail);
          };
          document.addEventListener('mouseup', mouseupHandler);
          console.log(event, detail);
        }).on('mouseover', function(event, detail) {
          console.log(event, detail);
        }).on('mouseout', function(event, detail) {
          console.log(event, detail);
        }).on('click', function(event, detail) {
          console.log(event, detail);
        }).on('dblclick', function(event, detail) {
          console.log(event, detail);
        }).on('contextmenu', function(event, detail) {
          console.log(event, detail);
        }).on('rendered', function(event, detail) {
          // detail.tableStates indicates what cells are rendered.
          // it's useful to request to get data to server on demand.
          console.log(event, detail, detail.tableStates[3]);
        });
        table.model.on('valuechange', function(event, detail) {
          console.log(event, detail);
        });

        // request rendering.
        table.invalidate();
      }
    },
    {
      title : 'Dynamic data request on demand',
      template : { thead : [
        [
          { label : 'COL1' },
          { label : 'COL2' },
          { label : 'COL3' }
        ]
      ] },
      code : function(table) {

        // set border style.
        table.model.defaultCellStyle.borderRight = '1px solid silver';
        table.model.defaultCellStyle.borderBottom = '1px solid silver';
        table.$el.style.border = '1px solid silver';

        var model = {
          count : 0,
          data : {},
          requestedRows : []
        };

        // override two methods.
        // then table.model.items will be ignored.
        table.model.getItemCount = function() {
          return model.count;
        };
        table.model.getItemAt = function(row) {
          if (model.data[row]) {
            // data exists.
            return model.data[row];
          } else {
            // data not exists.
            model.requestedRows.push(row);
            return {};
          }
          return model.count;
        };

        table.on('rendered', function(event, detail) {
          // detail.tableStates indicates what cells are rendered.
          // it's useful to request to get data to server on demand.
          var minRow = detail.tableStates[3].minRow - this.getLockTop();
          var maxRow = detail.tableStates[3].maxRow - this.getLockTop();
          // remove rows that is not visible.
          model.requestedRows = model.requestedRows.filter(function(row) {
            return minRow <= row && row <= maxRow;
          });
          if (model.requestedRows.length == 0) {
            // nothing to request.
            return;
          }
          ajax({ action : 'getData', rows : model.requestedRows }).done(function(data) {
            for (var row in data.rows) {
              model.data[row] = data.rows[row];
            }
            // remove if successfully get.
            model.requestedRows = model.requestedRows.filter(function(row) {
              return typeof data.rows[row] == 'undefined';
            });
            // request rendering.
            table.invalidate();
          });
        });

        // fake ajax
        var ajax = function(request) {
          var result = {
            done : function(callback) {
              this.doneCallback = callback;
            }
          };
          // emulate slow response.
          window.setTimeout(function() {
            var data = {};
            if (request.action == 'getCount') {
              data.count = 10000;
            } else if (request.action == 'getData') {
              data.rows = {};
              request.rows.forEach(function(row) {
                data.rows[row] = [ 'A' + row, 'B' + row, 'C' + row ];
              });
            }
            result.doneCallback(data);
          }, 500);
          return result;
        };

        // At first, request a count of data.
        ajax({ action : 'getCount' }).done(function(data) {
          model.count = data.count;
          // request rendering.
          table.invalidate();
        });
      }
    },
    {
      title : 'Custom Renderer',
      template : { thead : [
        [ { label : 'Button' } ]
      ],tbody : [
        [ { factory : function(td) {
              var currentCell = null;
              var oldValue = null;
              var newValue = null;
              var editing = false;
              var updateLabel = function() {
                var value = editing? newValue : currentCell.value;
                button.textContent = 'Clicked: ' + value;
              };
              var button = comfortable.util.createElement('button', {
                  style : { width: '100%', height: '100%', padding: '0px' },
                  on : { click : function(event) {
                      newValue += 1;
                      updateLabel();
                    }
                  }
                });
              td.$el.appendChild(button);
              return {
                render : function(cell) {
                  currentCell = cell;
                  updateLabel();
                },
                beginEdit : function(cell) {
                  editing = true;
                  oldValue = newValue = cell.value;
                  return {
                    focus : function() {
                      button.focus();
                    },
                    endEdit : function() {
                      editing = false;
                      button.blur();
                      return { oldValue : oldValue, newValue : newValue };
                    }
                  };
                },
                dispose : function() {
                }
              };
            }
          } ]
        ]
      },
      code : function(table) {

        // set border style.
        table.model.defaultCellStyle.borderRight = '1px solid silver';
        table.model.defaultCellStyle.borderBottom = '1px solid silver';
        table.$el.style.border = '1px solid silver';

        var items = [];
        for (var i = 0; i < 100; i += 1) {
          items.push([ 0 ]);
        }
        table.model.items = items;

        // narrower
        table.$el.style.width = '120px';

        // request rendering.
        table.invalidate();
      }
    }
  ];

  var $c = comfortable;

  // toc
  samples.forEach(function(sample, i) {
    document.getElementById('samples-toc').appendChild($c.util.createElement('li', [
      $c.util.createElement('a', {
        attrs : { href : '#sample' + (i + 1) },
        props : { textContent : sample.title } })] ) );
  });

  // contents
  samples.forEach(function(sample, i) {

    // freeze a template before creation.
    var template = stringify(sample.template);
    //
    var table = $c.fromTemplate(sample.template);
    sample.code(table);

    var code = $c.util.createElement('pre', { attrs : { 'class': 'sample-code' } },
        { props : { textContent : 'var table = comfortable.fromTemplate(' +
          template + ');\n' +
          extractCode(sample.code) +
          '\n\ndocument.body.appendChild(table.$el);'} });
    hljs.highlightBlock(code);

    document.getElementById('samples').appendChild($c.util.createElement('div',[
      $c.util.createElement('h3', {
          attrs : { id : 'sample' + (i + 1) },
          props : { textContent : sample.title } }),
      code,
      table.$el
    ]));
  });
});
