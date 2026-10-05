/* ==========================================================================
   app.js — Main Application Controller:
   Boots components, handles presentation hotkeys, and drives the main loop.
   ========================================================================== */
(function (DS) {
  'use strict';

  function App() {
    this.canvas = document.getElementById('stage-canvas');
    this.stage = new DS.render.Stage(this.canvas);
    this.bg = new DS.render.DeathStarBg();
    this.beams = new DS.render.Beams();
    this.effects = new DS.render.Effects();
    this.camera = new DS.render.ReadoutCamera();

    this.troopers = [];
    this.modelResult = null;
    this.routeActive = false;
    this.routeProgress = 0;

    this.initUI();
    this.initModel(DS.config.demoCoords);
    this.timeline = new DS.Timeline(this);
    this.timeline.reset();

    this.initHotkeys();

    // Support URL parameters for rehearsals and visual tests (?phase=0..9, ?science=1)
    var urlParams = new URLSearchParams(window.location.search);
    var pParam = urlParams.get('phase');
    if (pParam !== null) {
      var pIdx = parseInt(pParam, 10);
      this.timeline.start();
      this.timeline.goToPhase(pIdx);
      if (pIdx >= 7) {
        this.camera.active = true;
        this.camera.synthesizeFrame(this.modelResult.atoms, this.modelResult.bits, 1.0, DS.prng.create(DS.config.seed));
        if (pIdx === 9) {
          this.timeline.phaseTime = 4.0;
          this.routeProgress = 1.0;
          this.camera.showRoute = true;
          this.camera.routeIndices = this.modelResult.route;
          this.camera.routeProgress = 1.0;
        }
      }
    }
    if (urlParams.get('science') === '1') {
      this.sciencePanel.toggle(true);
    }

    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  App.prototype.initUI = function () {
    var self = this;

    this.codePanel = new DS.ui.CodePanel(document.getElementById('code-container'));

    this.hud = new DS.ui.HUD({
      status: document.getElementById('hud-status'),
      phase: document.getElementById('hud-phase'),
      caption: document.getElementById('hud-caption'),
      progress: document.getElementById('hud-progress-bar'),
      runBtn: document.getElementById('btn-run'),
      pauseBtn: document.getElementById('btn-pause'),
      skipBtn: document.getElementById('btn-skip'),
      saveBtn: document.getElementById('btn-save-img'),
      resetBtn: document.getElementById('btn-reset'),
      soundBtn: document.getElementById('btn-sound'),
      exploreBtn: document.getElementById('btn-explore')
    });

    document.getElementById('btn-save-img').addEventListener('click', function () {
      self.camera.exportPNG();
    });

    this.pulsePanel = new DS.ui.PulsePanel(document.getElementById('pulse-container'));
    this.r6Panel = new DS.ui.R6Panel(document.getElementById('r6-container'));

    this.sciencePanel = new DS.ui.SciencePanel(
      document.getElementById('science-container'),
      function (newCoordsText) {
        var err = self.initModel(newCoordsText);
        if (!err || !err.length) {
          self.timeline.reset();
        }
        return err;
      }
    );

    // Bind Button Events
    document.getElementById('btn-run').addEventListener('click', function () {
      self.timeline.start();
      self.hud.setRunningState(true, false);
    });

    document.getElementById('btn-pause').addEventListener('click', function () {
      self.timeline.togglePause();
    });

    document.getElementById('btn-skip').addEventListener('click', function () {
      self.timeline.nextPhase();
    });

    document.getElementById('btn-reset').addEventListener('click', function () {
      self.timeline.reset();
      self.resetVisuals();
    });

    document.getElementById('btn-sound').addEventListener('click', function () {
      var muted = DS.sound.toggleMute();
      self.hud.updateSoundButton(muted);
    });

    document.getElementById('btn-explore').addEventListener('click', function () {
      self.sciencePanel.toggle();
    });
  };

  /** Calculate physics & initialize atom troopers */
  App.prototype.initModel = function (coordsText) {
    var res = DS.model.compute(coordsText, DS.config);
    if (!res.ok) return res.errors;

    this.modelResult = res;
    this.stage.fitRegister(res.atoms, false);

    // Create Stormtrooper atoms
    this.troopers = [];
    for (var i = 0; i < res.atoms.length; i++) {
      var a = res.atoms[i];
      var tr = new DS.render.Trooper(a.id, a.x, a.y);
      this.troopers.push(tr);
    }

    return null;
  };

  App.prototype.resetVisuals = function () {
    this.camera.active = false;
    this.camera.exposureProgress = 0;
    this.routeActive = false;
    this.routeProgress = 0;
    this.pulsePanel.setVisible(false);
    this.r6Panel.setVisible(false);

    for (var i = 0; i < this.troopers.length; i++) {
      var tr = this.troopers[i];
      tr.currX_um = tr.x_um;
      tr.currY_um = tr.y_um;
      tr.state = 'ground';
      tr.tweezerAlpha = 0;
      tr.rydbergProb = 0;
      tr.fluorescence = 0;
    }
  };

  App.prototype.initHotkeys = function () {
    var self = this;
    window.addEventListener('keydown', function (e) {
      // Don't intercept hotkeys if user is typing in coordinate textarea
      if (e.target && e.target.tagName === 'TEXTAREA') return;

      var k = e.key.toLowerCase();
      if (k === ' ' || k === 'enter') {
        e.preventDefault();
        if (!self.timeline.isPlaying) {
          self.timeline.start();
          self.hud.setRunningState(true, false);
        } else {
          self.timeline.nextPhase();
        }
      } else if (k === 'p') {
        self.timeline.togglePause();
      } else if (k === 'r') {
        self.timeline.reset();
        self.resetVisuals();
      } else if (k === 'm') {
        var muted = DS.sound.toggleMute();
        self.hud.updateSoundButton(muted);
      } else if (k === 's' || k === 'e') {
        self.sciencePanel.toggle();
      } else if (k === 'escape') {
        self.sciencePanel.toggle(false);
      } else if (k === 'f') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(function () {});
        } else {
          document.exitFullscreen().catch(function () {});
        }
      }
    });
  };

  App.prototype.loop = function (now) {
    var dt = Math.min((now - this.lastTime) / 1000, 0.1); // cap dt at 100ms
    this.lastTime = now;

    // 1. Update systems
    this.stage.update(dt);
    this.bg.update(dt);
    this.beams.update(dt);
    this.effects.update(dt);
    this.timeline.update(dt);

    for (var i = 0; i < this.troopers.length; i++) {
      this.troopers[i].update(dt);
    }

    // 2. Render Canvas Frame
    this.stage.beginFrame();
    var ctx = this.stage.ctx;

    // Draw Death Star interior background
    this.bg.draw(ctx, this.stage, this.modelResult ? this.modelResult.atoms : []);

    // Draw blockade constraints if in blockade or evolve phase
    if (this.modelResult && this.modelResult.graph && (this.timeline.phaseIdx === 4 || this.timeline.phaseIdx === 5)) {
      this.effects.drawConstraintEdges(ctx, this.stage, this.modelResult.atoms, this.modelResult.graph.edges, 0.7);
    }

    // Draw Rydberg blockade radius circle in phase 4 (Blockade)
    if (this.timeline.phaseIdx === 4 && this.troopers[2]) {
      this.effects.drawBlockadeCircle(ctx, this.stage, this.troopers[2], this.modelResult.Rb, 1.0);
    }

    // Draw global drive laser sheet in phase 5
    if (this.timeline.phaseIdx === 5) {
      this.beams.drawGlobalDrive(ctx, this.stage, this.beams.globalDriveAlpha);
    }

    // Draw addressing beam in phase 3
    if (this.timeline.phaseIdx === 3 && this.troopers[2]) {
      this.beams.drawAddressingBeam(ctx, this.stage, this.troopers[2], 'rgba(255, 80, 220, 0.9)', 0.9);
    }

    // Draw optical tweezer beams
    this.beams.drawTweezers(ctx, this.stage, this.troopers);

    // Draw Stormtrooper atoms (dimmed/hidden when camera is in full sensor readout mode)
    if (!this.camera.active || this.timeline.phaseIdx < 7) {
      for (var j = 0; j < this.troopers.length; j++) {
        this.troopers[j].draw(ctx, this.stage, now);
      }
    }

    // Draw scattering fluorescence photons
    this.effects.drawPhotons(ctx);

    // Draw Resonance Fluorescence Camera Viewport (Phases 7, 8, 9)
    if (this.camera.active && this.timeline.phaseIdx >= 7) {
      this.camera.draw(
        ctx,
        this.stage,
        this.modelResult.atoms,
        this.modelResult.bits,
        this.camera.exposureProgress,
        1.0
      );
    }

    // Draw Luke's Escape Route (Phase 9)
    if (this.routeActive && this.modelResult && this.modelResult.route) {
      this.effects.drawRoute(ctx, this.stage, this.modelResult.atoms, this.modelResult.route, this.routeProgress);
    }

    this.stage.endFrame();

    requestAnimationFrame(this.loop);
  };

  DS.App = App;

  // Boot on page load
  window.addEventListener('DOMContentLoaded', function () {
    window.app = new DS.App();
  });
})(typeof window !== 'undefined' ? (window.DS = window.DS || {}) : (globalThis.DS = globalThis.DS || {}));
