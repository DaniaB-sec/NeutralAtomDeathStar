/* ==========================================================================
   ui/r6panel.js — van der Waals Interaction Scaling Panel:
   Explicitly demonstrates V(R) ∝ 1/R⁶ physics:
   - Doubling distance R = 6 µm → R = 12 µm reduces V by factor of 64:
     V(2R) = V(R) / 64
   - Interactive slider for Q&A / professor inspection
   ========================================================================== */
(function (DS) {
  'use strict';

  function R6Panel(containerEl) {
    this.container = containerEl;
    this.rVal = 6.0; // µm
    this.visible = false;
    this.init();
  }

  R6Panel.prototype.init = function () {
    var p = DS.config.physics;
    var v6 = DS.rydberg.toMHz(DS.rydberg.V(6.0, p.C6));
    var v12 = DS.rydberg.toMHz(DS.rydberg.V(12.0, p.C6));
    var ratio = v6 / v12;

    this.container.innerHTML = [
      '<div class="r6-card">',
      '  <div class="r6-header">',
      '    <span class="r6-title">VAN DER WAALS RYDBERG INTERACTION SCALING</span>',
      '    <span class="r6-formula">V(R) = C₆ / R⁶</span>',
      '  </div>',
      '  <div class="r6-body">',
      '    <div class="r6-demo-row">',
      '      <div class="r6-bar-group">',
      '        <div class="r6-bar-label">R = 6.0 µm (Corridor Nearest Neighbors)</div>',
      '        <div class="r6-bar-track"><div class="r6-bar-fill" style="width: 100%;"></div></div>',
      '        <div class="r6-bar-val">V(6 µm) / 2π ≈ <span class="val-hi">' + v6.toFixed(2) + ' MHz</span>  [V ≫ Ω → STRONG BLOCKADE]</div>',
      '      </div>',
      '      <div class="r6-bar-group">',
      '        <div class="r6-bar-label">R = 12.0 µm (Next Corridor Waypoints, 2× Distance)</div>',
      '        <div class="r6-bar-track"><div class="r6-bar-fill val-lo-fill" style="width: ' + (100 / 64).toFixed(1) + '%;"></div></div>',
      '        <div class="r6-bar-val">V(12 µm) / 2π ≈ <span class="val-lo">' + v12.toFixed(3) + ' MHz</span>  [V(2R) = V(R)/64 ≈ V/64 → UNBLOCKED]</div>',
      '      </div>',
      '    </div>',
      '    <div class="r6-interactive">',
      '      <div class="r6-slider-header">',
      '        <span>INTERACTIVE DISTANCE PROBE: R = <strong id="r6-slider-val">6.0</strong> µm</span>',
      '        <span id="r6-slider-result">V/2π ≈ ' + v6.toFixed(2) + ' MHz</span>',
      '      </div>',
      '      <input type="range" id="r6-slider" min="4.5" max="16.0" step="0.1" value="6.0">',
      '      <div class="r6-slider-ticks">',
      '        <span>4.5 µm</span>',
      '        <span>6 µm (Nearest)</span>',
      '        <span>9.1 µm (R_b)</span>',
      '        <span>12 µm (2-Hop)</span>',
      '        <span>16 µm</span>',
      '      </div>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('');

    var slider = this.container.querySelector('#r6-slider');
    var valDisp = this.container.querySelector('#r6-slider-val');
    var resDisp = this.container.querySelector('#r6-slider-result');

    if (slider) {
      slider.addEventListener('input', function (e) {
        var r = parseFloat(e.target.value);
        valDisp.textContent = r.toFixed(1);
        var v = DS.rydberg.toMHz(DS.rydberg.V(r, p.C6));
        var rb = DS.rydberg.blockadeRadius(p.C6, p.omegaMax);
        var blocked = r < rb;
        resDisp.innerHTML = 'V/2π ≈ ' + (v >= 10 ? v.toFixed(1) : v.toFixed(3)) + ' MHz ' +
          (blocked ? '<span class="status-blocked">[BLOCKED]</span>' : '<span class="status-free">[INDEPENDENT]</span>');
      });
    }
  };

  R6Panel.prototype.setVisible = function (vis) {
    this.visible = vis;
    this.container.style.display = vis ? 'block' : 'none';
  };

  DS.ui = DS.ui || {};
  DS.ui.R6Panel = R6Panel;
})(typeof window !== 'undefined' ? (window.DS = window.DS || {}) : (globalThis.DS = globalThis.DS || {}));
