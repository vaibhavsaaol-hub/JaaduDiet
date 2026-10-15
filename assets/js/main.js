/* =====================================================================
   JAADU DIET — LANDING PAGE SCRIPT
   Vanilla JS, no dependencies.
   1. Store links & platform detection
   2. Analytics / campaign tracking hooks
   3. Header state, scroll reveal, count-up
   4. Score demo
   5. App tour carousel
   6. Sticky mobile CTA, FAQ tracking, misc
   ===================================================================== */
(function () {
  'use strict';

  var STORE = {
    play: 'https://play.google.com/store/search?q=jaadu%20diet&c=apps',
    apple: 'https://apps.apple.com/in/app/jaadu-diet/id6744672805'
  };

  var doc = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------
     1. PLATFORM DETECTION & SMART STORE LINKS
     Links marked data-store-link="auto" point to the visitor's store.
     Android (and desktop) keep the Google Play default href;
     iPhone / iPad switch to the App Store.
     --------------------------------------------------------------- */
  var ua = navigator.userAgent || '';
  var isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var isAndroid = /Android/i.test(ua);
  var platform = isIOS ? 'ios' : isAndroid ? 'android' : 'desktop';
  doc.setAttribute('data-platform', platform);

  document.querySelectorAll('[data-store-link="auto"]').forEach(function (link) {
    if (platform === 'ios') {
      link.href = STORE.apple;
      link.setAttribute('data-store', 'apple');
    } else if (platform === 'android') {
      link.href = STORE.play;
      link.setAttribute('data-store', 'play');
    } else {
      // Desktop: scroll to the section that offers both stores + QR codes
      link.href = '#download';
      link.setAttribute('data-store', 'both');
    }
  });

  if (platform !== 'desktop') {
    var preferred = platform === 'ios' ? '.store--apple' : '.store--play';
    document.querySelectorAll(preferred).forEach(function (el) { el.classList.add('is-preferred'); });
  }

  /* ---------------------------------------------------------------
     2. ANALYTICS HOOKS
     Sends events to whatever is configured in <head>:
       - window.dataLayer (Google Tag Manager)
       - gtag()           (GA4 / Google Ads)
       - fbq()            (Meta Pixel)
     If none are configured, events are simply ignored.
     Campaign params (utm_*, gclid, fbclid…) are kept for the session
     and attached to every event.
     --------------------------------------------------------------- */
  var CAMPAIGN_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'gbraid', 'wbraid', 'fbclid'];
  var campaign = {};
  try {
    var params = new URLSearchParams(window.location.search);
    var stored = JSON.parse(sessionStorage.getItem('jd_campaign') || '{}');
    CAMPAIGN_KEYS.forEach(function (k) {
      var v = params.get(k);
      if (v) stored[k] = v;
    });
    campaign = stored;
    sessionStorage.setItem('jd_campaign', JSON.stringify(stored));
  } catch (e) { /* storage unavailable — continue without it */ }

  function track(eventName, data) {
    var payload = Object.assign({}, campaign, data || {});
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(Object.assign({ event: eventName }, payload));
      if (typeof window.gtag === 'function') window.gtag('event', eventName, payload);
      if (typeof window.fbq === 'function') window.fbq('trackCustom', eventName, payload);
    } catch (e) { /* never block navigation because of tracking */ }
  }
  window.jdTrack = track; // handy for testing in the console

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-track="download"]');
    if (!el) return;
    track('download_click', {
      store: el.getAttribute('data-store') || 'unknown',
      location: el.getAttribute('data-location') || 'unknown',
      platform: platform
    });
  });

  /* ---------------------------------------------------------------
     3. HEADER STATE · SCROLL REVEAL · COUNT-UP
     --------------------------------------------------------------- */
  var header = document.querySelector('[data-header]');
  function onScroll() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 8 || doc.classList.contains('menu-open'));
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  var menuToggle = document.querySelector('[data-menu-toggle]');
  var menu = document.querySelector('[data-menu]');
  var backdrop = document.querySelector('[data-menu-backdrop]');
  if (menuToggle && menu) {
    var setMenu = function (open) {
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      doc.classList.toggle('menu-open', open);
      if (open) {
        menu.hidden = false; backdrop.hidden = false;
        requestAnimationFrame(function () { menu.classList.add('is-open'); backdrop.classList.add('is-open'); });
        if (header) header.classList.add('is-scrolled');
      } else {
        menu.classList.remove('is-open'); backdrop.classList.remove('is-open');
        setTimeout(function () {
          if (menuToggle.getAttribute('aria-expanded') === 'false') { menu.hidden = true; backdrop.hidden = true; }
        }, 320);
        onScroll();
      }
    };
    menuToggle.addEventListener('click', function () { setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'); });
    backdrop.addEventListener('click', function () { setMenu(false); });
    menu.querySelectorAll('[data-menu-link], .store').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') { setMenu(false); menuToggle.focus(); }
    });
    window.matchMedia('(min-width: 768px)').addEventListener('change', function (e) { if (e.matches) setMenu(false); });
  }

  function countUp(el) {
    var target = parseInt(el.getAttribute('data-countup'), 10);
    if (reduceMotion || isNaN(target)) { el.textContent = target; return; }
    var start = null, dur = 1400;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    el.textContent = '0';
    requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(function (el) { revealObserver.observe(el); });

    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        countUp(entry.target);
        countObserver.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    document.querySelectorAll('[data-countup]').forEach(function (el) { countObserver.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------------------------------------------------------------
     4. SCORE DEMO
     --------------------------------------------------------------- */
  var demo = document.querySelector('[data-demo]');
  if (demo) {
    var TARGET = 5000;
    var foods = demo.querySelectorAll('[data-food]');
    var valueEl = demo.querySelector('[data-demo-value]');
    var fillEl = demo.querySelector('[data-demo-fill]');
    var barEl = demo.querySelector('[data-demo-bar]');
    var hintEl = demo.querySelector('[data-demo-hint]');
    var resetBtn = demo.querySelector('[data-demo-reset]');
    var shown = 0;
    var animId = null;
    var fmt = function (n) { return (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n).toLocaleString('en-IN'); };

    function animateTo(to) {
      cancelAnimationFrame(animId);
      var from = shown;
      if (reduceMotion) { shown = to; valueEl.textContent = fmt(to); return; }
      var start = null, dur = 550;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        shown = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)));
        valueEl.textContent = fmt(shown);
        if (p < 1) animId = requestAnimationFrame(step);
      }
      animId = requestAnimationFrame(step);
    }

    function update(changed) {
      var total = 0, count = 0;
      foods.forEach(function (btn) {
        if (btn.getAttribute('aria-pressed') === 'true') {
          total += parseInt(btn.getAttribute('data-score'), 10);
          count++;
        }
      });
      animateTo(total);
      valueEl.classList.toggle('is-plus', total > 0);
      valueEl.classList.toggle('is-minus', total < 0);
      valueEl.classList.remove('bump'); void valueEl.offsetWidth; valueEl.classList.add('bump');

      var pct = Math.max(0, Math.min(total / TARGET, 1));
      fillEl.style.transform = 'scaleX(' + pct + ')';
      barEl.setAttribute('aria-valuenow', String(Math.max(0, total)));
      resetBtn.disabled = count === 0;

      if (count === 0) hintEl.textContent = 'Tap foods below to add them to your plate.';
      else if (total < 0) hintEl.textContent = 'This plate pulls your score below zero. Try swapping a food.';
      else hintEl.textContent = count + (count === 1 ? ' food' : ' foods') + ' added · ' + Math.round(pct * 100) + '% of the 5,000 target';

      if (changed) track('demo_interaction', { food: changed.getAttribute('data-name'), added: changed.getAttribute('aria-pressed') === 'true', total: total });
    }

    foods.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var on = btn.getAttribute('aria-pressed') !== 'true';
        btn.setAttribute('aria-pressed', String(on));
        update(btn);
      });
    });
    resetBtn.addEventListener('click', function () {
      foods.forEach(function (btn) { btn.setAttribute('aria-pressed', 'false'); });
      update();
    });
  }

  /* ---------------------------------------------------------------
     5. APP TOUR CAROUSEL
     Coverflow of real app screens. Arrows, dots, keyboard,
     swipe/drag, click on side screens.
     Autoplay runs only while the section is in view and pauses while
     the visitor interacts (mouse hover, keyboard focus, swipe/tap).
     It resumes automatically RESUME_MS after they stop interacting.
     Never runs with reduced motion.
     --------------------------------------------------------------- */
  var carousel = document.querySelector('[data-carousel]');
  if (carousel) {
    var stage = carousel.querySelector('[data-carousel-stage]');
    var slides = Array.prototype.slice.call(carousel.querySelectorAll('[data-slide]'));
    var captions = carousel.querySelectorAll('[data-caption]');
    var dots = carousel.querySelectorAll('.carousel__dot');
    var prevBtn = carousel.querySelector('[data-carousel-prev]');
    var nextBtn = carousel.querySelector('[data-carousel-next]');
    var n = slides.length;
    var current = 0;
    var AUTOPLAY_MS = 6000;
    var timer = null;
    var RESUME_MS = 4000;
    var resumeTimer = null;
    var userPaused = false;
    var hoverPaused = false;
    var inView = false;
    var pageHidden = false;

    carousel.style.setProperty('--autoplay', AUTOPLAY_MS + 'ms');

    function offsetOf(i) {
      var o = (i - current + n) % n;
      if (o > n / 2) o -= n;
      return o;
    }

    function render() {
      slides.forEach(function (slide, i) {
        var prevO = parseInt(slide.getAttribute('data-o'), 10);
        var o = offsetOf(i);
        // Slides that wrap from one far side to the other jump without animating
        if (!isNaN(prevO) && Math.abs(prevO - o) > 2) {
          slide.classList.add('no-anim');
          requestAnimationFrame(function () { requestAnimationFrame(function () { slide.classList.remove('no-anim'); }); });
        }
        slide.setAttribute('data-o', String(o));
        slide.setAttribute('aria-hidden', o === 0 ? 'false' : 'true');
        var img = slide.querySelector('img');
        // Neighbours load eagerly so transitions never show blank screens
        if (Math.abs(o) <= 1 && img && img.loading === 'lazy') img.loading = 'eager';
      });
      captions.forEach(function (c, i) { c.classList.toggle('is-active', i === current); });
      dots.forEach(function (d, i) {
        if (i === current) d.setAttribute('aria-current', 'true');
        else d.removeAttribute('aria-current');
      });
    }

    function goTo(i, source) {
      current = (i + n) % n;
      if (source) pauseForUser();
      render();
      restartTimer();
      if (source) track('tour_slide', { slide: current + 1, source: source });
    }

    function isPlaying() { return !reduceMotion && !userPaused && !hoverPaused && inView && !pageHidden; }

    // The visitor took control: pause now, resume once they've been idle for RESUME_MS
    function pauseForUser() {
      userPaused = true;
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(function () { userPaused = false; restartTimer(); }, RESUME_MS);
    }

    function restartTimer() {
      clearTimeout(timer);
      // restart the dot progress animation
      carousel.classList.remove('is-playing');
      void carousel.offsetWidth;
      if (isPlaying()) {
        carousel.classList.add('is-playing');
        timer = setTimeout(function () { goTo(current + 1); }, AUTOPLAY_MS);
      }
    }

    prevBtn.addEventListener('click', function () { goTo(current - 1, 'arrow'); });
    nextBtn.addEventListener('click', function () { goTo(current + 1, 'arrow'); });
    dots.forEach(function (d, i) { d.addEventListener('click', function () { goTo(i, 'dot'); }); });

    // Click a side phone to bring it to the centre
    slides.forEach(function (slide, i) {
      slide.addEventListener('click', function () {
        if (dragMoved) return;
        var o = offsetOf(i);
        if (o !== 0) goTo(i, 'tap');
      });
    });

    // Keyboard
    carousel.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(current - 1, 'key'); }
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1, 'key'); }
    });

    // Swipe / drag
    var startX = 0, startY = 0, dragging = false, dragMoved = false;
    stage.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      dragging = true; dragMoved = false;
      startX = e.clientX; startY = e.clientY;
      stage.classList.add('is-dragging');
    });
    window.addEventListener('pointerup', function (e) {
      if (!dragging) return;
      dragging = false;
      stage.classList.remove('is-dragging');
      var dx = e.clientX - startX, dy = e.clientY - startY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        dragMoved = true;
        goTo(current + (dx < 0 ? 1 : -1), 'swipe');
        setTimeout(function () { dragMoved = false; }, 50);
      }
    });
    window.addEventListener('pointercancel', function () { dragging = false; stage.classList.remove('is-dragging'); });

    // Pause while the visitor is interacting
    // (mouse only — on touch screens a tap would otherwise "hover" forever)
    carousel.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { hoverPaused = true; restartTimer(); } });
    carousel.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { hoverPaused = false; restartTimer(); } });
    // Keyboard focus pauses; focus left behind by a mouse click/tap does not
    carousel.addEventListener('focusin', function (e) {
      var keyboard = false;
      try { keyboard = e.target.matches(':focus-visible'); } catch (err) {}
      if (keyboard) { hoverPaused = true; restartTimer(); }
    });
    carousel.addEventListener('focusout', function (e) {
      if (!carousel.contains(e.relatedTarget)) { hoverPaused = false; restartTimer(); }
    });
    // After a tap/click, drop focus from the button so it doesn't stay highlighted
    carousel.addEventListener('pointerup', function (e) {
      var btn = e.target.closest('button');
      if (btn && e.pointerType !== '') setTimeout(function () { btn.blur(); }, 0);
    });
    document.addEventListener('visibilitychange', function () {
      pageHidden = document.hidden;
      restartTimer();
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        restartTimer();
      }, { threshold: 0.35 }).observe(carousel);
    }

    render();
    restartTimer();
  }

  /* ---------------------------------------------------------------
     6. STICKY MOBILE CTA · FAQ · MISC
     Bar appears after the hero and hides near the final CTA.
     --------------------------------------------------------------- */
  var sticky = document.querySelector('[data-sticky-cta]');
  var hero = document.querySelector('.hero');
  var finalCta = document.querySelector('#download');
  if (sticky && hero && 'IntersectionObserver' in window) {
    var heroVisible = true, finalVisible = false, tourVisible = false;
    var setSticky = function () {
      // hidden over the hero, the app-tour slider (has its own button) and the final CTA
      var show = !heroVisible && !finalVisible && !tourVisible;
      sticky.classList.toggle('is-visible', show);
      sticky.setAttribute('aria-hidden', String(!show));
      sticky.querySelector('a').tabIndex = show ? 0 : -1;
    };
    new IntersectionObserver(function (e) { heroVisible = e[0].isIntersecting; setSticky(); }, { threshold: 0.05 }).observe(hero);
    if (finalCta) new IntersectionObserver(function (e) { finalVisible = e[0].isIntersecting; setSticky(); }).observe(finalCta);
    var tourStage = document.querySelector('[data-carousel]');
    if (tourStage) new IntersectionObserver(function (e) { tourVisible = e[0].isIntersecting; setSticky(); }, { threshold: 0.25 }).observe(tourStage);
  }

  document.querySelectorAll('[data-faq]').forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (d.open) track('faq_open', { question: d.querySelector('summary').textContent.trim() });
    });
  });

  /* ---------------------------------------------------------------
     7. QR CODE (desktop only)
     Scanning opens the live landing page on the phone, where the
     download buttons point to the visitor's own store. The QR library
     loads only when the download section is near.
     --------------------------------------------------------------- */
  var QR_URL = 'https://jaadudiet.vaibhavsaaol.workers.dev/';
  var qrBox = document.querySelector('[data-qr]');
  if (qrBox && window.matchMedia('(min-width: 768px)').matches) {
    var drawQR = function () {
      var s = document.createElement('script');
      s.src = 'assets/js/vendor/qrcode.min.js';
      s.onload = function () {
        if (typeof window.qrcode !== 'function') return;
        var qr = window.qrcode(0, 'H'); // high error correction leaves room for the logo
        qr.addData(QR_URL);
        qr.make();
        qrBox.querySelector('[data-qr-code]').innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
      };
      document.head.appendChild(s);
    };

    if ('IntersectionObserver' in window) {
      var qrObserver = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        qrObserver.disconnect();
        drawQR();
      }, { rootMargin: '400px 0px' });
      qrObserver.observe(qrBox);
    } else {
      drawQR();
    }
  }

  var yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
