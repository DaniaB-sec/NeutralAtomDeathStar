/* ==========================================================================
   physics/rydberg.js — van der Waals interaction V(R) = C6 / R^6,
   blockade radius, and the blockade (unit-disk) graph.
   Pure functions. No rendering, no Star Wars.
   ========================================================================== */
(function (DS) {
  'use strict';
  var TWO_PI = 2 * Math.PI;

  /** Interaction strength in rad/µs for distance R (µm). */
  function V(R, C6) { return C6 / Math.pow(R, 6); }

  /** Convert an angular frequency (rad/µs) to MHz (i.e. divide by 2π). */
  function toMHz(w) { return w / TWO_PI; }

  /** Blockade radius R_b = (C6 / Ω)^(1/6), the distance where V(R_b) = Ω. */
  function blockadeRadius(C6, omega) { return Math.pow(C6 / omega, 1 / 6); }

  function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

  /** Pairwise distance and interaction matrices. */
  function pairwise(atoms, C6) {
    var n = atoms.length;
    var R = [], Vm = [];
    for (var i = 0; i < n; i++) {
      R.push(new Float64Array(n)); Vm.push(new Float64Array(n));
    }
    for (i = 0; i < n; i++) {
      for (var j = i + 1; j < n; j++) {
        var d = distance(atoms[i], atoms[j]);
        R[i][j] = R[j][i] = d;
        Vm[i][j] = Vm[j][i] = V(d, C6);
      }
    }
    return { R: R, V: Vm };
  }

  /**
   * Blockade graph: an edge joins atoms closer than R_b.
   * adj[i] is a bitmask of i's neighbours (n ≤ 30).
   */
  function blockadeGraph(atoms, Rb) {
    var n = atoms.length, adj = new Array(n).fill(0), edges = [];
    for (var i = 0; i < n; i++) {
      for (var j = i + 1; j < n; j++) {
        if (distance(atoms[i], atoms[j]) < Rb) {
          adj[i] |= (1 << j); adj[j] |= (1 << i);
          edges.push([i, j]);
        }
      }
    }
    return { n: n, adj: adj, edges: edges, Rb: Rb };
  }

  DS.rydberg = {
    V: V, toMHz: toMHz, blockadeRadius: blockadeRadius,
    distance: distance, pairwise: pairwise, blockadeGraph: blockadeGraph
  };
})(typeof window !== 'undefined' ? (window.DS = window.DS || {}) : (globalThis.DS = globalThis.DS || {}));
