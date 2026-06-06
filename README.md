# pdf-2-epub-docx
Công cụ này trích xuất ảnh trong file PDF, sau đó dùng AI để chuyển định dạng sang markdown và lắp ghép ảnh đúng vị trí, kết hợp với trích xuất text trong ảnh sơ đồ biểu đồ để đầy đủ thông tin hơn. Cuối cùng chuyển đổi thành định dạng EPUB tiêu chuẩn để làm đầu vào dịch thuật ưa thích cho AI. Bạn có thể sử dụng công cụ dịch EPUB này: https://silabook.wpsila.com/

Công cụ hoạt động tốt hơn với model Flash, với model Lite, cũng hoạt động ổn trong đa số trường hợp.

Link app để Remix về trên AI Studio, nhằm tận dụng API Key miễn phí: https://aistudio.google.com/apps/9a11586a-e712-4c10-a1b6-751ab78fc10b?showAssistant=true&showCode=true

## Tuyên bố từ chối trách nhiệm
Công cụ này chỉ nên sử dụng cho mục đích nghiên cứu và học tập cá nhân.

pdf-2-epub-docx cũng như người phát triển nó không đưa ra bất kỳ bảo đảm rõ ràng hay ngụ ý nào, cũng như không tuyên bố rằng công cụ sẽ vận hành hoàn hảo, chính xác hoặc cập nhật. Người phát triển sẽ không chịu trách nhiệm cho bất kỳ tổn thất hay thiệt hại nào phát sinh trực tiếp hoặc gián tiếp liên quan đến hoặc phát sinh từ việc sử dụng công cụ này.

## Ghi công
Dưới đây là danh sách các thư viện quan trọng mà ứng dụng này sử dụng:

### 1. Nền tảng Ứng dụng & Giao diện (Framework & UI)
*   **[Angular (v21)](https://angular.dev/)** – Phát triển bởi **Google**. Khung làm việc (Framework) SPA hiệu năng cao.
*   **[Tailwind CSS (v4)](https://tailwindcss.com/)** – Khung thiết kế CSS tiện ích (Utility-first CSS), tối ưu hóa tốc độ biên dịch và cung cấp giao diện cho ứng dụng.

### 2. Xử lý và Phân tích tài liệu PDF
*   **[Mozilla PDF.js](https://mozilla.github.io/pdf.js/)** – Phát triển bởi **Mozilla**. Thư viện kết xuất PDF chuẩn HTML5 cực mạnh chạy hoàn toàn trên Client-side, giúp trích xuất hình ảnh trong file PDF.
*   **[PDF-Lib](https://pdf-lib.js.org/)** – Xử lý tách trang, chia chunk.

### 3. Đọc/Ghi & Tạo định dạng đầu ra (EPUB, DOCX, ZIP)
*   **[Docx.js](https://docx.js.org/)** – Phát triển bởi **Dolan Miu** và cộng đồng. Thư viện tạo tệp tin Microsoft Word (.docx) chạy trực tiếp trên trình duyệt.
*   **[JSZip](https://stuk.github.io/jszip/)** – Phát triển bởi **Stuart Knightley**. Thư viện đóng gói dữ liệu nén EPUB (Mimetype, OEBPS) và tạo tệp nén ZIP tải xuống hàng loạt.
*   **[Marked.js](https://marked.js.org/)** – Trình biên dịch Markdown, giúp biên dịch dữ liệu văn bản từ AI phản hồi thành mã HTML sạch để hiển thị xem trước và được dùng làm nguồn khi chuyển sang định dạng EPUB.
