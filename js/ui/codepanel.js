/* ==========================================================================
   ui/codepanel.js — Python code display panel:
   Shows representative Pulser/Bloqade-style code with line highlighting
   linked directly to atom loading and tweezer addressing.
   ========================================================================== */
(function (DS) {
  'use strict';

  function CodePanel(containerEl) {
    this.container = containerEl;
    this.lines = [];
    this.activeLine = -1;
    this.init();
  }

  CodePanel.prototype.init = function () {
    var raw = DS.config.demoCoords;
    var codeLines = [
      '# --- DEATH STAR QUANTUM REGISTER ---',
      'from pulser import Register, Pulse',
      'from pulser.devices import MockDevice',
      ''
    ];
    codeLines = codeLines.concat(raw.split('\n'));
    codeLines.push('');
    codeLines.push('# Define Rydberg adiabatic pulse');
    codeLines.push('omega_max = 2 * np.pi * 1.5  # MHz');
    codeLines.push('delta_sweep = (-3.0, +2.0)  # MHz');
    codeLines.push('pulse = Pulse.ConstantDetuning(omega_max, ...)');
    codeLines.push('');
    codeLines.push('# Execute on neutral-atom QPU');
    codeLines.push('reg = Register(coords)');
    codeLines.push('sim = QPU.run(reg, pulse)');
    codeLines.push('result = sim.sample(shots=100)');

    this.rawLines = codeLines;
    this.render();
  };

  CodePanel.prototype.render = function () {
    var html = [
      '<div class="code-header">',
      '  <span class="code-title">PROGRAMMING REPRESENTATION</span>',
      '  <span class="code-sub">Python / Pulser-style</span>',
      '</div>',
      '<div class="code-body">'
    ];

    for (var i = 0; i < this.rawLines.length; i++) {
      var line = this.rawLines[i];
      var cls = 'code-line';
      if (i === this.activeLine) cls += ' active-line';

      // Clean syntax highlighting (keywords and strings first, comments last)
      var comment = '';
      var codePart = line;
      var cIdx = line.indexOf('#');
      if (cIdx >= 0) {
        comment = '<span class="c-comment">' + line.slice(cIdx).replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</span>';
        codePart = line.slice(0, cIdx);
      }

      var formatted = codePart
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/("[^"]*")/g, '<span class="c-str">$1</span>')
        .replace(/\b(from|import|def|return)\b/g, '<span class="c-kw">$1</span>')
        .replace(/\b(\d+\.?\d*)\b/g, '<span class="c-num">$1</span>');

      formatted = formatted + comment;

      html.push('<div class="' + cls + '" data-line="' + i + '"><span class="ln">' + (i + 1) + '</span><span class="code-text">' + formatted + '</span></div>');
    }

    html.push('</div>');
    this.container.innerHTML = html.join('');
  };

  CodePanel.prototype.highlightLine = function (lineIdx) {
    if (this.activeLine === lineIdx) return;
    this.activeLine = lineIdx;
    var all = this.container.querySelectorAll('.code-line');
    for (var i = 0; i < all.length; i++) {
      if (i === lineIdx) {
        all[i].classList.add('active-line');
        all[i].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else {
        all[i].classList.remove('active-line');
      }
    }
  };

  DS.ui = DS.ui || {};
  DS.ui.CodePanel = CodePanel;
})(typeof window !== 'undefined' ? (window.DS = window.DS || {}) : (globalThis.DS = globalThis.DS || {}));
