import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { ProcessingSettings } from '../types';

let ffmpeg: FFmpeg | null = null;

interface ProcessMessage {
  type: 'process';
  file: File;
  settings: ProcessingSettings;
}

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg) return ffmpeg;

  ffmpeg = new FFmpeg();

  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm';

  ffmpeg.on('progress', ({ progress }) => {
    self.postMessage({ type: 'ffmpeg-progress', progress: Math.round(progress * 100) });
  });

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  return ffmpeg;
}

function qualityToCRF(quality: number): number {
  // quality 100 → CRF 0 (best), quality 0 → CRF 51 (worst)
  return Math.round(((100 - quality) / 100) * 51);
}

function buildFFmpegArgs(
  inputName: string,
  outputName: string,
  settings: ProcessingSettings
): string[] {
  const args: string[] = ['-i', inputName];

  // Video codec
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
    // h264 (default)
    args.push('-c:v', 'libx264');
    args.push('-crf', String(qualityToCRF(settings.quality)));
    args.push('-preset', 'medium');
  }

  // Resolution
  if (settings.resolution) {
    const { width, height } = settings.resolution;
    args.push('-vf', `scale=${width}:${height}${settings.keepAspectRatio ? ':force_original_aspect_ratio=decrease' : ''}`);
  }

  // FPS
  if (settings.fps) {
    args.push('-r', String(settings.fps));
  }

  // Audio codec
  if (settings.audioCodec === 'copy') {
    args.push('-c:a', 'copy');
  } else if (settings.audioCodec === 'mp3') {
    args.push('-c:a', 'libmp3lame');
    args.push('-b:a', settings.audioBitrate);
  } else {
    // aac (default)
    args.push('-c:a', 'aac');
    args.push('-b:a', settings.audioBitrate);
  }

  // Format-specific
  const format = settings.format as string;
  if (format === 'gif') {
    args.push('-f', 'gif');
    args.push('-loop', '0');
  } else if (format === 'm4a' || format === 'mp3') {
    args.push('-vn');
  }

  // Overwrite
  args.push('-y');
  args.push(outputName);

  return args;
}

self.onmessage = async (e: MessageEvent<ProcessMessage>) => {
  const { file, settings } = e.data;

  try {
    const ff = await getFFmpeg();

    const inputName = 'input.' + (file.name.split('.').pop() || 'mp4');
    const outputExt = settings.format as string;
    const outputName = 'output.' + outputExt;

    // Write input file to FFmpeg virtual FS
    self.postMessage({ type: 'progress', progress: 0 });
    await ff.writeFile(inputName, await fetchFile(file));

    // Build args
    const args = buildFFmpegArgs(inputName, outputName, settings);
    self.postMessage({ type: 'progress', progress: 10 });

    // Execute
    await ff.exec(args);
    self.postMessage({ type: 'progress', progress: 85 });

    // Read result
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

    // Cleanup
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
