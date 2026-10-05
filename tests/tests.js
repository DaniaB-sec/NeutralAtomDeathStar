/* tests.js — physics/model verification. Results are shown on the page and
   exposed as window.__TEST_RESULTS__ for the dev-time headless runner. */
(function () {
  'use strict';
  var DS = window.DS, cfg = DS.config, P = cfg.physics;
  var results = [];

  function record(name, pass, detail) {
    results.push({ name: name, pass: !!pass, detail: detail || '' });
  }
  function info(name, detail) { results.push({ name: name, pass: true, info: true, detail: detail }); }
  function test(name, fn) {
    try { var r = fn(); record(name, r === undefined ? true : r.pass, r && r.detail); }
    catch (e) { record(name, false, 'threw: ' + (e && e.message)); }
  }
  function near(a, b, tol) { return Math.abs(a - b) <= tol; }

  var demo = null;

  /* ---------------- Register parser ---------------- */
  test('Parser: demo register has 13 atoms in listed order', function () {
    var r = DS.register.parse(cfg.demoCoords);
    var ok = r.errors.length === 0 && r.atoms.length === 13 && r.atoms[0].id === 'q0' && r.atoms[12].id === 'q12' &&
      r.atoms[4].x === 12 && r.atoms[4].y === 12;
    return { pass: ok, detail: r.errors.join('; ') };
  });
  test('Parser: rejects missing block, duplicates, too-close atoms, too many atoms', function () {
    var a = DS.register.parse('x = 3').errors.length > 0;
    var b = DS.register.parse('coords = {"q0": (0,0), "q0": (6,0)}').errors.length > 0;
    var c = DS.register.parse('coords = {"q0": (0,0), "q1": (1,0)}').errors.length > 0;
    var many = 'coords = {' + Array.from({ length: 15 }, function (_, i) { return '"q' + i + '": (' + (i * 6) + ', 0),'; }).join('') + '}';
    var d = DS.register.parse(many).errors.length > 0;
    var e = DS.register.parse("coords = { 'a': (-6.5, +3), 'b': (6, 0.0) }").errors.length === 0;
    return { pass: a && b && c && d && e, detail: [a, b, c, d, e].join(',') };
  });
  test('Parser: all presets parse', function () {
    var bad = Object.keys(cfg.presets).filter(function (k) { return DS.register.parse(cfg.presets[k]).errors.length; });
    return { pass: bad.length === 0, detail: bad.join(',') };
  });

  /* ---------------- Interaction scaling ---------------- */
  test('V(R) ∝ 1/R^6: V(2R) = V(R)/64', function () {
    var v6 = DS.rydberg.V(6, P.C6), v12 = DS.rydberg.V(12, P.C6);
    return { pass: near(v6 / v12, 64, 1e-9), detail: 'V(6)/2π=' + DS.rydberg.toMHz(v6).toFixed(2) + ' MHz, V(12)/2π=' + DS.rydberg.toMHz(v12).toFixed(3) + ' MHz' };
  });
  test('Blockade radius sits between diagonal (8.49 µm) and next waypoint (12 µm)', function () {
    var Rb = DS.rydberg.blockadeRadius(P.C6, P.omegaMax);
    return { pass: Rb > 6 * Math.SQRT2 + 0.2 && Rb < 12 - 0.5, detail: 'R_b = ' + Rb.toFixed(2) + ' µm' };
  });

  /* ---------------- Full demo pipeline ---------------- */
  test('Pipeline: demo computes without errors', function () {
    demo = DS.model.compute(cfg.demoCoords, cfg);
    return { pass: demo.ok, detail: (demo.errors || []).join('; ') + ' (' + (demo.computeMs | 0) + ' ms, ' + demo.emu.steps + ' steps)' };
  });
  test('Blockade graph: 12 corridor edges + 4 diagonal edges', function () {
    return { pass: demo.graph.edges.length === 16, detail: demo.graph.edges.length + ' edges' };
  });
  test('Classical MIS: unique, size 7, exactly the even-indexed sites', function () {
    var evens = 0; for (var q = 0; q < 13; q += 2) evens |= (1 << q);
    var c = demo.classical;
    return { pass: c.unique && c.size === 7 && c.solutions[0] === evens,
      detail: 'size ' + c.size + ', ' + c.solutions.length + ' optimal set(s), ' + c.checked + ' configurations checked, ' + c.independentSets + ' independent sets' };
  });
  test('Narrative route: MIS sites connect START (q0) → EXIT (q12)', function () {
    var r = DS.mis.route(demo.atoms, demo.misMask, cfg.narrative.maxHop);
    return { pass: !!r && r.length === 7 && r[0] === 0 && r[6] === 12, detail: r ? r.map(function (i) { return 'q' + i; }).join(' → ') : 'none' };
  });
  test('Emulator: norm conserved', function () {
    return { pass: near(demo.emu.norm, 1, 1e-9), detail: 'norm = ' + demo.emu.norm.toFixed(12) };
  });
  test('Emulator: most probable outcome equals the classical MIS', function () {
    var t = demo.top[0];
    return { pass: demo.agrees, detail: 'top = ' + DS.emulator.bitstring(t.index, 13) + ' with P = ' + (t.prob * 100).toFixed(1) + '%' +
      ' | runner-up P = ' + (demo.top[1] ? (demo.top[1].prob * 100).toFixed(1) + '% (' + DS.emulator.bitstring(demo.top[1].index, 13) + ')' : '-') };
  });
  test('Emulator: MIS probability is comfortably dominant (> 40%)', function () {
    return { pass: demo.top[0].prob > 0.4, detail: (demo.top[0].prob * 100).toFixed(1) + '%' };
  });
  test('Measurement: displayed shot is the MIS and gives the route', function () {
    return { pass: demo.shown.index === demo.misMask && !!demo.route,
      detail: 'shot #' + (demo.shown.shotNumber + 1) + ', MIS seen in ' + demo.hist[0].count + '/' + cfg.shots + ' shots' };
  });
  test('Measurement: deterministic for a fixed seed', function () {
    var again = DS.model.compute(cfg.demoCoords, cfg);
    return { pass: again.shots.join(',') === demo.shots.join(',') };
  });
  test('Emulator: time-step converged (dt vs dt/2)', function () {
    var p2 = Object.assign({}, P, { dt: P.dt / 2 });
    var r2 = DS.emulator.run(demo.atoms, p2);
    var d = Math.abs(r2.probs[demo.misMask] - demo.emu.probs[demo.misMask]);
    return { pass: d < 0.01, detail: 'ΔP(MIS) = ' + d.toExponential(2) };
  });

  /* ---------------- Two-atom blockade sanity ---------------- */
  function pairPi(R) {
    var atoms = [{ x: 0, y: 0 }, { x: R, y: 0 }];
    var Om = P.omegaMax, T = Math.PI / Om;
    var pulse = { T: T, omega: function () { return Om; }, delta: function () { return 0; } };
    var r = DS.emulator.run(atoms, Object.assign({}, P, { samples: 3 }), pulse);
    return r.probs; // index 3 = both Rydberg
  }
  test('Two atoms at 6 µm: blockade suppresses double excitation (π pulse)', function () {
    var p = pairPi(6);
    return { pass: p[3] < 0.02, detail: 'P(rr) = ' + p[3].toExponential(2) + ', P(single) = ' + (p[1] + p[2]).toFixed(3) };
  });
  test('Two atoms at 12 µm: nearly independent (π pulse excites both)', function () {
    var p = pairPi(12);
    return { pass: p[3] > 0.8, detail: 'P(rr) = ' + p[3].toFixed(3) };
  });

  /* ---------------- Geometry matters ---------------- */
  test('Preset "spread" (2× spacing): no blockade edges → constraint vanishes', function () {
    var r = DS.model.compute(cfg.presets.spread, cfg);
    return { pass: r.ok && r.graph.edges.length === 0 && r.classical.size === 13,
      detail: 'edges ' + r.graph.edges.length + ', top outcome ' + DS.emulator.bitstring(r.top[0].index, 13) + ' P=' + (r.top[0].prob * 100).toFixed(1) + '%' };
  });
  test('Preset "even" (12-atom line): MIS is degenerate (no unique answer)', function () {
    var r = DS.model.compute(cfg.presets.even, cfg);
    return { pass: r.ok && !r.classical.unique, detail: r.classical.solutions.length + ' optimal sets of size ' + r.classical.size };
  });

  info('Model constants', 'C6 = ' + P.C6 + ' rad·µm⁶/µs, Ω/2π = ' + (P.omegaMax / 2 / Math.PI).toFixed(2) + ' MHz, Δ/2π: ' +
    (P.deltaStart / 2 / Math.PI).toFixed(1) + ' → ' + (P.deltaEnd / 2 / Math.PI).toFixed(1) + ' MHz, T = ' + (P.tRise + P.tSweep + P.tFall) + ' µs');
  if (demo && demo.top) {
    info('Top outcomes', demo.top.map(function (o) { return DS.emulator.bitstring(o.index, 13) + ' ' + (o.prob * 100).toFixed(1) + '%'; }).join(' | '));
    info('Shot histogram (top 5)', demo.hist.slice(0, 5).map(function (h) { return DS.emulator.bitstring(h.index, 13) + '×' + h.count; }).join(' | '));
  }

  /* ---------------- Report ---------------- */
  var ol = document.getElementById('results');
  var failed = results.filter(function (r) { return !r.pass; }).length;
  results.forEach(function (r) {
    var li = document.createElement('li');
    li.className = r.info ? 'info' : (r.pass ? 'pass' : 'fail');
    li.textContent = (r.info ? 'ℹ ' : (r.pass ? '✔ ' : '✘ ')) + r.name + (r.detail ? ' — ' + r.detail : '');
    ol.appendChild(li);
  });
  var s = document.getElementById('summary');
  var nTests = results.filter(function (r) { return !r.info; }).length;
  s.textContent = failed ? (failed + ' of ' + nTests + ' tests FAILED') : ('All ' + nTests + ' tests passed');
  s.className = failed ? 'fail' : 'pass';
  window.__TEST_RESULTS__ = { failed: failed, total: nTests, results: results };
})();
