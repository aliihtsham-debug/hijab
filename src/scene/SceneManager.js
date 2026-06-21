/**
 * SceneManager — Sets up the Three.js scene, camera, renderer,
 * and handles the core render loop and resize events.
 */

import * as THREE from 'three';
import { CAMERA, COLORS } from '../utils/constants.js';

export default class SceneManager {
  constructor(container) {
    this.container = container;
    this.clock = new THREE.Clock();

    this._initScene();
    this._initCamera();
    this._initRenderer();
    this._initResize();

    this.updateCallbacks = [];
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(COLORS.midnightBlue, 0.008);
  }

  _initCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(
      CAMERA.fov, aspect, CAMERA.near, CAMERA.far
    );
    this.camera.position.set(0, 0, CAMERA.startZ);
    this.camera.lookAt(0, CAMERA.lookAtY, 0);
  }

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);
  }

  _initResize() {
    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);
  }

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  onUpdate(fn) {
    this.updateCallbacks.push(fn);
  }

  render() {
    let delta = this.clock.getDelta();

    // Clamp delta to prevent massive jumps after tab-switch or frame drops
    // 50ms = ~3 frames at 60fps, anything larger is a stall
    if (delta > 0.05) delta = 0.05;

    const elapsed = this.clock.getElapsedTime();

    // Run all registered update callbacks
    for (const fn of this.updateCallbacks) {
      fn(delta, elapsed);
    }

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    window.removeEventListener('resize', this._onResize);
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}
