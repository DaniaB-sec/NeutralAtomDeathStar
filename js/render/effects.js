/* ==========================================================================
   render/effects.js — Quantum visual effects:
   - Rydberg blockade radius circle (R_b) with scale readout
   - Blockade constraint indicators (visual aid, not physical connection)
   - Resonance fluorescence photon scattering particles
   - Luke's final escape route path overlay
   ========================================================================== */
(function (DS) {
  'use strict';

  function Effects() {
    this.particles = []; // Photons
    this.time = 0;
  }

  Effects.prototype.update = function (dt) {
    this.time += dt;

    // Update scattering photon particles
    for (var i = this.particles.length - 1; i >= 0; i--) {
      var p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  };

  /**
   * Spawn fluorescence photons from ground-state atoms during optical readout.
   */
  Effects.prototype.spawnFluorescencePhotons = function (originX, originY, count) {
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = 70 + Math.random() * 120;
      this.particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.4,
        maxLife: 0.9,
        size: 1.5 + Math.random() * 2
      });
    }
  };

  /**
   * Draw the Rydberg blockade radius circle around a target atom.
   */
  Effects.prototype.drawBlockadeCircle = function (ctx, stage, trooper, Rb_um, alpha) {
    if (!trooper || alpha <= 0.01) return;
    var pos = stage.toScreen(trooper.currX_um, trooper.currY_um);
    var radiusPx = stage.toPixels(Rb_um);

    ctx.save();
    ctx.globalAlpha = alpha;

    // Translucent blockade sphere
    var grad = ctx.createRadialGradient(pos.x, pos.y, 4, pos.x, pos.y, radiusPx);
    grad.addColorStop(0, 'rgba(255, 60, 200, 0.25)');
    grad.addColorStop(0.7, 'rgba(180, 40, 255, 0.15)');
    grad.addColorStop(1, 'rgba(120, 20, 220, 0.02)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radiusPx, 0, Math.PI * 2);
    ctx.fill();

    // Blockade perimeter boundary
    ctx.strokeStyle = 'rgba(255, 120, 240, 0.85)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radiusPx, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Radius line and scientific label
    ctx.strokeStyle = 'rgba(255, 200, 255, 0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    var labelAngle = -Math.PI / 4;
    var labelX = pos.x + Math.cos(labelAngle) * radiusPx;
    var labelY = pos.y + Math.sin(labelAngle) * radiusPx;
    ctx.lineTo(labelX, labelY);
    ctx.stroke();

    ctx.fillStyle = '#ffcbf7';
    ctx.font = 'bold 12px ui-monospace, Consolas, monospace';
    ctx.fillText('RYDBERG BLOCKADE RADIUS  R_b ≈ ' + Rb_um.toFixed(1) + ' µm', labelX + 8, labelY - 4);
    ctx.font = '10px ui-monospace, Consolas, monospace';
    ctx.fillStyle = 'rgba(255, 190, 240, 0.8)';
    ctx.fillText('V(R_b) = Ω  (excitations inside are suppressed)', labelX + 8, labelY + 10);

    ctx.restore();
  };

  /**
   * Draw subtle blockade constraint lines between atom pairs inside R_b.
   * NOTE: Explicitly tagged as geometric constraint, NEVER as "entanglement".
   */
  Effects.prototype.drawConstraintEdges = function (ctx, stage, atoms, edges, alpha) {
    if (!edges || !edges.length || alpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = alpha * 0.4;
    ctx.strokeStyle = 'rgba(255, 80, 160, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 6]);

    for (var i = 0; i < edges.length; i++) {
      var a = atoms[edges[i][0]];
      var b = atoms[edges[i][1]];
      var pa = stage.toScreen(a.x, a.y);
      var pb = stage.toScreen(b.x, b.y);
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();
  };

  /**
   * Draw scattering fluorescence photons during optical readout.
   */
  Effects.prototype.drawPhotons = function (ctx) {
    if (!this.particles.length) return;
    ctx.save();
    for (var i = 0; i < this.particles.length; i++) {
      var p = this.particles[i];
      var a = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = a * 0.9;
      ctx.fillStyle = '#5dffa8';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  /**
   * Draw Luke's escape route running through dark (Rydberg) sites.
   */
  Effects.prototype.drawRoute = function (ctx, stage, atoms, routeIndices, progress) {
    if (!routeIndices || routeIndices.length < 2 || progress <= 0.01) return;
    ctx.save();

    var points = [];
    for (var i = 0; i < routeIndices.length; i++) {
      var at = atoms[routeIndices[i]];
      points.push(stage.toScreen(at.x, at.y));
    }

    var totalSegs = points.length - 1;
    var drawToSeg = progress * totalSegs;

    // Glowing green escape corridor
    ctx.strokeStyle = '#5dffa8';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#5dffa8';
    ctx.shadowBlur = 14;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (var s = 0; s < totalSegs; s++) {
      if (drawToSeg >= s + 1) {
        ctx.lineTo(points[s + 1].x, points[s + 1].y);
      } else if (drawToSeg > s) {
        var frac = drawToSeg - s;
        var curX = points[s].x + (points[s + 1].x - points[s].x) * frac;
        var curY = points[s].y + (points[s + 1].y - points[s].y) * frac;
        ctx.lineTo(curX, curY);
        break;
      }
    }
    ctx.stroke();

    // Directional arrows along the route
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    for (var a = 0; a < Math.floor(drawToSeg); a++) {
      var midX = (points[a].x + points[a + 1].x) / 2;
      var midY = (points[a].y + points[a + 1].y) / 2;
      var ang = Math.atan2(points[a + 1].y - points[a].y, points[a + 1].x - points[a].x);
      ctx.save();
      ctx.translate(midX, midY);
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.moveTo(-6, -4);
      ctx.lineTo(4, 0);
      ctx.lineTo(-6, 4);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  };

  DS.render = DS.render || {};
  DS.render.Effects = Effects;
})(typeof window !== 'undefined' ? (window.DS = window.DS || {}) : (globalThis.DS = globalThis.DS || {}));
