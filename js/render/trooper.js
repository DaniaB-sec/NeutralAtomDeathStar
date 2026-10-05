/* ==========================================================================
   render/trooper.js — Original vector Stormtrooper helmet representing
   individual neutral atoms trapped in optical tweezers.
   States:
     - GROUND |g>: Imperial white helmet, held in optical trap.
     - RYDBERG |r>: Enormous n~70 electron orbital cloud, vibrant violet glow.
     - BLOCKED: Hexagonal barrier deflecting excitation, detuning vibration.
     - FLUORESCING (Readout): Resonant optical scattering (bright spot).
     - LOST (Readout): Evaporated/lost Rydberg atom (dark vacant gap).
   ========================================================================== */
(function (DS) {
  'use strict';

  function drawHelmet(ctx, size, color, visorColor) {
    var s = size / 32; // base unit size ~32px

    ctx.save();
    ctx.scale(s, s);

    // 1. Helmet dome outer shape
    ctx.beginPath();
    ctx.moveTo(-14, 8);
    ctx.bezierCurveTo(-15, -4, -13, -16, 0, -17);
    ctx.bezierCurveTo(13, -16, 15, -4, 14, 8);
    ctx.bezierCurveTo(12, 14, 6, 16, 0, 16);
    ctx.bezierCurveTo(-6, 16, -12, 14, -14, 8);
    ctx.closePath();

    ctx.fillStyle = color || '#f0f4f8';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#1b2836';
    ctx.stroke();

    // 2. Black brow band
    ctx.beginPath();
    ctx.moveTo(-13, -5);
    ctx.bezierCurveTo(-6, -7, 6, -7, 13, -5);
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = '#0d151f';
    ctx.stroke();

    // 3. Dark visor lenses
    ctx.beginPath();
    ctx.moveTo(-11, -2);
    ctx.lineTo(-2, -3);
    ctx.lineTo(-2, 1);
    ctx.lineTo(-9, 2);
    ctx.closePath();

    ctx.moveTo(11, -2);
    ctx.lineTo(2, -3);
    ctx.lineTo(2, 1);
    ctx.lineTo(9, 2);
    ctx.closePath();

    ctx.fillStyle = visorColor || '#070b10';
    ctx.fill();

    // 4. Aerator canisters / cheek pods
    ctx.beginPath();
    ctx.arc(-8, 9, 2.5, 0, Math.PI * 2);
    ctx.arc(8, 9, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#1c2833';
    ctx.fill();

    // 5. Mouth vent grille
    ctx.beginPath();
    ctx.moveTo(-4, 7);
    ctx.lineTo(0, 12);
    ctx.lineTo(4, 7);
    ctx.closePath();
    ctx.fillStyle = '#2c3e50';
    ctx.fill();

    ctx.restore();
  }

  function Trooper(id, x_um, y_um) {
    this.id = id;
    this.x_um = x_um;
    this.y_um = y_um;
    this.currX_um = x_um;
    this.currY_um = y_um;

    this.state = 'ground';       // 'ground', 'trapped', 'rydberg', 'blocked', 'bright', 'dark'
    this.rydbergProb = 0;        // ⟨n_i⟩ from emulator [0, 1]
    this.tweezerAlpha = 0;       // Beam visibility [0, 1]
    this.blockadeAlpha = 0;      // Deflection shield visibility
    this.fluorescence = 0;       // Readout emission intensity
    this.shake = 0;              // Detuning jitter
    this.animPhase = Math.random() * Math.PI * 2;
  }

  Trooper.prototype.update = function (dt) {
    this.animPhase += dt * 3;
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 4);
  };

  /**
   * Render the Stormtrooper atom at its current screen position.
   */
  Trooper.prototype.draw = function (ctx, stage, time) {
    var pos = stage.toScreen(this.currX_um, this.currY_um);
    var x = pos.x;
    var y = pos.y;

    if (this.shake > 0) {
      x += (Math.random() - 0.5) * this.shake * 8;
      y += (Math.random() - 0.5) * this.shake * 8;
    }

    ctx.save();
    ctx.translate(x, y);

    // 1. Tweezer trap optical waist (circular focal spot on floor)
    if (this.tweezerAlpha > 0.05) {
      ctx.save();
      ctx.globalAlpha = this.tweezerAlpha * 0.7;
      var grad = ctx.createRadialGradient(0, 0, 4, 0, 0, 28);
      grad.addColorStop(0, 'rgba(80, 210, 255, 0.8)');
      grad.addColorStop(0.5, 'rgba(40, 140, 255, 0.3)');
      grad.addColorStop(1, 'rgba(20, 80, 200, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. Rydberg Excited State |r> (Pulsing electron cloud & aura)
    var rydbergLevel = Math.max(this.rydbergProb, this.state === 'rydberg' ? 1 : 0);
    if (rydbergLevel > 0.05) {
      ctx.save();
      var rydAlpha = rydbergLevel * (0.6 + 0.3 * Math.sin(this.animPhase * 2));
      ctx.globalAlpha = rydAlpha;

      // Outer Rydberg orbital aura (illustrates the gigantic Bohr radius ~ n^2 a_0)
      var rydGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 52);
      rydGrad.addColorStop(0, 'rgba(255, 100, 240, 0.9)');
      rydGrad.addColorStop(0.4, 'rgba(190, 50, 255, 0.6)');
      rydGrad.addColorStop(0.8, 'rgba(120, 20, 220, 0.2)');
      rydGrad.addColorStop(1, 'rgba(80, 0, 160, 0)');
      ctx.fillStyle = rydGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 52, 0, Math.PI * 2);
      ctx.fill();

      // Pulsing energy rings
      ctx.strokeStyle = 'rgba(255, 160, 250, ' + (0.5 * rydbergLevel) + ')';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      var ringR = 26 + 10 * Math.sin(this.animPhase * 3);
      ctx.arc(0, 0, ringR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }

    // 3. Blockade Deflection Shield (when atom excitation is suppressed by neighbor)
    if (this.blockadeAlpha > 0.05 || this.state === 'blocked') {
      var bAlpha = Math.max(this.blockadeAlpha, this.state === 'blocked' ? 0.9 : 0);
      ctx.save();
      ctx.globalAlpha = bAlpha;
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 2.5;

      // Hexagonal deflection shield
      ctx.beginPath();
      for (var hi = 0; hi < 6; hi++) {
        var ha = (hi * Math.PI) / 3 + this.animPhase * 0.5;
        var hx = Math.cos(ha) * 32;
        var hy = Math.sin(ha) * 32;
        if (hi === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 50, 50, 0.15)';
      ctx.fill();
      ctx.stroke();

      // "BLOCKED" label
      ctx.fillStyle = '#ff6b6b';
      ctx.font = 'bold 11px ui-monospace, Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('BLOCKED', 0, -38);

      ctx.restore();
    }

    // 4. Resonance Fluorescence (Readout bright ground state)
    if (this.fluorescence > 0.05) {
      ctx.save();
      ctx.globalAlpha = this.fluorescence;
      var fGrad = ctx.createRadialGradient(0, 0, 8, 0, 0, 48);
      fGrad.addColorStop(0, '#ffffff');
      fGrad.addColorStop(0.3, 'rgba(80, 255, 200, 0.9)');
      fGrad.addColorStop(0.7, 'rgba(30, 200, 160, 0.4)');
      fGrad.addColorStop(1, 'rgba(10, 100, 80, 0)');
      ctx.fillStyle = fGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 48, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 5. Draw the actual Stormtrooper Helmet
    if (this.state === 'dark') {
      // Rydberg atom lost before imaging -> ghostly faded outline showing open route
      ctx.globalAlpha = 0.22;
      drawHelmet(ctx, 36, '#3a5068', '#111b24');
      ctx.strokeStyle = 'rgba(100, 200, 255, 0.4)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      // Present atom
      ctx.globalAlpha = 1.0;
      var helmCol = '#f5f7fa';
      var visCol = '#080d14';

      if (rydbergLevel > 0.4) {
        helmCol = '#fce4ff';
        visCol = '#4a0e4e';
      } else if (this.fluorescence > 0.3) {
        helmCol = '#e6fff5';
      }

      drawHelmet(ctx, 36, helmCol, visCol);
    }

    // 6. Identifier Label (e.g. "q0", "q1")
    ctx.restore(); // Return to world coordinates
    this.drawLabel(ctx, pos.x, pos.y);
  };

  Trooper.prototype.drawLabel = function (ctx, x, y) {
    ctx.save();
    ctx.textAlign = 'center';

    // Qubit badge
    ctx.fillStyle = 'rgba(10, 20, 32, 0.85)';
    ctx.strokeStyle = 'rgba(70, 140, 210, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x - 22, y + 22, 44, 18, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#8ec5fc';
    ctx.font = 'bold 11px ui-monospace, Consolas, monospace';
    ctx.fillText(this.id, x, y + 35);

    // Probability bar when evolving
    if (this.rydbergProb > 0.02 && this.state !== 'dark') {
      ctx.fillStyle = 'rgba(255, 100, 220, 0.9)';
      ctx.fillRect(x - 20, y + 42, 40 * this.rydbergProb, 3);
    }

    ctx.restore();
  };

  DS.render = DS.render || {};
  DS.render.Trooper = Trooper;
})(typeof window !== 'undefined' ? (window.DS = window.DS || {}) : (globalThis.DS = globalThis.DS || {}));
