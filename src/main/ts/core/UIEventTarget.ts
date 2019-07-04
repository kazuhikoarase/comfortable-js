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

/// <reference path="EventTarget.ts" />

namespace comfortable {

  export interface UIEventTarget extends EventTarget {
    invalidate : () => void;
    render : () => void;
  }

  /**
   * @internal
   */
  export class UIEventTargetImpl
  extends EventTargetImpl implements UIEventTarget {
    public valid = true;
    public invalidate() {
      this.valid = false;
      util.callLater(function() {
        if (!this.valid) {
          this.valid = true;
          this.render();
        }
      }.bind(this) );
    }
    public render() {
    }
  }

}
