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
        versionBadge.textContent = 'GPL-3.0 · Open source';
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
            if (window.innerWidth > 733 && nav.classList.contains('open')) setOpen(false);
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
        '.card, .tech-card, .format-chip, .step, .section-head, .cta-banner, .pgp-card'
    );

    if ('IntersectionObserver' in window) {
        revealTargets.forEach(el => el.classList.add('reveal'));

        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });

        revealTargets.forEach(el => io.observe(el));
    }

    /* ---- Anchor offset for the sticky header ---- */
    root.style.scrollPaddingTop = (48 + 12) + 'px';
})();
