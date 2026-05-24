import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import type { OutputFormat } from '../types';

const IMAGE_FORMATS: { value: OutputFormat; label: string }[] = [
  { value: 'webp', label: 'WebP' },
  { value: 'jpeg', label: 'JPG' },
  { value: 'png', label: 'PNG' },
  { value: 'avif', label: 'AVIF' },
];

const VIDEO_FORMATS: { value: OutputFormat; label: string }[] = [
  { value: 'mp4', label: 'MP4' },
  { value: 'webm', label: 'WebM' },
  { value: 'mov', label: 'MOV' },
  { value: 'avi', label: 'AVI' },
  { value: 'mkv', label: 'MKV' },
  { value: 'flv', label: 'FLV' },
  { value: 'wmv', label: 'WMV' },
  { value: 'm4v', label: 'M4V' },
  { value: 'ogv', label: 'OGV' },
];

export function FormatSelector() {
  const globalSettings = useStore((s) => s.globalSettings);
  const files = useStore((s) => s.files);
  const updateGlobalSettings = useStore((s) => s.updateGlobalSettings);

  const hasImages = files.some((f) => f.type === 'image');
  const hasVideos = files.some((f) => f.type === 'video');

  const formats = useMemo(() => {
    if (hasImages && !hasVideos) return IMAGE_FORMATS;
    if (hasVideos && !hasImages) return VIDEO_FORMATS;
    return [...IMAGE_FORMATS, ...VIDEO_FORMATS];
  }, [hasImages, hasVideos]);

  // Auto-correct format if current selection is incompatible
  const currentFormat = useMemo(() => {
    const fmt = globalSettings.format;
    const validValues = formats.map((f) => f.value);
    if (!validValues.includes(fmt)) {
      return formats[0].value;
    }
    return fmt;
  }, [globalSettings.format, formats]);

  const handleSelect = (value: OutputFormat) => {
    const updates: Partial<typeof globalSettings> = { format: value };
    // AVIF performs best at lower quality
    if (value === 'avif' && globalSettings.quality > 65) {
      updates.quality = 60;
    }
    updateGlobalSettings(updates);
  };

  return (
    <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg" style={{ background: 'var(--color-bg-deepest)' }}>
      {formats.map((f) => (
        <button
          key={f.value}
          onClick={() => handleSelect(f.value)}
          className="py-1.5 text-xs rounded-md transition-all duration-200 cursor-pointer"
          style={{
            background: currentFormat === f.value ? 'var(--color-accent)' : 'transparent',
            color: currentFormat === f.value ? '#0C0C0E' : 'var(--color-text-secondary)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
