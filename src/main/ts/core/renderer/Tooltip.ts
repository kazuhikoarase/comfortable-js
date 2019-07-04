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

namespace comfortable.renderer {


  interface Tooltip {
    $el : HTMLElement;
    text : string;
    dispose : () => void;
  }

  var createTooltip = function(td : TdWrapper) : Tooltip {
    var size = 6;
    var tooltip : { dispose : () => void } = null;
    var mouseoverHandler = function(event : any) {
      if (!mark.text) {
        return;
      }
      dispose();
      tooltip = showTooltip(td, mark.text);
    };
    var mouseoutHandler = function(event : any) {
      dispose();
    };
    var dispose = function() {
      if (tooltip) {
        tooltip.dispose();
        tooltip = null;
      }
    };
    util.$(td.$el)
      .on('mouseover', mouseoverHandler)
      .on('mouseout', mouseoutHandler);
    var mark = {
      $el : util.createSVGElement('svg', {
        style : { position : 'absolute', right : '0px', top : '0px'},
          attrs : { width : '' + size, height : '' + size,
        'class' : '${prefix}-tooltip-corner' } }, [
        util.createSVGElement('path', {
          attrs : { d : 'M0 0L' + size + ' 0L' + size + ' ' + size + 'Z' }
        })
      ]),
      text : '',
      dispose : function() {
        util.$(td.$el)
          .off('mouseover', mouseoverHandler)
          .off('mouseout', mouseoutHandler);
        dispose();
      }
    };
    return mark;
  };

  var showTooltip = function(td : TdWrapper, text : string) {

    var barW = 10;
    var barH = 6;

    var box = util.createElement('div', {
      style : { position : 'absolute' },
      attrs : { 'class' : '${prefix}-tooltip-box' } });
    var bar = util.createSVGElement('svg', {
        style : { position : 'absolute' },
        attrs : { width : '' + barW, height : '' + barH } },
      [ util.createSVGElement('path', {
          attrs : { d : 'M0 ' + barH + 'L' + barW + ' 0' } }) ]);
    document.body.appendChild(box);
    document.body.appendChild(bar);

    var cs = window.getComputedStyle(box, null);
    bar.style.stroke = cs.borderColor || cs.borderBottomColor;
    bar.style.fill = 'none';

    var off = util.offset(td.$el);
    //box.textContent = text;
    createMultiLineLabelRenderer(box).setLabel(text);

    box.style.left = (off.left + td.$el.offsetWidth + barW - 1) + 'px';
    box.style.top = (off.top - barH + 1) + 'px';
    bar.style.left = (off.left + td.$el.offsetWidth) + 'px';
    bar.style.top = (off.top - barH + 1) + 'px';

    return {
      dispose : function() {
        document.body.removeChild(box);
        document.body.removeChild(bar);
      }
    };
  };

  export var attachTooltipFeature = function(
      td : TdWrapper, renderer : TableCellRenderer) : TableCellRenderer {

    var tooltip : Tooltip = null;

    return {
      getCellStyle : renderer.getCellStyle,
      render : function(cell) {
        if (cell.tooltip) {
          if (!tooltip) {
            tooltip = createTooltip(td);
            td.$el.appendChild(tooltip.$el);
          }
          tooltip.text = cell.tooltip;
          tooltip.$el.style.display = '';
        } else {
          if (tooltip) {
            tooltip.text = '';
            tooltip.$el.style.display = 'none';
          }
        }
        renderer.render(cell);
      },
      beginEdit : renderer.beginEdit,
      dispose : function() {
        renderer.dispose();
        if (tooltip) {
          tooltip.dispose();
          tooltip = null;
        }
      }
    };
  };
}