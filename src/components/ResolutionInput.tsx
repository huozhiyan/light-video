import { useState } from 'react';
import { useStore } from '../store/useStore';
import { useI18n } from '../i18n';

export function ResolutionInput() {
  const { t } = useI18n();
  const settings = useStore((s) => s.globalSettings);
  const updateGlobalSettings = useStore((s) => s.updateGlobalSettings);
  const [w, setW] = useState(settings.resolution?.width?.toString() || '');
  const [h, setH] = useState(settings.resolution?.height?.toString() || '');

  const applyResolution = () => {
    const width = parseInt(w);
    const height = parseInt(h);
    if (width > 0 && height > 0) {
      updateGlobalSettings({ resolution: { width, height } });
    } else if (!w && !h) {
      updateGlobalSettings({ resolution: null });
    }
  };

  return (
    <div>
      <span className="text-xs tracking-widest uppercase" style={{ color: 'var(--color-text-secondary)' }}>
        {t('sidebar.resolution')}
      </span>
      <div className="flex items-center gap-2 mt-2">
        <input
          type="number"
          placeholder="W"
          value={w}
          onChange={(e) => setW(e.target.value)}
          onBlur={applyResolution}
          className="w-full px-2 py-1.5 rounded-md text-xs outline-none transition-colors"
          style={{
            background: 'var(--color-bg-deepest)',
            color: 'var(--color-text-primary)',
            border: `1px solid var(--color-border)`,
            fontFamily: 'var(--font-mono)',
          }}
        />
        <span style={{ color: 'var(--color-text-secondary)' }}>x</span>
        <input
          type="number"
          placeholder="H"
          value={h}
          onChange={(e) => setH(e.target.value)}
          onBlur={applyResolution}
          className="w-full px-2 py-1.5 rounded-md text-xs outline-none transition-colors"
          style={{
            background: 'var(--color-bg-deepest)',
            color: 'var(--color-text-primary)',
            border: `1px solid var(--color-border)`,
            fontFamily: 'var(--font-mono)',
          }}
        />
      </div>
      <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-secondary)' }}>
        {t('sidebar.resolutionHint')}
      </p>
    </div>
  );
}
