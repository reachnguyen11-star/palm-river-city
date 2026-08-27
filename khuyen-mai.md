# PALM RIVER — Brief ưu đãi & CTA

> **File này để bạn chỉnh sửa.** Mọi con số, câu chữ và quyết định bật/tắt ghi ở đây.
> Sau khi bạn sửa xong, phần A và B được đồng bộ sang code tại `js/khuyen-mai.js`.
> Cập nhật lần cuối: 19/08/2026

---

## A. Thông số ưu đãi — ĐIỀN VÀO ĐÂY

| Thông số | Giá trị hiện tại | Ghi chú |
|---|---|---|
| **Hạn chót ưu đãi** | `30/08/2026` (hết ngày, 23:59) | Đã chốt. Countdown đang đếm về mốc này |
| **Chiết khấu** | `đến 16.5%` | Đã chốt |
| **Tổng giá căn** | `chỉ từ 5.5 tỷ` | Đã chốt (thay "Vốn ban đầu chỉ 10%" cũ) |
| **Tên gọi đợt** | `đợt đầu` | Hoặc: "đợt mở bán đầu tiên", "giai đoạn 1" |
| **Điều kiện áp dụng** | *(chưa có)* | VD: áp dụng cho khách ký HĐĐC trước hạn |

### Cách sửa trong code

Mở [js/khuyen-mai.js](js/khuyen-mai.js), chỉnh khối `CAU_HINH` ở đầu file:

```js
var CAU_HINH = {
  hanChot: '2026-08-30T23:59:59+07:00',   // ← đổi hạn chót ở đây
  tieuDe:  'Chính sách ưu đãi đợt đầu',
  uuDai: [                                 // ← thêm/bớt/sửa điểm nhấn ở đây
    { nhan: 'Chiết khấu đến',        so: '16.5%' },
    { nhan: 'Tổng giá căn chỉ từ',   so: '5.5 tỷ' },
  ],
  ...
};
```

Cả 2 vị trí countdown trên trang dùng chung cấu hình này, sửa một lần là xong.
Muốn bỏ hẳn phần điểm nhấn thì để `uuDai: []` — trang vẫn còn tiêu đề và bộ đếm.

---

## B. Copy cho từng vị trí

### B1. Popup nhận tài liệu *(đã triển khai)*

Vị trí: ngay trên form điền thông tin trong popup.

```
        CHÍNH SÁCH ƯU ĐÃI ĐỢT ĐẦU
   ( Chiết khấu đến 16.5% ) ( Tổng giá căn chỉ từ 5.5 tỷ )
      ┌────┐   ┌────┐   ┌────┐
      │ 11 │   │ 14 │   │ 14 │
      │NGÀY│   │ GIỜ│   │PHÚT│
      └────┘   └────┘   └────┘
       Áp dụng đến hết ngày 30.08.2026
```

Thứ tự đọc có chủ đích: **ưu đãi trước, hạn chót sau**. Con số 16.5% và 10% là
thứ khách quan tâm; countdown chỉ là lý do để hành động ngay, không phải thông
điệp chính. Vì vậy 2 điểm nhấn dùng dạng viên thuốc chứ không dùng khối số
giống bộ đếm — tránh 2 hàng số trông lặp và loãng.

### B2. Form liên hệ cuối trang *(đã triển khai)*

Vị trí: ngay trên nút "Nhận bảng giá & đặt lịch tư vấn". Dùng chung copy với B1,
đổi sang biến thể nền sáng cho hợp nền Palm Ivory của form.

### B3. Thanh sticky đầu trang *(ĐỀ XUẤT — chưa làm, chờ bạn duyệt)*

Lý do đề xuất: nút "Nhận bảng giá" ở header **đang bị ẩn hoàn toàn trên mobile**
(`css/style.css` dòng 610, breakpoint ≤980px). Nghĩa là phần lớn traffic từ ads
không thấy CTA nào cho tới khi cuộn hết trang.

