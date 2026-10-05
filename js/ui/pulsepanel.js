/* ==========================================================================
   ui/pulsepanel.js — Quantum pulse sequence visualization:
   Plots Ω(t) (Rabi drive) and Δ(t) (Detuning sweep) with an animated
   playhead scrubber during the quantum evolution phase.
   ========================================================================== */
(function (DS) {
  'use strict';

  function PulsePanel(containerEl) {
    this.container = containerEl;
    this.canvas = document.createElement('canvas');
    this.canvas.width = 460;
    this.canvas.height = 140;
    this.ctx = this.canvas.getContext('2d');
    this.playheadT = 0; // Current time in µs
    this.visible = false;
    this.init();
  }

  PulsePanel.prototype.init = function () {
    this.container.innerHTML = [
      '<div class="pulse-header">',
      '  <span class="pulse-title">COHERENT PULSE SEQUENCE [Ω(t), Δ(t)]</span>',
      '  <span class="pulse-time" id="pulse-clock">t = 0.00 µs</span>',
      '</div>'
    ].join('');
    this.container.appendChild(this.canvas);
    this.clockEl = this.container.querySelector('#pulse-clock');
    this.draw(0);
  };

  PulsePanel.prototype.setVisible = function (vis) {
    this.visible = vis;
    this.container.style.display = vis ? 'block' : 'none';
  };

  PulsePanel.prototype.draw = function (t_us) {
    this.playheadT = t_us;
    var ctx = this.ctx;
    var w = this.canvas.width;
    var h = this.canvas.height;
    var p = DS.config.physics;
    var pulse = DS.emulator.makePulse(p);
    var T = pulse.T;

    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#050c14';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = '#102236';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 20); ctx.lineTo(w - 20, 20);
    ctx.moveTo(40, 70); ctx.lineTo(w - 20, 70); // zero detuning line
    ctx.moveTo(40, 120); ctx.lineTo(w - 20, 120);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#658ea9';
    ctx.font = '10px ui-monospace, Consolas, monospace';
    ctx.textAlign = 'right';
    ctx.fillText('+2 MHz', 36, 24);
    ctx.fillText('0 MHz', 36, 74);
    ctx.fillText('-3 MHz', 36, 124);

    var plotW = w - 60;
    var originX = 40;

    // Draw Δ(t) Detuning curve (amber line)
    ctx.strokeStyle = '#ffb347';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (var i = 0; i <= 100; i++) {
      var ti = (i / 100) * T;
      var dMHz = pulse.delta(ti) / (2 * Math.PI); // from -3 to +2
      var xi = originX + (ti / T) * plotW;
      // map [-3, +2] to [120, 20]
      var yi = 120 - ((dMHz + 3) / 5) * 100;
      if (i === 0) ctx.moveTo(xi, yi);
      else ctx.lineTo(xi, yi);
    }
    ctx.stroke();

    // Draw Ω(t) Rabi frequency curve (violet line)
    ctx.strokeStyle = '#df70ff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (var j = 0; j <= 100; j++) {
      var tj = (j / 100) * T;
      var oMHz = pulse.omega(tj) / (2 * Math.PI); // 0 to 1.5 MHz
      var xj = originX + (tj / T) * plotW;
      // map [0, 1.5] to [70, 20]
      var yj = 70 - (oMHz / 1.5) * 50;
      if (j === 0) ctx.moveTo(xj, yj);
      else ctx.lineTo(xj, yj);
    }
    ctx.stroke();

    // Playhead Scrubber
    var curFrac = Math.min(1, Math.max(0, t_us / T));
    var playX = originX + curFrac * plotW;

    ctx.strokeStyle = '#5dffa8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playX, 10);
    ctx.lineTo(playX, 130);
    ctx.stroke();

    // Playhead marker dot
    ctx.fillStyle = '#5dffa8';
    ctx.beginPath();
    ctx.arc(playX, 12, 4, 0, Math.PI * 2);
    ctx.fill();

    // Update digital clock
    if (this.clockEl) {
      this.clockEl.textContent = 't = ' + t_us.toFixed(2) + ' µs / ' + T.toFixed(1) + ' µs';
    }

    // Legend
    ctx.textAlign = 'left';
    ctx.font = '10px ui-monospace, Consolas, monospace';
    ctx.fillStyle = '#df70ff';
    ctx.fillText('Ω(t) Rabi Drive (max 1.5 MHz)', 50, 134);
    ctx.fillStyle = '#ffb347';
    ctx.fillText('Δ(t) Detuning Sweep (-3 → +2 MHz)', 230, 134);
  };

  DS.ui = DS.ui || {};
  DS.ui.PulsePanel = PulsePanel;
})(typeof window !== 'undefined' ? (window.DS = window.DS || {}) : (globalThis.DS = globalThis.DS || {}));
