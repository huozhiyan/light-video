import { useStore } from './store/useStore';

export type Locale = 'zh' | 'en';

const dict: Record<string, { zh: string; en: string }> = {
  // Sidebar
  'sidebar.outputSettings': { zh: '输出设置', en: 'Output Settings' },
  'sidebar.quality': { zh: '画质', en: 'Quality' },
  'sidebar.resolution': { zh: '分辨率', en: 'Resolution' },
  'sidebar.resolutionHint': { zh: '留空则保持原始分辨率', en: 'Leave empty to keep original' },
  'sidebar.presets': { zh: '预设方案', en: 'Presets' },
  'sidebar.advanced': { zh: '高级选项', en: 'Advanced' },
  'sidebar.videoCodec': { zh: '视频编码器', en: 'Video Codec' },
  'sidebar.audioCodec': { zh: '音频编码器', en: 'Audio Codec' },
  'sidebar.audioBitrate': { zh: '音频码率', en: 'Audio Bitrate' },
  'sidebar.start': { zh: '开始处理', en: 'Start' },
  'sidebar.cancel': { zh: '取消全部', en: 'Cancel All' },

  // DropZone
  'dropzone.dropHere': { zh: '松开以上传文件', en: 'Drop to Import' },
  'dropzone.dropMedia': { zh: '拖拽媒体文件到此处', en: 'Drop Media Files Here' },
  'dropzone.hint': { zh: 'or click to browse · 图片和视频 · 最大 2GB', en: 'or click to browse · images & video · up to 2GB' },
  'dropzone.formats': { zh: 'MP4 / WebM / MOV / AVI / MKV 等', en: 'MP4 / WebM / MOV / AVI / MKV etc.' },

  // FileCard / FileGrid
  'file.video': { zh: '视频', en: 'Video' },
  'file.image': { zh: '图片', en: 'Image' },
  'file.fileList': { zh: '文件列表', en: 'Files' },
  'file.addMore': { zh: '添加文件', en: 'Add Files' },

  // QualitySlider
  'quality.lossless': { zh: '无损', en: 'Lossless' },
  'quality.pngHint': { zh: 'PNG 为无损格式，不进行有损压缩，转换后体积可能变大', en: 'PNG is lossless — file size may increase after conversion' },
  'quality.avifHint': { zh: '建议画质 40-65%，AVIF 在该范围内体积更小且视觉无损', en: 'Recommended 40-65% — AVIF achieves smaller sizes with visually lossless quality in this range' },

  // Presets
  'preset.turbo': { zh: '极速模式', en: 'Turbo' },
  'preset.turboDesc': { zh: '360p · 超快编码 · 秒级出片', en: '360p · ultrafast · seconds' },
  'preset.webOptimized': { zh: 'Web 优化', en: 'Web Ready' },
  'preset.extremeCompress': { zh: '极致压缩', en: 'Max Crush' },
  'preset.lossless': { zh: '无损转换', en: 'Lossless' },
  'preset.gifExtract': { zh: '视频转 GIF', en: 'Video to GIF' },
  'preset.audioExtract': { zh: '提取音频', en: 'Extract Audio' },
  'preset.webOptimizedDesc': { zh: 'H.264 · 720p · CRF 28', en: 'H.264 · 720p · CRF 28' },
  'preset.extremeCompressDesc': { zh: 'H.265 · 480p · CRF 35', en: 'H.265 · 480p · CRF 35' },
  'preset.losslessDesc': { zh: '复制编码 · 不重新编码', en: 'Copy codec · no re-encode' },
  'preset.gifExtractDesc': { zh: '10fps · 480p · 静音动图', en: '10fps · 480p · silent' },
  'preset.audioExtractDesc': { zh: 'AAC 192kbps · M4A', en: 'AAC 192kbps · M4A' },

  // Progress
  'progress.title': { zh: '处理中', en: 'Processing' },
  'progress.completed': { zh: '已完成', en: 'completed' },
  'progress.errors': { zh: '个失败', en: ' error(s)' },
  'progress.cancel': { zh: '取消', en: 'Cancel' },
  'progress.loadingEngine': { zh: '加载引擎', en: 'Loading engine' },
  'progress.done': { zh: '完成', en: 'Done' },
  'progress.error': { zh: '错误', en: 'Error' },
  'progress.queued': { zh: '排队中', en: 'Queued' },

  // Results
  'result.title': { zh: '处理结果', en: 'Results' },
  'result.filesProcessed': { zh: '已处理', en: 'processed' },
  'result.saved': { zh: '节省', en: 'saved' },
  'result.allFailed': { zh: '全部任务处理失败，请检查文件格式后重试', en: 'All tasks failed — check file format and retry' },
  'result.newBatch': { zh: '新的批次', en: 'New Batch' },

  // CompareView
  'compare.original': { zh: '原始', en: 'Original' },

  // DownloadBar
  'download.ready': { zh: '准备下载', en: 'Ready to download' },
  'download.files': { zh: '个文件', en: ' file(s)' },
  'download.zipAll': { zh: '打包下载', en: 'Download ZIP' },

  // Header
  'header.workers': { zh: '工作线程', en: 'workers' },
  'header.files': { zh: '个文件', en: ' file(s)' },

  // GuidePanel
  'guide.title': { zh: '使用指南', en: 'User Guide' },
  'guide.subtitle': { zh: '纯浏览器端运行 · 无需上传服务器 · 隐私安全', en: 'Browser-based · No upload · Private & Secure' },
  'guide.import': { zh: '导入文件', en: 'Import' },
  'guide.imageFormats': { zh: '图片格式', en: 'Image Formats' },
  'guide.imageFormatsDesc': { zh: 'JPG · PNG · WebP · AVIF · GIF · BMP', en: 'JPG · PNG · WebP · AVIF · GIF · BMP' },
  'guide.videoFormats': { zh: '视频格式', en: 'Video Formats' },
  'guide.videoFormatsDesc': { zh: 'MP4 · WebM · MOV · AVI · MKV · FLV · WMV', en: 'MP4 · WebM · MOV · AVI · MKV · FLV · WMV' },
  'guide.dragDrop': { zh: '拖拽上传', en: 'Drag & Drop' },
  'guide.dragDropDesc': { zh: '拖拽文件到上方区域，或点击区域浏览选择', en: 'Drag files to the area above, or click to browse' },
  'guide.imageProcessing': { zh: '图片处理', en: 'Image Processing' },
  'guide.imageConvert': { zh: '格式转换', en: 'Format Conversion' },
  'guide.imageConvertDesc': { zh: 'JPG / PNG / WebP / AVIF 任意互转', en: 'Convert between JPG, PNG, WebP, AVIF' },
  'guide.imageCompress': { zh: '画质压缩', en: 'Quality' },
  'guide.imageCompressDesc': { zh: '1–100% 可调，PNG 无损格式不参与压缩', en: '1–100% adjustable, PNG is lossless' },
  'guide.imageResize': { zh: '分辨率缩放', en: 'Resize' },
  'guide.imageResizeDesc': { zh: '自定义宽高，支持保持原始宽高比例', en: 'Custom dimensions with aspect ratio lock' },
  'guide.videoProcessing': { zh: '视频处理', en: 'Video Processing' },
  'guide.videoConvert': { zh: '格式转换', en: 'Format Conversion' },
  'guide.videoConvertDesc': { zh: 'MP4 / WebM / MOV / AVI / MKV 等 9 种格式', en: '9 formats: MP4, WebM, MOV, AVI, MKV, etc.' },
  'guide.videoCodecQuality': { zh: '编码与画质', en: 'Codec & Quality' },
  'guide.videoCodecQualityDesc': { zh: 'H.264 / H.265 / VP9 编码器，CRF 画质控制', en: 'H.264, H.265, VP9 codecs with CRF control' },
  'guide.presets': { zh: '预设方案', en: 'Presets' },
  'guide.presetsDesc': { zh: '一键切换：Web 优化、极致压缩、视频转 GIF、提取音频', en: 'Quick presets: Web Ready, Max Crush, GIF, Audio' },
  'guide.output': { zh: '输出与对比', en: 'Output & Compare' },
  'guide.compare': { zh: '前后对比', en: 'Before & After' },
  'guide.compareDesc': { zh: '图片可拖拽分割线，左右对比原图与处理结果', en: 'Drag the divider to compare original vs. result' },
  'guide.batchDownload': { zh: '批量下载', en: 'Batch Download' },
  'guide.batchDownloadDesc': { zh: '单文件逐一下载，或多文件打包为一个 ZIP', en: 'Download individually or as a single ZIP' },
  'guide.localProcessing': { zh: '纯本地处理', en: 'Local Processing' },
  'guide.localProcessingDesc': { zh: '基于 FFmpeg.wasm + Canvas API，不上传服务器', en: 'Powered by FFmpeg.wasm + Canvas API, no uploads' },

  // Store / toast messages
  'msg.cancelled': { zh: '已取消', en: 'Cancelled' },
  'msg.zipFailed': { zh: '打包下载失败', en: 'ZIP download failed' },
  'msg.processFailed': { zh: '处理失败', en: 'Processing failed' },
  'msg.workerError': { zh: 'Worker 错误', en: 'Worker error' },
  'msg.failedCreateWorker': { zh: '无法创建处理线程', en: 'Failed to create worker' },

  // Format names (keep labels international)
  'format.webp': { zh: 'WebP', en: 'WebP' },
  'format.jpeg': { zh: 'JPG', en: 'JPG' },
  'format.png': { zh: 'PNG', en: 'PNG' },
  'format.avif': { zh: 'AVIF', en: 'AVIF' },
  'format.mp4': { zh: 'MP4', en: 'MP4' },
  'format.webm': { zh: 'WebM', en: 'WebM' },
  'format.mov': { zh: 'MOV', en: 'MOV' },
  'format.avi': { zh: 'AVI', en: 'AVI' },
  'format.mkv': { zh: 'MKV', en: 'MKV' },
  'format.flv': { zh: 'FLV', en: 'FLV' },
  'format.wmv': { zh: 'WMV', en: 'WMV' },
  'format.m4v': { zh: 'M4V', en: 'M4V' },
  'format.ogv': { zh: 'OGV', en: 'OGV' },
};

export function useI18n() {
  const locale = useStore((s) => s.locale);
  const t = (key: string): string => {
    const entry = dict[key];
    if (!entry) return key;
    return entry[locale] || entry.zh;
  };
  return { t, locale };
}

export function getTranslation(key: string, locale: Locale): string {
  const entry = dict[key];
  if (!entry) return key;
  return entry[locale] || entry.zh;
}
