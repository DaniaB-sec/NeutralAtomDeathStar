/* ==========================================================================
   audio.js — Procedural WebAudio synthesizer:
   Original sound synthesis in pure code. No external audio files or
   copyrighted movie samples. Muted by default for academic presentation.
   ========================================================================== */
(function (DS) {
  'use strict';

  function SoundManager() {
    this.muted = true; // Muted by default per user requirements
    this.ctx = null;
  }

  SoundManager.prototype.ensureContext = function () {
    if (!this.ctx && typeof AudioContext !== 'undefined') {
      this.ctx = new AudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  };

  SoundManager.prototype.toggleMute = function () {
    this.muted = !this.muted;
    if (!this.muted) {
      this.ensureContext();
      this.playBeep(880, 0.08, 'sine');
    }
    return this.muted;
  };

  SoundManager.prototype.playBeep = function (freq, duration, type) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    var osc = this.ctx.createOscillator();
    var gain = this.ctx.createGain();

    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  };

  /** Laser tweezer beam lock-on */
  SoundManager.prototype.playTweezerBeam = function () {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    var osc = this.ctx.createOscillator();
    var gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.18);
  };

  /** Rydberg excitation energy hum */
  SoundManager.prototype.playRydbergHum = function () {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    var osc = this.ctx.createOscillator();
    var gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(220, this.ctx.currentTime + 0.4);

    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  };

  /** Scientific camera sensor shutter */
  SoundManager.prototype.playCameraShutter = function () {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    // Dual click + high chime
    this.playBeep(240, 0.05, 'square');
    var self = this;
    setTimeout(function () {
      self.playBeep(1760, 0.15, 'sine');
    }, 60);
  };

  /** Final escape route confirmed */
  SoundManager.prototype.playRouteRevealed = function () {
    if (this.muted) return;
    var self = this;
    var notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach(function (n, idx) {
      setTimeout(function () {
        self.playBeep(n, 0.25, 'sine');
      }, idx * 120);
    });
  };

  DS.sound = new SoundManager();
})(typeof window !== 'undefined' ? (window.DS = window.DS || {}) : (globalThis.DS = globalThis.DS || {}));
