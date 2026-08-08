// ===== Header scroll state =====
const header = document.getElementById('siteHeader');
const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
document.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ===== Mobile nav toggle =====
const navToggle = document.getElementById('navToggle');
const mainNav = document.getElementById('mainNav');
navToggle.addEventListener('click', () => {
  mainNav.classList.toggle('is-open');
  header.classList.toggle('is-scrolled', true);
});
mainNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mainNav.classList.remove('is-open')));

// ===== GSAP setup =====
gsap.registerPlugin(ScrollTrigger);

const mm = gsap.matchMedia();

mm.add('(prefers-reduced-motion: no-preference)', () => {
  // Hero entrance: the image already carries the message, so only the CTA needs to arrive.
  gsap.from('.hero-cta-wrap', {
    opacity: 0, y: 24, duration: 1, delay: .4, ease: 'power3.out',
  });

  // Scroll reveal: IntersectionObserver decides *when* (robust regardless of smooth
  // scroll, instant #anchor jumps, or layout shifts from async-loading images),
  // GSAP just handles the *how* of the animation itself.
  gsap.set('.reveal, .reveal-up', { y: 24 });
  const revealEls = [...document.querySelectorAll('.reveal, .reveal-up')];

  const reveal = (el, animate) => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: animate ? .8 : 0, ease: 'power2.out', overwrite: true,
    });
    revealObserver.unobserve(el);
    revealEls.splice(revealEls.indexOf(el), 1);
  };

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) reveal(entry.target, true);
    });
  }, { threshold: .15, rootMargin: '0px 0px -10% 0px' });
  revealEls.forEach((el) => revealObserver.observe(el));

  // Catch-up pass: jumping to an #anchor can carry an element from below the fold
  // to above it within a single frame, so the observer never sees it intersect and
  // the content would stay invisible for good. Anything already scrolled past is
  // shown immediately, with no entrance animation to play catch-up to.
  const revealPassed = () => {
    [...revealEls].forEach((el) => {
      if (el.getBoundingClientRect().bottom < 0) reveal(el, false);
    });
  };
  window.addEventListener('hashchange', () => setTimeout(revealPassed, 100));
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', () => setTimeout(revealPassed, 700));
  });
  // Same skip happens when the scrollbar is dragged quickly, so sweep once the
  // scrolling settles. Debounced, so this never runs per frame.
  let settleTimer;
  window.addEventListener('scroll', () => {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(revealPassed, 180);
  }, { passive: true });
});

mm.add('(prefers-reduced-motion: reduce)', () => {
  gsap.set('.reveal, .reveal-up', { opacity: 1, y: 0 });
});

// ===== Hide the floating buttons over the Palm City banner =====
// The banner artwork prints its own figures and developer logo in the
// bottom-right corner, exactly where the buttons sit.
const floatingActions = document.querySelector('.floating-actions');
const overviewBanner = document.querySelector('.overview-banner');
if (floatingActions && overviewBanner) {
  new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      floatingActions.classList.toggle('is-hidden', entry.isIntersecting);
    });
  }, {
    // Only react once the banner reaches the lower half of the viewport,
    // where the buttons actually overlap it.
    rootMargin: '-45% 0px 0px 0px',
  }).observe(overviewBanner);
}

// ===== Lightbox (gallery + award photos) =====
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');
const openLightbox = (e) => {
  const img = e.target.closest('img');
  if (!img) return;
  lightboxImg.src = img.dataset.full || img.src;
  lightboxImg.alt = img.alt;
  lightbox.classList.add('is-active');
};
['galleryGrid', 'awardShowcase'].forEach((id) => {
  document.getElementById(id).addEventListener('click', openLightbox);
});
lightboxClose.addEventListener('click', () => lightbox.classList.remove('is-active'));
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.classList.remove('is-active'); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') lightbox.classList.remove('is-active'); });

// ===== Layout tabs =====
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('is-active'));
    tabPanels.forEach(p => p.classList.remove('is-active'));
    btn.classList.add('is-active');
    document.querySelector(`.tab-panel[data-panel="${btn.dataset.target}"]`).classList.add('is-active');
  });
});

// ===== CRM push (shared by the inline contact form and the lead-magnet popup) =====
// Dán URL Web App (từ Apps Script, xem hướng dẫn trong apps-script/Code.gs) vào đây:
const GOOGLE_SCRIPT_URL = '';

