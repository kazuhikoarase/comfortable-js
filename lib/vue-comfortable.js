//
// vue-comfortable (experimental)
//
// Copyright (c) 2018 Kazuhiko Arase
//
// URL: https://github.com/kazuhikoarase/comfortable-js/
//
// Licensed under the MIT license:
//  http://www.opensource.org/licenses/mit-license.php
//

Vue.component('comfortable', {
  template: '<div class="comfortable"></div>',
  props : {
    template : { 'default' : function() {
        return {
          thead : [[ { label : 'col1' },{ label : 'col2' },{ label : 'col3' }]]
        };
      } },
  },
  methods: {
    invalidate : function() {
      this.$options.table.invalidate();
      return this;
    },
    setItems : function(items) {
      this.$options.table.model.items = items;
      this.invalidate();
      return this;
    },
    getItems : function() {
      return this.$options.table.model.items;
    },
    getModel : function() {
      return this.$options.table.model;
    },
    getLockRow : function() {
      return this.$options.table.getLockRow();
    },
    getLockColumn : function() {
      return this.$options.table.getLockColumn();
    }
  },
  mounted : function() {

    var template = this.template;

    if (template.thead && !template.tbody) {
      // set default tbody if not exists.
      var cloneIfExists = function(src, props) {
        var dst = {};
        props.forEach(function(prop) {
          !src[prop] || (dst[prop] = src[prop]);
        });
        return dst;
      };
      var props = [ 'colSpan', 'rowSpan', 'dataField' ];
      template.tbody = template.thead.map(function(tr) {
        return tr.map(function(headCell) {
          return cloneIfExists(headCell, props);
        });
      });
    }

    var table = comfortable.fromTemplate(template);
    // set default values.
    table.$el.style.width = '100%';
    table.$el.style.height = '100%';
    this.$el.style.width = this.$el.style.width || '400px';
    this.$el.style.height = this.$el.style.height || '200px';

    // emit events.
    var emitEventHandler = function(event, detail) {
      this.$emit(event.type, event, detail);
    }.bind(this);
    [
     'mousedown', 'mouseover', 'mouseout',
     'click', 'dblclick', 'contextmenu' ].forEach(function(type) {
       table.model.on('mouseup', emitEventHandler);
     });
    table.model.on('valuechange', emitEventHandler);

    // as a non-reactive property, set to $options.
    this.$options.table = table;
    this.$el.appendChild(table.$el);

    this.setItems(this.items? JSON.parse(this.items) : []);

    // observe the size of table.
    Vue.util.extend(this.$options, {
      observeInterval : 20, // ms(50fps)
      alive : true, lastSize : { width : 0, height : 0 }
    });
    var observeSize = function() {
      var size = {
        width : this.$el.offsetWidth,
        height : this.$el.offsetHeight
      };
      if (size.width != this.$options.lastSize.width ||
          size.height != this.$options.lastSize.height) {
        this.$options.lastSize = size;
        this.invalidate();
      }
      if (this.$options.alive) {
        window.setTimeout(observeSize, this.$options.observeInterval);
      }
    }.bind(this);
    window.setTimeout(observeSize, this.$options.observeInterval);
  },
  beforeDestroy : function() {
    // stop observing
    this.$options.alive = false;
  },
});
