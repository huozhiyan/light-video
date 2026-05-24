import { create } from 'zustand';
import { getTranslation as i18n } from '../i18n';
import type {
  MediaFile,
  ProcessingSettings,
  Task,
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
    });

    // Generate video thumbnails async
    for (const entry of entries) {
      if (entry.type === 'video') {
        generateVideoThumbnail(entry.file).then((thumb) => {
          if (thumb) {
            set((state) => ({
              files: state.files.map((f) =>
                f.id === entry.id ? { ...f, thumbnail: thumb } : f
              ),
            }));
          }
        });
      }
    }
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
      // Sync all settings changes to compatible files
      const files = state.files.map((f) => {
        const updates: Partial<ProcessingSettings> = { ...s };
        // If format changed, check compatibility before syncing
        if (s.format) {
          const isImageFmt = ['webp', 'jpeg', 'png', 'avif'].includes(s.format);
          const isVideoFmt = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'm4v', 'ogv', 'gif', 'm4a', 'mp3'].includes(s.format);
          const compatible = (f.type === 'image' && isImageFmt) || (f.type === 'video' && isVideoFmt);
          if (!compatible) delete updates.format;
        }
        return { ...f, settings: { ...f.settings, ...updates } };
      });
      return { globalSettings: newGlobal, files };
    }),

  updateFileSettings: (id, s) =>
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, settings: { ...f.settings, ...s } } : f
      ),
    })),

  startProcessing: async () => {
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
}));

async function generateVideoThumbnail(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(file);

    video.onloadeddata = () => {
      video.currentTime = 1;
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = (video.videoHeight / video.videoWidth) * 320 || 180;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      } else {
        resolve(null);
      }
      URL.revokeObjectURL(url);
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    video.src = url;
  });
}

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
  return new Promise((resolve) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === task.id ? { ...t, status: 'loading-ffmpeg' as const, progress: 0 } : t
      ),
    }));

    const worker = new Worker(
      new URL('../workers/video.worker.ts', import.meta.url),
      { type: 'module' }
    );

    worker.onmessage = (e) => {
      if (e.data.type === 'ffmpeg-progress') {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === task.id
              ? { ...t, status: 'loading-ffmpeg' as const, progress: e.data.progress }
              : t
          ),
        }));
      } else if (e.data.type === 'progress') {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === task.id
              ? { ...t, status: 'processing' as const, progress: e.data.progress }
              : t
          ),
        }));
      } else if (e.data.type === 'complete') {
        const url = URL.createObjectURL(e.data.blob);
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === task.id
              ? { ...t, status: 'completed' as const, progress: 100 }
              : t
          ),
          results: [
            ...state.results,
            {
              taskId: task.id,
              fileId: file.id,
              fileName: file.file.name,
              type: 'video' as const,
              originalSize: file.file.size,
              resultSize: e.data.blob.size,
              originalFormat: file.file.name.split('.').pop() || '',
              resultFormat: e.data.format,
              blob: e.data.blob,
              url,
            },
          ],
        }));
        worker.terminate();
        resolve(true);
      } else if (e.data.type === 'error') {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === task.id
              ? { ...t, status: 'error' as const, error: e.data.error }
              : t
          ),
        }));
        worker.terminate();
        resolve(true);
      }
    };

    worker.onerror = () => {
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === task.id
            ? { ...t, status: 'error' as const, error: i18n('msg.workerError', _get().locale) }
            : t
        ),
      }));
      worker.terminate();
      resolve(true);
    };

    worker.postMessage({
      type: 'process',
      file: file.file,
      settings: file.settings,
    });
  });
}
