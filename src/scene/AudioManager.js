/**
 * AudioManager — Procedural audio for the romantic proposal site.
 * Generates ambient music and sound effects using Web Audio API.
 * No external audio files needed — everything is synthesized.
 *
 * Features:
 * - Romantic ambient pad (soft sine/triangle waves with reverb-like delay)
 * - Typewriter click sounds (soft per-character)
 * - Heart pop sounds (gentle bubbly tones)
 * - Celebration fanfare (ascending arpeggio + chord)
 * - Mute/unmute toggle with smooth fade in/out
 */

export default class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.muted = true;
    this.musicPlaying = false;
    this._musicNodes = [];
    this._musicTimeouts = [];
  }

  /** Initialize audio context (must be called from a user gesture) */
  async init() {
    if (this.ctx) return;

    this.ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Master volume
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0;
    this.masterGain.connect(this.ctx.destination);

    // Music bus
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.35;
    this.musicGain.connect(this.masterGain);

    // SFX bus
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.5;
    this.sfxGain.connect(this.masterGain);

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  // ============================================
  // BACKGROUND MUSIC — Romantic Ambient Pad
  // ============================================

  startMusic() {
    if (this.musicPlaying || !this.ctx) return;
    this.musicPlaying = true;

    // Romantic chord progression: Am7 → Fmaj7 → C → G
    // Frequencies for each chord (root, third, fifth, seventh)
    const chords = [
      [220.00, 261.63, 329.63, 392.00],  // Am7: A3, C4, E4, G4
      [174.61, 220.00, 261.63, 329.63],  // Fmaj7: F3, A3, C4, E4
      [261.63, 329.63, 392.00, 493.88],  // C: C4, E4, G4, B4
      [196.00, 246.94, 293.66, 392.00],  // G: G3, B3, D4, G4
    ];

    const chordDuration = 4; // seconds per chord
    const totalDuration = chords.length * chordDuration;

    const playChordCycle = () => {
      if (!this.musicPlaying || !this.ctx) return;

      chords.forEach((freqs, i) => {
        const startTime = this.ctx.currentTime + i * chordDuration;

        freqs.forEach((freq) => {
          // Each note is a triangle wave (soft, warm) with oscillator
          const osc = this.ctx.createOscillator();
          osc.type = 'triangle';
          osc.frequency.value = freq;

          // Soft attack via gain envelope
          const noteGain = this.ctx.createGain();
          noteGain.gain.setValueAtTime(0, startTime);
          noteGain.gain.linearRampToValueAtTime(0.04, startTime + 0.5);  // soft attack
          noteGain.gain.setValueAtTime(0.04, startTime + chordDuration - 0.3);
          noteGain.gain.linearRampToValueAtTime(0, startTime + chordDuration);  // soft release

          // Slight detune for warmth
          const osc2 = this.ctx.createOscillator();
          osc2.type = 'sine';
          osc2.frequency.value = freq;
          osc2.detune.value = 5; // slightly detuned

          const noteGain2 = this.ctx.createGain();
          noteGain2.gain.setValueAtTime(0, startTime);
          noteGain2.gain.linearRampToValueAtTime(0.03, startTime + 0.5);
          noteGain2.gain.setValueAtTime(0.03, startTime + chordDuration - 0.3);
          noteGain2.gain.linearRampToValueAtTime(0, startTime + chordDuration);

          osc.connect(noteGain);
          noteGain.connect(this.musicGain);
          osc2.connect(noteGain2);
          noteGain2.connect(this.musicGain);

          osc.start(startTime);
          osc.stop(startTime + chordDuration);
          osc2.start(startTime);
          osc2.stop(startTime + chordDuration);

          this._musicNodes.push(osc, osc2);
        });

        // Add a gentle high shimmer (very quiet) on each chord
        const shimmerFreq = freqs[2] * 2; // octave above fifth
        const shimmer = this.ctx.createOscillator();
        shimmer.type = 'sine';
        shimmer.frequency.value = shimmerFreq;
        const shimmerGain = this.ctx.createGain();
        shimmerGain.gain.setValueAtTime(0, startTime);
        shimmerGain.gain.linearRampToValueAtTime(0.008, startTime + 1);
        shimmerGain.gain.linearRampToValueAtTime(0.008, startTime + chordDuration - 0.5);
        shimmerGain.gain.linearRampToValueAtTime(0, startTime + chordDuration);
        shimmer.connect(shimmerGain);
        shimmerGain.connect(this.musicGain);
        shimmer.start(startTime);
        shimmer.stop(startTime + chordDuration);
        this._musicNodes.push(shimmer);
      });

      // Schedule next cycle
      const nextCycle = setTimeout(() => {
        this._musicNodes = [];
        playChordCycle();
      }, totalDuration * 1000);
      this._musicTimeouts.push(nextCycle);
    };

    playChordCycle();
  }

  stopMusic() {
    this.musicPlaying = false;
    // Clear pending cycle timeouts
    for (const t of this._musicTimeouts) clearTimeout(t);
    this._musicTimeouts = [];

    // Fade out music gain smoothly
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
    }

    // Stop all oscillators after fade
    setTimeout(() => {
      for (const node of this._musicNodes) {
        try { node.stop(); } catch (_) { /* already stopped */ }
      }
      this._musicNodes = [];
      // Reset gain for next play
      if (this.musicGain) this.musicGain.gain.value = 0.35;
    }, 600);
  }

  // ============================================
  // SOUND EFFECTS
  // ============================================

  /** Soft typewriter click */
  playTypeClick() {
    if (!this.ctx || this.muted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800 + Math.random() * 400, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    // High-pass to make it sound softer
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 500;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  /** Gentle heart pop — bubbly ascending tone */
  playHeartPop() {
    if (!this.ctx || this.muted) return;

    const now = this.ctx.currentTime;
    const freq = 300 + Math.random() * 200;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.1);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.8, now + 0.3);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  /** Celebration fanfare — ascending arpeggio + major chord */
  playCelebration() {
    if (!this.ctx || this.muted) return;

    const now = this.ctx.currentTime;

    // Ascending arpeggio: C5 → E5 → G5 → C6
    const arpNotes = [523.25, 659.25, 783.99, 1046.50];
    arpNotes.forEach((freq, i) => {
      const t = now + i * 0.12;
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.45);
    });

    // C major chord burst after arpeggio
    const chordTime = now + 0.5;
    const chordFreqs = [523.25, 659.25, 783.99, 1046.50]; // C5 E5 G5 C6
    chordFreqs.forEach((freq) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;

      const osc2 = this.ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = freq;
      osc2.detune.value = 8;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, chordTime);
      gain.gain.linearRampToValueAtTime(0.15, chordTime + 0.05);
      gain.gain.setValueAtTime(0.15, chordTime + 1.5);
      gain.gain.exponentialRampToValueAtTime(0.001, chordTime + 3);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(chordTime);
      osc.stop(chordTime + 3.1);
      osc2.start(chordTime);
      osc2.stop(chordTime + 3.1);
    });

    // Shimmer/sparkle on top
    [1318.50, 1567.98, 2093.00].forEach((freq, i) => {
      const t = chordTime + 0.3 + i * 0.15;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.04, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.85);
    });
  }

  // ============================================
  // MUTE / UNMUTE
  // ============================================

  async toggleMute() {
    if (!this.ctx) await this.init();

    this.muted = !this.muted;

    if (this.muted) {
      // Fade out
      this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);
    } else {
      // Fade in
      this.masterGain.gain.linearRampToValueAtTime(1, this.ctx.currentTime + 0.3);
    }

    return this.muted;
  }

  /** Start muted → fade in when user unmutes */
  async unmute() {
    if (!this.ctx) await this.init();
    if (!this.muted) return;

    this.muted = false;
    this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(1, this.ctx.currentTime + 0.5);
  }
}
