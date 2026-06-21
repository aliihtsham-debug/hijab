/**
 * Lighting — Romantic ambient + animated point lights.
 * Creates a dreamy, warm atmosphere with gentle breathing effects.
 * Fixes: smooth color transitions, animated light positions for Act 2.
 */

import * as THREE from 'three';
import { COLORS } from '../utils/constants.js';

export default class Lighting {
  constructor(scene) {
    this.scene = scene;
    this.time = 0;
    this._init();
  }

  _init() {
    this.ambient = new THREE.AmbientLight(COLORS.softBlue, 0.3);
    this.scene.add(this.ambient);

    this.pinkLight = new THREE.PointLight(COLORS.rosePink, 2.0, 100);
    this.pinkLight.position.set(0, 5, 10);
    this.scene.add(this.pinkLight);

    this.goldLight = new THREE.PointLight(COLORS.warmGold, 1.5, 80);
    this.goldLight.position.set(15, -5, 5);
    this.scene.add(this.goldLight);

    this.whiteLight = new THREE.PointLight(COLORS.warmWhite, 1.0, 80);
    this.whiteLight.position.set(-15, 3, 8);
    this.scene.add(this.whiteLight);

    this.rimLight = new THREE.PointLight(COLORS.deepPurple, 1.2, 60);
    this.rimLight.position.set(0, 0, -15);
    this.scene.add(this.rimLight);

    this.animatedLights = [
      { light: this.pinkLight, baseIntensity: 2.0, speed: 0.8, phase: 0 },
      { light: this.goldLight, baseIntensity: 1.5, speed: 0.6, phase: Math.PI / 3 },
      { light: this.whiteLight, baseIntensity: 1.0, speed: 1.0, phase: Math.PI / 2 },
      { light: this.rimLight, baseIntensity: 1.2, speed: 0.5, phase: Math.PI },
    ];

    // Track current color RGB for smooth transitions
    this._currentColors = {
      ambient: new THREE.Color(COLORS.softBlue),
      pink: new THREE.Color(COLORS.rosePink),
      gold: new THREE.Color(COLORS.warmGold),
      white: new THREE.Color(COLORS.warmWhite),
      rim: new THREE.Color(COLORS.deepPurple),
    };
  }

  update(delta, elapsed) {
    this.time = elapsed;

    for (const item of this.animatedLights) {
      item.light.intensity =
        item.baseIntensity +
        Math.sin(elapsed * item.speed + item.phase) * 0.3;
    }

    // Smoothly interpolate light colors toward targets
    const lerpSpeed = 2.0 * delta;
    this.ambient.color.lerp(this._currentColors.ambient, lerpSpeed);
    this.pinkLight.color.lerp(this._currentColors.pink, lerpSpeed);
    this.goldLight.color.lerp(this._currentColors.gold, lerpSpeed);
    this.whiteLight.color.lerp(this._currentColors.white, lerpSpeed);
    this.rimLight.color.lerp(this._currentColors.rim, lerpSpeed);
  }

  transitionToAct(act) {
    switch (act) {
      case 1:
        this._currentColors.ambient.setHex(COLORS.softBlue);
        this._currentColors.pink.setHex(COLORS.rosePink);
        break;
      case 2:
        this._currentColors.ambient.setHex(COLORS.deepPurple);
        this._currentColors.pink.setHex(COLORS.softPink);
        // Boost pink light intensity for Act 2 romance
        this.animatedLights[0].baseIntensity = 2.5;
        break;
      case 3:
        this._currentColors.ambient.setHex(COLORS.midnightBlue);
        this._currentColors.gold.setHex(COLORS.warmGold);
        this._currentColors.pink.setHex(COLORS.roseGold);
        this.animatedLights[0].baseIntensity = 2.0;
        break;
      case 4:
        this._currentColors.ambient.setHex(COLORS.deepPurple);
        this._currentColors.pink.setHex(COLORS.rosePink);
        this._currentColors.gold.setHex(COLORS.warmGold);
        break;
      case 5:
        this._currentColors.ambient.setHex(COLORS.roseGold);
        this._currentColors.pink.setHex(COLORS.softPink);
        this._currentColors.gold.setHex(COLORS.warmGold);
        this._currentColors.white.setHex(COLORS.warmWhite);
        this.animatedLights[0].baseIntensity = 2.5;
        break;
    }
  }
}
