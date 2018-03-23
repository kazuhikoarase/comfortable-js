//
// comfortable - TypeScript Declaration File
//
// Copyright (c) 2018 Kazuhiko Arase
//
// URL: https://github.com/kazuhikoarase/comfortable/
//
// Licensed under the MIT license:
//  http://www.opensource.org/licenses/mit-license.php
//

declare namespace comfortable {

  interface Event { type : string; }

  type EventListener = (event : Event, detail? : any) => void;

  interface EventTarget {
    trigger : (type : string, detail : any) => EventTarget;
    on : (type : string, listener : EventListener) => EventTarget;
    off : (type : string, listener : EventListener) => EventTarget;
  }

  interface UIEventTarget extends EventTarget {
    invalidate : () => void;
    render : () => void;
  }

  interface ElementOptions {
    attrs? : { [ key : string ] : string };
    style? : { [ key : string ] : string };
    props? : { [ key : string ] : any };
    on? : { [ type : string ] : (event : any) => void };
  }

  interface Util {
    createElement :
      ((tagName : string, opts? : ElementOptions, children? : Element[]) => Element) |
      ((tagName : string, children? : Element[], opts? : ElementOptions) => Element);
  }

  interface List extends UIEventTarget {
    $el : Element;
    getItemAt : (index : number) => any;
    getItemCount : () => number;
    createCell : () => { $el : Element };
    renderCell : (cell : { $el : Element }, item :any) => void;
    cellHeight : number;
  }

  interface TableModel extends EventTarget {
    defaultCellWidth : number;
    defaultCellHeight : number;
    defaultCellStyle : TableCellStyle;
    defaultCellRenderer : TableCellRenderer;
    maxRowSpan : number;
    maxColSpan : number;
    minCellWidth : number;
    getRowCount : () => number;
    getColumnCount : () => number;
    getLineRowAt : (row : number) => any;
    getLineRowCountAt : (row : number) => number;
    getValueAt : (row : number, col : number) => any;
    getCellStyleAt : (row : number, col : number) => TableCellStyle;
    getCellRendererFactoryAt : (row : number, col : number) => TableCellRendererFactory;
    getCellWidthAt : (col : number) => number;
    getCellHeightAt : (row : number) => number;
    getCellAt : (row : number, col : number) => TableCell;
    checkSpaned : (row : number, col : number) => { row : number, col : number };
    isColumnResizableAt : (col : number) => boolean;
    isColumnDraggableAt : (col : number) => boolean;
  }

  interface Editor {
    endEdit : () => void;
  }

  interface Table extends UIEventTarget {
    $el : Element;
    lockRow : number;
    lockColumn : number;
    getLockRow : () => number;
    getLockColumn : () => number;
    model : TableModel;
    editor : Editor;
  }

  interface TableCellStyle {
    rowSpan? : number;
    colSpan? : number;
    editable? : boolean;
    className? : string;
    textAlign : string;
    color? : string;
    backgroundColor? : string;
    borderLeft? : string;
    borderTop? : string;
    borderRight? : string;
    borderBottom? : string;
  }

  interface TableCell extends TableCellStyle {
    row : number;
    col : number;
    value : any;
  }

  interface TableCellRenderer {
    render : (cell : any) => void;
    beginEdit : (cell : any) => {
      focus() : void;
      endEdit : () => ({ newValue : any; oldValue? : any; } | void);
    };
  }

  type TableCellRendererFactory =
    (td : { $el : Element, tableModel : TableModel }) => TableCellRenderer;

  interface TableTemplateCellStyle extends TableCellStyle {

    width? : number;
    height? : number;

    dataField? : string;

    // one of 'number', 'boolean', 'select-one'
    dataType? : string;

    // dataType : 'number'
    decimalDigits? : number;

    // dataType : 'select-one'
    options? : (any[] | ((row : number, col : number) => any[]) );
    labelField? : string;
    valueField? : string;

    factory? : TableCellRendererFactory;
  }

  interface TableTemplateHeaderCellStyle extends TableTemplateCellStyle {
    label? : string;
    // dataType : 'number'
    comparator? : (v1 : any, v2 : any) => number;
  }

  interface TableTemplate {
    lockColumn? : number;
    thead : TableTemplateHeaderCellStyle[][];
    tbody : TableTemplateCellStyle[][];
  }

  interface TemplateTableModel extends TableModel {
    items : any[];
    getItemAt : (row : number) => any;
    getItemCount : () => number;
    getItemIndexAt : (row : number, col : number) => number;
  }

  interface TemplateTable extends Table {
    model : TemplateTableModel;
  }

  interface TableFactory {
    classNamePrefix : string;
    util : Util;
    createList : () => List;
    createTable : () => Table;
    fromTemplate : (template : TableTemplate) => TemplateTable;
  }
}

declare var comfortable : comfortable.TableFactory;
