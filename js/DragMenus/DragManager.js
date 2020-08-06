/* globals document,Event,window */
'use strict';

import { DragDropTouch } from '../../lib/dragdroptouch.js';


const SingletonSymbol = Symbol('instance');

const shim_dispatch = function(e,type,target) {
  let related = null;
  if (e && target) {
      if (type == 'dragleave') {
        related = this._getTarget(e);
      }
      var evt = document.createEvent('Event'), t = e.touches ? e.touches[0] : e;
      evt.initEvent(type, true, true);
      evt.button = 0;
      evt.which = evt.buttons = 1;
      this._copyProps(evt, e, DragDropTouch._kbdProps);
      this._copyProps(evt, t, DragDropTouch._ptProps);
      if (evt.type === 'dragleave') {
        evt.relatedTarget = related;
      }
      evt.dataTransfer = this._dataTransfer;
      target.dispatchEvent(evt);
      return evt;
  }
  return false;
};

class ShadowDragDropTouch extends DragDropTouch {
  constructor(custom) {
    let temp_instance = DragDropTouch._instance;
    delete DragDropTouch._instance;
    super();
    DragDropTouch._instance = temp_instance;

    this._lastClick = 0;
    // enforce singleton pattern
    if (custom[SingletonSymbol]) {
        throw 'DragDropTouch instance already created.';
    }

    custom[SingletonSymbol] = this;

    // detect passive event support
    // https://github.com/Modernizr/Modernizr/issues/1894
    var supportsPassive = false;
    document.addEventListener('test', function () { }, {
        get passive() {
            supportsPassive = true;
            return true;
        }
    });
    // listen to touch events
    if ('ontouchstart' in document) {
        var d = document, ts = this._touchstart.bind(this), tm = this._touchmove.bind(this), te = this._touchend.bind(this), opt = supportsPassive ? { passive: false, capture: false } : false;
        custom.shadowRoot.addEventListener('touchstart', ts, opt);
        custom.shadowRoot.addEventListener('touchmove', tm, opt);
        custom.shadowRoot.addEventListener('touchend', te);
        custom.shadowRoot.addEventListener('touchcancel', te);
        this.root = custom;
    }
  }
  _getTarget(e) {
    var pt = this._getPoint(e), el = this.root.shadowRoot.elementFromPoint(pt.x, pt.y);
    while (el && getComputedStyle(el).pointerEvents == 'none') {
      el = el.parentElement;
    }
    return el;
  }

  _dispatchEvent(e,type,target) {
    if (e && target) {
      let new_ev = shim_dispatch.bind(this)(e,type,this.root);
      new_ev.shim = true;
      target.dispatchEvent(new_ev);
      return new_ev.defaultPrevented;
    }
    return false;
  }

  _destroyImage() {
    if (this._img) {
      this.root.shadowRoot.removeChild(this._img);
    }
    super._destroyImage();
  }

  _createImage(e) {
    super._createImage(e);
    let bb = this.root.getBoundingClientRect();
    this._imgOffset.x += bb.x;
    this._imgOffset.y += bb.y;
    this.root.shadowRoot.appendChild(this._img);
  }

}

const uuid =  function() {
  var uuid = '', i, random;
  for (i = 0; i < 32; i++) {
    random = Math.random() * 16 | 0;

    if (i == 8 || i == 12 || i == 16 || i == 20) {
      uuid += '-';
    }
    uuid += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16);
  }
  return uuid;
};

const global_drags = new Map();

const dragstart_event = function(e) {
  if ( ! e.isTrusted && ! e.shim ) {
    return;
  }

  let drag_id = 'drag/'+uuid();
  try {
    e.dataTransfer.setData(drag_id, '');
  } catch (err) {
    console.log('Couldnt set drag id, using global drag id');
    e.dataTransfer.setData('text',drag_id);
    window.global_drag = drag_id;
  }
  e.dataTransfer.effectAllowed = 'copy';
  e.dataTransfer.dropEffect = 'copy';

  let target = e.target;
  var event = new Event('dragstart',{bubbles: true});
  event.dataTransfer = { types: [ drag_id ] };
  event.data = { };
  this.drags.set(drag_id,event.data);
  target.dispatchEvent(event);
  e.stopPropagation();
};

const populate_event_data = function(e) {

  let drag_id = [...e.dataTransfer.types].filter( type => type.match(/^drag\/\d+/))[0] || window.global_drag;
  e.data = this.drags.get(drag_id);
};

const wire_global_drag_events = function(parent) {
  parent.addEventListener('dragstart',dragstart_event.bind(this),{capture:true});
  for(let event of ['dragenter','dragover','drop','dragleave']) {
    parent.addEventListener(event,populate_event_data.bind(this));
  }
};

class DragManager {
  get drags() {
    return global_drags;
  }
  constructor(parent) {
    wire_global_drag_events.call(this,parent);
  }
}
export { ShadowDragDropTouch };
export default DragManager;