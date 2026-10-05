/* ==========================================================================
   physics/emulator.js — IDEALIZED, EDUCATIONAL state-vector emulator.

   Hamiltonian (ħ = 1, rad/µs):
       H(t) = Σ_i Ω(t)/2 σx_i  −  Σ_i Δ(t) n_i  +  Σ_{i<j} C6/R_ij^6 n_i n_j

   Exact 2^N amplitudes, second-order (Strang) splitting:
       e^{-iH dt} ≈ e^{-iH_d dt/2} · Π_i e^{-i Ω/2 σx_i dt} · e^{-iH_d dt/2}

   Not modelled: decoherence, spontaneous emission, laser noise, atom motion,
   imperfect preparation/detection, hyperfine structure. Deterministic.
   Bit i of a basis index = atom i; 1 = Rydberg |r>, 0 = ground |g>.
   ========================================================================== */
(function (DS) {
  'use strict';

  /** Standard adiabatic MIS pulse: Ω ramps up/holds/ramps down; Δ sweeps − → +. */
  function makePulse(p) {
    var T = p.tRise + p.tSweep + p.tFall;
    function omega(t) {
      if (t <= 0 || t >= T) return 0;
      if (t < p.tRise) return p.omegaMax * t / p.tRise;
      if (t < p.tRise + p.tSweep) return p.omegaMax;
      return p.omegaMax * (T - t) / p.tFall;
    }
    function delta(t) {
      if (t <= p.tRise) return p.deltaStart;
      if (t >= p.tRise + p.tSweep) return p.deltaEnd;
      return p.deltaStart + (p.deltaEnd - p.deltaStart) * (t - p.tRise) / p.tSweep;
    }
    return { T: T, omega: omega, delta: delta };
  }

  function popcount(x) {
    x = x - ((x >>> 1) & 0x55555555);
    x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
    return (((x + (x >>> 4)) & 0x0F0F0F0F) * 0x01010101) >>> 24;
  }

  /**
   * Run the emulator.
   * @param {Array<{x:number,y:number}>} atoms positions in µm
   * @param {object} p physics parameters (see config.physics)
   * @param {object} [pulse] optional custom pulse {T, omega(t), delta(t)}
   */
  function run(atoms, p, pulse) {
    var n = atoms.length;
    if (n > 16) throw new Error('Emulator limited to 16 atoms.');
    var D = 1 << n;
    pulse = pulse || makePulse(p);
    var pw = DS.rydberg.pairwise(atoms, p.C6);

    // Diagonal pieces: interaction energy per basis state and Rydberg count.
    var Eint = new Float64Array(D), pop = new Uint8Array(D);
    for (var s = 1; s < D; s++) {
      var low = 31 - Math.clz32(s & -s);
      var rest = s & (s - 1);
      var e = Eint[rest];
      for (var j = 0; j < n; j++) if (rest & (1 << j)) e += pw.V[low][j];
      Eint[s] = e;
      pop[s] = popcount(s);
    }

    var steps = Math.max(1, Math.ceil(pulse.T / p.dt));
    var dt = pulse.T / steps;
    var half = dt / 2;

    // Constant half-step phase from interactions: e^{-i Eint dt/2}.
    var cI = new Float64Array(D), sI = new Float64Array(D);
    for (s = 0; s < D; s++) { cI[s] = Math.cos(-Eint[s] * half); sI[s] = Math.sin(-Eint[s] * half); }

    var re = new Float64Array(D), im = new Float64Array(D);
    re[0] = 1; // all atoms in |g>

    var nSamples = Math.max(2, p.samples || 201);
    var sampleTimes = new Float64Array(nSamples);
    var occupation = [];
    var nextSample = 0;

    function recordOccupation(t) {
      var occ = new Float64Array(n);
      for (var s2 = 0; s2 < D; s2++) {
        var pr = re[s2] * re[s2] + im[s2] * im[s2];
        if (pr < 1e-14) continue;
        for (var q = 0; q < n; q++) if (s2 & (1 << q)) occ[q] += pr;
      }
      sampleTimes[nextSample] = t;
      occupation.push(occ);
      nextSample++;
    }

    var cD = new Float64Array(n + 1), sD = new Float64Array(n + 1);
    function halfDiag(delta) {
      // e^{+i Δ k dt/2} for k Rydberg atoms, combined with interaction phase.
      for (var k = 0; k <= n; k++) { cD[k] = Math.cos(delta * k * half); sD[k] = Math.sin(delta * k * half); }
      for (var s3 = 0; s3 < D; s3++) {
        var k3 = pop[s3];
        var c = cI[s3] * cD[k3] - sI[s3] * sD[k3];
        var si = cI[s3] * sD[k3] + sI[s3] * cD[k3];
        var r = re[s3], i = im[s3];
        re[s3] = r * c - i * si;
        im[s3] = r * si + i * c;
      }
    }

    function mixer(omega) {
      var th = omega * dt / 2;
      if (th === 0) return;
      var c = Math.cos(th), sn = Math.sin(th);
      for (var q = 0; q < n; q++) {
        var bit = 1 << q;
        for (var a = 0; a < D; a++) {
          if (a & bit) continue;
          var b = a | bit;
          var ar = re[a], ai = im[a], br = re[b], bi = im[b];
          re[a] = c * ar + sn * bi; im[a] = c * ai - sn * br;
          re[b] = c * br + sn * ai; im[b] = c * bi - sn * ar;
        }
      }
    }

    recordOccupation(0);
    var sampleEvery = steps / (nSamples - 1);
    for (var step = 0; step < steps; step++) {
      var tm = (step + 0.5) * dt;
      var dl = pulse.delta(tm);
      halfDiag(dl);
      mixer(pulse.omega(tm));
      halfDiag(dl);
      while (nextSample < nSamples && (step + 1) >= Math.round(nextSample * sampleEvery)) {
        recordOccupation((step + 1) * dt);
      }
    }
    while (nextSample < nSamples) recordOccupation(pulse.T);

    var probs = new Float64Array(D), norm = 0;
    for (s = 0; s < D; s++) { probs[s] = re[s] * re[s] + im[s] * im[s]; norm += probs[s]; }

    return {
      n: n, dim: D, steps: steps, dt: dt, T: pulse.T, pulse: pulse,
      times: sampleTimes, occupation: occupation, probs: probs, norm: norm
    };
  }

  /** Occupation at an arbitrary time by linear interpolation of snapshots. */
  function occupationAt(result, t) {
    var times = result.times, k = times.length - 1;
    if (t <= 0) return result.occupation[0];
    if (t >= result.T) return result.occupation[k];
    var f = (t / result.T) * k, i0 = Math.floor(f), w = f - i0;
    var a = result.occupation[i0], b = result.occupation[Math.min(k, i0 + 1)];
    var out = new Float64Array(a.length);
    for (var q = 0; q < a.length; q++) out[q] = a[q] * (1 - w) + b[q] * w;
    return out;
  }

  /** Top-k outcomes {index, prob} sorted by probability. */
  function topOutcomes(probs, k) {
    var idx = [];
    for (var s = 0; s < probs.length; s++) if (probs[s] > 1e-6) idx.push(s);
    idx.sort(function (a, b) { return probs[b] - probs[a]; });
    return idx.slice(0, k).map(function (s) { return { index: s, prob: probs[s] }; });
  }

  function bitsOf(index, n) {
    var b = []; for (var q = 0; q < n; q++) b.push((index >> q) & 1); return b;
  }

  /** "q0 q1 … q(n-1)" order bitstring, e.g. "1010…". */
  function bitstring(index, n) { return bitsOf(index, n).join(''); }

  DS.emulator = {
    makePulse: makePulse, run: run, occupationAt: occupationAt,
    topOutcomes: topOutcomes, bitsOf: bitsOf, bitstring: bitstring, popcount: popcount
  };
})(typeof window !== 'undefined' ? (window.DS = window.DS || {}) : (globalThis.DS = globalThis.DS || {}));
