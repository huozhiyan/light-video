import type { ProcessingSettings } from '../types';

interface ProcessMessage {
  type: 'process';
  file: File;
  settings: ProcessingSettings;
}

const FORMAT_MIME: Record<string, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
};

self.onmessage = async (e: MessageEvent<ProcessMessage>) => {
  const { file, settings } = e.data;

  try {
    self.postMessage({ type: 'progress', progress: 10 });

    // Decode the image
    const bitmap = await createImageBitmap(file);
    self.postMessage({ type: 'progress', progress: 30 });

    // Determine output dimensions
    let width = bitmap.width;
    let height = bitmap.height;
    if (settings.resolution) {
      if (settings.keepAspectRatio) {
        const scale = Math.min(
          settings.resolution.width / bitmap.width,
          settings.resolution.height / bitmap.height
        );
        width = Math.round(bitmap.width * scale);
        height = Math.round(bitmap.height * scale);
      } else {
        width = settings.resolution.width;
        height = settings.resolution.height;
      }
    }

    // Set up canvas
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2d context');

    self.postMessage({ type: 'progress', progress: 50 });

    // Handle transparency for JPEG output
    const srcFormat = file.type.split('/')[1] || 'jpeg';
    const dstFormat = settings.format as string;
    const needsBackgroundFill =
      dstFormat === 'jpeg' && (srcFormat === 'png' || srcFormat === 'webp');

    if (needsBackgroundFill) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
    }

    ctx.drawImage(bitmap, 0, 0, width, height);
    self.postMessage({ type: 'progress', progress: 70 });

    bitmap.close();

    // Encode
    const mimeType = FORMAT_MIME[dstFormat] || 'image/webp';
    const quality = settings.quality / 100;

    const blob = await canvas.convertToBlob({
      type: mimeType,
      quality: mimeType === 'image/png' ? undefined : quality,
    });

    self.postMessage({ type: 'progress', progress: 90 });

    self.postMessage({ type: 'complete', blob, format: dstFormat });
  } catch (err) {
    self.postMessage({
      type: 'error',
      error: err instanceof Error ? err.message : 'Image processing failed',
    });
  }
};
