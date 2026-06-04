import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {join} from 'node:path';
import { GoogleGenAI } from "@google/genai";

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// Parse large payloads for PDF text extraction and custom settings
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

/**
 * API Endpoint: Semantic AI Reflow for extracted PDF text using Gemini
 */
app.post('/api/gemini/reflow', async (req, res) => {
  try {
    const { text, customPrompt } = req.body;
    if (!text || text.trim() === '') {
      res.status(400).json({ error: 'Nội dung văn bản không được để trống.' });
      return;
    }

    const apiKey = process.env['GEMINI_API_KEY'];
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
      res.status(403).json({
        error: 'Chưa cấu hình API Key cho Gemini. Vui lòng thiết lập khóa GEMINI_API_KEY trong phần Settings > Secrets trên AI Studio để dùng tính năng AI tối ưu.'
      });
      return;
    }

    // Lazy load the SDK
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    let extraGuideline = '';
    if (customPrompt && customPrompt.trim() !== '') {
      extraGuideline += `\n- YÊU CẦU ĐẶC BIỆT CỦA NGƯỜI DÙNG: "${customPrompt}"`;
    }

    const systemInstruction = `Bạn là một chuyên gia bóc tách tài liệu và lập trình viên HTML/CSS chuẩn SEO với gu thẩm mỹ tinh tế cao.
Nhiệm vụ của bạn là nhận chuỗi nội dung văn bản thô trích xuất từ PDF (có thể bị đảo dòng, ngắt dòng, lỗi chính tả hoặc thiếu định dạng chương, bảng biểu).
Hãy tái cấu trúc văn bản thô này thành mã nguồn HTML hoàn chỉnh, có ngữ nghĩa cực kỳ sạch sẽ và dễ đọc nhất.

Các quy tắc tuyệt đối:
1. Tạo cấu trúc ngữ nghĩa HTML5 chuẩn: Sử dụng các thẻ <article>, <h2>, <h3>, <p>, <ul>, <ol>, <li>, <blockquote>, <table class="w-full text-left my-4 table">, <pre class="p-4 bg-slate-900 text-white rounded mb-4"><code>...
2. KHÔNG bao gồm các thẻ ngoài rìa như <html>, <head>, <body> hoặc <iframe>. Chỉ xuất ra nội dung bên trong lớp bọc (ví dụ: bọc bởi một thẻ <article class="prose max-w-full text-slate-800 leading-relaxed">).
3. Sử dụng các class CSS của Tailwind CSS trực tiếp để trang trí bài viết thật đẹp mắt (ví dụ: text-indigo-900, mb-4, font-medium, border-l-4 border-emerald-500, font-serif cho trích dẫn...).
4. Phát hiện các tiêu đề chính, tiêu đề phụ, đoạn văn thông thường, bảng biểu (tables) hoặc danh sách để đưa về thẻ HTML tương ứng đúng đắn.
5. Nếu trong văn bản thô có ám chỉ về hình ảnh (như "Hình 1:", "Figure 2:", "Image:", "Ảnh minh họa" hoặc có khoảng trống lớn giữa văn bản), hãy chèn một thẻ ảnh rỗng làm placeholder đúng cú pháp sau:
   <div class="pdf-image-placeholder my-6 border border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50" data-image-index="SỐ_THỨ_TỰ">
     <span class="text-xs text-slate-400 font-mono">Hình ảnh #{SỐ_THỨ_TỰ}</span>
   </div>
   (Hãy thay SỐ_THỨ_TỰ bằng số nguyên nối tiếp 1, 2, 3... tương ứng với trình tự xuất hiện của hình ảnh để phía client lấp đầy bằng ảnh thật).
6. Giữ nguyên ngôn ngữ gốc của nội dung tài liệu trừ phi có yêu cầu dịch thuật cụ thể bắt gặp phía dưới.
7. ĐẦU RA CHỈ ĐƯỢC PHÉP CHỨA ĐOẠN MÃ HTML NÀY, không viết lời giới thiệu hay bọc dấu markdown \`\`\`html ... \`\`\` rườm rà. Hãy trả về mã HTML sạch trực tiếp hoặc mã bọc markdown đơn giản.`;

    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: `Đây là nội dung văn bản bóc tách thô từ PDF:\n\n${text}\n\nHướng dẫn phong cách bổ sung:${extraGuideline}`,
      config: {
        systemInstruction,
        temperature: 0.15,
      }
    });

    let htmlResult = response.text || '';
    
    // Clean up code blocks if present
    if (htmlResult.includes('```html')) {
      const parts = htmlResult.split('```html');
      if (parts.length > 1) {
        htmlResult = parts[1].split('```')[0].trim();
      }
    } else if (htmlResult.includes('```')) {
      const parts = htmlResult.split('```');
      if (parts.length > 1) {
        htmlResult = parts[1].trim();
      }
    }

    res.json({ html: htmlResult });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: error.message || 'Lỗi xử lý tối ưu hóa văn bản bằng AI' });
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
