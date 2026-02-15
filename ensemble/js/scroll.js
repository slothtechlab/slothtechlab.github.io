/**
 * Scroll Animations - Ensemble, Inc.
 * Intersection Observer ベースのスクロールアニメーション管理
 * テキストの文字分割、スタッガー出現、カードホバー効果を含む
 */

class ScrollAnimations {
    constructor() {
        this.observers = [];
        this.init();
    }

    init() {
        this.setupRevealObserver();
        this.setupTextReveal();
        this.setupCardMouseTracking();
        this.setupParallaxSections();
    }

    /**
     * 基本的なスクロールリビールアニメーション
     */
    setupRevealObserver() {
        const options = {
            root: null,
            rootMargin: '0px 0px -80px 0px',
            threshold: 0.1,
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    // Don't unobserve - allow re-triggering if needed
                }
            });
        }, options);

        // Observe all reveal elements
        document.querySelectorAll('.reveal-element, .reveal-stagger, .reveal-left, .reveal-right, .reveal-scale').forEach(el => {
            observer.observe(el);
        });

        this.observers.push(observer);
    }

    /**
     * テキストを文字単位に分割してアニメーション
     */
    setupTextReveal() {
        document.querySelectorAll('.text-reveal').forEach(el => {
            const text = el.textContent.trim();
            el.textContent = '';
            el.setAttribute('aria-label', text);

            for (let i = 0; i < text.length; i++) {
                const char = document.createElement('span');
                char.classList.add('char');
                char.textContent = text[i] === ' ' ? '\u00A0' : text[i];
                char.style.transitionDelay = `${i * 30}ms`;
                el.appendChild(char);
            }
        });

        // Observe text reveal elements
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                }
            });
        }, {
            rootMargin: '0px 0px -50px 0px',
            threshold: 0.1,
        });

        document.querySelectorAll('.text-reveal').forEach(el => {
            observer.observe(el);
        });

        this.observers.push(observer);
    }

    /**
     * カードのマウス追跡グロー効果
     */
    setupCardMouseTracking() {
        document.querySelectorAll('.card').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                card.style.setProperty('--mouse-x', x + '%');
                card.style.setProperty('--mouse-y', y + '%');
            });
        });
    }

    /**
     * セクション背景の微妙なパララックス
     */
    setupParallaxSections() {
        // Subtle parallax on scroll for section decorative elements
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const scrollY = window.scrollY;
                    document.querySelectorAll('.section-glow').forEach(glow => {
                        const section = glow.closest('.section');
                        if (section) {
                            const rect = section.getBoundingClientRect();
                            const progress = -rect.top / window.innerHeight;
                            glow.style.transform = `translateY(${progress * 30}px)`;
                        }
                    });
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    destroy() {
        this.observers.forEach(obs => obs.disconnect());
    }
}

window.ScrollAnimations = ScrollAnimations;
