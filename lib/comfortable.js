var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
/*!
 * comfortable
 *
 * Copyright (c) 2018 Kazuhiko Arase
 *
 * URL: https://github.com/kazuhikoarase/comfortable-js/
 *
 * Licensed under the MIT license:
 *  http://www.opensource.org/licenses/mit-license.php
 */
var comfortable;
(function (comfortable) {
    'use strict';
    var TextEditor = /** @class */ (function () {
        function TextEditor(opts) {
            this.$el = comfortable.util.createElement('input', {
                attrs: { type: 'text', 'class': '${prefix}-editor' }
            });
            this._$el = this.$el;
            this.opts = opts;
        }
        TextEditor.prototype.beginEdit = function (td, cell) {
            var cs = window.getComputedStyle(td.$el, null);
            var opts = {
                props: {},
                style: {
                    textAlign: cs.textAlign,
                    verticalAlign: cs.verticalAlign,
                    color: cs.color,
                    backgroundColor: cs.backgroundColor,
                    fontFamily: cs.fontFamily,
                    fontSize: cs.fontSize,
                    fontWeight: cs.fontWeight
                }
            };
            if (typeof cell.maxLength == 'number') {
                opts.props.maxLength = cell.maxLength;
            }
            comfortable.util.set(this.$el, opts);
        };
        TextEditor.prototype.focus = function () {
            this.$el.focus();
            this._$el.select();
        };
        TextEditor.prototype.blur = function () {
            this.$el.blur();
        };
        TextEditor.prototype.setValue = function (value) {
            this._$el.value = value;
            this.valueType = typeof value;
        };
        TextEditor.prototype.getValue = function () {
            if (this.opts.dataType == 'number') {
                var value = comfortable.util.formatNumber(comfortable.util.toNarrowNumber(this._$el.value), this.opts.decimalDigits, '');
                return this.valueType == 'number' ? +value : value;
            }
            return this._$el.value;
        };
        TextEditor.prototype.isValid = function () {
            if (this.opts.dataType == 'number') {
                return !!comfortable.util.toNarrowNumber(this.getValue()).match(comfortable.util.numRe);
            }
            return true;
        };
        return TextEditor;
    }());
    var CheckBox = /** @class */ (function () {
        function CheckBox(opts) {
            this.booleanValues = null;
            this.$el = comfortable.util.createElement('input', {
                attrs: { type: 'checkbox', 'class': '${prefix}-editor' }
            });
            this._$el = this.$el;
            this.opts = opts;
        }
        CheckBox.prototype.beginEdit = function (td, cell) {
            var cs = window.getComputedStyle(td.$el, null);
            comfortable.util.set(this.$el, {
                style: {}
            });
            this.booleanValues = cell.booleanValues || [false, true];
        };
        CheckBox.prototype.focus = function () {
            this.$el.focus();
        };
        CheckBox.prototype.blur = function () {
            this.$el.blur();
        };
        CheckBox.prototype.setValue = function (value) {
            this._$el.checked = (value === this.booleanValues[1]);
        };
        CheckBox.prototype.getValue = function () {
            return this.booleanValues[this._$el.checked ? 1 : 0];
        };
        CheckBox.prototype.isValid = function () {
            return true;
        };
        return CheckBox;
    }());
    var SelectBox = /** @class */ (function () {
        function SelectBox(opts) {
            this.$el = comfortable.util.createElement('select', {
                attrs: { 'class': '${prefix}-editor' }
            });
            this._$el = this.$el;
            this.opts = opts;
        }
        SelectBox.prototype.beginEdit = function (td, cell) {
            var cs = window.getComputedStyle(td.$el, null);
            comfortable.util.set(this.$el, {
                style: {
                    textAlign: cs.textAlign,
                    verticalAlign: cs.verticalAlign,
                    color: cs.color,
                    backgroundColor: cs.backgroundColor,
                    fontFamily: cs.fontFamily,
                    fontSize: cs.fontSize,
                    fontWeight: cs.fontWeight
                }
            });
            var options = SelectBox.getOptions(cell);
            while (this.$el.childNodes.length < options.length) {
                this.$el.appendChild(comfortable.util.createElement('option'));
            }
            var labelField = cell.labelField || 'label';
            var valueField = cell.valueField || 'value';
            var i = 0;
            for (; i < options.length; i += 1) {
                var option = options[i];
                comfortable.util.set(this.$el.childNodes[i], {
                    style: { display: '' },
                    props: { textContent: option[labelField],
                        value: option[valueField] }
                });
            }
            while (this.$el.childNodes.length > options.length) {
                this.$el.removeChild(this.$el.lastChild);
            }
            // IE9 does not support style.display=none.
            /*
            for (;i < select.childNodes.length; i += 1) {
              select.childNodes[i].style.display = 'none';
            }
            */
        };
        SelectBox.prototype.focus = function () {
            this.$el.focus();
        };
        SelectBox.prototype.blur = function () {
            this.$el.blur();
        };
        SelectBox.prototype.setValue = function (value) {
            this._$el.value = value;
        };
        SelectBox.prototype.getValue = function () {
            return this._$el.value;
        };
        SelectBox.prototype.isValid = function () {
            return true;
        };
        SelectBox.getOptions = function (cell) {
            var options = cell.options;
            if (typeof options == 'function') {
                options = options(cell.row, cell.col);
            }
            return options || [];
        };
        return SelectBox;
    }());
    comfortable.createDefaultCellRendererFactoryOpts = function () {
        return {
            // value to label
            labelFunction: function (value, cell) {
                if (typeof cell.labelFunction == 'function') {
                    return cell.labelFunction(value, cell);
                }
                else if (value === null || typeof value == 'undefined') {
                    return '';
                }
                else if (this.dataType == 'number') {
                    return comfortable.util.formatNumber(value, this.decimalDigits);
                }
                else if (this.dataType == 'select-one') {
                    var options = SelectBox.getOptions(cell);
                    if (typeof options.splice != 'function') {
                        // not an Array.
                        return options[value] || '';
                    }
                    var labelField = cell.labelField || 'label';
                    var valueField = cell.valueField || 'value';
                    for (var i = 0; i < options.length; i += 1) {
                        var option = options[i];
                        if (option[valueField] == value) {
                            return option[labelField];
                        }
                    }
                    return '';
                }
                else {
                    // by default, to string.
                    return '' + value;
                }
            },
            // create an editor
            createEditor: function () {
                if (this.dataType == 'select-one') {
                    return new SelectBox(this);
                }
                else if (this.dataType == 'boolean') {
                    return new CheckBox(this);
                }
                return new TextEditor(this);
            }
        };
    };
    comfortable.createDefaultCellRendererFactory = function (opts) {
        opts = comfortable.util.extend(comfortable.createDefaultCellRendererFactoryOpts(), opts || {});
        return function (td) {
            var labelRenderer = comfortable.createMultiLineLabelRenderer(td.$el);
            var editor = null;
            var oldValue = null;
            var beginEdit = function (cell) {
                if (editor == null) {
                    editor = opts.createEditor();
                    td.$el.appendChild(editor.$el);
                }
                labelRenderer.setVisible(false);
                editor.beginEdit(td, cell);
                editor.$el.style.display = '';
                editor.setValue(oldValue = cell.value);
            };
            var renderIsEditor = opts.renderIsEditor;
            if (typeof renderIsEditor == 'undefined') {
                renderIsEditor = opts.dataType == 'boolean' ||
                    opts.dataType == 'select-one';
            }
            var editing = false;
            return {
                render: function (cell) {
                    if (!renderIsEditor) {
                        labelRenderer.setLabel(opts.labelFunction(cell.value, cell));
                        if (opts.dataType == 'number') {
                            td.$el.style.textAlign = 'right';
                        }
                    }
                    else {
                        // render is editor.
                        if (!editing) {
                            beginEdit(cell);
                        }
                    }
                },
                beginEdit: function (cell) {
                    editing = true;
                    beginEdit(cell);
                    return {
                        focus: function () {
                            editor.focus();
                        },
                        endEdit: function () {
                            editing = false;
                            if (!renderIsEditor) {
                                labelRenderer.setVisible(true);
                                editor.$el.style.display = 'none';
                            }
                            else {
                                editor.blur();
                            }
                            return { oldValue: oldValue,
                                newValue: editor.isValid() ? editor.getValue() : oldValue };
                        }
                    };
                },
                dispose: function () {
                }
            };
        };
    };
    var linesRe = /\r?\n/g;
    comfortable.createMultiLineLabelRenderer = function (parent) {
        var elms = null;
        return {
            setLabel: function (label) {
                if (elms == null) {
                    elms = [document.createElement('span')];
                    parent.appendChild(elms[0]);
                }
                var lines = label.split(linesRe);
                elms[0].textContent = lines[0];
                var elmIndex = 1;
                for (var i = 1; i < lines.length; i += 1) {
                    if (elmIndex + 1 >= elms.length) {
                        elms.push(document.createElement('br'));
                        elms.push(document.createElement('span'));
                        parent.appendChild(elms[elmIndex]);
                        parent.appendChild(elms[elmIndex + 1]);
                    }
                    elms[elmIndex].style.display = '';
                    elms[elmIndex + 1].style.display = '';
                    elms[elmIndex + 1].textContent = lines[i];
                    elmIndex += 2;
                }
                for (; elmIndex < elms.length; elmIndex += 1) {
                    elms[elmIndex].style.display = 'none';
                }
            },
            setVisible: function (visible) {
                if (elms != null) {
                    for (var i = 0; i < elms.length; i += 1) {
                        elms[i].style.display = visible ? '' : 'none';
                    }
                }
            }
        };
    };
})(comfortable || (comfortable = {}));
/*!
 * comfortable
 *
 * Copyright (c) 2018 Kazuhiko Arase
 *
 * URL: https://github.com/kazuhikoarase/comfortable-js/
 *
 * Licensed under the MIT license:
 *  http://www.opensource.org/licenses/mit-license.php
 */
var comfortable;
(function (comfortable) {
    'use strict';
    /**
     * @internal
     */
    var EventTargetImpl = /** @class */ (function () {
        function EventTargetImpl() {
            this.map = {};
        }
        EventTargetImpl.prototype.listeners = function (type) {
            return this.map[type] || (this.map[type] = []);
        };
        EventTargetImpl.prototype.trigger = function (type, detail) {
            var ctx = this;
            (this.listeners(type)).forEach(function (listener) {
                listener.call(ctx, { type: type }, detail);
            });
            return this;
        };
        EventTargetImpl.prototype.on = function (type, listener) {
            this.listeners(type).push(listener);
            return this;
        };
        EventTargetImpl.prototype.off = function (type, listener) {
            this.map[type] = this.listeners(type).filter(function (l) {
                return listener != l;
            });
            return this;
        };
        return EventTargetImpl;
    }());
    comfortable.EventTargetImpl = EventTargetImpl;
})(comfortable || (comfortable = {}));
/*!
 * comfortable
 *
 * Copyright (c) 2018 Kazuhiko Arase
 *
 * URL: https://github.com/kazuhikoarase/comfortable-js/
 *
 * Licensed under the MIT license:
 *  http://www.opensource.org/licenses/mit-license.php
 */
/// <reference path="EventTarget.ts" />
var comfortable;
(function (comfortable) {
    'use strict';
    /**
     * @internal
     */
    var DefaultTableModel = /** @class */ (function (_super) {
        __extends(DefaultTableModel, _super);
        function DefaultTableModel() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.defaultCellWidth = 100;
            _this.defaultCellHeight = 28;
            _this.defaultCellStyle = { rowSpan: 1, colSpan: 1, editable: true };
            _this.defaultCellRendererFactory = comfortable.createDefaultCellRendererFactory();
            _this.maxRowSpan = 8;
            _this.maxColSpan = 8;
            _this.minCellWidth = 8;
            return _this;
        }
        DefaultTableModel.prototype.getRowCount = function () { return 1E5; };
        DefaultTableModel.prototype.getColumnCount = function () { return 1E5; };
        DefaultTableModel.prototype.getLineRowAt = function (row) { return row; };
        DefaultTableModel.prototype.getLineRowCountAt = function (row) { return this.getRowCount(); };
        DefaultTableModel.prototype.getValueAt = function (row, col) { return row + ',' + col; };
        DefaultTableModel.prototype.getCellStyleAt = function (row, col) { return {}; };
        DefaultTableModel.prototype.getCellRendererFactoryAt = function (row, col) { return this.defaultCellRendererFactory; };
        DefaultTableModel.prototype.getCellWidthAt = function (col) { return this.defaultCellWidth; };
        DefaultTableModel.prototype.getCellHeightAt = function (row) { return this.defaultCellHeight; };
        DefaultTableModel.prototype.getCellAt = function (row, col) {
            return comfortable.util.extend({
                row: row, col: col, value: this.getValueAt(row, col)
            }, this.defaultCellStyle, this.getCellStyleAt(row, col));
        };
        DefaultTableModel.prototype.checkSpaned = function (row, col) {
            var minRow = Math.max(0, row - this.maxRowSpan);
            var minCol = Math.max(0, col - this.maxColSpan);
            for (var r = row; r >= minRow; r -= 1) {
                for (var c = col; c >= minCol; c -= 1) {
                    if (r != row || c != col) {
                        var cell = this.getCellAt(r, c);
                        if (row < r + cell.rowSpan && col < c + cell.colSpan) {
                            return { row: r, col: c };
                        }
                    }
                }
            }
            return null;
        };
        DefaultTableModel.prototype.isColumnResizableAt = function (col) { return true; };
        DefaultTableModel.prototype.isColumnDraggableAt = function (col) { return true; };
        return DefaultTableModel;
    }(comfortable.EventTargetImpl));
    comfortable.DefaultTableModel = DefaultTableModel;
})(comfortable || (comfortable = {}));
/*!
 * comfortable
 *
 * Copyright (c) 2018 Kazuhiko Arase
 *
 * URL: https://github.com/kazuhikoarase/comfortable-js/
 *
 * Licensed under the MIT license:
 *  http://www.opensource.org/licenses/mit-license.php
 */
