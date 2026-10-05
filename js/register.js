/* ==========================================================================
   register.js — parse the Python-style `coords = { "name": (x, y), ... }`
   text into atoms (µm). This is what makes the code panel *meaningful*:
   the parsed coordinates drive the physics model and the drawing.
   ========================================================================== */
(function (DS) {
  'use strict';

  var ENTRY_RE = /["']([A-Za-z_][A-Za-z0-9_]*)["']\s*:\s*\(\s*([-+]?\d*\.?\d+)\s*,\s*([-+]?\d*\.?\d+)\s*\)/g;

  /**
   * @param {string} text Python-style source containing a `coords = {...}` block.
   * @param {object} [limits] {minAtoms, maxAtoms, minSpacing, maxCoord}
   * @returns {{atoms: Array<{id:string,x:number,y:number,line:number}>, errors: string[]}}
   */
  function parse(text, limits) {
    limits = limits || (DS.config && DS.config.limits) || { minAtoms: 2, maxAtoms: 14, minSpacing: 4, maxCoord: 60 };
    var errors = [];
    var atoms = [];

    var start = text.search(/coords\s*=\s*\{/);
    if (start < 0) {
      return { atoms: [], errors: ['Could not find a "coords = { ... }" block.'] };
    }
    var end = text.indexOf('}', start);
    if (end < 0) {
      return { atoms: [], errors: ['The coords block is missing its closing "}".'] };
    }
    var block = text.slice(start, end);
    var lineOffset = text.slice(0, start).split('\n').length - 1;

    var seen = {};
    var m;
    ENTRY_RE.lastIndex = 0;
    while ((m = ENTRY_RE.exec(block)) !== null) {
      var id = m[1];
      var x = parseFloat(m[2]);
      var y = parseFloat(m[3]);
      var line = lineOffset + block.slice(0, m.index).split('\n').length - 1;
      if (seen[id]) { errors.push('Duplicate atom name "' + id + '".'); continue; }
      if (!isFinite(x) || !isFinite(y)) { errors.push('Invalid coordinates for "' + id + '".'); continue; }
      if (Math.abs(x) > limits.maxCoord || Math.abs(y) > limits.maxCoord) {
        errors.push('"' + id + '" is too far from the origin (|x|,|y| ≤ ' + limits.maxCoord + ' µm).');
        continue;
      }
      seen[id] = true;
      atoms.push({ id: id, x: x, y: y, line: line });
    }

    if (atoms.length < limits.minAtoms) errors.push('Need at least ' + limits.minAtoms + ' atoms.');
    if (atoms.length > limits.maxAtoms) errors.push('At most ' + limits.maxAtoms + ' atoms (the exact emulator stays small).');

    for (var i = 0; i < atoms.length; i++) {
      for (var j = i + 1; j < atoms.length; j++) {
        var d = Math.hypot(atoms[i].x - atoms[j].x, atoms[i].y - atoms[j].y);
        if (d < limits.minSpacing) {
          errors.push(atoms[i].id + ' and ' + atoms[j].id + ' are ' + d.toFixed(1) +
            ' µm apart (minimum ' + limits.minSpacing + ' µm).');
        }
      }
    }
    return { atoms: errors.length ? [] : atoms, errors: errors };
  }

  /** Bounding box of a register in µm. */
  function bounds(atoms) {
    var b = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    atoms.forEach(function (a) {
      b.minX = Math.min(b.minX, a.x); b.maxX = Math.max(b.maxX, a.x);
      b.minY = Math.min(b.minY, a.y); b.maxY = Math.max(b.maxY, a.y);
    });
    return b;
  }

  DS.register = { parse: parse, bounds: bounds };
})(typeof window !== 'undefined' ? (window.DS = window.DS || {}) : (globalThis.DS = globalThis.DS || {}));
