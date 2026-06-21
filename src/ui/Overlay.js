/**
 * Overlay — Manages the DOM overlay UI, orchestrating all screens
 * (loading, messages, name reveal, proposal, celebration).
 *
 * Fixes: batched opacity changes, no transition conflicts, proper cleanup.
 */

import TypingText from './TypingText.js';
import ProposalCard from './ProposalCard.js';
import { MESSAGES } from '../utils/constants.js';

export default class Overlay {
  constructor() {
    // Screens
    this.loadingScreen = document.getElementById('loading-screen');
    this.messageContainer = document.getElementById('message-container');
    this.actMessage = document.getElementById('act-message');
    this.nameReveal = document.getElementById('name-reveal');
    this.herName = document.getElementById('her-name');
    this.nameSubtitle = document.getElementById('name-subtitle');
    this.proposalCard = new ProposalCard();
    this.celebration = document.getElementById('celebration');
    this.skipBtn = document.getElementById('skip-btn');

    // Typing text controller
    this.typingText = new TypingText(this.actMessage);

    // Callback for per-character typing sound (set by main app)
    this.onTypeCallback = null;

    // State
    this.currentAct = 0;
    this._transitioning = false;
    this._skipRequested = false;

    this.proposalCard.onYes((intensity) => {
      this._handleYes(intensity);
    });
  }

  /** Set a callback that fires on each typed character */
  setOnTypeCallback(fn) {
    this.onTypeCallback = fn;
  }

  _handleYes(intensity) {
    this.proposalCard.hide();
    setTimeout(() => {
      this.celebration.classList.remove('hidden');
    }, 1000);
  }

  onYes(callback) {
    this._yesCallback = callback;
  }

  enableSkip() {
    this.skipBtn.classList.remove('hidden');
    this.skipBtn.addEventListener('click', () => {
      this._skipRequested = true;
    });
  }

  shouldSkip() {
    return this._skipRequested;
  }


  // ---- Transition between acts ----
  async transitionToAct(act) {
    if (this.currentAct === act || this._transitioning) return;
    this._transitioning = true;
    this.currentAct = act;

    try {
      switch (act) {
        case 1:
          await this._showMessage(MESSAGES.act1);
          break;
        case 2:
          await this._showMessage(MESSAGES.act2);
          break;
        case 3:
          await this._showNameReveal();
          break;
        case 4:
          await this._showStorySequence();
          break;
        case 5:
          await this._showProposal();
          break;
      }
    } finally {
      this._transitioning = false;
    }
  }

  /**
   * Show a message with typewriter effect.
   * Fix: opacity is set cleanly — fade in, type, fade out — no mid-flight resets.
   */
  async _showMessage(text) {
    // Hide name reveal, show message container
    this.nameReveal.classList.add('hidden');
    this.messageContainer.classList.remove('hidden');

    // Reset any lingering styles from previous act
    this.actMessage.style.transition = '';
    this.actMessage.style.opacity = '0';
    this.actMessage.style.willChange = 'opacity';

    // Small delay to let the browser register opacity:0 before we transition
    await this._wait(50);

    // Fade in
    this.actMessage.style.transition = 'opacity 1s ease';
    this.actMessage.style.opacity = '1';

    // Wait for fade-in to complete before typing
    await this._wait(1000);

    // Type the message (no CSS opacity transition running during typing)
    await this.typingText.type(text, 65, null, this.onTypeCallback);

    // Pause after typing completes
    await this._wait(2000);

    // Fade out — single clean transition
    this.actMessage.style.transition = 'opacity 1s ease';
    this.actMessage.style.opacity = '0';

    // Wait for fade-out to complete
    await this._wait(1000);

    // Clean up
    this.actMessage.style.willChange = '';
  }

