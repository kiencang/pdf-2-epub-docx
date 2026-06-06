/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { PDFDocument } from 'pdf-lib';
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

<objective>
[MỤC ĐÍCH TỐI THƯỢNG]: Tệp Markdown này LÀ ĐẦU VÀO CHO HỆ THỐNG DỊCH THUẬT MÁY (Machine Translation) VÀ ĐÓNG GÓI SÁCH ĐIỆN TỬ (EPUB). Do đó, TÍNH LIỀN MẠCH CỦA NGỮ CẢNH (Contextual Continuity), ĐỘ SẠCH của văn bản và BẢO TOÀN VỊ TRÍ ẢNH là ưu tiên số một.
</objective>

BẠN PHẢI TUÂN THỦ NGHIÊM NGẶT CÁC RÀNG BUỘC SAU:

<rules>
1. NỐI MẠCH VĂN BẢN (QUAN TRỌNG NHẤT CHO DỊCH THUẬT):
- Xóa ngắt dòng cứng (Hard Line Breaks): Bạn PHẢI tự động nối các câu/dòng thuộc cùng một đoạn văn (paragraph) thành một dải văn bản liên tục trên một dòng Markdown. Chuyển sang dòng mới (Enter) CHỈ KHI thực sự kết thúc một đoạn văn.
- Nối câu qua trang (Cross-page Merging): Nhận diện các câu bị cắt ngang giữa cuối trang trước và đầu trang sau. Nối chúng lại thành một câu hoàn chỉnh.
- Nối từ bị gạch nối (De-hyphenation): Khi một từ bị tách làm đôi ở cuối dòng/cuối trang bằng dấu gạch ngang (ví dụ: "infor- \\n mation"), BẮT BUỘC phải ghép chúng lại thành một từ hoàn chỉnh ("information").
- NGOẠI LỆ: Các đoạn thơ/bài hát/khối mã nguồn (code blocks)/công thức toán học (thường có các dòng ngắn, thụt lề, lặp lại cấu trúc) thì PHẢI giữ nguyên ngắt dòng, chỉ nối các đoạn văn xuôi.
- Chữ cái lớn đầu đoạn (Drop Caps): Nhận diện chữ cái đầu tiên bị tách rời do định dạng Drop Cap và ghép nó lại với phần còn lại của từ (VD: "T" \\n "rong" -> "Trong").
- Gom bố cục nhiều cột (Multi-column) thành MỘT cột: Nếu tài liệu có layout nhiều cột (báo chí, luận văn...), hãy đọc theo đúng luồng tự nhiên (hết cột trái mới sang phải, hoặc tùy ngữ cảnh) và gộp thành MỘT CỘT DUY NHẤT.

2. DỌN DẸP RÁC TÀI LIỆU (NOISE REMOVAL):
- Bỏ qua hoàn toàn: Header, Footer, Tên sách/Tên chương lặp lại ở lề trang, Số trang (Page numbers), Watermark.
- Sửa lỗi chính tả do OCR (nhận diện sai ký tự) dựa trên ngữ cảnh thực tế của câu.
- Thống nhất dấu ngoặc kép thành định dạng tiêu chuẩn (ví dụ: "nội dung"), bảo toàn dấu gạch ngang dài (— em-dash).

