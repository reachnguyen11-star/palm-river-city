/**
 * Palm River — nhận lead từ website và ghi vào Google Sheet CRM của Aureal.
 *
 * Sheet:  1pijqWp4h0g7QFs6Fnt1tXlkSvnFfoZj6e6v0B78SlCQ
 * Tab:    "PALM RIVER" — script tự tạo nếu chưa có
 *
 * ============================ CÁCH DEPLOY ============================
 * Làm 1 lần, khoảng 2 phút. Bước 3 và 5 bắt buộc phải đúng, sai là không chạy.
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

// Ghi vào tab riêng của Palm River, không dùng chung tab lead Facebook.
// Tab dùng chung có cột kiểu Facebook Lead Ads (ad_id, adset_id, campaign_id...)
// không áp dụng cho lead từ website, ghi vào đó sẽ để trống quá nửa số cột.
// Chưa có tab này thì script tự tạo kèm tiêu đề.
var SHEET_NAME = 'PALM RIVER';

var HEADER = [
  'Thời gian', 'Nguồn form', 'Họ tên', 'Số điện thoại', 'Email',
  'Loại căn quan tâm', 'Ngân sách', 'utm_source', 'utm_campaign',
  'Trang gửi', 'Trạng thái', 'Ghi chú'
];

/** Mở URL trên trình duyệt để kiểm tra script còn sống. */
function doGet() {
  return ContentService.createTextOutput('Palm River lead endpoint OK');
}

/** Lấy tab PALM RIVER, chưa có thì tạo mới kèm dòng tiêu đề. */
function getSheet_() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME, 0);
    sheet.appendRow(HEADER);
    sheet.getRange(1, 1, 1, HEADER.length)
      .setFontWeight('bold')
      .setBackground('#0b1605')
      .setFontColor('#f3dfaa');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 150);  // thời gian
    sheet.setColumnWidth(3, 170);  // họ tên
    sheet.setColumnWidth(4, 130);  // số điện thoại
    sheet.setColumnWidth(10, 260); // trang gửi
  }
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

    sheet.appendRow([
      timestamp,                          // Thời gian
      data.source || 'Website',           // Nguồn form: form liên hệ hay popup
      data.name || '',                    // Họ tên
      "'" + (data.phone || ''),           // Số điện thoại: dấu ' để Sheets giữ số 0 đầu
      data.email || '',                   // Email
      data.unit_type || data.need || '',  // Loại căn quan tâm
      data.budget || '',                  // Ngân sách
      data.utm_source || '',              // utm_source
      data.utm_campaign || '',            // utm_campaign
      data.page_url || '',                // Trang gửi
      'Mới',                              // Trạng thái, để sale tự cập nhật
      ''                                  // Ghi chú
    ]);

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
