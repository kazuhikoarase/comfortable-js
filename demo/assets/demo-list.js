//
// default list
//

window.addEventListener('load', function(event) {

  var list = comfortable.createList();
  list.invalidate();
  document.getElementById('demo1').appendChild(list.$el);

});
