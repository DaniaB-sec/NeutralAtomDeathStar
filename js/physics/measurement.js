/* ==========================================================================
   physics/measurement.js — projective measurement model + readout mapping.

   One "shot" = one projective measurement of all atoms, sampled from the
   emulator's final probabilities with a seeded PRNG (reproducible).

   Readout convention used throughout this demo:
     Rydberg |r>  → atom lost from its tweezer before imaging → DARK site → bit 1
     ground  |g>  → atom stays trapped and fluoresces          → BRIGHT site → bit 0
   (Toolkits differ in which symbol they print; the physics is the same.)
   ========================================================================== */
(function (DS) {
  'use strict';

  function sampleShots(probs, shots, rand) {
    var D = probs.length, cdf = new Float64Array(D), acc = 0;
    for (var s = 0; s < D; s++) { acc += probs[s]; cdf[s] = acc; }
    var out = [];
    for (var k = 0; k < shots; k++) {
      var r = rand() * acc, lo = 0, hi = D - 1;
      while (lo < hi) { var mid = (lo + hi) >> 1; if (cdf[mid] < r) lo = mid + 1; else hi = mid; }
      out.push(lo);
    }
    return out;
  }

  /** Histogram of shots: [{index, count}] sorted by count desc. */
  function histogram(shots) {
    var counts = {};
    shots.forEach(function (s) { counts[s] = (counts[s] || 0) + 1; });
    return Object.keys(counts).map(function (k) { return { index: +k, count: counts[k] }; })
      .sort(function (a, b) { return b.count - a.count || a.index - b.index; });
  }

  /**
   * Choose the shot displayed in the readout.
   * Demo mode: the first shot (in sampled order) that equals the most frequent
   * outcome — honest (it really was sampled) and deterministic.
   */
  function chooseDisplayedShot(shots, hist) {
    var target = hist[0].index;
    var shotNumber = shots.indexOf(target);
    return { index: target, shotNumber: shotNumber };
  }

  /** Threshold integrated site counts into bits: bright (above) → 0, dark → 1. */
  function thresholdBits(siteCounts, threshold) {
    return siteCounts.map(function (c) { return c >= threshold ? 0 : 1; });
  }

  DS.measurement = {
    sampleShots: sampleShots, histogram: histogram,
    chooseDisplayedShot: chooseDisplayedShot, thresholdBits: thresholdBits
  };
})(typeof window !== 'undefined' ? (window.DS = window.DS || {}) : (globalThis.DS = globalThis.DS || {}));
