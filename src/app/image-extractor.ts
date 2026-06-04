/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
export class ImageExtractor {
  /**
   * PDF.js Operator image extraction helper
   */
  static async extractImagesFromPage(page: any, pdfjsLib: any): Promise<any[]> {
    const images: any[] = [];
    if (!pdfjsLib) return images;

    try {
      const operatorList = await page.getOperatorList();
      const fns = operatorList.fnArray;
      const args = operatorList.argsArray;

      const uniqueKeys = new Map<string, { fn: number; inlineImg?: any }>();
      for (let i = 0; i < fns.length; i++) {
        const fn = fns[i];
        if (fn === pdfjsLib.OPS.paintImageXObject) {
          const imageKey = args[i][0];
          if (imageKey && typeof imageKey === 'string' && !uniqueKeys.has(imageKey)) {
            uniqueKeys.set(imageKey, { fn });
          }
        } else if (fn === pdfjsLib.OPS.paintInlineImageXObject) {
          const inlineObj = args[i][0];
          if (inlineObj && typeof inlineObj === 'object') {
            const inlineKey = `inline_img_${i}`;
            uniqueKeys.set(inlineKey, {
              fn,
              inlineImg: inlineObj
            });
          }
        }
      }

      const fetchPromises = Array.from(uniqueKeys.entries()).map(async ([imageKey, info]) => {
        try {
          if (info.inlineImg) {
            return { imageKey, imgObj: info.inlineImg };
          }

          const imgObj = await new Promise<any>((resolve) => {
            let completed = false;
            const timeoutId = setTimeout(() => {
              if (!completed) {
                completed = true;
                resolve(null);
              }
            }, 1000);

            if (page.objs) {
              try {
                page.objs.get(imageKey, (obj: any) => {
                  if (obj && !completed) {
                    completed = true;
                    clearTimeout(timeoutId);
                    resolve(obj);
                  }
                });
              } catch (err) {
                // ignore
              }
            }

            if (page.commonObjs) {
              try {
                page.commonObjs.get(imageKey, (obj: any) => {
                  if (obj && !completed) {
                    completed = true;
                    clearTimeout(timeoutId);
                    resolve(obj);
                  }
                });
              } catch (err) {
                // ignore
              }
            }
          });

          return { imageKey, imgObj };
        } catch (e) {
          return { imageKey, imgObj: null };
        }
      });

      const fetchedResults = await Promise.all(fetchPromises);

      for (const { imageKey, imgObj } of fetchedResults) {
        if (!imgObj) continue;

        const width = imgObj.width || (imgObj.bitmap && imgObj.bitmap.width) || (imgObj.image && imgObj.image.width) || 0;
        const height = imgObj.height || (imgObj.bitmap && imgObj.bitmap.height) || (imgObj.image && imgObj.image.height) || 0;

        if (width > 24 && height > 24) {
          let stride = 1;
          while ((width / stride) * (height / stride) > 800 * 800 && stride < 4) {
            stride++;
          }

          const targetWidth = Math.floor(width / stride);
          const targetHeight = Math.floor(height / stride);

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d')!;

          const drawable = imgObj.bitmap || imgObj.image || 
            (typeof ImageBitmap !== 'undefined' && imgObj instanceof ImageBitmap ? imgObj : null) || 
            (typeof HTMLImageElement !== 'undefined' && imgObj instanceof HTMLImageElement ? imgObj : null) ||
            (typeof HTMLCanvasElement !== 'undefined' && imgObj instanceof HTMLCanvasElement ? imgObj : null);

          if (drawable) {
            try {
              ctx.drawImage(drawable, 0, 0, targetWidth, targetHeight);
              const dataUrl = canvas.toDataURL('image/png');
              images.push({
                dataUrl,
                width: targetWidth,
                height: targetHeight,
                key: imageKey
              });
            } catch (drawErr) {
              // ignore
            }
          } else if (imgObj.data) {
            try {
              const imgData = ctx.createImageData(targetWidth, targetHeight);
              const rawData = imgObj.data;
              const targetData = imgData.data;

              if (stride === 1) {
                const numPixels = targetWidth * targetHeight;
                if (rawData.length === numPixels * 4) {
                  targetData.set(rawData);
                } else if (rawData.length === numPixels * 3) {
                  let src = 0;
                  let dest = 0;
                  for (let p = 0; p < numPixels; p++) {
                    targetData[dest] = rawData[src];
                    targetData[dest + 1] = rawData[src + 1];
                    targetData[dest + 2] = rawData[src + 2];
                    targetData[dest + 3] = 255;
                    src += 3;
                    dest += 4;
                  }
                } else {
                  let src = 0;
                  let dest = 0;
                  for (let p = 0; p < numPixels; p++) {
                    const val = rawData[src] !== undefined ? rawData[src] : 128;
                    targetData[dest] = val;
                    targetData[dest + 1] = val;
                    targetData[dest + 2] = val;
                    targetData[dest + 3] = 255;
                    src++;
                    dest += 4;
                  }
                }
              } else {
                let dest = 0;
                const isRGBA = rawData.length === width * height * 4;
                const isRGB = rawData.length === width * height * 3;

                if (isRGBA) {
                  for (let tr = 0; tr < targetHeight; tr++) {
                    const origRowStart = tr * stride * width * 4;
                    for (let tc = 0; tc < targetWidth; tc++) {
                      const src = origRowStart + (tc * stride * 4);
                      targetData[dest] = rawData[src];
                      targetData[dest + 1] = rawData[src + 1];
                      targetData[dest + 2] = rawData[src + 2];
                      targetData[dest + 3] = rawData[src + 3];
                      dest += 4;
                    }
                  }
                } else if (isRGB) {
                  for (let tr = 0; tr < targetHeight; tr++) {
                    const origRowStart = tr * stride * width * 3;
                    for (let tc = 0; tc < targetWidth; tc++) {
                      const src = origRowStart + (tc * stride * 3);
                      targetData[dest] = rawData[src];
                      targetData[dest + 1] = rawData[src + 1];
                      targetData[dest + 2] = rawData[src + 2];
                      targetData[dest + 3] = 255;
                      dest += 4;
                    }
                  }
                } else {
                  for (let tr = 0; tr < targetHeight; tr++) {
                    const origRowStart = tr * stride * width;
                    for (let tc = 0; tc < targetWidth; tc++) {
                      const src = origRowStart + (tc * stride);
                      const val = rawData[src] !== undefined ? rawData[src] : 128;
                      targetData[dest] = val;
                      targetData[dest + 1] = val;
                      targetData[dest + 2] = val;
                      targetData[dest + 3] = 255;
                      dest += 4;
                    }
                  }
                }
              }

              ctx.putImageData(imgData, 0, 0);
              const dataUrl = canvas.toDataURL('image/png');
              images.push({
                dataUrl,
                width: targetWidth,
                height: targetHeight,
                key: imageKey
              });
            } catch (pixelErr) {
              // ignore
            }
          }
        }
      }
    } catch (e) {
      console.error('Không bóc được hình lẻ:', e);
    }
    return images;
  }
}
