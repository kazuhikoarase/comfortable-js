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

  export interface Event {
    type : string;
    preventDefault : () => void;
    defaultPrevented : boolean;
    target? : any;
    currentTarget? : any;
    which? : number;
    pageX? : number;
    pageY? : number;
  }

  export type EventListener = (event : Event, detail? : any) => void;

  export interface EventTarget {
    trigger : (type : string, detail? : any) => EventTarget;
    on : (type : string, listener : EventListener) => EventTarget;
    off : (type : string, listener : EventListener) => EventTarget;
  }

  /**
   * @internal
   */
  export class EventTargetImpl implements EventTarget {
    private map : { [ type : string ] : EventListener[] } = {};
    private listeners(type : string) : EventListener[] {
       return this.map[type] || (this.map[type] = []);
    }
    public trigger(type : string, detail? : any) {
      var ctx = this;
      var event = new EventImpl(type);
      this.listeners(type).forEach(function(listener : EventListener) {
        listener.call(ctx, event, detail);
      });
      return this;
    }
    public on(type : string, listener : EventListener) {
      this.listeners(type).push(listener);
      return this;
    }
    public off(type : string, listener : EventListener) {
      this.map[type] = this.listeners(type).filter(function(l : EventListener) {
        return listener != l;
      });
      return this;
    }
  }

  class EventImpl implements Event {
    public type : string;
    public defaultPrevented = false;
    constructor(type : string) {
      this.type = type;
    }
    public preventDefault() {
      this.defaultPrevented = true;
    }
  }

}
