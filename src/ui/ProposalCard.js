/**
 * ProposalCard — The final "Will you be mine?" card with buttons.
 * Fixes: transition guard, proper cleanup, no conflicting animations.
 */

export default class ProposalCard {
  constructor() {
    this.cardEl = document.getElementById('proposal-card');
    this.onYesCallback = null;
    this._hiding = false;
    this._init();
  }

  _init() {
    const buttons = document.querySelectorAll('.yes-btn');
    buttons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const intensity = parseInt(e.currentTarget.dataset.intensity, 10);
        this._handleYes(intensity);
      });
    });
  }

  onYes(callback) {
    this.onYesCallback = callback;
  }

  _handleYes(intensity) {
    if (this.onYesCallback) {
      this.onYesCallback(intensity);
    }
  }

  show() {
    // If a hide() is still in progress, cancel it
    this._hiding = false;

    this.cardEl.classList.remove('hidden');
    this.cardEl.style.transition = 'none';
    this.cardEl.style.opacity = '0';
    this.cardEl.style.transform = 'scale(0.8) translateY(30px)';
    this.cardEl.style.willChange = 'opacity, transform';

    // Double rAF: paint initial state, then start transition
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.cardEl.style.transition = 'opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1), transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)';
        this.cardEl.style.opacity = '1';
        this.cardEl.style.transform = 'scale(1) translateY(0)';
      });
    });
  }

  hide() {
    this._hiding = true;
    this.cardEl.style.willChange = 'opacity, transform';
    this.cardEl.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    this.cardEl.style.opacity = '0';
    this.cardEl.style.transform = 'scale(0.9) translateY(-20px)';

    setTimeout(() => {
      if (this._hiding) {
        this.cardEl.classList.add('hidden');
        this.cardEl.style.willChange = '';
      }
    }, 800);
  }

  dispose() {}
}
