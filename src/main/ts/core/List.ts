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

/// <reference path="UIEventTarget.ts" />

namespace comfortable {

  export interface List<T,C extends ListCell> extends UIEventTarget {
    $el : HTMLElement;
    getItemAt : (index : number) => T;
    getItemCount : () => number;
    createCell : () => C;
    renderCell : (cell : C, item : T) => void;
    cellHeight : number;
  }

  export interface ListCell {
    $el : HTMLElement;
    row : number;
  }

  /**
   * @internal
   */
  export class ListImpl<T,C extends ListCell>
  extends UIEventTargetImpl implements List<T,C> {

    private listContent = util.createElement('div', {
      style : { position : 'absolute' } });
    private list = { $el :  util.createElement('div', {
      style : { position : 'absolute',
        overflow : 'hidden', whiteSpace:'nowrap' } }, [ this.listContent ]) };

    private scr = util.createElement('div', {
      style : { position : 'absolute' } });

    private viewPane = util.createElement('div', {
        style : { position : 'absolute',
          overflowX : 'hidden', overflowY : 'auto' },
        on : { scroll : (event) => { this.render(); } }
      }, [this.scr]);
  
    private frame = util.createElement('div', {
        style : { position : 'relative', overflow : 'hidden',
          width : '100px', height : '100px' },
        on : {
          wheel : (event) => {
            this.viewPane.scrollLeft += event.deltaX;
            this.viewPane.scrollTop += event.deltaY;
          }
        } },[ this.viewPane, this.list.$el ]);

    private cells : C[] = [];
    private getOrCrt(index : number) {
      if (index < this.cells.length) {
        return this.cells[index];
      }
      var cell = this.createCell();
      this.listContent.appendChild(cell.$el);
      this.cells.push(cell);
      return cell;
    };

    public $el = this.frame;
    public getItemAt(index : number) : T { return <any>'item' + index; }
    public getItemCount() { return 100000; }
    public createCell() : C {
      return <any>{ $el : util.createElement('div', {
        props : { textContent : 'M' },
        style : { borderBottom : '1px solid silver' }
      }), row : -1 };
    }
    public renderCell(cell : C, item : T) {
      cell.$el.textContent = <any>item;
    }
    public cellHeight = -1;
    public render() {

      util.set(this.viewPane, { style : {
        left : '0px', top : '0px',
        width : this.$el.offsetWidth + 'px',
        height : this.$el.offsetHeight + 'px'
      } });

      if (this.cellHeight == -1) {
        this.cellHeight = this.getOrCrt(0).$el.offsetHeight;
      }
      var viewHeight = this.cellHeight * this.getItemCount();
      var scrHeight = Math.min(viewHeight, 1E6);

      var listTop = -(scrHeight > this.viewPane.clientHeight?
          util.translate(this.viewPane.scrollTop,
          0, scrHeight - this.viewPane.clientHeight,
          0, viewHeight - this.viewPane.clientHeight,
          'list.top') : 0);

      var minRow = Math.floor(-listTop / this.cellHeight);
      var maxRow = Math.min(this.getItemCount() - 1,
          Math.floor( (-listTop + this.viewPane.clientHeight) / this.cellHeight) );
      var top = listTop + minRow * this.cellHeight;

      util.set(this.listContent, { style : { left : '0px', top : top + 'px' } });

      var cellIndex = 0;
      for (var row = minRow; row <= maxRow; row += 1) {
        var cell = this.getOrCrt(cellIndex);
        cell.row = row;
        cell.$el.style.display = '';
        this.renderCell(cell, this.getItemAt(row) );
        cellIndex += 1;
      }
      for (; cellIndex < this.cells.length; cellIndex += 1) {
        this.cells[cellIndex].$el.style.display = 'none';
      }

      util.set(this.scr, { style : {
        left : '0px', top : '0px',
        width : this.$el.offsetWidth + 'px',
        height : scrHeight + 'px'
      } });

      util.set(this.list.$el, { style : {
        whiteSpace : 'nowrap',
        width : this.viewPane.clientWidth + 'px',
        height : this.viewPane.clientHeight + 'px'
      } });

      this.trigger('rendered', {
        listState : { minRow : minRow, maxRow : maxRow } } );
    }
  }

}
