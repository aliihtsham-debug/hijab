/**
 * main.js — Entry point for the romantic proposal website.
 * Fixes: GSAP animation killing, delta clamping, staggered celebration effects.
 */

import * as THREE from 'three';
import gsap from 'gsap';
import SceneManager from './scene/SceneManager.js';
import Lighting from './scene/Lighting.js';
import ParticleSystem from './scene/ParticleSystem.js';
import HeartField from './scene/HeartField.js';
import Overlay from './ui/Overlay.js';
import AudioManager from './scene/AudioManager.js';
import { TIMING, COLORS } from './utils/constants.js';

// ============================================
// APP INITIALIZATION
// ============================================

class ProposalApp {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.overlay = new Overlay();
    this.audio = new AudioManager();
    this.clock = null;
    this.celebrationActive = false;
    this.celebrationHearts = [];
    this._currentAct = 0;
    this._lastHeartPopTime = 0;

    this._init();
  }

  async _init() {
    this.sceneManager = new SceneManager(this.container);
    this.lighting = new Lighting(this.sceneManager.scene);
    this.particles = new ParticleSystem(this.sceneManager.scene);
    this.hearts = new HeartField(this.sceneManager.scene);

    this.sceneManager.onUpdate((delta, elapsed) => this._update(delta, elapsed));

    this.overlay.onYes((intensity) => this._onYes(intensity));
    this.overlay.enableSkip();

    // Wire up typing sound callback
    this.overlay.setOnTypeCallback(() => this.audio.playTypeClick());

    // On first user gesture, try to init audio (browser may require gesture for AudioContext)
    this._setupFirstInteractionAudio();

    this._animate();

    await this._wait(TIMING.loadingDuration);
    this.overlay.hideLoading();

    // Initialize audio — fire-and-forget, never blocks the act sequence
    this._initAudioAsync();

    this._startActSequence();
  }

  /**
   * On first user click/touch, try to init + resume audio.
   * Browsers often require a user gesture before playing sound.
   * This ensures music starts on the first interaction (skip button, clicking, etc.)
   */
  _setupFirstInteractionAudio() {
    const handler = () => {
      if (!this.audio._initialized) {
        this.audio.init();
      }
      this.audio._ensureResumed().then(() => {
        this.audio.unmute();
        this.audio.startMusic();
      });
      document.removeEventListener('click', handler);
      document.removeEventListener('touchstart', handler);
    };
    document.addEventListener('click', handler);
    document.addEventListener('touchstart', handler);
  }

  /**
   * Initialize audio in the background — never blocks the act sequence.
   * Uses a timeout guard so a stuck ctx.resume() can't freeze the app.
   */
  _initAudioAsync() {
    (async () => {
      try {
        this.audio.init();
        // Timeout guard: if resume() hangs, skip audio after 2s
        await Promise.race([
          this.audio._ensureResumed(),
          this._wait(2000),
        ]);
        this.audio.unmute();
        this.audio.startMusic();
      } catch (_) {
        // Audio not available — app still works perfectly
      }
    })();
  }

  /**
   * Open WhatsApp with Hijab's response.
   * Uses the WhatsApp click-to-chat API (wa.me) — works on mobile and desktop.
   */
  _sendWhatsAppMessage(intensity) {
    const phone = '923402156834';
    const responses = {
      1: 'Yes 💕',
      2: 'Absolutely! 💖',
      3: 'A thousand times yes! 🌹',
    };
    const choice = responses[intensity] || 'Yes!';
    const message = encodeURIComponent(
      `She clicked: ${choice} 💍\n\n— Your proposal website ❤️`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  }

  // ============================================
  // ACT SEQUENCE
  // ============================================

  /**
   * Act sequence: each act waits for the previous one to fully finish
   * (including all async transitions) before the next begins.
   * This prevents Act 5 from firing while Act 4 is still typing.
   */
  async _startActSequence() {
    const acts = [1, 2, 3, 4, 5];

    for (const act of acts) {
      if (this.celebrationActive) return;

      // Check for skip — jump straight to act 5
      if (this.overlay.shouldSkip()) {
        this._transitionToAct(5);
        await this._waitForTransition();
        return;
      }

      this._transitionToAct(act);

      // Wait for this act's overlay transition to fully complete
      await this._waitForTransition();

      // Small buffer between acts for visual breathing room
      await this._wait(500);
    }
  }

  /**
   * Wait until the overlay finishes its current transition.
   * Polls the _transitioning flag at 60fps.
   */
  _waitForTransition() {
    return new Promise((resolve) => {
      const check = () => {
        if (!this.overlay._transitioning) {
          resolve();
        } else {
          requestAnimationFrame(check);
        }
      };
      requestAnimationFrame(check);
    });
  }

  _transitionToAct(act) {
    if (this._currentAct === act) return;
    this._currentAct = act;

    this.lighting.transitionToAct(act);

    switch (act) {
      case 1:
        this.particles.transitionColors('star');
        break;
      case 2:
        this.particles.transitionColors('pink');
        this.hearts.activate();
        break;
      case 3:
        this.particles.transitionColors('mixed');
        break;
      case 4:
        this.particles.transitionColors('gold');
        break;
      case 5:
        this.particles.transitionColors('pink');
        break;
    }

    this._animateCameraForAct(act);
    this.overlay.transitionToAct(act);
  }

  /**
   * Animate camera for each act.
   * Fix: kill all previous camera animations before starting new ones
   * so yoyo/repeat tweens don't fight with new position tweens.
   */
  _animateCameraForAct(act) {
    const camera = this.sceneManager.camera;

    // Kill ALL ongoing animations on camera.position and camera.rotation
    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(camera.rotation);

    switch (act) {
      case 1:
        gsap.to(camera.position, {
          z: 25,
          duration: TIMING.act1Duration / 1000,
          ease: 'power1.inOut',
        });
        break;
      case 2:
        // Move to act-2 position, then add continuous gentle sway
        gsap.to(camera.position, {
          z: 22,
          duration: 3,
          ease: 'power2.inOut',
        });
        // Continuous sway — GSAP handles this cleanly without fighting
        gsap.to(camera.position, {
          x: 3,
          y: 1,
          duration: 4,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
        });
        break;
      case 3:
        gsap.to(camera.position, {
          x: 0,
          y: 0,
          z: 30,
          duration: 3,
          ease: 'power2.inOut',
        });
        gsap.to(camera.rotation, {
          x: 0,
          y: 0,
          z: 0,
          duration: 3,
          ease: 'power2.inOut',
        });
        break;
      case 4:
        gsap.to(camera.position, {
          z: 18,
          y: -1,
          duration: TIMING.act4Duration / 1000,
          ease: 'sine.inOut',
        });
        break;
      case 5:
        gsap.to(camera.position, {
          x: 0,
          y: 0,
          z: 20,
          duration: 3,
          ease: 'power2.inOut',
        });
        gsap.to(camera.rotation, {
          x: 0,
          y: 0,
          z: 0,
          duration: 3,
          ease: 'power2.inOut',
        });
        break;
    }
  }

  // ============================================
  // CELEBRATION (Yes clicked!)
  // ============================================

  _onYes(intensity) {
    this.celebrationActive = true;

    // 0. Open WhatsApp with her response
    this._sendWhatsAppMessage(intensity);

    // 1. Play celebration fanfare (safe — wrapped internally)
    if (this.audio) this.audio.playCelebration();

    // 1. Explode hearts
    this.hearts.explode();

    // 2. Create celebration heart burst
    this._createCelebrationBurst(intensity);

    // 3. Flash the background — staggered
    this.sceneManager.scene.fog.color.setHex(COLORS.rosePink);

    gsap.to(this.sceneManager.scene.fog.color, {
      r: (COLORS.midnightBlue >> 16) & 0xff,
      g: (COLORS.midnightBlue >> 8) & 0xff,
      b: COLORS.midnightBlue & 0xff,
      duration: 3,
      ease: 'power2.out',
      delay: 0.2,
    });

    // 4. Boost particle colors to gold
    this.particles.transitionColors('gold');

    // 5. Ramp up lighting — staggered with delay
    gsap.to(this.lighting.pinkLight, {
      intensity: 5,
      duration: 1,
      ease: 'power2.out',
      delay: 0.1,
    });
    gsap.to(this.lighting.goldLight, {
      intensity: 4,
      duration: 1,
      ease: 'power2.out',
      delay: 0.3,
    });

    // 6. Camera shake — reduced intensity for less jank
    const cam = this.sceneManager.camera;
    gsap.to(cam.position, {
      x: '+=0.3',
      duration: 0.08,
      yoyo: true,
      repeat: 6,
      ease: 'power2.inOut',
      delay: 0,
    });

    // 7. After celebration, settle into gentle mode
    setTimeout(() => {
      this._settleCelebration();
    }, 5000);
  }

  _createCelebrationBurst(intensity) {
    const count = 200 * intensity;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = [];
    const colors = new Float32Array(count * 3);

    const colorOptions = [
      new THREE.Color(COLORS.rosePink),
      new THREE.Color(COLORS.warmGold),
      new THREE.Color(COLORS.softPink),
      new THREE.Color(COLORS.warmWhite),
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = 0;
      positions[i3 + 1] = 0;
      positions[i3 + 2] = 0;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 0.5 + Math.random() * 1.5;

      velocities.push({
        x: Math.sin(phi) * Math.cos(theta) * speed,
        y: Math.sin(phi) * Math.sin(theta) * speed,
        z: Math.cos(phi) * speed,
      });

      const color = colorOptions[Math.floor(Math.random() * colorOptions.length)];
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const burst = new THREE.Points(geometry, material);
    burst.userData = { velocities, life: 3 };
    this.sceneManager.scene.add(burst);
    this.celebrationHearts.push(burst);
  }

  _settleCelebration() {
    gsap.to(this.lighting.pinkLight, {
      intensity: 2.5,
      duration: 3,
    });
    gsap.to(this.lighting.goldLight, {
      intensity: 2.0,
      duration: 3,
    });

    // Gentle camera float — single tween, no repeat to avoid jank
    gsap.to(this.sceneManager.camera.position, {
      y: 1,
      duration: 4,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });
  }

  // ============================================
  // RENDER LOOP
  // ============================================

  _update(delta, elapsed) {
    // Clamp delta to prevent teleportation after frame drops / tab switches
    const clampedDelta = Math.min(delta, 0.05);

    this.lighting.update(clampedDelta, elapsed);
    this.particles.update(clampedDelta, elapsed);
    this.hearts.update(clampedDelta, elapsed);

    // Heart pop sounds — throttle to every 0.8s so it's not overwhelming
    if (this.hearts.active && elapsed - this._lastHeartPopTime > 0.8) {
      this.audio.playHeartPop();
      this._lastHeartPopTime = elapsed;
    }

    this._updateCelebrationParticles(clampedDelta);
  }

  _updateCelebrationParticles(delta) {
    // Use clamped delta here too
    const clampedDelta = Math.min(delta, 0.05);

    for (let i = this.celebrationHearts.length - 1; i >= 0; i--) {
      const burst = this.celebrationHearts[i];
      const positions = burst.geometry.attributes.position.array;
      const vels = burst.userData.velocities;

      burst.userData.life -= clampedDelta;
      burst.material.opacity = Math.max(0, burst.userData.life / 3);

      if (burst.userData.life <= 0) {
        this.sceneManager.scene.remove(burst);
        burst.geometry.dispose();
        burst.material.dispose();
        this.celebrationHearts.splice(i, 1);
        continue;
      }

      for (let j = 0; j < vels.length; j++) {
        const j3 = j * 3;
        positions[j3] += vels[j].x * clampedDelta * 10;
        positions[j3 + 1] += vels[j].y * clampedDelta * 10;
        positions[j3 + 2] += vels[j].z * clampedDelta * 10;

        vels[j].y -= clampedDelta * 0.5;
      }

      burst.geometry.attributes.position.needsUpdate = true;
    }
  }

  _animate() {
    requestAnimationFrame(() => this._animate());
    this.sceneManager.render();
  }

  // ============================================
  // UTILITIES
  // ============================================


  _wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================
// CURSOR HEART TRAIL
// ============================================

function initHeartTrail() {
  let lastTrail = 0;
  document.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastTrail < 80) return;
    lastTrail = now;

    const heart = document.createElement('div');
    heart.className = 'heart-trail';
    heart.textContent = '💖';
    heart.style.left = e.clientX + 'px';
    heart.style.top = e.clientY + 'px';
    heart.style.fontSize = (12 + Math.random() * 10) + 'px';
    document.body.appendChild(heart);

    setTimeout(() => {
      if (heart.parentNode) heart.parentNode.removeChild(heart);
    }, 1000);
  });
}

// ============================================
// BOOT
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  initHeartTrail();
  new ProposalApp();
});