var comfortable;
(function (comfortable) {
    var i18n;
    (function (i18n) {
        'use strict';
        i18n.getInstance = function (lang) {
            lang = lang || navigator.language || navigator.userLanguage;
            var _i18n = i18n;
            return (comfortable.util.extend({}, _i18n.en, _i18n[lang] ||
                _i18n[lang.replace(/\-\w+$/, '')] || {}));
        };
        i18n.getMessages = function () {
            return comfortable.util.extend(this.getInstance('en').messages, this.getInstance().messages);
        };
    })(i18n = comfortable.i18n || (comfortable.i18n = {}));
})(comfortable || (comfortable = {}));
/*!
 * comfortable
 *
 * Copyright (c) 2018 Kazuhiko Arase
 *
 * URL: https://github.com/kazuhikoarase/comfortable-js/
 *
 * Licensed under the MIT license:
 *  http://www.opensource.org/licenses/mit-license.php
 */
/// <reference path="EventTarget.ts" />
var comfortable;
(function (comfortable) {
    'use strict';
    /**
     * @internal
     */
    var UIEventTargetImpl = /** @class */ (function (_super) {
        __extends(UIEventTargetImpl, _super);
        function UIEventTargetImpl() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.valid = true;
            return _this;
        }
        UIEventTargetImpl.prototype.invalidate = function () {
            this.valid = false;
            comfortable.util.callLater(function () {
                if (!this.valid) {
                    this.valid = true;
                    this.render();
                }
            }.bind(this));
        };
        UIEventTargetImpl.prototype.render = function () {
        };
        return UIEventTargetImpl;
    }(comfortable.EventTargetImpl));
    comfortable.UIEventTargetImpl = UIEventTargetImpl;
})(comfortable || (comfortable = {}));
/*!
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
var comfortable;
(function (comfortable) {
    'use strict';
    var createTableState = function () {
        return {
            left: 0, top: 0, width: 0, height: 0,
            minRow: 0, maxRow: 0, minCol: 0, maxCol: 0,
            indexById: {}
        };
    };
    /**
     * @internal
     */
    var InternalTableImpl = /** @class */ (function () {
        function InternalTableImpl() {
            var _this = this;
            this._colgroup = comfortable.util.createElement('colgroup');
            this._tbody = comfortable.util.createElement('tbody');
            this.table = comfortable.util.createElement('table', {
                attrs: { cellspacing: '0' },
                style: {
                    tableLayout: 'fixed', position: 'absolute', lineHeight: '1'
                }
            }, [this._colgroup, this._tbody]);
            this.view = comfortable.util.createElement('div', {
                style: { overflow: 'hidden', position: 'relative' },
                on: { scroll: function (event) {
                        _this.view.scrollLeft = 0;
                        _this.view.scrollTop = 0;
                    } }
            }, [this.table]);
            this.$el = this.view;
            this.colgroup = { $el: this._colgroup };
            this.tbody = { $el: this._tbody };
            this.left = 0;
            this.top = 0;
            this.model = null;
            this.tableState = createTableState();
            this.offsetCache = null;
            this.beforeCellSizeChangeHandler = null;
        }
        InternalTableImpl.prototype.getOrCrt = function (tagName, index, parent, init) {
            if (parent.children && index < parent.children.length) {
                return parent.children[index];
            }
            if (!parent.children) {
                parent.children = [];
            }
            var elm = { $el: document.createElement(tagName) };
            if (init) {
                init(elm);
            }
            parent.$el.appendChild(elm.$el);
            parent.children.push(elm);
            return elm;
        };
        InternalTableImpl.prototype.getCellStyle = function (cell) {
            return {
                attrs: { 'class': cell.className },
                style: {
                    textAlign: cell.textAlign,
                    verticalAlign: cell.verticalAlign,
                    color: cell.color,
                    backgroundColor: cell.backgroundColor,
                    fontWeight: cell.fontWeight,
                    borderLeft: cell.borderLeft,
                    borderRight: cell.borderRight,
                    borderTop: cell.borderTop,
                    borderBottom: cell.borderBottom
                }
            };
        };
        InternalTableImpl.prototype.calcCellPosition = function (left, top) {
            var _this = this;
            var tableModel = this.model;
            // offset cache
            if (this.beforeCellSizeChangeHandler == null) {
                this.beforeCellSizeChangeHandler = function (event, detail) {
                    // note: 'this' bind to inner-table's.
                    _this.offsetCache = null;
                };
            }
            tableModel.off('beforecellsizechange', this.beforeCellSizeChangeHandler);
            tableModel.on('beforecellsizechange', this.beforeCellSizeChangeHandler);
            this.offsetCache = this.offsetCache || { left: {}, top: {} };
            var prec = 1000;
            var offsetLeftCache = this.offsetCache.left;
            var offsetTopCache = this.offsetCache.top;
            var offsetLeft = 0;
            var offsetTop = 0;
            var rowCount = tableModel.getRowCount();
            var columnCount = tableModel.getColumnCount();
            var cellWidth = 0;
            var cellHeight = 0;
            var col = 0;
            var row = 0;
            var leftCache = null;
            var topCache = null;
            for (var i = 0; typeof offsetLeftCache[i] == 'number'; i += prec) {
                if (left + offsetLeftCache[i] <= 0) {
                    leftCache = { col: i, offset: offsetLeftCache[i] };
                }
            }
            for (var i = 0; typeof offsetTopCache[i] == 'number'; i += prec) {
                if (top + offsetTopCache[i] <= 0) {
                    topCache = { row: i, offset: offsetTopCache[i] };
                }
            }
            if (leftCache) {
                col = leftCache.col;
                left += leftCache.offset;
                offsetLeft += leftCache.offset;
            }
            if (topCache) {
                row = topCache.row;
                top += topCache.offset;
                offsetTop += topCache.offset;
            }
            for (; col < columnCount; col += 1,
                left += cellWidth, offsetLeft += cellWidth) {
                if (col % prec == 0) {
                    offsetLeftCache[col] = offsetLeft;
                }
                cellWidth = tableModel.getCellWidthAt(col);
                if (left + cellWidth <= 0) {
                    continue;
                }
                break;
            }
            for (; row < rowCount; row += 1,
                top += cellHeight, offsetTop += cellHeight) {
                if (row % prec == 0) {
                    offsetTopCache[row] = offsetTop;
                }
                cellHeight = tableModel.getCellHeightAt(row);
                if (top + cellHeight <= 0) {
                    continue;
                }
                break;
            }
            if (row < rowCount && col < columnCount) {
                var spaned = tableModel.checkSpaned(row, col);
                if (spaned) {
                    while (row > spaned.row) {
                        row -= 1;
                        top -= tableModel.getCellHeightAt(row);
                    }
                    while (col > spaned.col) {
                        col -= 1;
                        left -= tableModel.getCellWidthAt(col);
                    }
                }
            }
            return { left: left, col: col, top: top, row: row };
        };
        InternalTableImpl.prototype.preRender = function () {
            var width = this.$el.offsetWidth;
            var height = this.$el.offsetHeight;
            var rowCount = this.model.getRowCount();
            var columnCount = this.model.getColumnCount();
            var cellPos = this.calcCellPosition(this.left, this.top);
            var tableState = createTableState();
            tableState.top = cellPos.top;
            tableState.minRow = cellPos.row;
            tableState.left = cellPos.left;
            tableState.minCol = cellPos.col;
            var top = cellPos.top;
            var row = cellPos.row;
            var trIndex = 0;
            while (row < rowCount && top < height) {
                var cellHeight = this.model.getCellHeightAt(row);
                this.getOrCrt('tr', trIndex, this.tbody).
                    $el.style.height = cellHeight + 'px';
                tableState.height += cellHeight;
                top += cellHeight;
                row += 1;
                trIndex += 1;
            }
            for (; trIndex < this._tbody.childNodes.length; trIndex += 1) {
                this._tbody.childNodes[trIndex].style.height = '0px';
            }
            tableState.maxRow = Math.min(rowCount, tableState.minRow +
                (this.tbody.children ? this.tbody.children.length : 0)) - 1;
            var left = cellPos.left;
            var col = cellPos.col;
            var colIndex = 0;
            while (col < columnCount && left < width) {
                var cellWidth = this.model.getCellWidthAt(col);
                this.getOrCrt('col', colIndex, this.colgroup).
                    $el.style.width = cellWidth + 'px';
                tableState.width += cellWidth;
                left += cellWidth;
                col += 1;
                colIndex += 1;
            }
            for (; colIndex < this._colgroup.childNodes.length; colIndex += 1) {
                this._colgroup.childNodes[colIndex].style.width = '0px';
            }
            tableState.maxCol = Math.min(columnCount, tableState.minCol +
                (this.colgroup.children ? this.colgroup.children.length : 0)) - 1;
            return tableState;
        };
        InternalTableImpl.prototype.render = function () {
            var tableState = this.preRender();
            var spaned = {};
            var setSpaned = function (row, col, td, cell) {
                td.rowSpan = cell.rowSpan;
                td.colSpan = cell.colSpan;
                if (cell.rowSpan == 1 && cell.colSpan == 1) {
                    return;
                }
                for (var r = 0; r < cell.rowSpan; r += 1) {
                    for (var c = 0; c < cell.colSpan; c += 1) {
                        if (r != 0 || c != 0) {
                            var id = comfortable.util.getCellId(row + r, col + c);
                            spaned[id] = true;
                        }
                    }
                }
            };
            var tableModel = this.model;
            var initCell = function (td) {
                td.renderer = null;
                td.tableModel = tableModel;
                td.$el.style.overflow = 'hidden';
                td.$el.style.whiteSpace = 'nowrap';
            };
            for (var row = tableState.minRow; row <= tableState.maxRow; row += 1) {
                var trIndex = row - tableState.minRow;
                var tr = this.tbody.children[trIndex];
                var tdIndex = 0;
                for (var col = tableState.minCol; col <= tableState.maxCol; col += 1) {
                    var id = comfortable.util.getCellId(row, col);
                    if (spaned[id]) {
                        continue;
                    }
                    tableState.indexById[id] = { trIndex: trIndex, tdIndex: tdIndex };
                    var td = this.getOrCrt('td', tdIndex, tr, initCell);
                    td.row = row;
                    td.col = col;
                    var cell = tableModel.getCellAt(row, col);
                    setSpaned(row, col, td.$el, cell);
                    var factory = tableModel.getCellRendererFactoryAt(row, col);
                    if (td.factory != factory) {
                        td.factory = factory;
                        if (td.renderer) {
                            td.renderer.dispose();
                        }
                        td.$el.innerHTML = '';
                        td.renderer = td.factory(td);
                    }
                    comfortable.util.set(td.$el, this.getCellStyle(cell));
                    td.renderer.render(cell);
                    tdIndex += 1;
                }
            }
            comfortable.util.extend(this.table.style, {
                left: tableState.left + 'px',
                top: tableState.top + 'px',
                width: tableState.width + 'px',
                height: tableState.height + 'px'
            });
            this.tableState = tableState;
        };
        return InternalTableImpl;
    }());
    comfortable.InternalTableImpl = InternalTableImpl;
})(comfortable || (comfortable = {}));
/*!
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
var comfortable;
(function (comfortable) {
    'use strict';
    /**
     * @internal
     */
    var ListImpl = /** @class */ (function (_super) {
        __extends(ListImpl, _super);
        function ListImpl() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.listContent = comfortable.util.createElement('div', {
                style: { position: 'absolute' }
            });
            _this.list = { $el: comfortable.util.createElement('div', {
                    style: { position: 'absolute',
                        overflow: 'hidden', whiteSpace: 'nowrap' }
                }, [_this.listContent]) };
            _this.scr = comfortable.util.createElement('div', {
                style: { position: 'absolute' }
            });
            _this.viewPane = comfortable.util.createElement('div', {
                style: { position: 'absolute',
                    overflowX: 'hidden', overflowY: 'auto' },
                on: { scroll: function (event) { _this.render(); } }
            }, [_this.scr]);
            _this.frame = comfortable.util.createElement('div', {
                style: { position: 'relative', overflow: 'hidden',
                    width: '100px', height: '100px' },
                on: {
                    wheel: function (event) {
                        _this.viewPane.scrollLeft += event.deltaX;
                        _this.viewPane.scrollTop += event.deltaY;
                    }
                }
            }, [_this.viewPane, _this.list.$el]);
            _this.cells = [];
            _this.$el = _this.frame;
            _this.cellHeight = -1;
            return _this;
        }
        ListImpl.prototype.getOrCrt = function (index) {
            if (index < this.cells.length) {
                return this.cells[index];
            }
            var cell = this.createCell();
            this.listContent.appendChild(cell.$el);
            this.cells.push(cell);
            return cell;
        };
        ;
        ListImpl.prototype.getItemAt = function (index) { return 'item' + index; };
        ListImpl.prototype.getItemCount = function () { return 100000; };
        ListImpl.prototype.createCell = function () {
            return { $el: comfortable.util.createElement('div', {
                    props: { textContent: 'M' },
                    style: { borderBottom: '1px solid silver' }
                }), row: -1 };
        };
        ListImpl.prototype.renderCell = function (cell, item) {
            cell.$el.textContent = item;
        };
        ListImpl.prototype.render = function () {
            comfortable.util.set(this.viewPane, { style: {
                    left: '0px', top: '0px',
                    width: this.$el.offsetWidth + 'px',
                    height: this.$el.offsetHeight + 'px'
                } });
            if (this.cellHeight == -1) {
                this.cellHeight = this.getOrCrt(0).$el.offsetHeight;
            }
            var viewHeight = this.cellHeight * this.getItemCount();
            var scrHeight = Math.min(viewHeight, 1E6);
            var listTop = -(scrHeight > this.viewPane.clientHeight ?
                comfortable.util.translate(this.viewPane.scrollTop, 0, scrHeight - this.viewPane.clientHeight, 0, viewHeight - this.viewPane.clientHeight, 'list.top') : 0);
            var minRow = Math.floor(-listTop / this.cellHeight);
            var maxRow = Math.min(this.getItemCount() - 1, Math.floor((-listTop + this.viewPane.clientHeight) / this.cellHeight));
            var top = listTop + minRow * this.cellHeight;
            comfortable.util.set(this.listContent, { style: { left: '0px', top: top + 'px' } });
            var cellIndex = 0;
            for (var row = minRow; row <= maxRow; row += 1) {
                var cell = this.getOrCrt(cellIndex);
                cell.row = row;
                cell.$el.style.display = '';
                this.renderCell(cell, this.getItemAt(row));
                cellIndex += 1;
            }
            for (; cellIndex < this.cells.length; cellIndex += 1) {
                this.cells[cellIndex].$el.style.display = 'none';
            }
            comfortable.util.set(this.scr, { style: {
                    left: '0px', top: '0px',
                    width: this.$el.offsetWidth + 'px',
                    height: scrHeight + 'px'
                } });
            comfortable.util.set(this.list.$el, { style: {
                    whiteSpace: 'nowrap',
                    width: this.viewPane.clientWidth + 'px',
                    height: this.viewPane.clientHeight + 'px'
                } });
            this.trigger('rendered', {
                listState: { minRow: minRow, maxRow: maxRow }
            });
        };
        return ListImpl;
    }(comfortable.UIEventTargetImpl));
    comfortable.ListImpl = ListImpl;
})(comfortable || (comfortable = {}));
/*!
 * comfortable
 *
 * Copyright (c) 2018 Kazuhiko Arase
 *
 * URL: https://github.com/kazuhikoarase/comfortable-js/
 *
 * Licensed under the MIT license:
 *  http://www.opensource.org/licenses/mit-license.php
 */
