/* ==========================================================================
   render/beams.js — Laser control visualization:
   1. Optical tweezers: Lightsaber-like vertical laser beams descending from
      the optical gantry to trap and position individual atoms.
   2. Global Rydberg drive: Coherent laser pulse sheet illuminating the
      entire register during quantum evolution.
   NOTE: Lightsaber style is an educational Star Wars visual metaphor
   for focused laser optical tweezers, not literal sci-fi weapons.
   ========================================================================== */
(function (DS) {
  'use strict';

  function Beams() {
    this.tweezerAlpha = 0;
    this.activeBeams = {}; // { id: { alpha, color, targetX, targetY } }
    this.globalDriveAlpha = 0;
    this.globalDrivePhase = 0;
  }

  Beams.prototype.update = function (dt) {
    this.globalDrivePhase += dt * 4;
  };

  /**
   * Draw vertical optical tweezer beams descending to target atoms.
   */
  Beams.prototype.drawTweezers = function (ctx, stage, troopers) {
    ctx.save();

    for (var i = 0; i < troopers.length; i++) {
      var tr = troopers[i];
      var alpha = tr.tweezerAlpha;
      if (alpha <= 0.01) continue;

      var pos = stage.toScreen(tr.currX_um, tr.currY_um);
      var topY = 76; // Gantry bottom rail

      // 1. Outer Bloom / Glow (Lightsaber-like cyan aura)
      ctx.save();
      ctx.globalAlpha = alpha * 0.45;
      var bloomGrad = ctx.createLinearGradient(pos.x - 18, 0, pos.x + 18, 0);
      bloomGrad.addColorStop(0, 'rgba(0, 180, 255, 0)');
      bloomGrad.addColorStop(0.5, 'rgba(60, 220, 255, 0.7)');
      bloomGrad.addColorStop(1, 'rgba(0, 180, 255, 0)');
      ctx.fillStyle = bloomGrad;
      ctx.fillRect(pos.x - 18, topY, 36, pos.y - topY);

      // 2. Focused Core Beam (Intense laser column)
      ctx.globalAlpha = alpha * 0.9;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(pos.x - 2.5, topY, 5, pos.y - topY);

      // 3. Focal Waist / Tweezer Tip on Atom
      var tipGrad = ctx.createRadialGradient(pos.x, pos.y, 2, pos.x, pos.y, 20);
      tipGrad.addColorStop(0, '#ffffff');
      tipGrad.addColorStop(0.4, 'rgba(80, 220, 255, 0.8)');
      tipGrad.addColorStop(1, 'rgba(20, 140, 255, 0)');
      ctx.fillStyle = tipGrad;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
      ctx.fill();

      // 4. Optical Gantry Emitter Flash
      ctx.fillStyle = 'rgba(120, 240, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(pos.x, topY, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  };

  /**
   * Draw single addressing laser beam (e.g. for single-atom Rydberg demonstration).
   */
  Beams.prototype.drawAddressingBeam = function (ctx, stage, trooper, color, alpha) {
    if (!trooper || alpha <= 0.01) return;
    var pos = stage.toScreen(trooper.currX_um, trooper.currY_um);
    var topY = 76;
    color = color || 'rgba(255, 80, 220, 0.8)';

    ctx.save();
    ctx.globalAlpha = alpha;

    // Glowing laser beam
    ctx.strokeStyle = color;
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(pos.x, topY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    // White core
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(pos.x, topY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    // Laser tag
    ctx.fillStyle = '#ff8df0';
    ctx.font = 'bold 11px ui-monospace, Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LASER DRIVE Ω(t)', pos.x, (topY + pos.y) / 2);

    ctx.restore();
  };

  /**
   * Draw the global Rydberg drive pulse (wide illuminated sheet across register).
   */
  Beams.prototype.drawGlobalDrive = function (ctx, stage, alpha) {
    if (alpha <= 0.01) return;
    var w = stage.vWidth;
    var h = stage.vHeight;

    ctx.save();
    ctx.globalAlpha = alpha * 0.35;

    // Sweeping wavefront
    var grad = ctx.createLinearGradient(580, 0, w - 40, 0);
    grad.addColorStop(0, 'rgba(160, 40, 240, 0)');
    grad.addColorStop(0.3, 'rgba(210, 80, 255, 0.4)');
    grad.addColorStop(0.7, 'rgba(140, 20, 220, 0.2)');
    grad.addColorStop(1, 'rgba(80, 0, 160, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(580, 110, w - 620, h - 180);

    // Coherent field lines
    ctx.strokeStyle = 'rgba(240, 150, 255, 0.25)';
    ctx.lineWidth = 1;
    var step = 45;
    for (var x = 620; x < w - 60; x += step) {
      var waveX = x + Math.sin(this.globalDrivePhase + x * 0.02) * 8;
      ctx.beginPath();
      ctx.moveTo(waveX, 120);
      ctx.lineTo(waveX, h - 80);
      ctx.stroke();
    }

    // Label on right gantry
    ctx.fillStyle = 'rgba(255, 180, 255, 0.8)';
    ctx.font = '12px ui-monospace, Consolas, monospace';
    ctx.textAlign = 'right';
    ctx.fillText('GLOBAL RYDBERG COHERENT DRIVE [Ω(t), Δ(t)]', w - 80, 100);

    ctx.restore();
  };

  DS.render = DS.render || {};
  DS.render.Beams = Beams;
})(typeof window !== 'undefined' ? (window.DS = window.DS || {}) : (globalThis.DS = globalThis.DS || {}));
