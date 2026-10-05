/* ==========================================================================
   ui/hud.js — Head-Up Display (HUD):
   - Command console top bar: System status, phase badge, timer
   - Primary control buttons: RUN, PAUSE/RESUME, SKIP, RESET, SOUND, EXPLORE
   - Synchronized pedagogical captions at screen bottom
   ========================================================================== */
(function (DS) {
  'use strict';

  function HUD(elements) {
    this.statusEl = elements.status;
    this.phaseEl = elements.phase;
    this.captionEl = elements.caption;
    this.progressEl = elements.progress;
    this.runBtn = elements.runBtn;
    this.pauseBtn = elements.pauseBtn;
    this.skipBtn = elements.skipBtn;
    this.saveBtn = elements.saveBtn;
    this.resetBtn = elements.resetBtn;
    this.soundBtn = elements.soundBtn;
    this.exploreBtn = elements.exploreBtn;
  }

  HUD.prototype.setSaveButtonVisible = function (vis) {
    if (this.saveBtn) {
      this.saveBtn.style.display = vis ? 'inline-flex' : 'none';
    }
  };

  HUD.prototype.setStatus = function (text) {
    if (this.statusEl) this.statusEl.textContent = text;
  };

  HUD.prototype.setPhase = function (title, index, total) {
    if (this.phaseEl) {
      this.phaseEl.innerHTML = '<span class="phase-idx">PHASE ' + (index + 1) + '/' + total + ':</span> ' + title;
    }
  };

  HUD.prototype.setCaption = function (title, body, scientificNote) {
    if (!this.captionEl) return;
    var html = '<div class="caption-inner">';
    if (title) html += '<span class="caption-title">' + title + '</span>';
    if (body) html += '<span class="caption-body">' + body + '</span>';
    if (scientificNote) {
      html += '<span class="caption-sci">🔬 ' + scientificNote + '</span>';
    }
    html += '</div>';
    this.captionEl.innerHTML = html;
  };

  HUD.prototype.setProgress = function (pct) {
    if (this.progressEl) {
      this.progressEl.style.width = Math.min(100, Math.max(0, pct * 100)) + '%';
    }
  };

  HUD.prototype.setRunningState = function (isRunning, isPaused) {
    if (this.runBtn) {
      this.runBtn.style.display = isRunning ? 'none' : 'inline-flex';
    }
    if (this.pauseBtn) {
      this.pauseBtn.style.display = isRunning ? 'inline-flex' : 'none';
      this.pauseBtn.innerHTML = isPaused ? '▶ RESUME (P)' : '⏸ PAUSE (P)';
    }
    if (this.skipBtn) {
      this.skipBtn.style.display = isRunning ? 'inline-flex' : 'none';
    }
  };

  HUD.prototype.updateSoundButton = function (muted) {
    if (this.soundBtn) {
      this.soundBtn.innerHTML = muted ? '🔇 SOUND: OFF (M)' : '🔊 SOUND: ON (M)';
      this.soundBtn.classList.toggle('active', !muted);
    }
  };

  DS.ui = DS.ui || {};
  DS.ui.HUD = HUD;
})(typeof window !== 'undefined' ? (window.DS = window.DS || {}) : (globalThis.DS = globalThis.DS || {}));
