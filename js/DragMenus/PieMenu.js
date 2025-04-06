/* globals document,HTMLElement,customElements,window,ShadyCSS,MutationObserver */
'use strict';

import * as debug from 'debug-any-level';

const ELEMENT_NAME = 'ccg-piemenu';

const module_string='glycanjs:piemenu';

import { generate_clip_path } from './clipsectors.js';

const log = debug(module_string);

const PRECISION = 1;

const tmpl = document.createElement('template');

tmpl.innerHTML = `
  <style>
    :host {
      padding: 0;
      display: block;
      position: relative;
      filter: drop-shadow(0px 5px 5px rgba(0,0,0,0.5));
      transform: scale(0.99);
      --start-angle: -60;
      --end-angle: 60;
      --notch-ratio: 0.075;
      --icon-position-ratio: 0.2;
      --icon-size: 10px;
      --sectorid: url(#sectorWeight1);
    }
    :host([active]) {
      transform: scale(1);
    }

    :host ::slotted(*) {
      background: #eee;
      border: 0;
      color: black;
      position: absolute;
      top: 0;
      left: 0;
      transform: scale(0.001);
      width: 100%;
      height: 100%;
      -webkit-clip-path: var(--sectorid);
      clip-path: var(--sectorid);
    }

    :host ::slotted(*[data-disabled]) {
      display: none;
    }

  </style>
  <style id="angles">
  </style>
  <slot id="items"></slot>
`;

const str = (num) => num.toFixed(PRECISION);
const ang = (num) => num.toFixed(3);

const wire_attribute_watcher = (label,action) => {
  let config = { attributes: true, subtree: true,attributeFilter: ['disabled','data-weight'] };

  // Callback function to execute when mutations are observed
  let callback = function(mutationsList) {
      for(let mutation of mutationsList) {
        if (mutation.target === label) {
          return;
        }
        if (mutation.type == 'attributes') {
          clearTimeout(wire_attribute_watcher.timeouts.get(label.parentNode));
          if (label.querySelector('input[disabled]')) {
            label.setAttribute('data-disabled','');
          } else {
            label.removeAttribute('data-disabled');
          }
          if (label.querySelector('input[data-weight]')) {
            label.setAttribute('data-weight',label.querySelector('input[data-weight]').getAttribute('data-weight'));
            label.style.setProperty('--weight', label.querySelector('input[data-weight]').getAttribute('data-weight'));
          } else {
            label.removeAttribute('data-weight');
            label.style.setProperty('--weight', null);
          }
          let timeout = setTimeout(action,0);
          wire_attribute_watcher.timeouts.set(label.parentNode,timeout);
        }
      }
  };

  wire_attribute_watcher.timeouts = new WeakMap();

  let observer = new MutationObserver(callback);

  observer.observe(label, config);

  // Later, you can stop observing
  // observer.disconnect();
};