- **Copy đề xuất:** `Ưu đãi đợt đầu còn 11 ngày · Nhận bảng giá`
- **Hành vi:** dính đáy màn hình trên mobile, đẩy nút gọi/nhắn tin lên trên
- **Duyệt?** ☐ Có ☐ Không

---

## C. Lưu ý về giọng thương hiệu

`visual-guideline.md` mục 8.3 quy định: *"giọng khẳng định, tĩnh, không dùng dấu
chấm than, không dùng từ giục (nhanh tay, cuối cùng, duy nhất hôm nay)."*

Copy hiện tại đã viết theo hướng **"urgency điềm tĩnh"**: nêu hạn chót như một
dữ kiện về chính sách bán hàng, có ngày cụ thể, không chấm than, không nhấp nháy
đỏ. Giữ được tính khan hiếm mà không phá định vị hạng sang.

Nếu muốn đẩy mạnh hơn (chữ đỏ, "CHỈ CÒN", chấm than) thì đó là lựa chọn đánh đổi
có ý thức giữa CVR ngắn hạn và định vị thương hiệu — cần bạn quyết.

### Ràng buộc pháp lý — cần bạn xác nhận

Cả hai con số phải khớp **văn bản chính sách bán hàng chính thức từ chủ đầu tư**.
Theo `content.md` mục 15, không dùng "cam kết sinh lời", "chắc chắn tăng giá".

**Về "Chiết khấu đến 16.5%":** chữ "đến" là cách viết an toàn — hàm ý 16.5% là mức
trần, không phải mức ai cũng được. Nếu văn bản CĐT ghi 16.5% là mức cố định thì
bỏ chữ "đến". Nếu 16.5% là tổng của nhiều khoản cộng lại (thanh toán nhanh + đợt
đầu + khách hàng thân thiết...) thì nên ghi rõ **"tổng chiết khấu đến 16.5%"** để
không bị hiểu là chiết khấu trực tiếp trên giá.

**Về "Tổng giá căn chỉ từ 5.5 tỷ"** (thay cho "Vốn ban đầu chỉ 10%" cũ — đổi
theo yêu cầu 27/08/2026, vì câu cũ dễ bị đọc nhầm thành "sở hữu 10% căn hộ").
Con số 5.5 tỷ khớp với mốc "giá căn nhỏ nhất" đã dùng ở dropdown ngân sách
trong form (`index.html`), nên không phát sinh số liệu mới cần đối chiếu
thêm — chỉ cần đảm bảo 5.5 tỷ vẫn đúng với giá thực tế CĐT công bố tại thời
điểm hiển thị.

---

## D. Backlog CTA còn lại (từ bản review)

| # | Việc | Mức độ | Trạng thái |
|---|---|---|---|
| 1 | **Lỗi `needSelect`** — form không ghi nhận khách thuộc tệp "Mua để ở" hay "Đầu tư" | Critical | ☑ Xong |
| 2 | Countdown + khối ưu đãi ở popup và form cuối trang | High | ☑ Xong |
| 3 | Thanh sticky ưu đãi (mục B3) | High | ☐ Chờ duyệt |
| 4 | Bổ sung field "Nhu cầu" (ở / đầu tư / cho thuê) vào form cuối trang | Medium | ☑ Xong (gộp chung với mục 1) |
| 5 | Thêm CTA giữa trang (sau Tiện ích, sau Mặt bằng) — hiện 9 section liên tiếp không có điểm chạm nào | Medium | ☐ Chưa làm — chưa có copy cụ thể, cần chốt trước khi dựng |
| 6 | Gắn nhãn cho nút gọi/nhắn tin trên mobile (hiện chỉ có icon) | Low | ☑ Xong |
| 7 | Script LeadHub bắn lead sớm khi click vào vùng trống trong form | Medium | ☑ Xong |

### Đã sửa — mục 1 + 4 (gộp chung)

