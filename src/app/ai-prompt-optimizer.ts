/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { PdfChunk } from './app';

@Injectable({
  providedIn: 'root'
})
export class AiPromptOptimizer {
  /**
   * Returns the fallback/default Vietnamese AI prompt template
   */
  getDefaultPrompt(): string {
    return `Bạn là một Chuyên gia Tiền xử lý Dữ liệu Ngôn ngữ (Language Data Pre-processing Expert) và Kỹ sư OCR tài liệu xuất sắc.
Nhiệm vụ của bạn là trích xuất văn bản từ tệp PDF đính kèm và chuyển đổi thành định dạng Markdown (MD) chuẩn xác nhất.

[MỤC ĐÍCH TỐI THƯỢNG]: Tệp Markdown này LÀ ĐẦU VÀO CHO HỆ THỐNG DỊCH THUẬT MÁY (Machine Translation) VÀ ĐÓNG GÓI SÁCH ĐIỆN TỬ (EPUB). Do đó, TÍNH LIỀN MẠCH CỦA NGỮ CẢNH (Contextual Continuity), ĐỘ SẠCH của văn bản và BẢO TOÀN VỊ TRÍ ẢNH là ưu tiên số một.

BẠN PHẢI TUÂN THỦ NGHIÊM NGẶT CÁC RÀNG BUỘC SAU:

1. NỐI MẠCH VĂN BẢN (QUAN TRỌNG NHẤT CHO DỊCH THUẬT):
- XÓA NGẮT DÒNG CỨNG (Hard Line Breaks): Bạn PHẢI tự động nối các câu/dòng thuộc cùng một đoạn văn (paragraph) thành một dải văn bản liên tục trên một dòng Markdown. Chuyển sang dòng mới (Enter) CHỈ KHI thực sự kết thúc một đoạn văn.
- NỐI CÂU QUA TRANG (Cross-page Merging): Nhận diện các câu bị cắt ngang giữa cuối trang trước và đầu trang sau. Nối chúng lại thành một câu hoàn chỉnh.
- NGOẠI LỆ: Các đoạn thơ/bài hát (thường có các dòng ngắn, thụt lề, lặp lại cấu trúc) thì PHẢI giữ nguyên ngắt dòng, chỉ nối các đoạn văn xuôi.
- GOM bố cục nhiều cột (Multi-column) thành MỘT cột: Nếu tài liệu có layout nhiều cột (báo chí, luận văn...), hãy đọc theo đúng luồng tự nhiên (hết cột trái mới sang phải, hoặc tùy ngữ cảnh) và gộp thành MỘT CỘT DUY NHẤT.

2. DỌN DẸP RÁC TÀI LIỆU (NOISE REMOVAL):
- Bỏ qua hoàn toàn: Header, Footer, Tên sách/Tên chương lặp lại ở lề trang, Số trang (Page numbers), Watermark.
- Sửa lỗi OCR dựa trên ngữ cảnh của câu.
- Chuẩn hóa dấu câu: Thống nhất dấu nháy kép thành """ hoặc """"; bảo toàn dấu gạch ngang dài (— em-dash).

3. BẢO TOÀN CẤU TRÚC VÀ ĐỊNH DẠNG:
- Tiêu đề: Phản ánh đúng cấu trúc phân cấp bằng H1, H2, H3 (#, ##, ###).
- Nhấn mạnh: Giữ lại in nghiêng (*italic*) và in đậm (**bold**) đối với từ khóa.
- Danh sách: Dùng \`-\` cho list không thứ tự, \`1.\` cho list có thứ tự.
- Bảng biểu (Tables): Dùng định dạng bảng Markdown (\`|---|---|\`). Nếu quá phức tạp, gom thành danh sách \`Key: Value\`.
- Trích dẫn: Dùng \`>\`.

4. XỬ LÝ CHÚ THÍCH (FOOTNOTES/ENDNOTES):
- Gom nội dung chú thích xuống cuối file Markdown theo định dạng: \`[^1]: Nội dung...\`. Không xen giữa các đoạn.

5. XỬ LÝ VÀ CHÈN HÌNH ẢNH, BIỂU ĐỒ TRỰC QUAN:
Chúng tôi đính kèm danh sách các hình ảnh thực tế bóc tách được (mang nhãn như \`![IMG-01]\`, \`![IMG-02]\`). 
- Quan sát tệp PDF đính kèm, nhận diện vị trí xuất hiện của chúng và sau đó CHÈN CHÍNH XÁC thẻ Markdown hình ảnh (VD: \`![IMG-01]\`) vào ĐÚNG vị trí tương ứng trong luồng văn bản (ngay sau hoặc trước đoạn mà hình ảnh minh họa đính kèm)
- Bạn tuyệt đối KHÔNG ĐƯỢC lược bỏ bất kỳ ảnh nào được truyền vào, hãy sử dụng và sắp xếp tên ảnh đúng theo đối chiếu của bạn ở tài liệu gốc.
- KHÔNG thay đổi nguyên mẫu nhãn \`![IMG-XX]\` (đừng dịch, đừng thêm Alt text, hãy giữ đúng chuỗi \`![IMG-01]\`) để hệ thống phần mềm phía sau ánh xạ chính xác file ảnh thật.

6. ĐẦU RA ZERO-FLUFF (CHỈ CODE):
- KHÔNG có bất kỳ lời chào hỏi, dạo đầu hay xin lỗi nào.
- KHÔNG bọc đầu ra trong khối \`\`\`markdown, mà bắt đầu trả về chuỗi Markdown ngay lập tức.`;
  }

