# Changelog

Tất cả những thay đổi đáng chú ý của dự án kiencang/Book-silaTranslator sẽ được ghi lại trong file này.

Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
và dự án này tuân thủ [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.0.13]- 2026-06-05
### Fixed
- Loại bỏ tiêu đề dư thừa (tên file) chèn vào nội dung;

## [v1.0.12]- 2026-06-05
### Fixed
- Đưa các mã tương tác với AI ra một module riêng;

## [v1.0.11]- 2026-06-05
### Fixed
- Thêm định dạng đầu ra là DOCX;

## [v1.0.10]- 2026-06-05
### Fixed
- Tái cấu trúc lại mã;
- Sửa lại thông tin ở một số modal;

## [v1.0.9]- 2026-06-04
### Fixed
- Thêm Lịch sử chuyển đổi.

## [v1.0.8]- 2026-06-04
### Fixed
- Cải tiến thông báo toast chi tiết hơn các lỗi từ Gemini;
- Điều chỉnh chiều cao của phần nội dung gốc, tránh phải cuộn chuột quá nhiều;

## [v1.0.7]- 2026-06-04
### Fixed
- Thêm cơ chế chia chunk;
- Thêm tùy chọn model khi ráp nối dữ liệu;
- Điều chỉnh một số toast;

## [v1.0.6]- 2026-06-04
### Fixed
- Sử dụng thư viện chuẩn (marked) để chuyển đổi markdown thành HTML;
- Xóa file dư thừa trước đây dùng để chuyển đổi thủ công markdown thành HTML ở chế độ xem trước;

## [v1.0.5]- 2026-06-04
### Fixed
- Truyền dữ liệu gốc cùng ảnh vào để quá trình chuyển đổi thành markdown được chính xác hơn thay vì phụ thuộc vào văn bản được trích xuất từ PDF.js;
- Khi button ráp nối được click để truyền dữ liệu lên AI, các button khác phải bị vô hiệu hóa;
- Thêm đồng hồ đếm giờ;
- Giới hạn dung lượng file PDF tải lên. Dung lượng tối đa 50 MB, số trang tối đa 500 trang;

## [v1.0.4]- 2026-06-04
### Fixed
- Điều chỉnh cách tạo file EPUB đúng chuẩn hơn;
- Điều chỉnh giao diện phase2, ẩn đi các nút không cần thiết, nhất là khi chưa ráp nội dung, mới chỉ xem trước;

## [v1.0.3]- 2026-06-04
### Fixed
- Xóa các file serverside không cần dùng đến, vì ứng dụng là clientside;
- Điều chỉnh kích cỡ button tải EPUB to hơn;
- Loại bỏ các thông tin dư thừa hoặc dễ gây hiểu nhầm trong phase2;
- Loại bỏ việc hiển thị mã HTML và Markdown không cần thiết; Vẫn duy trì nút tải về;
