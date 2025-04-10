/* globals HTMLLabelElement,HTMLInputElement,Event,MouseEvent,window */
'use strict';

const timeout_symbol = Symbol('menu_timeout');
const last_selected_symbol = Symbol('last_selected');

const wire_form_startdrag = (form) => {
  form.addEventListener('dragstart', evt => {
    if (evt.__target) {
      evt.__target.click();
    } else {
      evt.target.click();
    }
    evt.stopPropagation();
  },{capture: false});
  form.addEventListener('drag', evt => {
    if (evt.__target) {
      evt.__target.click();
    } else {
      evt.target.click();
    }
  });
};

const wire_form_enddrag = (form) => {
  form.addEventListener('dragend', () => {
    form.reset();
  });
};

const clear_menus = (form) => {
  form[last_selected_symbol] = null;
  if (form[timeout_symbol]) {
    clearTimeout(form[timeout_symbol]);
  }
  let menus = form.querySelectorAll('ccg-piemenu');
  for (let menu of menus) {
    menu.removeAttribute('active');
  }
};

const wire_form_reset = (form) => {
  form.addEventListener('finished', (evt) => {
    evt.preventDefault();
    return false;
  });

  form.addEventListener('reset', () => {
    clear_menus(form);
  });
};

const wire_menu_events = (piemenu) => {
  piemenu.form[last_selected_symbol] = null;
  piemenu.addEventListener('dragenter', (ev) => {

      let targ = ev.target;
      if ( ! (targ instanceof HTMLLabelElement) ) {
        return;
      }
      if (targ === piemenu.form[last_selected_symbol]) {
        return;
      }
      piemenu.form[last_selected_symbol] = targ;

      let nextmenu = piemenu.getRootNode().getElementById(piemenu.getAttribute('data-next'));

      for (let sib of targ.parentNode.children) {
        if (sib !== targ) {
          sib.classList.remove('dragover');
          sib.classList.remove('hover');
        } else {
          sib.classList.add('hover');
          if (nextmenu) {
            sib.classList.add('dragover');
          }
        }
      }

      if (piemenu.form[timeout_symbol]) {
        // Also clear this out for a dragend or a dragleave
        clearTimeout(piemenu.form[timeout_symbol]);
      }


      if (! nextmenu ) {
        return;
      }

      piemenu.form[timeout_symbol] = setTimeout( () => {
        if ( ! piemenu.form[last_selected_symbol] ) {
          return;
        }


        var event = new MouseEvent('click',{bubbles: true, clientX: ev.clientX, clientY: ev.clientY-window.scrollY, screenX: ev.screenX, screenY: ev.screenY });

        piemenu.form[last_selected_symbol].control.dispatchEvent(event);

        piemenu.form[last_selected_symbol] = null;
      },700);
    });
    piemenu.addEventListener('click', (ev) => {
      let targ = ev.target;
      if ( ! (targ instanceof HTMLInputElement) ) {
        return;
      }

      targ.checked = true;
      if ( ! ev.isTrusted ) {
        ev.preventDefault();
      }

      clearTimeout(piemenu.form[timeout_symbol]);
      // let sizing = piemenu.getBoundingClientRect();
      setTimeout( () => {
        piemenu.removeAttribute('active');
      },100);
      let nextmenu = piemenu.getRootNode().getElementById(piemenu.getAttribute('data-next'));
      if (! nextmenu ) {
        var event = new Event('finished',{bubbles: true});
        piemenu.form.dispatchEvent(event);
        return;
      }
      // let vp_zoom = 1/parseFloat((window.innerWidth / document.documentElement.clientWidth).toFixed(2));
      // // console.log(ev.pageX,ev.pageY,ev.clientX,ev.clientY,vp_zoom);
      // let left_pos = Math.round(ev.pageX)-0.5*sizing.width;
      // let top_pos = Math.round(ev.pageY)-0.5*sizing.height;
      // let zoom = 1;
      // nextmenu.style.transformOrigin = `${left_pos}px ${top_pos}px`;
      nextmenu.style.transform = piemenu.style.transform; //((!ev.isTrusted) || (vp_zoom > 1)) ? piemenu.style.transform : `scale(${zoom}) translate(${left_pos}px,${top_pos}px)`;
      piemenu.form[timeout_symbol] = setTimeout( () => {
        nextmenu.setAttribute('active',null);
      },100);
      nextmenu.clear();
    },{capture: false});

    piemenu.addEventListener('drop', (ev) => {
      let targ = ev.target;
      if ( ! (targ instanceof HTMLLabelElement) ) {
        return;
      }

      var event = new MouseEvent('click',{bubbles: true, clientX: ev.clientX, clientY: ev.clientY, screenX: ev.screenX, screenY: ev.screenY });

      piemenu.form[last_selected_symbol].control.dispatchEvent(event);
    });

    piemenu.addEventListener('dragover', (ev) => {
      ev.preventDefault();
      let targ = ev.target;
      if ( ! (targ instanceof HTMLLabelElement) ) {
        return;
      }
      for (let sib of targ.parentNode.children) {
        if (sib !== targ) {
          sib.classList.remove('hover');
        } else {
          sib.classList.add('hover');
        }
      }
    });
    piemenu.addEventListener('dragleave', (ev) => {
      if (ev.relatedTarget !== piemenu) {
        return;
      }
      piemenu.form[last_selected_symbol] = null;
      piemenu.removeAttribute('active');
      piemenu.clear();
    });
};

const upgrade_piemenus = (form) => {
  let menus = form.querySelectorAll('ccg-piemenu');
  for (let menu of menus) {
    menu.form = form;
    wire_menu_events(menu);
  }
};

const wire_events_form = (form) => {
  wire_form_startdrag(form);
  wire_form_enddrag(form);
  wire_form_reset(form);
};

class DraggableForm {
  constructor(form) {
    wire_events_form(form);
    upgrade_piemenus(form);
    form.clear = () => {
      clear_menus(form);
    };
    Object.defineProperty(form, 'active_center', {
      get: () => {
        let actives = form.querySelector('ccg-piemenu[active]');
        if ( ! actives ) {
          return;
        }
        let rect = actives.getBoundingClientRect();
        return { left: rect.left + 0.5*rect.width, top: rect.top + 0.5*rect.height, r: 0.5*rect.width };
      }
    });
  }
}

export default DraggableForm;