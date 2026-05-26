import { create } from 'zustand';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { getTranslation as i18n } from '../i18n';
import type {
  MediaFile,
  ProcessingSettings,
  Task,
  TaskStatus,
  ProcessingResult,
  ActiveView,
  ToastMessage,
  MediaType,
} from '../types';

const DEFAULT_IMAGE_SETTINGS: ProcessingSettings = {
  format: 'webp',
  quality: 80,
  resolution: null,
  keepAspectRatio: true,
  fps: null,
  codec: 'h264',
  audioCodec: 'aac',
  audioBitrate: '192k',
  preset: null,
};

const DEFAULT_VIDEO_SETTINGS: ProcessingSettings = {
  format: 'mp4',
  quality: 75,
  resolution: null,
  keepAspectRatio: true,
  fps: null,
  codec: 'h264',
  audioCodec: 'aac',
  audioBitrate: '192k',
  preset: 'web-optimized',
};

function detectType(file: File): MediaType {
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('image/')) return 'image';
  // fallback: check extension
  const ext = file.name.split('.').pop()?.toLowerCase();
  const videoExts = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'm4v'];
  const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'bmp', 'tiff', 'svg'];
  if (ext && videoExts.includes(ext)) return 'video';
  if (ext && imageExts.includes(ext)) return 'image';
  return 'image'; // default to image
}

let idCounter = 0;
function uid(): string {
  return `${Date.now()}-${++idCounter}`;
}

// Cancellation token checked by processing loops
let _cancelToken = false;

interface AppStore {
  files: MediaFile[];
  globalSettings: ProcessingSettings;
  tasks: Task[];
  results: ProcessingResult[];
  selectedFileId: string | null;
  activeView: ActiveView;
  toasts: ToastMessage[];
  isProcessing: boolean;