function sendLeadToCRM(payload) {
  if (!GOOGLE_SCRIPT_URL) {
    console.warn('Chưa cấu hình GOOGLE_SCRIPT_URL trong js/main.js, lead sẽ không được gửi đi.');
    return;
  }
  // no-cors: Apps Script không trả CORS header, nên gửi kiểu "fire-and-forget".
  fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

// ===== Contact form =====
const contactForm = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');
contactForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!contactForm.checkValidity()) return;

  const formData = new FormData(contactForm);
  sendLeadToCRM({
    name: formData.get('name'),
    phone: formData.get('phone'),
    unit_type: formData.get('unit_type'),
  });

  formSuccess.classList.add('is-active');
  contactForm.reset();
  formSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

// ===== Goal cards (2 nhóm khách) preselect the contact form's "need" field =====
const needSelect = document.getElementById('needSelect');
document.querySelectorAll('.goal-cta').forEach(btn => {
  btn.addEventListener('click', () => {
    if (needSelect && btn.dataset.need) needSelect.value = btn.dataset.need;
  });
});

// ===== Lead magnet popup =====
const docOverlay = document.getElementById('docOverlay');
const docModal = document.getElementById('docModal');
const docClose = document.getElementById('docClose');
const docForm = document.getElementById('docForm');
const docSuccess = document.getElementById('docSuccess');

let docTl = null;

function buildDocTimeline() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tl = gsap.timeline({ paused: true });
  if (reduced) {
    tl.set(docOverlay, { opacity: 1, visibility: 'visible' });
    return tl;
  }
  tl.set(docOverlay, { visibility: 'visible' })
    .fromTo(docOverlay, { opacity: 0 }, { opacity: 1, duration: .35, ease: 'power1.out' })
    .fromTo(docModal, { opacity: 0, y: 28, scale: .96 }, { opacity: 1, y: 0, scale: 1, duration: .5, ease: 'power3.out' }, '<')
    .fromTo('.doc-checklist li', { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: .4, stagger: .06, ease: 'power2.out' }, '-=.25')
    .fromTo('.doc-form > *', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .35, stagger: .05, ease: 'power2.out' }, '-=.3');
  return tl;
}

function openDocPopup() {
  if (docOverlay.classList.contains('is-active')) return;
  docOverlay.classList.add('is-active');
  document.body.style.overflow = 'hidden';
  docTl = buildDocTimeline();
  docTl.play();
}

function closeDocPopup() {
  if (!docOverlay.classList.contains('is-active')) return;
  document.body.style.overflow = '';
  const finish = () => {
    docOverlay.classList.remove('is-active');
    gsap.set(docOverlay, { visibility: 'hidden' });
  };
  if (docTl && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.to([docModal, docOverlay], {
      opacity: 0, duration: .25, ease: 'power1.in', onComplete: finish,
    });
  } else {
    finish();
  }
}

docClose.addEventListener('click', closeDocPopup);
docOverlay.addEventListener('click', (e) => { if (e.target === docOverlay) closeDocPopup(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDocPopup(); });

docForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!docForm.checkValidity()) return;

  const formData = new FormData(docForm);
  sendLeadToCRM({
    name: formData.get('name'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    need: 'Nhận trọn bộ tài liệu dự án',
  });

  docSuccess.classList.add('is-active');
  docForm.querySelector('button').disabled = true;
  setTimeout(closeDocPopup, 2200);
});

// Auto-trigger once per session: after a delay, or at ~45% scroll depth, whichever comes first.
const POPUP_FLAG = 'palmriver_doc_popup_shown';
if (!sessionStorage.getItem(POPUP_FLAG)) {
  const markShown = () => sessionStorage.setItem(POPUP_FLAG, '1');
  let scrollTrigger = null;

  const delayTimer = setTimeout(() => {
    if (scrollTrigger) scrollTrigger.kill();
    openDocPopup();
    markShown();
  }, 20000);

  scrollTrigger = ScrollTrigger.create({
    trigger: document.body,
    start: '45% top',
    once: true,
    onEnter: () => {
      clearTimeout(delayTimer);
      openDocPopup();
      markShown();
    },
  });
}
