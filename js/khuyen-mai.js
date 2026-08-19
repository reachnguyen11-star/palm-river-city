/* =====================================================================
   PALM RIVER — Khối ưu đãi + đồng hồ đếm ngược
   ---------------------------------------------------------------------
   Sửa nội dung ưu đãi tại khối CAU_HINH ngay bên dưới.
   Hướng dẫn đầy đủ: khuyen-mai.md
===================================================================== */
(function () {
  'use strict';

  var CAU_HINH = {
    // Hạn chót ưu đãi, giờ Việt Nam (UTC+7). Qua mốc này khối ưu đãi tự ẩn.
    hanChot: '2026-08-30T23:59:59+07:00',

    tieuDe: 'Chính sách ưu đãi đợt đầu',

    // Các điểm nhấn ưu đãi. Thêm, bớt hoặc sửa tự do.
    // Để mảng rỗng [] nếu chưa chốt số — khi đó chỉ còn tiêu đề và bộ đếm.
    uuDai: [
      { nhan: 'Chiết khấu đến', so: '12%' },
      { nhan: 'Vốn ban đầu chỉ', so: '10%' },
    ],

    ghiChu: 'Áp dụng đến hết ngày {ngay}',
  };

  var khoi = document.querySelectorAll('[data-offer]');
  if (!khoi.length) return;

  var moc = new Date(CAU_HINH.hanChot).getTime();
  if (isNaN(moc)) {
    console.warn('[Ưu đãi] hanChot không hợp lệ:', CAU_HINH.hanChot);
    return;
  }

  // Ngày hiển thị lấy thẳng từ chuỗi cấu hình thay vì từ Date, để múi giờ của
  // máy khách không đẩy nhãn sang ngày liền kề (23:59 +07 là 16:59 UTC).
  var phanTich = /^(\d{4})-(\d{2})-(\d{2})/.exec(CAU_HINH.hanChot);
  var ngayHienThi = phanTich
    ? phanTich[3] + '.' + phanTich[2] + '.' + phanTich[1]
    : '';

  var ghiChu = CAU_HINH.ghiChu.replace('{ngay}', ngayHienThi);
  var dsUuDai = CAU_HINH.uuDai || [];

  khoi.forEach(function (box) {
    var elTieuDe = box.querySelector('[data-offer-title]');
    var elGhiChu = box.querySelector('[data-offer-note]');
    var elUuDai = box.querySelector('[data-offer-perks]');

    if (elTieuDe) elTieuDe.textContent = CAU_HINH.tieuDe;
    if (elGhiChu) elGhiChu.textContent = ghiChu;
    if (!elUuDai) return;

    // Dựng bằng DOM API thay vì innerHTML để nội dung cấu hình luôn được
    // xử lý như chữ thuần, không bao giờ thành thẻ HTML.
    elUuDai.textContent = '';
    dsUuDai.forEach(function (ud) {
      var pill = document.createElement('span');
      pill.className = 'offer-perk';
      pill.appendChild(document.createTextNode(ud.nhan + ' '));
      var so = document.createElement('b');
      so.textContent = ud.so;
      pill.appendChild(so);
      elUuDai.appendChild(pill);
    });
  });

  function dem2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  var boDem = null;

  function nhip() {
    var conLai = moc - Date.now();

    // Hết hạn: ẩn hẳn thay vì để countdown chạy về số âm.
    if (conLai <= 0) {
      khoi.forEach(function (box) { box.hidden = true; });
      if (boDem) clearInterval(boDem);
      return;
    }

    var tongGiay = Math.floor(conLai / 1000);
    var ngay = Math.floor(tongGiay / 86400);
    var gio = Math.floor((tongGiay % 86400) / 3600);
    var phut = Math.floor((tongGiay % 3600) / 60);
    var giay = tongGiay % 60;

    khoi.forEach(function (box) {
      var d = box.querySelector('[data-cd="d"]');
      var h = box.querySelector('[data-cd="h"]');
      var m = box.querySelector('[data-cd="m"]');
      var s = box.querySelector('[data-cd="s"]');
      if (d) d.textContent = dem2(ngay);
      if (h) h.textContent = dem2(gio);
      if (m) m.textContent = dem2(phut);
      if (s) s.textContent = dem2(giay);
      box.hidden = false;
    });
  }

  nhip();
  // Cần chạy mỗi giây để ô "Giây" chạy mượt, không nhảy cụm như nhịp 15s cũ.
  boDem = setInterval(nhip, 1000);
})();