var comfortable;
(function (comfortable) {
    'use strict';
    comfortable.classNamePrefix = 'ctj';
})(comfortable || (comfortable = {}));
/*!
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
var comfortable;
(function (comfortable) {
    'use strict';
    /**
     * @internal
     */
    comfortable.tableEventTypes = [
        'mousedown', 'mouseover', 'mouseout',
        'click', 'dblclick', 'contextmenu'
    ];
    comfortable.createTable = function () {
        return new TableImpl(new comfortable.DefaultTableModel());
    };
    /**
     * @internal
     */
    var TableImpl = /** @class */ (function (_super) {
        __extends(TableImpl, _super);
        function TableImpl(model) {
            var _this = _super.call(this) || this;
            _this.tables = (function () {
                var tables = [];
                for (var i = 0; i < 4; i += 1) {
                    tables.push(new comfortable.InternalTableImpl());
                }
                tables.forEach(function (table, i) {
                    table.row = ~~(i / 2);
                    table.col = i % 2;
                    var cellEventHandler = function (handler) {
                        return function (event) {
                            var col = comfortable.util.indexOf(comfortable.util.closest(event.target, { tagName: 'TD', root: table.$el }));
                            var row = comfortable.util.indexOf(comfortable.util.closest(event.target, { tagName: 'TR', root: table.$el }));
                            if (col != -1 && row != -1) {
                                handler(event, table.tbody.children[row].children[col]);
                            }
                        };
                    };
                    var delegateHandler = cellEventHandler(function (event, td) {
                        _this.trigger(event.type, { originalEvent: event, row: td.row, col: td.col });
                    });
                    var delegates = {};
                    comfortable.tableEventTypes.forEach(function (type) {
                        delegates[type] = delegateHandler;
                    });
                    comfortable.util.set(table.$el, {
                        on: delegates
                    });
                    comfortable.util.set(table.$el, {
                        style: { position: 'absolute' },
                        on: {
                            mousedown: cellEventHandler(function (event, td) {
                                if (event.which != 1) {
                                    return;
                                }
                                if (td.row < _this.getLockTop() &&
                                    _this.model.isColumnDraggableAt(td.col) &&
                                    !event.defaultPrevented) {
                                    event.preventDefault();
                                    var mousemoveHandler = function (event) {
                                        updateMarker(event.pageX - dragPoint.x);
                                    };
                                    var mouseupHandler = function (event) {
                                        comfortable.util.$(document).off('mousemove', mousemoveHandler).
                                            off('mouseup', mouseupHandler);
                                        _this.frame.removeChild(dragProxy);
                                        _this.frame.removeChild(marker);
                                        if (targetColumn != null) {
                                            tableModel.trigger('columndragged', {
                                                colFrom: targetColumn.colFrom,
                                                colSpan: cell.colSpan,
                                                colTo: targetColumn.colTo
                                            });
                                            _this.invalidate();
                                        }
                                    };
                                    comfortable.util.$(document).on('mousemove', mousemoveHandler).
                                        on('mouseup', mouseupHandler);
                                    var getTargetColumn = function (centerX) {
                                        var targetColumn = null;
                                        tables.forEach(function (tbl, i) {
                                            if (tbl.row == table.row) {
                                                var tableState = tbl.tableState;
                                                var rect = _this.getCellSizeCache().rects[i];
                                                var left = rect.left + tableState.left;
                                                for (var col = tableState.minCol; col <= tableState.maxCol; col += 1) {
                                                    var distance = Math.abs(left - centerX);
                                                    if ((targetColumn == null ||
                                                        distance < targetColumn.distance) &&
                                                        !tableModel.checkSpaned(0, col)) {
                                                        targetColumn = { colFrom: colFrom, colTo: col,
                                                            i: i, left: left, distance: distance };
                                                    }
                                                    left += tableModel.getCellWidthAt(col);
                                                }
                                            }
                                        });
                                        return targetColumn;
                                    };
                                    var updateMarker = function (delta) {
                                        var left = getLeft(delta);
                                        targetColumn = getTargetColumn(left + colWidth / 2);
                                        dragProxy.style.left = left + 'px';
                                        marker.style.left = (targetColumn.left - markerStyle.gap - 1) + 'px';
                                    };
                                    var tableModel = _this.model;
                                    var tableState = table.tableState;
                                    var targetColumn = null;
                                    var rect = _this.getCellSizeCache().rects[i];
                                    var colFrom = td.col;
                                    var spaned = tableModel.checkSpaned(0, colFrom);
                                    if (spaned) {
                                        colFrom = spaned.col;
                                    }
                                    var cell = tableModel.getCellAt(0, colFrom);
                                    var colLeft = function () {
                                        var left = 0;
                                        for (var col = tableState.minCol; col < colFrom; col += 1) {
                                            left += tableModel.getCellWidthAt(col);
                                        }
                                        return left;
                                    }();
                                    var colWidth = function () {
                                        var width = 0;
                                        for (var col = 0; col < cell.colSpan; col += 1) {
                                            width += tableModel.getCellWidthAt(colFrom + col);
                                        }
                                        return width;
                                    }();
                                    var getLeft = function (delta) {
                                        return tableState.left + rect.left + colLeft + delta;
                                    };
                                    var dragPoint = { x: event.pageX, y: event.pageY };
                                    var dragProxy = comfortable.util.createElement('div', {
                                        attrs: { 'class': '${prefix}-column-drag-proxy' },
                                        style: { position: 'absolute', top: '0px',
                                            width: colWidth + 'px',
                                            height: rect.height + 'px' }
                                    });
                                    var markerStyle = { gap: 2 };
                                    var marker = comfortable.util.createElement('div', {
                                        attrs: { 'class': '${prefix}-column-drag-marker' },
                                        style: { position: 'absolute', top: '0px',
                                            width: (markerStyle.gap * 2 + 1) + 'px',
                                            height: rect.height + 'px' }
                                    });
                                    updateMarker(0);
                                    _this.frame.appendChild(dragProxy);
                                    _this.frame.appendChild(marker);
                                    return;
                                }
                                // begin edit by logical row and col
                                if (_this.editor.cell != null &&
                                    _this.editor.cell.row == td.row &&
                                    _this.editor.cell.col == td.col) {
                                }
                                else if (_this.isEditableAt(td.row, td.col)) {
                                    event.preventDefault();
                                    _this.editor.beginEdit(td.row, td.col, true);
                                }
                            })
                        }
                    });
                });
                return tables;
            })();
            _this.scr = comfortable.util.createElement('div', {
                style: { position: 'absolute' }
            });
            _this.viewPane = comfortable.util.createElement('div', {
                style: { position: 'absolute', overflow: 'auto' },
                on: { scroll: function (event) { _this.render(); } }
            }, [_this.scr]);
            _this.frame = comfortable.util.createElement('div', {
                style: { position: 'relative', overflow: 'hidden',
                    width: '400px', height: '200px' },
                on: {
                    mousedown: function (event) {
                        if (comfortable.util.closest(event.target, { $el: _this.viewPane, root: _this.frame })) {
                            _this.editor.endEdit();
                            _this.render();
                        }
                    },
                    keydown: function (event) {
                        switch (event.keyCode) {
                            case 9: // Tab
                                event.preventDefault();
                                _this.move({ row: 0, col: event.shiftKey ? -1 : 1 });
                                break;
                            case 13: // Enter
                                event.preventDefault();
                                _this.move({ row: event.shiftKey ? -1 : 1, col: 0 });
                                break;
                        }
                    },
                    wheel: function (event) {
                        _this.viewPane.scrollLeft += event.deltaX;
                        _this.viewPane.scrollTop += event.deltaY;
                    }
                }
            }, [_this.viewPane].concat(_this.tables.map(function (table) { return table.$el; })));
            _this.lockLines = [];
            _this.colResizeHandles = [];
            _this.cellSizeCache = null;
            _this.beforeCellSizeChangeHandler = null;
            _this.$el = _this.frame;
            _this.editor = _this.createInternalEditor();
            _this.model = null;
            _this.model = model;
            return _this;
        }
        TableImpl.prototype.getCellRect = function (row, col) {
            var tableModel = this.tables[3].model;
            var left = 0;
            var top = 0;
            for (var r = 0; r < row; r += 1) {
                top += tableModel.getCellHeightAt(r);
            }
            for (var c = 0; c < col; c += 1) {
                left += tableModel.getCellWidthAt(c);
            }
            return { left: left, top: top,
                width: tableModel.getCellWidthAt(col),
                height: tableModel.getCellHeightAt(row) };
        };
        TableImpl.prototype.makeVisible = function (renderParams, row, col) {
            var cornerRect = renderParams.rects[0];
            var scrollRect = renderParams.rects[3];
            var delta = { left: 0, top: 0 };
            var cellRect = this.getCellRect(row, col);
            var left = cellRect.left + this.tables[3].left;
            var top = cellRect.top + this.tables[3].top;
            if (left < 0) {
                delta.left = left;
            }
            else if (left + cellRect.width > scrollRect.width) {
                delta.left = left + cellRect.width - scrollRect.width;
            }
            if (top < 0) {
                delta.top = top;
            }
            else if (top + cellRect.height > scrollRect.height) {
                delta.top = top + cellRect.height - scrollRect.height;
            }
            var scroll = {
                left: renderParams.viewWidth > this.viewPane.clientWidth ?
                    comfortable.util.translate(-this.tables[3].left + delta.left, cornerRect.width, cornerRect.width + renderParams.viewWidth - this.viewPane.clientWidth, 0, renderParams.scrWidth - this.viewPane.clientWidth, 'scroll.left') : 0,
                top: renderParams.viewHeight > this.viewPane.clientHeight ?
                    comfortable.util.translate(-this.tables[3].top + delta.top, cornerRect.height, cornerRect.height + renderParams.viewHeight - this.viewPane.clientHeight, 0, renderParams.scrHeight - this.viewPane.clientHeight, 'scroll.top') : 0
            };
            if (row >= this.getLockTop()) {
                this.viewPane.scrollTop = scroll.top;
            }
            if (col >= this.getLockLeft()) {
                this.viewPane.scrollLeft = scroll.left;
            }
        };
        TableImpl.prototype.getCellSizeCache = function () {
            var _this = this;
            var width = this.$el.clientWidth;
            var height = this.$el.clientHeight;
            var tableModel = this.model;
            if (this.beforeCellSizeChangeHandler == null) {
                this.beforeCellSizeChangeHandler = function (event, detail) {
                    // note: 'this' bind to table's.
                    _this.cellSizeCache = null;
                };
            }
            // observe cache size.
            tableModel.off('beforecellsizechange', this.beforeCellSizeChangeHandler);
            tableModel.on('beforecellsizechange', this.beforeCellSizeChangeHandler);
            //
            var rowCount = tableModel.getRowCount();
            var columnCount = tableModel.getColumnCount();
            var lockTop = this.getLockTop();
            var lockLeft = this.getLockLeft();
            if (!this.cellSizeCache ||
                this.cellSizeCache.rowCount != rowCount ||
                this.cellSizeCache.columnCount != columnCount ||
                this.cellSizeCache.lockTop != lockTop ||
                this.cellSizeCache.lockLeft != lockLeft ||
                this.cellSizeCache.width != width ||
                this.cellSizeCache.height != height) {
                var rowPos = [0, lockTop, rowCount];
                var colPos = [0, lockLeft, columnCount];
                var cw = colPos.slice(1).map(function () { return 0; });
                var ch = rowPos.slice(1).map(function () { return 0; });
                ;
                var idx, count;
                idx = colPos.shift();
                cw.forEach(function (_, i) {
                    for (count = colPos.shift(); idx < count; idx += 1) {
                        cw[i] += tableModel.getCellWidthAt(idx);
                    }
                });
                idx = rowPos.shift();
                ch.forEach(function (_, i) {
                    for (count = rowPos.shift(); idx < count; idx += 1) {
                        ch[i] += tableModel.getCellHeightAt(idx);
                    }
                });
                var rects = this.tables.map(function (table) {
                    var rect = { left: 0, top: 0, width: 0, height: 0 };
                    for (var row = 0; row <= table.row; row += 1) {
                        rect[row < table.row ? 'top' : 'height'] += ch[row];
                    }
                    for (var col = 0; col <= table.col; col += 1) {
                        rect[col < table.col ? 'left' : 'width'] += cw[col];
                    }
                    rect.width = Math.max(0, Math.min(rect.width, width - rect.left));
                    rect.height = Math.max(0, Math.min(rect.height, height - rect.top));
                    return rect;
                });
                this.cellSizeCache = {
                    viewWidth: cw[cw.length - 1],
                    viewHeight: ch[ch.length - 1],
                    rects: rects,
                    rowCount: rowCount, columnCount: columnCount,
                    lockTop: lockTop, lockLeft: lockLeft,
                    width: width, height: height
                };
            }
            return this.cellSizeCache;
        };
        TableImpl.prototype.getRenderParams = function () {
            var width = this.$el.clientWidth;
            var height = this.$el.clientHeight;
            var cellSizeCache = this.getCellSizeCache();
            var viewWidth = cellSizeCache.viewWidth;
            var viewHeight = cellSizeCache.viewHeight;
            var maxScr = 1E6;
            var scrWidth = Math.min(viewWidth, maxScr);
            var scrHeight = Math.min(viewHeight, maxScr);
            return {
                width: width,
                height: height,
                rects: cellSizeCache.rects,
                viewWidth: viewWidth,
                viewHeight: viewHeight,
                scrWidth: scrWidth,
                scrHeight: scrHeight
            };
        };
        TableImpl.prototype.getTargetTable = function (row, col) {
            var _this = this;
            return this.tables.filter(function (table) {
                return table.row == (row < _this.getLockTop() ? 0 : 1) &&
                    table.col == (col < _this.getLockLeft() ? 0 : 1);
            })[0];
        };
        TableImpl.prototype.isEditableAt = function (row, col) {
            return this.model.getCellAt(row, col).editable;
        };
        TableImpl.prototype.move = function (offset) {
            var _this = this;
            if (this.editor.cell == null) {
                return;
            }
            var row = this.editor.cell.row;
            var col = this.editor.cell.col;
            var tableModel = this.model;
            var beginEditIfEditable = function () {
                if (_this.isEditableAt(row, col)) {
                    _this.editor.beginEdit(row, col, true);
                    return true;
                }
                return false;
            };
            var rowCount = tableModel.getRowCount();
            var columnCount = tableModel.getColumnCount();
            if (offset.row == -1 || offset.row == 1) {
                do {
                    do {
                        var lineRowCount = tableModel.getLineRowCountAt(row);
                        var lineRow = tableModel.getLineRowAt(row);
                        var rowOffset = row - lineRow;
                        lineRow += offset.row;
                        if (lineRow < 0) {
                            lineRow = lineRowCount - 1;
                            col -= 1;
                            if (col < 0) {
                                lineRow = -1;
                                col = columnCount - 1;
                            }
                        }
                        else if (lineRow >= lineRowCount) {
                            lineRow = 0;
                            col += 1;
                            if (col >= columnCount) {
                                lineRow = lineRowCount;
                                col = 0;
                            }
                        }
                        row = rowOffset + lineRow;
                        if (row < 0) {
                            row = rowCount - 1;
                        }
                        else if (row >= rowCount) {
                            row = 0;
                        }
                    } while (tableModel.checkSpaned(row, col));
                } while (!beginEditIfEditable());
            }
            else if (offset.col == -1 || offset.col == 1) {
                do {
                    do {
                        col += offset.col;
                        if (col < 0) {
                            col = columnCount - 1;
                            row = (row - 1 + rowCount) % rowCount;
                        }
                        else if (col >= columnCount) {
                            col = 0;
                            row = (row + 1) % rowCount;
                        }
                    } while (tableModel.checkSpaned(row, col));
                } while (!beginEditIfEditable());
            }
        };
        TableImpl.prototype.renderColumnResizeHandlers = function (renderParams) {
            var _this = this;
            var mousedownHandler = function (event) {
                var mouseupHandler = function (event) {
                    comfortable.util.$(document).off('mousemove', mousemoveHandler).
                        off('mouseup', mouseupHandler);
                    _this.frame.removeChild(block);
                    comfortable.util.set(handle.$el.childNodes[0], { style: { display: 'none' } });
                    var deltaX = event.pageX - dragPoint.x;
                    var cellWidth = tableModel.getCellWidthAt(handle.col);
                    tableModel.trigger('beforecellsizechange');
                    tableModel.trigger('cellsizechange', {
                        col: handle.col,
                        cellWidth: Math.max(tableModel.minCellWidth, cellWidth + deltaX)
                    });
                    _this.invalidate();
                };
                var mousemoveHandler = function (event) {
                    var deltaX = event.pageX - dragPoint.x;
                    var cellWidth = tableModel.getCellWidthAt(handle.col);
                    deltaX = Math.max(tableModel.minCellWidth, cellWidth + deltaX) - cellWidth;
                    handle.$el.style.left = (handle.left + deltaX) + 'px';
                };
                if (event.which != 1) {
                    return;
                }
                event.preventDefault();
                _this.editor.endEdit();
                var handleIndex = _this.colResizeHandles.map(function (handle) {
                    return handle.$el;
                }).indexOf(event.currentTarget);
                var handle = _this.colResizeHandles[handleIndex];
                var dragPoint = { x: event.pageX, y: event.pageY };
                comfortable.util.set(handle.$el.childNodes[0], { style: { display: '' } });
                var block = comfortable.util.createElement('div', {
                    style: {
                        position: 'absolute', left: '0px', top: '0px',
                        backgroundColor: handleStyle.backgroundColor,
                        cursor: handleStyle.cursor,
                        width: (scrollRect.left + scrollRect.width) + 'px',
                        height: (scrollRect.top + scrollRect.height) + 'px'
                    }
                });
                _this.frame.appendChild(block);
                comfortable.util.$(document).on('mousemove', mousemoveHandler).
                    on('mouseup', mouseupHandler);
            };
            var getOrCrt = function () {
                if (handleIndex < _this.colResizeHandles.length) {
                    return _this.colResizeHandles[handleIndex];
                }
                var handle = { $el: comfortable.util.createElement('div', {
                        style: {
                            position: 'absolute',
                            backgroundColor: handleStyle.backgroundColor,
                            overflow: 'visible', top: '0px',
                            width: (handleStyle.offset * 2 + handleStyle.lineWidth) + 'px',
                            cursor: handleStyle.cursor
                        },
                        on: { mousedown: mousedownHandler }
                    }, [comfortable.util.createElement('div', {
                            attrs: { 'class': '${prefix}-v-resize-line' },
                            style: {
                                position: 'absolute',
                                left: handleStyle.offset + 'px', top: '0px', width: '0px',
                                borderLeftWidth: handleStyle.lineWidth + 'px'
                            }
                        })]) };
                _this.frame.appendChild(handle.$el);
                _this.colResizeHandles.push(handle);
                return handle;
            };
            var handleStyle = {
                offset: 3,
                lineWidth: 1,
                cursor: 'ew-resize',
                backgroundColor: 'rgba(0,0,0,0)'
            };
            var handleIndex = 0;
            var tableModel = this.model;
            var scrollRect = renderParams.rects[3];
            this.tables.forEach(function (table, i) {
                if (table.row == 0) {
                    var rect = renderParams.rects[i];
                    var tableState = table.tableState;
                    var left = tableState.left + rect.left -
                        handleStyle.offset - handleStyle.lineWidth;
                    var height = rect.height;
                    var clientWidth = scrollRect.left + scrollRect.width;
                    var clientHeight = scrollRect.top + scrollRect.height;
                    for (var col = tableState.minCol; col <= tableState.maxCol; col += 1, handleIndex += 1) {
                        var handle = getOrCrt();
                        left += tableModel.getCellWidthAt(col);
                        if (left > clientWidth) {
                            break;
                        }
                        if (!_this.model.isColumnResizableAt(col)) {
                            continue;
                        }
                        comfortable.util.set(handle.$el, { style: { display: '',
                                left: left + 'px', height: height + 'px' } });
                        comfortable.util.set(handle.$el.childNodes[0], {
                            style: { display: 'none', height: clientHeight + 'px' }
                        });
                        handle.col = col;
                        handle.left = left;
                    }
                }
            });
            for (; handleIndex < this.colResizeHandles.length; handleIndex += 1) {
                comfortable.util.set(this.colResizeHandles[handleIndex].$el, {
                    style: { display: 'none', left: '0px', height: '0px' }
                });
            }
        };
        TableImpl.prototype.render = function (visibleCell) {
            var _this = this;
            var renderParams = this.getRenderParams();
            var cornerRect = renderParams.rects[0];
            comfortable.util.extend(this.scr.style, {
                width: renderParams.scrWidth + 'px',
                height: renderParams.scrHeight + 'px'
            });
            comfortable.util.extend(this.viewPane.style, {
                left: cornerRect.width + 'px', top: cornerRect.height + 'px',
                width: (renderParams.width - cornerRect.width) + 'px',
                height: (renderParams.height - cornerRect.height) + 'px'
            });
            var viewPane = this.viewPane;
            var barWidth = viewPane.offsetWidth - viewPane.clientWidth;
            var barHeight = viewPane.offsetHeight - viewPane.clientHeight;
            this.tables.forEach(function (table, i) {
                var rect = renderParams.rects[i];
                if (table.col == 1 &&
                    rect.width + barWidth > renderParams.width - rect.left) {
                    rect.width = renderParams.width - rect.left - barWidth;
                }
                if (table.row == 1 &&
                    rect.height + barHeight > renderParams.height - rect.top) {
                    rect.height = renderParams.height - rect.top - barHeight;
                }
            });
            if (visibleCell) {
                this.makeVisible(renderParams, visibleCell.row, visibleCell.col);
            }
            this.tables.forEach(function (table, i) {
                var rect = renderParams.rects[i];
                if (table.col == 1) {
                    table.left = -(renderParams.scrWidth > viewPane.clientWidth ?
                        comfortable.util.translate(viewPane.scrollLeft, 0, renderParams.scrWidth - viewPane.clientWidth, cornerRect.width, cornerRect.width +
                            renderParams.viewWidth - viewPane.clientWidth, 'table.left') : cornerRect.width);
                }
                if (table.row == 1) {
                    table.top = -(renderParams.scrHeight > viewPane.clientHeight ?
                        comfortable.util.translate(viewPane.scrollTop, 0, renderParams.scrHeight - viewPane.clientHeight, cornerRect.height, cornerRect.height +
                            renderParams.viewHeight - viewPane.clientHeight, 'table.top') : cornerRect.height);
                }
                table.model = _this.model;
                comfortable.util.extend(table.$el.style, {
                    left: rect.left + 'px', top: rect.top + 'px',
                    width: rect.width + 'px', height: rect.height + 'px'
                });
                table.render();
            });
            if (this.editor.cell != null) {
                this.editor.beginEdit(this.editor.cell.row, this.editor.cell.col);
            }
            // lock lines.
            (function () {
                while (_this.lockLines.length < 2) {
                    var line = comfortable.util.createElement('div', {
                        style: { position: 'absolute' }
                    });
                    _this.frame.appendChild(line);
                    _this.lockLines.push(line);
                }
                var width = 0;
                var height = 0;
                _this.tables.forEach(function (table, i) {
                    var rect = renderParams.rects[i];
                    if (table.row == 0) {
                        width += rect.width;
                    }
                    if (table.col == 0) {
                        height += rect.height;
                    }
                });
                // horizontal
                comfortable.util.set(_this.lockLines[0], {
                    attrs: { 'class': '${prefix}-h-lock-line' },
                    style: {
                        display: _this.getLockTop() == 0 ? 'none' : '', left: '0px',
                        top: (cornerRect.height - 1) + 'px', width: width + 'px'
                    }
                });
                // vertical
                comfortable.util.set(_this.lockLines[1], {
                    attrs: { 'class': '${prefix}-v-lock-line' },
                    style: {
                        display: _this.getLockLeft() == 0 ? 'none' : '', top: '0px',
                        left: (cornerRect.width - 1) + 'px', height: height + 'px'
                    }
                });
            })();
            // resize handles.
            if (this.getLockTop() > 0) {
                this.renderColumnResizeHandlers(renderParams);
            }
            this.trigger('rendered', {
                tableStates: this.tables.map(function (table) {
                    return table.tableState;
                })
            });
        };
        TableImpl.prototype.createInternalEditor = function () {
            var table = this;
            return {
                impl: null,
                cell: null,
                beginEdit: function (row, col, makeVisible) {
                    this.endEdit();
                    if (makeVisible) {
                        table.render({ row: row, col: col });
                    }
                    this.cell = { row: row, col: col };
                    var target = table.getTargetTable(row, col);
                    var index = target.tableState.indexById[comfortable.util.getCellId(row, col)];
                    if (index) {
                        var td = target.tbody.children[index.trIndex].children[index.tdIndex];
                        this.impl = td.renderer.beginEdit(table.model.getCellAt(row, col));
                        this.impl.focus();
                    }
                },
                endEdit: function () {
                    if (this.impl != null) {
                        var endState = this.impl.endEdit();
                        if (endState) {
                            table.model.trigger('valuechange', {
                                row: this.cell.row,
                                col: this.cell.col,
                                oldValue: endState.oldValue,
                                newValue: endState.newValue
                            });
                        }
                        this.impl = null;
                    }
                    this.cell = null;
                }
            };
        };
        TableImpl.prototype.getLockTop = function () { return 0; };
        TableImpl.prototype.getLockLeft = function () { return 0; };
        TableImpl.prototype.forEachCells = function (callback) {
            this.tables.forEach(function (table) {
                (table.tbody.children || []).forEach(function (tr) {
                    (tr.children || []).forEach(function (cell) {
                        callback(cell);
                    });
                });
            });
        };
        return TableImpl;
    }(comfortable.UIEventTargetImpl));
    comfortable.TableImpl = TableImpl;
})(comfortable || (comfortable = {}));
/*!
 * comfortable
 *
 * Copyright (c) 2018 Kazuhiko Arase
 *
 * URL: https://github.com/kazuhikoarase/comfortable-js/
 *
 * Licensed under the MIT license:
 *  http://www.opensource.org/licenses/mit-license.php
 */
