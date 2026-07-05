# pdf-2-epub-docx
Công cụ này trích xuất ảnh trong file PDF, sau đó dùng AI để chuyển định dạng sang markdown và lắp ghép ảnh đúng vị trí, kết hợp với trích xuất text trong ảnh sơ đồ biểu đồ để đầy đủ thông tin hơn. Cuối cùng chuyển đổi thành định dạng EPUB tiêu chuẩn để làm đầu vào dịch thuật ưa thích cho AI. Bạn có thể sử dụng công cụ dịch EPUB này: https://silabook.wpsila.com/

Công cụ hoạt động tốt hơn với model Flash; với model Lite, cũng hoạt động ổn trong đa số trường hợp.

Link app để Remix về trên AI Studio, nhằm tận dụng API Key miễn phí: https://aistudio.google.com/apps/9a11586a-e712-4c10-a1b6-751ab78fc10b?showAssistant=true&showCode=true

Sản phẩm thay thế: Hiện có một công cụ miễn phí tiện dùng khác có chất lượng rất cao để chuyển đổi PDF thành markdown, đó là https://aistudio.baidu.com/paddleocr. Ưu điểm của nó là ngoài chuyển đổi file PDF tiêu chuẩn, nó còn có thể chuyển đổi cả file PDF dạng scan. Ngoài ra tốc độ chuyển đổi cũng khá cao. Mọi người có thể tham khảo thêm nếu cần.

## Tuyên bố từ chối trách nhiệm
Công cụ này chỉ nên sử dụng cho mục đích nghiên cứu và học tập cá nhân.

pdf-2-epub-docx cũng như người phát triển nó không đưa ra bất kỳ bảo đảm rõ ràng hay ngụ ý nào, cũng như không tuyên bố rằng công cụ sẽ vận hành hoàn hảo, chính xác hoặc cập nhật. Người phát triển sẽ không chịu trách nhiệm cho bất kỳ tổn thất hay thiệt hại nào phát sinh trực tiếp hoặc gián tiếp liên quan đến hoặc phát sinh từ việc sử dụng công cụ này.

## Ghi công
Dưới đây là danh sách các thư viện quan trọng mà ứng dụng này sử dụng:

### 1. Nền tảng Ứng dụng & Giao diện (Framework & UI)
*   **[Angular (v21)](https://angular.dev/)** – Phát triển bởi **Google**. Lõi chính của ứng dụng.
*   **[Tailwind CSS (v4)](https://tailwindcss.com/)** – Cung cấp giao diện cho ứng dụng.

### 2. Xử lý và Phân tích tài liệu PDF
*   **[Mozilla PDF.js](https://mozilla.github.io/pdf.js/)** – Phát triển bởi **Mozilla**. Thư viện chạy hoàn toàn trên Client-side, giúp trích xuất hình ảnh trong file PDF.
*   **[PDF-Lib](https://pdf-lib.js.org/)** – Xử lý tách trang, chia chunk.
*   **[KaTeX](https://katex.org/)**: Thư viện xử lý và hiển thị công thức toán học do Khan Academy phát triển. Đóng vai trò là engine chuyển đổi các công thức toán học LaTeX (được AI bóc tách từ tài liệu) sang định dạng XML chuẩn `MathML`. Nhờ cấu trúc MathML nguyên bản này, các công thức phức tạp được giữ nguyên định dạng khi xuất sang dạng sách điện tử **EPUB 3** hoặc **Microsoft Word (.docx)**.

### 3. Đọc/Ghi & Tạo định dạng đầu ra (EPUB, DOCX, ZIP)
*   **[Docx.js](https://docx.js.org/)** – Phát triển bởi **Dolan Miu**. Thư viện tạo tệp tin Microsoft Word (.docx) chạy trực tiếp trên trình duyệt (Client-side).
*   **[JSZip](https://stuk.github.io/jszip/)** – Phát triển bởi **Stuart Knightley**. Thư viện giúp đóng gói dữ liệu nén cho EPUB (Mimetype, OEBPS) và tạo tệp nén ZIP để tải về.
*   **[Marked.js](https://marked.js.org/)** – Trình biên dịch Markdown, giúp biên dịch dữ liệu văn bản từ AI phản hồi thành mã HTML sạch, để hiển thị xem trước và được dùng làm nguồn khi chuyển sang định dạng EPUB.
