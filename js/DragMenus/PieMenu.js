/* globals document,HTMLElement,customElements,window,ShadyCSS */
'use strict';

import * as debug from 'debug-any-level';

const module_string='glycanjs:piemenu';

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

  </style>
  <style id="angles">
  </style>
  <svg id="sectorsvg" width="0" height="0">
  <defs>
  <clipPath id="sectorWeight1" clipPathUnits="objectBoundingBox">
    <path fill="none" stroke="#111" stroke-width="0.01" d="M0.5,0.5 m0.2,0 l0.3,0 A0.5,0.5 0 0,0 0.75,0.06699 L0.6,0.326 A0.5,0.5 0 0,1 0.7,0.5 z"></path>
  </clipPath>
  </defs>
  </svg>
  <slot id="items"></slot>
`;

const str = (num) => num.toFixed(PRECISION);
const ang = (num) => num.toFixed(3);


const upgrade_elements = function(slot) {
  let items = slot.assignedNodes();
  let transition_delay = 0;
  let max_time = 0.3;
  let angle = 0;
  let all_styles = [];
  let all_items = items.filter( item => item instanceof HTMLElement );
  let start_angle = -60;
  let end_angle = 60;

  let actual_style = window.getComputedStyle(this);

  start_angle = parseInt(actual_style.getPropertyValue('--start-angle'));
  end_angle = parseInt(actual_style.getPropertyValue('--end-angle'));

  let all_weights = all_items.map( item => parseInt(item.getAttribute('weight') || '1') );
  let sum_weights = all_weights.reduce((acc, val) => acc + val,0);
  let base_delta = (end_angle - start_angle) / sum_weights;
  angle = start_angle;
  let delta = base_delta;
  const notch = parseFloat(actual_style.getPropertyValue('--notch-ratio'));
  this.sectorpath.parentNode.setAttribute('id','sectors'+all_items.length);
  if (items.length > 0) {
    this.sectorpath.setAttribute('d',`M0.5,0.5 m${notch},0 l${0.5-notch},0 A0.5,0.5 0 0,0 ${ang(0.5+0.5*Math.cos(Math.PI/180*delta))},${ang(0.5-0.5*Math.sin(Math.PI/180*delta))} L${ang(0.5+(notch)*Math.cos(Math.PI/180*delta))},${ang(0.5-(notch)*Math.sin(Math.PI/180*delta))} A0.5,0.5 0 0,1 ${0.5+notch},0.5 z`);
  }

  const icon_min_ratio = parseFloat(actual_style.getPropertyValue('--icon-position-ratio'));

  for(let item of all_items.reverse()) {
    delta = base_delta * parseInt(item.getAttribute('weight') || '1');
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
    transition_delay+= 0.1;
    max_time -= 0.1;
    let classname = `rot${str(angle)}`;
    classname = classname.replace(/[-\.]/g,'x');
    item.setAttribute('class',classname);

    let basic_styles = `:host([active]) ::slotted(.${classname}) { transform: rotate(${str(-1*angle)}deg) !important; }`;
    basic_styles = `x-piemenu[active] .${classname} { transform: rotate(${str(-1*angle)}deg) !important; }`;

    all_styles.push(basic_styles);
    angle += delta;
  }
  this.hoverstyles.innerHTML = all_styles.join('\n');
  // let temp_template = document.createElement('template');
  // temp_template.innerHTML = '<style type="text/css">'+all_styles.join('\n')+'</style>';
  // ShadyCSS.prepareTemplate(temp_template,'x-piemenu');
  // this.hoverstyles.innerHTML = temp_template.content.cloneNode(true).textContent;
};

function WrapHTML() { return Reflect.construct(HTMLElement, [], Object.getPrototypeOf(this).constructor); }
Object.setPrototypeOf(WrapHTML.prototype, HTMLElement.prototype);
Object.setPrototypeOf(WrapHTML, HTMLElement);

ShadyCSS.prepareTemplate(tmpl,'x-piemenu');

class PieMenu extends WrapHTML {
  constructor() {
    super();
    log('Initiating custom PieMenu element');

    let shadowRoot = this.attachShadow({mode: 'open'});
    shadowRoot.appendChild(tmpl.content.cloneNode(true));
    ShadyCSS.styleElement(this);
  }

  connectedCallback() {
    this.hoverstyles = this.shadowRoot.getElementById('angles');
    if (! this.hoverstyles) {
      this.hoverstyles = document.createElement('style');
      this.parentNode.appendChild(this.hoverstyles);
      this.hoverstyles.setAttribute('type','text/css');
      console.log(this.hoverstyles);
    }

    let sectorsvg = this.shadowRoot.getElementById('sectorsvg');
    let targetsector = this.parentNode.appendChild(this.parentNode.ownerDocument.importNode(sectorsvg,true));
    this.sectorpath = targetsector.firstElementChild.firstElementChild.firstElementChild;

    let slot = this.shadowRoot.getElementById('items');
    upgrade_elements.bind(this)(slot);

    this.style.setProperty('--sectorid','url(#'+this.sectorpath.parentNode.getAttribute('id')+')');

    slot.addEventListener('slotchange', upgrade_elements.bind(this,slot));
    slot.addEventListener('slotchange', () => {
      this.style.setProperty('--sectorid','url(#'+this.sectorpath.parentNode.getAttribute('id')+')');
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

customElements.define('x-piemenu',PieMenu);

export default PieMenu;
