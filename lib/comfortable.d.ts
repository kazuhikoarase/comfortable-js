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
declare namespace comfortable {
    interface Editor {
        endEdit: () => void;
    }
    interface Table extends UIEventTarget {
        $el: HTMLElement;
        model: TableModel;
        editor: Editor;
        forEachCells: (callback: (cell: {
            $el: HTMLElement;
            row: number;
            col: number;
        }) => void) => void;
    }
    interface TableCellRenderer {
        render: (cell: any) => void;
        beginEdit: (cell: any) => {
            focus(): void;
            endEdit: () => ({
                newValue: any;
                oldValue?: any;
            } | void);
        };
        dispose: () => void;
    }
    interface TdWrapper {
        $el: HTMLElement;
        tableModel: TableModel;
    }
    type TableCellRendererFactory = (td: TdWrapper) => TableCellRenderer;
    interface TableCellStyle {
        rowSpan?: number;
        colSpan?: number;
        editable?: boolean;
        fontWeight?: string;
        className?: string;
        textAlign?: string;
        verticalAlign?: string;
        color?: string;
        backgroundColor?: string;
        borderLeft?: string;
        borderTop?: string;
        borderRight?: string;
        borderBottom?: string;
        labelFunction?: (value: any, cell: EditorCell) => string;
    }
    interface TableCell extends TableCellStyle {
        row: number;
        col: number;
        value: any;
    }
    interface TableModel extends EventTarget {
        defaultCellWidth: number;
        defaultCellHeight: number;
        defaultCellStyle: TableCellStyle;
        defaultCellRendererFactory: TableCellRendererFactory;
        maxRowSpan: number;
        maxColSpan: number;
        minCellWidth: number;
        getLockTop: () => number;
        getLockLeft: () => number;
        getLockBottom: () => number;
        getLockRight: () => number;
        getRowCount: () => number;
        getColumnCount: () => number;
        getLineRowAt: (row: number) => any;
        getLineRowCountAt: (row: number) => number;
        getValueAt: (row: number, col: number) => any;
        getCellStyleAt: (row: number, col: number) => TableCellStyle;
        getCellRendererFactoryAt: (row: number, col: number) => TableCellRendererFactory;
        getCellWidthAt: (col: number) => number;
        getCellHeightAt: (row: number) => number;
        getCellAt: (row: number, col: number) => TableCell;
        checkSpaned: (row: number, col: number) => {
            row: number;
            col: number;
        };
        isColumnResizableAt: (col: number) => boolean;
        isColumnDraggableAt: (col: number) => boolean;
    }
    interface TextEditorOptions {
        dataType: string;
        decimalDigits?: number;
    }
    interface TextEditorCell extends TableCell {
        maxLength?: number;
    }
    interface CheckBoxOptions {
    }
    interface CheckBoxCell extends TableCell {
        booleanValues: any[];
    }
    interface SelectBoxOptions {
    }
    interface SelectBoxCell extends TableCell {
        valueField?: string;
        labelField?: string;
        options?: any[] | ((row: number, col: number) => any[]);
    }
    interface CellRendererFactoryOpts {
        labelFunction?: (value: any, cell: EditorCell) => string;
        createEditor?: () => CellEditor;
        renderIsEditor?: boolean;
        dataType?: string;
    }
    type EditorCell = TextEditorCell | CheckBoxCell | SelectBoxCell;
    interface CellEditor {
        $el: HTMLElement;
        beginEdit: (td: TdWrapper, cell: EditorCell) => void;
        focus: () => void;
        blur: () => void;
        setValue: (value: any) => void;
        getValue: () => any;
        isValid: () => boolean;
    }
}
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
declare namespace comfortable {
}
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
declare namespace comfortable {
    var createDefaultCellRendererFactoryOpts: () => CellRendererFactoryOpts;
    var createDefaultCellRendererFactory: (opts?: CellRendererFactoryOpts) => TableCellRendererFactory;
    var createMultiLineLabelRenderer: (parent: HTMLElement) => {
        setLabel: (label: string) => void;
        setVisible: (visible: boolean) => void;
    };
}
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
declare namespace comfortable {
    interface Event {
        type: string;
        target?: any;
        currentTarget?: any;
        preventDefault?: () => void;
        which?: number;
        defaultPrevented?: boolean;
        pageX?: number;
        pageY?: number;
    }
    type EventListener = (event: Event, detail?: any) => void;
    interface EventTarget {
        trigger: (type: string, detail?: any) => EventTarget;
        on: (type: string, listener: EventListener) => EventTarget;
        off: (type: string, listener: EventListener) => EventTarget;
    }
}
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
declare namespace comfortable {
}
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
declare namespace comfortable.i18n {
    interface I18N {
        messages: Messages;
    }
    interface Messages {
        RESET_FILTER: string;
        EDIT_COLUMNS: string;
        SORT_ASC: string;
        SORT_DESC: string;
        APPLY: string;
        OK: string;
        CANCEL: string;
        RESET: string;
        LOCK_COLUMN: string;
        SELECT_BLANK: string;
        SELECT_ALL: string;
    }
    var getInstance: (lang: string) => I18N;
    var getMessages: () => Messages;
}
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
declare namespace comfortable.i18n {
}
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
declare namespace comfortable.i18n {
}
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
declare namespace comfortable {
    interface UIEventTarget extends EventTarget {
        invalidate: () => void;
        render: () => void;
    }
}
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
declare namespace comfortable {
}
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
declare namespace comfortable {
    interface List<T, C extends ListCell> extends UIEventTarget {
        $el: HTMLElement;
        getItemAt: (index: number) => T;
        getItemCount: () => number;
        createCell: () => C;
        renderCell: (cell: C, item: T) => void;
        cellHeight: number;
    }
    interface ListCell {
        $el: HTMLElement;
        row: number;
    }
}
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
declare namespace comfortable {
    var classNamePrefix: string;
}
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
declare namespace comfortable {
    var createTable: () => Table;
}
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
declare namespace comfortable {
    interface Menu {
        dispose: () => void;
    }
    interface MenuItem {
        label: string;
        action?: (event?: Event) => void;
        children?: () => MenuItem[];
    }
    var ui: {
        createButton: (label: string, action: (event: Event) => void) => HTMLElement;
        createDialog: (children: HTMLElement[]) => any;
        showMenu: (left: number, top: number, menuItems: MenuItem[]) => Menu;
    };
}
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
declare namespace comfortable {
    interface ElementOptions {
        attrs?: {
            [key: string]: string;
        };
        style?: {
            [key: string]: string;
        };
        props?: {
            [key: string]: any;
        };
        on?: {
            [type: string]: (event: any) => void;
        };
    }
    interface CreateElement {
        (tagName: string, opts?: ElementOptions, children?: HTMLElement[]): HTMLElement;
        (tagName: string, children?: HTMLElement[], opts?: ElementOptions): HTMLElement;
    }
    class $ {
        private elm;
        constructor(elm: HTMLElement | Document);
        on(type: string, listener: EventListener): this;
        off(type: string, listener: EventListener): this;
        addClass(className: string, remove?: boolean): this;
        removeClass(className: string): this;
    }
    var util: {
        extend: (arg: any, ...args: any[]) => any;
        callLater: (cb: () => void) => void;
        set: (elm: Node, opts: ElementOptions) => Node;
        createElement: CreateElement;
        createSVGElement: CreateElement;
        $: (elm: HTMLElement | Document) => $;
        closest: (elm: HTMLElement, opts: {
            className?: string;
            tagName?: string;
            root?: HTMLElement;
            $el?: HTMLElement;
        }) => HTMLElement;
        indexOf: (elm: Node) => any;
        offset: (elm: HTMLElement) => {
            left: number;
            top: number;
        };
        moveSublist: (list: any[], from: number, length: number, to: number) => any[];
        getCellId: (row: number, col: number) => string;
        translate: (val1: number, min1: number, max1: number, min2: number, max2: number, log?: string) => number;
        numRe: RegExp;
        formatNumber: (value: string, digits?: number, s1?: string, s2?: string) => string;
        toNarrowNumber: (value: string) => string;
    };
}
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
declare namespace comfortable {
    interface TableTemplateCellStyle extends TableCellStyle, CellRendererFactoryOpts {
        width?: number;
        height?: number;
        columnDraggable?: boolean;
        columnResizable?: boolean;
        dataField?: string;
        /** one of 'string(default)', 'number', 'boolean', 'select-one' */
        dataType?: string;
        /** dataType : 'string', 'number' */
        maxLength?: number;
        /** dataType : 'number' */
        decimalDigits?: number;
        /** dataType : 'boolean',
          2 elements array like [falseValue, trueValue].
         */
        booleanValues?: any[];
        /** dataType : 'select-one' */
        options?: (any[] | ((row: number, col: number) => any[]));
        labelField?: string;
        valueField?: string;
        factory?: TableCellRendererFactory;
        label?: (string | ((model: TemplateTableModel) => string));
        /** dataType : 'number' */
        comparator?: (v1: any, v2: any) => number;
    }
    interface TableTemplate {
        lockColumn?: number;
        thead?: TableTemplateCellStyle[][];
        tbody?: TableTemplateCellStyle[][];
        tfoot?: TableTemplateCellStyle[][];
    }
    interface ItemIndex {
        row: number;
        /** col will be string if dataField is defined. */
        col: (number | string);
    }
    interface TemplateTableModel extends TableModel {
        enableLockColumn: boolean;
        defaultLockColumn: number;
        setLockLeft: (lockLeft: number) => void;
        filterContext: FilterContext;
        defaultHeaderCellRendererFactory: TableCellRendererFactory;
        items: any[];
        filteredItems: any[];
        resetFilter: () => void;
        getItemAt: (row: number) => any;
        getItemCount: () => number;
        getItemIndexAt: (row: number, col: number) => ItemIndex;
        getOrderedColumnIndexAt: (col: number) => number;
        orderedColumnIndices: number[];
        hiddenColumns: {
            [orderedCol: number]: boolean;
        };
        hoverRow: number;
        setTableState: (tableState: TemplateTableState) => void;
        getTableState: () => TemplateTableState;
    }
    interface TemplateTableState {
        cellWidths: {
            col: number;
            width: number;
        }[];
        cellHeights: {
            row: number;
            height: number;
        }[];
        hiddenColumns: number[];
        filterContext: FilterContext;
        orderedColumnIndices: number[];
    }
    interface TemplateTableCell extends TableCell {
        dataField?: string;
        comparator?: (a: any, b: any) => number;
    }
    type Rejects = {
        [value: string]: boolean;
    };
    interface FilterContext {
        sort?: {
            dataField: string;
            sortOrder: string;
        };
        filters: {
            [dataField: string]: Rejects;
        };
    }
    interface TemplateTable extends Table {
    }
}
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
declare namespace comfortable {
    var SortOrder: {
        ASC: string;
        DESC: string;
    };
    var createDefaultHeaderCellRendererFactory: (opts?: CellRendererFactoryOpts) => TableCellRendererFactory;
}
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
declare namespace comfortable {
    var fromTemplate: (template: TableTemplate) => TemplateTable;
}
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
declare namespace comfortable {
    var vueComponents: {
        table: {
            template: string;
            props: {
                template: {
                    'default': () => {
                        thead: {
                            label: string;
                        }[][];
                    };
                };
            };
            methods: {
                invalidate: () => any;
                setItems: (items: any[]) => any;
                getItems: () => any;
                getModel: () => any;
            };
            mounted: () => void;
            beforeDestroy: () => void;
        };
    };
}
