/**
 * Main Entry Point - Ensemble, Inc.
 * すべてのモジュールの初期化と連携
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize particle system (background)
    const particles = new ParticleSystem('particle-canvas');

    // 2. Initialize page loader (opening animation)
    const loader = new PageLoader();
    loader.init();

    // 3. Initialize scroll animations after loader is done
    // (slight delay to let loader complete)
    setTimeout(() => {
        const scroll = new ScrollAnimations();
    }, 2000);

    // 4. Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                });
            }
        });
    });

    // 5. Header scroll effect (optional - if header is added later)
    let lastScrollY = 0;
    window.addEventListener('scroll', () => {
        const header = document.querySelector('.site-header');
        if (!header) return;
        const currentScrollY = window.scrollY;
        if (currentScrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        lastScrollY = currentScrollY;
    }, { passive: true });
});
