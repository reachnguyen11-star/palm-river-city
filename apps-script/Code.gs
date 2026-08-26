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
 *    cột 1  = Ngày          cột 4 = Link chuyển đổi (trang khách gửi form)
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
  // Cột "ad_name": chứa link trang khách bấm gửi form, kèm sẵn utm_source,
  // utm_campaign, fbclid trên đường dẫn nên tự nó đã cho biết nguồn quảng cáo.
  LINK_CHUYEN_DOI: 4,
  STATUS: 7,
  // Cột tên sẵn "anh/chị_quan_tâm_loại_căn_nào?". Ghi cả "need" (Mua để ở /
  // Đầu tư / Cho thuê) lẫn "unit_type" (2PN / 3PN) vào đây, nối bằng " · ",
  // vì sheet không có cột riêng cho "nhu cầu" — xem doPost().
  LOAI_CAN: 17
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

/**
 * Tìm dòng trống kế tiếp của khối hồ sơ khách.
 *
 * KHÔNG dùng sheet.getLastRow(): tab này chứa hai khối dữ liệu chồng nhau.
 * Hồ sơ khách thật nằm ở cột 1-8 và kết thúc quanh dòng 20, còn LeadHub ghi
 * nhật ký hệ thống ở cột 20-26 kéo dài tới dòng 777. getLastRow() trả về 777
 * nên lead mới bị đẩy xuống dòng 778, cách khối dữ liệu thật một khoảng trống
 * hơn 750 dòng.
 *
 * Vì vậy chỉ dò trên các cột mà riêng hồ sơ khách mới dùng (ngày, họ tên,
 * số điện thoại), LeadHub không bao giờ ghi vào đó.
 */
function nextRow_(sheet) {
  var cols = [COL.NGAY, COL.HO_TEN, COL.SO_DIEN_THOAI];
  var maxRows = sheet.getMaxRows();
  var last = 1; // tối thiểu là dòng tiêu đề

  cols.forEach(function (c) {
    var vals = sheet.getRange(1, c, maxRows, 1).getValues();
    for (var i = vals.length - 1; i >= 0; i--) {
      if (String(vals[i][0]).trim() !== '') {
        if (i + 1 > last) last = i + 1;
        break;
      }
    }
  });
  return last + 1;
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
    var row = nextRow_(sheet);
    var phone = String(data.phone || '').trim();

    sheet.getRange(row, COL.NGAY).setValue(timestamp);
    sheet.getRange(row, COL.HO_TEN).setValue(data.name || '');
    // Dấu nháy đơn đầu chuỗi buộc Sheets lưu dạng text, giữ nguyên số 0 đầu.
    // Đã thử setNumberFormat('@') nhưng ô bị bỏ trống, nên dùng cách này.
    sheet.getRange(row, COL.SO_DIEN_THOAI).setValue(phone ? "'" + phone : '');
    sheet.getRange(row, COL.LINK_CHUYEN_DOI).setValue(data.page_url || '');
    sheet.getRange(row, COL.STATUS).setValue('Mới');
    // Cột này chỉ có 1 chỗ để ghi, nhưng form gửi lên nhiều thông tin khác
    // nhau: "need" (Mua để ở / Đầu tư / Cho thuê), "unit_type" (2PN / 3PN),
    // và "budget" (ngân sách dự kiến khách tự khai, xem js/main.js). Trước
    // đây dùng data.unit_type || data.need nên khi cả hai cùng có giá trị,
    // "need" bị unit_type đè mất — sale không còn biết khách thuộc nhóm nào.
    // Nối tất cả lại để không mất thông tin nào.
    var loaiCan = [data.need, data.unit_type, data.budget]
      .filter(function (v) { return v && String(v).trim(); })
      .join(' · ');
    sheet.getRange(row, COL.LOAI_CAN).setValue(loaiCan);

    SpreadsheetApp.flush();

    // Đọc lại số điện thoại vừa ghi. Lead không có số thì vô dụng, nên nếu ô
    // trống phải báo lỗi thật to thay vì trả về "success" rồi mất lead âm thầm.
    var ghiDuoc = String(sheet.getRange(row, COL.SO_DIEN_THOAI).getDisplayValue()).trim();
    if (phone && !ghiDuoc) {
      throw new Error('Ghi số điện thoại thất bại tại dòng ' + row +
                      '. Kiểm tra cột ' + COL.SO_DIEN_THOAI + ' có bị khoá hoặc bảo vệ không.');
    }

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success', row: row, phone: ghiDuoc }))
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
    need: 'Đầu tư',
    unit_type: '2 Phòng ngủ',
    budget: 'Từ 5.5 - 8 tỷ',
    utm_source: 'test',
    page_url: 'https://palm-river.aureal.com.vn/'
  }) } });
  Logger.log(res.getContent());
  // Kỳ vọng: cột LOAI_CAN (17) ghi "Đầu tư · 2 Phòng ngủ · Từ 5.5 - 8 tỷ".
}

