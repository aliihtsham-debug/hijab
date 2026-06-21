/**
 * HeartField — Creates and animates 3D floating heart meshes.
 * Hearts rise from below with gentle bobbing and rotation.
 * Fixes: gradual activation, better 3D spread, smoother animation.
 */

import * as THREE from 'three';
import { HEARTS, COLORS } from '../utils/constants.js';

export default class HeartField {
  constructor(scene) {
    this.scene = scene;
    this.hearts = [];
    this.time = 0;
    this.active = false;
    this._init();
  }

  _createExtrudedHeartGeometry(scale = 1) {
    const shape = new THREE.Shape();
    const x = 0, y = 0;
    shape.moveTo(x, y + 0.25 * scale);
    shape.bezierCurveTo(x, y + 0.25 * scale, x - 0.25 * scale, y, x - 0.25 * scale, y);
    shape.bezierCurveTo(x - 0.25 * scale, y - 0.2 * scale, x, y - 0.35 * scale, x, y - 0.5 * scale);
    shape.bezierCurveTo(x, y - 0.35 * scale, x + 0.25 * scale, y - 0.2 * scale, x + 0.25 * scale, y);
    shape.bezierCurveTo(x + 0.25 * scale, y, x, y + 0.25 * scale, x, y + 0.25 * scale);

    const extrudeSettings = {
      depth: 0.15 * scale,
      bevelEnabled: true,
      bevelThickness: 0.05 * scale,
      bevelSize: 0.05 * scale,
      bevelSegments: 3,
      curveSegments: 24,
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();
    return geometry;
  }

  _init() {
    const { count, minSize, maxSize, spawnRadius, floatHeight } = HEARTS;

    // Create heart geometries at different sizes
    const geometries = [];
    for (let i = 0; i < 5; i++) {
      const s = minSize + (maxSize - minSize) * (i / 4);
      geometries.push(this._createExtrudedHeartGeometry(s));
    }

    const materials = [
      new THREE.MeshPhongMaterial({
        color: COLORS.rosePink, emissive: COLORS.rosePink,
        emissiveIntensity: 0.4, transparent: true, opacity: 0.85,
        shininess: 80, side: THREE.DoubleSide,
      }),
      new THREE.MeshPhongMaterial({
        color: COLORS.softPink, emissive: COLORS.softPink,
        emissiveIntensity: 0.3, transparent: true, opacity: 0.8,
        shininess: 80, side: THREE.DoubleSide,
      }),
      new THREE.MeshPhongMaterial({
        color: COLORS.warmGold, emissive: COLORS.warmGold,
        emissiveIntensity: 0.5, transparent: true, opacity: 0.85,
        shininess: 100, side: THREE.DoubleSide,
      }),
      new THREE.MeshPhongMaterial({
        color: COLORS.roseGold, emissive: COLORS.roseGold,
        emissiveIntensity: 0.35, transparent: true, opacity: 0.8,
        shininess: 80, side: THREE.DoubleSide,
      }),
    ];

    for (let i = 0; i < count; i++) {
      const geomIndex = Math.floor(Math.random() * geometries.length);
      const matIndex = Math.floor(Math.random() * materials.length);
      const mesh = new THREE.Mesh(geometries[geomIndex], materials[matIndex]);

      // Spread hearts in a cylinder volume — wider z spread for 3D depth
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * spawnRadius;
      mesh.position.set(
        Math.cos(angle) * radius,
        -floatHeight / 2 + Math.random() * floatHeight,
        Math.sin(angle) * radius - 15 - Math.random() * 20  // spread from -15 to -35
      );

      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      mesh.userData = {
        floatSpeed: 0.3 + Math.random() * 0.5,
        floatAmplitude: 0.5 + Math.random() * 1.5,
        rotSpeedX: (Math.random() - 0.5) * 0.5,
        rotSpeedY: (Math.random() - 0.5) * 0.5,
        rotSpeedZ: (Math.random() - 0.5) * 0.3,
        phase: Math.random() * Math.PI * 2,
        baseY: mesh.position.y,
        riseSpeed: 0.5 + Math.random() * 0.8,  // faster rise so hearts cross screen
        // Stagger activation: each heart becomes visible at a different time
        activateDelay: Math.random() * 4,  // 0-4 seconds delay
        activated: false,
      };

      mesh.visible = false;
      mesh.material.opacity = 0;  // start fully transparent
      this.hearts.push(mesh);
      this.scene.add(mesh);
    }
  }

  activate() {
    this.active = true;
    // Don't make all hearts visible at once — let them stagger in via update()
    for (const heart of this.hearts) {
      heart.userData.activated = false;
      heart.visible = false;
      heart.material.opacity = 0;
    }
  }

  deactivate() {
    this.active = false;
    for (const heart of this.hearts) {
      heart.visible = false;
    }
  }

  update(delta, elapsed) {
    if (!this.active) return;

    this.time = elapsed;
    const { floatHeight } = HEARTS;

    for (const heart of this.hearts) {
      const ud = heart.userData;

      // Staggered activation: each heart fades in after its delay
      if (!ud.activated) {
        if (elapsed >= ud.activateDelay) {
          ud.activated = true;
          heart.visible = true;
        } else {
          continue;  // not yet time for this heart
        }
      }

      // Fade in smoothly
      if (heart.material.opacity < 0.85) {
        heart.material.opacity = Math.min(0.85, heart.material.opacity + delta * 0.8);
      }

      // Float upward
      heart.position.y += ud.riseSpeed * delta;

      // Sinusoidal horizontal drift
      heart.position.x += Math.sin(elapsed * ud.floatSpeed + ud.phase) * ud.floatAmplitude * delta;
      heart.position.z += Math.cos(elapsed * ud.floatSpeed * 0.7 + ud.phase) * ud.floatAmplitude * 0.5 * delta;

      // Gentle rotation
      heart.rotation.x += ud.rotSpeedX * delta;
      heart.rotation.y += ud.rotSpeedY * delta;
      heart.rotation.z += ud.rotSpeedZ * delta;

      // Respawn when off screen
      if (heart.position.y > floatHeight / 2 + 10) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * HEARTS.spawnRadius;
        heart.position.set(
          Math.cos(angle) * radius,
          -floatHeight / 2 - Math.random() * 5,
          Math.sin(angle) * radius - 15 - Math.random() * 20
        );
        heart.userData.baseY = heart.position.y;
        // Reset activation for respawned hearts so they fade in again
        heart.userData.activated = false;
        heart.userData.activateDelay = elapsed + Math.random() * 2;
        heart.visible = false;
        heart.material.opacity = 0;
      }
    }
  }

  explode() {
    for (const heart of this.hearts) {
      heart.userData.riseSpeed = 3 + Math.random() * 5;
      heart.userData.floatAmplitude = 5 + Math.random() * 5;
      const dir = heart.position.clone().normalize();
      heart.userData.explodeDir = dir;
      heart.userData.explodeSpeed = 2 + Math.random() * 4;
    }
  }

  dispose() {
    for (const heart of this.hearts) {
      this.scene.remove(heart);
    }
    this.hearts = [];
  }
}