var comfortable;
(function (comfortable) {
    'use strict';
    comfortable.ui = {
        createButton: function (label, action) {
            return comfortable.util.createElement('button', {
                props: { textContent: label },
                attrs: { 'class': '${prefix}-button' },
                on: { mousedown: function (event) {
                        event.preventDefault();
                    }, click: function (event) { action(event); } }
            });
        },
        createDialog: function (children) {
            var dialog = comfortable.util.extend(new comfortable.EventTargetImpl(), {
                $el: comfortable.util.createElement('div', {
                    attrs: { 'class': '${prefix}-dialog' },
                    style: { position: 'absolute' }
                }, children),
                show: function () {
                    document.body.appendChild(this.$el);
                    this.trigger('beforeshow');
                    comfortable.util.callLater(function () {
                        comfortable.util.$(document).on('mousedown', mousedownHandler);
                    });
                },
                dispose: function () {
                    if (this.$el) {
                        comfortable.util.$(document).off('mousedown', mousedownHandler);
                        document.body.removeChild(this.$el);
                        this.$el = null;
                        this.trigger('dispose');
                    }
                }
            });
            var mousedownHandler = function (event) {
                if (!comfortable.util.closest(event.target, { $el: dialog.$el, root: document.body })) {
                    dialog.dispose();
                }
            };
            return dialog;
        },
        showMenu: function (left, top, menuItems) {
            var subMenu = null;
            var menu = comfortable.util.createElement('div', {
                attrs: { 'class': '${prefix}-contextmenu' },
                style: { position: 'absolute', left: left + 'px', top: top + 'px' }
            }, menuItems.map(function (menuItem) {
                return comfortable.util.createElement('div', {
                    attrs: { 'class': '${prefix}-menuitem ${prefix}-clickable' },
                    props: { textContent: menuItem.label },
                    style: { position: 'relative', whiteSpace: 'nowrap' },
                    on: {
                        mouseover: function (event) {
                            if (subMenu != null) {
                                subMenu.dispose();
                                subMenu = null;
                            }
                            if (subMenu == null && menuItem.children) {
                                subMenu = comfortable.ui.showMenu(left + event.target.offsetWidth, top + event.target.offsetTop, menuItem.children());
                            }
                        },
                        mousedown: function (event) {
                            if (menuItem.action) {
                                menuItem.action(event);
                            }
                        }
                    }
                });
            }));
            var dispose = function () {
                if (menu != null) {
                    document.body.removeChild(menu);
                    menu = null;
                }
            };
            var mousedownHandler = function (event) {
                comfortable.util.$(document).off('mousedown', mousedownHandler);
                dispose();
            };
            comfortable.util.$(document).on('mousedown', mousedownHandler);
            document.body.appendChild(menu);
            return { dispose: dispose };
        }
    };
})(comfortable || (comfortable = {}));
/*!
 * comfortable
 *
 * Copyright (c) 2018 Kazuhiko Arase
 *
 * URL: https://github.com/kazuhikoarase/comfortable-js/
 *
 * Licensed under the MIT license:
 *  http://www.opensource.org/licenses/mit-license.php
 */
