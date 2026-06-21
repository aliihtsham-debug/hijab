/**
 * ParticleSystem — Creates a galaxy of floating, glowing particles.
 * Stars that transition colors from blue→pink→gold across acts.
 */

import * as THREE from 'three';
import { PARTICLES, COLORS } from '../utils/constants.js';

export default class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = null;
    this.positions = null;
    this.colors = null;
    this.sizes = null;
    this.velocities = null;
    this.originals = null;
    this.time = 0;
    this._init();
  }

  _init() {
    const { count, radius, size } = PARTICLES;

    // Geometry
    const geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(count * 3);
    this.colors = new Float32Array(count * 3);
    this.sizes = new Float32Array(count);
    this.velocities = new Float32Array(count * 3);
    this.originals = new Float32Array(count * 3);

    // Distribute particles in a sphere
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Spherical distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * Math.cbrt(Math.random());

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      this.positions[i3] = x;
      this.positions[i3 + 1] = y;
      this.positions[i3 + 2] = z;
      this.originals[i3] = x;
      this.originals[i3 + 1] = y;
      this.originals[i3 + 2] = z;

      // Initial colors (star white / soft blue)
      const brightness = 0.5 + Math.random() * 0.5;
      this.colors[i3] = 0.85 * brightness;     // R
      this.colors[i3 + 1] = 0.85 * brightness; // G
      this.colors[i3 + 2] = 1.0 * brightness;  // B

      // Random sizes
      this.sizes[i] = size * (0.5 + Math.random() * 1.5);

      // Gentle velocities for floating
      this.velocities[i3] = (Math.random() - 0.5) * 0.02;
      this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
      this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    // Custom shader material for soft glowing particles
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uTime;
        uniform float uPixelRatio;

        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

          // Twinkle effect
          float twinkle = 0.7 + 0.3 * sin(uTime * 2.0 + position.x * 10.0 + position.y * 7.0);
          vAlpha = twinkle;

          gl_PointSize = size * uPixelRatio * (200.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          // Circular particle with soft glow
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;

          float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
          vec3 glow = vColor * (1.0 + smoothstep(0.3, 0.0, dist) * 0.5);

          gl_FragColor = vec4(glow, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);

    // Color state — track current RGB for smooth interpolation
    this.currentColorTarget = 'star';
    this.currentR = 0.85;
    this.currentG = 0.85;
    this.currentB = 1.0;
    this._transitionProgress = 0;
    this._transitionFrom = { r: 0.85, g: 0.85, b: 1.0 };
    this._transitionTo = { r: 0.85, g: 0.85, b: 1.0 };
  }

  update(delta, elapsed) {
    this.time = elapsed;
    const pos = this.particles.geometry.attributes.position.array;
    const { floatSpeed, floatAmplitude } = PARTICLES;

    for (let i = 0; i < pos.length / 3; i++) {
      const i3 = i * 3;

      pos[i3] = this.originals[i3] + Math.sin(elapsed * floatSpeed + i * 0.1) * floatAmplitude;
      pos[i3 + 1] = this.originals[i3 + 1] + Math.sin(elapsed * floatSpeed * 0.7 + i * 0.15) * floatAmplitude;
      pos[i3 + 2] = this.originals[i3 + 2] + Math.sin(elapsed * floatSpeed * 0.5 + i * 0.05) * floatAmplitude * 0.5;
    }

    this.particles.geometry.attributes.position.needsUpdate = true;
    this.particles.material.uniforms.uTime.value = elapsed;

    // Smoothly interpolate color transition
    if (this._transitionProgress < 1) {
      this._transitionProgress = Math.min(1, this._transitionProgress + delta * 0.4); // ~2.5s full transition
      const t = this._transitionProgress;
      // Ease the interpolation
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      this.currentR = this._transitionFrom.r + (this._transitionTo.r - this._transitionFrom.r) * ease;
      this.currentG = this._transitionFrom.g + (this._transitionTo.g - this._transitionFrom.g) * ease;
      this.currentB = this._transitionFrom.b + (this._transitionTo.b - this._transitionFrom.b) * ease;

      const count = PARTICLES.count;
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const brightness = 0.5 + (Math.sin(i * 3.7) * 0.5 + 0.5) * 0.5;
        this.colors[i3] = this.currentR * brightness;
        this.colors[i3 + 1] = this.currentG * brightness;
        this.colors[i3 + 2] = this.currentB * brightness;
      }
      this.particles.geometry.attributes.color.needsUpdate = true;
    }
  }

  // Start a smooth color transition to the target palette
  transitionColors(target) {
    const colorSets = {
      star: { r: 0.85, g: 0.85, b: 1.0 },
      pink: { r: 1.0, g: 0.42, b: 0.62 },
      gold: { r: 1.0, g: 0.84, b: 0.0 },
      mixed: { r: 0.95, g: 0.65, b: 0.75 },
    };

    const to = colorSets[target] || colorSets.star;
    this._transitionFrom = { r: this.currentR, g: this.currentG, b: this.currentB };
    this._transitionTo = { ...to };
    this._transitionProgress = 0;
    this.currentColorTarget = target;
  }

  dispose() {
    this.particles.geometry.dispose();
    this.particles.material.dispose();
    this.scene.remove(this.particles);
  }
}
