//
// comfortable - i18n
//
// Copyright (c) 2018 Kazuhiko Arase
//
// URL: https://github.com/kazuhikoarase/comfortable-js/
//
// Licensed under the MIT license:
//  http://www.opensource.org/licenses/mit-license.php
//

namespace comfortable.i18n {

  'use strict';

  var $c = comfortable;

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
  }

  export var getInstance = function(lang : string) {
    lang = lang || navigator.language || navigator.userLanguage;
    var i18n : any = $c.i18n;
    return <I18N>($c.util.extend({}, i18n.en, i18n[lang] ||
        i18n[lang.replace(/\-\w+$/, '')] || {}) );
  };

  export var getMessages = function() : Messages {
    return $c.util.extend(
        this.getInstance('en').messages,
        this.getInstance().messages);
  };
}
