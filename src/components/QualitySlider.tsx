import { useStore } from '../store/useStore';
import { useI18n } from '../i18n';

const MARKS = [0, 20, 40, 60, 80, 100];

export function QualitySlider() {
  const { t } = useI18n();
  const quality = useStore((s) => s.globalSettings.quality);
  const format = useStore((s) => s.globalSettings.format);
  const updateGlobalSettings = useStore((s) => s.updateGlobalSettings);
  const isPNG = format === 'png';

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs tracking-widest uppercase" style={{ color: 'var(--color-text-secondary)' }}>
          {t('sidebar.quality')}
        </span>
        <span
          className="text-xs"
          style={{
            color: isPNG ? 'var(--color-text-secondary)' : 'var(--color-accent)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {isPNG ? t('quality.lossless') : `${quality}%`}
        </span>
      </div>

      {isPNG ? (
        <p className="text-[10px] leading-relaxed" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>
          {t('quality.pngHint')}
        </p>
      ) : (
        <>
          <div className="relative">
            <div className="h-1.5 rounded-full" style={{ background: 'var(--color-bg-deepest)' }}>
              <div
                className="h-full rounded-full transition-all duration-150"
                style={{
                  width: `${quality}%`,
                  background: `linear-gradient(90deg, var(--color-accent), var(--color-accent-glow))`,
                }}
              />
            </div>
            <div className="flex justify-between mt-1.5 px-0.5">
              {MARKS.map((m) => (
                <span
                  key={m}
                  className="text-[10px] cursor-pointer hover:opacity-100 transition-opacity"
                  style={{
                    color: 'var(--color-text-secondary)',
                    fontFamily: 'var(--font-mono)',
                    opacity: quality >= m ? 0.6 : 0.3,
                  }}
                  onClick={() => updateGlobalSettings({ quality: m })}
                >
                  {m}
                </span>
              ))}
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={quality}
              onChange={(e) => updateGlobalSettings({ quality: Number(e.target.value) })}
              className="absolute inset-0 w-full h-6 opacity-0 cursor-pointer"
            />
          </div>
          {format === 'avif' && (
            <p className="text-[10px] mt-1.5 leading-relaxed" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>
              {t('quality.avifHint')}
            </p>
          )}
        </>
      )}
    </div>
  );
}
