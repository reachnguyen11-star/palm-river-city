/**
 * Palm River — nhận lead từ website và ghi vào Google Sheet CRM của Aureal.
 *
 * Sheet:  1pijqWp4h0g7QFs6Fnt1tXlkSvnFfoZj6e6v0B78SlCQ
 * Tab:    "PALM RIVER OUT" (tab có sẵn, script không tự tạo)
 *
 * ===================== CẬP NHẬT CODE ĐÃ DEPLOY =====================
 * Web App đã deploy rồi, URL giữ nguyên, chỉ cần cập nhật code:
 *
 * 1. Mở Google Sheet -> "Extensions" -> "Apps Script"
 * 2. Xoá hết code cũ, dán TOÀN BỘ file này vào, Ctrl+S
 * 3. Chọn hàm "testGhiThu" ở thanh trên -> bấm Run -> mở tab PALM RIVER OUT
 *    kiểm tra dòng test đã vào đúng cột chưa
 * 4. "Deploy" -> "Manage deployments" -> bấm bút chì (Edit) ->
 *    Version: chọn "New version" -> bấm "Deploy"
 *    KHÔNG tạo deployment mới, làm vậy sẽ ra URL khác.
 * ====================================================================
 *
 * ==================== DEPLOY LẦN ĐẦU (đã làm xong) ====================
 * Giữ lại để tham khảo khi dựng cho dự án khác.
 *
 * 1. Mở Google Sheet ở trên -> menu "Extensions" (Tiện ích mở rộng) -> "Apps Script"
 * 2. Xoá hết code mẫu trong Code.gs, dán TOÀN BỘ file này vào, bấm lưu (Ctrl+S)
 * 3. Bấm "Deploy" (Triển khai) -> "New deployment" (Bản triển khai mới)
 *      - Bấm icon bánh răng cạnh "Select type", chọn "Web app"
 *      - Description: gõ gì cũng được, ví dụ "Palm River lead"
 *      - Execute as:      Me  (chính bạn)
 *      - Who has access:  Anyone   <-- QUAN TRỌNG, phải là "Anyone",
 *                                      KHÔNG phải "Anyone with Google account"
 * 4. Bấm "Deploy", Google hỏi quyền thì bấm "Authorize access", chọn tài khoản,
 *    gặp màn hình "Google hasn't verified this app" thì bấm "Advanced"
 *    -> "Go to ... (unsafe)" -> "Allow". Đây là script của chính bạn nên an toàn.
 * 5. Copy URL dạng:  https://script.google.com/macros/s/AKfy..../exec
 * 6. Gửi URL đó cho tôi, hoặc tự dán vào biến GOOGLE_SCRIPT_URL trong js/main.js
 *
 * KIỂM TRA NHANH: mở thẳng URL đó trên trình duyệt. Nếu thấy chữ
 * "Palm River lead endpoint OK" là script đã sống.
 *
 * LƯU Ý: mỗi lần sửa code này phải "Deploy -> Manage deployments -> bút chì ->
 * Version: New version -> Deploy" thì thay đổi mới có hiệu lực. URL giữ nguyên.
 * ====================================================================
 */

var SPREADSHEET_ID = '1pijqWp4h0g7QFs6Fnt1tXlkSvnFfoZj6e6v0B78SlCQ';

var SHEET_NAME = 'PALM RIVER OUT';

/**
 * CẢNH BÁO VỀ CỘT — đọc trước khi sửa.
 *
 * Dòng tiêu đề của tab này KHÔNG khớp với dữ liệu bên dưới. Tiêu đề ghi
 * cột 1 là "id", cột 18 là "full_name", cột 19 là "phone", nhưng kiểm tra
 * 776 dòng thực tế cho thấy cột 18 và 19 trống hoàn toàn, còn dữ liệu nằm ở:
 *
 *    cột 1  = Ngày          cột 4 = Tên quảng cáo / nguồn
 *    cột 2  = Họ tên        cột 7 = Status
 *    cột 3  = Số điện thoại cột 8 = PHẢN HỒI 1 (sale ghi chú)
 *    cột 20-26 = LeadHub dùng làm cột hệ thống (SKIPPED, PUSHED, ...)
 *
 * Vì vậy phải ghi theo DỮ LIỆU THẬT, không theo tiêu đề. Ghi theo tiêu đề
 * thì tên và số điện thoại rơi vào cột 18-19, nơi không ai nhìn.
 */
var COL = {
  NGAY: 1,
  HO_TEN: 2,
  SO_DIEN_THOAI: 3,
  NGUON: 4,
  STATUS: 7,
  LOAI_CAN: 17   // cột tên sẵn "anh/chị_quan_tâm_loại_căn_nào?", đang trống 100%
};

/** Mở URL trên trình duyệt để kiểm tra script còn sống. */
function doGet() {
  return ContentService.createTextOutput('Palm River lead endpoint OK');
}

/**
 * Lấy tab PALM RIVER OUT. KHÔNG tự tạo nếu thiếu: tab này đã tồn tại sẵn,
 * nếu không tìm thấy nghĩa là tên bị gõ sai hoặc tab bị đổi tên, khi đó
 * báo lỗi rõ ràng còn hơn âm thầm tạo một tab rỗng thứ hai.
 */
function getSheet_() {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('Không tìm thấy tab "' + SHEET_NAME + '" trong sheet');
  return sheet;
}

function doPost(e) {
  // Khoá lại để hai lead gửi cùng lúc không ghi đè nhau.
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = getSheet_();
    var timestamp = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd HH:mm:ss');

    // Ghi từng ô theo đúng vị trí thật, không dùng appendRow với mảng đủ 26 phần tử,
    // để không đụng vào các cột 20-26 mà LeadHub đang dùng.
    var row = sheet.getLastRow() + 1;
    var nguon = 'Website Palm River';
    if (data.source) nguon += ' - ' + data.source;
    if (data.utm_source) nguon += ' (' + data.utm_source + ')';

    sheet.getRange(row, COL.NGAY).setValue(timestamp);
    sheet.getRange(row, COL.HO_TEN).setValue(data.name || '');
    // Đặt định dạng text để Sheets không ăn mất số 0 đầu số điện thoại.
    sheet.getRange(row, COL.SO_DIEN_THOAI)
      .setNumberFormat('@')
      .setValue(data.phone || '');
    sheet.getRange(row, COL.NGUON).setValue(nguon);
    sheet.getRange(row, COL.STATUS).setValue('Mới');
    sheet.getRange(row, COL.LOAI_CAN).setValue(data.unit_type || data.need || '');

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Chạy thử ngay trong Apps Script mà không cần website.
 * Chọn hàm này ở thanh trên rồi bấm Run, sau đó mở sheet xem đã có dòng test chưa.
 */
function testGhiThu() {
  var res = doPost({ postData: { contents: JSON.stringify({
    source: 'Chạy thử từ Apps Script',
    name: 'Nguyễn Văn Test',
    phone: '0912345678',
    email: 'test@example.com',
    unit_type: '2 Phòng ngủ',
    utm_source: 'test',
    page_url: 'https://palm-river.aureal.com.vn/'
  }) } });
  Logger.log(res.getContent());
}
