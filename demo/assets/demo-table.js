//
// default table
//

window.addEventListener('load', function(event) {

  var table = comfortable.createTable();
  table.invalidate();
  document.getElementById('demo1').appendChild(table.$el);

});
