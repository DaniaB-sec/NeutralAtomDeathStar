/* ==========================================================================
   timeline.js — Orchestrates the full 10-phase demonstration (~95s default).
   Time-based execution (requestAnimationFrame using elapsed delta time).
   Handles play, pause, resume, skip, and reset deterministically.
   ========================================================================== */
(function (DS) {
  'use strict';

  function Timeline(app) {
    this.app = app;
    this.phaseIdx = -1;
    this.phaseTime = 0;
    this.totalTime = 0;
    this.isPlaying = false;
    this.isPaused = false;
    this.phases = this.buildPhases();
  }

  Timeline.prototype.buildPhases = function () {
    var app = this.app;
    var cfg = DS.config.phases;

    return [
      // 0: INITIALIZE (6s)
      {
        id: 'init',
        name: 'INITIALIZE REGISTER',
        duration: cfg.init,
        enter: function () {
          app.hud.setStatus('STATUS: INITIALIZING REGISTER');
          app.hud.setCaption(
            'STOCHASTIC ATOM LOADING',
            'Neutral atoms (⁸⁷Rb) are initially trapped from a magneto-optical trap into a random optical tweezer array.',
            'Single atoms load probabilistically (≈ 50–60% filling fraction) before rearrangement.'
          );
          DS.sound.playBeep(440, 0.1);
          // Scatter atoms randomly near corridor
          for (var i = 0; i < app.troopers.length; i++) {
            var tr = app.troopers[i];
            tr.state = 'ground';
            tr.currX_um = tr.x_um + (Math.sin(i * 1.7) * 8);
            tr.currY_um = tr.y_um + (Math.cos(i * 2.3) * 8);
            tr.tweezerAlpha = 0.4;
          }
        },
        update: function (t, dt) {
          // Keep troopers lightly hovering
        }
      },

      // 1: PROGRAM THE REGISTER (12s)
      {
        id: 'program',
        name: 'PROGRAM REGISTER & REARRANGE',
        duration: cfg.program,
        enter: function () {
          app.hud.setStatus('STATUS: PROGRAMMING GEOMETRY');
          app.hud.setCaption(
            'GEOMETRY SPECIFICATION',
            'The Python program defines physical tweezer coordinates. Moving optical tweezers drag atoms into the programmed corridor.',
            'Nature provides identical atoms; optical tweezer lasers engineer the computational geometry.'
          );
        },
        update: function (t, dt) {
          var frac = Math.min(1, t / (cfg.program - 1));
          var numAtoms = app.troopers.length;

          // Animate atoms moving smoothly into programmed positions
          for (var i = 0; i < numAtoms; i++) {
            var tr = app.troopers[i];
            var startX = tr.x_um + (Math.sin(i * 1.7) * 8);
            var startY = tr.y_um + (Math.cos(i * 2.3) * 8);
            tr.currX_um = startX + (tr.x_um - startX) * frac;
            tr.currY_um = startY + (tr.y_um - startY) * frac;
            tr.tweezerAlpha = 0.5 + 0.3 * frac;
          }

          // Highlight Python code line matching current rearranging atom
          var activeAtomIdx = Math.floor(frac * numAtoms);
          if (activeAtomIdx < numAtoms) {
            app.codePanel.highlightLine(4 + activeAtomIdx);
          }
        }
      },

      // 2: TWEEZER / LIGHTSABER CONTROL (8s)
      {
        id: 'tweezers',
        name: 'OPTICAL TWEEZER TRAPPING',
        duration: cfg.tweezers,
        enter: function () {
          app.hud.setStatus('STATUS: OPTICAL TWEEZERS LOCKED');
          app.hud.setCaption(
            'LASER TWEEZER ADDRESSING',
            'Focused laser beams (represented as lightsabers) hold each atom securely at its designated coordinate.',
            'Optical dipole forces create micro-potential wells holding single neutral atoms in high vacuum.'
          );
          DS.sound.playTweezerBeam();
          for (var i = 0; i < app.troopers.length; i++) {
            app.troopers[i].currX_um = app.troopers[i].x_um;
            app.troopers[i].currY_um = app.troopers[i].y_um;
            app.troopers[i].tweezerAlpha = 1.0;
          }
        },
        update: function (t, dt) {}
      },

      // 3: RYDBERG EXCITATION (8s)
      {
        id: 'rydberg',
        name: 'RYDBERG EXCITATION',
        duration: cfg.rydberg,
        enter: function () {
          app.hud.setStatus('STATUS: RYDBERG EXCITATION');
          app.hud.setCaption(
            'EXCITING TARGET ATOM |r⟩',
            'A focused laser drives Stormtrooper q2 to the high-n Rydberg state (|70S₁/₂⟩).',
            'In Rydberg states, the valence electron orbit balloons to thousands of Bohr radii, creating colossal dipole moments.'
          );
          DS.sound.playRydbergHum();
        },
        update: function (t, dt) {
          var tr = app.troopers[2]; // q2
          if (tr) {
            tr.state = 'rydberg';
            tr.rydbergProb = Math.min(1, t / 2);
          }
        }
      },

      // 4: RYDBERG BLOCKADE & 1/R^6 (10s)
      {
        id: 'blockade',
        name: 'RYDBERG BLOCKADE & 1/R⁶',
        duration: cfg.blockade,
        enter: function () {
          app.hud.setStatus('STATUS: RYDBERG BLOCKADE ACTIVE');
          app.hud.setCaption(
            'RYDBERG BLOCKADE PHENOMENON',
            'Atom q2 generates an interaction sphere (R_b ≈ 9.1 µm). Nearest neighbor q1 (6 µm) is BLOCKED. Waypoint q4 (12 µm) is FREE!',
            'V(R) ∝ 1/R⁶: Doubling distance reduces interaction by 64×, enabling programmable quantum logic gates.'
          );
          app.r6Panel.setVisible(true);

          // Neighbor q1 is blocked!
          if (app.troopers[1]) {
            app.troopers[1].state = 'blocked';
            app.troopers[1].shake = 1.0;
          }
        },
        update: function (t, dt) {},
        exit: function () {
          app.r6Panel.setVisible(false);
          if (app.troopers[1]) app.troopers[1].state = 'ground';
        }
      },

      // 5: QUANTUM EVOLUTION (15s)
      {
        id: 'evolve',
        name: 'COHERENT QUANTUM EVOLUTION',
        duration: cfg.evolve,
        enter: function () {
          app.hud.setStatus('STATUS: COHERENT EVOLUTION [Ω(t), Δ(t)]');
          app.hud.setCaption(
            'ADIABATIC HAMILTONIAN SWEEP',
            'Global coherent laser drive sweeps through resonance. The quantum register evolves into the ground state of the Rydberg Hamiltonian.',
            'Exact 13-atom state-vector evolution (8,192 amplitudes) computing Maximum Independent Set.'
          );
          app.pulsePanel.setVisible(true);
        },
        update: function (t, dt) {
          var emu = app.modelResult.emu;
          var simT = (t / cfg.evolve) * emu.T;
          app.pulsePanel.draw(simT);
          app.beams.globalDriveAlpha = 0.8;

          // Update real-time occupation ⟨n_i⟩(t) from emulator
          var occ = DS.emulator.occupationAt(emu, simT);
          for (var i = 0; i < app.troopers.length; i++) {
            app.troopers[i].rydbergProb = occ[i];
            app.troopers[i].state = occ[i] > 0.4 ? 'rydberg' : 'ground';
          }
        },
        exit: function () {
          app.pulsePanel.setVisible(false);
          app.beams.globalDriveAlpha = 0;
        }
      },

      // 6: COMPUTATION COMPLETE (3s)
      {
        id: 'complete',
        name: 'COMPUTATION COMPLETE',
        duration: cfg.complete,
        enter: function () {
          app.hud.setStatus('STATUS: COMPUTATION COMPLETE');
          app.hud.setCaption(
            'QUANTUM EVOLUTION CONCLUDED',
            'Quantum state has evolved. All laser drives pause. The system is prepared for optical projective measurement.',
            'Projective measurement will collapse the superposition into classical outcome bits.'
          );
          DS.sound.playBeep(660, 0.15);
        },
        update: function (t, dt) {}
      },

      // 7: RESONANCE FLUORESCENCE READOUT (16s)
      {
        id: 'readout',
        name: 'RESONANCE FLUORESCENCE IMAGING',
        duration: cfg.readout,
        enter: function () {
          app.hud.setStatus('STATUS: OPTICAL READOUT IN PROGRESS');
          app.hud.setCaption(
            'RESONANCE FLUORESCENCE READOUT',
            'Resonant 780 nm light illuminates the register. Ground atoms fluoresce brightly; Rydberg atoms evaporated from traps appear DARK.',
            'Photons are collected onto an EMCCD scientific camera sensor to read out the register without diagnostic wires.'
          );
          app.camera.active = true;
          // Apply final projective measurement bits
          var bits = app.modelResult.bits;
          for (var i = 0; i < app.troopers.length; i++) {
            if (bits[i] === 0) {
              app.troopers[i].state = 'bright';
              app.troopers[i].fluorescence = 1.0;
            } else {
              app.troopers[i].state = 'dark'; // Rydberg atom lost -> dark spot
              app.troopers[i].fluorescence = 0;
            }
          }
        },
        update: function (t, dt) {
          var progress = Math.min(1, t / (cfg.readout - 2));
          app.camera.exposureProgress = progress;
          app.camera.synthesizeFrame(app.modelResult.atoms, app.modelResult.bits, progress, DS.prng.create(DS.config.seed + Math.floor(t * 10)));

          // Spawn photon sparks from bright ground atoms
          if (progress < 0.95 && Math.random() < 0.6) {
            for (var i = 0; i < app.troopers.length; i++) {
              if (app.modelResult.bits[i] === 0) {
                var p = app.stage.toScreen(app.troopers[i].currX_um, app.troopers[i].currY_um);
                app.effects.spawnFluorescencePhotons(p.x, p.y, 2);
              }
            }
          }
        }
      },

      // 8: MEASUREMENT CAPTURED (7s)
      {
        id: 'captured',
        name: 'MEASUREMENT CAPTURED',
        duration: cfg.captured,
        enter: function () {
          app.hud.setStatus('STATUS: MEASUREMENT CAPTURED');
          app.hud.setCaption(
            'OPTICAL READOUT COMPLETE: CLASSICAL BITS DETECTED',
            'The camera has captured the final pattern: q0=1 (dark), q1=0 (bright), q2=1, q3=0... Detected MIS: 1010101010101.',
            'Measurement converts quantum physical states into classical binary information via optical imaging.'
          );
          DS.sound.playCameraShutter();
          app.hud.setSaveButtonVisible(true);
        },
        update: function (t, dt) {}
      },

      // 9: LUKE'S ESCAPE ROUTE REVEALED (9s -> hold)
      {
        id: 'route',
        name: "LUKE'S ESCAPE ROUTE IDENTIFIED",
        duration: cfg.route,
        enter: function () {
          app.hud.setStatus("STATUS: LUKE'S ESCAPE ROUTE IDENTIFIED");
          app.hud.setCaption(
            "MISSION COMPLETE: LUKE'S ESCAPE ROUTE IDENTIFIED",
            'The dark sites (vacant posts where Stormtroopers were removed) form a clear path from ENTRY to EXIT DOCK!',
            '“May the qubits be with you.” — Classical observer now has the picture to navigate out.'
          );
          DS.sound.playRouteRevealed();
          app.routeActive = true;
          app.camera.active = true;
          app.camera.showRoute = true;
          app.camera.routeIndices = app.modelResult ? app.modelResult.route : null;
          app.camera.routeProgress = 0;
          app.camera.synthesizeFrame(app.modelResult.atoms, app.modelResult.bits, 1.0, DS.prng.create(DS.config.seed));
        },
        update: function (t, dt) {
          app.routeProgress = Math.min(1, t / 3.5);
          app.camera.routeProgress = app.routeProgress;
        }
      }
    ];
  };

  Timeline.prototype.start = function () {
    this.isPlaying = true;
    this.isPaused = false;
    this.goToPhase(0);
  };

  Timeline.prototype.goToPhase = function (idx) {
    if (this.phaseIdx >= 0 && this.phaseIdx < this.phases.length) {
      var oldP = this.phases[this.phaseIdx];
      if (oldP.exit) oldP.exit();
    }

    if (idx >= this.phases.length) {
      // Reached end, hold final screen
      this.isPlaying = false;
      this.app.hud.setRunningState(false, false);
      return;
    }

    this.phaseIdx = idx;
    this.phaseTime = 0;
    var p = this.phases[idx];
    this.app.hud.setPhase(p.name, idx, this.phases.length);
    if (p.enter) p.enter();
  };

  Timeline.prototype.nextPhase = function () {
    if (this.phaseIdx + 1 < this.phases.length) {
      this.goToPhase(this.phaseIdx + 1);
    }
  };

  Timeline.prototype.togglePause = function () {
    this.isPaused = !this.isPaused;
    this.app.hud.setRunningState(this.isPlaying, this.isPaused);
  };

  Timeline.prototype.update = function (dt) {
    if (!this.isPlaying || this.isPaused || this.phaseIdx < 0) return;

    var cur = this.phases[this.phaseIdx];
    this.phaseTime += dt;
    this.totalTime += dt;

    if (cur.update) cur.update(this.phaseTime, dt);

    // Calculate overall timeline progress
    var totalDur = 0;
    var elapsedDur = 0;
    for (var i = 0; i < this.phases.length; i++) {
      if (i < this.phaseIdx) elapsedDur += this.phases[i].duration;
      totalDur += this.phases[i].duration;
    }
    elapsedDur += Math.min(this.phaseTime, cur.duration);
    this.app.hud.setProgress(elapsedDur / totalDur);

    // Advance to next phase when duration expires
    if (this.phaseTime >= cur.duration) {
      this.goToPhase(this.phaseIdx + 1);
    }
  };

  Timeline.prototype.reset = function () {
    if (this.phaseIdx >= 0 && this.phaseIdx < this.phases.length) {
      var oldP = this.phases[this.phaseIdx];
      if (oldP.exit) oldP.exit();
    }
    this.phaseIdx = -1;
    this.phaseTime = 0;
    this.totalTime = 0;
    this.isPlaying = false;
    this.isPaused = false;
    this.app.hud.setProgress(0);
    this.app.hud.setRunningState(false, false);
    this.app.hud.setSaveButtonVisible(false);
    this.app.hud.setStatus('STATUS: READY');
    this.app.hud.setPhase('CLICK [RUN QUANTUM PROGRAM]', 0, this.phases.length);
    this.app.hud.setCaption(
      'DEATH STAR QUANTUM CONTROL SYSTEM',
      'Interactive demonstration of neutral-atom quantum computing architecture. Press RUN to begin the computational sequence.',
      '“Nature manufactures the qubit. We engineer the control.”'
    );
  };

  DS.Timeline = Timeline;
})(typeof window !== 'undefined' ? (window.DS = window.DS || {}) : (globalThis.DS = globalThis.DS || {}));
