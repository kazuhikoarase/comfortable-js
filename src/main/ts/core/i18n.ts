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

namespace comfortable.i18n {

  'use strict';

  export interface I18N {
    messages : Messages
  }

  export interface Messages {
    RESET_FILTER : string;
    EDIT_COLUMNS : string;
    SORT_ASC : string;
    SORT_DESC : string;
    APPLY : string;
    OK : string;
    CANCEL : string;
    RESET : string;
    LOCK_COLUMN : string;
    SELECT_BLANK : string;
    SELECT_ALL : string;
    SEARCH : string;
    CLEAR_FILTER_FROM : string;
    TEXT_FILTERS : string;
    NUMBER_FILTERS : string;
    OP_LAYOUT : string;
    AND : string;
    OR : string;
    EQUALS : string;
    NOT_EQUALS : string;
    GREATER_THAN : string;
    GREATER_THAN_OR_EQUALS : string;
    LESS_THAN : string;
    LESS_THAN_OR_EQUALS : string;
    STARTS_WITH : string;
    NOT_STARTS_WITH : string;
    ENDS_WITH : string;
    NOT_ENDS_WITH : string;
    CONTAINS : string;
    NOT_CONTAINS : string;
    WEEKDAYS : string;
  }

  export var getInstance = function(lang : string) {
    lang = lang || navigator.language || (<any>navigator).userLanguage;
    var _i18n : any = i18n;
    return <I18N>(util.extend({}, _i18n.en, _i18n[lang] ||
        _i18n[lang.replace(/\-\w+$/, '')] || {}) );
  }

  export var getMessages = function() : Messages {
    return util.extend(
        this.getInstance('en').messages,
        this.getInstance().messages);
  }

}
