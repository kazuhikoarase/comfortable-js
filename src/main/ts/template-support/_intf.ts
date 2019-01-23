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

namespace comfortable {

  'use strict';

  export interface TableTemplateCellStyle
  extends TableCellStyle, CellRendererFactoryOpts {

    width? : number;
    height? : number;

    columnDraggable? : boolean;
    columnResizable? : boolean;

    dataField? : string;

    /** one of 'string(default)', 'number', 'boolean', 'select-one' */
    dataType? : string;

    /** dataType : 'string', 'number' */
    maxLength? : number;

    /** dataType : 'number' */
    decimalDigits? : number;

    /** dataType : 'boolean',
      2 elements array like [falseValue, trueValue].
     */
    booleanValues? : any[];

    /** dataType : 'select-one' */
    options? : (any[] | ((row : number, col : number) => any[]) );
    labelField? : string;
    valueField? : string;

    factory? : TableCellRendererFactory;

    label? : (string | (() => string) );
    /** dataType : 'number' */
    comparator? : (v1 : any, v2 : any) => number;
  }

  export interface TableTemplate {
    lockColumn? : number;
    thead? : TableTemplateCellStyle[][];
    tbody? : TableTemplateCellStyle[][];
    tfoot? : TableTemplateCellStyle[][];
  }

  export interface ItemIndex {
    row : number;
    /** col will be string if dataField is defined. */
    col : (number | string);
  }

  export interface TemplateTableModel extends TableModel {
    filterContext : FilterContext;
    defaultHeaderCellRendererFactory : TableCellRendererFactory;
    items : any[];
    filteredItems : any[];
    resetFilter : () => void;
    getItemAt : (row : number) => any;
    getItemCount : () => number;
    getItemIndexAt : (row : number, col : number) => ItemIndex;
    getOrderedColumnIndexAt : (col : number) => number;
    orderedColumnIndices : number[];
    hiddenColumns : { [ orderedCol : number ] : boolean };
    hoverRow : number;
  }

  export interface TemplateTableCell extends TableCell {
    dataField? : string;
    comparator? : (a: any, b: any) => number;
  }

  export type Rejects = { [ value : string ] : boolean };

  export interface FilterContext {
    sort? : { dataField : string; sortOrder : string; }
    filters : { [ dataField : string ] : Rejects };
  }

  export interface TemplateTable extends Table {
    enableLockColumn : boolean;
    defaultLockColumn : number;
    setLockLeft : (lockLeft : number) => void;
  }

}
