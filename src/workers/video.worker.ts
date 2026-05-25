import { FFmpeg } from '@ffmpeg/ffmpeg';
import type { ProcessingSettings } from '../types';

let ffmpeg: FFmpeg | null = null;

interface ProcessMessage {
  type: 'process';
  file: File;
  settings: ProcessingSettings;
}

const CORE_JS = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js';
const CORE_WASM = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm';

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg) return ffmpeg;

  ffmpeg = new FFmpeg();

  ffmpeg.on('progress', ({ progress }) => {
    self.postMessage({ type: 'ffmpeg-progress', progress: Math.round(progress * 100) });
  });

  // Use raw URLs instead of toBlobURL to avoid blob URL cross-context issues
  await ffmpeg.load({
    coreURL: CORE_JS,
    wasmURL: CORE_WASM,
  });

  return ffmpeg;
}

function qualityToCRF(quality: number): number {
  return Math.round(((100 - quality) / 100) * 51);
}

function buildFFmpegArgs(
  inputName: string,
  outputName: string,
  settings: ProcessingSettings
): string[] {
  const args: string[] = ['-i', inputName];

  if (settings.codec === 'copy') {
    args.push('-c', 'copy');
  } else if (settings.codec === 'h265') {
    args.push('-c:v', 'libx265');
    args.push('-crf', String(qualityToCRF(settings.quality)));
  } else if (settings.codec === 'vp9') {
    args.push('-c:v', 'libvpx-vp9');
    args.push('-crf', String(qualityToCRF(settings.quality)));
    args.push('-b:v', '0');
  } else {
    args.push('-c:v', 'libx264');
    args.push('-crf', String(qualityToCRF(settings.quality)));
    args.push('-preset', 'medium');
  }

  if (settings.resolution) {
    const { width, height } = settings.resolution;
    args.push('-vf', `scale=${width}:${height}${settings.keepAspectRatio ? ':force_original_aspect_ratio=decrease' : ''}`);
  }

  if (settings.fps) {
    args.push('-r', String(settings.fps));
  }

  if (settings.audioCodec === 'copy') {
    args.push('-c:a', 'copy');
  } else if (settings.audioCodec === 'mp3') {
    args.push('-c:a', 'libmp3lame');
    args.push('-b:a', settings.audioBitrate);
  } else {
    args.push('-c:a', 'aac');
    args.push('-b:a', settings.audioBitrate);
  }

  const format = settings.format as string;
  if (format === 'gif') {
    args.push('-f', 'gif');
    args.push('-loop', '0');
  } else if (format === 'm4a' || format === 'mp3') {
    args.push('-vn');
  }

  args.push('-y');
  args.push(outputName);

  return args;
}

self.onmessage = async (e: MessageEvent<ProcessMessage>) => {
  const { file, settings } = e.data;

  try {
    self.postMessage({ type: 'progress', progress: 0 });

    // Read file as ArrayBuffer directly instead of using fetchFile,
    // which can incorrectly treat blob URLs as network URLs in Workers
    let fileData: ArrayBuffer;
    try {
      fileData = await file.arrayBuffer();
    } catch {
      throw new Error('Failed to read video file');
    }

    const ff = await getFFmpeg();

    const inputExt = file.name.split('.').pop() || 'mp4';
    const outputExt = settings.format as string;
    const inputName = `input.${inputExt}`;
    const outputName = `output.${outputExt}`;

    await ff.writeFile(inputName, new Uint8Array(fileData));

    const args = buildFFmpegArgs(inputName, outputName, settings);
    self.postMessage({ type: 'progress', progress: 10 });

    await ff.exec(args);
    self.postMessage({ type: 'progress', progress: 85 });

    const data = await ff.readFile(outputName);
    const mimeType =
      outputExt === 'm4a' ? 'audio/mp4' :
      outputExt === 'mp3' ? 'audio/mpeg' :
      outputExt === 'gif' ? 'image/gif' :
      outputExt === 'm4v' ? 'video/mp4' :
      outputExt === 'ogv' ? 'video/ogg' :
      outputExt === 'wmv' ? 'video/x-ms-wmv' :
      outputExt === 'flv' ? 'video/x-flv' :
      outputExt === 'mkv' ? 'video/x-matroska' :
      `video/${outputExt}`;
    const blob = new Blob([data as BlobPart], { type: mimeType });

    await ff.deleteFile(inputName);
    await ff.deleteFile(outputName);

    self.postMessage({ type: 'complete', blob, format: outputExt });
  } catch (err) {
    self.postMessage({
      type: 'error',
      error: err instanceof Error ? err.message : 'Video processing failed',
    });
  }
};
