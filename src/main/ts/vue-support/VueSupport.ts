/**
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

  var table = {
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
      setItems : function(items : any[]) {
        this.$options.table.model.items = items;
        this.invalidate();
        return this;
      },
      getItems : function() {
        return this.$options.table.model.items;
      },
      getModel : function() {
        return this.$options.table.model;
      }
    },
    mounted : function() {

      var table = fromTemplate(this.template);

      // set default values.
      table.$el.style.width = '100%';
      table.$el.style.height = '100%';
      this.$el.style.width = this.$el.style.width || '400px';
      this.$el.style.height = this.$el.style.height || '200px';

      // emit events.
      var emitEventHandler = function(event : Event, detail : any) {
        this.$emit(event.type, event, detail);
      }.bind(this);
      [
       'mousedown', 'mouseover', 'mouseout',
       'click', 'dblclick', 'contextmenu' ].forEach(function(type) {
         table.on(type, emitEventHandler);
       });
      table.model.on('valuechange', emitEventHandler);

      // as a non-reactive property, set to $options.
      this.$options.table = table;
      this.$el.appendChild(table.$el);

      var items : string = this.items;
      this.setItems(items? JSON.parse(items) : []);

      // observe the size of table.
      util.extend(this.$options, {
        observeInterval : 50, // ms(20fps)
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
    }
  }

  export var vueComponents = {
    table : table
  }

}