/**
 * ==================== TẦNG 2: CONVERSION "LEAD XÁC NHẬN" ====================
 *
 * VÌ SAO CÓ PHẦN NÀY
 * Hiện tại cam-on.html bắn Lead (Meta), conversion MGID và
 * SmartAds NGAY KHI khách vào được trang cảm ơn — tức là mọi form hợp lệ về
 * mặt định dạng đều được tính là 1 conversion tốt, kể cả số ảo/khách bấm nhầm.
 * Vì MGID/SmartAds tối ưu ngân sách dựa trên tín hiệu conversion đó, chúng
 * càng lúc càng tìm thêm traffic giống với những gì đã "được tính là tốt" —
 * đây là lý do kỹ thuật khiến traffic MGID ngày càng rác.
 *
 * Phần dưới đây thêm một tầng conversion THỨ HAI, chỉ bắn khi có người (sale)
 * xác nhận đây là lead thật, để sau này có thể tối ưu quảng cáo theo tín hiệu
 * chất lượng thay vì theo số lượng form-fill. KHÔNG xoá conversion cũ ở
 * cam-on.html — hai tầng chạy song song, một cho volume, một cho chất lượng.
 *
 * CÁCH DÙNG CHO SALE — TẬN DỤNG ĐÚNG CỘT STATUS ĐANG DÙNG HÀNG NGÀY
 * Sale KHÔNG cần học quy ước mới, vẫn chọn dropdown cột G ("Status") như
 * bình thường (Chưa gọi được / Nhận thông tin / Không quan tâm / Quan tâm /
 * RÁC (SALE/ ảo) / Vượt tài chính...).
 *
 * VÌ SAO KIỂM TRA TRỄ 2 NGÀY THAY VÌ BẮN NGAY KHI SALE CHỌN "QUAN TÂM"
 * Nhiều lead cần gọi 2-3 lần mới xác định được tình trạng thật, nên lần đầu
 * chọn "Quan tâm" có thể chưa phải kết luận cuối. Vì vậy phần này KHÔNG chạy
 * ngay khi sửa ô (không phải onEdit) mà chạy 1 lần/ngày, quét toàn bộ sheet,
 * chỉ xét những dòng đã tạo TỪ ÍT NHẤT 2 NGÀY TRƯỚC (đủ thời gian cho sale
 * gọi lại 2-3 lần) và đang có Status = "Quan tâm" tại thời điểm quét — tức
 * là trạng thái đã "chốt", không phải ấn tượng ban đầu. Lead nào ở ngày thứ
 * 2 vẫn chưa gọi xong thì đơn giản là chưa đủ điều kiện, hôm sau quét lại
 * tiếp tục xét cho đến khi status chốt là "Quan tâm" (không có hạn chót).
 * Đổi số ngày chờ ở biến NGUONG_NGAY_CHO bên dưới nếu 2 ngày chưa đủ.
 *
 * QUAN TRỌNG — CẦN BẠN XÁC NHẬN LẠI TRƯỚC KHI BẬT TRIGGER
 * Tôi không có quyền mở Google Sheet thật để soi chính xác danh sách dropdown
 * (chữ hoa/thường, khoảng trắng thừa...), nên TRANG_THAI_HOP_LE bên dưới suy
 * ra từ ảnh chụp màn hình bạn gửi. Trước khi cài trigger, mở cột G -> nhấp
 * vào 1 ô đang có mũi tên dropdown -> "Quản lý các quy tắc" (Manage rules)
 * để xem đúng nguyên văn chữ trong danh sách, đối chiếu với biến bên dưới.
 * Sai 1 khoảng trắng hay 1 chữ hoa/thường là hàm im lặng không gửi được gì.
 *
 * CÀI ĐẶT (làm 1 lần)
 * 1. Vào https://business.facebook.com/events_manager -> chọn nguồn dữ liệu
 *    là Pixel của Palm River -> tab "Cài đặt" -> mục "Conversions API" ->
 *    "Tạo access token thủ công" -> copy token.
 * 2. Dán token vào biến META_CAPI_ACCESS_TOKEN ngay bên dưới, Ctrl+S.
 * 3. Menu bên trái Apps Script -> biểu tượng đồng hồ "Triggers" -> "Add Trigger":
 *      - Function: quetLeadDuDieuKienHangNgay
 *      - Event source: Time-driven (Theo thời gian)
 *      - Type: Day timer (Bộ đếm thời gian theo ngày)
 *      - Time of day: chọn 1 khung giờ ít lead phát sinh, ví dụ 6-7 sáng
 *    Bấm Save, cấp quyền nếu được hỏi (script của chính bạn, an toàn).
 * 4. Kiểm tra ngay không cần chờ 1 ngày: chọn hàm quetLeadDuDieuKienHangNgay
 *    ở thanh trên Apps Script -> bấm Run -> xem "Executions" có chạy thành
 *    công không. Muốn thử với 1 lead vừa tạo hôm nay (chưa đủ 2 ngày), tạm
 *    sửa NGUONG_NGAY_CHO thành 0, chạy thử, rồi trả lại thành 2. Nên dùng
 *    công cụ "Test Events" trong Meta Events Manager để soi sự kiện vừa gửi
 *    trước khi tin tưởng số liệu.
 * 5. Sau khi có dữ liệu vài ngày: trong Meta Ads Manager, thêm cột đo lường
 *    theo custom conversion "Lead xác nhận" cạnh "Lead" để so sánh, rồi cân
 *    nhắc đổi mục tiêu tối ưu chiến dịch nếu đủ volume (khi nào có chạy Meta).
 *
 * VỀ MGID / SMARTADS
 * Hai mạng này hiện tính conversion theo "URL đích" (khách vào cam-on.html),
 * không phải theo sự kiện JS như Meta, nên không thể chỉ thêm dòng code là
 * xong — cần họ có cơ chế postback/S2S theo click ID mới bắn được conversion
 * thứ hai. Việc cần làm (ngoài phạm vi sửa code): hỏi account manager MGID
 * và SmartAds/eClick câu hỏi cụ thể "có hỗ trợ postback conversion qua click
 * ID không, endpoint dạng gì". Có endpoint thật thì điền vào
 * MGID_POSTBACK_URL_TEMPLATE bên dưới, hàm guiMgidPostback_ sẽ tự dùng —
 * click ID của MGID (tham số "mglnd") đã có sẵn trong cột LINK_CHUYEN_DOI
 * (cột 4) vì đó là URL đầy đủ khách bấm gửi form.
 * ============================================================================
 */