var comfortable;
(function (comfortable) {
    'use strict';
    var parseArguments = function (args) {
        var children = [];
        var opts = {};
        for (var i = 1; i < args.length; i += 1) {
            var a = args[i];
            if (typeof a == 'object') {
                if (typeof a.splice == 'function') {
                    children = a;
                }
                else {
                    opts = a;
                }
            }
        }
        return { children: children, opts: opts };
    };
    var classNamePrefixRe = /\$\{prefix\}/g;
    var replaceClassNamePrefix = function (className) {
        return className.replace(classNamePrefixRe, comfortable.classNamePrefix);
    };
    var wideNumChars = '０１２３４５６７８９＋－．，';
    var narrowNumChars = '0123456789+-.,';
    if (wideNumChars.length != narrowNumChars.length) {
        throw wideNumChars + ',' + narrowNumChars;
    }
    var $ = /** @class */ (function () {
        function $(elm) {
            this.elm = elm;
        }
        $.prototype.on = function (type, listener) {
            this.elm.addEventListener(type, listener);
            return this;
        };
        $.prototype.off = function (type, listener) {
            this.elm.removeEventListener(type, listener);
            return this;
        };
        $.prototype.addClass = function (className, remove) {
            className = replaceClassNamePrefix(className);
            var classes = '';
            (this.elm.getAttribute('class') || '').split(/\s+/g).
                forEach(function (c) {
                if (c != className) {
                    classes += ' ' + c;
                    return;
                }
            });
            if (!remove) {
                classes += ' ' + className;
            }
            this.elm.setAttribute('class', classes);
            return this;
        };
        $.prototype.removeClass = function (className) {
            return this.addClass(className, true);
        };
        return $;
    }());
    comfortable.$ = $;
    comfortable.util = {
        extend: function (arg) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            var o = arguments[0];
            for (var i = 1; i < arguments.length; i += 1) {
                var a = arguments[i];
                for (var k in a) {
                    o[k] = a[k];
                }
                ;
            }
            return o;
        },
        callLater: function (cb) {
            window.setTimeout(cb, 0);
        },
        set: function (elm, opts) {
            if (opts.attrs) {
                for (var k in opts.attrs) {
                    var v = opts.attrs[k];
                    var t = typeof v;
                    if (t == 'number' || t == 'boolean') {
                        v = '' + v;
                    }
                    else if (t == 'undefined') {
                        v = '';
                    }
                    if (typeof v != 'string') {
                        throw 'bad attr type for ' + k + ':' + (typeof v);
                    }
                    if (k == 'class') {
                        v = replaceClassNamePrefix(v);
                    }
                    elm.setAttribute(k, v);
                }
            }
            if (opts.props) {
                for (var k in opts.props) {
                    elm[k] = opts.props[k];
                }
            }
            if (opts.style) {
                for (var k in opts.style) {
                    elm.style[k] = opts.style[k] || '';
                }
            }
            if (opts.on) {
                for (var k in opts.on) {
                    elm.addEventListener(k, opts.on[k]);
                }
            }
            return elm;
        },
        createElement: function (tagName) {
            var args = parseArguments(arguments);
            var elm = document.createElement(tagName);
            args.children.forEach(function (child) { elm.appendChild(child); });
            return this.set(elm, args.opts);
        },
        createSVGElement: function (tagName) {
            var args = parseArguments(arguments);
            var elm = document.createElementNS('http://www.w3.org/2000/svg', tagName);
            args.children.forEach(function (child) { elm.appendChild(child); });
            return this.set(elm, args.opts);
        },
        $: function (elm) { return new $(elm); },
        closest: function (elm, opts) {
            if (typeof opts.className == 'string') {
                opts.className = replaceClassNamePrefix(opts.className);
            }
            while (elm != null && elm.nodeType == 1 && elm != opts.root) {
                if (typeof opts.tagName == 'string' && elm.tagName == opts.tagName) {
                    return elm;
                }
                else if (typeof opts.$el == 'object' && elm == opts.$el) {
                    return elm;
                }
                else if (typeof opts.className == 'string' &&
                    (elm.getAttribute('class') || '').split(/\s+/g).indexOf(opts.className) != -1) {
                    return elm;
                }
                elm = elm.parentNode;
            }
            return null;
        },
        indexOf: function (elm) {
            if (elm == null) {
                return -1;
            }
            return Array.prototype.indexOf.call(elm.parentNode.childNodes, elm);
        },
        offset: function (elm) {
            var off = { left: 0, top: 0 };
            var e;
            var base = null;
            for (e = elm; e.parentNode != null; e = e.parentNode) {
                if (e.offsetParent != null) {
                    base = e;
                    break;
                }
            }
            if (base != null) {
                for (e = base; e.offsetParent != null; e = e.offsetParent) {
                    off.left += e.offsetLeft;
                    off.top += e.offsetTop;
                }
            }
            for (e = elm; e.parentNode != null &&
                e != document.body; e = e.parentNode) {
                off.left -= e.scrollLeft;
                off.top -= e.scrollTop;
            }
            return off;
        },
        moveSublist: function (list, from, length, to) {
            var i1 = list.slice(from, from + length);
            var i2 = list.slice(0, from).concat(list.slice(from + length));
            to = from < to ? to - length : to;
            return i2.slice(0, to).concat(i1).concat(i2.slice(to));
        },
        getCellId: function (row, col) {
            return row + ':' + col;
        },
        translate: function (val1, min1, max1, min2, max2, log) {
            var val2 = (val1 - min1) * (max2 - min2) / (max1 - min1) + min2;
            return Math.max(min2, Math.min(Math.round(val2), max2));
        },
        // num utils
        numRe: /^([\+\-]?)([0-9]*)(\.[0-9]*)?$/,
        formatNumber: function (value, digits, s1, s2) {
            digits = digits || 0;
            s1 = typeof s1 == 'string' ? s1 : ',';
            s2 = typeof s2 == 'string' ? s2 : '.';
            if (typeof value == 'number') {
                value = '' + value;
            }
            if (typeof value != 'string') {
                return '';
            }
            var mat = value.match(comfortable.util.numRe);
            if (mat) {
                if (mat[2].length == 0 && (!mat[3] || mat[3].length == 1)) {
                    return '';
                }
                var iPart = mat[2].length > 0 ? mat[2] : '0';
                while (iPart.length > 1 && iPart.charAt(0) == '0') {
                    iPart = iPart.substring(1);
                }
                var neg = mat[1] == '-';
                var s = '';
                while (iPart.length > 3) {
                    s = s1 + iPart.substring(iPart.length - 3) + s;
                    iPart = iPart.substring(0, iPart.length - 3);
                }
                s = iPart + s;
                if (digits > 0) {
                    var fPart = mat[3] || s2;
                    s += s2;
                    for (var i = 0; i < digits; i += 1) {
                        s += (i + 1 < fPart.length) ? fPart[i + 1] : '0';
                    }
                }
                return (neg && s != '0') ? '-' + s : s;
            }
            return value;
        },
        toNarrowNumber: function (value) {
            var s = '';
            for (var i = 0; i < value.length; i += 1) {
                var c = value.charAt(i);
                var index = wideNumChars.indexOf(c);
                s += (index != -1) ? narrowNumChars.charAt(index) : c;
            }
            return s;
        }
    };
})(comfortable || (comfortable = {}));
/*!
 * comfortable
 *
 * Copyright (c) 2018 Kazuhiko Arase
 *
 * URL: https://github.com/kazuhikoarase/comfortable-js/
 *
 * Licensed under the MIT license:
 *  http://www.opensource.org/licenses/mit-license.php
 */
var comfortable;
(function (comfortable) {
    'use strict';
})(comfortable || (comfortable = {}));
/*!
 * comfortable
 *
 * Copyright (c) 2018 Kazuhiko Arase
 *
 * URL: https://github.com/kazuhikoarase/comfortable-js/
 *
 * Licensed under the MIT license:
 *  http://www.opensource.org/licenses/mit-license.php
 */
var comfortable;
(function (comfortable) {
    'use strict';
    if (typeof exports === 'object') {
        module.exports = comfortable;
    }
})(comfortable || (comfortable = {}));
/*!
 * comfortable
 *
 * Copyright (c) 2018 Kazuhiko Arase
 *
 * URL: https://github.com/kazuhikoarase/comfortable-js/
 *
 * Licensed under the MIT license:
 *  http://www.opensource.org/licenses/mit-license.php
 */
