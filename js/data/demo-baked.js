/* ==========================================================================
   data/demo-baked.js — Precomputed demo fallback data.
   Used only if live simulation is disabled or encounters a hardware issue.
   ========================================================================== */
(function (DS) {
  'use strict';

  DS.demoBaked = {
    ok: true,
    n: 13,
    Rb: 9.12,
    misMask: 5461, // 0b1010101010101 (even indices: q0, q2, q4, q6, q8, q10, q12)
    classical: {
      size: 7,
      unique: true,
      solutions: [5461],
      checked: 8192,
      independentSets: 433
    },
    top: [
      { index: 5461, prob: 0.732 },
      { index: 5205, prob: 0.056 },
      { index: 5445, prob: 0.032 },
      { index: 5457, prob: 0.032 },
      { index: 5460, prob: 0.024 },
      { index: 4437, prob: 0.024 }
    ],
    shown: { index: 5461, shotNumber: 0 },
    bits: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    route: [0, 2, 4, 6, 8, 10, 12],
    shots: [5461, 5461, 5205, 5461, 5461, 5445, 5461, 5461, 5461, 5461],
    hist: [
      { index: 5461, count: 64 },
      { index: 5205, count: 7 },
      { index: 5445, count: 6 },
      { index: 5457, count: 4 },
      { index: 1365, count: 4 }
    ]
  };
})(typeof window !== 'undefined' ? (window.DS = window.DS || {}) : (globalThis.DS = globalThis.DS || {}));