  /**
   * Retrieves the prompt template from the public file or returns the default fallback
   */
  async getPromptTemplate(): Promise<string> {
    try {
      const response = await fetch('/prompts/reflow_instructions.md');
      if (!response.ok) throw new Error('Không thể tải tệp prompt từ server');
      return await response.text();
    } catch (fetchErr) {
      console.warn('Lỗi fetch prompt template hoặc sử dụng môi trường client-only, dùng cấu hình mặc định:', fetchErr);
      return this.getDefaultPrompt();
    }
  }

  /**
   * Reads a File object and converts it to a clean base64 data string (sans prefix)
   */
  async fileToBase64(file: File): Promise<string> {
    const fileReader = new FileReader();
    const fileBase64Url = await new Promise<string>((resolve, reject) => {
      fileReader.onload = () => resolve(fileReader.result as string);
      fileReader.onerror = reject;
      fileReader.readAsDataURL(file);
    });
    return fileBase64Url.split(',')[1];
  }

  /**
   * Prepares the full query parts list to send to the Gemini model (incorporating multimodal elements)
   */
  buildMultimodalParts(pdfBase64: string, promptText: string, chunk: PdfChunk): any[] {
    const parts: any[] = [];

    // 1. Send the original PDF document
    parts.push({
      inlineData: {
        mimeType: 'application/pdf',
        data: pdfBase64
      }
    });

    // 2. Format additional page-range constraints and append to prompt instructions
    const localizedInstructions = `${promptText}\n\nCHÚ Ý ĐẶC BIỆT: \nCHỈ TRÍCH XUẤT VÀ XỬ LÝ NỘI DUNG TỪ PHẠM VI TRANG **${chunk.startPageNum}** ĐẾN TRANG **${chunk.endPageNum}** CỦA TÀI LIỆU PDF ĐÍNH KÈM VÀ BỎ QUA HOÀN TOÀN CÁC TRANG KHÁC.\n\nNhiệm vụ của bạn là đọc kĩ tệp PDF đính kèm cùng các hình ảnh, sau đó chuyển đổi thành mã Markdown. ĐẦU RA CHỈ ĐƯỢC PHÉP CHỨA ĐOẠN MÃ MARKDOWN NÀY, không viết lời giới thiệu. Bắt đầu mã Markdown ngay dưới đây:`;
    
    parts.push({ text: localizedInstructions });

    // 3. Map out and attach the extracted images that occurred within the target page range
    chunk.pages.forEach(page => {
      if (page.extractedImages) {
        page.extractedImages.forEach((img: any) => {
          const rawBase64 = img.dataUrl.split(',')[1];
          parts.push({
            text: `\nDưới đây là dữ liệu hình ảnh bóc được mang nhãn [${img.labeledKey}]:\n`
          });
          parts.push({
            inlineData: {
              mimeType: 'image/png',
              data: rawBase64
            }
          });
        });
      }
    });

    return parts;
  }

  /**
   * Executes Content Generation from Gemini API, handles REST transport, and returns optimized Markdown output
   */
  async optimizeChunk(
    apiKey: string,
    modelName: string,
    file: File,
    chunk: PdfChunk
  ): Promise<string> {
    // Acquire required materials
    const pdfBase64 = await this.fileToBase64(file);
    const basePrompt = await this.getPromptTemplate();
    const parts = this.buildMultimodalParts(pdfBase64, basePrompt, chunk);

    // Call individual content generation REST endpoint
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const apiResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: parts
          }
        ],
        generationConfig: {
          temperature: 0.15
        }
      })
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json().catch(() => ({}));
      const originalError = errorData?.error?.message || `Lỗi HTTP ${apiResponse.status}`;
      throw new Error(`Google API phản hồi thất bại: ${originalError}`);
    }

    const resData = await apiResponse.json();
    let rawMarkdown = resData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!rawMarkdown) {
      throw new Error('Gemini API không phản hồi dữ liệu văn bản hợp lệ.');
    }

    // Secondary sanitization: remove Markdown wrappers if returned despite strict instructions
    if (rawMarkdown.includes('```')) {
      const match = rawMarkdown.match(/```(?:markdown)?([\s\S]*?)```/i);
      if (match && match[1]) {
        rawMarkdown = match[1].trim();
      }
    }

    return rawMarkdown;
  }
}
