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

  // threshold: 0 (không phải .15) - bắt buộc, vì threshold tính theo % DIỆN
  // TÍCH CỦA CHÍNH PHẦN TỬ chứ không phải % viewport. Với khối cao hơn hẳn
  // viewport (vd .amenity-photo-grid trên mobile ~5464px, 20 ảnh xếp 1 cột),
  // 15% chiều cao của nó có thể lớn hơn cả phần viewport khả dụng sau khi
  // trừ rootMargin - tức threshold không bao giờ đạt được, phần tử kẹt
  // opacity:0 vĩnh viễn dù ảnh bên trong đã tải xong (trông như "chậm/không
  // load" nhưng thực ra là kẹt vô hình). threshold:0 kích hoạt ngay khi vừa
  // chạm rootMargin, không phụ thuộc chiều cao phần tử.
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) reveal(entry.target, true);
    });
  }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });
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

// ===== Lightbox (gallery + award photos + location & masterplan) =====
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');
const openLightbox = (e) => {
  const container = e.target.closest('.zoomable-image') || e.target.closest('img');
  const img = container ? (container.tagName.toLowerCase() === 'img' ? container : container.querySelector('img')) : null;
  if (!img) return;
  lightboxImg.src = img.dataset.full || img.src;
  lightboxImg.alt = img.alt;
  lightbox.classList.add('is-active');
};
['galleryGrid', 'awardShowcase', 'locationImageWrap', 'masterplanImageWrap', 'amenityPhotoGrid', 'interiorGallery'].forEach((id) => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('click', openLightbox);
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

// ===== Đẩy lead về Google Sheet CRM =====
// Lead đã được gửi song song về LeadHub bằng đoạn mã ở cuối index.html.
// Đây là đường thứ hai, ghi thẳng vào Google Sheet của Aureal.
//
// URL Web App của Apps Script, ghi vào tab "PALM RIVER" của sheet CRM.
// Muốn đổi: xem hướng dẫn deploy ở đầu file apps-script/Code.gs
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxMfPxi4VoGmyzk2kFfSmXjMeBSpajotvYrshgb5WcbFMIbARB2_xEBfAQMHgiMI3cUBQ/exec';

function sendLeadToCRM(payload) {
  if (!GOOGLE_SCRIPT_URL) {
    console.warn('[Sheet] Chưa cấu hình GOOGLE_SCRIPT_URL trong js/main.js, lead KHÔNG vào Google Sheet. Lead vẫn đi về LeadHub bình thường.');
    return;
  }

  // Gắn kèm nguồn quảng cáo để đối chiếu được với dữ liệu bên Meta/MGID.
  const q = new URLSearchParams(location.search);
  const body = {
    ...payload,
    page_url: location.href,
    utm_source: q.get('utm_source') || '',
    utm_campaign: q.get('utm_campaign') || '',
  };

  // keepalive: request vẫn hoàn tất kể cả khi trang chuyển sang trang cảm ơn.
  // no-cors: Apps Script không trả CORS header nên không đọc được phản hồi,
  // đây là gửi kiểu "fire-and-forget", lỗi phía Sheet sẽ không hiện ở Console.
  fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {});
  console.log('[Sheet] đã gửi lead:', body.phone);
}

// Trang cảm ơn. MGID và SmartAds tính chuyển đổi theo URL đích, nên mọi form
// đăng ký thành công đều phải dẫn về đây; pixel chuyển đổi nằm sẵn trong đó.
const THANK_YOU_URL = 'cam-on.html';

// Chuyển sang trang cảm ơn sau khi đã gửi lead đi.
// LeadHub dùng fetch keepalive nên request vẫn hoàn tất dù trang đang rời đi,
// nhưng vẫn chờ một nhịp ngắn để chắc chắn request kịp rời khỏi trình duyệt.
function goToThankYou() {
  setTimeout(() => { window.location.href = THANK_YOU_URL; }, 600);
}

// ===== Chống bot khi gửi form =====
// Hai lớp kiểm tra rẻ tiền nhưng chặn được phần lớn bot điền form tự động:
// (1) honeypot "company" phải luôn trống với người thật; (2) không ai điền
// xong form nhanh hơn ~1.5s kể từ lúc trang/popup sẵn sàng, bot script thì có.
// Bị nghi là bot -> âm thầm bỏ qua (không gửi CRM, không bắn conversion,
// không báo lỗi) để không lộ cơ chế lọc cho bot biết.
const PAGE_LOAD_TIME = Date.now();
const MIN_FILL_TIME_MS = 1500;

function isSuspectedBot_(form, readySince) {
  const honeypot = form.querySelector('input[name="company"]');
  if (honeypot && honeypot.value.trim() !== '') return true;
  if (Date.now() - readySince < MIN_FILL_TIME_MS) return true;
  return false;
}


// ===== Contact form =====
const contactForm = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');
contactForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!contactForm.checkValidity()) return;
  if (isSuspectedBot_(contactForm, PAGE_LOAD_TIME)) return;

  const formData = new FormData(contactForm);
  sendLeadToCRM({
    source: 'Form liên hệ',
    name: formData.get('name'),
    phone: formData.get('phone'),
    need: formData.get('need'),
    unit_type: formData.get('unit_type'),
    budget: formData.get('budget'),
  });

  formSuccess.classList.add('is-active');
  formSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  goToThankYou();
});

// ===== Goal cards (2 nhóm khách) preselect the contact form's "need" field =====
const needSelect = document.getElementById('needSelect');
document.querySelectorAll('.goal-cta').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!needSelect || !btn.dataset.need) return;
    needSelect.value = btn.dataset.need;
    // Nhấp nháy viền vàng một nhịp để khách thấy lựa chọn của mình đã được
    // điền sẵn, vì thao tác này xảy ra ngay lúc trang đang cuộn xuống form.
    needSelect.classList.add('is-preset');
    setTimeout(() => needSelect.classList.remove('is-preset'), 1600);
  });
});

// ===== Form thu lead nhanh trong hero (thay cho popup đã bỏ) =====
const heroForm = document.getElementById('heroForm');
const heroFormSuccess = document.getElementById('heroFormSuccess');
if (heroForm) {
  heroForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!heroForm.checkValidity()) return;
    if (isSuspectedBot_(heroForm, PAGE_LOAD_TIME)) return;

    const formData = new FormData(heroForm);
    sendLeadToCRM({
      source: 'Form hero',
      name: formData.get('name'),
      phone: formData.get('phone'),
      need: formData.get('need'),
    });

    heroFormSuccess.classList.add('is-active');
    heroForm.querySelector('button').disabled = true;
    goToThankYou();
  });
}

// ===== CTA ngữ cảnh giữa trang (sau Vị trí/Tiện ích/Mặt bằng/Chủ đầu tư) =====
// Gửi thẳng tại chỗ thay vì cuộn xuống #lien-he. Chỉ hỏi SĐT nên payload
// không có "name"; data-source trên mỗi form cho biết khách rời trang ở
// đoạn nội dung nào để sale có thêm ngữ cảnh khi gọi.
document.querySelectorAll('.midpage-cta-form').forEach((form) => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) return;
    if (isSuspectedBot_(form, PAGE_LOAD_TIME)) return;

    const formData = new FormData(form);
    sendLeadToCRM({
      source: form.dataset.source || 'CTA giữa trang',
      phone: formData.get('phone'),
    });

    const btn = form.querySelector('button');
    btn.disabled = true;
    btn.textContent = 'Đã ghi nhận, cảm ơn bạn!';
    goToThankYou();
  });
});
