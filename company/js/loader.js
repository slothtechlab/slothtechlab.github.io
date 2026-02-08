/**
 * Page Loader - Ensemble, Inc.
 * ロゴ文字が一文字ずつ現れ、光のラインが走り、
 * パーティクルに分解されてメインコンテンツへ遷移するオープニング
 */

class PageLoader {
    constructor() {
        this.overlay = document.querySelector('.loader-overlay');
        this.logoEl = document.querySelector('.loader-logo');
        this.lineEl = document.querySelector('.loader-line');
        this.letters = [];
        this.isComplete = false;
    }

    init() {
        if (!this.overlay || !this.logoEl) return;

        // Split logo text into individual characters
        const text = this.logoEl.textContent.trim();
        this.logoEl.textContent = '';
        this.logoEl.style.opacity = '1';

        for (let i = 0; i < text.length; i++) {
            const span = document.createElement('span');
            span.textContent = text[i] === ' ' ? '\u00A0' : text[i];
            this.logoEl.appendChild(span);
            this.letters.push(span);
        }

        this.startAnimation();
    }

    startAnimation() {
        // Delay before starting
        setTimeout(() => {
            this.overlay.classList.add('animating');

            // Reveal letters one by one
            this.letters.forEach((letter, i) => {
                setTimeout(() => {
                    letter.classList.add('reveal');
                }, i * 100);
            });

            // After all letters revealed, begin exit
            const totalLetterTime = this.letters.length * 100 + 800;
            setTimeout(() => {
                this.exit();
            }, totalLetterTime);
        }, 300);
    }

    exit() {
        // Add a glow pulse to logo
        this.logoEl.style.transition = 'filter 0.6s, opacity 0.6s';
        this.logoEl.style.filter = 'blur(4px)';
        this.logoEl.style.opacity = '0.5';

        setTimeout(() => {
            this.overlay.classList.add('loaded');
            this.isComplete = true;

            // Remove from DOM after transition
            setTimeout(() => {
                if (this.overlay.parentNode) {
                    this.overlay.style.display = 'none';
                }
            }, 1000);
        }, 400);
    }
}

window.PageLoader = PageLoader;
