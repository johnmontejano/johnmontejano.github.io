/* Progressive enhancement: all illustrative workflows are readable without JS. */
(function () {
  'use strict';
  var choices = document.querySelector('.workflow__choices');
  var examples = [].slice.call(document.querySelectorAll('[data-workflow]'));
  if (!choices || !examples.length) return;
  var buttons = [].slice.call(choices.querySelectorAll('[data-example]'));
  function select(name) {
    examples.forEach(function (panel) { panel.hidden = panel.dataset.workflow !== name; });
    buttons.forEach(function (button) { button.setAttribute('aria-pressed', String(button.dataset.example === name)); });
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  }
  buttons.forEach(function (button) { button.addEventListener('click', function () { select(button.dataset.example); }); });
  select('enquiry');
  choices.hidden = false;
})();