var comfortable;
(function (comfortable) {
    'use strict';
    comfortable.SortOrder = { ASC: 'asc', DESC: 'desc' };
    // selector of sort order
    var createSelector = function () {
        var rect = comfortable.util.createElement('span', {
            attrs: { 'class': '${prefix}-selector-body' },
            style: { display: 'inline-block', width: '12px', height: '12px' }
        });
        return {
            $el: rect,
            selected: false,
            setSelected: function (selected) {
                this.selected = selected;
                comfortable.util.$(rect).addClass('${prefix}-selected', !selected);
            },
            isSelected: function () {
                return this.selected;
            }
        };
    };
    // filter checkbox
    var createCheckbox = function () {
        // fix for layout collapse by bootstrap.
        var antiBsGlobals = {
            verticalAlign: 'baseline',
            boxSizing: 'content-box',
            lineHeight: '1'
        };
        var path = comfortable.util.createSVGElement('path', { attrs: {
                'class': '${prefix}-checkbox-check',
                d: 'M 2 5 L 5 9 L 10 3'
            },
            style: antiBsGlobals });
        return {
            $el: comfortable.util.createElement('span', {
                attrs: { 'class': '${prefix}-checkbox-body' },
                style: comfortable.util.extend(antiBsGlobals, { display: 'inline-block',
                    width: '12px', height: '12px' })
            }, [
                comfortable.util.createSVGElement('svg', {
                    attrs: { width: '12', height: '12' },
                    style: antiBsGlobals
                }, [path])
            ]),
            checked: true,
            setIncomplete: function (incomplete) {
                comfortable.util.$(path).addClass('${prefix}-checkbox-incomplete-check', !incomplete);
            },
            setChecked: function (checked) {
                this.checked = checked;
                path.style.display = this.checked ? '' : 'none';
            },
            isChecked: function () {
                return this.checked;
            }
        };
    };
    var createFilterDialog = function (opts, cell) {
        var messages = comfortable.i18n.getMessages();
        var labelStyle = { marginLeft: '4px', verticalAlign: 'middle' };
        var createSortButton = function (label) {
            var selector = createSelector();
            selector.$el.style.verticalAlign = 'middle';
            return {
                selector: selector,
                $el: comfortable.util.createElement('div', [
                    selector.$el,
                    comfortable.util.createElement('span', {
                        style: labelStyle, props: { textContent: label }
                    })
                ], { attrs: { 'class': '${prefix}-clickable-op' }, on: {
                        mousedown: function (event) { event.preventDefault(); },
                        click: function () {
                            dialog.trigger('sortclick', { label: label });
                        }
                    } })
            };
        };
        var sortAscButton = createSortButton(messages.SORT_ASC);
        var sortDescButton = createSortButton(messages.SORT_DESC);
        var filterItems = [messages.SELECT_ALL]
            .concat(opts.filterValues)
            .map(function (value, i) {
            return {
                index: i,
                label: (i > 0) ? opts.labelFunction(value, cell) : value,
                value: value,
                checked: (i > 0) ? !opts.rejects[value] : true,
                color: false
            };
        });
        var FilterItemCell = /** @class */ (function () {
            function FilterItemCell() {
                var _this = this;
                this.checkbox = (function () {
                    var checkbox = createCheckbox();
                    checkbox.$el.style.verticalAlign = 'middle';
                    return checkbox;
                })();
                this.label = comfortable.util.createElement('span', { style: labelStyle,
                    props: { textContent: 'M' } });
                this.index = 0;
                this.row = 0;
                this.$el = comfortable.util.createElement('div', {
                    attrs: { 'class': '${prefix}-clickable-op' },
                    on: {
                        mousedown: function (event) { event.preventDefault(); },
                        click: function () {
                            dialog.trigger('filterclick', { index: _this.index });
                        }
                    }
                }, [this.checkbox.$el, this.label]);
            }
            FilterItemCell.prototype.setLabel = function (text) {
                this.label.textContent = text || messages.SELECT_BLANK;
                this.$el.setAttribute('title', this.label.textContent);
            };
            return FilterItemCell;
        }());
        var FilterItemList = /** @class */ (function (_super) {
            __extends(FilterItemList, _super);
            function FilterItemList() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.items = filterItems;
                _this.height = 0;
                _this.maxHeight = 150;
                return _this;
            }
            FilterItemList.prototype.getItemAt = function (row) { return this.items[row]; };
            FilterItemList.prototype.getItemCount = function () { return this.items.length; };
            FilterItemList.prototype.createCell = function () {
                return new FilterItemCell();
            };
            FilterItemList.prototype.renderCell = function (cell, item) {
                cell.index = item.index;
                cell.setLabel(item.label);
                cell.checkbox.setChecked(item.checked);
                cell.checkbox.setIncomplete(item.incomplete);
            };
            return FilterItemList;
        }(comfortable.ListImpl));
        var filterItemList = new FilterItemList();
        filterItemList.on('rendered', function (event, detail) {
            var height = Math.min(this.maxHeight, this.cellHeight * this.getItemCount());
            if (this.height != height) {
                this.height = height;
                this.$el.style.height = height + 'px';
                this.invalidate();
            }
        });
        filterItemList.$el.style.width = '150px';
        filterItemList.$el.style.height = '0px';
        filterItemList.invalidate();
        var dialog = comfortable.util.extend(comfortable.ui.createDialog([
            // sort
            sortAscButton.$el,
            sortDescButton.$el,
            // search box
            comfortable.util.createElement('input', { attrs: { type: 'text' },
                style: { width: '150px', margin: '4px 0px' },
                on: { keyup: function (event) {
                        var value = event.currentTarget.value;
                        filterItemList.items = filterItems.filter(function (filterItem) {
                            return !(value && filterItem.label.indexOf(value) == -1);
                        });
                        filterItemList.invalidate();
                    } } }),
            // filter items
            filterItemList.$el,
            // buttons
            comfortable.util.createElement('div', { style: { marginTop: '4px', display: 'inline-block', float: 'right' } }, [
                comfortable.ui.createButton(messages.OK, function () {
                    dialog.dispose();
                    dialog.trigger('applyfilter');
                }),
                comfortable.ui.createButton(messages.CANCEL, function () {
                    dialog.dispose();
                })
            ])
        ]), {
            sortOrder: opts.sortOrder, rejects: opts.rejects
        }).on('sortclick', function (event, detail) {
            if (detail.label == messages.SORT_ASC) {
                this.sortOrder = this.sortOrder == comfortable.SortOrder.ASC ? null : comfortable.SortOrder.ASC;
            }
            if (detail.label == messages.SORT_DESC) {
                this.sortOrder = this.sortOrder == comfortable.SortOrder.DESC ? null : comfortable.SortOrder.DESC;
            }
            this.trigger('sortchange');
            this.dispose();
            this.trigger('applysort');
        }).on('sortchange', function () {
            sortAscButton.selector.setSelected(this.sortOrder == comfortable.SortOrder.ASC);
            sortDescButton.selector.setSelected(this.sortOrder == comfortable.SortOrder.DESC);
        }).on('filterclick', function (event, detail) {
            if (detail.index == 0) {
                // select all
                var selectCount = 0;
                filterItems.forEach(function (filterItem, i) {
                    if (i > 0 && filterItem.checked) {
                        selectCount += 1;
                    }
                });
                var selectAll = selectCount != filterItems.length - 1;
                filterItems.forEach(function (filterItem, i) {
                    if (i > 0) {
                        filterItem.checked = selectAll;
                    }
                });
            }
            else {
                var filterItem = filterItems[detail.index];
                filterItem.checked = !filterItem.checked;
            }
            var rejects = {};
            filterItems.forEach(function (filterItem, i) {
                if (i > 0 && !filterItem.checked) {
                    rejects[filterItem.value] = true;
                }
            });
            this.rejects = rejects;
            this.trigger('filterchange');
        }).on('filterchange', function () {
            var rejectCount = 0;
            for (var value in this.rejects) {
                rejectCount += 1;
            }
            // update 'select all' checkbox
            filterItems[0].checked = rejectCount != filterItems.length - 1;
            filterItems[0].incomplete = rejectCount != 0;
            filterItemList.invalidate();
        }).trigger('sortchange').trigger('filterchange');
        return dialog;
    };
    var createFilterButton = function () {
        return {
            $el: comfortable.util.createSVGElement('svg', { style: { position: 'absolute' },
                attrs: { width: '15', height: '15',
                    'class': '${prefix}-filter-button ${prefix}-clickable-op' } }),
            filtered: false,
            sortOrder: null,
            setFiltered: function (filtered) {
                this.filtered = filtered;
                this.update();
            },
            setSortOrder: function (sortOrder) {
                this.sortOrder = sortOrder;
                this.update();
            },
            update: function () {
                // remove all children
                while (this.$el.firstChild) {
                    this.$el.removeChild(this.$el.firstChild);
                }
                // outer rect
                this.$el.appendChild(comfortable.util.createSVGElement('rect', {
                    attrs: { 'class': '${prefix}-filter-body',
                        x: '0', y: '0', width: '15', height: '15',
                        rx: '3', ry: '3' }
                }));
                // and others.
                var fillClass = '${prefix}-filter-fill';
                var strokeClass = '${prefix}-filter-stroke';
                if (this.filtered) {
                    this.$el.appendChild(comfortable.util.createSVGElement('path', {
                        attrs: { 'class': fillClass,
                            d: 'M 5 4 L 8 7 L 8 12 L 11 12 L 11 7 L 14 4 Z' }
                    }));
                    if (this.sortOrder == null) {
                        this.$el.appendChild(comfortable.util.createSVGElement('path', {
                            attrs: { 'class': fillClass, d: 'M 0 8 L 3 12 L 6 8 Z' }
                        }));
                    }
                }
                else if (this.sortOrder == null) {
                    this.$el.appendChild(comfortable.util.createSVGElement('path', {
                        attrs: { 'class': fillClass, d: 'M 1 4 L 7 11 L 13 4 Z' }
                    }));
                }
                else {
                    this.$el.appendChild(comfortable.util.createSVGElement('path', {
                        attrs: { 'class': fillClass, d: 'M 4 5 L 9 11 L 14 5 Z' }
                    }));
                }
                if (this.sortOrder != null) {
                    this.$el.appendChild(comfortable.util.createSVGElement('path', {
                        attrs: { 'class': strokeClass, d: 'M 3 2 L 3 12' }
                    }));
                    if (this.sortOrder == comfortable.SortOrder.ASC) {
                        this.$el.appendChild(comfortable.util.createSVGElement('path', {
                            attrs: { 'class': strokeClass, d: 'M 1 5 L 3 2 L 5 5' }
                        }));
                    }
                    else {
                        this.$el.appendChild(comfortable.util.createSVGElement('path', {
                            attrs: { 'class': strokeClass, d: 'M 1 9 L 3 12 L 5 9' }
                        }));
                    }
                }
                return this;
            }
        }.update();
    };
    var getFilterValues = function (tableModel, dataField, comparator) {
        var exists = {};
        var filterValues = [];
        var items = tableModel.items;
        for (var i = 0; i < items.length; i += 1) {
            var value = items[i][dataField];
            if (typeof value == 'undefined') {
                continue;
            }
            if (!exists[value]) {
                if (value !== '') {
                    filterValues.push(value);
                }
                exists[value] = true;
            }
        }
        if (comparator) {
            filterValues.sort(comparator);
        }
        else {
            filterValues.sort();
        }
        // blank is always last.
        if (exists['']) {
            filterValues.push('');
        }
        return filterValues;
    };
    comfortable.createDefaultHeaderCellRendererFactory = function (opts) {
        opts = comfortable.util.extend(comfortable.createDefaultCellRendererFactoryOpts(), opts || {});
        return function (td) {
            var labelRenderer = comfortable.createMultiLineLabelRenderer(td.$el);
            var tableModel = td.tableModel;
            var filterButton = null;
            var dialog = null;
            var showFilterDialog = function () {
                var filterContext = tableModel.filterContext;
                var dataField = filterButton.cell.dataField;
                var filterValues = getFilterValues(tableModel, dataField, filterButton.cell.comparator);
                var dialog = createFilterDialog(comfortable.util.extend({
                    sortOrder: filterContext.sort &&
                        filterContext.sort.dataField == dataField ?
                        filterContext.sort.sortOrder : null,
                    rejects: filterContext.filters[dataField] || {},
                    filterValues: filterValues
                }, opts), filterButton.cell).on('applysort', function () {
                    filterContext['.comparator'] = filterButton.cell.comparator;
                    filterContext.sort = this.sortOrder ?
                        { dataField: dataField, sortOrder: this.sortOrder } : null;
                    tableModel.trigger('filterchange');
                }).on('applyfilter', function () {
                    filterContext['.comparator'] = filterButton.cell.comparator;
                    filterContext.filters[dataField] = this.rejects;
                    tableModel.trigger('filterchange');
                });
                var off = comfortable.util.offset(td.$el);
                dialog.$el.style.left = off.left + 'px',
                    dialog.$el.style.top = (off.top + td.$el.offsetHeight) + 'px';
                dialog.show();
                return dialog;
            };
            return {
                render: function (cell) {
                    labelRenderer.setLabel(cell.value || '\u00a0');
                    if (cell.dataField) {
                        if (!filterButton) {
                            filterButton = createFilterButton();
                            comfortable.util.set(filterButton.$el, {
                                on: { mousedown: function (event) {
                                        event.preventDefault();
                                        if (dialog == null) {
                                            // wait for end edit then show dialog.
                                            comfortable.util.callLater(function () {
                                                dialog = showFilterDialog();
                                                dialog.on('dispose', function () {
                                                    dialog = null;
                                                });
                                            });
                                        }
                                        else {
                                            dialog.dispose();
                                        }
                                    }
                                }
                            });
                            td.$el.style.position = 'relative';
                            td.$el.appendChild(filterButton.$el);
                        }
                        filterButton.cell = cell;
                        var filterContext = tableModel.filterContext;
                        filterButton.setSortOrder(filterContext.sort &&
                            filterContext.sort.dataField == cell.dataField ?
                            filterContext.sort.sortOrder : null);
                        var rejects = filterContext.filters[cell.dataField] || {};
                        var filtered = false;
                        for (var value in rejects) {
                            filtered = true;
                            break;
                        }
                        filterButton.setFiltered(filtered);
                    }
                    if (filterButton) {
                        filterButton.$el.style.display = cell.dataField ? '' : 'none';
                    }
                },
                beginEdit: function (cell) {
                    return { focus: function () { }, endEdit: function () { } };
                },
                dispose: function () {
                }
            };
        };
    };
})(comfortable || (comfortable = {}));
/*!
 * comfortable
 *
 * Copyright (c) 2018 Kazuhiko Arase
 *
 * URL: https://github.com/kazuhikoarase/comfortable-js/
 *
 * Licensed under the MIT license:
 *  http://www.opensource.org/licenses/mit-license.php
 */
