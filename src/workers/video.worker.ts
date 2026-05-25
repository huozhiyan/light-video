import { FFmpeg } from '@ffmpeg/ffmpeg';
import type { ProcessingSettings } from '../types';

let ffmpeg: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

interface ProcessMessage {
  type: 'process';
  file: File;
  settings: ProcessingSettings;
}

// Jsdelivr provides more reliable CDN than unpkg
const CORE_VERSION = '0.12.9';
const CORE_JS = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/esm/ffmpeg-core.js`;
const CORE_WASM = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/esm/ffmpeg-core.wasm`;

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg) return ffmpeg;
  // Deduplicate concurrent load calls
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const instance = new FFmpeg();

    instance.on('progress', ({ progress }) => {
      self.postMessage({ type: 'ffmpeg-progress', progress: Math.round(progress * 100) });
    });

    // Wrap load with a 60s timeout
    await Promise.race([
      instance.load({ coreURL: CORE_JS, wasmURL: CORE_WASM }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('FFmpeg engine load timed out — check network')), 60000)
      ),
    ]);

    ffmpeg = instance;
    loadPromise = null;
    return instance;
  })();

  return loadPromise;
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

  if (settings.fps) args.push('-r', String(settings.fps));

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
  if (format === 'gif') { args.push('-f', 'gif'); args.push('-loop', '0'); }
  else if (format === 'm4a' || format === 'mp3') { args.push('-vn'); }

  args.push('-y', outputName);
  return args;
}

function getMimeType(ext: string): string {
  const map: Record<string, string> = {
    m4a: 'audio/mp4', mp3: 'audio/mpeg', gif: 'image/gif',
    m4v: 'video/mp4', ogv: 'video/ogg', wmv: 'video/x-ms-wmv',
    flv: 'video/x-flv', mkv: 'video/x-matroska',
  };
  return map[ext] || `video/${ext}`;
}

self.onmessage = async (e: MessageEvent<ProcessMessage>) => {
  const { file, settings } = e.data;

  try {
    // Step 1: Read file data first (before FFmpeg, to catch file errors early)
    let fileData: ArrayBuffer;
    try {
      fileData = await file.arrayBuffer();
    } catch {
      throw new Error('Cannot read video file');
    }

    // Step 2: Load FFmpeg engine (sends ffmpeg-progress during load)
    const ff = await getFFmpeg();

    // Step 3: Now start actual processing
    self.postMessage({ type: 'progress', progress: 5 });

    const inputExt = file.name.split('.').pop()?.toLowerCase() || 'mp4';
    const outputExt = (settings.format as string).toLowerCase();
    const inputName = `input.${inputExt}`;
    const outputName = `output.${outputExt}`;

    await ff.writeFile(inputName, new Uint8Array(fileData));
    self.postMessage({ type: 'progress', progress: 10 });

    const args = buildFFmpegArgs(inputName, outputName, settings);
    await ff.exec(args);
    self.postMessage({ type: 'progress', progress: 85 });

    const data = await ff.readFile(outputName);
    const blob = new Blob([data as BlobPart], { type: getMimeType(outputExt) });

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