var META_PIXEL_IDS = ['3392425294339402', '3415976945217817'];
var META_CAPI_ACCESS_TOKEN = ''; // TODO: dán access token lấy từ Meta Events Manager

// TODO: điền khi MGID/eClick xác nhận có endpoint postback, ví dụ dạng
// 'https://postback.mgid.com/xxx?click_id={CLICK_ID}'. Để trống = bỏ qua.
var MGID_POSTBACK_URL_TEMPLATE = '';

// Giá trị nào trong dropdown cột Status được coi là "lead thật, đáng tối ưu
// theo" — hiện chỉ có "Quan tâm". Dùng mảng để sau này thêm biến thể (ví dụ
// nếu sale tách thêm "Quan tâm - hẹn xem nhà") mà không phải sửa logic bên
// dưới, chỉ cần thêm 1 dòng vào đây. XEM GHI CHÚ Ở TRÊN trước khi bật trigger.
var TRANG_THAI_HOP_LE = ['Quan tâm'];

// Số ngày tối thiểu kể từ lúc lead vào sheet mới được xét gửi conversion —
// đủ thời gian cho sale gọi lại 2-3 lần trước khi hệ thống chốt theo status
// hiện tại của dòng đó. Xem giải thích đầy đủ ở khối comment phía trên.
var NGUONG_NGAY_CHO = 2;

/**
 * Chạy 1 lần/ngày qua trigger "Time-driven" (xem hướng dẫn cài đặt ở trên).
 * KHÔNG dùng onEdit vì cần đợi vài ngày sau khi tạo lead mới được xét, không
 * phải xét ngay lúc sale sửa ô — xem lý do ở khối comment phía trên.
 */
