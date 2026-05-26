import { Globe, Zap, Copy, Film, Music, Gauge } from 'lucide-react';
import type { Preset } from '../types';
import { useStore } from '../store/useStore';
import { useI18n } from '../i18n';

const PRESET_CONFIGS: { name: Preset['name']; labelKey: string; descKey: string; icon: string; settings: Preset['settings']; kind: 'video' | 'all' }[] = [
  { name: 'turbo', labelKey: 'preset.turbo', descKey: 'preset.turboDesc', icon: 'Gauge', kind: 'video', settings: { codec: 'h264', quality: 60, resolution: { width: 640, height: 360 } } },
  { name: 'web-optimized', labelKey: 'preset.webOptimized', descKey: 'preset.webOptimizedDesc', icon: 'Globe', kind: 'video', settings: { codec: 'h264', quality: 70, resolution: { width: 1280, height: 720 } } },
  { name: 'extreme-compress', labelKey: 'preset.extremeCompress', descKey: 'preset.extremeCompressDesc', icon: 'Zap', kind: 'video', settings: { codec: 'h265', quality: 40, resolution: { width: 854, height: 480 } } },
  { name: 'lossless', labelKey: 'preset.lossless', descKey: 'preset.losslessDesc', icon: 'Copy', kind: 'all', settings: { codec: 'copy', quality: 100 } },
  { name: 'gif-extract', labelKey: 'preset.gifExtract', descKey: 'preset.gifExtractDesc', icon: 'Film', kind: 'video', settings: { format: 'gif', fps: 10, audioCodec: 'copy', resolution: { width: 854, height: 480 } } },
  { name: 'audio-extract', labelKey: 'preset.audioExtract', descKey: 'preset.audioExtractDesc', icon: 'Music', kind: 'video', settings: { format: 'm4a', audioCodec: 'aac', audioBitrate: '192k' } },
];

const iconMap: Record<string, typeof Globe> = { Globe, Zap, Copy, Film, Music, Gauge };

export function PresetButtons() {
  const { t } = useI18n();
  const globalSettings = useStore().globalSettings;
  const files = useStore().files;
  const updateGlobalSettings = useStore().updateGlobalSettings;

  const hasVideos = files.some(f => f.type === 'video');

  const applyPreset = (preset: Preset) => {
    updateGlobalSettings({ ...preset.settings, preset: preset.name });
  };

  // Only show video presets when video files are loaded
  const visiblePresets = PRESET_CONFIGS.filter(p => p.kind === 'all' || hasVideos);

  return (
    <div>
      <span className="text-xs tracking-widest uppercase" style={{ color: 'var(--color-text-secondary)' }}>
        {t('sidebar.presets')}
      </span>
      <div className="flex flex-col gap-1 mt-2">
        {visiblePresets.map((p) => {
          const Icon = iconMap[p.icon] || Zap;
          const isActive = globalSettings.preset === p.name;
          return (
            <button
              key={p.name}
              onClick={() => applyPreset({ name: p.name, label: '', description: '', icon: '', settings: p.settings })}
              className="flex items-center gap-3 px-2.5 py-2 rounded-md text-left transition-all duration-200 cursor-pointer group"
              style={{
                background: isActive ? 'var(--color-bg-raised)' : 'transparent',
                border: `1px solid ${isActive ? 'var(--color-accent)' : 'transparent'}`,
              }}
            >
              <Icon
                size={15}
                style={{
                  color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                  transition: 'color 0.2s',
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs" style={{ color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                  {t(p.labelKey)}
                </div>
                <div className="text-[10px] truncate" style={{ color: 'var(--color-text-secondary)', opacity: 0.6 }}>
                  {t(p.descKey)}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
