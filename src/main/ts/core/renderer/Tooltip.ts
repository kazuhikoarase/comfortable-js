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
    show : (text : string) => void;
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
          tabindex: '-1', focusable: 'false',
          'class' : '${prefix}-tooltip-corner' } }, [
        util.createSVGElement('path', {
          attrs : { d : 'M0 0L' + size + ' 0L' + size + ' ' + size + 'Z' }
        })
      ]),
      text : '',
      show : function(text : string) {
        this.text = text;
        this.$el.style.display = text? '' : 'none';
      },
      dispose : function() {
        util.$(td.$el)
          .off('mouseover', mouseoverHandler)
          .off('mouseout', mouseoutHandler);
        dispose();
      }
    };
    return mark;
  };

  var calcOffset = function(td : TdWrapper) {
    var off = util.offset(td.$el);
    var frame = util.closest(td.$el, { tagName : 'DIV' });
    var frameOff = util.offset(frame);
    var offsetWidth = td.$el.offsetWidth;
    var displayWidth = offsetWidth;
    /*
    if (off.left + displayWidth > frameOff.left + frame.offsetWidth) {
      displayWidth = frameOff.left + frame.offsetWidth - off.left;
    }
    */
    return {
      left : off.left,
      top : off.top,
      offsetWidth : offsetWidth,
      displayWidth : displayWidth
    };
  };

  var showTooltip = function(td : TdWrapper, text : string) {

    var barW = 10;
    var barH = 6;

    var off = calcOffset(td);

    var box = util.createElement('div', {
      style : { position : 'absolute' },
      attrs : { 'class' : '${prefix}-tooltip-box' } });
    createMultiLineLabelRenderer(box).setLabel(text);
    document.body.appendChild(box);

    var rblt = off.left + off.displayWidth + barW + box.offsetWidth <
      document.documentElement.scrollLeft + window.innerWidth;
    var bar = util.createSVGElement('svg', {
        style : { position : 'absolute' },
        attrs : { width : '' + barW, height : '' + barH,
          tabindex: '-1', focusable: 'false' } },
      [ util.createSVGElement('path', {
          attrs : { d : rblt?
            'M0 ' + barH + 'L' + barW + ' 0' :
            'M0 0L' + barW + ' ' + barH } }) ]);
    document.body.appendChild(bar);

    var cs = window.getComputedStyle(box, null);
    bar.style.stroke = cs.borderColor || cs.borderBottomColor;
    bar.style.fill = 'none';

    if (rblt) {
      box.style.left = (off.left + off.displayWidth + barW - 1) + 'px';
      box.style.top = (off.top - barH + 1) + 'px';
      bar.style.left = (off.left + off.displayWidth) + 'px';
      bar.style.top = (off.top - barH + 1) + 'px';
    } else {
      box.style.left = (off.left + off.displayWidth - barW - box.offsetWidth + 1) + 'px';
      box.style.top = (off.top - barH - box.offsetHeight + 1) + 'px';
      bar.style.left = (off.left + off.displayWidth - barW) + 'px';
      bar.style.top = (off.top - barH + 1) + 'px';
    }

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
          tooltip.show(cell.tooltip);
        } else {
          if (tooltip) {
            tooltip.show('');
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
