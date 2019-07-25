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

  export interface Editor {
    endEdit : (reason : string) => void;
  }

  export interface Table extends UIEventTarget {
    $el : HTMLElement;
    model : TableModel;
    editor : Editor;
    forEachCells : (callback : (
      cell : {
        $el : HTMLElement, row : number, col : number 
      }) => boolean) => void;
    findNextEditable : (
        row : number, col : number,
        offset : { row : number, col : number },
        found : (row : number, col : number) => void
      ) => void;
    dispose : () => void;
  }

  export interface TableCellRenderer {
    getCellStyle? : (cell : any) => ElementOptions;
    render : (cell : any) => void;
    beginEdit : (cell : any) => {
      focus() : void;
      endEdit : () => ({ newValue : any; oldValue? : any; } | void);
    };
    dispose : () => void;
  }

  export interface TdWrapper {
    $el : HTMLElement;
    tableModel : TableModel; 
  }

  export type TableCellRendererFactory =
    (td : TdWrapper) => TableCellRenderer;

  export interface TableCellStyle {
    rowSpan? : number;
    colSpan? : number;
    editable? : boolean;
    fontWeight? : string;
    className? : string;
    textAlign? : string;
    verticalAlign? : string;
    color? : string;
    backgroundColor? : string;
    borderLeft? : string;
    borderTop? : string;
    borderRight? : string;
    borderBottom? : string;
    labelFunction? : (value : any, cell : EditorCell) => string;
  }

  export interface TableCell extends TableCellStyle {
    row : number;
    col : number;
    value : any;
    tooltip? : string;
  }

  export interface TableModel extends EventTarget {
    defaultCellWidth : number;
    defaultCellHeight : number;
    defaultCellStyle : TableCellStyle;
    defaultCellRendererFactory : TableCellRendererFactory;
    maxRowSpan : number;
    maxColSpan : number;
    minCellWidth : number;
    getLockTop : () => number;
    getLockLeft : () => number;
    getLockBottom : () => number;
    getLockRight : () => number;
    getRowCount : () => number;
    getColumnCount : () => number;
    getLineRowAt : (row : number) => any;
    getLineRowCountAt : (row : number) => number;
    getValueAt : (row : number, col : number) => any;
    getTooltipAt : (row : number, col : number) => string;
    getCellStyleAt : (row : number, col : number) => TableCellStyle;
    getCellRendererFactoryAt : (row : number, col : number) => TableCellRendererFactory;
    getCellWidthAt : (col : number) => number;
    getCellHeightAt : (row : number) => number;
    getCellAt : (row : number, col : number) => TableCell;
    checkSpaned : (row : number, col : number) => { row : number, col : number };
    isColumnResizableAt : (col : number) => boolean;
    isColumnDraggable : () => boolean;
  }

  export interface TextEditorOptions {
    decimalDigits? : number;
    maxLength? : number;
    imeMode? : string;
  }
  export interface TextEditorCell extends TableCell {
  }

  export interface CheckBoxOptions {
  }
  export interface CheckBoxCell extends TableCell {
    booleanValues : any[];
  }

  export interface SelectBoxOptions {
  }

  export interface SelectBoxCell extends TableCell {
    valueField? : string;
    labelField? : string;
    options? : any[] | ( (row : number,col : number) => any[]);
  }

  export interface CellRendererFactoryOpts {
    dataType? : string;
    renderIsEditor? : boolean;
    labelFunction? : (value : any, cell : EditorCell) => string;
    editorPool? : EditorPool;
  }

  export interface EditorPool {
    getEditor(dataType : string) : CellEditor<any,any>;
    releaseEditor(dataType : string, editor : CellEditor<any,any>) : void;
  }

  export type EditorCell = TextEditorCell|CheckBoxCell|SelectBoxCell;

  export interface CellEditor<E,O> {
    $el : E;
    init : (opts : O) => void;
    beginEdit : (td : TdWrapper, cell : EditorCell) => void;
    focus : () => void;
    blur : () => void;
    setValue : (value : any) => void;
    getValue : () => any;
    isValid : () => boolean;
    setVisible : (visible : boolean) => void;
  }

}
