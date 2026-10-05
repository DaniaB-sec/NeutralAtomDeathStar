/* ==========================================================================
   physics/mis.js — CLASSICAL verification by exhaustive enumeration.
   Maximum Independent Set (MIS) of the blockade graph: the largest set of
   atoms that can all be Rydberg-excited without any pair closer than R_b.
   For ≤ 14 atoms this checks every one of the 2^N configurations in
   milliseconds — the demo makes no claim of quantum advantage.
   ========================================================================== */
(function (DS) {
  'use strict';

  function isIndependent(mask, adj) {
    var m = mask;
    while (m) {
      var low = m & -m;
      var i = 31 - Math.clz32(low);
      if (adj[i] & mask) return false;
      m ^= low;
    }
    return true;
  }

  /** @returns {{size:number, solutions:number[], unique:boolean, checked:number, independentSets:number}} */
  function solve(graph) {
    var n = graph.n, D = 1 << n, best = -1, sols = [], indep = 0;
    for (var mask = 0; mask < D; mask++) {
      if (!isIndependent(mask, graph.adj)) continue;
      indep++;
      var c = DS.emulator.popcount(mask);
      if (c > best) { best = c; sols = [mask]; }
      else if (c === best) sols.push(mask);
    }
    return { size: best, solutions: sols, unique: sols.length === 1, checked: D, independentSets: indep };
  }

  /**
   * NARRATIVE LAYER (not physics): read selected sites as waypoints and look
   * for a chain from the first-listed atom (START) to the last-listed atom
   * (EXIT) where consecutive waypoints are ≤ maxHop µm apart. BFS shortest path.
   * @returns {number[]|null} atom indices along the route, or null.
   */
  function route(atoms, mask, maxHop) {
    var n = atoms.length, start = 0, exit = n - 1;
    if (!((mask >> start) & 1) || !((mask >> exit) & 1)) return null;
    var prev = new Array(n).fill(-2);
    prev[start] = -1;
    var queue = [start];
    while (queue.length) {
      var u = queue.shift();
      if (u === exit) break;
      for (var v = 0; v < n; v++) {
        if (prev[v] !== -2 || !((mask >> v) & 1)) continue;
        if (DS.rydberg.distance(atoms[u], atoms[v]) <= maxHop) { prev[v] = u; queue.push(v); }
      }
    }
    if (prev[exit] === -2) return null;
    var path = [];
    for (var w = exit; w !== -1; w = prev[w]) path.unshift(w);
    return path;
  }

  DS.mis = { isIndependent: isIndependent, solve: solve, route: route };
})(typeof window !== 'undefined' ? (window.DS = window.DS || {}) : (globalThis.DS = globalThis.DS || {}));
