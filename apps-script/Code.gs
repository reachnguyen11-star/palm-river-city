/**
 * Palm River — nhận lead từ form liên hệ trên website và ghi vào
 * Google Sheet CRM chung của Aureal (tab "GLADIA HEIGHTS" theo gid,
 * dùng chung cho nhiều dự án, phân biệt bằng cột crm_target_tab).
 *
 * CÁCH DEPLOY (làm 1 lần):
 * 1. Mở Google Sheet CRM -> menu "Extensions" (Tiện ích mở rộng) -> "Apps Script".
 * 2. Xoá code mẫu trong Code.gs, dán toàn bộ nội dung file này vào.
 * 3. Menu "Deploy" (Triển khai) -> "New deployment" (Bản triển khai mới).
 *    - Chọn loại "Web app".
 *    - Execute as: Me (chính bạn).
 *    - Who has access: Anyone (Bất kỳ ai).
 * 4. Bấm "Deploy", cấp quyền (Authorize) cho script khi được hỏi.
 * 5. Copy URL dạng https://script.google.com/macros/s/XXXXX/exec
 * 6. Dán URL đó vào biến GOOGLE_SCRIPT_URL trong file js/main.js.
 */

var SPREADSHEET_ID = '1pijqWp4h0g7QFs6Fnt1tXlkSvnFfoZj6e6v0B78SlCQ';
var TARGET_GID = 518122682; // tab CRM mà bạn đã gửi link

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = null;
    ss.getSheets().forEach(function (s) {
      if (s.getSheetId() === TARGET_GID) sheet = s;
    });
    if (!sheet) throw new Error('Không tìm thấy tab với gid ' + TARGET_GID);

    var timestamp = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd HH:mm:ss');

    // Sheet CRM dùng chung không có cột riêng cho loại căn/ngân sách,
    // nên gộp các thông tin phụ vào một chuỗi trong cột "nhu cầu".
    var needParts = [data.need || ''];
    if (data.unit_type) needParts.push('Căn: ' + data.unit_type);
    if (data.budget) needParts.push('Ngân sách: ' + data.budget);
    var needText = needParts.filter(Boolean).join(' | ');

    // Thứ tự cột PHẢI khớp đúng header hiện có của sheet:
    // id | created_time | ad_id | ad_name | adset_id | adset_name | Status |
    // PHẢN HỒI 1 | PHẢN HỒI 2 | PHẢN HỒI 3 | campaign_id | campaign_name |
    // form_id | form_name | is_organic | platform |
    // anh/chị_quan_tâm_loại_căn_nào? | full_name | phone | email |
    // inbox_url | lead_status | source_type | crm_status | crm_pushed_at | crm_target_tab
    sheet.appendRow([
      '',                          // id
      timestamp,                   // created_time
      '', '', '', '',              // ad_id, ad_name, adset_id, adset_name
      '',                          // Status
      '', '', '',                  // PHẢN HỒI 1-3
      '',                          // campaign_id
      'Palm River - Website',      // campaign_name
      'PALMRIVER_WEB',             // form_id
      'Palm River Contact Form',   // form_name
      true,                        // is_organic
      'Website',                   // platform
      needText,                    // anh/chị_quan_tâm_loại_căn_nào?
      data.name || '',             // full_name
      data.phone || '',            // phone
      data.email || '',            // email
      '',                          // inbox_url
      '',                          // lead_status
      'Website Palm River',        // source_type
      '',                          // crm_status
      '',                          // crm_pushed_at
      'PALM RIVER'                 // crm_target_tab
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