  /**
   * Name reveal with per-letter animation.
   * Fix: parent opacity no longer fights child transitions.
   */
  async _showNameReveal() {
    this.messageContainer.classList.add('hidden');
    this.nameReveal.classList.remove('hidden');

    // Reset
    this.herName.style.opacity = '1';
    this.herName.style.transition = '';
    this.herName.textContent = '';
    this.nameSubtitle.style.opacity = '0';
    this.nameSubtitle.style.transition = '';
    this.nameSubtitle.style.display = '';

    const name = MESSAGES.herName;

    // Animate each letter in with staggered delay using pure CSS transitions
    for (let i = 0; i < name.length; i++) {
      const letter = document.createElement('span');
      letter.textContent = name[i];
      letter.style.display = 'inline-block';
      letter.style.opacity = '0';
      letter.style.transform = 'translateY(30px) scale(0.5)';
      letter.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      // Stagger via transitionDelay
      letter.style.transitionDelay = `${i * 0.15}s`;
      this.herName.appendChild(letter);

      // Force reflow so the browser registers the initial state
      void letter.offsetHeight;

      // Trigger animation in next frame
      requestAnimationFrame(() => {
        letter.style.opacity = '1';
        letter.style.transform = 'translateY(0) scale(1)';
      });

      // Wait for this letter's animation to mostly complete before next
      await this._wait(120);
    }

    // Wait for all letter animations to finish
    await this._wait(1200);

    // Show subtitle — use double-rAF for clean transition
    this.nameSubtitle.style.display = '';
    this.nameSubtitle.style.transition = 'none';
    this.nameSubtitle.style.opacity = '0';
    this.nameSubtitle.style.willChange = 'opacity';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.nameSubtitle.style.transition = 'opacity 1.5s ease';
        this.nameSubtitle.style.opacity = '1';
      });
    });

    await this._wait(4000);

    // Fade out — use will-change on parent only, children inherit via opacity stacking
    this.herName.style.transition = 'opacity 1.5s ease';
    this.herName.style.opacity = '0';
    this.nameSubtitle.style.transition = 'opacity 1.5s ease';
    this.nameSubtitle.style.opacity = '0';

    await this._wait(1600);

    this.herName.style.willChange = '';
    this.nameSubtitle.style.willChange = '';
  }

  async _showStorySequence() {
    this.nameReveal.classList.add('hidden');
    this.messageContainer.classList.remove('hidden');

    // Reset message element
    this.actMessage.style.transition = '';
    this.actMessage.style.opacity = '0';
    this.actMessage.style.willChange = 'opacity';

    await this._wait(50);

    // Fade in before typing starts
    this.actMessage.style.transition = 'opacity 0.8s ease';
    this.actMessage.style.opacity = '1';
    await this._wait(900);

    await this.typingText.typeSequence(
      MESSAGES.act4,
      50,
      2500,
      this.onTypeCallback
    );

    // Wait after last message, then fade it out
    await this._wait(3000);

    this.actMessage.style.transition = 'opacity 1.2s ease';
    this.actMessage.style.opacity = '0';
    await this._wait(1300);

    this.actMessage.style.willChange = '';
  }

  async _showProposal() {
    this.messageContainer.classList.add('hidden');
    this.proposalCard.show();
    this.skipBtn.classList.add('hidden');
  }

  hideLoading() {
    this.loadingScreen.style.opacity = '1';
    this.loadingScreen.style.transition = 'opacity 0.8s ease';

    requestAnimationFrame(() => {
      this.loadingScreen.style.opacity = '0';
      setTimeout(() => {
        this.loadingScreen.classList.add('hidden');
      }, 800);
    });
  }

  setCelebrationData(title, message, sub) {
    const celebTitle = document.querySelector('.celebration-title');
    const celebMsg = document.querySelector('.celebration-message');
    const celebSub = document.querySelector('.celebration-sub');

    if (title) celebTitle.textContent = title;
    if (message) celebMsg.textContent = message;
    if (sub) celebSub.textContent = sub;
  }

  _wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  dispose() {
    this.proposalCard.dispose();
  }
}
