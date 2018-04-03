//
// table from template
//

var tableFromTemplate = function(targetId) {

  var $c = comfortable;

  var masterData1 = [
    { grpCd : '01', text : 'Group1' },
    { grpCd : '02', text : 'Group2' },
    { grpCd : '03', text : 'Group3' }
  ];

  var masterData2 = [
    { grpCd : '01', cd : '01', text : 'Group1-1' },
    { grpCd : '01', cd : '02', text : 'Group1-2' },
    { grpCd : '01', cd : '03', text : 'Group1-3' },
    { grpCd : '01', cd : '04', text : 'Group1-4' },
    { grpCd : '02', cd : '05', text : 'Group2-1' },
    { grpCd : '02', cd : '06', text : 'Group2-2' },
    { grpCd : '03', cd : '07', text : 'Group3-1' },
    { grpCd : '03', cd : '08', text : 'Group3-2' },
    { grpCd : '03', cd : '09', text : 'Group3-3' }
  ];

  var options = [ { grpCd : '', text : '' } ].concat(masterData1);

  var options2 = function(row, col) {
    if (row < 1) {
      return masterData2;
    } else {
      var itemIndex = table.model.getItemIndexAt(row, col);
      var grpCd = table.model.getItemAt(itemIndex.row).myData2;
      return [ { cd : '', text : '' } ].concat(masterData2.filter(function(item) {
        return item.grpCd == grpCd;
      }));
    }
  };

  var table = $c.fromTemplate({
    thead : [[
      { label : 'A', width : 140, backgroundColor : '#ff6666', textAlign : 'center',
        dataField : 'myData1' },
      { label : 'B', width : 100, backgroundColor : '#ffcc66', textAlign : 'center',
        dataField : 'myData2', dataType : 'select-one',
        options : options, labelField : 'text', valueField : 'grpCd' },
      { label : 'C', width : 100, backgroundColor : '#66ff66', textAlign : 'center',
        dataField : 'myData3', dataType : 'select-one',
        options : options2, labelField : 'text', valueField : 'cd' },
      { label : 'D', width : 80, backgroundColor : '#66ffcc', textAlign : 'center',
        dataField : 'myData4', comparator : function(v1, v2) {
            return +v1 < +v2? -1 : 1;
          }},
      { label : 'E', width : 80, backgroundColor : '#6666ff', textAlign : 'center' },
      { label : 'F', width : 100, backgroundColor : '#cc66ff', textAlign : 'center' }
    ]],
    tbody : [
      [
        { dataField : 'myData1' },
        { dataField : 'myData2', dataType : 'select-one',
          options : options, labelField : 'text', valueField : 'grpCd' },
        { dataField : 'myData3', dataType : 'select-one',
          options : options2, labelField : 'text', valueField : 'cd' },
        { dataField : 'myData4', dataType : 'number' },
        { dataField : 'myData5', dataType : 'number', decimalDigits : 2 },
        { dataField : 'myData6', dataType : 'boolean', textAlign : 'center' }
      ],
      [ {} ]
    ]
  });
  table.model.items = function() {
    var items = [];
    for (var i = 0; i < 10000; i += 1) {
      items.push({
        myData1 : 'Data' + i,
        myData2 : options[i % options.length].grpCd,
        myData3 : '',
        myData4 : '' + i,
        myData5 : '' + i,
        myData6 : i % 2 == 0
      });
    }
    return items;
  }();
  table.model.on('valuechange', function(event, detail) {
    if (detail.row < 1) {
    } else {
      console.log(event, detail);
      if (detail.itemIndex.col == 'myData2') {
        // clear myData3
        this.getItemAt(detail.itemIndex.row).myData3 = '';
      }
    }
  });
  table.$el.style.width = '600px';
  table.$el.style.height  = '400px';
  table.$el.setAttribute('class', 'my-table');
  table.invalidate();
$g = $c;

  table.$el.style.display = 'none';
  $g.util.$(document.body).on('click', function() {
    // 表示されない
    table.$el.style.display = '';
  });

  table.invalidate();

  document.getElementById(targetId).appendChild(table.$el);

};
