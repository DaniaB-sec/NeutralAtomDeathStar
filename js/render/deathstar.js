/* ==========================================================================
   render/deathstar.js — Procedural Star Wars / Death Star interior environment.
   Original vector graphics inspired by imperial command consoles & corridors:
   hangar wall patterns, sector grid, blast doors, and detention level layout.
   No copyrighted images or movie assets used.
   ========================================================================== */
(function (DS) {
  'use strict';

  function DeathStarBg() {
    this.time = 0;
    this.starfield = [];
    for (var i = 0; i < 40; i++) {
      this.starfield.push({
        x: Math.random() * 1920,
        y: Math.random() * 1080,
        size: 0.8 + Math.random() * 1.5,
        alpha: 0.15 + Math.random() * 0.4,
        speed: 0.2 + Math.random() * 0.5
      });
    }
  }

  DeathStarBg.prototype.update = function (dt) {
    this.time += dt;
  };

  /**
   * Render Death Star structural background and sector corridors.
   * @param {CanvasRenderingContext2D} ctx
   * @param {DS.render.Stage} stage
   * @param {Array} atoms register atoms in µm
   */
  DeathStarBg.prototype.draw = function (ctx, stage, atoms) {
    var w = stage.vWidth;
    var h = stage.vHeight;

    // 1. Deep space backdrop with subtle grid
    var bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#020509');
    bgGrad.addColorStop(0.5, '#050a12');
    bgGrad.addColorStop(1, '#020408');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle starfield through viewport
    ctx.fillStyle = '#99b8dd';
    for (var i = 0; i < this.starfield.length; i++) {
      var s = this.starfield[i];
      var a = s.alpha * (0.8 + 0.2 * Math.sin(this.time * s.speed + i));
      ctx.globalAlpha = a;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    ctx.globalAlpha = 1.0;

    // 2. Imperial architectural wall panels (vertical recessed light strips)
    ctx.save();
    ctx.strokeStyle = 'rgba(30, 55, 80, 0.25)';
    ctx.lineWidth = 1;

    // Left console partition
    ctx.strokeRect(40, 40, 520, h - 80);
    ctx.strokeRect(48, 48, 504, h - 96);

    // Subtle vertical light slots along Death Star corridor wall
    var slotY = 120;
    while (slotY < h - 160) {
      ctx.fillStyle = 'rgba(180, 220, 255, 0.04)';
      ctx.fillRect(570, slotY, 6, 40);
      slotY += 60;
    }

    // Top technical gantry / optical rail (where tweezer beams originate)
    ctx.fillStyle = '#0a1420';
    ctx.fillRect(580, 40, w - 620, 36);
    ctx.strokeStyle = '#1a3248';
    ctx.strokeRect(580, 40, w - 620, 36);

    // Optical gantry track marks
    ctx.strokeStyle = 'rgba(70, 160, 240, 0.3)';
    ctx.beginPath();
    ctx.moveTo(600, 58);
    ctx.lineTo(w - 60, 58);
    ctx.stroke();

    for (var gx = 620; gx < w - 60; gx += 40) {
      ctx.fillStyle = 'rgba(90, 180, 255, 0.2)';
      ctx.fillRect(gx, 50, 4, 16);
    }

    // Sector header text
    ctx.font = '12px ui-monospace, Consolas, monospace';
    ctx.fillStyle = 'rgba(120, 180, 230, 0.5)';
    ctx.fillText('OPTICAL TWEEZER GANTRY // SECTOR 1138 // SUB-LEVEL 4', 600, 30);
    ctx.fillText('DETENTION CORRIDOR AA-23 TACTICAL GRID', 600, 96);

    // 3. Draw corridor path between atoms on the floor
    if (atoms && atoms.length) {
      this.drawCorridorFloor(ctx, stage, atoms);
    }

    ctx.restore();
  };

  DeathStarBg.prototype.drawCorridorFloor = function (ctx, stage, atoms) {
    ctx.save();

    // Draw connecting floor conduits between atoms
    ctx.strokeStyle = 'rgba(40, 90, 140, 0.25)';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    for (var i = 0; i < atoms.length; i++) {
      var p = stage.toScreen(atoms[i].x, atoms[i].y);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    // Inner conduit line
    ctx.strokeStyle = 'rgba(80, 180, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // START and EXIT floor markings
    if (atoms.length >= 2) {
      var pStart = stage.toScreen(atoms[0].x, atoms[0].y);
      var pExit = stage.toScreen(atoms[atoms.length - 1].x, atoms[atoms.length - 1].y);

      // Start portal
      ctx.fillStyle = 'rgba(60, 220, 130, 0.15)';
      ctx.strokeStyle = 'rgba(60, 220, 130, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pStart.x, pStart.y, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#5dffa8';
      ctx.font = 'bold 12px ui-monospace, Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ENTRY', pStart.x, pStart.y - 44);

      // Exit portal
      ctx.fillStyle = 'rgba(255, 90, 90, 0.15)';
      ctx.strokeStyle = 'rgba(255, 90, 90, 0.6)';
      ctx.beginPath();
      ctx.arc(pExit.x, pExit.y, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ff6b7a';
      ctx.fillText('EXIT DOCK', pExit.x, pExit.y - 44);
    }

    ctx.restore();
  };

  DS.render = DS.render || {};
  DS.render.DeathStarBg = DeathStarBg;
})(typeof window !== 'undefined' ? (window.DS = window.DS || {}) : (globalThis.DS = globalThis.DS || {}));
