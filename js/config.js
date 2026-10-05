/* ==========================================================================
   config.js — single source of truth for the demo.
   The Python-style register text below is PARSED (register.js) and drives
   both the physics model and the visuals. Nothing here talks to a network.
   ========================================================================== */
(function (DS) {
  'use strict';
  var TWO_PI = 2 * Math.PI;

  DS.config = {
    version: '1.0.0',

    /* Deterministic seed: same shots, same camera noise, every run. */
    seed: 20261005,
    shots: 100,

    /* ---- Idealized educational model parameters --------------------------
       Units: time in µs, distances in µm, angular frequencies in rad/µs.
       C6 for 87Rb |70S1/2> as used by public neutral-atom device specs
       (= 2π × 862 690 MHz·µm^6). Values are representative, not a claim
       about any specific machine. */
    physics: {
      C6: 5420158.53,               // rad·µm^6/µs
      omegaMax: TWO_PI * 1.5,       // Rabi frequency Ω/2π = 1.5 MHz
      deltaStart: TWO_PI * -3.0,    // Δ/2π from −3.0 MHz …
      deltaEnd: TWO_PI * 2.0,       // … to +2.0 MHz
      tRise: 0.4,                   // µs
      tSweep: 3.2,                  // µs
      tFall: 0.4,                   // µs
      dt: 0.002,                    // µs, Strang-split time step
      samples: 241                  // snapshots of ⟨n_i⟩(t) kept for animation
    },

    /* Narrative-layer rule (NOT physics): Luke may step between selected
       (dark) sites that are at most this far apart. */
    narrative: {
      maxHop: 12.5,                 // µm
      startLabel: 'START',
      exitLabel: 'EXIT'
    },

    /* Register validation limits (keep the exact emulator small). */
    limits: { minAtoms: 2, maxAtoms: 14, minSpacing: 4.0, maxCoord: 120 },

    /* The demo register, written as the programmer would write it. */
    demoCoords: [
      'coords = {',
      '    "q0":  ( 0,  0),',
      '    "q1":  ( 6,  0),',
      '    "q2":  (12,  0),',
      '    "q3":  (12,  6),',
      '    "q4":  (12, 12),',
      '    "q5":  (18, 12),',
      '    "q6":  (24, 12),',
      '    "q7":  (30, 12),',
      '    "q8":  (36, 12),',
      '    "q9":  (36, 18),',
      '    "q10": (36, 24),',
      '    "q11": (42, 24),',
      '    "q12": (48, 24),',
      '}'
    ].join('\n'),

    /* Explore-mode presets (same parser). */
    presets: {
      demo: null, // filled with demoCoords below
      spread: [
        'coords = {   # same corridor, every distance doubled',
        '    "q0":  ( 0,  0),', '    "q1":  (12,  0),', '    "q2":  (24,  0),',
        '    "q3":  (24, 12),', '    "q4":  (24, 24),', '    "q5":  (36, 24),',
        '    "q6":  (48, 24),', '    "q7":  (60, 24),', '    "q8":  (72, 24),',
        '    "q9":  (72, 36),', '    "q10": (72, 48),', '    "q11": (84, 48),',
        '    "q12": (96, 48),',
        '}'
      ].join('\n'),
      even: [
        'coords = {   # 12-atom straight corridor (even length)',
        '    "q0":  ( 0, 0),', '    "q1":  ( 6, 0),', '    "q2":  (12, 0),',
        '    "q3":  (18, 0),', '    "q4":  (24, 0),', '    "q5":  (30, 0),',
        '    "q6":  (36, 0),', '    "q7":  (42, 0),', '    "q8":  (48, 0),',
        '    "q9":  (54, 0),', '    "q10": (60, 0),', '    "q11": (66, 0),',
        '}'
      ].join('\n'),
      pair: [
        'coords = {   # two atoms: try changing the distance',
        '    "q0": ( 0, 0),',
        '    "q1": ( 6, 0),',
        '}'
      ].join('\n')
    },

    /* Phase durations in seconds (auto-play ≈ 95 s). */
    phases: {
      init: 6,
      program: 12,
      tweezers: 8,
      rydberg: 8,
      blockade: 10,
      evolve: 15,
      complete: 3,
      readout: 16,
      captured: 7,
      route: 9
    }
  };

  DS.config.presets.demo = DS.config.demoCoords;
  DS.TWO_PI = TWO_PI;
})(typeof window !== 'undefined' ? (window.DS = window.DS || {}) : (globalThis.DS = globalThis.DS || {}));
