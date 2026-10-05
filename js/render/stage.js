/* ==========================================================================
   render/stage.js — Canvas setup, HiDPI / Retina DPR scaling,
   and coordinate transformation between register µm and screen pixels.
   Virtual 1920×1080 stage maintains aspect ratio across projector resolutions.
   ========================================================================== */
(function (DS) {
  'use strict';

  var V_WIDTH = 1920;
  var V_HEIGHT = 1080;

  function Stage(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.vWidth = V_WIDTH;
    this.vHeight = V_HEIGHT;
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.dpr = 1;

    // Viewport within virtual stage for atoms (µm -> virtual px)
    this.view = {
      cx: 1100,      // Center X in virtual pixels (giving space to code panel on left)
      cy: 540,       // Center Y
      scale: 18,     // Pixels per µm
      targetScale: 18,
      targetCx: 1100,
      targetCy: 540
    };

    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize);
    this.resize();
  }

  Stage.prototype.resize = function () {
    var rect = this.canvas.parentElement.getBoundingClientRect();
    var w = rect.width || window.innerWidth;
    var h = rect.height || window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for projector/weak GPU perf

    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);

    // Letterbox/pillarbox to 16:9
    var aspect = V_WIDTH / V_HEIGHT;
    var windowAspect = w / h;
    if (windowAspect > aspect) {
      this.scale = h / V_HEIGHT;
      this.offsetX = (w - V_WIDTH * this.scale) / 2;
      this.offsetY = 0;
    } else {
      this.scale = w / V_WIDTH;
      this.offsetX = 0;
      this.offsetY = (h - V_HEIGHT * this.scale) / 2;
    }
  };

  /** Center the atom register smoothly in the atom viewport */
  Stage.prototype.fitRegister = function (atoms, animate) {
    if (!atoms || !atoms.length) return;
    var b = DS.register.bounds(atoms);
    var spanX = Math.max(b.maxX - b.minX, 20);
    var spanY = Math.max(b.maxY - b.minY, 20);
    var regMidX = (b.minX + b.maxX) / 2;
    var regMidY = (b.minY + b.maxY) / 2;

    // Available atom area on screen: x ∈ [620, 1860], y ∈ [120, 960]
    var availW = 1200;
    var availH = 800;
    var sX = availW / (spanX + 16);
    var sY = availH / (spanY + 16);
    var fitS = Math.min(sX, sY, 26); // Cap max zoom

    this.view.targetScale = fitS;
    this.view.targetCx = 1220 - regMidX * fitS;
    this.view.targetCy = 540 - regMidY * fitS;

    if (!animate) {
      this.view.scale = this.view.targetScale;
      this.view.cx = this.view.targetCx;
      this.view.cy = this.view.targetCy;
    }
  };

  Stage.prototype.update = function (dt) {
    // Smooth camera ease towards target
    var ease = Math.min(1, dt * 5);
    this.view.scale += (this.view.targetScale - this.view.scale) * ease;
    this.view.cx += (this.view.targetCx - this.view.cx) * ease;
    this.view.cy += (this.view.targetCy - this.view.cy) * ease;
  };

  /** Begin frame: clear and apply virtual coordinate transform */
  Stage.prototype.beginFrame = function () {
    var ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#03070d';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply scale & letterbox offset, then DPR
    ctx.save();
    ctx.translate(this.offsetX * this.dpr, this.offsetY * this.dpr);
    ctx.scale(this.scale * this.dpr, this.scale * this.dpr);
  };

  Stage.prototype.endFrame = function () {
    this.ctx.restore();
  };

  /** Convert register (x, y) in µm to virtual stage pixels */
  Stage.prototype.toScreen = function (x_um, y_um) {
    return {
      x: this.view.cx + x_um * this.view.scale,
      y: this.view.cy + y_um * this.view.scale
    };
  };

  /** Convert µm length to screen pixel length */
  Stage.prototype.toPixels = function (um) {
    return um * this.view.scale;
  };

  DS.render = DS.render || {};
  DS.render.Stage = Stage;
})(typeof window !== 'undefined' ? (window.DS = window.DS || {}) : (globalThis.DS = globalThis.DS || {}));
