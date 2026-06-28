(function () {
  'use strict';

  /* ── Utility ── */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     HERO — Dual-Axis Slider
     ============================================================ */
  (function initHeroSlider() {
    const slider    = $('#hero-slider');
    if (!slider) return;

    const trackX    = $('#hero-track-x');
    const slides    = $$('.hero__slide');
    const dotsWrap  = $('#hero-dots');
    const prevBtn   = $('#hero-prev');
    const nextBtn   = $('#hero-next');
    const vertUp    = $('#hero-vert-up');
    const vertDown  = $('#hero-vert-down');
    const progressBar = $('#hero-progress-bar');

    let currentX  = 0;
    let currentY  = []; // per-slide vertical index (0 or 1)
    let total     = slides.length;
    let autoTimer = null;
    let progTimer = null;
    const AUTOPLAY_DURATION = 5000; // ms

    // Init per-slide vertical positions
    slides.forEach((_, i) => { currentY[i] = 0; });

    // Build dots
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'hero__dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      dot.addEventListener('click', () => goToX(i));
      dot.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight') goToX((currentX + 1) % total);
        if (e.key === 'ArrowLeft') goToX((currentX - 1 + total) % total);
      });
      dotsWrap.appendChild(dot);
    });

    function updateDots() {
      $$('.hero__dot', dotsWrap).forEach((d, i) => {
        d.setAttribute('aria-selected', i === currentX ? 'true' : 'false');
      });
    }

    function applyX(animate = true) {
      if (!animate || prefersReducedMotion()) {
        trackX.style.transition = 'none';
      } else {
        trackX.style.transition = 'transform 0.7s cubic-bezier(.77,0,.18,1)';
      }
      trackX.style.transform = `translateX(-${currentX * 100}%)`;
      updateDots();
    }

    function applyY(slideIdx, animate = true) {
      const inner = $(`#hero-track-y-${slideIdx}`);
      if (!inner) return;
      if (!animate || prefersReducedMotion()) {
        inner.style.transition = 'none';
      } else {
        inner.style.transition = 'transform 0.7s cubic-bezier(.77,0,.18,1)';
      }
      inner.style.transform = `translateY(-${currentY[slideIdx] * 50}%)`;
    }

    function goToX(idx) {
      currentX = (idx + total) % total;
      applyX();
      resetAutoplay();
    }

    function goNextX() { goToX(currentX + 1); }
    function goPrevX() { goToX(currentX - 1); }

    function goNextY() {
      currentY[currentX] = currentY[currentX] === 0 ? 1 : 0;
      applyY(currentX);
      resetAutoplay();
    }
    function goPrevY() { goNextY(); } // toggle

    prevBtn.addEventListener('click', goPrevX);
    nextBtn.addEventListener('click', goNextX);
    vertUp.addEventListener('click', goPrevY);
    vertDown.addEventListener('click', goNextY);

    // Keyboard navigation
    slider.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') goNextX();
      if (e.key === 'ArrowLeft') goPrevX();
      if (e.key === 'ArrowUp') goPrevY();
      if (e.key === 'ArrowDown') goNextY();
    });

    // Touch / swipe
    let touchStartX = 0, touchStartY = 0;
    slider.addEventListener('touchstart', e => {
      touchStartX = e.changedTouches[0].clientX;
      touchStartY = e.changedTouches[0].clientY;
    }, { passive: true });
    slider.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
        dx < 0 ? goNextX() : goPrevX();
      } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 40) {
        dy < 0 ? goNextY() : goPrevY();
      }
    }, { passive: true });

    // Autoplay with progress bar
    function startProgress() {
      if (prefersReducedMotion()) return;
      progressBar.style.transition = 'none';
      progressBar.style.width = '0%';
      void progressBar.offsetWidth; // reflow
      progressBar.style.transition = `width ${AUTOPLAY_DURATION}ms linear`;
      progressBar.style.width = '100%';
    }

    function startAutoplay() {
      if (prefersReducedMotion()) return;
      clearInterval(autoTimer);
      startProgress();
      autoTimer = setInterval(() => {
        goNextX();
        startProgress();
      }, AUTOPLAY_DURATION);
    }

    function pauseAutoplay() {
      clearInterval(autoTimer);
      progressBar.style.transition = 'none';
    }

    function resetAutoplay() {
      clearInterval(autoTimer);
      startAutoplay();
    }

    // Pause on hover/focus
    slider.addEventListener('mouseenter', pauseAutoplay);
    slider.addEventListener('mouseleave', startAutoplay);
    slider.addEventListener('focusin', pauseAutoplay);
    slider.addEventListener('focusout', startAutoplay);

    // Init
    applyX(false);
    slides.forEach((_, i) => applyY(i, false));
    startAutoplay();
  })();

  /* ============================================================
     CHOOSE THE SCHOOL — Mobile Slider
     ============================================================ */
  (function initChooseSlider() {
    const track  = $('#choose-track');
    const dotsEl = $('#choose-dots');
    const prevEl = $('#choose-prev');
    const nextEl = $('#choose-next');
    if (!track) return;

    const cards = $$('.choose__card', track);
    let current = 0;
    let isMobile = false;

    function buildDots() {
      dotsEl.innerHTML = '';
      cards.forEach((_, i) => {
        const d = document.createElement('button');
        d.className = 'choose__dot' + (i === 0 ? ' choose__dot--active' : '');
        d.setAttribute('role', 'tab');
        d.setAttribute('aria-label', `Category ${i + 1}`);
        d.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
        d.addEventListener('click', () => goTo(i));
        dotsEl.appendChild(d);
      });
    }

    function updateDots() {
      $$('.choose__dot', dotsEl).forEach((d, i) => {
        d.className = 'choose__dot' + (i === current ? ' choose__dot--active' : '');
        d.setAttribute('aria-selected', i === current ? 'true' : 'false');
      });
    }

    function goTo(idx) {
      current = (idx + cards.length) % cards.length;
      if (prefersReducedMotion()) {
        track.style.transition = 'none';
      } else {
        track.style.transition = 'transform 0.45s cubic-bezier(.77,0,.18,1)';
      }
      track.style.transform = `translateX(-${current * 100}%)`;
      updateDots();
    }

    function enableMobile() {
      if (isMobile) return;
      isMobile = true;
      buildDots();
      dotsEl.hidden = false;
      prevEl.hidden = false;
      nextEl.hidden = false;
      track.style.transform = `translateX(0)`;
      current = 0;
      updateDots();
    }

    function disableMobile() {
      if (!isMobile) return;
      isMobile = false;
      dotsEl.hidden = true;
      prevEl.hidden = true;
      nextEl.hidden = true;
      track.style.transform = '';
      track.style.transition = '';
    }

    prevEl.addEventListener('click', () => goTo(current - 1));
    nextEl.addEventListener('click', () => goTo(current + 1));

    // Touch
    let startX = 0;
    track.addEventListener('touchstart', e => { startX = e.changedTouches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', e => {
      if (!isMobile) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) dx < 0 ? goTo(current + 1) : goTo(current - 1);
    }, { passive: true });

    // Responsive check
    const mq = window.matchMedia('(max-width: 768px)');
    function check(e) {
      e.matches ? enableMobile() : disableMobile();
    }
    mq.addEventListener('change', check);
    check(mq);
  })();

  /* ============================================================
     EXHIBITION SLIDER
     ============================================================ */
  (function initExhibitionSlider() {
    const track  = $('#exhibition-track');
    const dotsEl = $('#exh-dots');
    const prevEl = $('#exh-prev');
    const nextEl = $('#exh-next');
    if (!track) return;

    const cards = $$('.exhibition__card', track);
    let current  = 0;
    let autoTimer = null;

    function getVisible() {
      if (window.innerWidth <= 768) return 1;
      if (window.innerWidth <= 1024) return 2;
      return 3;
    }

    function maxIndex() {
      return Math.max(0, cards.length - getVisible());
    }

    function buildDots() {
      dotsEl.innerHTML = '';
      const pages = maxIndex() + 1;
      for (let i = 0; i < pages; i++) {
        const d = document.createElement('button');
        d.className = 'exhibition__dot';
        d.setAttribute('role', 'tab');
        d.setAttribute('aria-label', `Go to page ${i + 1}`);
        d.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
        d.addEventListener('click', () => goTo(i));
        dotsEl.appendChild(d);
      }
    }

    function updateDots() {
      $$('.exhibition__dot', dotsEl).forEach((d, i) => {
        d.setAttribute('aria-selected', i === current ? 'true' : 'false');
      });
    }

    function goTo(idx) {
      current = Math.max(0, Math.min(idx, maxIndex()));
      const cardW = cards[0].offsetWidth;
      const gap   = 24; // var(--sp-6)
      const offset = current * (cardW + gap);
      if (prefersReducedMotion()) {
        track.style.transition = 'none';
      } else {
        track.style.transition = 'transform 0.55s cubic-bezier(.77,0,.18,1)';
      }
      track.style.transform = `translateX(-${offset}px)`;
      updateDots();
    }

    function goNext() { goTo(current + 1); }
    function goPrev() { goTo(current - 1); }

    prevEl.addEventListener('click', goPrev);
    nextEl.addEventListener('click', goNext);

    // Touch
    let startX = 0;
    track.parentElement.addEventListener('touchstart', e => { startX = e.changedTouches[0].clientX; }, { passive: true });
    track.parentElement.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) dx < 0 ? goNext() : goPrev();
    }, { passive: true });

    // Optional autoplay
    function startAuto() {
      if (prefersReducedMotion()) return;
      autoTimer = setInterval(() => {
        if (current >= maxIndex()) { goTo(0); } else { goNext(); }
      }, 4000);
    }

    const slider = track.closest('.exhibition__slider');
    slider.addEventListener('mouseenter', () => clearInterval(autoTimer));
    slider.addEventListener('mouseleave', startAuto);
    slider.addEventListener('focusin', () => clearInterval(autoTimer));
    slider.addEventListener('focusout', startAuto);

    // Keyboard
    slider.setAttribute('tabindex', '0');
    slider.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    });

    // Init + resize
    function init() {
      buildDots();
      current = Math.min(current, maxIndex());
      goTo(current);
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(init, 150);
    });

    init();
    startAuto();
  })();

  /* ============================================================
     HEADER — Hamburger + Mobile Nav
     ============================================================ */
  (function initMobileNav() {
    const hamburger = $('.header__hamburger');
    const nav       = $('.mobile-nav');
    if (!hamburger || !nav) return;

    let open = false;

    function toggle() {
      open = !open;
      hamburger.setAttribute('aria-expanded', open);
      nav.setAttribute('aria-hidden', !open);
      document.body.style.overflow = open ? 'hidden' : '';
    }

    hamburger.addEventListener('click', toggle);

    // Close on link click
    $$('.mobile-nav__link').forEach(link => {
      link.addEventListener('click', () => {
        if (open) toggle();
      });
    });

    // Close on outside click
    document.addEventListener('click', e => {
      if (open && !hamburger.contains(e.target) && !nav.contains(e.target)) toggle();
    });

    // Close on Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && open) { toggle(); hamburger.focus(); }
    });
  })();

  /* ============================================================
     HEADER — Scroll Transparency
     ============================================================ */
  (function initHeaderScroll() {
    const header = $('.header');
    if (!header) return;
    const onScroll = () => {
      header.style.background = window.scrollY > 20
        ? 'rgba(10,22,40,0.98)'
        : 'rgba(10,22,40,0.92)';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  })();

  /* ============================================================
     REGISTER FORM — Validation & Submission
     ============================================================ */
  (function initForm() {
    const form = $('.register__form');
    if (!form) return;

    form.addEventListener('submit', e => {
      e.preventDefault();
      const inputs = $$('[required]', form);
      let valid = true;
      inputs.forEach(input => {
        const err = input.parentElement.querySelector('.form-error');
        if (err) err.remove();
        if (!input.value.trim()) {
          valid = false;
          input.style.borderColor = '#e53e3e';
          const errEl = document.createElement('span');
          errEl.className = 'form-error';
          errEl.style.cssText = 'color:#e53e3e;font-size:.75rem;margin-top:2px;';
          errEl.setAttribute('role', 'alert');
          errEl.textContent = 'This field is required.';
          input.parentElement.appendChild(errEl);
          input.setAttribute('aria-invalid', 'true');
        } else {
          input.style.borderColor = '';
          input.setAttribute('aria-invalid', 'false');
        }
      });

      if (valid) {
        const btn = form.querySelector('[type="submit"]');
        const orig = btn.textContent;
        btn.textContent = '✅ You\'re registered! Check your email.';
        btn.disabled = true;
        btn.style.background = '#2d7a4f';
        btn.style.borderColor = '#2d7a4f';
        btn.style.color = '#fff';
        setTimeout(() => {
          btn.textContent = orig;
          btn.disabled = false;
          btn.style = '';
          form.reset();
        }, 5000);
      } else {
        const firstError = form.querySelector('[aria-invalid="true"]');
        if (firstError) firstError.focus();
      }
    });

    // Live validation clear
    $$('input, select', form).forEach(input => {
      input.addEventListener('input', () => {
        if (input.value.trim()) {
          input.style.borderColor = '';
          input.setAttribute('aria-invalid', 'false');
          const err = input.parentElement.querySelector('.form-error');
          if (err) err.remove();
        }
      });
    });
  })();

  /* ============================================================
     SMOOTH SCROLL OFFSET (accounts for fixed header)
     ============================================================ */
  (function initSmoothScroll() {
    $$('a[href^="#"]').forEach(link => {
      link.addEventListener('click', e => {
        const id = link.getAttribute('href').slice(1);
        const target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        const headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 72;
        const top = target.getBoundingClientRect().top + window.scrollY - headerH - 8;
        window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      });
    });
  })();

  /* ============================================================
     INTERSECTION OBSERVER — Fade-in on scroll
     ============================================================ */
  (function initFadeIn() {
    if (prefersReducedMotion()) return;

    const style = document.createElement('style');
    style.textContent = `
      .fade-target {
        opacity: 0;
        transform: translateY(24px);
        transition: opacity 0.6s ease, transform 0.6s ease;
      }
      .fade-target.is-visible {
        opacity: 1;
        transform: translateY(0);
      }
    `;
    document.head.appendChild(style);

    const targets = [
      ...$$('.choose__card'),
      ...$$('.exhibition__card'),
      ...$$('.register__content'),
      ...$$('.register__form-wrap'),
    ];

    targets.forEach((el, i) => {
      el.classList.add('fade-target');
      el.style.transitionDelay = `${(i % 4) * 80}ms`;
    });

    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    targets.forEach(el => obs.observe(el));
  })();

})();