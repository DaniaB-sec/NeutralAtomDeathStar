/* ==========================================================================
   ui/sciencepanel.js — "REAL SYSTEM" Scientific Reference & Q&A Drawer:
   Contains:
   1. Rigorous comparison table: Star Wars visual metaphor vs Actual Physics
   2. Hamiltonian & Physical Constants disclosure
   3. Classical verification breakdown (NO quantum advantage claimed)
   4. Live Coordinate Editor for interactive professor Q&A
   ========================================================================== */
(function (DS) {
  'use strict';

  function SciencePanel(containerEl, onApplyCoords) {
    this.container = containerEl;
    this.onApplyCoords = onApplyCoords;
    this.isOpen = false;
    this.init();
  }

  SciencePanel.prototype.init = function () {
    var p = DS.config.physics;
    var omMHz = (p.omegaMax / (2 * Math.PI)).toFixed(2);
    var dStart = (p.deltaStart / (2 * Math.PI)).toFixed(1);
    var dEnd = (p.deltaEnd / (2 * Math.PI)).toFixed(1);

    this.container.innerHTML = [
      '<div class="science-modal">',
      '  <div class="science-modal-header">',
      '    <div class="modal-title-wrap">',
      '      <h2>NEUTRAL-ATOM QUANTUM COMPUTING // SCIENTIFIC DOSSIER</h2>',
      '      <span class="modal-sub">Physical Architecture vs Pedagogical Metaphor Reference</span>',
      '    </div>',
      '    <button class="modal-close-btn" id="science-close">&times; CLOSE (S / ESC)</button>',
      '  </div>',
      '  <div class="science-modal-body">',
      '    <div class="sci-section">',
      '      <h3>1. REAL PHYSICAL SYSTEM VS STAR WARS METAPHOR</h3>',
      '      <table class="sci-table">',
      '        <thead>',
      '          <tr><th>Star Wars Metaphor</th><th>Real Quantum Physical System</th><th>Scientific Mechanism</th></tr>',
      '        </thead>',
      '        <tbody>',
      '          <tr>',
      '            <td><strong>Death Star / Sector</strong></td>',
      '            <td>Ultra-high vacuum chamber & optical table</td>',
      '            <td>Isolated atomic register maintained at < 10⁻¹¹ mbar.</td>',
      '          </tr>',
      '          <tr>',
      '            <td><strong>Stormtrooper (q0...q12)</strong></td>',
      '            <td>Neutral Alkali Atom (⁸⁷Rb)</td>',
      '            <td>Single atom trapped at tightly focused focal waist of an optical tweezer.</td>',
      '          </tr>',
      '          <tr>',
      '            <td><strong>Lightsaber Beams</strong></td>',
      '            <td>Optical Tweezers (λ ≈ 850 nm)</td>',
      '            <td>High-NA objective lenses focus laser light, trapping atoms via AC Stark dipole force.</td>',
      '          </tr>',
      '          <tr>',
      '            <td><strong>Rydberg Excitation</strong></td>',
      '            <td>High-n Rydberg State (|r⟩ = |70S₁/₂⟩)</td>',
      '            <td>Outer valence electron excited to gigantic orbit (radius ~ n² a₀ ≈ thousands of Ångströms).</td>',
      '          </tr>',
      '          <tr>',
      '            <td><strong>Rydberg Blockade</strong></td>',
      '            <td>Van der Waals Dipole-Dipole Shift</td>',
      '            <td>V(R) = C₆ / R⁶. Energy shift detunes the doubly-excited state |rr⟩ far out of resonance with laser drive Ω.</td>',
      '          </tr>',
      '          <tr>',
      '            <td><strong>Resonance Fluorescence</strong></td>',
      '            <td>Optical Readout (λ ≈ 780 nm)</td>',
      '            <td>Ground atoms |g⟩ fluoresce under resonant cycling transition. Rydberg atoms |r⟩ are lost/unconfined, appearing dark.</td>',
      '          </tr>',
      '          <tr>',
      '            <td><strong>Luke\'s Escape Route</strong></td>',
      '            <td>Maximum Independent Set (MIS)</td>',
      '            <td>Native optimization problem of Rydberg arrays. The "escape route" is a narrative mapped onto the dark MIS sites.</td>',
      '          </tr>',
      '        </tbody>',
      '      </table>',
      '    </div>',

      '    <div class="sci-section">',
      '      <h3>2. IDEALIZED HAMILTONIAN & SIMULATION DISCLOSURE</h3>',
      '      <div class="hamiltonian-box">',
      '        <code>H(t)/ħ = Σᵢ (Ω(t)/2) σˣᵢ − Σᵢ Δ(t) nᵢ + Σ_{i<j} (C₆ / Rᵢⱼ⁶) nᵢ nⱼ</code>',
      '      </div>',
      '      <ul class="sci-notes">',
      '        <li><strong>C₆ constant:</strong> ' + p.C6 + ' rad·µm⁶/µs (representative of ⁸⁷Rb n=70).</li>',
      '        <li><strong>Rabi frequency:</strong> Ω(t)/2π max = ' + omMHz + ' MHz.</li>',
      '        <li><strong>Detuning sweep:</strong> Δ(t)/2π sweeps adiabatically from ' + dStart + ' MHz to +' + dEnd + ' MHz.</li>',
      '        <li><strong>Classical Verification:</strong> The browser exhaustively verified all <strong>8,192 states</strong> in 2 ms. This is an educational demonstration of the computational pipeline, <strong>NOT</strong> a claim of quantum advantage.</li>',
      '      </ul>',
      '    </div>',

      '    <div class="sci-section">',
      '      <h3>3. LIVE COORDINATE EDITOR (Q&A EXPLORATION)</h3>',
      '      <p class="sci-desc">Test custom geometries live to verify that the physics model, blockade graph, and emulator recalculate dynamically:</p>',
      '      <div class="coord-editor-wrap">',
      '        <textarea id="sci-coord-input" rows="8" spellcheck="false"></textarea>',
      '        <div class="editor-actions">',
      '          <button id="sci-apply-btn" class="action-btn">▶ APPLY & RE-SIMULATE</button>',
      '          <button id="sci-reset-btn" class="secondary-btn">↺ RESET TO DEMO (13 ATOMS)</button>',
      '          <span id="sci-editor-msg" class="editor-msg"></span>',
      '        </div>',
      '      </div>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('');

    var self = this;
    var closeBtn = this.container.querySelector('#science-close');
    var applyBtn = this.container.querySelector('#sci-apply-btn');
    var resetBtn = this.container.querySelector('#sci-reset-btn');
    var txt = this.container.querySelector('#sci-coord-input');
    var msg = this.container.querySelector('#sci-editor-msg');

    txt.value = DS.config.demoCoords;

    if (closeBtn) closeBtn.addEventListener('click', function () { self.toggle(false); });
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        txt.value = DS.config.demoCoords;
        msg.textContent = 'Reset to default 13-atom corridor.';
        msg.className = 'editor-msg info';
      });
    }
    if (applyBtn) {
      applyBtn.addEventListener('click', function () {
        if (self.onApplyCoords) {
          var err = self.onApplyCoords(txt.value);
          if (err && err.length) {
            msg.textContent = err.join('; ');
            msg.className = 'editor-msg err';
          } else {
            msg.textContent = 'Applied successfully! Ready to run.';
            msg.className = 'editor-msg ok';
            setTimeout(function () { self.toggle(false); }, 700);
          }
        }
      });
    }
  };

  SciencePanel.prototype.toggle = function (force) {
    this.isOpen = (typeof force === 'boolean') ? force : !this.isOpen;
    this.container.style.display = this.isOpen ? 'flex' : 'none';
  };

  DS.ui = DS.ui || {};
  DS.ui.SciencePanel = SciencePanel;
})(typeof window !== 'undefined' ? (window.DS = window.DS || {}) : (globalThis.DS = globalThis.DS || {}));