var comfortable;
(function (comfortable) {
    'use strict';
    var createFilterContext = function () {
        return { sort: null, filters: {} };
    };
    var createDefaultOrderedColumnIndices = function (tableModel) {
        var orderedColumnIndices = [];
        var columnCount = tableModel.getColumnCount();
        for (var i = 0; i < columnCount; i += 1) {
            orderedColumnIndices.push(i);
        }
        return orderedColumnIndices;
    };
    var showColumnEditDialog = function (table) {
        var messages = comfortable.i18n.getMessages();
        var tableModel = table.model;
        var lockLeft = table.lockLeft;
        var ColumnType = { LOCK_COLUMN: 'lockColumn', COLUMN: 'column' };
        var columns = function () {
            var columns = [];
            var columnCount = tableModel.getColumnCount();
            for (var col = 0; col <= columnCount;) {
                if (col == lockLeft) {
                    columns.push({ type: ColumnType.LOCK_COLUMN,
                        label: messages.LOCK_COLUMN,
                        hidden: !table.enableLockColumn });
                }
                if (col < columnCount) {
                    var cell = tableModel.getCellAt(0, col);
                    var orderedCol = tableModel.getOrderedColumnIndexAt(col);
                    columns.push({ type: ColumnType.COLUMN,
                        label: tableModel.getValueAt(0, col),
                        hidden: !!tableModel.hiddenColumns[orderedCol],
                        col: orderedCol, colSpan: cell.colSpan });
                    col += cell.colSpan;
                }
                else {
                    col += 1;
                }
            }
            return columns;
        }();
        var columnItems = columns.map(function (column) {
            return comfortable.util.createElement('div', {
                attrs: { 'class': '${prefix}-listitem ${prefix}-clickable' +
                        (column.type == ColumnType.LOCK_COLUMN ?
                            ' ${prefix}-column-edit-lock-column' : '') },
                on: { mousedown: function (event) {
                        event.preventDefault();
                        columnItems.forEach(function (elm) {
                            comfortable.util.$(elm).removeClass('${prefix}-clickable');
                        });
                        var mousemoveHandler = function (event) {
                            if (!started && Math.abs(event.pageY - dragPoint.y) > 4) {
                                started = true;
                            }
                            if (!started) {
                                return;
                            }
                            var listitem = comfortable.util.closest(event.target, { className: '${prefix}-listitem', root: dialog.$el });
                            if (!listitem) {
                                return;
                            }
                            indexTo = columnItems.indexOf(listitem);
                            var off = comfortable.util.offset(listitem);
                            var top = listitem.offsetTop - 2 - listitem.parentNode.scrollTop;
                            if (off.top + listitem.offsetHeight / 2 < event.pageY) {
                                indexTo += 1;
                                top += listitem.offsetHeight;
                            }
                            bar.style.display = '';
                            bar.style.top = top + 'px';
                        };
                        var mouseupHandler = function (event) {
                            comfortable.util.$(document).off('mousemove', mousemoveHandler).
                                off('mouseup', mouseupHandler);
                            columnItems.forEach(function (elm) {
                                comfortable.util.$(elm).addClass('${prefix}-clickable');
                            });
                            lastTarget = target;
                            dialog.$el.removeChild(bar);
                            if (indexTo != -1 && indexFrom != indexTo) {
                                var parent = target.parentNode;
                                var ref = columnItems[indexTo];
                                columns = comfortable.util.moveSublist(columns, indexFrom, 1, indexTo);
                                columnItems = comfortable.util.moveSublist(columnItems, indexFrom, 1, indexTo);
                                parent.removeChild(target);
                                if (ref) {
                                    parent.insertBefore(target, ref);
                                }
                                else {
                                    parent.appendChild(target);
                                }
                            }
                        };
                        comfortable.util.$(document).on('mousemove', mousemoveHandler).
                            on('mouseup', mouseupHandler);
                        var target = event.currentTarget;
                        var bar = comfortable.util.createElement('div', {
                            attrs: { 'class': '${prefix}-column-edit-bar' },
                            style: { position: 'absolute', left: '0px',
                                display: 'none', width: target.offsetWidth + 'px' }
                        });
                        var indexFrom = columnItems.indexOf(target);
                        var indexTo = -1;
                        var started = false;
                        var dragPoint = { x: event.pageX, y: event.pageY };
                        dialog.$el.appendChild(bar);
                        if (lastTarget != null) {
                            comfortable.util.$(lastTarget).removeClass('${prefix}-selected');
                        }
                        comfortable.util.$(target).addClass('${prefix}-selected');
                    } }
            }, [
                comfortable.util.createElement('input', {
                    attrs: { type: 'checkbox' },
                    props: { checked: !column.hidden },
                    style: { verticalAlign: 'middle' },
                    on: { click: function (event) {
                            var target = event.currentTarget;
                            var index = comfortable.util.indexOf(target.parentNode);
                            columns[index].hidden = !target.checked;
                        } }
                }),
                comfortable.util.createElement('span', {
                    style: { verticalAlign: 'middle' },
                    props: { textContent: column.label }
                })
            ]);
        });
        var lastTarget = null;
        var dialog = comfortable.util.extend(comfortable.ui.createDialog([
            // columns
            comfortable.util.createElement('div', { style: { overflow: 'auto', height: '200px' } }, columnItems),
            // buttons
            comfortable.util.createElement('div', { style: { float: 'right' } }, [
                comfortable.ui.createButton(messages.RESET, function () {
                    dialog.dispose();
                    tableModel.orderedColumnIndices = null;
                    tableModel.hiddenColumns = {};
                    tableModel.trigger('beforecellsizechange');
                    table.setLockLeft(table.defaultLockColumn);
                    table.enableLockColumn = true;
                    table.invalidate();
                }),
                comfortable.ui.createButton(messages.APPLY, function () {
                    dialog.dispose();
                    var orderedColumnIndices = [];
                    var hiddenColumns = {};
                    var lockColumn = 0;
                    var enableLockColumn = true;
                    columns.forEach(function (column, col) {
                        if (column.type == 'column') {
                            for (var i = 0; i < column.colSpan; i += 1) {
                                orderedColumnIndices.push(i + column.col);
                            }
                            if (column.hidden) {
                                hiddenColumns[tableModel.getOrderedColumnIndexAt(column.col)] = true;
                            }
                        }
                        else if (column.type == ColumnType.LOCK_COLUMN) {
                            lockColumn = col < columns.length - 1 ? col : 0;
                            enableLockColumn = !column.hidden;
                        }
                    });
                    tableModel.orderedColumnIndices = orderedColumnIndices;
                    tableModel.hiddenColumns = hiddenColumns;
                    tableModel.trigger('beforecellsizechange');
                    table.setLockLeft(lockColumn);
                    table.enableLockColumn = enableLockColumn;
                    table.invalidate();
                }),
                comfortable.ui.createButton(messages.CANCEL, function () {
                    dialog.dispose();
                })
            ])
        ])).on('beforeshow', function () {
            var left = document.documentElement.scrollLeft +
                ((window.innerWidth - this.$el.offsetWidth) / 2);
            var top = document.documentElement.scrollTop +
                ((window.innerHeight - this.$el.offsetHeight) / 2);
            this.$el.style.left = left + 'px';
            this.$el.style.top = top + 'px';
        });
        dialog.show();
    };
    var enableHover = function (table) {
        var tableModel = table.model;
        var setHoverRowImpl = function (row, hover) {
            table.forEachCells(function (td) {
                var itemIndex = tableModel.getItemIndexAt(td.row, td.col);
                if (itemIndex.row != row) {
                    // skip
                    return;
                }
                comfortable.util.$(td.$el).addClass('${prefix}-item-hover', !hover);
                //var cs = null;
                for (var i = 0; i < td.$el.childNodes.length; i += 1) {
                    var child = td.$el.childNodes[i];
                    /*
                    if (child.tagName == 'INPUT' || child.tagName == 'SELECT') {
                      if (cs == null) {
                        cs = window.getComputedStyle(td.$el, null);
                      }
                      child.style.backgroundColor = cs.backgroundColor;
                    }
                    */
                }
            });
        };
        var setHoverRow = function (hoverRow) {
            if (tableModel.hoverRow != hoverRow) {
                if (tableModel.hoverRow != -1) {
                    setHoverRowImpl(tableModel.hoverRow, false);
                }
                tableModel.hoverRow = hoverRow;
                if (tableModel.hoverRow != -1) {
                    setHoverRowImpl(tableModel.hoverRow, true);
                }
            }
        };
        return table.on('mouseover', function (event, detail) {
            setHoverRow(detail.itemIndex.row);
        }).
            on('mouseout', function (event, detail) {
            setHoverRow(-1);
        });
    };
    var enableRowSelect = function (table) {
        return table.on('click', function (event, detail) {
            if (detail.itemIndex.row != -1) {
                var lastSelectedRows = {};
                for (var k in this.model.selectedRows) {
                    lastSelectedRows[k] = true;
                }
                if (this.model.multipleRowsSelectable && detail.originalEvent.ctrlKey) {
                    // ctrl + click : toggle selection
                    if (!this.model.selectedRows[detail.itemIndex.row]) {
                        this.model.selectedRows[detail.itemIndex.row] = true;
                    }
                    else {
                        delete this.model.selectedRows[detail.itemIndex.row];
                    }
                }
                else {
                    this.model.selectedRows = {};
                    this.model.selectedRows[detail.itemIndex.row] = true;
                }
                // check changed.
                var changed = false;
                for (var k in this.model.selectedRows) {
                    if (lastSelectedRows[k]) {
                        delete lastSelectedRows[k];
                    }
                    else {
                        changed = true;
                        break;
                    }
                }
                for (var k in lastSelectedRows) {
                    changed = true;
                    break;
                }
                if (changed) {
                    this.invalidate();
                    this.model.trigger('rowselectionchange', { selectedRows: this.model.selectedRows });
                }
            }
        });
    };
    var setupDefaults = function (template) {
        // body => head
        var inheritFromBody = ['dataType',
            'options', 'labelField', 'valueField'];
        var bodyDataCells = {};
        template.tbody.forEach(function (tr) {
            tr.forEach(function (cell) {
                if (typeof cell.dataField == 'string') {
                    bodyDataCells[cell.dataField] = cell;
                }
            });
        });
        template.thead.forEach(function (tr) {
            tr.forEach(function (cell) {
                if (typeof cell.dataField == 'string') {
                    var bodyDataCell = bodyDataCells[cell.dataField];
                    if (bodyDataCell) {
                        inheritFromBody.forEach(function (prop) {
                            if (bodyDataCell[prop] &&
                                typeof cell[prop] == 'undefined') {
                                cell[prop] = bodyDataCell[prop];
                            }
                        });
                    }
                }
            });
        });
        template.thead.forEach(function (row) {
            row.forEach(function (cell) {
                if (!cell.factory && cell.dataType) {
                    cell.factory = comfortable.createDefaultHeaderCellRendererFactory(cell);
                }
            });
        });
        template.tbody.forEach(function (row) {
            row.forEach(function (cell) {
                if (!cell.factory && cell.dataType) {
                    cell.factory = comfortable.createDefaultCellRendererFactory(cell);
                }
            });
        });
    };
    comfortable.fromTemplate = function (template) {
        if (template.thead && !template.tbody) {
            // set default tbody if not exists.
            var cloneIfExists = function (src, props) {
                var dst = {};
                props.forEach(function (prop) {
                    !src[prop] || (dst[prop] = src[prop]);
                });
                return dst;
            };
            var props = ['colSpan', 'rowSpan', 'dataField'];
            template.tbody = template.thead.map(function (tr) {
                return tr.map(function (headCell) {
                    return cloneIfExists(headCell, props);
                });
            });
        }
        template.thead = template.thead || [[]];
        template.tbody = template.tbody || [[]];
        // setup defaults.
        setupDefaults(template);
        var columnCount = 0;
        var cellWidth = {};
        var cellHeight = {};
        var columnDraggable = {};
        var columnResizable = {};
        var styles = function () {
            var spaned = {};
            var setSpaned = function (row, col, cell) {
                for (var r = 0; r < cell.rowSpan; r += 1) {
                    for (var c = 0; c < cell.colSpan; c += 1) {
                        spaned[comfortable.util.getCellId(row + r, col + c)] = true;
                    }
                }
            };
            return template.thead.concat(template.tbody).map(function (tr, row) {
                var style = {};
                var col = 0;
                var c = 0;
                while (c < tr.length) {
                    var id = comfortable.util.getCellId(row, col);
                    if (spaned[id]) {
                        col += 1;
                        continue;
                    }
                    var td = tr[c];
                    var cell = comfortable.util.extend({ rowSpan: 1, colSpan: 1 }, td);
                    setSpaned(row, col, cell);
                    if (typeof cell.width == 'number') {
                        cellWidth[col] = cell.width;
                    }
                    if (typeof cell.height == 'number') {
                        cellHeight[row] = cell.height;
                    }
                    if (typeof cell.columnDraggable == 'boolean') {
                        columnDraggable[col] = cell.columnDraggable;
                    }
                    if (typeof cell.columnResizable == 'boolean') {
                        columnResizable[col] = cell.columnResizable;
                    }
                    style[col] = td;
                    col += cell.colSpan;
                    c += 1;
                }
                columnCount = Math.max(columnCount, col);
                return style;
            });
        }();
        var getCellStyleAt = function (row, col) {
            if (row < headLength) {
                return styles[row][col] || {};
            }
            else {
                return styles[headLength + (row - headLength) % bodyLength][col] || {};
            }
        };
        var headLength = template.thead.length;
        var bodyLength = template.tbody.length;
        var TemplateTableImpl = /** @class */ (function (_super) {
            __extends(TemplateTableImpl, _super);
            function TemplateTableImpl() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.lockLeft = template.lockColumn || 0;
                _this.enableLockColumn = true;
                // keep default value for restore.
                _this.defaultLockColumn = _this.lockLeft;
                return _this;
            }
            TemplateTableImpl.prototype.setLockLeft = function (lockLeft) {
                this.lockLeft = lockLeft;
            };
            TemplateTableImpl.prototype.getLockLeft = function () {
                return !this.enableLockColumn ? 0 : this.lockLeft;
            };
            TemplateTableImpl.prototype.getLockTop = function () { return headLength; };
            TemplateTableImpl.prototype.getContextMenuItems = function () {
                var messages = comfortable.i18n.getMessages();
                var tableModel = table.model;
                return [
                    {
                        label: messages.RESET_FILTER,
                        action: function () {
                            tableModel.resetFilter();
                        }
                    },
                    {
                        label: messages.EDIT_COLUMNS,
                        action: function () {
                            showColumnEditDialog(table);
                        }
                    }
                ];
            };
            return TemplateTableImpl;
        }(comfortable.TableImpl));
        var TemplateTableModelImpl = /** @class */ (function (_super) {
            __extends(TemplateTableModelImpl, _super);
            function TemplateTableModelImpl() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                // user defines
                _this.defaultHeaderCellRendererFactory = comfortable.createDefaultHeaderCellRendererFactory();
                _this.cellWidth = cellWidth;
                _this.cellHeight = cellHeight;
                _this.columnDraggable = columnDraggable;
                _this.columnResizable = columnResizable;
                _this.orderedColumnIndices = null;
                _this.filterContext = createFilterContext();
                _this.hiddenColumns = {};
                _this.items = [];
                _this.filteredItems = null;
                _this.hoverRow = -1;
                _this.multipleRowsSelectable = false;
                _this.selectedRows = {};
                return _this;
            }
            TemplateTableModelImpl.prototype.resetFilter = function () {
                this.filterContext = createFilterContext();
                this.filteredItems = null;
                table.invalidate();
            };
            TemplateTableModelImpl.prototype.getItemCount = function () {
                return (this.filteredItems || this.items).length;
            };
            TemplateTableModelImpl.prototype.getItemAt = function (row) {
                return (this.filteredItems || this.items)[row];
            };
            TemplateTableModelImpl.prototype.getOrderedColumnIndexAt = function (col) {
                if (this.orderedColumnIndices == null) {
                    this.orderedColumnIndices = createDefaultOrderedColumnIndices(this);
                }
                return this.orderedColumnIndices[col];
            };
            TemplateTableModelImpl.prototype.getItemIndexAt = function (row, col) {
                if (row < headLength) {
                    return { row: -1, col: -1 };
                }
                else {
                    var orderedCol = this.getOrderedColumnIndexAt(col);
                    var style = getCellStyleAt(row, orderedCol);
                    row -= headLength;
                    return {
                        row: ~~(row / bodyLength),
                        col: style.dataField ||
                            ((row % bodyLength) * this.getColumnCount() + orderedCol)
                    };
                }
            };
            TemplateTableModelImpl.prototype.setValueAt = function (row, col, value) {
                if (row < headLength) {
                }
                else {
                    var itemIndex = this.getItemIndexAt(row, col);
                    var item = this.getItemAt(itemIndex.row);
                    if (item) {
                        item[itemIndex.col] = value;
                    }
                }
            };
            // overrides
            TemplateTableModelImpl.prototype.getRowCount = function () {
                return headLength +
                    bodyLength * this.getItemCount();
            };
            TemplateTableModelImpl.prototype.getColumnCount = function () { return columnCount; };
            TemplateTableModelImpl.prototype.getLineRowCountAt = function (row) {
                return row < headLength ? headLength : bodyLength;
            };
            TemplateTableModelImpl.prototype.getLineRowAt = function (row) {
                return row < headLength ? row : (row - headLength) % bodyLength;
            };
            TemplateTableModelImpl.prototype.getCellWidthAt = function (col) {
                var orderedCol = this.getOrderedColumnIndexAt(col);
                if (this.hiddenColumns[orderedCol]) {
                    return 0;
                }
                var v = this.cellWidth[orderedCol];
                return typeof v == 'number' ? v : this.defaultCellWidth;
            };
            TemplateTableModelImpl.prototype.getCellHeightAt = function (row) {
                var v = this.cellHeight[row];
                return typeof v == 'number' ? v : this.defaultCellHeight;
            };
            TemplateTableModelImpl.prototype.isColumnDraggableAt = function (col) {
                var orderedCol = this.getOrderedColumnIndexAt(col);
                var v = this.columnDraggable[orderedCol];
                return typeof v == 'boolean' ? v : true;
            };
            TemplateTableModelImpl.prototype.isColumnResizableAt = function (col) {
                var orderedCol = this.getOrderedColumnIndexAt(col);
                var v = this.columnResizable[orderedCol];
                return typeof v == 'boolean' ? v : true;
            };
            TemplateTableModelImpl.prototype.getCellRendererFactoryAt = function (row, col) {
                var orderedCol = this.getOrderedColumnIndexAt(col);
                return getCellStyleAt(row, orderedCol).factory || (row < headLength ?
                    this.defaultHeaderCellRendererFactory :
                    this.defaultCellRendererFactory);
            };
            TemplateTableModelImpl.prototype.getCellStyleAt = function (row, col) {
                var orderedCol = this.getOrderedColumnIndexAt(col);
                var style = comfortable.util.extend({}, getCellStyleAt(row, orderedCol));
                style.className = style.className || '';
                if (row < headLength) {
                    style.className += ' ${prefix}-header';
                    style.editable = false;
                }
                else {
                    var itemIndex = this.getItemIndexAt(row, col);
                    row -= headLength;
                    style.className += ' ${prefix}-' +
                        (itemIndex.row % 2 == 0 ? 'even' : 'odd');
                    if (this.selectedRows[itemIndex.row]) {
                        style.className += ' ${prefix}-item-selected';
                    }
                }
                if (style.editable === false) {
                    style.className += ' ${prefix}-readonly';
                }
                return style;
            };
            TemplateTableModelImpl.prototype.getValueAt = function (row, col) {
                var orderedCol = this.getOrderedColumnIndexAt(col);
                if (row < headLength) {
                    return getCellStyleAt(row, orderedCol).label || '';
                }
                else {
                    var itemIndex = this.getItemIndexAt(row, col);
                    var value = this.getItemAt(itemIndex.row)[itemIndex.col];
                    return typeof value != 'undefined' ? value : '';
                }
            };
            return TemplateTableModelImpl;
        }(comfortable.DefaultTableModel));
        var table = new TemplateTableImpl(new TemplateTableModelImpl());
        table.on('mousedown', function (event, detail) {
            if (detail.row < this.getLockTop()) {
                // on header.
                this.editor.endEdit();
                this.invalidate();
            }
        }).on('contextmenu', function (event, detail) {
            if (!(detail.row < table.getLockTop())) {
                return;
            }
            var menuItems = this.getContextMenuItems();
            if (!menuItems || menuItems.length == 0) {
                return;
            }
            detail.originalEvent.preventDefault();
            comfortable.util.callLater(function () {
                comfortable.ui.showMenu(detail.originalEvent.pageX, detail.originalEvent.pageY, menuItems);
            });
        });
        table.model.on('valuechange', function (event, detail) {
            this.setValueAt(detail.row, detail.col, detail.newValue);
        }).on('cellsizechange', function (event, detail) {
            if (typeof detail.col == 'number') {
                var orderedCol = this.getOrderedColumnIndexAt(detail.col);
                this.cellWidth[orderedCol] = detail.cellWidth;
            }
        }).on('columndragged', function (event, detail) {
            this.orderedColumnIndices = comfortable.util.moveSublist(this.orderedColumnIndices, detail.colFrom, detail.colSpan, detail.colTo);
            if (detail.colFrom < table.lockLeft && table.lockLeft <= detail.colTo) {
                table.lockLeft -= detail.colSpan;
            }
            else if (detail.colTo < table.lockLeft && table.lockLeft <= detail.colFrom) {
                table.lockLeft += detail.colSpan;
            }
        }).on('filterchange', function () {
            // apply filter
            var filters = this.filterContext.filters;
            var filteredItems = this.items.filter(function (item) {
                var filtered = false;
                for (var dataField in filters) {
                    if (filters[dataField][item[dataField]]) {
                        filtered = true;
                        break;
                    }
                }
                return !filtered;
            });
            var sort = this.filterContext.sort;
            if (sort) {
                var order = sort.sortOrder == comfortable.SortOrder.ASC ? 1 : -1;
                var dataField = sort.dataField;
                var indexField = '.index';
                var sortKeyField = '.sortKey';
                var comparator = this.filterContext['.comparator'];
                filteredItems.forEach(function (item, i) {
                    item[indexField] = i;
                    item[sortKeyField] = (item[dataField] === null ||
                        typeof item[dataField] == 'undefined') ? '' : item[dataField];
                });
                if (comparator) {
                    // sort by custom comparator.
                    delete this.filterContext['.comparator'];
                    filteredItems.sort(function (item1, item2) {
                        var result = comparator(item1[sortKeyField], item2[sortKeyField]);
                        if (result != 0) {
                            return order * result;
                        }
                        return order * (item1[indexField] < item2[indexField] ? -1 : 1);
                    });
                }
                else {
                    filteredItems.sort(function (item1, item2) {
                        if (item1[sortKeyField] != item2[sortKeyField]) {
                            return order * (item1[sortKeyField] < item2[sortKeyField] ? -1 : 1);
                        }
                        return order * (item1[indexField] < item2[indexField] ? -1 : 1);
                    });
                }
                filteredItems.forEach(function (item) {
                    delete item[indexField];
                    delete item[sortKeyField];
                });
            }
            this.filteredItems = filteredItems;
            table.invalidate();
        });
        // append itemIndex to events.
        ['valuechange'].
            forEach(function (type) {
            table.model.on(type, function (event, detail) {
                detail.itemIndex = this.getItemIndexAt(detail.row, detail.col);
            });
        });
        comfortable.tableEventTypes.forEach(function (type) {
            table.on(type, function (event, detail) {
                detail.itemIndex = this.model.getItemIndexAt(detail.row, detail.col);
            });
        });
        enableHover(table);
        enableRowSelect(table);
        return table;
    };
})(comfortable || (comfortable = {}));
/*!
 * comfortable
 *
 * Copyright (c) 2018 Kazuhiko Arase
 *
 * URL: https://github.com/kazuhikoarase/comfortable-js/
 *
 * Licensed under the MIT license:
 *  http://www.opensource.org/licenses/mit-license.php
 */
