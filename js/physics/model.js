/* ==========================================================================
   physics/model.js — the full scientific pipeline, independent of any visuals:

     Python-style coords → atoms → blockade graph → classical MIS (verification)
       → idealized quantum evolution → seeded measurement shots
       → displayed shot → (narrative layer) route

   Everything the renderer shows comes from the object returned here.
   ========================================================================== */
(function (DS) {
  'use strict';

  function compute(coordsText, cfg) {
    cfg = cfg || DS.config;
    var p = cfg.physics;
    var t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());

    var parsed = DS.register.parse(coordsText, cfg.limits);
    if (parsed.errors.length) return { ok: false, errors: parsed.errors };
    var atoms = parsed.atoms, n = atoms.length;

    var Rb = DS.rydberg.blockadeRadius(p.C6, p.omegaMax);
    var graph = DS.rydberg.blockadeGraph(atoms, Rb);
    var classical = DS.mis.solve(graph);

    var emu = DS.emulator.run(atoms, p);
    var top = DS.emulator.topOutcomes(emu.probs, 6);

    var rand = DS.prng.create(cfg.seed);
    var shots = DS.measurement.sampleShots(emu.probs, cfg.shots, rand);
    var hist = DS.measurement.histogram(shots);
    var shown = DS.measurement.chooseDisplayedShot(shots, hist);
    var bits = DS.emulator.bitsOf(shown.index, n);

    var misMask = classical.solutions[0];
    var agrees = classical.unique && top.length > 0 && top[0].index === misMask;
    var routePath = DS.mis.route(atoms, shown.index, cfg.narrative.maxHop);

    var t1 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    return {
      ok: true, errors: [],
      atoms: atoms, n: n, Rb: Rb, graph: graph,
      classical: classical, misMask: misMask,
      emu: emu, top: top,
      shots: shots, hist: hist, shown: shown, bits: bits,
      agrees: agrees, route: routePath,
      computeMs: t1 - t0
    };
  }

  DS.model = { compute: compute };
})(typeof window !== 'undefined' ? (window.DS = window.DS || {}) : (globalThis.DS = globalThis.DS || {}));