  addFiles: (files: File[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  selectFile: (id: string | null) => void;

  updateGlobalSettings: (s: Partial<ProcessingSettings>) => void;
  updateFileSettings: (id: string, s: Partial<ProcessingSettings>) => void;

  startProcessing: () => Promise<void>;
  cancelAll: () => void;

  downloadOne: (id: string) => void;
  downloadAll: () => void;
  clearResults: () => void;

  addToast: (type: ToastMessage['type'], message: string) => void;
  dismissToast: (id: string) => void;

  theme: 'dark' | 'light';
  locale: 'zh' | 'en';
  toggleTheme: () => void;

  mobileSidebarOpen: boolean;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  toggleLocale: () => void;
}

export const useStore = create<AppStore>((set, get) => ({
  files: [],
  globalSettings: { ...DEFAULT_IMAGE_SETTINGS },
  tasks: [],
  results: [],
  selectedFileId: null,
  activeView: 'dropzone',
  toasts: [],
  isProcessing: false,

  addFiles: (newFiles: File[]) => {
    const { files, activeView } = get();
    const existingNames = new Set(files.map((f) => f.file.name + f.file.size));
    const filtered = newFiles.filter((f) => !existingNames.has(f.name + f.size));

    if (filtered.length === 0) return;

    const entries: MediaFile[] = filtered.map((file) => {
      const type = detectType(file);
      const defaults =
        type === 'video'
          ? { ...DEFAULT_VIDEO_SETTINGS }
          : { ...DEFAULT_IMAGE_SETTINGS };
      // Inherit global format if compatible with this file type
      const currentFmt = get().globalSettings.format;
      const imageFmts = ['webp', 'jpeg', 'png', 'avif'];
      const videoFmts = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'm4v', 'ogv', 'gif', 'm4a', 'mp3'];
      if (type === 'image' && imageFmts.includes(currentFmt)) {
        defaults.format = currentFmt;
      } else if (type === 'video' && videoFmts.includes(currentFmt)) {
        defaults.format = currentFmt;
      }
      return {
        id: uid(),
        file,
        type,
        thumbnail: type === 'image' ? URL.createObjectURL(file) : null,
        settings: defaults,
      };
    });

    set({
      files: [...files, ...entries],
      activeView: activeView === 'dropzone' ? 'files' : activeView,
      mobileSidebarOpen: entries.length > 0,
    });

  },

  removeFile: (id) => {
    const { files, selectedFileId, results } = get();
    const file = files.find((f) => f.id === id);
    if (file?.thumbnail) URL.revokeObjectURL(file.thumbnail);
    // Clean up result URLs
    const fileResults = results.filter((r) => r.fileId === id);
    for (const r of fileResults) URL.revokeObjectURL(r.url);

    set({
      files: files.filter((f) => f.id !== id),
      results: results.filter((r) => r.fileId !== id),
      selectedFileId: selectedFileId === id ? null : selectedFileId,
    });
  },

  clearFiles: () => {
    const { files, results } = get();
    for (const f of files) {
      if (f.thumbnail) URL.revokeObjectURL(f.thumbnail);
    }
    for (const r of results) URL.revokeObjectURL(r.url);
    set({
      files: [],
      results: [],
      tasks: [],
      selectedFileId: null,
      activeView: 'dropzone',
      isProcessing: false,
    });
  },

  selectFile: (id) => set({ selectedFileId: id }),

  updateGlobalSettings: (s) =>
    set((state) => {
      const newGlobal = { ...state.globalSettings, ...s };
      const imageFmts = ['webp', 'jpeg', 'png', 'avif'];
      const videoFmts = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'm4v', 'ogv', 'gif', 'm4a', 'mp3'];
      // Sync settings changes, filtering type-incompatible fields
      const files = state.files.map((f) => {
        const updates: Partial<ProcessingSettings> = {};
        // Format: only sync if compatible with file type
        if (s.format) {
          const isImageFmt = imageFmts.includes(s.format);
          const isVideoFmt = videoFmts.includes(s.format);
          if ((f.type === 'image' && isImageFmt) || (f.type === 'video' && isVideoFmt)) {
            updates.format = s.format;
          }
        }
        // Video-specific fields: only sync to video files
        if (f.type === 'video') {
          if (s.codec !== undefined) updates.codec = s.codec;
          if (s.fps !== undefined) updates.fps = s.fps;
          if (s.audioCodec !== undefined) updates.audioCodec = s.audioCodec;
          if (s.audioBitrate !== undefined) updates.audioBitrate = s.audioBitrate;
        }
        // Shared fields: sync to all files
        if (s.quality !== undefined) updates.quality = s.quality;
        if (s.resolution !== undefined) updates.resolution = s.resolution;
        if (s.keepAspectRatio !== undefined) updates.keepAspectRatio = s.keepAspectRatio;
        if (s.preset !== undefined) updates.preset = s.preset;
        return { ...f, settings: { ...f.settings, ...updates } };
      });
      return { globalSettings: newGlobal, files };
    }),

  updateFileSettings: (id, s) =>
    set((state) => ({
      files: state.files.map((f) => {
        if (f.id !== id) return f;
        const merged = { ...f.settings, ...s };
        // Validate format compatibility
        const imageFmts = ['webp', 'jpeg', 'png', 'avif'];
        const videoFmts = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'm4v', 'ogv', 'gif', 'm4a', 'mp3'];
        if (f.type === 'image' && !imageFmts.includes(merged.format)) {
          delete (merged as any).format;
        }
        if (f.type === 'video' && !videoFmts.includes(merged.format)) {
          delete (merged as any).format;
        }
        return { ...f, settings: merged };
      }),
    })),

  startProcessing: async () => {
    _cancelToken = false;
    const { files } = get();
    if (files.length === 0) return;

    const newTasks: Task[] = files.map((f) => ({
      id: uid(),
      fileId: f.id,
      fileName: f.file.name,
      type: f.type,
      status: 'pending' as const,
      progress: 0,
    }));

    set({ tasks: newTasks, activeView: 'progress', isProcessing: true, results: [] });

    const imageFiles = files.filter((f) => f.type === 'image');
    const videoFiles = files.filter((f) => f.type === 'video');

    // Process images in parallel using workers
    if (imageFiles.length > 0) {
      const imageTasks = newTasks.filter((t) => t.type === 'image');
      await processImagesInParallel(imageFiles, imageTasks, set, get);
    }

    // Process videos sequentially (WASM is memory-heavy)
    if (videoFiles.length > 0) {
      const videoTasks = newTasks.filter((t) => t.type === 'video');
      for (let i = 0; i < videoFiles.length; i++) {
        const shouldContinue = await processVideo(videoFiles[i], videoTasks[i], set, get);
        if (!shouldContinue) break;
      }
    }

    const allDone = get().tasks.every((t) => t.status === 'completed' || t.status === 'error');
    if (allDone) {
      set({ activeView: 'results', isProcessing: false });
    }
  },

  cancelAll: () => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.status === 'pending' || t.status === 'loading-ffmpeg' || t.status === 'processing'
          ? { ...t, status: 'error' as const, error: i18n('msg.cancelled', get().locale) }
          : t
      ),
      isProcessing: false,
      activeView: 'results',
    }));
    _cancelToken = true;
  },

  downloadOne: (id) => {
    const result = get().results.find((r) => r.taskId === id || r.fileId === id);
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.url;
    a.download = getOutputFileName(result);
    a.click();
  },

  downloadAll: async () => {
    const { results, addToast } = get();
    if (results.length === 0) return;
    if (results.length === 1) {
      get().downloadOne(results[0].taskId);
      return;
    }

    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      for (const r of results) {
        zip.file(getOutputFileName(r), r.blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `light-video-${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      addToast('error', i18n('msg.zipFailed', get().locale));
    }
  },

  clearResults: () => {
    const { results } = get();
    for (const r of results) URL.revokeObjectURL(r.url);
    set({ results: [], tasks: [], activeView: 'files' });
  },

  addToast: (type, message) => {
    const id = uid();
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }));
    setTimeout(() => get().dismissToast(id), 4000);
  },

  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  theme: (() => {
    const saved = localStorage.getItem('lightvideo-theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  })(),
  locale: (() => {
    const saved = localStorage.getItem('lightvideo-locale');
    return (saved === 'zh' || saved === 'en') ? saved : 'zh';
  })(),

  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('lightvideo-theme', next);
      document.documentElement.setAttribute('data-theme', next);
      return { theme: next };
    }),

  toggleLocale: () =>
    set((state) => {
      const next = state.locale === 'zh' ? 'en' : 'zh';
      localStorage.setItem('lightvideo-locale', next);
      return { locale: next };
    }),

  mobileSidebarOpen: false,
  toggleMobileSidebar: () => set((s) => ({ mobileSidebarOpen: !s.mobileSidebarOpen })),
  closeMobileSidebar: () => set({ mobileSidebarOpen: false }),
}));

function getOutputFileName(result: ProcessingResult): string {
  const base = result.fileName.replace(/\.[^.]+$/, '');
  return `${base}_converted.${result.resultFormat}`;
}

async function processImagesInParallel(
  files: MediaFile[],
  tasks: Task[],
  set: (typeof useStore)['setState'],
  _get: (typeof useStore)['getState']
) {
  const workerCount = Math.max(1, Math.min(navigator.hardwareConcurrency - 1 || 3, 6));
  const queue = files.map((f, i) => ({ file: f, task: tasks[i] }));
  let cancelled = false;

  async function workerLoop() {
    while (queue.length > 0 && !cancelled) {
      const item = queue.shift();
      if (!item) break;

      // Skip incompatible formats for image processing
      const imageFmts = ['webp', 'jpeg', 'png', 'avif'];
      if (!imageFmts.includes(item.file.settings.format as string)) {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === item.task.id ? { ...t, status: 'error' as const, error: 'Format not supported for images' } : t
          ),
        }));
        continue;
      }

      if (_cancelToken) break;

      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === item.task.id ? { ...t, status: 'processing' as const } : t
        ),
      }));

      let worker: Worker | null = null;
      try {
        worker = new Worker(
          new URL('../workers/image.worker.ts', import.meta.url),
          { type: 'module' }
        );

        if (!worker) throw new Error('Failed to create worker');

        const result = await new Promise<{ blob: Blob; format: string }>((resolve, reject) => {
          worker!.onmessage = (e) => {
            if (e.data.type === 'progress') {
              set((state) => ({
                tasks: state.tasks.map((t) =>
                  t.id === item.task.id ? { ...t, progress: e.data.progress } : t
                ),
              }));
            } else if (e.data.type === 'complete') {
              resolve({ blob: e.data.blob, format: e.data.format });
            } else if (e.data.type === 'error') {
              reject(new Error(e.data.error));
            }
          };
          worker!.onerror = (e) => reject(e);

          worker!.postMessage({
            type: 'process',
            file: item.file.file,
            settings: item.file.settings,
          });
        });

        if (_cancelToken) { worker?.terminate(); return; }
        const url = URL.createObjectURL(result.blob);
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === item.task.id
              ? { ...t, status: 'completed' as const, progress: 100 }
              : t
          ),
          results: [
            ...state.results,
            {
              taskId: item.task.id,
              fileId: item.file.id,
              fileName: item.file.file.name,
              type: 'image' as const,
              originalSize: item.file.file.size,
              resultSize: result.blob.size,
              originalFormat: item.file.file.name.split('.').pop() || '',
              resultFormat: result.format,
              blob: result.blob,
              url,
            },
          ],
        }));
      } catch (err) {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === item.task.id
              ? {
                  ...t,
                  status: 'error' as const,
                  error: err instanceof Error ? err.message : i18n('msg.processFailed', _get().locale),
                }
              : t
          ),
        }));
      } finally {
        worker?.terminate();
      }
    }
  }

  const workers = Array.from({ length: workerCount }, () => workerLoop());
  await Promise.all(workers);

  // Check if cancelled externally
  return !cancelled;
}

async function processVideo(
  file: MediaFile,
  task: Task,
  set: (typeof useStore)['setState'],
  _get: (typeof useStore)['getState']
): Promise<boolean> {
  const updateProgress = (status: TaskStatus, progress: number) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === task.id ? { ...t, status, progress } : t
      ),
    }));
  };

  const complete = (blob: Blob, format: string) => {
    const url = URL.createObjectURL(blob);
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === task.id ? { ...t, status: 'completed' as const, progress: 100 } : t
      ),
      results: [
        ...state.results,
        {
          taskId: task.id,
          fileId: file.id,
          fileName: file.file.name,
          type: 'video' as const,
          originalSize: file.file.size,
          resultSize: blob.size,
          originalFormat: file.file.name.split('.').pop() || '',
          resultFormat: format,
          blob,
          url,
        },
      ],
    }));
  };

  const fail = (error: string) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === task.id ? { ...t, status: 'error' as const, error } : t
      ),
    }));
  };

  try {
    // Validate: video processing only supports video output formats
    const videoFmts = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'm4v', 'ogv', 'gif', 'm4a', 'mp3'];
    if (!videoFmts.includes(file.settings.format as string)) {
      fail(`Video output format "${file.settings.format}" is not supported`);
      return true;
    }

    console.log('[Video] Starting processing for:', file.file.name);
    updateProgress('loading-ffmpeg', 0);

    const coreURL = new URL('/ffmpeg/ffmpeg-core.js', import.meta.url).href;
    const wasmURL = new URL('/ffmpeg/ffmpeg-core.wasm', import.meta.url).href;
    console.log('[Video] Core URLs:', { coreURL, wasmURL });

    const ff = new FFmpeg();
    console.log('[Video] FFmpeg instance created');

    // Capture FFmpeg internal logs for debugging
    ff.on('log', ({ message }: { message: string }) => {
      console.log('[FFmpeg]', message);
    });

    let isExecing = false;
    ff.on('progress', ({ progress }: { progress: number }) => {
      const pct = Math.round(progress * 100);
      if (isExecing) {
        updateProgress('processing', 10 + Math.round(progress * 75));
      } else {
        updateProgress('loading-ffmpeg', Math.min(pct, 4));
      }
    });

    console.log('[Video] Loading FFmpeg...');
    await ff.load({ coreURL, wasmURL });
    console.log('[Video] FFmpeg loaded');
    updateProgress('processing', 5);

    console.log('[Video] Reading file...');
    const fileData = new Uint8Array(await file.file.arrayBuffer());
    console.log('[Video] File read, size:', fileData.length);

    const inputExt = file.file.name.split('.').pop()?.toLowerCase() || 'mp4';
    const outputExt = (file.settings.format as string).toLowerCase();
    const inputName = `input.${inputExt}`;
    const outputName = `output.${outputExt}`;

    await ff.writeFile(inputName, fileData);
    console.log('[Video] File written to FS');
    updateProgress('processing', 10);

    // Build args
    isExecing = true;
    const settings = file.settings;
    const args: string[] = ['-i', inputName];

    const fmt = settings.format as string;

    if (fmt === 'gif') {
      // GIF needs palette-based encoding, not standard codecs
      const fps = settings.fps || 10;
      const w = settings.resolution?.width || 480;
      const h = settings.resolution?.height || -2;
      args.push(
        '-an', '-map', '0:v:0',
        '-vf', `fps=${fps},scale=w=${w}:h=${h}:force_original_aspect_ratio=decrease:force_divisible_by=2,split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse=dither=bayer`,
        '-loop', '0'
      );
    } else {
      // Standard video/audio encoding
      const isCopy = settings.codec === 'copy';
      if (isCopy) {
        args.push('-c:v', 'copy', '-c:a', 'copy');
      } else if (settings.codec === 'h265') {
        args.push('-c:v', 'libx265', '-crf', String(Math.round(((100 - settings.quality) / 100) * 51)), '-preset', 'ultrafast');
      } else if (settings.codec === 'vp9') {
        args.push('-c:v', 'libvpx-vp9', '-crf', String(Math.round(((100 - settings.quality) / 100) * 51)), '-b:v', '0', '-deadline', 'realtime', '-cpu-used', '8');
      } else {
        args.push('-c:v', 'libx264', '-crf', String(Math.round(((100 - settings.quality) / 100) * 51)), '-preset', 'ultrafast', '-tune', 'fastdecode');
      }

      // Stream copy doesn't support filtering (vf, fps)
      if (!isCopy) {
        if (settings.resolution) {
          const { width, height } = settings.resolution;
          if (settings.keepAspectRatio) {
            args.push('-vf', `scale=w=${width}:h=${height}:force_original_aspect_ratio=decrease:force_divisible_by=2`);
          } else {
            args.push('-vf', `scale=w=${width}:h=${height}:force_divisible_by=2`);
          }
        }
        if (settings.fps) args.push('-r', String(settings.fps));

        if (settings.audioCodec === 'mp3') {
          args.push('-c:a', 'libmp3lame', '-b:a', settings.audioBitrate);
        } else if (settings.audioCodec !== 'copy') {
          args.push('-c:a', 'aac', '-b:a', settings.audioBitrate);
        }
      }

      if (fmt === 'm4a' || fmt === 'mp3') { args.push('-vn'); }
    }

    args.push('-y', outputName);

    if (_cancelToken) { fail(i18n('msg.cancelled', _get().locale)); return true; }
    console.log('[Video] Running ffmpeg with args:', args.join(' '));
    await ff.exec(args);
    console.log('[Video] FFmpeg exec complete');
    updateProgress('processing', 85);

    const data = await ff.readFile(outputName);
    console.log('[Video] Output read, size:', (data as any).length ?? (data as any).byteLength);
    const mimeMap: Record<string, string> = {
      m4a: 'audio/mp4', mp3: 'audio/mpeg', gif: 'image/gif',
      m4v: 'video/mp4', ogv: 'video/ogg', wmv: 'video/x-ms-wmv',
      flv: 'video/x-flv', mkv: 'video/x-matroska',
    };
    const blob = new Blob([data as BlobPart], { type: mimeMap[outputExt] || `video/${outputExt}` });

    await ff.deleteFile(inputName);
    await ff.deleteFile(outputName);
    console.log('[Video] Processing complete, output size:', blob.size);

    complete(blob, outputExt);
    return true;
  } catch (err) {
    console.error('[Video] Processing failed:', err);
    fail(err instanceof Error ? err.message : 'Video processing failed');
    return true;
  }
}