var comfortable;
(function (comfortable) {
    'use strict';
})(comfortable || (comfortable = {}));
/*!
 * comfortable
 *
 * Copyright (c) 2018 Kazuhiko Arase
 *
 * URL: https://github.com/kazuhikoarase/comfortable-js/
 *
 * Licensed under the MIT license:
 *  http://www.opensource.org/licenses/mit-license.php
 */
var comfortable;
(function (comfortable) {
    'use strict';
    var table = {
        template: '<div class="comfortable"></div>',
        props: {
            template: { 'default': function () {
                    return {
                        thead: [[{ label: 'col1' }, { label: 'col2' }, { label: 'col3' }]]
                    };
                } }
        },
        methods: {
            invalidate: function () {
                this.$options.table.invalidate();
                return this;
            },
            setItems: function (items) {
                this.$options.table.model.items = items;
                this.invalidate();
                return this;
            },
            getItems: function () {
                return this.$options.table.model.items;
            },
            getModel: function () {
                return this.$options.table.model;
            },
            getLockTop: function () {
                return this.$options.table.getLockTop();
            },
            getLockLeft: function () {
                return this.$options.table.getLockLeft();
            }
        },
        mounted: function () {
            var table = comfortable.fromTemplate(this.template);
            // set default values.
            table.$el.style.width = '100%';
            table.$el.style.height = '100%';
            this.$el.style.width = this.$el.style.width || '400px';
            this.$el.style.height = this.$el.style.height || '200px';
            // emit events.
            var emitEventHandler = function (event, detail) {
                this.$emit(event.type, event, detail);
            }.bind(this);
            [
                'mousedown', 'mouseover', 'mouseout',
                'click', 'dblclick', 'contextmenu'
            ].forEach(function (type) {
                table.on(type, emitEventHandler);
            });
            table.model.on('valuechange', emitEventHandler);
            // as a non-reactive property, set to $options.
            this.$options.table = table;
            this.$el.appendChild(table.$el);
            var items = this.items;
            this.setItems(items ? JSON.parse(items) : []);
            // observe the size of table.
            comfortable.util.extend(this.$options, {
                observeInterval: 20,
                alive: true, lastSize: { width: 0, height: 0 }
            });
            var observeSize = function () {
                var size = {
                    width: this.$el.offsetWidth,
                    height: this.$el.offsetHeight
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
        beforeDestroy: function () {
            // stop observing
            this.$options.alive = false;
        }
    };
    comfortable.vueComponents = {
        table: table
    };
})(comfortable || (comfortable = {}));
/*!
 * comfortable
 *
 * Copyright (c) 2018 Kazuhiko Arase
 *
 * URL: https://github.com/kazuhikoarase/comfortable-js/
 *
 * Licensed under the MIT license:
 *  http://www.opensource.org/licenses/mit-license.php
 */
var comfortable;
(function (comfortable) {
    var i18n;
    (function (i18n) {
        'use strict';
        /**
         * @internal
         */
        i18n.en = {
            messages: {
                RESET_FILTER: 'Clear Sort and Filters',
                EDIT_COLUMNS: 'Column Visibility and Order',
                SORT_ASC: 'Sort Ascending',
                SORT_DESC: 'Sort Descending',
                APPLY: 'Apply',
                OK: 'OK',
                CANCEL: 'Cancel',
                RESET: 'Reset',
                LOCK_COLUMN: '< Lock Column >',
                SELECT_BLANK: '(Space)',
                SELECT_ALL: '(Select All)'
            }
        };
    })(i18n = comfortable.i18n || (comfortable.i18n = {}));
})(comfortable || (comfortable = {}));
/*!
 * comfortable
 *
 * Copyright (c) 2018 Kazuhiko Arase
 *
 * URL: https://github.com/kazuhikoarase/comfortable-js/
 *
 * Licensed under the MIT license:
 *  http://www.opensource.org/licenses/mit-license.php
 */
var comfortable;
(function (comfortable) {
    var i18n;
    (function (i18n) {
        'use strict';
        /**
         * @internal
         */
        i18n.ja = {
            messages: {
                RESET_FILTER: '並び替えとフィルタをクリア',
                EDIT_COLUMNS: '列の表示と順序',
                SORT_ASC: '昇順',
                SORT_DESC: '降順',
                APPLY: '適用',
                OK: 'OK',
                CANCEL: 'キャンセル',
                RESET: '初期値に戻す',
                LOCK_COLUMN: '< 列固定位置 >',
                SELECT_BLANK: '(空白)',
                SELECT_ALL: '(全て選択)'
            }
        };
    })(i18n = comfortable.i18n || (comfortable.i18n = {}));
})(comfortable || (comfortable = {}));

//# sourceMappingURL=comfortable.js.map
