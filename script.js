(function () {
    'use strict';

    const doc = document;
    const root = doc.documentElement;

    /* ---- Footer year ---- */
    const yearEl = doc.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    /* ---- Version badge (GitHub, with graceful fallback) ---- */
    const versionBadge = doc.getElementById('version-badge');
    if (versionBadge) {
        versionBadge.textContent = 'GPL-3.0';
        fetch('https://raw.githubusercontent.com/AkiZip/AkiZip/HEAD/meson.build', {
            cache: 'no-store'
        })
            .then(response => {
                if (!response.ok) throw new Error('Could not load meson.build');
                return response.text();
            })
            .then(meson => {
                const match = meson.match(/version\s*:\s*['"]([^'"]+)['"]/);
                if (match) versionBadge.textContent = `v${match[1]} · GPL-3.0`;
            })
            .catch(() => {
                /* Keep the static fallback text. */
            });
    }

    /* ---- Mobile navigation ---- */
    const toggle = doc.querySelector('.nav-toggle');
    const nav = doc.getElementById('site-nav');
    if (toggle && nav) {
        const setOpen = (open) => {
            nav.classList.toggle('open', open);
            root.classList.toggle('nav-open', open);
            toggle.setAttribute('aria-expanded', String(open));
            toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        };

        toggle.addEventListener('click', () => {
            setOpen(toggle.getAttribute('aria-expanded') !== 'true');
        });

        nav.addEventListener('click', (event) => {
            if (event.target.closest('a')) setOpen(false);
        });

        doc.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && nav.classList.contains('open')) {
                setOpen(false);
                toggle.focus();
            }
        });

        doc.addEventListener('click', (event) => {
            if (!nav.classList.contains('open')) return;
            if (nav.contains(event.target) || toggle.contains(event.target)) return;
            setOpen(false);
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 833 && nav.classList.contains('open')) setOpen(false);
        });
    }

    /* ---- Copy buttons ---- */
    doc.querySelectorAll('.copy-btn').forEach(btn => {
        const original = btn.textContent;
        btn.addEventListener('click', async () => {
            let text = btn.getAttribute('data-copy') || '';
            const targetSel = btn.getAttribute('data-copy-target');
            if (targetSel) {
                const target = doc.querySelector(targetSel);
                if (target) text = target.innerText;
            }
            try {
                if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(text);
                } else {
                    const ta = doc.createElement('textarea');
                    ta.value = text;
                    ta.style.position = 'fixed';
                    ta.style.opacity = '0';
                    doc.body.appendChild(ta);
                    ta.select();
                    doc.execCommand('copy');
                    doc.body.removeChild(ta);
                }
                btn.textContent = 'Copied';
                btn.classList.add('copied');
            } catch (err) {
                btn.textContent = 'Failed';
            }
            setTimeout(() => {
                btn.textContent = original;
                btn.classList.remove('copied');
            }, 1500);
        });
    });

    /* ---- Reveal on scroll ---- */
    const revealTargets = doc.querySelectorAll(
        '.section-head, .bento-card, .community-card, .format-item, .spec, .install-card, .pgp-card'
    );

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if ('IntersectionObserver' in window && !reduceMotion) {
        revealTargets.forEach(el => {
            el.classList.add('reveal');
            /* Stagger siblings so grids cascade instead of popping in together */
            const index = Array.prototype.indexOf.call(el.parentElement.children, el);
            el.style.setProperty('--d', Math.min(index, 8) * 0.07 + 's');
        });

        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                el.classList.add('visible');
                io.unobserve(el);
                /* Drop the reveal state afterwards so hover transforms apply again */
                setTimeout(() => el.classList.remove('reveal', 'visible'), 2000);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -48px 0px' });

        revealTargets.forEach(el => io.observe(el));
    }

    /* ---- Header border + hero screenshot straightens as the page scrolls ---- */
    const header = doc.querySelector('.site-header');
    const stage = doc.querySelector('.hero-window');
    let ticking = false;

    const onScroll = () => {
        ticking = false;
        const y = window.scrollY;
        if (header) header.classList.toggle('scrolled', y > 4);
        if (stage && !reduceMotion) {
            const range = window.innerHeight * 0.6 || 1;
            stage.style.setProperty('--p', Math.min(y / range, 1).toFixed(3));
        }
    };

    window.addEventListener('scroll', () => {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(onScroll);
        }
    }, { passive: true });
    onScroll();

    /* ---- Hero progress card: loops a fake extraction to show background jobs ---- */
    const fill = doc.getElementById('fc-fill');
    const pct = doc.getElementById('fc-pct');
    if (fill && pct) {
        if (reduceMotion) {
            fill.style.width = '64%';
            pct.textContent = '64%';
        } else {
            const cycle = 5200;
            const hold = 1200;
            const start = performance.now();
            const tick = (now) => {
                const t = (now - start) % (cycle + hold);
                const raw = Math.min(t / cycle, 1);
                /* Ease-in-out so the bar speeds up then settles, like real I/O */
                const eased = raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2;
                const value = Math.round(eased * 100);
                fill.style.width = value + '%';
                pct.textContent = value === 100 ? 'Done' : value + '%';
                requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        }
    }

    /* ---- Highlight the nav link of the section in view ---- */
    const navLinks = Array.from(doc.querySelectorAll('#site-nav a[href*="#"]'));
    if ('IntersectionObserver' in window && navLinks.length) {
        const byId = new Map();
        navLinks.forEach(a => {
            const id = a.getAttribute('href').split('#')[1];
            const sec = id && doc.getElementById(id);
            if (sec) byId.set(sec, a);
        });
        const spy = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const link = byId.get(entry.target);
                if (link) link.classList.toggle('active', entry.isIntersecting);
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        byId.forEach((_, sec) => spy.observe(sec));
    }
})();
