//
// comfortable - list
//
// Copyright (c) 2018 Kazuhiko Arase
//
// URL: https://github.com/kazuhikoarase/comfortable-js/
//
// Licensed under the MIT license:
//  http://www.opensource.org/licenses/mit-license.php
//

namespace comfortable {

  'use strict';

  var $c = comfortable;

  export interface List extends UIEventTarget {
    $el : Element;
    getItemAt : (index : number) => any;
    getItemCount : () => number;
    createCell : () => { $el : Element };
    renderCell : (cell : ListCell, item :any) => void;
    cellHeight : number;
  }

  export interface ListCell {
    $el : HTMLElement;
  }

  export var createList = function() : List {

    var util = $c.util;

    var listContent = util.createElement('div', {
      style : { position : 'absolute' } });
    var list = { $el :  util.createElement('div', {
      style : { position : 'absolute',
        overflow : 'hidden', whiteSpace:'nowrap' } }, [ listContent ]) };

    var scr = util.createElement('div', {
      style : { position : 'absolute' } });

    var viewPane = util.createElement('div', {
        style : { position : 'absolute',
          overflowX : 'hidden', overflowY : 'auto' },
        on : { scroll : function(event) { $public.render(); } }
      }, [scr]);
  
    var frame = util.createElement('div', {
        style : { position : 'relative', overflow : 'hidden',
          width : '100px', height : '100px' },
        on : {
          wheel : function(event) {
            viewPane.scrollLeft += event.deltaX;
            viewPane.scrollTop += event.deltaY;
          }
        } },[ viewPane, list.$el ]);

    var cells : ListCell[] = [];
    var getOrCrt = function(index : number) {
      if (index < cells.length) {
        return cells[index];
      }
      var cell = $public.createCell();
      listContent.appendChild(cell.$el);
      cells.push(cell);
      return cell;
    };

    var $public = util.extend($c.createUIEventTarget(), {
      $el : frame,
      getItemAt : function(index : number) { return 'item' + index; },
      getItemCount : function() { return 100000; },
      createCell : function() {
        return { $el : $c.util.createElement('div', {
          props : { textContent : 'M' },
          style : { borderBottom : '1px solid silver' }
        }) };
      },
      renderCell : function(cell : ListCell, item : string) {
        cell.$el.textContent = item;
      },
      cellHeight : -1,
      render : function() {

        util.set(viewPane, { style : {
          left : '0px', top : '0px',
          width : this.$el.offsetWidth + 'px',
          height : this.$el.offsetHeight + 'px'
        } });

        if (this.cellHeight == -1) {
          this.cellHeight = getOrCrt(0).$el.offsetHeight;
        }
        var viewHeight = this.cellHeight * this.getItemCount();
        var scrHeight = Math.min(viewHeight, 1E6);

        var listTop = -(scrHeight > viewPane.clientHeight?
            util.translate(viewPane.scrollTop,
            0, scrHeight - viewPane.clientHeight,
            0, viewHeight - viewPane.clientHeight,
            'list.top') : 0);

        var minRow = Math.floor(-listTop / this.cellHeight);
        var maxRow = Math.min(this.getItemCount() - 1,
            Math.floor( (-listTop + viewPane.clientHeight) / this.cellHeight) );
        var top = listTop + minRow * this.cellHeight;

        util.set(listContent, { style : { left : '0px', top : top + 'px' } });

        var cellIndex = 0;
        for (var row = minRow; row <= maxRow; row += 1) {
          var cell = getOrCrt(cellIndex);
          cell.row = row;
          cell.$el.style.display = '';
          this.renderCell(cell, this.getItemAt(row) );
          cellIndex += 1;
        }
        for (; cellIndex < cells.length; cellIndex += 1) {
          cells[cellIndex].$el.style.display = 'none';
        }

        util.set(scr, { style : {
          left : '0px', top : '0px',
          width : this.$el.offsetWidth + 'px',
          height : scrHeight + 'px'
        } });

        util.set(list.$el, { style : {
          whiteSpace : 'nowrap',
          width : viewPane.clientWidth + 'px',
          height : viewPane.clientHeight + 'px'
        } });

        this.trigger('rendered', {
          listState : { minRow : minRow, maxRow : maxRow } } );
      }
    });

    return $public;
  };
}
