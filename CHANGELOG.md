# Changelog

Tất cả những thay đổi đáng chú ý của dự án kiencang/Book-silaTranslator sẽ được ghi lại trong file này.

Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
và dự án này tuân thủ [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.0.24]- 2026-06-10
### Fixed
- Chỉ thị AI sử dụng LaTex làm đầu ra chuẩn cho công thức toán học (tiết kiệm token và có độ chính xác cao hơn);
- Cài thư viện KaTex để chuyển đổi LaTex thành MathML (chuẩn của EPUB, và làm trung gian để chuyển thành OMML trong DOCX);

## [v1.0.23]- 2026-06-08
### Fixed
- Hợp nhất prompt cho cả EPUB và DOCX;
- Loại bỏ thử nghiệm model Gemma;
- Bảo vệ công thức toán dạng thẻ MathML (của EPUB3) tốt hơn, dự phòng lỗi thư viện marked có thể phân tích lầm các thẻ có cấu trúc phức tạp; 

## [v1.0.22]- 2026-06-08
### Fixed
- Tách riêng chuyển đổi EPUB và DOCX

## [v1.0.21]- 2026-06-07
### Fixed
- Chỉnh lại thông báo toast;
- Chuyển về model Flash thành model mặc định;
- Điều chỉnh chỉ thị cho AI để nó xử lý markdown đầy đủ hơn, trong đó có các vấn đề liên quan đến biểu thức toán học;

## [v1.0.20]- 2026-06-07
### Fixed
- Bổ sung thêm model Gemma mã nguồn mở để test thêm;

## [v1.0.19]- 2026-06-06
### Fixed
- Điều chỉnh lại prompt chuyển PDF thành markdown để nó có chất lượng ổn định hơn (đầu ra thống nhất hơn);
- Điều chỉnh cách phân tích để xử lý in đậm, in nghiêng lồng nhau trong markdown để chuyển đổi thành docx chính xác hơn;

## [v1.0.18]- 2026-06-06
### Fixed
- Thay đổi title index mặc định về tên công cụ;
- Điều chỉnh thông tin chính thức địa chỉ công cụ;
- Thêm faviocon;
- Cập nhật nội dung cho hướng dẫn sử dụng;
- Thêm cơ chế xử lý lỗi khi gửi batch request, tránh gửi tiếp request vô ích khi gặp các lỗi như hết ngưỡng miễn phí;

## [v1.0.17]- 2026-06-06
### Fixed
- Điều chỉnh nhẹ giao diện;
- Tinh chỉnh một chút prompt (bổ sung ghi chú tiếng Anh cho cụm từ sơ đồ, biểu đồ);
- Khắc phục lỗi không build được lên Cloudlfare;

## [v1.0.16]- 2026-06-05
### Fixed
- Bổ sung khả năng nhận diện text trong sơ đồ/biểu đồ;
- Ngăn cache prompt;

## [v1.0.15]- 2026-06-05
### Fixed
- Điều chỉnh prompt cho phù hợp hơn với định dạng tên ảnh mới;
- Điều chỉnh khu vực upload tránh co giãn xô đẩy quá nhiều trong quá trình phân tích; không cho phép upload tiếp trong quá trình phân tích;
- Cập nhật prompt chuyển đổi PDF thành markdown;

## [v1.0.14]- 2026-06-05
### Fixed
- Chia chunk vật lý bằng pdf-lib để gửi đi dữ liệu tiết kiệm hơn;
- Vô hiệu hóa một số nút bấm trong quá trình tương tác với AI;

## [v1.0.13]- 2026-06-05
### Fixed
- Loại bỏ tiêu đề dư thừa (tên file) chèn vào nội dung;
- Áp dụng ThinkingLevel HIGH cho quá trình ghép nối tài liệu;
- Điều chỉnh thông tin trong một số modal cho phù hợp hơn;

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