Thêm field **"Nhu cầu"** vào form cuối trang (`index.html`), với
`id="needSelect"` để khớp đúng phần tử mà `js/main.js` đã tìm từ trước:

```html
<select name="need" id="needSelect">
  <option value="">Chưa xác định</option>
  <option>Mua để ở</option>
  <option>Đầu tư</option>
  <option>Cho thuê</option>
</select>
```

Khi khách bấm CTA ở khối "2 nhóm khách", select này được điền sẵn đúng giá trị
và viền vàng nhấp nháy một nhịp để khách thấy lựa chọn đã ghi nhận. Giá trị
`need` giờ được gửi kèm `unit_type` lên cả LeadHub (tự động, vì LeadHub gom
mọi field có `name`) và Google Sheet.

**Cần bạn làm 1 việc:** mở `apps-script/Code.gs` đã sửa, copy toàn bộ dán vào
Apps Script editor của Google Sheet, rồi **Deploy → Manage deployments → bút
chì → New version → Deploy** (không tạo deployment mới). Sheet hiện chỉ có 1
cột dùng chung cho "loại căn quan tâm", nên code mới nối `need` và `unit_type`
lại thành một chuỗi, ví dụ `Đầu tư · 2 Phòng ngủ`, thay vì để `unit_type` âm
thầm đè mất `need` như trước. Chạy hàm `testGhiThu` sau khi deploy để kiểm tra
dòng test ra đúng cột 17 chưa.

### Đã sửa — mục 7

Nguyên nhân xác nhận được: script LeadHub dò `innerText` của tối đa 5 cấp cha
khi click, và thẻ `<form>` bao trọn nút submit "**Nhận** bảng giá..." nên
`innerText` của chính `<form>` luôn chứa chữ "Nhận" — bất kỳ click nào lọt vào
trong form (kể cả một ô trống) đi ngược lên 2-3 cấp là chạm `<form>` và khớp
regex, bắn lead ngay cả khi khách chưa điền xong. Đã bỏ hẳn nhánh dò chữ, chỉ
còn khớp đúng phần tử `BUTTON`/`input[type=submit]`.

### Đã sửa — mục 6

Nút "Nhận tư vấn" nổi (icon chat) giờ có nhãn chữ luôn hiển thị bên cạnh, vì
trên mobile không có hover để hiện tooltip. Nhãn tự ẩn ở màn hình dưới 380px
để không tràn ra ngoài mép phải màn hình.

---

## E. Kiểm tra sau khi sửa

```
□ Mở trang, kiểm tra countdown hiện đúng số ngày còn lại ở cả popup và form
□ Kiểm tra trên mobile: khối ưu đãi không vỡ layout trong popup
□ Sau 30/08/2026: xác nhận khối ưu đãi tự ẩn, không hiện số âm
□ Đối chiếu số 16.5% và 10% với văn bản chính sách của chủ đầu tư
□ Bấm CTA "Tư vấn căn phù hợp cho gia đình" / "Nhận phân tích giỏ hàng" ở khối
  2 nhóm khách — kiểm tra field "Nhu cầu" trong form cuối trang tự điền đúng
  và viền vàng nhấp nháy xác nhận
□ Dán apps-script/Code.gs mới vào Apps Script editor, Deploy bản mới, chạy
  testGhiThu() — kiểm tra cột 17 ra đúng "Đầu tư · 2 Phòng ngủ"
□ Test submit form thật — kiểm tra dòng mới trong Google Sheet có cả "Nhu cầu"
  lẫn "Loại căn", không ghi đè lẫn nhau
□ Test click vào một ô trống trong form (không bấm nút gửi) — xác nhận
  KHÔNG có lead nào bắn về LeadHub cho tới khi thật sự bấm nút submit
□ Trên mobile, kiểm tra nhãn "Nhận tư vấn" cạnh nút nổi không tràn màn hình
```
