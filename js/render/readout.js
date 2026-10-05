/* ==========================================================================
   render/readout.js — Resonance Fluorescence Imaging Simulation:
   Visualizes the optical readout process of a neutral-atom quantum computer:
   - Ground-state atoms |g> remain trapped and scatter resonant photons -> BRIGHT
   - Rydberg-state atoms |r> are lost from tweezers prior to readout -> DARK
   - Synthetic EMCCD sensor simulation: Poisson shot noise, Gaussian PSF,
     ROI photon integration, and binary thresholding.
   - Client-side PNG image export ("Saved scientific result").
   ========================================================================== */
(function (DS) {
  'use strict';

  var SENSOR_W = 120;
  var SENSOR_H = 70;

  function ReadoutCamera() {
    this.active = false;
    this.exposureProgress = 0; // 0 to 1
    this.sensorCanvas = document.createElement('canvas');
    this.sensorCanvas.width = SENSOR_W;
    this.sensorCanvas.height = SENSOR_H;
    this.sensorCtx = this.sensorCanvas.getContext('2d');

    this.siteCounts = [];      // Integrated photon counts per atom
    this.siteThreshold = 250;  // Threshold distinguishing dark (<) vs bright (>=)
    this.frozen = false;
  }

  /**
   * Synthesize the scientific EMCCD sensor image based on atom states.
   * @param {Array} atoms register atoms in µm
   * @param {Array<number>} bits 0 = bright (ground), 1 = dark (lost Rydberg)
   * @param {number} progress exposure progress [0, 1]
   * @param {Function} rand seeded PRNG
   */
  /** Unified coordinate transform for sensor frame and screen overlays */
  function getNormCoord(atom, bounds) {
    var spanX = Math.max(bounds.maxX - bounds.minX, 20);
    var spanY = Math.max(bounds.maxY - bounds.minY, 20);
    var midX = (bounds.minX + bounds.maxX) / 2;
    var midY = (bounds.minY + bounds.maxY) / 2;
    var aspect = SENSOR_W / SENSOR_H; // ~1.71

    // Uniform scaling preserving geometric proportions
    var maxSpan = Math.max(spanX, spanY * aspect);
    var nx = 0.5 + ((atom.x - midX) / maxSpan) * 0.76;
    var ny = 0.5 + ((atom.y - midY) / (maxSpan / aspect)) * 0.76;
    return { nx: nx, ny: ny };
  }

  ReadoutCamera.prototype.synthesizeFrame = function (atoms, bits, progress, rand) {
    if (!atoms || !atoms.length) return;
    var ctx = this.sensorCtx;
    var imgData = ctx.createImageData(SENSOR_W, SENSOR_H);
    var data = imgData.data;

    var bounds = DS.register.bounds(atoms);

    // Atom sensor pixel coordinates
    var atomPixels = atoms.map(function (a) {
      var norm = getNormCoord(a, bounds);
      return {
        x: Math.round(norm.nx * SENSOR_W),
        y: Math.round(norm.ny * SENSOR_H)
      };
    });

    this.siteCounts = new Array(atoms.length).fill(0);

    // Render sensor pixels
    for (var y = 0; y < SENSOR_H; y++) {
      for (var x = 0; x < SENSOR_W; x++) {
        var idx = (y * SENSOR_W + x) * 4;

        // Background dark current + read noise (Poisson distributed)
        var bg = Math.max(0, 14 * progress + DS.prng.gaussian(rand) * 3);
        var signal = bg;

        // Sum photon point spread functions (Gaussian PSF) from bright atoms
        for (var i = 0; i < atoms.length; i++) {
          var ap = atomPixels[i];
          var distSq = (x - ap.x) * (x - ap.x) + (y - ap.y) * (y - ap.y);

          // If atom is Ground (bit = 0), it fluoresces brightly
          // If atom is Rydberg (bit = 1), it is lost -> dark site
          var isBright = (bits[i] === 0);
          if (isBright && distSq < 49) {
            var psf = Math.exp(-distSq / 5.2);
            var photonGain = (240 + DS.prng.gaussian(rand) * 16) * progress * psf;
            signal += photonGain;
            if (distSq < 16) {
              this.siteCounts[i] += Math.round(photonGain);
            }
          }
        }

        // Scientific False-Color Map (Dark Navy -> Cyan -> Brilliant White)
        var v = Math.min(255, Math.max(0, signal));
        var r = 0, g = 0, b = 0;
        if (v < 80) {
          b = Math.round(v * 2.2);
          g = Math.round(v * 0.8);
          r = Math.round(v * 0.2);
        } else if (v < 180) {
          var f = (v - 80) / 100;
          r = Math.round(16 + f * 50);
          g = Math.round(64 + f * 170);
          b = Math.round(176 + f * 79);
        } else {
          var f2 = (v - 180) / 75;
          r = Math.round(66 + f2 * 189);
          g = Math.round(234 + f2 * 21);
          b = 255;
        }

        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
  };

  /**
   * Draw the scientific camera / sensor viewport on the main stage.
   */
  ReadoutCamera.prototype.draw = function (ctx, stage, atoms, bits, progress, alpha) {
    if (alpha <= 0.01) return;
    var w = stage.vWidth;
    var h = stage.vHeight;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Camera viewport box covering the right side of console
    var camX = 500;
    var camY = 80;
    var camW = 1380;
    var camH = 780;

    // Dim background behind camera across full height
    ctx.fillStyle = '#03070e';
    ctx.fillRect(460, 50, 1460, 960);

    // Viewport chassis / frame
    ctx.fillStyle = '#060d16';
    ctx.fillRect(camX, camY, camW, camH);
    ctx.strokeStyle = '#234b6e';
    ctx.lineWidth = 2;
    ctx.strokeRect(camX, camY, camW, camH);

    // Scientific Camera Header
    ctx.fillStyle = '#0f2233';
    ctx.fillRect(camX, camY, camW, 40);
    ctx.fillStyle = '#8fc5fc';
    ctx.font = 'bold 13px ui-monospace, Consolas, monospace';
    ctx.fillText('EMCCD SCIENTIFIC IMAGING SYSTEM // RESONANCE FLUORESCENCE READOUT', camX + 16, camY + 25);

    ctx.fillStyle = '#5dffa8';
    ctx.textAlign = 'right';
    var expMs = Math.round(progress * 20);
    ctx.fillText('INTEGRATION: ' + expMs + ' ms / 20 ms   [λ = 780 nm]', camX + camW - 16, camY + 25);
    ctx.textAlign = 'left';

    // Draw the scaled up pixelated sensor image
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.sensorCanvas, camX + 20, camY + 54, camW - 40, camH - 126);

    // Crosshairs and Region-Of-Interest (ROI) overlay
    this.drawOverlays(ctx, camX + 20, camY + 54, camW - 40, camH - 126, atoms, bits, progress);

    // Scientific distinction banner at bottom of camera frame
    ctx.fillStyle = 'rgba(8, 16, 26, 0.94)';
    ctx.fillRect(camX, camY + camH - 58, camW, 58);
    ctx.strokeStyle = '#1e3d59';
    ctx.strokeRect(camX, camY + camH - 58, camW, 58);

    ctx.fillStyle = '#ffcf70';
    ctx.font = 'bold 12px ui-monospace, Consolas, monospace';
    ctx.fillText('SCIENTIFIC READOUT PRINCIPLE:', camX + 16, camY + camH - 36);

    ctx.fillStyle = '#d0e5ff';
    ctx.font = '12px ui-monospace, Consolas, monospace';
    ctx.fillText(
      'Ground atoms |g> fluoresce and appear BRIGHT. Atoms in Rydberg state |r> are lost from tweezers prior to imaging and appear as DARK sites.',
      camX + 250,
      camY + camH - 36
    );

    ctx.fillStyle = '#8bb3db';
    ctx.font = '11px ui-monospace, Consolas, monospace';
    ctx.fillText(
      'The camera does NOT photograph a quantum wavefunction. It collects optical fluorescence to determine physical site occupation.',
      camX + 250,
      camY + camH - 18
    );

    ctx.restore();
  };

  ReadoutCamera.prototype.drawOverlays = function (ctx, viewX, viewY, viewW, viewH, atoms, bits, progress) {
    if (!atoms || !atoms.length) return;
    var bounds = DS.register.bounds(atoms);

    ctx.save();

    for (var i = 0; i < atoms.length; i++) {
      var a = atoms[i];
      var norm = getNormCoord(a, bounds);
      var sx = viewX + norm.nx * viewW;
      var sy = viewY + norm.ny * viewH;
      var bit = bits[i];

      // ROI brackets [ ]
      ctx.strokeStyle = bit === 0 ? 'rgba(93, 255, 168, 0.75)' : 'rgba(255, 120, 150, 0.65)';
      ctx.lineWidth = 1.5;
      var rSize = 22;

      // Top-left
      ctx.beginPath();
      ctx.moveTo(sx - rSize, sy - rSize + 7);
      ctx.lineTo(sx - rSize, sy - rSize);
      ctx.lineTo(sx - rSize + 7, sy - rSize);
      ctx.stroke();

      // Top-right
      ctx.beginPath();
      ctx.moveTo(sx + rSize - 7, sy - rSize);
      ctx.lineTo(sx + rSize, sy - rSize);
      ctx.lineTo(sx + rSize, sy - rSize + 7);
      ctx.stroke();

      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(sx - rSize, sy + rSize - 7);
      ctx.lineTo(sx - rSize, sy + rSize);
      ctx.lineTo(sx - rSize + 7, sy + rSize);
      ctx.stroke();

      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(sx + rSize - 7, sy + rSize);
      ctx.lineTo(sx + rSize, sy + rSize);
      ctx.lineTo(sx + rSize, sy + rSize - 7);
      ctx.stroke();

      // Qubit tag & detected bit
      ctx.font = 'bold 11px ui-monospace, Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(a.id, sx, sy - rSize - 5);

      if (progress > 0.8) {
        if (bit === 0) {
          ctx.fillStyle = '#5dffa8';
          ctx.fillText('BRIGHT (bit 0)', sx, sy + rSize + 15);
        } else {
          ctx.fillStyle = '#ff7b88';
          ctx.fillText('DARK (bit 1 · MIS)', sx, sy + rSize + 15);
        }
      }
    }

    // Draw Luke's Escape Route across the camera sensor image if active
    if (this.showRoute && this.routeIndices && this.routeIndices.length >= 2) {
      var rPts = [];
      for (var k = 0; k < this.routeIndices.length; k++) {
        var rAtom = atoms[this.routeIndices[k]];
        var rNorm = getNormCoord(rAtom, bounds);
        rPts.push({
          x: viewX + rNorm.nx * viewW,
          y: viewY + rNorm.ny * viewH
        });
      }

      ctx.save();
      ctx.strokeStyle = '#5dffa8';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = '#5dffa8';
      ctx.shadowBlur = 12;

      var totalSegs = rPts.length - 1;
      var drawTo = (this.routeProgress || 1.0) * totalSegs;

      ctx.beginPath();
      ctx.moveTo(rPts[0].x, rPts[0].y);
      for (var s = 0; s < totalSegs; s++) {
        if (drawTo >= s + 1) {
          ctx.lineTo(rPts[s + 1].x, rPts[s + 1].y);
        } else if (drawTo > s) {
          var frac = drawTo - s;
          var curX = rPts[s].x + (rPts[s + 1].x - rPts[s].x) * frac;
          var curY = rPts[s].y + (rPts[s + 1].y - rPts[s].y) * frac;
          ctx.lineTo(curX, curY);
          break;
        }
      }
      ctx.stroke();

      // Directional arrows
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      for (var ar = 0; ar < Math.floor(drawTo); ar++) {
        var midPtX = (rPts[ar].x + rPts[ar + 1].x) / 2;
        var midPtY = (rPts[ar].y + rPts[ar + 1].y) / 2;
        var angle = Math.atan2(rPts[ar + 1].y - rPts[ar].y, rPts[ar + 1].x - rPts[ar].x);
        ctx.save();
        ctx.translate(midPtX, midPtY);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(-5, -4);
        ctx.lineTo(4, 0);
        ctx.lineTo(-5, 4);
        ctx.fill();
        ctx.restore();
      }

      // Route Banner inside camera
      ctx.fillStyle = 'rgba(10, 30, 20, 0.92)';
      ctx.strokeStyle = '#5dffa8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(viewX + viewW - 360, viewY + 16, 340, 52, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#5dffa8';
      ctx.font = 'bold 12px ui-monospace, Consolas, monospace';
      ctx.textAlign = 'left';
      ctx.fillText("LUKE'S ESCAPE ROUTE IDENTIFIED", viewX + viewW - 346, viewY + 36);
      ctx.fillStyle = '#b8ffd6';
      ctx.font = '10px ui-monospace, Consolas, monospace';
      ctx.fillText('MEASUREMENT → CLASSICAL BITS → ROUTE', viewX + viewW - 346, viewY + 54);

      // START & EXIT markers on route
      if (rPts.length >= 2) {
        ctx.fillStyle = '#5dffa8';
        ctx.font = 'bold 11px ui-monospace, Consolas, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('▼ ENTRY', rPts[0].x, rPts[0].y - 32);

        ctx.fillStyle = '#ff7b88';
        ctx.fillText('EXIT DOCK ▼', rPts[rPts.length - 1].x, rPts[rPts.length - 1].y - 32);
      }

      ctx.restore();
    }

    // Scale bar in µm
    var barUm = 10;
    var barPx = barUm * scale;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(viewX + 30, viewY + viewH - 30);
    ctx.lineTo(viewX + 30 + barPx, viewY + viewH - 30);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px ui-monospace, Consolas, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('10 µm', viewX + 30, viewY + viewH - 36);

    ctx.restore();
  };

  /** Export captured sensor image to a PNG blob download */
  ReadoutCamera.prototype.exportPNG = function () {
    var link = document.createElement('a');
    link.download = 'resonance_fluorescence_readout_shot01.png';
    link.href = this.sensorCanvas.toDataURL('image/png');
    link.click();
  };

  DS.render = DS.render || {};
  DS.render.ReadoutCamera = ReadoutCamera;
})(typeof window !== 'undefined' ? (window.DS = window.DS || {}) : (globalThis.DS = globalThis.DS || {}));