const upgrade_elements = function(slot) {
  let items = slot.assignedNodes();
  let transition_delay = 0;
  let max_time = 0.3;
  let angle = 0;
  let all_styles = [];
  let all_items = items.filter( item => item instanceof HTMLElement )
                       .filter( item => item.querySelector('input:not([disabled])') );
  let start_angle = -60;
  let end_angle = 60;

  let actual_style = window.getComputedStyle(this);

  start_angle = parseInt(actual_style.getPropertyValue('--start-angle'));
  end_angle = parseInt(actual_style.getPropertyValue('--end-angle'));

  let all_weights = all_items.map( item => Math.abs(parseInt(item.getAttribute('data-weight') || '1')) );
  let sum_weights = all_weights.reduce((acc, val) => acc + val,0);
  let base_delta = (end_angle - start_angle) / sum_weights;
  angle = start_angle;
  let delta = base_delta;
  let notch = parseFloat(actual_style.getPropertyValue('--notch-ratio')||'0');

  const icon_min_ratio = parseFloat(actual_style.getPropertyValue('--icon-position-ratio'));

  let redo_upgrade = () => {
    upgrade_elements.bind(this)(slot);
  };

  for(let item of all_items.reverse()) {
    let item_weight = Math.abs(parseInt(item.getAttribute('data-weight') || '1'));
    delta = base_delta * item_weight;
    let icon_min = icon_min_ratio;
    let icon_max = 0.5;

    let icon_x_offset = str(50+(100*Math.cos((Math.PI/180)*delta*0.5)*(icon_max - icon_min)));
    let icon_y_offset = str(50+(100*Math.sin((Math.PI/180)*delta*0.5)*(icon_max - icon_min)));

    let icon_width = parseInt(actual_style.getPropertyValue('--icon-size').replace('px',''));

    if (item.firstChild && item.firstChild.setAttribute) {
      item.firstChild.style.bottom = `calc(${icon_y_offset}% - ${icon_width/2}px)`;
      item.firstChild.style.left = `calc(${icon_x_offset}% - ${icon_width/2}px)`;
      item.firstChild.style.position  ='absolute';
      item.firstChild.style.transform = `rotate(${str(angle)}deg)`;
      item.firstChild.style.pointerEvents = 'none';
      item.firstChild.style.display = 'table-cell';
      item.firstChild.style.verticalAlign = 'middle';
      item.firstChild.style.textAlign = 'center';
      item.firstChild.style.width = `${icon_width}px`;
      item.firstChild.style.height = `${icon_width}px`;
    }
    if (! item.style) {
      continue;
    }
    item.style.transitionDelay = `${str(transition_delay)}s`;
    item.style.transition = `transform ${str(max_time)}s`;
    item.style.transform = 'scale(0.001)';
    if (item.hasAttribute('data-weight')) {
      item.style.setProperty('--sectorid', generate_clip_path(notch,1,item_weight,sum_weights,start_angle,end_angle));
    } else {
      item.style.setProperty('--sectorid', generate_clip_path(notch,1,item_weight,sum_weights,start_angle,end_angle));
    }
    item.style.setProperty('--slice-background-rotate-angle',`${str(90-Math.abs(angle))}deg`);
    transition_delay+= 0.1;
    max_time -= 0.1;
    let classname = `rot${str(angle)}`;
    classname = classname.replace(/[-\.]/g,'x');
    item.setAttribute('class',classname);

    let basic_styles = window.ShadyCSS ? `${ELEMENT_NAME}[active] .${classname} { transform: rotate(${str(-1*angle)}deg) !important; }` : `:host([active]) ::slotted(.${classname}) { transform: rotate(${str(-1*angle)}deg) !important; }`;

    all_styles.push(basic_styles);
    angle += delta;
    if ( ! item.wired ) {
      wire_attribute_watcher(item, redo_upgrade);
    }
    item.wired = true;
  }
  this.hoverstyles.innerHTML = all_styles.join('\n');
  // let temp_template = document.createElement('template');
  // temp_template.innerHTML = '<style type="text/css">'+all_styles.join('\n')+'</style>';
  // ShadyCSS.prepareTemplate(temp_template,ELEMENT_NAME);
  // this.hoverstyles.innerHTML = temp_template.content.cloneNode(true).textContent;
};


function WrapHTML() { return Reflect.construct(HTMLElement, [], Object.getPrototypeOf(this).constructor); }
Object.setPrototypeOf(WrapHTML.prototype, HTMLElement.prototype);
Object.setPrototypeOf(WrapHTML, HTMLElement);
if (window.ShadyCSS) {
  ShadyCSS.prepareTemplate(tmpl,ELEMENT_NAME);
}

class PieMenu extends WrapHTML {
  constructor() {
    super();
    log('Initiating custom PieMenu element');
    if (window.ShadyCSS) {
      ShadyCSS.styleElement(this);
    }
  }

  connectedCallback() {
    this.attachShadow({mode: 'open'});
    this.shadowRoot.appendChild(tmpl.content.cloneNode(true));

    this.hoverstyles = this.shadowRoot.getElementById('angles');

    if (! this.hoverstyles) {
      this.hoverstyles = document.createElement('style');
      this.shadowRoot.appendChild(this.hoverstyles);
      this.hoverstyles.setAttribute('type','text/css');
    }

    let slot = this.shadowRoot.getElementById('items');
    upgrade_elements.bind(this)(slot);

    this.style.setProperty('--sectorid',generate_clip_path(0,1,1,1,0,90));

    slot.addEventListener('slotchange', upgrade_elements.bind(this,slot));
    slot.addEventListener('slotchange', () => {
      this.style.setProperty('--sectorid',generate_clip_path(0,1,1,1,0,90));
    });

  }

  clear() {
    for (let kid of this.children) {
      kid.classList.remove('hover');
    }
    Array.from( this.querySelectorAll('input:checked'), input => input.checked = false );
  }
}

PieMenu.ChainForm = function(form) {
  Object.getOwnPropertyNames(form.elements).filter( name => ! name.match(/[0-9]+/) );
};

customElements.define(ELEMENT_NAME,PieMenu);

export default PieMenu;
