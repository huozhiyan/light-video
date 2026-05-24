export type MediaType = 'image' | 'video';

export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'avif';
export type VideoFormat = 'mp4' | 'webm' | 'mov' | 'avi' | 'mkv' | 'flv' | 'wmv' | 'm4v' | 'ogv' | 'gif' | 'm4a' | 'mp3';

export type OutputFormat = ImageFormat | VideoFormat;

export interface Resolution {
  width: number;
  height: number;
}

export interface ProcessingSettings {
  format: OutputFormat;
  quality: number; // 0-100
  resolution: Resolution | null; // null = keep original
  keepAspectRatio: boolean;
  // Video-specific
  fps: number | null;
  codec: string; // 'h264' | 'h265' | 'vp9' | 'copy'
  audioCodec: string; // 'aac' | 'mp3' | 'copy'
  audioBitrate: string; // '128k', '192k', '256k'
  preset: PresetName | null;
}

export type PresetName = 'web-optimized' | 'extreme-compress' | 'lossless' | 'gif-extract' | 'audio-extract';

export interface Preset {
  name: PresetName;
  label: string;
  description: string;
  icon: string;
  settings: Partial<ProcessingSettings>;
}

export interface MediaFile {
  id: string;
  file: File;
  type: MediaType;
  thumbnail: string | null;
  settings: ProcessingSettings;
}

export type TaskStatus = 'pending' | 'loading-ffmpeg' | 'processing' | 'completed' | 'error';

export interface Task {
  id: string;
  fileId: string;
  fileName: string;
  type: MediaType;
  status: TaskStatus;
  progress: number; // 0-100
  error?: string;
}

export interface ProcessingResult {
  taskId: string;
  fileId: string;
  fileName: string;
  type: MediaType;
  originalSize: number;
  resultSize: number;
  originalFormat: string;
  resultFormat: string;
  blob: Blob;
  url: string;
}

export type ActiveView = 'dropzone' | 'files' | 'progress' | 'results';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
