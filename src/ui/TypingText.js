/**
 * TypingText — Typewriter effect for romantic messages.
 * Fixes: no CSS transition conflicts, proper cleanup, GPU-friendly.
 */

export default class TypingText {
  constructor(element) {
    this.element = element;
    this.cursorElement = null;
    this.typing = false;
    this._typeInterval = null;
    this._ensureCursor();
  }

  _ensureCursor() {
    if (!this.cursorElement) {
      this.cursorElement = document.createElement('span');
      this.cursorElement.className = 'typing-cursor';
      this.cursorElement.textContent = '|';
      // Use opacity animation instead of border-color (no border needed)
      this.cursorElement.style.cssText =
        'margin-left: 2px; color: var(--soft-pink); opacity: 1;';
    }
  }

  /** Cancel any in-flight typing or transitions */
  _cancel() {
    if (this._typeInterval) {
      clearInterval(this._typeInterval);
      this._typeInterval = null;
    }
    this.typing = false;
    // Remove any lingering transition styles
    this.element.style.transition = '';
    this.element.style.opacity = '';
    this.element.style.willChange = '';
  }

  /**
   * Type out a string with a typewriter effect.
   * Uses a plain text node (not childNodes[0]) to avoid layout thrashing.
   */
  type(text, speed = 60, onComplete = null) {
    return new Promise((resolve) => {
      // Cancel anything in progress first
      this._cancel();

      this.typing = true;
      this.element.classList.remove('hidden');

      // Use a dedicated text node so we never touch innerHTML or childNodes
      const textNode = document.createTextNode('');
      this.element.textContent = '';
      this.element.appendChild(textNode);
      this.element.appendChild(this.cursorElement);

      // Hint to browser for compositing
      this.element.style.willChange = 'opacity';

      let i = 0;
      this._typeInterval = setInterval(() => {
        if (i < text.length) {
          textNode.textContent = text.substring(0, i + 1);
          i++;
        } else {
          clearInterval(this._typeInterval);
          this._typeInterval = null;
          this.typing = false;

          // Keep cursor blinking for a bit then remove
          setTimeout(() => {
            if (this.cursorElement.parentNode === this.element) {
              this.element.removeChild(this.cursorElement);
            }
            this.element.style.willChange = '';
          }, 1500);

          if (onComplete) onComplete();
          resolve();
        }
      }, speed);
    });
  }

  /**
   * Type multiple messages sequentially with pauses.
   */
  async typeSequence(messages, typeSpeed = 50, pauseBetween = 2000) {
    for (let i = 0; i < messages.length; i++) {
      await this.type(messages[i], typeSpeed);
      if (i < messages.length - 1) {
        await this._wait(pauseBetween);
        await this._fadeOutSync(600);
        await this._wait(200);
      }
    }
  }

  /**
   * Instantly show text (no typing effect).
   */
  show(text) {
    this._cancel();
    this.element.textContent = text;
    this.element.classList.remove('hidden');
    this.element.style.opacity = '1';
  }

  /**
   * Fade in — uses double-rAF to ensure the initial opacity is painted
   * before the transition starts. Cancels any previous transition first.
   */
  fadeIn(duration = 1000) {
    this._cancel();
    this.element.classList.remove('hidden');
    this.element.style.transition = 'none';
    this.element.style.opacity = '0';
    this.element.style.willChange = 'opacity';

    // Double rAF: first frame paints opacity:0, second frame starts transition
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.element.style.transition = `opacity ${duration}ms ease`;
        this.element.style.opacity = '1';
      });
    });
  }

  /**
   * Fade out — uses double-rAF, returns a promise.
   */
  fadeOut(duration = 800) {
    return new Promise((resolve) => {
      this._cancel();
      this.element.style.willChange = 'opacity';
      this.element.style.transition = 'none';
      this.element.style.opacity = '1';

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.element.style.transition = `opacity ${duration}ms ease`;
          this.element.style.opacity = '0';

          setTimeout(() => {
            this.element.style.willChange = '';
            resolve();
          }, duration);
        });
      });
    });
  }

  /** Synchronous fade-out used internally by typeSequence */
  _fadeOutSync(duration = 800) {
    return new Promise((resolve) => {
      this.element.style.willChange = 'opacity';
      this.element.style.transition = `opacity ${duration}ms ease`;
      this.element.style.opacity = '0';

      setTimeout(() => {
        this.element.style.willChange = '';
        resolve();
      }, duration);
    });
  }

  /**
   * Hide the element completely.
   */
  hide() {
    this._cancel();
    this.element.classList.add('hidden');
    this.element.style.opacity = '0';
  }

  _wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
