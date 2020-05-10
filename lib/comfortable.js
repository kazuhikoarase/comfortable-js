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
var comfortable;
(function (comfortable) {
    if (typeof exports === 'object') {
        module.exports = comfortable;
    }
})(comfortable || (comfortable = {}));
var comfortable;
(function (comfortable) {
    comfortable.createDefaultCellRendererFactoryOpts = function () {
        return {
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
                else if (this.dataType == 'date') {
                    return comfortable.util.formatDate(value);
                }
                else if (this.dataType == 'select-one') {
                    var options = comfortable.renderer.SelectBox.getOptions(cell);
                    if (typeof options.splice != 'function') {
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
                    return '' + value;
                }
            },
            editorPool: createEditorPool()
        };
    };
    var createEditorPool = function () {
        var pool = {};
        var getPool = function (dataType) {
            return pool[dataType] || (pool[dataType] = []);
        };
        return {
            getEditor: function (dataType) {
                var pool = getPool(dataType);
                if (pool.length > 0) {
                    return pool.shift();
                }
                if (this.dataType == 'select-one') {
                }
                else if (dataType == 'boolean') {
                    return new comfortable.renderer.CheckBox();
                }
                return new comfortable.renderer.TextEditor(dataType);
            },
            releaseEditor: function (dataType, editor) {
                getPool(dataType).push(editor);
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
                    editor = opts.editorPool.getEditor(opts.dataType);
                    td.$el.appendChild(editor.$el);
                }
                labelRenderer.setVisible(false);
                editor.beginEdit(td, cell);
                editor.setVisible(true);
                editor.setValue(oldValue = cell.value);
            };
            var renderIsEditor = opts.renderIsEditor;
            if (typeof renderIsEditor == 'undefined') {
                renderIsEditor = opts.dataType == 'boolean' ||
                    opts.dataType == 'select-one' ||
                    opts.dataType == 'date' ||
                    opts.dataType == 'multi-line-string';
            }
            var editing = false;
            return {
                getCellStyle: function (cell) {
                    if (!renderIsEditor) {
                        if (!cell.textAlign && opts.dataType == 'number') {
                            return { style: { textAlign: 'right' } };
                        }
                    }
                    return {};
                },
                render: function (cell) {
                    if (!renderIsEditor) {
                        labelRenderer.setLabel(opts.labelFunction(cell.value, cell));
                    }
                    else {
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
                            if (!editor) {
                                return null;
                            }
                            editing = false;
                            if (!renderIsEditor) {
                                labelRenderer.setVisible(true);
                                editor.setVisible(false);
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
                    if (editor != null) {
                        td.$el.removeChild(editor.$el);
                        opts.editorPool.releaseEditor(opts.dataType, editor);
                        editor = null;
                    }
                }
            };
        };
    };
    var linesRe = /\r?\n/g;
    comfortable.createMultiLineLabelRenderer = function (parent) {
        var elms = null;
        var lastLabel = null;
        return {
            setLabel: function (label) {
                if (lastLabel === label) {
                    return;
                }
                lastLabel = label;
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
var comfortable;
(function (comfortable) {
    var EventTargetImpl = (function () {
        function EventTargetImpl() {
            this.map = {};
        }
        EventTargetImpl.prototype.listeners = function (type) {
            return this.map[type] || (this.map[type] = []);
        };
        EventTargetImpl.prototype.trigger = function (type, detail) {
            var ctx = this;
            var event = new EventImpl(type);
            this.listeners(type).forEach(function (listener) {
                listener.call(ctx, event, detail);
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
        EventTargetImpl.prototype.once = function (type, listener) {
            var wrapper = function (event, detail) {
                listener.apply(this, arguments);
                this.off(type, wrapper);
            };
            this.on(type, wrapper);
            return this;
        };
        return EventTargetImpl;
    }());
    comfortable.EventTargetImpl = EventTargetImpl;
    var EventImpl = (function () {
        function EventImpl(type) {
            this.defaultPrevented = false;
            this.type = type;
        }
        EventImpl.prototype.preventDefault = function () {
            this.defaultPrevented = true;
        };
        return EventImpl;
    }());
})(comfortable || (comfortable = {}));
var comfortable;
(function (comfortable) {
    var DefaultTableModel = (function (_super) {
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
        DefaultTableModel.prototype.getLockTop = function () { return 0; };
        DefaultTableModel.prototype.getLockLeft = function () { return 0; };
        DefaultTableModel.prototype.getLockBottom = function () { return 0; };
        DefaultTableModel.prototype.getLockRight = function () { return 0; };
        DefaultTableModel.prototype.getRowCount = function () { return 1E5; };
        DefaultTableModel.prototype.getColumnCount = function () { return 1E5; };
        DefaultTableModel.prototype.getLineRowAt = function (row) { return row; };
        DefaultTableModel.prototype.getLineRowCountAt = function (row) { return this.getRowCount(); };
        DefaultTableModel.prototype.getValueAt = function (row, col) { return row + ',' + col; };
        DefaultTableModel.prototype.getTooltipAt = function (row, col) { return ''; };
        DefaultTableModel.prototype.getCellStyleAt = function (row, col) { return {}; };
        DefaultTableModel.prototype.getCellRendererFactoryAt = function (row, col) { return this.defaultCellRendererFactory; };
        DefaultTableModel.prototype.getCellWidthAt = function (col) { return this.defaultCellWidth; };
        DefaultTableModel.prototype.getCellHeightAt = function (row) { return this.defaultCellHeight; };
        DefaultTableModel.prototype.getCellAt = function (row, col) {
            return comfortable.util.extend({
                row: row, col: col,
                value: this.getValueAt(row, col),
                tooltip: this.getTooltipAt(row, col)
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
        DefaultTableModel.prototype.isColumnDraggable = function () { return true; };
        DefaultTableModel.prototype.isColumnHiddenAt = function (col) { return false; };
        return DefaultTableModel;
    }(comfortable.EventTargetImpl));
    comfortable.DefaultTableModel = DefaultTableModel;
})(comfortable || (comfortable = {}));
var comfortable;
(function (comfortable) {
    var i18n;
    (function (i18n) {
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
var comfortable;
(function (comfortable) {
    var i18n;
    (function (i18n) {
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
                SELECT_ALL: '(Select All)',
                SEARCH: 'Search',
                CLEAR_FILTER_FROM: 'Clear Filter From "{0}"',
                TEXT_FILTERS: 'Text Filters',
                NUMBER_FILTERS: 'Number Filters',
                DATE_FILTERS: 'Date Filters',
                OP_LAYOUT: 'L',
                AND: 'AND',
                OR: 'OR',
                EQUALS: 'Equals',
                NOT_EQUALS: 'Not Equals',
                GREATER_THAN: 'Greater Than',
                GREATER_THAN_OR_EQUALS: 'Greater Than or Equals',
                LESS_THAN: 'Less Than',
                LESS_THAN_OR_EQUALS: 'Less Than or Equals',
                STARTS_WITH: 'Starts With',
                NOT_STARTS_WITH: 'Not Starts With',
                ENDS_WITH: 'Ends With',
                NOT_ENDS_WITH: 'Not Ends With',
                CONTAINS: 'Contains',
                NOT_CONTAINS: 'Not Contains',
                WEEKDAYS: 'Su,Mo,Tu,We,Th,Fr,Sa'
            }
        };
    })(i18n = comfortable.i18n || (comfortable.i18n = {}));
})(comfortable || (comfortable = {}));
var comfortable;
(function (comfortable) {
    var i18n;
    (function (i18n) {
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
                SELECT_ALL: '(全て選択)',
                TEXT_FILTERS: 'テキストフィルタ',
                NUMBER_FILTERS: '数値フィルタ',
                DATE_FILTERS: '日付フィルタ',
                SEARCH: '検索',
                CLEAR_FILTER_FROM: '"{0}" からフィルタをクリア',
                OP_LAYOUT: 'R',
                AND: 'AND',
                OR: 'OR',
                EQUALS: 'と等しい',
                NOT_EQUALS: 'と等しくない',
                GREATER_THAN: 'より大きい',
                GREATER_THAN_OR_EQUALS: '以上',
                LESS_THAN: 'より小さい',
                LESS_THAN_OR_EQUALS: '以下',
                STARTS_WITH: 'で始まる',
                NOT_STARTS_WITH: 'で始まらない',
                ENDS_WITH: 'で終わる',
                NOT_ENDS_WITH: 'で終わらない',
                CONTAINS: 'を含む',
                NOT_CONTAINS: 'を含まない',
                WEEKDAYS: '日,月,火,水,木,金,土'
            }
        };
    })(i18n = comfortable.i18n || (comfortable.i18n = {}));
})(comfortable || (comfortable = {}));
var comfortable;
(function (comfortable) {
    var UIEventTargetImpl = (function (_super) {
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
var comfortable;
(function (comfortable) {
    var createTableState = function () {
        return {
            left: 0, top: 0, width: 0, height: 0,
            minRow: 0, maxRow: 0, minCol: 0, maxCol: 0,
            indexById: {}
        };
    };
    var applyCellStyle = function (elm, opts) {
        var diffOpts = { attrs: {}, style: {}, props: {} };
        applyCellStyleProps(elm, opts, 'attrs', diffOpts);
        applyCellStyleProps(elm, opts, 'style', diffOpts);
        applyCellStyleProps(elm, opts, 'props', diffOpts);
        comfortable.util.set(elm.$el, diffOpts);
    };
    var applyCellStyleProps = function (elm, opts, propsName, diffOpts) {
        var props = opts[propsName];
        if (props) {
            for (var k in props) {
                var v = props[k];
                if (elm.opts[propsName][k] !== v) {
                    diffOpts[propsName][k] = elm.opts[propsName][k] = v;
                }
            }
        }
    };
    var InternalTableImpl = (function () {
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
            if (this.beforeCellSizeChangeHandler == null) {
                this.beforeCellSizeChangeHandler = function (event, detail) {
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
            var width = this.rect.width;
            var height = this.rect.height;
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
                var tr = this.getOrCrt('tr', trIndex, this.tbody);
                tr.$el.style.height = cellHeight + 'px';
                tr.$el.style.display = '';
                tableState.height += cellHeight;
                top += cellHeight;
                row += 1;
                trIndex += 1;
            }
            for (; trIndex < this._tbody.childNodes.length; trIndex += 1) {
                this._tbody.childNodes[trIndex].style.display = 'none';
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
        InternalTableImpl.prototype.setBounds = function (rect) {
            this.rect = rect;
            comfortable.util.extend(this.$el.style, {
                left: rect.left + 'px', top: rect.top + 'px',
                width: rect.width + 'px', height: rect.height + 'px'
            });
        };
        InternalTableImpl.prototype.render = function (cellStyleOnly) {
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
                td.opts = { attrs: {}, style: {}, props: {} };
                td.renderer = null;
                td.tableModel = tableModel;
                td.$el.style.overflow = 'hidden';
                td.$el.style.whiteSpace = 'nowrap';
                td.$el.style.position = 'relative';
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
                        while (td.$el.firstChild) {
                            td.$el.removeChild(td.$el.firstChild);
                        }
                        td.renderer = comfortable.renderer.attachTooltipFeature(td, td.factory(td));
                    }
                    applyCellStyle(td, this.getCellStyle(cell));
                    if (td.renderer.getCellStyle) {
                        applyCellStyle(td, td.renderer.getCellStyle(cell));
                    }
                    if (!cellStyleOnly) {
                        td.renderer.render(cell);
                    }
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
var comfortable;
(function (comfortable) {
    var ListImpl = (function (_super) {
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
var comfortable;
(function (comfortable) {
    var renderer;
    (function (renderer) {
        var CheckBox = (function () {
            function CheckBox() {
                var _this = this;
                this.booleanValues = null;
                this.$el = comfortable.util.createElement('input', {
                    attrs: { type: 'checkbox', 'class': '${prefix}-editor',
                        tabindex: '-1' },
                    on: {
                        blur: function (event) {
                            _this.tableModel.trigger('valuecommit', _this.cell);
                        },
                        keydown: function (event) {
                            if (!_this.cell.editable) {
                                return;
                            }
                            switch (event.keyCode) {
                                case 27:
                                    _this.setValue(_this.defaultValue);
                                    break;
                            }
                        }
                    }
                });
            }
            CheckBox.prototype.setVisible = function (visible) {
                this.$el.style.display = visible ? '' : 'none';
            };
            CheckBox.prototype.beginEdit = function (td, cell) {
                this.tableModel = td.tableModel;
                this.cell = cell;
                var cs = window.getComputedStyle(td.$el, null);
                comfortable.util.set(this.$el, {
                    props: { disabled: !cell.editable },
                    style: {}
                });
                this.booleanValues = cell.booleanValues || [false, true];
            };
            CheckBox.prototype.focus = function () {
                this.$el.focus();
                this.$el.select();
            };
            CheckBox.prototype.blur = function () {
                this.$el.blur();
            };
            CheckBox.prototype.setValue = function (value) {
                this.defaultValue = value;
                this.$el.checked = (value === this.booleanValues[1]);
            };
            CheckBox.prototype.getValue = function () {
                return this.booleanValues[this.$el.checked ? 1 : 0];
            };
            CheckBox.prototype.isValid = function () {
                return true;
            };
            return CheckBox;
        }());
        renderer.CheckBox = CheckBox;
    })(renderer = comfortable.renderer || (comfortable.renderer = {}));
})(comfortable || (comfortable = {}));
var comfortable;
(function (comfortable) {
    var renderer;
    (function (renderer) {
        var SelectBox = (function () {
            function SelectBox() {
                var _this = this;
                this.$el = comfortable.util.createElement('select', {
                    attrs: { 'class': '${prefix}-editor' },
                    on: {
                        blur: function (event) {
                            _this.tableModel.trigger('valuecommit', _this.cell);
                        },
                        keydown: function (event) {
                            if (!_this.cell.editable) {
                                return;
                            }
                            switch (event.keyCode) {
                                case 27:
                                    _this.setValue(_this.defaultValue);
                                    break;
                            }
                        }
                    }
                });
            }
            SelectBox.prototype.setVisible = function (visible) {
                this.$el.style.display = visible ? '' : 'none';
            };
            SelectBox.prototype.beginEdit = function (td, cell) {
                this.tableModel = td.tableModel;
                this.cell = cell;
                var cs = window.getComputedStyle(td.$el, null);
                comfortable.util.set(this.$el, {
                    props: { disabled: !cell.editable },
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
                var labelField = cell.labelField || 'label';
                var valueField = cell.valueField || 'value';
                var changed = function () {
                    if (!this.lastOptions || this.lastOptions.length != options.length) {
                        return true;
                    }
                    for (var i = 0; i < options.length; i += 1) {
                        var option = options[i];
                        var lastOption = this.lastOptions[i];
                        if (option[labelField] != option[labelField] ||
                            option[valueField] != option[valueField]) {
                            return true;
                        }
                    }
                    return false;
                }.bind(this)();
                if (changed) {
                    while (this.$el.childNodes.length < options.length) {
                        this.$el.appendChild(comfortable.util.createElement('option'));
                    }
                    var i = 0;
                    for (; i < options.length; i += 1) {
                        var option = options[i];
                        comfortable.util.set(this.$el.childNodes[i], {
                            style: { display: '' },
                            props: { textContent: option[labelField],
                                value: option[valueField] || '' }
                        });
                    }
                    while (this.$el.childNodes.length > options.length) {
                        this.$el.removeChild(this.$el.lastChild);
                    }
                    this.lastOptions = options;
                }
            };
            SelectBox.prototype.focus = function () {
                this.$el.focus();
            };
            SelectBox.prototype.blur = function () {
                this.$el.blur();
            };
            SelectBox.prototype.setValue = function (value) {
                this.defaultValue = value;
                this.$el.value = value || '';
            };
            SelectBox.prototype.getValue = function () {
                return this.$el.value;
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
        renderer.SelectBox = SelectBox;
    })(renderer = comfortable.renderer || (comfortable.renderer = {}));
})(comfortable || (comfortable = {}));
var comfortable;
(function (comfortable) {
    var renderer;
    (function (renderer) {
        renderer.createTextEditorDateField = function (editor) {
            var getDate = function () {
                if (editor.isValid()) {
                    var value = editor.getValue();
                    if (value) {
                        return new Date(+value.substring(0, 4), +value.substring(4, 6) - 1, +value.substring(6, 8));
                    }
                }
                return null;
            };
            var setSelectedDate = function (date) {
                editor.textfield.value = comfortable.util.formatDate(comfortable.util.parseDate(date));
            };
            var rollDate = function (offset) {
                var date = getDate();
                if (date) {
                    date.setDate(date.getDate() + offset);
                    setSelectedDate(date);
                }
            };
            comfortable.util.set(editor.textfield, {
                style: { flex: '1 1 0%' },
                on: {
                    keydown: function (event) {
                        if (!editor.cell.editable) {
                            return;
                        }
                        var canceled = false;
                        switch (event.keyCode) {
                            case 27:
                                canceled = true;
                            case 13:
                                if (cal) {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    hideCal();
                                    editor.textfield.select();
                                }
                                else {
                                    if (canceled) {
                                        editor.setValue(editor.defaultValue);
                                    }
                                }
                                break;
                            case 32:
                                event.preventDefault();
                                if (cal) {
                                }
                                else {
                                    showCal();
                                }
                                break;
                            case 37:
                                if (cal != null) {
                                    event.preventDefault();
                                    cal.rollDate(-1);
                                    setSelectedDate(cal.getSelectedDate());
                                }
                                break;
                            case 38:
                                event.preventDefault();
                                if (cal != null) {
                                    cal.rollDate(-7);
                                    setSelectedDate(cal.getSelectedDate());
                                }
                                else {
                                    rollDate(-1);
                                    editor.textfield.select();
                                }
                                break;
                            case 39:
                                if (cal != null) {
                                    event.preventDefault();
                                    cal.rollDate(1);
                                    setSelectedDate(cal.getSelectedDate());
                                }
                                break;
                            case 40:
                                event.preventDefault();
                                if (cal != null) {
                                    cal.rollDate(7);
                                    setSelectedDate(cal.getSelectedDate());
                                }
                                else {
                                    rollDate(1);
                                    editor.textfield.select();
                                }
                                break;
                            default:
                                break;
                        }
                    },
                    blur: function () {
                        hideCal();
                    }
                }
            });
            var cal = null;
            var mousedownHandler = function (event) {
                if (cal && comfortable.util.closest(event.target, { $el: cal.$el })) {
                }
                else if (comfortable.util.closest(event.target, { $el: button })) {
                }
                else {
                    hideCal();
                }
            };
            var showCal = function () {
                if (cal) {
                    hideCal();
                }
                cal = comfortable.ui.createCalendar(getDate() || new Date())
                    .on('click', function (event, date) {
                    setSelectedDate(date);
                    hideCal();
                });
                editor.enableEvent = false;
                var off = comfortable.util.offset(editor.textfield);
                comfortable.util.set(cal.$el, { style: {
                        position: 'absolute',
                        left: off.left + 'px',
                        top: (off.top + editor.textfield.offsetHeight) + 'px'
                    } });
                document.body.appendChild(cal.$el);
                comfortable.util.$(document).on('mousedown', mousedownHandler);
            };
            var hideCal = function () {
                if (cal) {
                    document.body.removeChild(cal.$el);
                    comfortable.util.$(document).off('mousedown', mousedownHandler);
                    cal = null;
                    editor.enableEvent = true;
                }
            };
            var button = comfortable.util.createElement('span', {
                attrs: { 'class': '${prefix}-cal-icon-button' },
                on: {
                    mousedown: function (event) {
                        event.preventDefault();
                    },
                    click: function (event) {
                        if (!editor.cell.editable) {
                            return;
                        }
                        if (cal) {
                            hideCal();
                        }
                        else {
                            showCal();
                        }
                    }
                }
            }, [comfortable.ui.createCalIcon(), comfortable.ui.createSpacer()]);
            var setValue = function (value) {
                value = comfortable.util.formatDate(value);
                editor.textfield.value = (value === null) ? '' : value;
            };
            var getValue = function () {
                return comfortable.util.parseDate(comfortable.util.toNarrowNumber(editor.textfield.value));
            };
            var visibleState = 'flex';
            return {
                body: comfortable.util.createElement('div', {
                    style: { display: visibleState,
                        width: '100%', height: '100%' }
                }, [editor.textfield, button]),
                button: button,
                setValue: setValue,
                getValue: getValue,
                visibleState: visibleState
            };
        };
    })(renderer = comfortable.renderer || (comfortable.renderer = {}));
})(comfortable || (comfortable = {}));
var comfortable;
(function (comfortable) {
    var renderer;
    (function (renderer) {
        renderer.createTextEditorSelectBox = function (editor) {
            var setSelectedIndex = function (index) {
                optionsData.selectedIndex = index;
                editor.textfield.value = index == -1 ? '' :
                    optionsData.options[index][optionsData.labelField];
            };
            var selectable = function (index) {
                return optionsData.options[index][optionsData.selectableField] !== false;
            };
            var rollIndex = function (offset) {
                var index = optionsData.selectedIndex;
                while (offset != 0 && 0 <= index + offset &&
                    index + offset < optionsData.options.length) {
                    index += offset;
                    if (selectable(index)) {
                        setSelectedIndex(index);
                        break;
                    }
                }
                if (0 <= index && index < optionsData.options.length) {
                }
                else {
                    setSelectedIndex(-1);
                }
            };
            comfortable.util.set(editor.textfield, {
                style: { flex: '1 1 0%' },
                on: {
                    keydown: function (event) {
                        if (!editor.cell.editable) {
                            return;
                        }
                        var canceled = false;
                        switch (event.keyCode) {
                            case 27:
                                canceled = true;
                            case 13:
                                if (options) {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    hideOptions();
                                    editor.textfield.select();
                                }
                                else {
                                    if (canceled) {
                                        editor.setValue(editor.defaultValue);
                                    }
                                }
                                break;
                            case 32:
                                event.preventDefault();
                                if (options) {
                                }
                                else {
                                    showOptions();
                                }
                                break;
                            case 37:
                                break;
                            case 38:
                                event.preventDefault();
                                if (options != null) {
                                    options.rollIndex(-1);
                                    setSelectedIndex(options.getSelectedIndex());
                                }
                                else {
                                    rollIndex(-1);
                                    editor.textfield.select();
                                }
                                break;
                            case 39:
                                break;
                            case 40:
                                event.preventDefault();
                                if (options != null) {
                                    options.rollIndex(1);
                                    setSelectedIndex(options.getSelectedIndex());
                                }
                                else {
                                    rollIndex(1);
                                    editor.textfield.select();
                                }
                                break;
                            default:
                                break;
                        }
                    },
                    blur: function () {
                        hideOptions();
                    }
                }
            });
            var options = null;
            var optionsData = null;
            var mousedownHandler = function (event) {
                if (options && comfortable.util.closest(event.target, { $el: options.$el })) {
                }
                else if (comfortable.util.closest(event.target, { $el: button })) {
                }
                else {
                    hideOptions();
                }
            };
            var showOptions = function () {
                if (options) {
                    hideOptions();
                }
                options = comfortable.ui.createOptions(optionsData)
                    .on('click', function (event, detail) {
                    setSelectedIndex(detail.index);
                    hideOptions();
                });
                editor.enableEvent = false;
                var target = editor.$el;
                var off = comfortable.util.offset(target);
                comfortable.util.set(options.$el, { style: {
                        position: 'absolute',
                        left: off.left + 'px',
                        top: (off.top + target.offsetHeight) + 'px',
                        minWidth: target.offsetWidth + 'px',
                        maxHeight: '200px'
                    } });
                document.body.appendChild(options.$el);
                comfortable.util.$(document).on('mousedown', mousedownHandler);
                options.rollIndex(0);
            };
            var hideOptions = function () {
                if (options) {
                    document.body.removeChild(options.$el);
                    comfortable.util.$(document).off('mousedown', mousedownHandler);
                    options = null;
                    editor.enableEvent = true;
                }
            };
            var button = comfortable.util.createElement('span', {
                attrs: { 'class': '${prefix}-options-icon-button' },
                on: {
                    mousedown: function (event) {
                        event.preventDefault();
                    },
                    click: function (event) {
                        if (!editor.cell.editable) {
                            return;
                        }
                        if (options) {
                            hideOptions();
                        }
                        else {
                            showOptions();
                        }
                    }
                }
            }, [comfortable.ui.createOptionsIcon(), comfortable.ui.createSpacer()]);
            var setValue = function (value) {
                var selectedIndex = -1;
                for (var i = 0; i < optionsData.options.length; i += 1) {
                    var option = optionsData.options[i];
                    if (selectedIndex == -1 &&
                        option[optionsData.valueField] === value) {
                        selectedIndex = i;
                    }
                }
                setSelectedIndex(selectedIndex);
            };
            var getValue = function () {
                return optionsData.selectedIndex == -1 ? null :
                    optionsData.options[optionsData.selectedIndex][optionsData.valueField];
            };
            var visibleState = 'flex';
            var beginEdit = function (td, cell) {
                optionsData = {
                    selectedIndex: -1,
                    options: renderer.SelectBox.getOptions(cell),
                    labelField: cell.labelField || 'label',
                    valueField: cell.valueField || 'value',
                    selectableField: cell.selectableField || 'selectable',
                    disabledField: cell.disabledField || 'disabled'
                };
            };
            return {
                body: comfortable.util.createElement('div', {
                    style: { display: visibleState,
                        width: '100%', height: '100%' }
                }, [editor.textfield, button]),
                button: button,
                setValue: setValue,
                getValue: getValue,
                visibleState: visibleState,
                readOnlyText: true,
                beginEdit: beginEdit
            };
        };
    })(renderer = comfortable.renderer || (comfortable.renderer = {}));
})(comfortable || (comfortable = {}));
var comfortable;
(function (comfortable) {
    var renderer;
    (function (renderer) {
        var TextEditor = (function () {
            function TextEditor(dataType) {
                var _this = this;
                this.enableEvent = true;
                this.dataType = dataType;
                this.lastStyle = {};
                if (dataType == 'multi-line-string') {
                    this.textfield = comfortable.util.createElement('textarea', {
                        attrs: { 'class': '${prefix}-editor', rows: '1',
                            tabindex: '-1' },
                        on: {
                            blur: function (event) {
                                _this.tableModel.trigger('valuecommit', _this.cell);
                            },
                            keydown: function (event) {
                                if (event.keyCode == 13) {
                                    event.stopPropagation();
                                }
                            }
                        }
                    });
                }
                else {
                    this.textfield = comfortable.util.createElement('input', {
                        attrs: { type: 'text', 'class': '${prefix}-editor',
                            tabindex: '-1' },
                        on: { blur: function (event) {
                                if (_this.enableEvent) {
                                    _this.tableModel.trigger('valuecommit', _this.cell);
                                }
                            }
                        }
                    });
                }
                if (dataType == 'date') {
                    var df = renderer.createTextEditorDateField(this);
                    this.$el = df.body;
                    this.delegator = df;
                }
                else if (dataType == 'select-one') {
                    var sb = renderer.createTextEditorSelectBox(this);
                    this.$el = sb.body;
                    this.delegator = sb;
                }
                else {
                    comfortable.util.set(this.textfield, {
                        on: { keydown: function (event) {
                                if (!_this.cell.editable) {
                                    return;
                                }
                                switch (event.keyCode) {
                                    case 27:
                                        _this.setValue(_this.defaultValue);
                                        break;
                                }
                            } }
                    });
                    this.$el = this.textfield;
                    this.delegator = null;
                }
            }
            TextEditor.prototype.setVisible = function (visible) {
                if (this.delegator) {
                    this.$el.style.display = visible ?
                        this.delegator.visibleState : 'none';
                }
                else {
                    this.$el.style.display = visible ? '' : 'none';
                }
            };
            TextEditor.prototype.beginEdit = function (td, cell) {
                this.tableModel = td.tableModel;
                this.cell = cell;
                this.decimalDigits = cell.decimalDigits;
                var imeMode = '';
                if (typeof cell.imeMode == 'string') {
                    imeMode = cell.imeMode;
                }
                else {
                    if (this.dataType == 'number' ||
                        this.dataType == 'date' ||
                        this.dataType == 'select-one') {
                        imeMode = 'disabled';
                    }
                }
                delete this.textfield.maxLength;
                if (typeof cell.maxLength == 'number') {
                    this.textfield.maxLength = cell.maxLength;
                }
                var readOnly = !cell.editable;
                if (this.delegator && this.delegator.readOnlyText) {
                    readOnly = true;
                }
                var cs = window.getComputedStyle(td.$el, null);
                var opts = {
                    props: { readOnly: readOnly },
                    style: this.getChangedStyle({
                        imeMode: imeMode,
                        textAlign: cs.textAlign,
                        verticalAlign: cs.verticalAlign,
                        color: cs.color,
                        backgroundColor: 'transparent',
                        fontFamily: cs.fontFamily,
                        fontSize: cs.fontSize,
                        fontWeight: cs.fontWeight,
                        outline: cell.editable ? '' : 'none'
                    })
                };
                comfortable.util.set(this.textfield, opts);
                if (this.delegator) {
                    this.delegator.button.style.opacity = cell.editable ? '' : '0.5';
                    if (this.delegator.beginEdit) {
                        this.delegator.beginEdit(td, cell);
                    }
                }
            };
            TextEditor.prototype.getChangedStyle = function (style) {
                var changed = {};
                for (var k in style) {
                    var v = style[k];
                    if (this.lastStyle[k] !== v) {
                        this.lastStyle[k] = changed[k] = v;
                    }
                }
                return changed;
            };
            TextEditor.prototype.focus = function () {
                this.textfield.focus();
                this.textfield.select();
            };
            TextEditor.prototype.blur = function () {
                this.textfield.blur();
                var value = this.textfield.value;
                this.textfield.value = '';
                this.textfield.value = value;
            };
            TextEditor.prototype.setValue = function (value) {
                this.defaultValue = value;
                this.valueType = typeof value;
                if (this.delegator) {
                    this.delegator.setValue(value);
                }
                else {
                    this.textfield.value = (value === null) ? '' : value;
                }
            };
            TextEditor.prototype.getValue = function () {
                if (this.defaultValue === null && this.textfield.value == '') {
                    return null;
                }
                else if (this.delegator) {
                    return this.delegator.getValue();
                }
                else if (this.dataType == 'number') {
                    var value = comfortable.util.formatNumber(comfortable.util.toNarrowNumber(this.textfield.value), this.decimalDigits, '');
                    return this.valueType == 'number' ? +value : value;
                }
                else {
                    return comfortable.util.rtrim(this.textfield.value);
                }
            };
            TextEditor.prototype.isValid = function () {
                if (this.dataType == 'number') {
                    return !!('' + this.getValue()).match(comfortable.util.numRe);
                }
                else if (this.dataType == 'date') {
                    return !!('' + this.getValue()).match(/^(\d{8})?$/);
                }
                return true;
            };
            return TextEditor;
        }());
        renderer.TextEditor = TextEditor;
    })(renderer = comfortable.renderer || (comfortable.renderer = {}));
})(comfortable || (comfortable = {}));
var comfortable;
(function (comfortable) {
    var renderer;
    (function (renderer_1) {
        var createTooltip = function (td) {
            var size = 6;
            var tooltip = null;
            var mouseoverHandler = function (event) {
                if (!mark.text) {
                    return;
                }
                dispose();
                tooltip = showTooltip(td, mark.text);
            };
            var mouseoutHandler = function (event) {
                dispose();
            };
            var dispose = function () {
                if (tooltip) {
                    tooltip.dispose();
                    tooltip = null;
                }
            };
            comfortable.util.$(td.$el)
                .on('mouseover', mouseoverHandler)
                .on('mouseout', mouseoutHandler);
            var mark = {
                $el: comfortable.util.createSVGElement('svg', {
                    style: { position: 'absolute', right: '0px', top: '0px' },
                    attrs: { width: '' + size, height: '' + size,
                        tabindex: '-1', focusable: 'false',
                        'class': '${prefix}-tooltip-corner' }
                }, [
                    comfortable.util.createSVGElement('path', {
                        attrs: { d: 'M0 0L' + size + ' 0L' + size + ' ' + size + 'Z' }
                    })
                ]),
                text: '',
                show: function (text) {
                    this.text = text;
                    this.$el.style.display = text ? '' : 'none';
                },
                dispose: function () {
                    comfortable.util.$(td.$el)
                        .off('mouseover', mouseoverHandler)
                        .off('mouseout', mouseoutHandler);
                    dispose();
                }
            };
            return mark;
        };
        var calcOffset = function (td) {
            var off = comfortable.util.offset(td.$el);
            var frame = comfortable.util.closest(td.$el, { tagName: 'DIV' });
            var frameOff = comfortable.util.offset(frame);
            var offsetWidth = td.$el.offsetWidth;
            var displayWidth = offsetWidth;
            return {
                left: off.left,
                top: off.top,
                offsetWidth: offsetWidth,
                displayWidth: displayWidth
            };
        };
        var showTooltip = function (td, text) {
            var barW = 10;
            var barH = 6;
            var off = calcOffset(td);
            var box = comfortable.util.createElement('div', {
                style: { position: 'absolute' },
                attrs: { 'class': '${prefix}-tooltip-box' }
            });
            comfortable.createMultiLineLabelRenderer(box).setLabel(text);
            document.body.appendChild(box);
            var rblt = off.left + off.displayWidth + barW + box.offsetWidth <
                document.documentElement.scrollLeft + window.innerWidth;
            var bar = comfortable.util.createSVGElement('svg', {
                style: { position: 'absolute' },
                attrs: { 'class': '${prefix}-tooltip-bar',
                    width: '' + barW, height: '' + barH,
                    tabindex: '-1', focusable: 'false' }
            }, [comfortable.util.createSVGElement('path', {
                    attrs: { d: rblt ?
                            'M0 ' + barH + 'L' + barW + ' 0' :
                            'M0 0L' + barW + ' ' + barH }
                })]);
            document.body.appendChild(bar);
            var cs = window.getComputedStyle(box, null);
            bar.style.stroke = cs.borderColor || cs.borderBottomColor;
            bar.style.fill = 'none';
            if (rblt) {
                box.style.left = (off.left + off.displayWidth + barW - 1) + 'px';
                box.style.top = (off.top - barH + 1) + 'px';
                bar.style.left = (off.left + off.displayWidth) + 'px';
                bar.style.top = (off.top - barH + 1) + 'px';
            }
            else {
                box.style.left = (off.left + off.displayWidth - barW - box.offsetWidth + 1) + 'px';
                box.style.top = (off.top - barH - box.offsetHeight + 1) + 'px';
                bar.style.left = (off.left + off.displayWidth - barW) + 'px';
                bar.style.top = (off.top - barH + 1) + 'px';
            }
            return {
                dispose: function () {
                    document.body.removeChild(box);
                    document.body.removeChild(bar);
                }
            };
        };
        renderer_1.attachTooltipFeature = function (td, renderer) {
            var tooltip = null;
            return {
                getCellStyle: renderer.getCellStyle,
                render: function (cell) {
                    if (cell.tooltip) {
                        if (!tooltip) {
                            tooltip = createTooltip(td);
                            td.$el.appendChild(tooltip.$el);
                        }
                        tooltip.show(cell.tooltip);
                    }
                    else {
                        if (tooltip) {
                            tooltip.show('');
                        }
                    }
                    renderer.render(cell);
                },
                beginEdit: renderer.beginEdit,
                dispose: function () {
                    renderer.dispose();
                    if (tooltip) {
                        tooltip.dispose();
                        tooltip = null;
                    }
                }
            };
        };
    })(renderer = comfortable.renderer || (comfortable.renderer = {}));
})(comfortable || (comfortable = {}));
var comfortable;
(function (comfortable) {
    comfortable.classNamePrefix = 'ctj';
})(comfortable || (comfortable = {}));
var comfortable;
(function (comfortable) {
    comfortable.tableEventTypes = [
        'mousedown', 'mouseover', 'mouseout',
        'click', 'dblclick', 'contextmenu'
    ];
    comfortable.createTable = function () {
        return new TableImpl(new comfortable.DefaultTableModel());
    };
    var LT_INDEX = 0;
    var CM_INDEX = 4;
    var RB_INDEX = 8;
    var TableImpl = (function (_super) {
        __extends(TableImpl, _super);
        function TableImpl(model) {
            var _this = _super.call(this) || this;
            _this.tabState = { keyCode: 0, shiftKey: false };
            _this.document_keydownHandler = function (event) {
                if (event.keyCode != 18 && event.altKey) {
                    _this.editor.endEdit('altKey');
                    _this.render();
                }
                _this.tabState = {
                    keyCode: event.keyCode,
                    shiftKey: event.shiftKey
                };
            };
            _this.tables = (function () {
                var tables = [];
                for (var i = 0; i < 9; i += 1) {
                    tables.push(new comfortable.InternalTableImpl());
                }
                tables.forEach(function (table, i) {
                    table.row = ~~(i / 3);
                    table.col = i % 3;
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
                                if (td.row < _this.model.getLockTop() &&
                                    _this.model.isColumnDraggable() &&
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
                                                for (var col = tableState.minCol; col <= tableState.maxCol + 1; col += 1) {
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
                                _this.beginEditIfNeed(event, td);
                            }),
                            focusin: cellEventHandler(function (event, td) {
                                _this.beginEditIfNeed(event, td);
                            })
                        }
                    });
                });
                return tables;
            })();
            _this.barSize = null;
            _this.scrollHandler = function (event) { _this.render(); };
            _this.hScr = comfortable.util.createElement('div', {
                style: { position: 'absolute' }
            });
            _this.hViewPane = comfortable.util.createElement('div', {
                style: { position: 'absolute',
                    overflowX: 'auto', overflowY: 'hidden' },
                on: { scroll: _this.scrollHandler }
            }, [_this.hScr]);
            _this.vScr = comfortable.util.createElement('div', {
                style: { position: 'absolute' }
            });
            _this.vViewPane = comfortable.util.createElement('div', {
                style: { position: 'absolute',
                    overflowX: 'hidden', overflowY: 'auto' },
                on: { scroll: _this.scrollHandler }
            }, [_this.vScr]);
            _this.frame = comfortable.util.createElement('div', {
                attrs: { tabindex: '0' },
                style: { position: 'relative', overflow: 'hidden',
                    width: '400px', height: '200px' },
                on: {
                    focus: function (event) {
                        var tabState = _this.tabState;
                        var rowCount = _this.model.getRowCount();
                        var columnCount = _this.model.getColumnCount();
                        if (tabState.keyCode == 9 && rowCount > 0 && columnCount > 0) {
                            var row = tabState.shiftKey ? rowCount - 1 : 0;
                            var col = tabState.shiftKey ? columnCount - 1 : 0;
                            if (_this.isEditableAt(row, col)) {
                                _this.editor.beginEdit(row, col, true);
                            }
                            else {
                                _this.findNextEditable(row, col, { row: 0, col: tabState.shiftKey ? -1 : 1 }, function (row, col) {
                                    _this.editor.beginEdit(row, col, true);
                                });
                            }
                        }
                    },
                    focusin: function (event) {
                        _this.editor.active = true;
                        _this.$el.setAttribute('tabindex', '-1');
                    },
                    focusout: function (event) {
                        _this.editor.active = false;
                        _this.$el.setAttribute('tabindex', '0');
                    },
                    mousedown: function (event) {
                        _this.tabState = { keyCode: 0, shiftKey: event.shiftKey };
                        if (comfortable.util.closest(event.target, {
                            $el: _this.hViewPane, root: _this.frame
                        })) {
                            _this.editor.endEdit('hscr');
                            _this.render();
                        }
                        else if (comfortable.util.closest(event.target, {
                            $el: _this.vViewPane, root: _this.frame
                        })) {
                            _this.editor.endEdit('vscr');
                            _this.render();
                        }
                    },
                    keydown: function (event) {
                        switch (event.keyCode) {
                            case 9:
                                _this.move(event, { row: 0, col: event.shiftKey ? -1 : 1 });
                                break;
                            case 13:
                                _this.move(event, { row: event.shiftKey ? -1 : 1, col: 0 });
                                break;
                        }
                    },
                    wheel: function (event) {
                        _this.editor.endEdit('wheel');
                        var last = {
                            scrollLeft: _this.hViewPane.scrollLeft,
                            scrollTop: _this.vViewPane.scrollTop
                        };
                        _this.hViewPane.scrollLeft += event.deltaX;
                        _this.vViewPane.scrollTop += event.deltaY;
                        if (last.scrollLeft != _this.hViewPane.scrollLeft ||
                            last.scrollTop != _this.vViewPane.scrollTop) {
                            event.preventDefault();
                        }
                    }
                }
            }, [_this.hViewPane, _this.vViewPane].concat(_this.tables.map(function (table) { return table.$el; })));
            _this.lockLines = [];
            _this.colResizeHandles = [];
            _this.cellSizeCache = null;
            _this.beforeCellSizeChangeHandler = null;
            _this.$el = _this.frame;
            _this.editor = _this.createInternalEditor();
            _this.model = null;
            _this.model = model;
            document.addEventListener('keydown', _this.document_keydownHandler);
            return _this;
        }
        TableImpl.prototype.dispose = function () {
            document.removeEventListener('keydown', this.document_keydownHandler);
        };
        TableImpl.prototype.beginEditIfNeed = function (event, td) {
            if (this.editor.cell != null &&
                this.editor.cell.row == td.row &&
                this.editor.cell.col == td.col) {
            }
            else if (this.isEditableAt(td.row, td.col)) {
                event.preventDefault();
                this.editor.beginEdit(td.row, td.col, true);
            }
        };
        TableImpl.prototype.measureBarSize = function () {
            if (this.barSize == null) {
                var scr = comfortable.util.createElement('div', {
                    style: { position: 'absolute' }
                });
                var viewPane = comfortable.util.createElement('div', {
                    style: { position: 'absolute', overflow: 'auto' }
                }, [scr]);
                comfortable.util.extend(scr.style, {
                    width: '200px', height: '200px'
                });
                comfortable.util.extend(viewPane.style, {
                    left: '0px', top: '0px', width: '100px', height: '100px'
                });
                this.frame.appendChild(viewPane);
                var barSize = {
                    width: viewPane.offsetWidth - viewPane.clientWidth,
                    height: viewPane.offsetHeight - viewPane.clientHeight
                };
                this.frame.removeChild(viewPane);
                if (barSize.width > 0 && barSize.height > 0) {
                    this.barSize = barSize;
                }
                else {
                    return barSize;
                }
            }
            return this.barSize;
        };
        ;
        TableImpl.prototype.getCellRect = function (row, col) {
            var tableModel = this.tables[CM_INDEX].model;
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
            var ltRect = renderParams.rects[LT_INDEX];
            var scrollRect = renderParams.rects[CM_INDEX];
            var delta = { left: 0, top: 0 };
            var cellRect = this.getCellRect(row, col);
            var left = cellRect.left + this.tables[CM_INDEX].left;
            var top = cellRect.top + this.tables[CM_INDEX].top;
            if (cellRect.width >= scrollRect.width) {
                delta.left = left;
            }
            else if (left < 0) {
                delta.left = left;
            }
            else if (left + cellRect.width > scrollRect.width) {
                delta.left = left + cellRect.width - scrollRect.width;
            }
            if (cellRect.height >= scrollRect.height) {
                delta.top = top;
            }
            else if (top < 0) {
                delta.top = top;
            }
            else if (top + cellRect.height > scrollRect.height) {
                delta.top = top + cellRect.height - scrollRect.height;
            }
            var clientWidth = this.hViewPane.clientWidth;
            var clientHeight = this.vViewPane.clientHeight;
            var scroll = {
                left: renderParams.viewWidth > clientWidth ?
                    comfortable.util.translate(-this.tables[CM_INDEX].left + delta.left, ltRect.width, ltRect.width + renderParams.viewWidth - clientWidth, 0, renderParams.scrWidth - clientWidth, 'scroll.left') : 0,
                top: renderParams.viewHeight > clientHeight ?
                    comfortable.util.translate(-this.tables[CM_INDEX].top + delta.top, ltRect.height, ltRect.height + renderParams.viewHeight - clientHeight, 0, renderParams.scrHeight - clientHeight, 'scroll.top') : 0
            };
            if (row >= this.model.getLockTop()) {
                this.vViewPane.scrollTop = scroll.top;
            }
            if (col >= this.model.getLockLeft()) {
                this.hViewPane.scrollLeft = scroll.left;
            }
        };
        TableImpl.prototype.getCellSizeCache = function () {
            var _this = this;
            var width = this.$el.clientWidth;
            var height = this.$el.clientHeight;
            var tableModel = this.model;
            if (this.beforeCellSizeChangeHandler == null) {
                this.beforeCellSizeChangeHandler = function (event, detail) {
                    _this.cellSizeCache = null;
                };
            }
            tableModel.off('beforecellsizechange', this.beforeCellSizeChangeHandler);
            tableModel.on('beforecellsizechange', this.beforeCellSizeChangeHandler);
            var rowCount = tableModel.getRowCount();
            var columnCount = tableModel.getColumnCount();
            var lockTop = tableModel.getLockTop();
            var lockLeft = tableModel.getLockLeft();
            var lockBottom = tableModel.getLockBottom();
            var lockRight = tableModel.getLockRight();
            if (!this.cellSizeCache ||
                this.cellSizeCache.rowCount != rowCount ||
                this.cellSizeCache.columnCount != columnCount ||
                this.cellSizeCache.lockTop != lockTop ||
                this.cellSizeCache.lockLeft != lockLeft ||
                this.cellSizeCache.lockBottom != lockBottom ||
                this.cellSizeCache.lockRight != lockRight ||
                this.cellSizeCache.width != width ||
                this.cellSizeCache.height != height) {
                var rowPos = [0, lockTop, rowCount - lockBottom, rowCount];
                var colPos = [0, lockLeft, columnCount - lockRight, columnCount];
                var cw = colPos.slice(1).map(function () { return 0; });
                var ch = rowPos.slice(1).map(function () { return 0; });
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
                    return rect;
                });
                var rbRect = rects[RB_INDEX];
                this.tables.forEach(function (table, i) {
                    var rect = rects[i];
                    if (table.col == 1) {
                        rect.width = Math.max(0, Math.min(rect.width, width - rect.left - rbRect.width));
                    }
                    else if (table.col == 2) {
                        rect.left = width - rbRect.width;
                    }
                    if (table.row == 1) {
                        rect.height = Math.max(0, Math.min(rect.height, height - rect.top - rbRect.height));
                    }
                    else if (table.row == 2) {
                        rect.top = height - rbRect.height;
                    }
                });
                this.cellSizeCache = {
                    viewWidth: cw[1],
                    viewHeight: ch[1],
                    rects: rects,
                    rowCount: rowCount, columnCount: columnCount,
                    lockTop: lockTop, lockLeft: lockLeft,
                    lockBottom: lockBottom, lockRight: lockRight,
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
            var tableModel = this.model;
            var t = tableModel.getLockTop();
            var b = tableModel.getRowCount() - tableModel.getLockBottom();
            var l = tableModel.getLockLeft();
            var r = tableModel.getColumnCount() - tableModel.getLockRight();
            return this.tables.filter(function (table) {
                return table.row == (row < t ? 0 : row >= b ? 2 : 1) &&
                    table.col == (col < l ? 0 : col >= r ? 2 : 1);
            })[0];
        };
        TableImpl.prototype.isEditableAt = function (row, col) {
            return this.model.getCellAt(row, col).editable;
        };
        TableImpl.prototype.move = function (event, offset) {
            var _this = this;
            if (this.editor.cell == null) {
                return;
            }
            var row = this.editor.cell.row;
            var col = this.editor.cell.col;
            var found = false;
            this.findNextEditable(row, col, offset, function (r, c) {
                if (offset.row == -1 || offset.col == -1) {
                    found = !(row < r && col < c);
                }
                else if (offset.row == 1 || offset.col == 1) {
                    found = !(row > r && col > c);
                }
            });
            if (!found) {
                if (offset.row == -1 || offset.col == -1) {
                    this.trigger('prevfocus');
                }
                else if (offset.row == 1 || offset.col == 1) {
                    this.trigger('nextfocus');
                }
                return;
            }
            event.preventDefault();
            this.findNextEditable(row, col, offset, function (row, col) {
                _this.editor.beginEdit(row, col, true);
            });
        };
        TableImpl.prototype.findNextEditable = function (row, col, offset, found) {
            var _this = this;
            var initialRow = row;
            var initialCol = col;
            var beginEditIfEditable = function () {
                if (row == initialRow && col == initialCol) {
                    return true;
                }
                if (_this.isEditableAt(row, col)) {
                    found(row, col);
                    return true;
                }
                return false;
            };
            var tableModel = this.model;
            var rowCount = tableModel.getRowCount();
            var columnCount = tableModel.getColumnCount();
            if ((offset.row == -1 || offset.row == 1) &&
                tableModel.getLineRowCountAt(row) == 1) {
                do {
                    do {
                        row += offset.row;
                        if (row < 0) {
                            row = rowCount - 1;
                            col = (col - 1 + columnCount) % columnCount;
                        }
                        else if (row >= rowCount) {
                            row = 0;
                            col = (col + 1) % columnCount;
                        }
                    } while (tableModel.checkSpaned(row, col));
                } while (!beginEditIfEditable());
            }
            else if (offset.row == -1 || offset.row == 1) {
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
        ;
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
                event.preventDefault();
                if (event.which != 1) {
                    return;
                }
                _this.editor.endEdit('mousedown');
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
                        width: clientWidth + 'px',
                        height: clientHeight + 'px'
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
            var rbRect = renderParams.rects[RB_INDEX];
            var clientWidth = rbRect.left + rbRect.width;
            var clientHeight = rbRect.top + rbRect.height;
            for (var i = 0; i < this.tables.length; i += 1) {
                var table = this.tables[i];
                if (table.row == 0) {
                    var rect = renderParams.rects[i];
                    var tableState = table.tableState;
                    var left = tableState.left + rect.left -
                        handleStyle.offset - handleStyle.lineWidth;
                    var height = rect.height;
                    for (var col = tableState.minCol; col <= tableState.maxCol; col += 1, handleIndex += 1) {
                        if (this.model.isColumnHiddenAt(col)) {
                            continue;
                        }
                        left += tableModel.getCellWidthAt(col);
                        if (left > rect.left + rect.width) {
                            break;
                        }
                        if (!this.model.isColumnResizableAt(col)) {
                            continue;
                        }
                        var handle = getOrCrt();
                        comfortable.util.set(handle.$el, { style: { display: '',
                                left: left + 'px', height: height + 'px' } });
                        comfortable.util.set(handle.$el.childNodes[0], {
                            style: { display: 'none', height: clientHeight + 'px' }
                        });
                        handle.col = col;
                        handle.left = left;
                    }
                }
            }
            for (; handleIndex < this.colResizeHandles.length; handleIndex += 1) {
                comfortable.util.set(this.colResizeHandles[handleIndex].$el, {
                    style: { display: 'none', left: '0px', height: '0px' }
                });
            }
        };
        TableImpl.prototype.render = function (visibleCell, cellStyleOnly) {
            var _this = this;
            var renderParams = this.getRenderParams();
            var ltRect = renderParams.rects[LT_INDEX];
            var rbRect = renderParams.rects[RB_INDEX];
            var viewWidth = renderParams.width - ltRect.width - rbRect.width;
            var viewHeight = renderParams.height - ltRect.height - rbRect.height;
            var barSize = this.measureBarSize();
            var vBarShown = renderParams.scrWidth > viewWidth - barSize.width;
            var hBarShown = renderParams.scrHeight > viewHeight - barSize.height;
            comfortable.util.extend(this.hScr.style, {
                width: renderParams.scrWidth + 'px', height: '1px'
            });
            comfortable.util.extend(this.hViewPane.style, {
                left: ltRect.width + 'px', top: (ltRect.height + rbRect.height) + 'px',
                width: (viewWidth - (hBarShown ? barSize.width : 0)) + 'px',
                height: viewHeight + 'px'
            });
            comfortable.util.extend(this.vScr.style, {
                width: '1px', height: renderParams.scrHeight + 'px'
            });
            comfortable.util.extend(this.vViewPane.style, {
                left: (ltRect.width + rbRect.width) + 'px', top: ltRect.height + 'px',
                width: viewWidth + 'px',
                height: (viewHeight - (vBarShown ? barSize.height : 0)) + 'px'
            });
            var hViewPane = this.hViewPane;
            var vViewPane = this.vViewPane;
            var clientWidth = vViewPane.clientWidth;
            var clientHeight = hViewPane.clientHeight;
            var barWidth = vViewPane.offsetWidth - clientWidth;
            var barHeight = hViewPane.offsetHeight - clientHeight;
            for (var i = 0; i < this.tables.length; i += 1) {
                var table = this.tables[i];
                var rect = renderParams.rects[i];
                if (rbRect.left + rbRect.width + barWidth > renderParams.width) {
                    if (table.col == 1) {
                        if (rect.left + rect.width > rbRect.left - barWidth) {
                            rect.width = Math.max(0, rbRect.left - barWidth - rect.left);
                        }
                    }
                    if (table.col == 2) {
                        rect.left -= barWidth;
                    }
                }
                if (rbRect.top + rbRect.height + barHeight > renderParams.height) {
                    if (table.row == 1) {
                        if (rect.top + rect.height > rbRect.top - barHeight) {
                            rect.height = Math.max(0, rbRect.top - barHeight - rect.top);
                        }
                    }
                    if (table.row == 2) {
                        rect.top -= barHeight;
                    }
                }
            }
            if (visibleCell) {
                this.makeVisible(renderParams, visibleCell.row, visibleCell.col);
            }
            var scrollLeft = hViewPane.scrollLeft;
            var scrollTop = vViewPane.scrollTop;
            for (var i = 0; i < this.tables.length; i += 1) {
                var table = this.tables[i];
                var rect = renderParams.rects[i];
                if (table.col == 1) {
                    table.left = -(renderParams.scrWidth > clientWidth ?
                        comfortable.util.translate(scrollLeft, 0, renderParams.scrWidth - clientWidth, ltRect.width, ltRect.width + renderParams.viewWidth - clientWidth, 'table.left') : ltRect.width);
                }
                if (table.row == 1) {
                    table.top = -(renderParams.scrHeight > clientHeight ?
                        comfortable.util.translate(scrollTop, 0, renderParams.scrHeight - clientHeight, ltRect.height, ltRect.height + renderParams.viewHeight - clientHeight, 'table.top') : ltRect.height);
                }
                if (table.col == 2) {
                    table.left = -(ltRect.width + renderParams.viewWidth);
                }
                if (table.row == 2) {
                    table.top = -(ltRect.height + renderParams.viewHeight);
                }
                table.model = this.model;
                table.setBounds(rect);
                table.render(!!cellStyleOnly);
            }
            if (this.editor.cell != null && !cellStyleOnly) {
                this.editor.beginEdit(this.editor.cell.row, this.editor.cell.col);
            }
            (function () {
                while (_this.lockLines.length < 4) {
                    var line = comfortable.util.createElement('div', {
                        style: { position: 'absolute' }
                    });
                    _this.frame.appendChild(line);
                    _this.lockLines.push(line);
                }
                var width = renderParams.width - barWidth;
                var height = renderParams.height - barHeight;
                comfortable.util.set(_this.lockLines[0], {
                    attrs: { 'class': '${prefix}-h-lock-line' },
                    style: {
                        display: _this.model.getLockTop() == 0 ? 'none' : '', left: '0px',
                        top: (ltRect.height - 1) + 'px', width: width + 'px'
                    }
                });
                comfortable.util.set(_this.lockLines[1], {
                    attrs: { 'class': '${prefix}-v-lock-line' },
                    style: {
                        display: _this.model.getLockLeft() == 0 ? 'none' : '', top: '0px',
                        left: (ltRect.width - 1) + 'px', height: height + 'px'
                    }
                });
                comfortable.util.set(_this.lockLines[2], {
                    attrs: { 'class': '${prefix}-h-lock-line' },
                    style: {
                        display: _this.model.getLockBottom() == 0 ? 'none' : '', left: '0px',
                        top: (height - rbRect.height - 1) + 'px', width: width + 'px'
                    }
                });
                comfortable.util.set(_this.lockLines[3], {
                    attrs: { 'class': '${prefix}-v-lock-line' },
                    style: {
                        display: _this.model.getLockRight() == 0 ? 'none' : '', top: '0px',
                        left: (width - rbRect.width - 1) + 'px', height: height + 'px'
                    }
                });
            })();
            if (this.model.getLockTop() > 0) {
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
            var valuecommitHandler = function (event, detail) {
                if (!editor.active || (detail && detail.force)) {
                    editor.endEdit('valuecommit');
                    table.render();
                }
            };
            var editor = {
                td: null,
                active: false,
                impl: null,
                cell: null,
                beginEdit: function (row, col, makeVisible) {
                    if (this.cell && !(this.cell.row == row && this.cell.col == col)) {
                        this.endEdit('cellchange');
                    }
                    if (makeVisible) {
                        table.render({ row: row, col: col });
                    }
                    this.cell = { row: row, col: col };
                    var target = table.getTargetTable(row, col);
                    var index = target.tableState.indexById[comfortable.util.getCellId(row, col)];
                    if (index) {
                        this.td = target.tbody.children[index.trIndex].children[index.tdIndex];
                        this.impl = this.td.renderer.beginEdit(table.model.getCellAt(row, col));
                        this.impl.focus();
                        table.model.on('valuecommit', valuecommitHandler);
                        table.model.trigger('editingcellchange', { cell: this.cell });
                        comfortable.util.$(this.td.$el).addClass('${prefix}-editing');
                    }
                },
                endEdit: function (reason) {
                    if (this.impl != null) {
                        comfortable.util.$(this.td.$el).removeClass('${prefix}-editing');
                        table.model.trigger('editingcellchange', { cell: null });
                        table.model.off('valuecommit', valuecommitHandler);
                        var endState = this.impl.endEdit();
                        if (endState && !(endState.oldValue === endState.newValue)) {
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
            return editor;
        };
        TableImpl.prototype.forEachCells = function (callback) {
            for (var t = 0; t < this.tables.length; t += 1) {
                var rows = this.tables[t].tbody.children || [];
                for (var r = 0; r < rows.length; r += 1) {
                    var cells = rows[r].children || [];
                    for (var c = 0; c < cells.length; c += 1) {
                        if (callback(cells[c]) === true) {
                            return;
                        }
                    }
                }
            }
        };
        return TableImpl;
    }(comfortable.UIEventTargetImpl));
    comfortable.TableImpl = TableImpl;
})(comfortable || (comfortable = {}));
var comfortable;
(function (comfortable) {
    var ui;
    (function (ui) {
        ui.createButton = function (label, action) {
            return comfortable.util.createElement('button', {
                props: { textContent: label },
                attrs: { 'class': '${prefix}-button' },
                style: { verticalAlign: 'top' },
                on: { mousedown: function (event) {
                        event.preventDefault();
                        if (event.which != 1) {
                            return;
                        }
                    }, click: function (event) { action(event); } }
            });
        };
        ui.createCheckBox = function () {
            var antiBsGlobals = {
                verticalAlign: 'top',
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
                        attrs: { width: '12', height: '12',
                            tabindex: '-1', focusable: 'false' },
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
        ui.createDialog = function (children) {
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
        };
        ui.showMenu = function (left, top, menuItems) {
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
                                subMenu = ui.showMenu(left + event.target.offsetWidth, top + event.target.offsetTop, menuItem.children());
                            }
                        },
                        mousedown: function (event) {
                            event.preventDefault();
                        },
                        click: function (event) {
                            if (event.which != 1) {
                                return;
                            }
                            if (menuItem.action) {
                                menuItem.action(event);
                                dispose();
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
                var menu = comfortable.util.closest(event.target, { className: '${prefix}-contextmenu', root: document.body });
                if (menu != null) {
                    return;
                }
                comfortable.util.$(document).off('mousedown', mousedownHandler);
                dispose();
            };
            comfortable.util.$(document).on('mousedown', mousedownHandler);
            document.body.appendChild(menu);
            return { dispose: dispose };
        };
        var createCalTable = function (year, month, current, selected) {
            var base = new Date(year, month, 1);
            var weekdays = comfortable.i18n.getMessages().WEEKDAYS.split(/,/g);
            var thead = comfortable.util.createElement('thead');
            var tbody = comfortable.util.createElement('tbody');
            thead.appendChild(comfortable.util.createElement('tr', weekdays.map(function (wd, day) {
                var className = '';
                if (day == 0 || day == 6) {
                    className += ' ${prefix}-holiday';
                }
                return comfortable.util.createElement('th', { props: { textContent: wd }, attrs: { 'class': className } });
            })));
            var d = 0;
            for (var r = 0; r < 6; r += 1) {
                tbody.appendChild(comfortable.util.createElement('tr', weekdays.map(function () {
                    var date = new Date(base.getFullYear(), base.getMonth(), base.getDate() - base.getDay() + d);
                    d += 1;
                    var className = '';
                    if (comfortable.util.isHoliday(date)) {
                        className += ' ${prefix}-holiday';
                    }
                    if (date.getMonth() == base.getMonth()) {
                        className += ' ${prefix}-this-month';
                        if (date.getFullYear() == selected.getFullYear() &&
                            date.getMonth() == selected.getMonth() &&
                            date.getDate() == selected.getDate()) {
                            className += ' ${prefix}-selected-date';
                        }
                        if (date.getFullYear() == current.getFullYear() &&
                            date.getMonth() == current.getMonth() &&
                            date.getDate() == current.getDate()) {
                            className += ' ${prefix}-current-date';
                        }
                    }
                    return comfortable.util.createElement('td', { props: { textContent: '' + date.getDate() },
                        attrs: { 'class': className },
                        on: { mousedown: function (event) { event.preventDefault(); },
                            click: function () {
                                table.trigger('click', date);
                            } } });
                })));
            }
            var table = comfortable.util.extend(new comfortable.EventTargetImpl(), {
                $el: comfortable.util.createElement('table', { attrs: { 'class': '${prefix}-cal-table' } }, [thead, tbody])
            });
            return table;
        };
        var createCalButton = function (prev, action) {
            return comfortable.util.createElement('span', { style: { display: 'inline-block', float: prev ? 'left' : 'right' },
                attrs: { 'class': '${prefix}-cal-button' },
                on: { mousedown: function (event) { event.preventDefault(); },
                    click: action } }, [comfortable.util.createSVGElement('svg', { attrs: { width: '16', height: '16',
                        tabindex: '-1', focusable: 'false',
                        'class': '${prefix}-cal-button-symbol' },
                    style: { verticalAlign: 'middle' } }, [comfortable.util.createSVGElement('path', { attrs: { d: 'M3 2L13 8L3 14Z',
                            transform: prev ?
                                'translate(8,8) rotate(180) translate(-8,-8)' : '' } })]),
                ui.createSpacer()
            ]);
        };
        ui.createSpacer = function () {
            return comfortable.util.createElement('span', { style: {
                    verticalAlign: 'middle',
                    padding: '0px',
                    margin: '0px',
                    display: 'inline-block',
                    width: '0px',
                    height: '100%'
                } });
        };
        ui.createCalIcon = function (r) {
            r = r || 3;
            var w = r * 5 + 1;
            var calIcon = comfortable.util.createElement('canvas', {
                style: { verticalAlign: 'middle' },
                props: { width: '' + w, height: '' + w
                },
                on: {
                    click: function (event) {
                    }
                }
            });
            var ctx = calIcon.getContext('2d');
            ctx.clearRect(0, 0, w, w);
            for (var x = 0; x < w; x += 1) {
                for (var y = 0; y < w; y += 1) {
                    if (x % r == 0 || y % r == 0) {
                        if (0 < y && y < r && r < x && x < r * 4) {
                        }
                        else {
                            ctx.fillStyle = '#333';
                            ctx.fillRect(x, y, 1, 1);
                        }
                    }
                    else if (~~(x / r) == 3 && ~~(y / r) == 3) {
                        ctx.fillStyle = '#f96';
                        ctx.fillRect(x, y, 1, 1);
                    }
                }
            }
            return calIcon;
        };
        ui.createCalendar = function (selectedDate) {
            var displayDate = null;
            var setDisplayDate = function (date) {
                displayDate = new Date(date.getFullYear(), date.getMonth(), 1);
            };
            var defaultSelected = selectedDate;
            setDisplayDate(defaultSelected);
            var prev = createCalButton(true, function () {
                displayDate = new Date(displayDate.getFullYear(), displayDate.getMonth() - 1, 1);
                update();
            });
            var next = createCalButton(false, function () {
                displayDate = new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 1);
                update();
            });
            var title = comfortable.util.createElement('span', { style: { verticalAlign: 'middle' } });
            var titleBody = comfortable.util.createElement('span', { style: { flex: '1 1 0%', textAlign: 'center' },
                on: { mousedown: function (event) { event.preventDefault(); },
                    click: function () {
                        setDisplayDate(defaultSelected);
                        update();
                    } } }, [title, ui.createSpacer()]);
            var header = comfortable.util.createElement('div', { style: { display: 'flex' } }, [prev, titleBody, next]);
            var cal = comfortable.util.extend(new comfortable.EventTargetImpl(), {
                $el: comfortable.util.createElement('div', [header], { attrs: { 'class': '${prefix}-calendar' } }),
                rollDate: function (offset) {
                    selectedDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + offset);
                    setDisplayDate(selectedDate);
                    update();
                },
                getSelectedDate: function () {
                    return selectedDate;
                }
            });
            var table = null;
            var update = function () {
                title.textContent = comfortable.util.formatYM(displayDate.getFullYear(), displayDate.getMonth());
                if (table) {
                    cal.$el.removeChild(table.$el);
                    table = null;
                }
                table = createCalTable(displayDate.getFullYear(), displayDate.getMonth(), selectedDate, defaultSelected).on('click', function (event, date) {
                    cal.trigger(event.type, date);
                });
                cal.$el.appendChild(table.$el);
            };
            update();
            return cal;
        };
        ui.createOptions = function (optionsData) {
            var cont = comfortable.util.createElement('div');
            var selectedIndex = optionsData.selectedIndex;
            optionsData.options.forEach(function (option, index) {
                var disabled = option[optionsData.disabledField] === true;
                cont.appendChild(comfortable.util.createElement('div', {
                    style: { display: option[optionsData.selectableField] === false ? 'none' : '' },
                    attrs: { 'class': '${prefix}-option' +
                            (disabled ? ' ${prefix}-option-disabled' : '') },
                    props: { textContent: option[optionsData.labelField] + '\u00a0' },
                    on: {
                        mousedown: function (event) { event.preventDefault(); },
                        click: function () {
                            if (disabled) {
                                return;
                            }
                            selectedIndex = index;
                            options.trigger('click', { index: index });
                        }
                    }
                }));
            });
            var updateUI = function () {
                var options = cont.childNodes;
                var selectedOption = null;
                for (var i = 0; i < options.length; i += 1) {
                    var option = options[i];
                    comfortable.util.$(option).addClass('${prefix}-option-selected', i != selectedIndex);
                    if (i == selectedIndex) {
                        selectedOption = option;
                    }
                }
                if (selectedOption && cont.parentNode) {
                    cont.parentNode.scrollTop = selectedOption.offsetTop;
                }
            };
            var selectable = function (index) {
                var option = optionsData.options[index];
                return option[optionsData.selectableField] !== false &&
                    option[optionsData.disabledField] !== true;
            };
            var options = comfortable.util.extend(new comfortable.EventTargetImpl(), {
                $el: comfortable.util.createElement('div', {
                    props: {},
                    attrs: { 'class': '${prefix}-options' },
                    style: { overflow: 'auto' }
                }, [cont]),
                rollIndex: function (offset) {
                    var index = selectedIndex;
                    while (offset != 0 && 0 <= index + offset &&
                        index + offset < optionsData.options.length) {
                        index += offset;
                        if (selectable(index)) {
                            selectedIndex = index;
                            break;
                        }
                    }
                    if (0 <= index && index < optionsData.options.length) {
                    }
                    else {
                        selectedIndex = -1;
                    }
                    updateUI();
                },
                getSelectedIndex: function () {
                    return selectedIndex;
                }
            });
            return options;
        };
        ui.createOptionsIcon = function (size) {
            var w = size || 16;
            var hGap = 3;
            var vGap = 5;
            var optionsIcon = comfortable.util.createSVGElement('svg', {
                style: { verticalAlign: 'middle' },
                attrs: { width: '' + w, height: '' + w,
                    tabindex: '-1', focusable: 'false' },
                on: {
                    click: function (event) {
                    }
                }
            }, [comfortable.util.createSVGElement('path', {
                    attrs: { d: 'M' + hGap + ' ' + vGap +
                            'L' + (w / 2) + ' ' + (w - vGap) +
                            'L' + (w - hGap) + ' ' + vGap,
                        fill: 'none', stroke: '#333',
                        'stroke-width': '2',
                        'stroke-linecap': 'round',
                        'stroke-linejoin': 'round' }
                })]);
            return optionsIcon;
        };
    })(ui = comfortable.ui || (comfortable.ui = {}));
})(comfortable || (comfortable = {}));
var comfortable;
(function (comfortable) {
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
    var wideNumChars = '０１２３４５６７８９＋－．，／';
    var narrowNumChars = '0123456789+-.,/';
    if (wideNumChars.length != narrowNumChars.length) {
        throw wideNumChars + ',' + narrowNumChars;
    }
    var $ = (function () {
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
            var classList = (this.elm.getAttribute('class') || '').split(/\s+/g);
            for (var i = 0; i < classList.length; i += 1) {
                var c = classList[i];
                if (c != className) {
                    classes += ' ' + c;
                }
            }
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
            for (var i = 0; i < args.children.length; i += 1) {
                elm.appendChild(args.children[i]);
            }
            return this.set(elm, args.opts);
        },
        createSVGElement: function (tagName) {
            var args = parseArguments(arguments);
            var elm = document.createElementNS('http://www.w3.org/2000/svg', tagName);
            for (var i = 0; i < args.children.length; i += 1) {
                elm.appendChild(args.children[i]);
            }
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
        trimRe: /^[\s\u3000]+|[\s\u3000]+$/g,
        trim: function (value) {
            return value.replace(this.trimRe, '');
        },
        rtrimRe: /[\s\u3000]+$/g,
        rtrim: function (value) {
            return value.replace(this.rtrimRe, '');
        },
        format: function (msg) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            for (var i = 0; i < args.length; i += 1) {
                msg = msg.replace(new RegExp('\\{' + i + '\\}'), '' + args[i]);
            }
            return msg;
        },
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
            var mat = value.match(this.numRe);
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
        },
        fillLeftZero: function (s, digits) {
            while (s.length < digits) {
                s = '0' + s;
            }
            return s;
        },
        formatYM: function (year, month) {
            return year + '/' + (month + 1);
        },
        formatDate: function (date) {
            if (typeof date == 'string' && date.match(/^\d{8}$/)) {
                return date.substring(0, 4) +
                    '/' + date.substring(4, 6) +
                    '/' + date.substring(6, 8);
            }
            else {
                return '';
            }
        },
        dateRe: /^(\d{4})\D(\d{1,2})\D(\d{1,2})$/,
        parseDate: function (value) {
            if (typeof value == 'number') {
                value = '' + value;
            }
            if (typeof value == 'string') {
                var mat = value.match(this.dateRe);
                if (mat) {
                    value = new Date(+mat[1], +mat[2] - 1, +mat[3]);
                }
                else {
                    return value;
                }
            }
            return this.fillLeftZero('' + value.getFullYear(), 4) +
                this.fillLeftZero('' + (value.getMonth() + 1), 2) +
                this.fillLeftZero('' + value.getDate(), 2);
        },
        isHoliday: function (date) {
            var day = date.getDay();
            return day == 0 || day == 6;
        }
    };
})(comfortable || (comfortable = {}));
var comfortable;
(function (comfortable) {
    var getFilterValues = function (tableModel, dataField) {
        var comparator = tableModel.headCells[dataField].comparator;
        var exists = {};
        var filterValues = [];
        var items = tableModel.items;
        for (var i = 0; i < items.length; i += 1) {
            var value = items[i][dataField];
            if (typeof value == 'undefined') {
                continue;
            }
            value = value === null ? '' : '' + value;
            if (!exists[value]) {
                if (value != '') {
                    filterValues.push(value);
                }
                exists[value] = true;
            }
        }
        if (comparator) {
            filterValues.sort(comparator);
        }
        if (exists['']) {
            filterValues.push('');
        }
        return filterValues;
    };
    var setToList = function (s) {
        var l = [];
        for (var v in s) {
            l.push(v);
        }
        return l;
    };
    var listToSet = function (l) {
        var s = {};
        l.forEach(function (v) { s[v] = true; });
        return s;
    };
    var operators = {
        EQUALS: 'eq',
        NOT_EQUALS: 'ne',
        GREATER_THAN: 'gt',
        GREATER_THAN_OR_EQUALS: 'ge',
        LESS_THAN: 'lt',
        LESS_THAN_OR_EQUALS: 'le',
        STARTS_WITH: 'sw',
        NOT_STARTS_WITH: 'nsw',
        ENDS_WITH: 'ew',
        NOT_ENDS_WITH: 'new',
        CONTAINS: 'ct',
        NOT_CONTAINS: 'nct'
    };
    var activeCustomFilter = function (customFilter) {
        return customFilter.op1 && customFilter.const1 ||
            customFilter.op2 && customFilter.const2;
    };
    var createDefaultCustomFilter = function () {
        return {
            op: 'and',
            op1: '',
            const1: '',
            op2: '',
            const2: '',
            dataType: ''
        };
    };
    var DefaultFilter = (function () {
        function DefaultFilter(dataType) {
            this.rejects = {};
            this.customFilter = {};
            this.customFilterAccept = function () { return true; };
            this.dataType = dataType;
        }
        DefaultFilter.prototype.createUI = function (dialog, opts, tableModel, cell) {
            var messages = comfortable.i18n.getMessages();
            var labelContent = cell.label;
            if (typeof labelContent == 'function') {
                labelContent = labelContent(tableModel);
            }
            var dataField = cell.dataField;
            var filterValues = getFilterValues(tableModel, dataField);
            var rejects = {};
            var valid = true;
            var filterItems = [messages.SELECT_ALL]
                .concat(filterValues)
                .map(function (value, i) {
                return {
                    index: i,
                    label: (i > 0) ? opts.labelFunction(value, cell) : value,
                    value: value,
                    checked: false
                };
            });
            var FilterItemCell = (function () {
                function FilterItemCell() {
                    var _this = this;
                    this.checkBox = (function () {
                        var checkBox = comfortable.ui.createCheckBox();
                        checkBox.$el.style.verticalAlign = 'middle';
                        return checkBox;
                    })();
                    this.label = comfortable.util.createElement('span', {
                        style: comfortable.filterLabelStyle,
                        props: { textContent: 'M' }
                    });
                    this.index = 0;
                    this.row = 0;
                    this.$el = comfortable.util.createElement('div', {
                        attrs: { 'class': '${prefix}-clickable-op' },
                        on: {
                            mousedown: function (event) { event.preventDefault(); },
                            click: function () {
                                filterclick(_this.index);
                            }
                        }
                    }, [this.checkBox.$el, this.label]);
                }
                FilterItemCell.prototype.setLabel = function (text) {
                    this.label.textContent = text || messages.SELECT_BLANK;
                    this.$el.setAttribute('title', this.label.textContent);
                };
                return FilterItemCell;
            }());
            var FilterItemList = (function (_super) {
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
                    cell.checkBox.setChecked(item.checked);
                    cell.checkBox.setIncomplete(item.incomplete);
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
            var filterclick = function (index) {
                if (index == 0) {
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
                    var filterItem = filterItems[index];
                    filterItem.checked = !filterItem.checked;
                }
                rejects = function () {
                    var rejects = {};
                    filterItems.forEach(function (filterItem, i) {
                        if (i > 0 && !filterItem.checked) {
                            rejects[filterItem.value] = true;
                        }
                    });
                    return rejects;
                }();
                filterchange();
            };
            var filterchange = function () {
                var rejectCount = 0;
                for (var value in rejects) {
                    rejectCount += 1;
                }
                filterItems[0].checked = rejectCount != filterItems.length - 1;
                filterItems[0].incomplete = rejectCount != 0;
                filterItemList.invalidate();
            };
            var customFilter = createDefaultCustomFilter();
            var createClearButton = function () {
                var checkBox = comfortable.ui.createCheckBox();
                comfortable.util.extend(checkBox.$el.style, { border: 'none', verticalAlign: 'middle' });
                checkBox.setChecked(false);
                var label = comfortable.util.createElement('span', {
                    attrs: { 'class': '${prefix}-clickable-op' },
                    style: comfortable.filterLabelStyle,
                    props: { textContent: comfortable.util.format(messages.CLEAR_FILTER_FROM, labelContent) }
                });
                return {
                    $el: comfortable.util.createElement('div', [checkBox.$el, label], { on: {
                            click: function (event) {
                                dialog().dispose();
                                rejects = {};
                                customFilter = createDefaultCustomFilter();
                                dialog().trigger('applyfilter');
                            }
                        }
                    }),
                    checkBox: checkBox
                };
            };
            var createFilterButton = function (filterTitle) {
                var checkBox = comfortable.ui.createCheckBox();
                comfortable.util.extend(checkBox.$el.style, { border: 'none', verticalAlign: 'middle' });
                checkBox.setChecked(false);
                var label = comfortable.util.createElement('span', {
                    attrs: { 'class': '${prefix}-clickable-op' },
                    style: comfortable.filterLabelStyle,
                    props: { textContent: filterTitle }
                });
                return {
                    $el: comfortable.util.createElement('div', [checkBox.$el, label], { on: {
                            click: function (event) {
                                dialog().dispose();
                                showFilterDialog(filterTitle);
                            }
                        }
                    }),
                    checkBox: checkBox
                };
            };
            var showFilterDialog = function (title) {
                var optMap = function (k) {
                    return { value: operators[k], label: messages[k] };
                };
                var opOpts = [{ value: '', label: '' }];
                opOpts = opOpts.concat([
                    'EQUALS',
                    'NOT_EQUALS',
                    'GREATER_THAN',
                    'GREATER_THAN_OR_EQUALS',
                    'LESS_THAN',
                    'LESS_THAN_OR_EQUALS'
                ].map(optMap));
                if (dataType == 'string' ||
                    dataType == 'multi-line-string' ||
                    dataType == 'date') {
                    opOpts = opOpts.concat([
                        'STARTS_WITH',
                        'NOT_STARTS_WITH',
                        'ENDS_WITH',
                        'NOT_ENDS_WITH',
                        'CONTAINS',
                        'NOT_CONTAINS'
                    ].map(optMap));
                }
                var createOpUI = function (op, value) {
                    var sel = comfortable.util.createElement('select', opOpts.map(function (opOpt) {
                        return comfortable.util.createElement('option', {
                            props: { textContent: opOpt.label,
                                value: opOpt.value,
                                selected: op == opOpt.value }
                        });
                    }));
                    var txt = comfortable.util.createElement('input', { attrs: { type: 'text' },
                        style: { width: '200px' },
                        props: { value: sel.value ? value : '' } });
                    var opBody = comfortable.util.createElement('div', { style: { whiteSpace: 'nowrap' } });
                    if (messages.OP_LAYOUT == 'L') {
                        opBody.appendChild(sel);
                        txt.style.marginLeft = '2px';
                    }
                    opBody.appendChild(txt);
                    if (messages.OP_LAYOUT == 'R') {
                        txt.style.marginRight = '2px';
                        opBody.appendChild(sel);
                    }
                    return { $el: opBody, sel: sel, txt: txt };
                };
                var updateRadios = function () {
                    customFilter.op = customFilter.op || 'and';
                    rd1.radio.checked = rd1.radio.value == customFilter.op;
                    rd2.radio.checked = rd2.radio.value == customFilter.op;
                };
                var createRadio = function (value, label) {
                    var radio = comfortable.util.createElement('input', { attrs: { type: 'radio' }, props: { value: value },
                        on: { click: function () {
                                customFilter.op = value;
                                updateRadios();
                            } } });
                    var radioBody = comfortable.util.createElement('label', [radio, document.createTextNode(label)]);
                    return { $el: radioBody, radio: radio };
                };
                var rd1 = createRadio('and', messages.AND);
                var rd2 = createRadio('or', messages.OR);
                var rdGrp = comfortable.util.createElement('div', [rd1.$el, rd2.$el]);
                updateRadios();
                var op1 = createOpUI(customFilter.op1, customFilter.const1);
                var op2 = createOpUI(customFilter.op2, customFilter.const2);
                var dialogPos = { left: 0, top: 0 };
                var cfDialog = comfortable.ui.createDialog([
                    comfortable.util.createElement('div', { props: { textContent: title },
                        style: { margin: '2px' },
                        on: {
                            mousedown: function (event) {
                                var mousemoveHandler = function (event) {
                                    dialogPos.left = event.pageX - dragPoint.left;
                                    dialogPos.top = event.pageY - dragPoint.top;
                                    cfDialog.$el.style.left = dialogPos.left + 'px';
                                    cfDialog.$el.style.top = dialogPos.top + 'px';
                                };
                                var mouseupHandler = function (event) {
                                    comfortable.util.$(document)
                                        .off('mousemove', mousemoveHandler)
                                        .off('mouseup', mouseupHandler);
                                };
                                event.preventDefault();
                                comfortable.util.$(document)
                                    .on('mousemove', mousemoveHandler)
                                    .on('mouseup', mouseupHandler);
                                var dragPoint = {
                                    left: event.pageX - dialogPos.left,
                                    top: event.pageY - dialogPos.top
                                };
                            }
                        } }),
                    comfortable.util.createElement('fieldset', [
                        comfortable.util.createElement('legend', { props: {
                                textContent: '"' + labelContent + '"'
                            } }),
                        op1.$el, rdGrp, op2.$el
                    ]),
                    comfortable.util.createElement('div', { style: { textAlign: 'right' } }, [
                        comfortable.ui.createButton(messages.OK, function (event) {
                            var flt = function (val) {
                                val = comfortable.util.trim(val);
                                if (dataType == 'number') {
                                    val = comfortable.util.toNarrowNumber(val);
                                }
                                return val;
                            };
                            customFilter.op1 = op1.sel.value;
                            customFilter.const1 = customFilter.op1 ? flt(op1.txt.value) : '';
                            customFilter.op2 = op2.sel.value;
                            customFilter.const2 = customFilter.op2 ? flt(op2.txt.value) : '';
                            cfDialog.dispose();
                            dialog().trigger('applyfilter');
                        }),
                        comfortable.ui.createButton(messages.CANCEL, function (event) {
                            cfDialog.dispose();
                        })
                    ])
                ]).on('beforeshow', function () {
                    dialogPos.left = document.documentElement.scrollLeft +
                        ((window.innerWidth - this.$el.offsetWidth) / 2);
                    dialogPos.top = document.documentElement.scrollTop +
                        ((window.innerHeight - this.$el.offsetHeight) / 2);
                    this.$el.style.left = dialogPos.left + 'px';
                    this.$el.style.top = dialogPos.top + 'px';
                });
                cfDialog.show();
            };
            var dataType = this.dataType || 'string';
            var customFilterButton = createFilterButton(dataType == 'number' ? messages.NUMBER_FILTERS :
                dataType == 'date' ? messages.DATE_FILTERS :
                    messages.TEXT_FILTERS);
            if (!(dataType == 'string' ||
                dataType == 'multi-line-string' ||
                dataType == 'number' ||
                dataType == 'date')) {
                customFilterButton.$el.style.display = 'none';
            }
            var hr = function () { return comfortable.util.createElement('div', { style: {
                    borderTop: '1px solid #000', opacity: '0.2', margin: '4px 0px'
                } }); };
            return {
                setState: function (state) {
                    rejects = listToSet(state.rejects);
                    filterItems.forEach(function (filterItem, i) {
                        if (i > 0) {
                            filterItem.checked = !rejects[filterItem.value];
                        }
                    });
                    filterchange();
                    customFilter = state.customFilter;
                    customFilterButton.checkBox.setChecked(activeCustomFilter(customFilter));
                },
                getState: function () {
                    if (!valid) {
                        rejects = {};
                        filterItems.forEach(function (filterItem, i) {
                            if (i > 0) {
                                rejects[filterItem.value] = true;
                            }
                        });
                        filterItemList.items.forEach(function (filterItem) {
                            if (filterItem.checked) {
                                delete rejects[filterItem.value];
                            }
                        });
                        valid = true;
                    }
                    customFilter.dataType = dataType;
                    return {
                        rejects: setToList(rejects),
                        customFilter: customFilter
                    };
                },
                $el: comfortable.util.createElement('div', { props: {} }, [
                    hr(),
                    createClearButton().$el,
                    customFilterButton.$el,
                    hr(),
                    comfortable.util.createElement('input', { attrs: { type: 'text',
                            placeHolder: messages.SEARCH },
                        style: { width: '150px', margin: '4px 0px' },
                        on: { keyup: function (event) {
                                valid = false;
                                var normalize = function (value) {
                                    return (value || '').toLowerCase();
                                };
                                var value = normalize(event.currentTarget.value);
                                filterItemList.items = filterItems.
                                    filter(function (filterItem, i) {
                                    return !(i > 0 && value &&
                                        normalize(filterItem.label).indexOf(value) == -1);
                                });
                                filterItemList.invalidate();
                            } } }),
                    filterItemList.$el
                ])
            };
        };
        DefaultFilter.prototype.enabled = function () {
            var enabled = false;
            for (var reject in this.rejects) {
                enabled = true;
                break;
            }
            if (activeCustomFilter(this.customFilter)) {
                enabled = true;
            }
            return enabled;
        };
        DefaultFilter.prototype.accept = function (value) {
            if (this.rejects[value === null ? '' : '' + value]) {
                return false;
            }
            if (value === null) {
                if (this.dataType == 'number') {
                    value = 0;
                }
                else {
                    value = '';
                }
            }
            if (!this.customFilterAccept(value)) {
                return false;
            }
            else {
                return true;
            }
        };
        DefaultFilter.prototype.createCustomFilterAccept = function (customFilter) {
            if (activeCustomFilter(customFilter)) {
                var creOp = function (op, constVal) {
                    if (customFilter.dataType == 'number') {
                        constVal = +constVal;
                        switch (op) {
                            case operators.EQUALS:
                                return function (value) { return +value == constVal; };
                            case operators.NOT_EQUALS:
                                return function (value) { return !(+value == constVal); };
                            case operators.GREATER_THAN:
                                return function (value) { return +value > constVal; };
                            case operators.GREATER_THAN_OR_EQUALS:
                                return function (value) { return +value >= constVal; };
                            case operators.LESS_THAN:
                                return function (value) { return +value < constVal; };
                            case operators.LESS_THAN_OR_EQUALS:
                                return function (value) { return +value <= constVal; };
                            default:
                                throw 'bad op:' + op;
                        }
                    }
                    else {
                        switch (op) {
                            case operators.EQUALS:
                                return function (value) { return value == constVal; };
                            case operators.NOT_EQUALS:
                                return function (value) { return value != constVal; };
                            case operators.GREATER_THAN:
                                return function (value) { return value > constVal; };
                            case operators.GREATER_THAN_OR_EQUALS:
                                return function (value) { return value >= constVal; };
                            case operators.LESS_THAN:
                                return function (value) { return value < constVal; };
                            case operators.LESS_THAN_OR_EQUALS:
                                return function (value) { return value <= constVal; };
                            case operators.STARTS_WITH:
                                return function (value) { return value.indexOf(constVal) == 0; };
                            case operators.NOT_STARTS_WITH:
                                return function (value) { return value.indexOf(constVal) != 0; };
                            case operators.ENDS_WITH:
                                return function (value) { return value && value.indexOf(constVal) ==
                                    value.length - constVal.length; };
                            case operators.NOT_ENDS_WITH:
                                return function (value) { return !(value && value.indexOf(constVal) ==
                                    value.length - constVal.length); };
                            case operators.CONTAINS:
                                return function (value) { return value.indexOf(constVal) != -1; };
                            case operators.NOT_CONTAINS:
                                return function (value) { return value.indexOf(constVal) == -1; };
                            default:
                                throw 'bad op:' + op;
                        }
                    }
                };
                var ops = [];
                if (customFilter.const1) {
                    ops.push(creOp(customFilter.op1, customFilter.const1));
                }
                if (customFilter.const2) {
                    ops.push(creOp(customFilter.op2, customFilter.const2));
                }
                return ops.length == 1 ? ops[0] :
                    customFilter.op == 'and' ?
                        function (value) { return ops[0](value) && ops[1](value); } :
                        function (value) { return ops[0](value) || ops[1](value); };
            }
            else {
                return function () { return true; };
            }
        };
        DefaultFilter.prototype.setState = function (state) {
            this.rejects = listToSet(state && state.rejects ? state.rejects : []);
            this.customFilter =
                state && state.customFilter ? state.customFilter : {};
            this.customFilterAccept =
                this.createCustomFilterAccept(this.customFilter);
        };
        DefaultFilter.prototype.getState = function () {
            return {
                rejects: setToList(this.rejects),
                customFilter: this.customFilter
            };
        };
        return DefaultFilter;
    }());
    comfortable.DefaultFilter = DefaultFilter;
})(comfortable || (comfortable = {}));
var comfortable;
(function (comfortable) {
    comfortable.SortOrder = { ASC: 'asc', DESC: 'desc' };
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
    comfortable.filterLabelStyle = { marginLeft: '4px', verticalAlign: 'middle' };
    var createFilterDialog = function (opts, filterUI) {
        var messages = comfortable.i18n.getMessages();
        var createSortButton = function (label) {
            var selector = createSelector();
            selector.$el.style.verticalAlign = 'middle';
            return {
                selector: selector,
                $el: comfortable.util.createElement('div', [
                    selector.$el,
                    comfortable.util.createElement('span', {
                        style: comfortable.filterLabelStyle, props: { textContent: label }
                    })
                ], { attrs: { 'class': '${prefix}-clickable-op' }, on: {
                        mousedown: function (event) {
                            event.preventDefault();
                        },
                        click: function (event) {
                            if (event.which != 1) {
                                return;
                            }
                            flDialog.trigger('sortclick', { label: label });
                        }
                    } })
            };
        };
        var sortAscButton = createSortButton(messages.SORT_ASC);
        var sortDescButton = createSortButton(messages.SORT_DESC);
        var flDialog = comfortable.util.extend(comfortable.ui.createDialog([
            sortAscButton.$el,
            sortDescButton.$el,
            filterUI,
            comfortable.util.createElement('div', { style: { marginTop: '4px', display: 'inline-block', float: 'right' } }, [
                comfortable.ui.createButton(messages.OK, function () {
                    flDialog.dispose();
                    flDialog.trigger('applyfilter');
                }),
                comfortable.ui.createButton(messages.CANCEL, function () {
                    flDialog.dispose();
                })
            ])
        ]), opts).on('sortclick', function (event, detail) {
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
        }).trigger('sortchange');
        return flDialog;
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
                while (this.$el.firstChild) {
                    this.$el.removeChild(this.$el.firstChild);
                }
                this.$el.appendChild(comfortable.util.createSVGElement('rect', {
                    attrs: { 'class': '${prefix}-filter-body',
                        x: '0', y: '0', width: '15', height: '15',
                        rx: '3', ry: '3' }
                }));
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
    comfortable.createDefaultHeaderCellRendererFactory = function (opts) {
        opts = comfortable.util.extend(comfortable.createDefaultCellRendererFactoryOpts(), opts || {});
        return function (td) {
            var showFilterDialog = function () {
                var dataField = filterButton.cell.dataField;
                var sort = tableModel.sort;
                var filter = tableModel.getFilter(dataField);
                opts = comfortable.util.extend(opts, {
                    sortOrder: (sort && sort.dataField == dataField) ? sort.order : null
                });
                var filterUI = filter.createUI(function () { return flDialog; }, opts, tableModel, filterButton.cell);
                filterUI.setState(filter.getState());
                var flDialog = createFilterDialog(opts, filterUI.$el).on('applysort', function () {
                    tableModel.sort = this.sortOrder ?
                        { dataField: dataField, order: this.sortOrder } : null;
                    tableModel.trigger('filterchange');
                }).on('applyfilter', function () {
                    filter.setState(filterUI.getState());
                    tableModel.trigger('filterchange');
                });
                var off = comfortable.util.offset(td.$el);
                flDialog.$el.style.left = off.left + 'px',
                    flDialog.$el.style.top = (off.top + td.$el.offsetHeight) + 'px';
                flDialog.show();
                return flDialog;
            };
            var initCheckBox = function () {
                checkBox = comfortable.ui.createCheckBox();
                comfortable.util.set(checkBox.$el, {
                    style: { verticalAlign: 'middle', marginRight: '2px' },
                    on: { mousedown: function (event) {
                            event.preventDefault();
                            if (event.which != 1) {
                                return;
                            }
                            td.tableModel.trigger('valuecommit', { force: true });
                            var cell = checkBox.cell;
                            var booleanValues = cell.booleanValues || [false, true];
                            var itemCount = tableModel.getItemCount();
                            var editable = [];
                            var editableCount = 0;
                            var trueCount = 0;
                            for (var i = 0; i < itemCount; i += 1) {
                                var item = tableModel.getItemAt(i);
                                editable.push(!(tableModel.getItemStyleAt &&
                                    tableModel.getItemStyleAt({
                                        row: i,
                                        col: cell.dataField
                                    }).editable === false));
                                if (editable[i]) {
                                    editableCount += 1;
                                    if (tableModel.getItemAt(i)[cell.dataField] === booleanValues[1]) {
                                        trueCount += 1;
                                    }
                                }
                            }
                            var checked = trueCount != editableCount;
                            var changed = false;
                            var newValue = booleanValues[checked ? 1 : 0];
                            for (var i = 0; i < itemCount; i += 1) {
                                var item = tableModel.getItemAt(i);
                                if (editable[i]) {
                                    if (item[cell.dataField] !== newValue) {
                                        item[cell.dataField] = newValue;
                                        changed = true;
                                    }
                                }
                            }
                            updateCheckBoxState();
                            if (changed) {
                                tableModel.trigger('groupvaluechange', { dataField: cell.dataField, newValue: newValue });
                            }
                        } }
                });
                if (!valuechangeHandler) {
                    valuechangeHandler = function (event, detail) {
                        if (detail.itemIndex.col == checkBox.cell.dataField) {
                            updateCheckBoxState();
                        }
                    };
                    tableModel.on('valuechange', valuechangeHandler);
                }
                td.$el.insertBefore(checkBox.$el, td.$el.firstChild);
            };
            var updateCheckBoxState = function () {
                var cell = checkBox.cell;
                var booleanValues = cell.booleanValues || [false, true];
                var itemCount = tableModel.getItemCount();
                var trueCount = 0;
                for (var i = 0; i < itemCount; i += 1) {
                    if (tableModel.getItemAt(i)[cell.dataField] === booleanValues[1]) {
                        trueCount += 1;
                    }
                }
                checkBox.setChecked(trueCount > 0);
                checkBox.setIncomplete(trueCount > 0 && trueCount != itemCount);
            };
            var initFilterButton = function () {
                filterButton = createFilterButton();
                comfortable.util.set(filterButton.$el, {
                    attrs: { tabindex: '-1', focusable: 'false' },
                    on: { mousedown: function (event) {
                            event.preventDefault();
                            if (event.which != 1) {
                                return;
                            }
                            if (dialog == null) {
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
                td.$el.appendChild(filterButton.$el);
            };
            var labelRenderer = comfortable.createMultiLineLabelRenderer(td.$el);
            var tableModel = td.tableModel;
            var checkBox = null;
            var filterButton = null;
            var dialog = null;
            var valuechangeHandler = null;
            var showGroupCheck = function (cell) {
                return cell.dataType == 'boolean' && cell.showGroupCheck !== false;
            };
            return {
                render: function (cell) {
                    labelRenderer.setLabel(cell.value || '\u00a0');
                    if (showGroupCheck(cell)) {
                        if (!checkBox) {
                            initCheckBox();
                        }
                        checkBox.cell = cell;
                    }
                    if (checkBox) {
                        if (showGroupCheck(cell)) {
                            checkBox.$el.style.display = 'inline-block';
                            updateCheckBoxState();
                        }
                        else {
                            checkBox.$el.style.display = 'none';
                        }
                    }
                    if (cell.dataField) {
                        if (!filterButton) {
                            initFilterButton();
                        }
                        filterButton.cell = cell;
                        var sort = tableModel.sort;
                        var filter = tableModel.getFilter(cell.dataField);
                        filterButton.setSortOrder((sort && sort.dataField == cell.dataField) ? sort.order : null);
                        filterButton.setFiltered(filter.enabled());
                    }
                    if (filterButton) {
                        filterButton.$el.style.display = cell.dataField ? '' : 'none';
                    }
                },
                beginEdit: function (cell) {
                    return { focus: function () { }, endEdit: function () { } };
                },
                dispose: function () {
                    if (valuechangeHandler) {
                        tableModel.off('valuechange', valuechangeHandler);
                    }
                }
            };
        };
    };
})(comfortable || (comfortable = {}));
var comfortable;
(function (comfortable) {
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
        var lockLeft = tableModel.lockLeft;
        var ColumnType = { LOCK_COLUMN: 'lockColumn', COLUMN: 'column' };
        var columns = function () {
            var columns = [];
            var columnCount = tableModel.getColumnCount();
            for (var col = 0; col <= columnCount;) {
                if (col == lockLeft) {
                    columns.push({ type: ColumnType.LOCK_COLUMN,
                        label: messages.LOCK_COLUMN,
                        hidden: !tableModel.enableLockColumn });
                }
                if (col < columnCount) {
                    var cell = tableModel.getCellAt(0, col);
                    var style = tableModel.getCellStyleAt(0, col);
                    var desc = style.description;
                    var label = typeof desc == 'function' ? desc(tableModel) :
                        typeof desc == 'undefined' ? tableModel.getValueAt(0, col) : desc;
                    var orderedCol = tableModel.getOrderedColumnIndexAt(col);
                    columns.push({ type: ColumnType.COLUMN,
                        label: label,
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
                        if (event.which != 1) {
                            return;
                        }
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
                                if (!scroll.active) {
                                    scroll.active = true;
                                    scroll.event = event;
                                    var scrollTarget = dialog.$el.firstChild;
                                    var off = comfortable.util.offset(scrollTarget);
                                    var top = off.top + scrollTarget.scrollTop;
                                    var scrollHandler = function () {
                                        var pageY = scroll.event.pageY;
                                        var delta = 0;
                                        if (pageY < top) {
                                            delta = -scroll.delta;
                                        }
                                        else if (top + scrollTarget.offsetHeight < pageY) {
                                            delta = scroll.delta;
                                        }
                                        if (delta != 0) {
                                            scrollTarget.scrollTop += delta;
                                            bar.style.display = 'none';
                                        }
                                        if (scroll.active) {
                                            window.setTimeout(scrollHandler, scroll.timeout);
                                        }
                                    };
                                    scrollHandler();
                                }
                                else {
                                    scroll.event = event;
                                }
                                return;
                            }
                            indexTo = columnItems.indexOf(listitem);
                            var off = comfortable.util.offset(listitem);
                            var top = listitem.offsetTop - 2 -
                                listitem.parentNode.scrollTop;
                            if (off.top + listitem.offsetHeight / 2 < event.pageY) {
                                indexTo += 1;
                                top += listitem.offsetHeight;
                            }
                            bar.style.display = '';
                            bar.style.top = top + 'px';
                            scroll.active = false;
                        };
                        var mouseupHandler = function (event) {
                            scroll.active = false;
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
                        var scroll = {
                            active: false,
                            event: null,
                            delta: 16,
                            timeout: 100
                        };
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
            comfortable.util.createElement('div', { style: { overflow: 'auto', height: '200px' } }, columnItems),
            comfortable.util.createElement('div', { style: { float: 'right' } }, [
                comfortable.ui.createButton(messages.RESET, function () {
                    dialog.dispose();
                    tableModel.orderedColumnIndices = null;
                    tableModel.hiddenColumns = {};
                    tableModel.trigger('beforecellsizechange');
                    tableModel.setLockLeft(tableModel.defaultLockColumn);
                    tableModel.enableLockColumn = true;
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
                                hiddenColumns[column.col] = true;
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
                    tableModel.setLockLeft(lockColumn);
                    tableModel.enableLockColumn = enableLockColumn;
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
                    return;
                }
                comfortable.util.$(td.$el).addClass('${prefix}-item-hover', !hover);
                for (var i = 0; i < td.$el.childNodes.length; i += 1) {
                    var child = td.$el.childNodes[i];
                }
                return false;
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
                    this.render(null, true);
                    this.model.trigger('rowselectionchange', { selectedRows: this.model.selectedRows, reason: 'click' });
                }
            }
        });
    };
    var setupDefaults = function (template) {
        var inheritFromBody = ['dataType',
            'options', 'labelField', 'valueField',
            'decimalDigits', 'booleanValues'];
        var bodyDataCells = {};
        template.tbody.forEach(function (tr) {
            tr.forEach(function (cell) {
                if (typeof cell.dataField == 'string' &&
                    !bodyDataCells[cell.dataField]) {
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
        template.tfoot.forEach(function (tr) {
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
        template.tfoot.forEach(function (row) {
            row.forEach(function (cell) {
                if (!cell.factory && cell.dataType) {
                    cell.factory = comfortable.createDefaultCellRendererFactory(cell);
                }
            });
        });
    };
    comfortable.fromTemplate = function (template) {
        if (template.thead && !template.tbody) {
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
        template.thead = template.thead || [];
        template.tbody = template.tbody || [];
        template.tfoot = template.tfoot || [];
        setupDefaults(template);
        var columnCount = 0;
        var cellWidth = {};
        var cellHeight = {};
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
            return template.thead
                .concat(template.tbody)
                .concat(template.tfoot).map(function (tr, row) {
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
                    if (typeof cell.columnResizable == 'boolean') {
                        columnResizable[col] = cell.columnResizable;
                    }
                    td['.col'] = col;
                    style[col] = td;
                    col += cell.colSpan;
                    c += 1;
                }
                columnCount = Math.max(columnCount, col);
                return style;
            });
        }();
        var getCellsByDataField = function (cellList) {
            var cells = {};
            cellList.forEach(function (tr, row) {
                tr.forEach(function (td) {
                    if (td.dataField && !cells[td.dataField]) {
                        cells[td.dataField] = comfortable.util.extend({ row: row, col: td['.col'] }, td);
                    }
                    delete td['.col'];
                });
            });
            return cells;
        };
        var getCellStyleAt = function (model, row, col) {
            if (row < headLength) {
                return styles[row][col] || {};
            }
            else if (row >= model.getRowCount() - footLength) {
                return styles[row - bodyLength * (model.getItemCount() - 1)][col] || {};
            }
            else {
                return styles[headLength + (row - headLength) % bodyLength][col] || {};
            }
        };
        var headLength = template.thead.length;
        var bodyLength = template.tbody.length;
        var footLength = template.tfoot.length;
        var TemplateTableImpl = (function (_super) {
            __extends(TemplateTableImpl, _super);
            function TemplateTableImpl() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
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
                ].filter(function (menuitem, i) {
                    return !(!table.model.isColumnDraggable() &&
                        menuitem.label == messages.EDIT_COLUMNS);
                });
            };
            return TemplateTableImpl;
        }(comfortable.TableImpl));
        var TemplateTableModelImpl = (function (_super) {
            __extends(TemplateTableModelImpl, _super);
            function TemplateTableModelImpl() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.headCells = getCellsByDataField(template.thead);
                _this.bodyCells = getCellsByDataField(template.tbody);
                _this.footCells = getCellsByDataField(template.tfoot);
                _this.lockLeft = template.lockColumn || 0;
                _this.lockRight = 0;
                _this.enableLockColumn = true;
                _this.defaultLockColumn = _this.lockLeft;
                _this.defaultHeaderCellRendererFactory = comfortable.createDefaultHeaderCellRendererFactory();
                _this.cellWidth = cellWidth;
                _this.cellHeight = cellHeight;
                _this.columnDraggable = template.columnDraggable;
                _this.columnResizable = columnResizable;
                _this.orderedColumnIndices = null;
                _this.sort = null;
                _this.filters = {};
                _this.hiddenColumns = {};
                _this.items = [];
                _this.filteredItems = null;
                _this.hoverRow = -1;
                _this.editingCell = null;
                _this.multipleRowsSelectable = false;
                _this.selectedRows = {};
                _this.getItemStyleAt = null;
                _this.tooltipSuffix = 'Tooltip';
                return _this;
            }
            TemplateTableModelImpl.prototype.setLockLeft = function (lockLeft) {
                this.lockLeft = lockLeft;
            };
            TemplateTableModelImpl.prototype.getLockLeft = function () {
                return !this.enableLockColumn ? 0 : this.lockLeft;
            };
            TemplateTableModelImpl.prototype.getLockTop = function () { return headLength; };
            TemplateTableModelImpl.prototype.setLockRight = function (lockRight) {
                this.lockRight = lockRight;
            };
            TemplateTableModelImpl.prototype.getLockRight = function () {
                return this.lockRight;
            };
            TemplateTableModelImpl.prototype.getLockBottom = function () { return footLength; };
            TemplateTableModelImpl.prototype.filterFactory = function (dataField) {
                return new comfortable.DefaultFilter(this.headCells[dataField].dataType || 'string');
            };
            TemplateTableModelImpl.prototype.getFilter = function (dataField) {
                return this.filters[dataField] ||
                    (this.filters[dataField] = this.filterFactory(dataField));
            };
            TemplateTableModelImpl.prototype.isColumnHiddenAt = function (col) {
                var orderedCol = this.getOrderedColumnIndexAt(col);
                return this.hiddenColumns[orderedCol];
            };
            TemplateTableModelImpl.prototype.resetFilter = function () {
                this.sort = null;
                for (var dataField in this.headCells) {
                    this.getFilter(dataField).setState(null);
                }
                this.filteredItems = null;
                table.invalidate();
            };
            TemplateTableModelImpl.prototype.getItemCount = function () {
                return (this.filteredItems || this.items).length;
            };
            TemplateTableModelImpl.prototype.getItemAt = function (row) {
                return (this.filteredItems || this.items)[row];
            };
            TemplateTableModelImpl.prototype.getOrderedColumnIndices = function () {
                if (this.orderedColumnIndices == null) {
                    this.orderedColumnIndices = createDefaultOrderedColumnIndices(this);
                }
                return this.orderedColumnIndices;
            };
            TemplateTableModelImpl.prototype.getOrderedColumnIndexAt = function (col) {
                return this.getOrderedColumnIndices()[col];
            };
            TemplateTableModelImpl.prototype.getRawColumnAt = function (col) {
                var indices = this.getOrderedColumnIndices();
                for (var i = 0; i < indices.length; i += 1) {
                    if (indices[i] == col) {
                        return i;
                    }
                }
                return 0;
            };
            TemplateTableModelImpl.prototype.forEachItemCells = function (callback) {
                var cells = [];
                !function () {
                    for (var dataField in this.bodyCells) {
                        var cell = this.bodyCells[dataField];
                        cells.push({
                            dataField: dataField,
                            row: cell.row,
                            col: this.getRawColumnAt(cell.col)
                        });
                    }
                }.bind(this)();
                cells.sort(function (c1, c2) {
                    if (c1.row != c2.row) {
                        return c1.row < c2.row ? -1 : 1;
                    }
                    return c1.col < c2.col ? -1 : 1;
                });
                var lineRowOffset = this.getLineRowCountAt(0);
                var lineRowCount = this.getLineRowCountAt(this.getLockTop());
                var items = this.filteredItems || this.items;
                for (var r = 0; r < items.length; r += 1) {
                    var item = items[r];
                    for (var c = 0; c < cells.length; c += 1) {
                        var cell = cells[c];
                        var col = cell.col;
                        var row = lineRowOffset + r * lineRowCount + cell.row;
                        if (callback(cell, item, row, col)) {
                            return;
                        }
                    }
                }
            };
            TemplateTableModelImpl.prototype.getItemIndexAt = function (row, col) {
                if (row < headLength) {
                    return { row: -1, col: -1 };
                }
                else if (row >= this.getRowCount() - footLength) {
                    return { row: -1, col: -1 };
                }
                else {
                    var orderedCol = this.getOrderedColumnIndexAt(col);
                    var style = getCellStyleAt(this, row, orderedCol);
                    row -= headLength;
                    return {
                        row: Math.floor(row / bodyLength),
                        col: style.dataField ||
                            ((row % bodyLength) * this.getColumnCount() + orderedCol)
                    };
                }
            };
            TemplateTableModelImpl.prototype.setValueAt = function (row, col, value) {
                if (row < headLength) {
                }
                else if (row >= this.getRowCount() - footLength) {
                }
                else {
                    var itemIndex = this.getItemIndexAt(row, col);
                    var item = this.getItemAt(itemIndex.row);
                    if (item) {
                        item[itemIndex.col] = value;
                    }
                }
            };
            TemplateTableModelImpl.prototype.getRowCount = function () {
                return headLength +
                    bodyLength * this.getItemCount() + footLength;
            };
            TemplateTableModelImpl.prototype.getColumnCount = function () { return columnCount; };
            TemplateTableModelImpl.prototype.getLineRowCountAt = function (row) {
                return row < headLength ? headLength :
                    row >= this.getRowCount() - footLength ? footLength :
                        bodyLength;
            };
            TemplateTableModelImpl.prototype.getLineRowAt = function (row) {
                return row < headLength ? row :
                    row >= this.getRowCount() - footLength ?
                        row - (this.getRowCount() - footLength) :
                        (row - headLength) % bodyLength;
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
                var r = row < headLength ? row :
                    row >= this.getRowCount() - footLength ?
                        row - (this.getRowCount() - footLength) +
                            headLength + bodyLength :
                        (row - headLength) % bodyLength + headLength;
                var v = this.cellHeight[r];
                return typeof v == 'number' ? v : this.defaultCellHeight;
            };
            TemplateTableModelImpl.prototype.isColumnDraggable = function () {
                var v = this.columnDraggable;
                return typeof v == 'boolean' ? v : true;
            };
            TemplateTableModelImpl.prototype.isColumnResizableAt = function (col) {
                var orderedCol = this.getOrderedColumnIndexAt(col);
                var v = this.columnResizable[orderedCol];
                return typeof v == 'boolean' ? v : true;
            };
            TemplateTableModelImpl.prototype.getCellRendererFactoryAt = function (row, col) {
                var orderedCol = this.getOrderedColumnIndexAt(col);
                return getCellStyleAt(this, row, orderedCol).factory ||
                    (row < headLength ?
                        this.defaultHeaderCellRendererFactory :
                        this.defaultCellRendererFactory);
            };
            TemplateTableModelImpl.prototype.getCellStyleAt = function (row, col) {
                var orderedCol = this.getOrderedColumnIndexAt(col);
                var style = comfortable.util.extend({}, getCellStyleAt(this, row, orderedCol));
                style.className = style.className || '';
                if (this.editingCell &&
                    this.editingCell.row == row &&
                    this.editingCell.col == col) {
                    style.className += ' ${prefix}-editing';
                }
                if (row < headLength) {
                    style.className += ' ${prefix}-header';
                    style.editable = false;
                }
                else if (row >= this.getRowCount() - footLength) {
                    style.className += ' ${prefix}-footer';
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
                    if (this.getItemStyleAt) {
                        comfortable.util.extend(style, this.getItemStyleAt(itemIndex));
                    }
                }
                if (style.editable === false) {
                    style.className += ' ${prefix}-readonly';
                }
                return style;
            };
            TemplateTableModelImpl.prototype.getValueAt = function (row, col) {
                var orderedCol = this.getOrderedColumnIndexAt(col);
                if (row < headLength || row >= this.getRowCount() - footLength) {
                    var label = getCellStyleAt(this, row, orderedCol).label || '';
                    return typeof label == 'function' ? label(this) : label;
                }
                else {
                    var itemIndex = this.getItemIndexAt(row, col);
                    var value = this.getItemAt(itemIndex.row)[itemIndex.col];
                    return typeof value != 'undefined' ? value : '';
                }
            };
            TemplateTableModelImpl.prototype.getTooltipAt = function (row, col) {
                var orderedCol = this.getOrderedColumnIndexAt(col);
                if (row < headLength || row >= this.getRowCount() - footLength) {
                    return '';
                }
                else {
                    var itemIndex = this.getItemIndexAt(row, col);
                    var value = this.getItemAt(itemIndex.row)[itemIndex.col + this.tooltipSuffix];
                    return typeof value != 'undefined' ? value : '';
                }
            };
            TemplateTableModelImpl.prototype.setTableState = function (tableState) {
                tableState = JSON.parse(JSON.stringify(tableState));
                tableState.lockColumn = tableState.lockColumn || 0;
                tableState.enableLockColumn = !!tableState.enableLockColumn;
                tableState.cellWidths = tableState.cellWidths || [];
                tableState.cellHeights = tableState.cellHeights || [];
                tableState.hiddenColumns = tableState.hiddenColumns || [];
                tableState.sort = tableState.sort || null;
                tableState.filters = tableState.filters || {};
                tableState.orderedColumnIndices =
                    tableState.orderedColumnIndices || null;
                var cellWidth = {};
                var cellHeight = {};
                var hiddenColumns = {};
                tableState.cellWidths.forEach(function (cw) {
                    cellWidth[cw.col] = cw.width;
                });
                tableState.cellHeights.forEach(function (ch) {
                    cellHeight[ch.row] = ch.height;
                });
                tableState.hiddenColumns.forEach(function (orderedCol) {
                    hiddenColumns[orderedCol] = true;
                });
                this.lockLeft = tableState.lockColumn;
                this.enableLockColumn = tableState.enableLockColumn;
                this.cellWidth = cellWidth;
                this.cellHeight = cellHeight;
                this.hiddenColumns = hiddenColumns;
                this.sort = tableState.sort;
                var filtered = false;
                if (this.sort) {
                    filtered = true;
                }
                for (var dataField in this.headCells) {
                    var filter = tableState.filters[dataField];
                    this.getFilter(dataField).setState(filter || null);
                    if (filter) {
                        filtered = true;
                    }
                }
                this.orderedColumnIndices = tableState.orderedColumnIndices;
                if (filtered) {
                    this.trigger('filterchange');
                }
            };
            TemplateTableModelImpl.prototype.getTableState = function () {
                var cellWidths = [];
                var cellHeights = [];
                var hiddenColumns = [];
                var filters = {};
                var col, row;
                for (col in this.cellWidth) {
                    cellWidths.push({ col: col, width: this.cellWidth[col] });
                }
                for (row in this.cellHeight) {
                    cellHeights.push({ row: row, height: this.cellHeight[row] });
                }
                for (col in this.hiddenColumns) {
                    hiddenColumns.push(col);
                }
                for (var dataField in this.headCells) {
                    var filter = this.getFilter(dataField);
                    if (filter.enabled()) {
                        filters[dataField] = filter.getState();
                    }
                }
                var tableState = {
                    lockColumn: this.lockLeft,
                    enableLockColumn: this.enableLockColumn,
                    cellWidths: cellWidths,
                    cellHeights: cellHeights,
                    hiddenColumns: hiddenColumns,
                    sort: this.sort,
                    filters: filters,
                    orderedColumnIndices: this.getOrderedColumnIndices()
                };
                return JSON.parse(JSON.stringify(tableState));
            };
            return TemplateTableModelImpl;
        }(comfortable.DefaultTableModel));
        var table = new TemplateTableImpl(new TemplateTableModelImpl());
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
        table.on('mousedown', function (event, detail) {
            if (detail.row < this.model.getLockTop()) {
                this.editor.endEdit();
                this.invalidate();
            }
        }).on('contextmenu', function (event, detail) {
            if (!(detail.row < table.model.getLockTop())) {
                return;
            }
            detail.originalEvent.preventDefault();
            this.trigger('showcontextmenu', {
                x: detail.originalEvent.pageX,
                y: detail.originalEvent.pageY
            });
        }).on('showcontextmenu', function (event, detail) {
            var menuItems = this.getContextMenuItems();
            if (!menuItems || menuItems.length == 0) {
                return;
            }
            comfortable.util.callLater(function () {
                comfortable.ui.showMenu(detail.x, detail.y, menuItems);
            });
        });
        comfortable.util.set(table.$el, {
            on: {
                contextmenu: function (event) {
                    var menu = comfortable.util.closest(event.target, { className: '${prefix}-contextmenu', root: table.$el });
                    if (menu != null) {
                        return;
                    }
                    var tbl = comfortable.util.closest(event.target, { tagName: 'TABLE', root: table.$el });
                    if (tbl == null) {
                        event.preventDefault();
                        table.trigger('showcontextmenu', {
                            x: event.pageX, y: event.pageY
                        });
                    }
                }
            }
        });
        table.model.on('valuechange', function (event, detail) {
            this.trigger('beforevaluechange', detail);
            this.setValueAt(detail.row, detail.col, detail.newValue);
        }).on('editingcellchange', function (event, detail) {
            this.editingCell = detail.cell;
        }).on('cellsizechange', function (event, detail) {
            if (typeof detail.col == 'number') {
                var orderedCol = this.getOrderedColumnIndexAt(detail.col);
                this.cellWidth[orderedCol] = detail.cellWidth;
            }
        }).on('columndragged', function (event, detail) {
            var tableModel = table.model;
            this.orderedColumnIndices = comfortable.util.moveSublist(this.orderedColumnIndices, detail.colFrom, detail.colSpan, detail.colTo);
            if (detail.colFrom < tableModel.lockLeft &&
                tableModel.lockLeft <= detail.colTo) {
                tableModel.lockLeft -= detail.colSpan;
            }
            else if (detail.colTo < tableModel.lockLeft &&
                tableModel.lockLeft <= detail.colFrom) {
                tableModel.lockLeft += detail.colSpan;
            }
        }).on('filterchange', function () {
            this.selectedRows = {};
            this.trigger('rowselectionchange', { selectedRows: this.selectedRows, reason: 'filterchange' });
            var filters = {};
            !function () {
                for (var dataField in this.headCells) {
                    var filter = this.getFilter(dataField);
                    if (filter.enabled()) {
                        filters[dataField] = filter;
                    }
                }
            }.bind(this)();
            var filteredItems = this.items.filter(function (item) {
                var filtered = false;
                for (var dataField in filters) {
                    var value = item[dataField];
                    if (typeof value == 'undefined') {
                        continue;
                    }
                    var filter = filters[dataField];
                    if (!filter.accept(value)) {
                        filtered = true;
                        break;
                    }
                }
                return !filtered;
            });
            var sort = this.sort;
            if (sort) {
                var order = sort.order == comfortable.SortOrder.ASC ? 1 : -1;
                var dataField = sort.dataField;
                var indexField = '.index';
                var sortKeyField = '.sortKey';
                var comparator = this.headCells[dataField].comparator ||
                    function (v1, v2) { return v1 < v2 ? -1 : 1; };
                filteredItems.forEach(function (item, i) {
                    item[indexField] = i;
                    item[sortKeyField] = (item[dataField] === null ||
                        typeof item[dataField] == 'undefined') ? '' : item[dataField];
                });
                filteredItems.sort(function (item1, item2) {
                    var v1 = item1[sortKeyField];
                    var v2 = item2[sortKeyField];
                    if (v1 === '' && v2 !== '') {
                        return 1;
                    }
                    else if (v1 !== '' && v2 === '') {
                        return -1;
                    }
                    var result = (v1 === v2) ? 0 : comparator(v1, v2);
                    if (result != 0) {
                        return order * result;
                    }
                    return order * (item1[indexField] < item2[indexField] ? -1 : 1);
                });
                filteredItems.forEach(function (item) {
                    delete item[indexField];
                    delete item[sortKeyField];
                });
            }
            this.filteredItems = filteredItems;
            table.invalidate();
        });
        enableHover(table);
        enableRowSelect(table);
        return table;
    };
})(comfortable || (comfortable = {}));
var comfortable;
(function (comfortable) {
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
                if (this.getModel().filteredItems) {
                    this.getModel().trigger('filterchange');
                }
                return this;
            },
            getItems: function () {
                return this.$options.table.model.items;
            },
            getModel: function () {
                return this.$options.table.model;
            }
        },
        mounted: function () {
            var table = comfortable.fromTemplate(this.template);
            table.$el.style.width = '100%';
            table.$el.style.height = '100%';
            this.$el.style.width = this.$el.style.width || '400px';
            this.$el.style.height = this.$el.style.height || '200px';
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
            this.$options.table = table;
            this.$el.appendChild(table.$el);
            var items = this.items;
            this.setItems(items ? JSON.parse(items) : []);
            comfortable.util.extend(this.$options, {
                observeInterval: 50,
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
            observeSize();
        },
        beforeDestroy: function () {
            this.$options.alive = false;
            this.$options.table.dispose();
        }
    };
    comfortable.vueComponents = {
        table: table
    };
})(comfortable || (comfortable = {}));

//# sourceMappingURL=comfortable.js.map