function quetLeadDuDieuKienHangNgay() {
  var sheet = getSheet_();
  var soDongCuoi = nextRow_(sheet) - 1;
  if (soDongCuoi < 2) return; // dòng 1 là tiêu đề, chưa có lead nào cả

  var soDaGui = 0;
  for (var row = 2; row <= soDongCuoi; row++) {
    var statusCell = sheet.getRange(row, COL.STATUS);
    var trangThai = String(statusCell.getValue()).trim();
    if (TRANG_THAI_HOP_LE.indexOf(trangThai) === -1) continue;

    // Bẫy gửi trùng: dòng đã gửi rồi thì bỏ qua, kể cả khi status bị đổi
    // qua lại nhiều lần sau đó.
    if (statusCell.getNote() === 'da_gui_capi') continue;

    var ngayTao = parseNgayTaoLead_(sheet.getRange(row, COL.NGAY).getValue());
    if (!ngayTao) continue; // không đọc được ngày tạo -> bỏ qua an toàn, không đoán
    var soNgayDaTroi = (Date.now() - ngayTao.getTime()) / 86400000;
    if (soNgayDaTroi < NGUONG_NGAY_CHO) continue; // còn quá mới, để sale gọi thêm

    var name = sheet.getRange(row, COL.HO_TEN).getValue();
    var phone = sheet.getRange(row, COL.SO_DIEN_THOAI).getDisplayValue();
    var pageUrl = sheet.getRange(row, COL.LINK_CHUYEN_DOI).getValue();

    var ok = guiMetaCapi_(name, phone, pageUrl);
    if (ok && MGID_POSTBACK_URL_TEMPLATE) {
      guiMgidPostback_(layClickIdMgid_(pageUrl));
    }
    if (ok) { statusCell.setNote('da_gui_capi'); soDaGui++; }
  }
  Logger.log('[Lead xác nhận] Đã gửi conversion cho ' + soDaGui + ' dòng.');
}

/** Cột NGAY được ghi bằng Utilities.formatDate dạng "yyyy-MM-dd HH:mm:ss";
 * Sheets có thể tự nhận thành Date thật hoặc giữ nguyên dạng text tuỳ định
 * dạng cột, nên xử lý cả 2 trường hợp thay vì giả định một kiểu cố định. */
function parseNgayTaoLead_(value) {
  if (value instanceof Date) return value;
  var m = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
}

/** Gửi sự kiện "Lead xác nhận" về Meta Conversions API cho từng pixel. */
function guiMetaCapi_(name, phone, pageUrl) {
  if (!META_CAPI_ACCESS_TOKEN) {
    Logger.log('[CAPI] Chưa cấu hình META_CAPI_ACCESS_TOKEN, bỏ qua gửi conversion.');
    return false;
  }
  var sdtChuanHoa = chuanHoaSdtVN_(phone);
  if (!sdtChuanHoa) {
    Logger.log('[CAPI] Số điện thoại không hợp lệ để gửi CAPI: ' + phone);
    return false;
  }

  var payload = {
    data: [{
      event_name: 'Lead xác nhận',
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'system_generated',
      event_source_url: pageUrl || undefined,
      user_data: {
        ph: [sha256Hex_(sdtChuanHoa)],
        fn: name ? [sha256Hex_(String(name).trim().toLowerCase())] : undefined,
      },
    }],
  };

  var thanhCong = true;
  META_PIXEL_IDS.forEach(function (pixelId) {
    var url = 'https://graph.facebook.com/v19.0/' + pixelId + '/events?access_token=' + META_CAPI_ACCESS_TOKEN;
    try {
      var res = UrlFetchApp.fetch(url, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true,
      });
      Logger.log('[CAPI] pixel ' + pixelId + ': ' + res.getResponseCode() + ' ' + res.getContentText());
      if (res.getResponseCode() >= 300) thanhCong = false;
    } catch (err) {
      Logger.log('[CAPI] lỗi gửi pixel ' + pixelId + ': ' + err.message);
      thanhCong = false;
    }
  });
  return thanhCong;
}

/** Chuẩn hoá số VN dạng 0xxxxxxxxx sang +84xxxxxxxxx (yêu cầu định dạng của Meta CAPI). */
function chuanHoaSdtVN_(phone) {
  var digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 10 && digits.charAt(0) === '0') return '84' + digits.substring(1);
  if (digits.length === 11 && digits.indexOf('84') === 0) return digits;
  return null;
}

function sha256Hex_(text) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8);
  return bytes.map(function (b) {
    var v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

/** Lấy tham số "mglnd" (click ID của MGID) từ URL trang khách gửi form. */
function layClickIdMgid_(pageUrl) {
  var m = String(pageUrl || '').match(/[?&]mglnd=([^&]+)/);
  return m ? decodeURIComponent(m[1]) : '';
}

/** Chỉ chạy khi đã điền MGID_POSTBACK_URL_TEMPLATE — xem hướng dẫn ở đầu khối này. */
function guiMgidPostback_(clickId) {
  if (!clickId) {
    Logger.log('[MGID postback] Không tìm thấy click ID (mglnd) trong URL, bỏ qua.');
    return;
  }
  var url = MGID_POSTBACK_URL_TEMPLATE.replace('{CLICK_ID}', encodeURIComponent(clickId));
  try {
    var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    Logger.log('[MGID postback] ' + res.getResponseCode() + ' ' + res.getContentText());
  } catch (err) {
    Logger.log('[MGID postback] lỗi: ' + err.message);
  }
}
