declare namespace comfortable {
    var createDefaultCellRendererFactoryOpts: () => CellRendererFactoryOpts;
    var createDefaultCellRendererFactory: (opts?: CellRendererFactoryOpts) => TableCellRendererFactory;
    var createMultiLineLabelRenderer: (parent: HTMLElement) => {
        setLabel: (label: string) => void;
        setVisible: (visible: boolean) => void;
    };
}
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
    class EventTargetImpl implements EventTarget {
        private map;
        private listeners;
        trigger(type: string, detail?: any): this;
        on(type: string, listener: EventListener): this;
        off(type: string, listener: EventListener): this;
    }
}
declare namespace comfortable {
    class DefaultTableModel extends EventTargetImpl implements TableModel {
        defaultCellWidth: number;
        defaultCellHeight: number;
        defaultCellStyle: {
            rowSpan: number;
            colSpan: number;
            editable: boolean;
        };
        defaultCellRendererFactory: TableCellRendererFactory;
        maxRowSpan: number;
        maxColSpan: number;
        minCellWidth: number;
        getRowCount(): number;
        getColumnCount(): number;
        getLineRowAt(row: number): number;
        getLineRowCountAt(row: number): number;
        getValueAt(row: number, col: number): string;
        getCellStyleAt(row: number, col: number): {};
        getCellRendererFactoryAt(row: number, col: number): TableCellRendererFactory;
        getCellWidthAt(col: number): number;
        getCellHeightAt(row: number): number;
        getCellAt(row: number, col: number): any;
        checkSpaned(row: number, col: number): {
            row: number;
            col: number;
        };
        isColumnResizableAt(col: number): boolean;
        isColumnDraggableAt(col: number): boolean;
    }
}
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
declare namespace comfortable {
    interface UIEventTarget extends EventTarget {
        invalidate: () => void;
        render: () => void;
    }
    class UIEventTargetImpl extends EventTargetImpl implements UIEventTarget {
        valid: boolean;
        invalidate(): void;
        render(): void;
    }
}
declare namespace comfortable {
    interface ElmCache {
        $el: HTMLElement;
        tableModel?: TableModel;
        row?: number;
        col?: number;
        children?: ElmCache[];
        renderer?: TableCellRenderer;
        factory?: TableCellRendererFactory;
    }
    interface TableState {
        left: number;
        top: number;
        width: number;
        height: number;
        minRow: number;
        maxRow: number;
        minCol: number;
        maxCol: number;
        indexById: {
            [id: string]: {
                trIndex: number;
                tdIndex: number;
            };
        };
    }
    interface OffsetCache {
        left: {
            [i: number]: number;
        };
        top: {
            [i: number]: number;
        };
    }
    interface InternalTable {
        $el: HTMLElement;
        left: number;
        top: number;
        colgroup: ElmCache;
        tbody: ElmCache;
        row?: number;
        col?: number;
        model: TableModel;
        tableState: TableState;
        beforeCellSizeChangeHandler: EventListener;
        offsetCache: OffsetCache;
        calcCellPosition: (left: number, top: number) => {
            left: number;
            top: number;
            row: number;
            col: number;
        };
        preRender: () => TableState;
        render: () => void;
    }
    class InternalTableImpl implements InternalTable {
        private _colgroup;
        private _tbody;
        private table;
        private view;
        private getOrCrt;
        private getCellStyle;
        $el: HTMLElement;
        colgroup: ElmCache;
        tbody: ElmCache;
        left: number;
        top: number;
        model: TableModel;
        tableState: TableState;
        offsetCache: OffsetCache;
        beforeCellSizeChangeHandler: EventListener;
        calcCellPosition(left: number, top: number): {
            left: number;
            col: number;
            top: number;
            row: number;
        };
        preRender(): TableState;
        render(): void;
    }
}
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
    class ListImpl<T, C extends ListCell> extends UIEventTargetImpl implements List<T, C> {
        private listContent;
        private list;
        private scr;
        private viewPane;
        private frame;
        private cells;
        private getOrCrt;
        $el: HTMLElement;
        getItemAt(index: number): T;
        getItemCount(): number;
        createCell(): C;
        renderCell(cell: C, item: T): void;
        cellHeight: number;
        render(): void;
    }
}
declare namespace comfortable {
    var classNamePrefix: string;
}
declare namespace comfortable {
    interface InternalEditor extends Editor {
        cell?: {
            row: number;
            col: number;
        };
        beginEdit: (row: number, col: number, makeVisible?: boolean) => void;
        endEdit: () => void;
    }
    var tableEventTypes: string[];
    var createTable: () => Table;
    class TableImpl extends UIEventTargetImpl implements Table {
        constructor(model: TableModel);
        private tables;
        private scr;
        private viewPane;
        private frame;
        private lockLines;
        private colResizeHandles;
        private getCellRect;
        private makeVisible;
        private cellSizeCache;
        private beforeCellSizeChangeHandler;
        private getCellSizeCache;
        private getRenderParams;
        private getTargetTable;
        private isEditableAt;
        private move;
        private renderColumnResizeHandlers;
        render(visibleCell?: {
            row: number;
            col: number;
        }): void;
        private createInternalEditor;
        $el: HTMLElement;
        getLockRow(): number;
        getLockColumn(): number;
        forEachCells(callback: any): void;
        editor: InternalEditor;
        model: TableModel;
    }
}
declare namespace comfortable.ui {
    var createButton: (label: string, action: (event: Event) => void) => HTMLElement;
    var createDialog: (children: HTMLElement[]) => any;
    interface Menu {
        dispose: () => void;
    }
    interface MenuItem {
        label: string;
        action?: (event?: Event) => void;
        children?: () => MenuItem[];
    }
    var showMenu: (left: number, top: number, menuItems: MenuItem[]) => Menu;
}
declare namespace comfortable.util {
    var extend: (arg: any, ...args: any[]) => any;
    var callLater: (cb: () => void) => void;
    var replaceClassNamePrefix: (className: string) => string;
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
    var set: (elm: Node, opts: ElementOptions) => Node;
    interface CreateElement {
        (tagName: string, opts?: ElementOptions, children?: HTMLElement[]): HTMLElement;
        (tagName: string, children?: HTMLElement[], opts?: ElementOptions): HTMLElement;
    }
    var createElement: CreateElement;
    var createSVGElement: CreateElement;
    var $: (elm: HTMLElement | Document) => {
        on: (type: string, listener: EventListener) => any;
        off: (type: string, listener: EventListener) => any;
        addClass: (className: string, remove?: boolean) => any;
        removeClass: (className: string) => any;
    };
    var closest: (elm: HTMLElement, opts: {
        className?: string;
        tagName?: string;
        root?: HTMLElement;
        $el?: HTMLElement;
    }) => HTMLElement;
    var indexOf: (elm: Node) => any;
    var offset: (elm: HTMLElement) => {
        left: number;
        top: number;
    };
    var moveSublist: (list: any[], from: number, length: number, to: number) => any[];
    var getCellId: (row: number, col: number) => string;
    var translate: (val1: number, min1: number, max1: number, min2: number, max2: number, log?: string) => number;
    var numRe: RegExp;
    var formatNumber: (value: string, digits?: number, s1?: string, s2?: string) => string;
    var toNarrowNumber: (value: string) => string;
}
declare namespace comfortable {
    interface Editor {
        endEdit: () => void;
    }
    interface Table extends UIEventTarget {
        $el: HTMLElement;
        model: TableModel;
        editor: Editor;
        getLockRow: () => number;
        getLockColumn: () => number;
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
    }
    interface TableModel extends EventTarget {
        defaultCellWidth: number;
        defaultCellHeight: number;
        defaultCellStyle: TableCellStyle;
        defaultCellRendererFactory: TableCellRendererFactory;
        maxRowSpan: number;
        maxColSpan: number;
        minCellWidth: number;
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
    interface TableCell extends TableCellStyle {
        row: number;
        col: number;
        value: any;
        labelFunction: (value: any) => string;
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
declare namespace comfortable {
}
declare namespace comfortable {
    var SortOrder: {
        ASC: string;
        DESC: string;
    };
    var createDefaultHeaderCellRendererFactory: (opts?: CellRendererFactoryOpts) => TableCellRendererFactory;
}
declare namespace comfortable {
    var fromTemplate: (template: TableTemplate) => TemplateTable;
}
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
    }
    interface TableTemplateHeaderCellStyle extends TableTemplateCellStyle {
        label?: string;
        /** dataType : 'number' */
        comparator?: (v1: any, v2: any) => number;
    }
    interface TableTemplate {
        lockColumn?: number;
        thead?: TableTemplateHeaderCellStyle[][];
        tbody?: TableTemplateCellStyle[][];
    }
    interface ItemIndex {
        row: number;
        /** col will be string if dataField is defined. */
        col: (number | string);
    }
    interface TemplateTableModel extends TableModel {
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
        enableLockColumn: boolean;
        defaultLockColumn: number;
        setLockColumn: (lockColumn: number) => void;
    }
}
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
                getLockRow: () => any;
                getLockColumn: () => any;
            };
            mounted: () => void;
            beforeDestroy: () => void;
        };
    };
}
declare namespace comfortable.i18n {
    var en: I18N;
}
declare namespace comfortable.i18n {
    var ja: I18N;
}
