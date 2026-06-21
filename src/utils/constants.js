/**
 * Constants — all messages, colors, and timing in one place.
 * Customize these to personalize the experience.
 */

// ---- Color Palette ----
export const COLORS = {
  midnightBlue: 0x0a0a2e,
  deepPurple: 0x1a0a3e,
  starWhite: 0xe8e8ff,
  softBlue: 0x6699ff,
  rosePink: 0xff6b9d,
  softPink: 0xff9eb5,
  roseGold: 0xb76e79,
  warmGold: 0xffd700,
  warmWhite: 0xfff5f0,
  heartPink: 0xff3366,
  heartGold: 0xffcc00,
};

// ---- Act Timing (milliseconds) ----
export const TIMING = {
  loadingDuration: 2500,
  act1Start: 0,
  act1Duration: 6000,
  act2Start: 6000,
  act2Duration: 8000,
  act3Start: 14000,
  act3Duration: 10000,
  act4Start: 24000,
  act4Duration: 14000,
  act5Start: 38000,
  totalDuration: 38000,
  transitionDuration: 1500,
};

// ---- Messages ----
export const MESSAGES = {
  act1: "Every star in the sky reminds me of you...",
  act2: "You make my heart float in ways I can't explain ✨",
  act3: "There's something I've been wanting to tell you...",
  act4: [
    "From the moment I met you...",
    "Every conversation felt like magic...",
    "You became my favorite thought...",
    "Hijab, you are my everything 💫",
  ],
  herName: "Hijab",
  nameSubtitle: "The most beautiful name in the universe",
};

// ---- Particle System ----
export const PARTICLES = {
  count: 2500,
  radius: 80,
  size: 0.15,
  floatSpeed: 0.3,
  floatAmplitude: 0.5,
};

// ---- Heart Field ----
export const HEARTS = {
  count: 80,
  minSize: 0.3,
  maxSize: 1.2,
  floatSpeed: 0.4,
  rotationSpeed: 0.5,
  spawnRadius: 60,
  floatHeight: 80,
};

// ---- Camera ----
export const CAMERA = {
  fov: 60,
  near: 0.1,
  far: 200,
  startZ: 40,
  endZ: 20,
  lookAtY: 0,
};

// ---- Proposal Card ----
export const PROPOSAL = {
  messages: [
    "My dearest Hijab,",
    "Every moment with you feels like a beautiful dream...",
    "You are my starlight, my everything.",
  ],
  question: "Will you be mine? 💍",
  buttons: [
    { text: "Yes 💕", intensity: 1 },
    { text: "Absolutely! 💖", intensity: 2 },
    { text: "A thousand times yes! 🌹", intensity: 3 },
  ],
  celebrationTitle: "She said Yes! 🎉",
  celebrationMessage: "You just made me the happiest person alive ❤️",
  celebrationSub: "Forever starts now, Hijab 🌹",
};