3. BẢO TOÀN CẤU TRÚC VÀ ĐỊNH DẠNG (UNIFIED MARKDOWN STYLE):
- Tiêu đề (Headings): BẮT BUỘC phản ánh đúng cấu trúc phân cấp chỉ bằng ký tự Hash (H1, H2, H3 tương ứng với #, ##, ### - kiểu ATX). TUYỆT ĐỐI KHÔNG sử dụng kiểu gạch dưới bằng dấu gạch ngang hoặc dấu bằng ở dòng dưới (kiểu Setext như dòng dưới viết === hoặc ---).
- Nhấn mạnh (Emphasis): BẮT BUỘC chỉ sử dụng ký tự dấu sao (\`*italic*\` cho in nghiêng, \`**bold**\` cho in đậm, \`***bold-italic***\` cho cả hai). TUYỆT ĐỐI KHÔNG sử dụng ký tự gạch dưới hoặc gạch chân dưới văn bản (\`_italic_\` hoặc \`__bold__\`).
- Danh sách: Dùng \`-\` cho list không thứ tự, \`1.\` cho list có thứ tự.
- Bảng biểu (Tables): Dùng định dạng bảng Markdown (\`|---|---|\`). Tuyệt đối không dùng ngắt dòng (\`Enter\`) bên trong các ô của bảng. Nếu bảng quá phức tạp, gom thành danh sách \`Key: Value\`.
- Trích dẫn: Dùng \`>\`.

4. XỬ LÝ CHÚ THÍCH (FOOTNOTES/ENDNOTES):
- Di chuyển toàn bộ nội dung chú thích (footnotes) xuống CUỐI CÙNG của file Markdown theo cú pháp: \`[^1]: Nội dung...\`. 
- Đảm bảo trong văn bản gốc có đánh dấu \`[^1]\` tại đúng vị trí trỏ đến chú thích đó.

5. XỬ LÝ VÀ CHÈN HÌNH ẢNH:
Chúng tôi đính kèm danh sách các hình ảnh thực tế bóc tách được (mang nhãn cụ thể theo từng phần của tài liệu như \`![IMG-CHUNK1-01]\`, \`![IMG-CHUNK1-02]\`, \`![IMG-CHUNK2-01]\`, v.v.). 
- Quan sát tệp PDF đính kèm, nhận diện vị trí xuất hiện của chúng và sau đó CHÈN CHÍNH XÁC thẻ Markdown hình ảnh (VD: \`![IMG-CHUNK1-01]\`) vào ĐÚNG vị trí tương ứng trong luồng văn bản (ngay sau hoặc trước đoạn mà hình ảnh minh họa đính kèm)
- Bạn tuyệt đối KHÔNG ĐƯỢC lược bỏ bất kỳ ảnh nào được truyền vào, hãy sử dụng và sắp xếp tên ảnh đúng theo đối chiếu của bạn ở tài liệu gốc.
- KHÔNG thay đổi nguyên mẫu nhãn \`![IMG-CHUNKXX-XX]\` (đừng dịch, đừng thêm Alt text, hãy giữ đúng chuỗi ví dụ như \`![IMG-CHUNK1-01]\`) để hệ thống phần mềm phía sau ánh xạ chính xác file ảnh thật.
- Chú thích ảnh (Captions): Nếu ngay dưới ảnh có văn bản chú thích, hãy in nghiêng văn bản đó (VD: \`*Đây là chú thích ảnh*\`) và đặt ngay dưới thẻ hình ảnh.

6. TRÍCH XUẤT TEXT TRONG SƠ ĐỒ, BIỂU ĐỒ (DIAGRAMS, CHARTS):
- Đối với sơ đồ, biểu đồ (diagrams, charts) có chứa chữ bên trong: Hãy nhận diện và trích xuất chữ trong ảnh theo thứ tự từ trên xuống dưới, từ trái qua phải, nhưng giới hạn **tối đa 7 phần văn bản (text elements) quan trọng và đại diện nhất** để tránh làm loãng nội dung.
- Trình bày gọn gàng ngay bên dưới thẻ hiển thị ảnh (và phải nằm dưới chú thích ảnh, nếu ảnh đó có chú thích) dưới dạng một dòng trích dẫn được in nghiêng dạng: \`> *Image Info: [Nội dung 1] - [Nội dung 2] - ...*\` để phân biệt rõ ràng với phần văn bản chính.
</rules>

<output_format>
- ZERO-FLUFF: Bắt đầu trả về văn bản Markdown ngay lập tức.
- KHÔNG lời chào, KHÔNG giải thích, KHÔNG xin lỗi.
- KHÔNG bọc đầu ra trong khối \`\`\`markdown (markdown code block). Trả về plain text định dạng markdown trực tiếp.
</output_format>`;
  }

  /**
   * Retrieves the prompt template from the public file or returns the default fallback
   */
  async getPromptTemplate(): Promise<string> {
    try {
      const response = await fetch(`/prompts/reflow_instructions.md?t=${Date.now()}`);
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
   * Helper function to convert Uint8Array back to Base64 in standard client-side sandbox
   */
  async uint8ArrayToBase64(arr: Uint8Array): Promise<string> {
    const blob = new Blob([arr as any], { type: 'application/pdf' });
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve(dataUrl.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Extracts a specific range of pages (1-indexed) and builds a sliced PDF file (Base64)
   */
  async splitPdf(file: File, startPage: number, endPage: number): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    
    // Load source document
    const srcDoc = await PDFDocument.load(arrayBuffer);
    
    // Create new sliced document
    const subDoc = await PDFDocument.create();
    
    const pageIndices: number[] = [];
    const pageCount = srcDoc.getPageCount();
    
    for (let i = startPage; i <= endPage; i++) {
      if (i - 1 >= 0 && i - 1 < pageCount) {
        pageIndices.push(i - 1);
      }
    }
    
    if (pageIndices.length === 0) {
      throw new Error(`Khoảng trang ${startPage} - ${endPage} không hợp lệ.`);
    }
    
    // Copy and append pages
    const copiedPages = await subDoc.copyPages(srcDoc, pageIndices);
    copiedPages.forEach((page) => subDoc.addPage(page));
    
    const subPdfBytes = await subDoc.save();
    return this.uint8ArrayToBase64(subPdfBytes);
  }

  /**
   * Prepares the full query parts list to send to the Gemini model (incorporating multimodal elements)
   */
  buildMultimodalParts(pdfBase64: string, promptText: string, chunk: PdfChunk): any[] {
    const parts: any[] = [];

    // 1. Send the sliced PDF document
    parts.push({
      inlineData: {
        mimeType: 'application/pdf',
        data: pdfBase64
      }
    });

    // 2. Format additional page-range constraints and append to prompt instructions
    const localizedInstructions = `${promptText}\n\nCHÚ Ý ĐẶC BIỆT: \nTài liệu PDF đính kèm dưới đây đã được cắt nhỏ tự động phía Client, chứa chính xác các trang từ trang **${chunk.startPageNum}** đến trang **${chunk.endPageNum}** của tài liệu gốc. Bạn hãy đọc kĩ và xử lý toàn bộ nội dung của tệp PDF đính kèm này cùng các hình ảnh gốc liên quan, sau đó chuyển đổi thành mã Markdown sạch đẹp, bảo toàn cấu trúc và ngữ cảnh, rồi chèn đúng nhãn ảnh tương ứng. ĐẦU RA CHỈ ĐƯỢC PHÉP CHỨA ĐOẠN MÃ MARKDOWN NÀY, không viết lời giới thiệu hay phản hồi thừa. Bắt đầu mã Markdown ngay dưới đây:`;
    
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
    // Acquire sliced PDF or fallback to original
    let pdfBase64 = '';
    try {
      pdfBase64 = await this.splitPdf(file, chunk.startPageNum, chunk.endPageNum);
    } catch (splitErr) {
      console.warn('Lỗi phân tách PDF bằng pdf-lib, quay lại gửi cả tệp:', splitErr);
      pdfBase64 = await this.fileToBase64(file);
    }

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
          temperature: 0.15,
          thinkingConfig: { thinkingLevel: 'HIGH' }
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
