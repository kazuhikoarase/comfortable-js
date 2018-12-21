//
// default list
//

window.addEventListener('load', function(event) {

  var list = new comfortable.ListImpl();
  list.invalidate();
  document.getElementById('demo1').appendChild(list.$el);

});
