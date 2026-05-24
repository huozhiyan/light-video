import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { useI18n } from '../i18n';

const CODECS = ['h264', 'h265', 'vp9', 'copy'];
const AUDIO_CODECS = ['aac', 'mp3', 'copy'];
const AUDIO_BITRATES = ['128k', '192k', '256k', '320k'];

export function AdvancedOptions() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const settings = useStore((s) => s.globalSettings);
  const update = useStore((s) => s.updateGlobalSettings);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs tracking-widest uppercase cursor-pointer"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {t('sidebar.advanced')}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
              {/* Video Codec */}
              <div>
                <span className="text-[10px] uppercase" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('sidebar.videoCodec')}
                </span>
                <div className="grid grid-cols-4 gap-1 mt-1.5">
                  {CODECS.map((c) => (
                    <button
                      key={c}
                      onClick={() => update({ codec: c })}
                      className="py-1 text-[10px] rounded transition-colors cursor-pointer"
                      style={{
                        background: settings.codec === c ? 'var(--color-accent)' : 'var(--color-bg-deepest)',
                        color: settings.codec === c ? '#0C0C0E' : 'var(--color-text-secondary)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Audio Codec */}
              <div>
                <span className="text-[10px] uppercase" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('sidebar.audioCodec')}
                </span>
                <div className="grid grid-cols-3 gap-1 mt-1.5">
                  {AUDIO_CODECS.map((c) => (
                    <button
                      key={c}
                      onClick={() => update({ audioCodec: c })}
                      className="py-1 text-[10px] rounded transition-colors cursor-pointer"
                      style={{
                        background: settings.audioCodec === c ? 'var(--color-accent)' : 'var(--color-bg-deepest)',
                        color: settings.audioCodec === c ? '#0C0C0E' : 'var(--color-text-secondary)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Audio Bitrate */}
              <div>
                <span className="text-[10px] uppercase" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('sidebar.audioBitrate')}
                </span>
                <div className="grid grid-cols-4 gap-1 mt-1.5">
                  {AUDIO_BITRATES.map((b) => (
                    <button
                      key={b}
                      onClick={() => update({ audioBitrate: b })}
                      className="py-1 text-[10px] rounded transition-colors cursor-pointer"
                      style={{
                        background: settings.audioBitrate === b ? 'var(--color-accent)' : 'var(--color-bg-deepest)',
                        color: settings.audioBitrate === b ? '#0C0C0E' : 'var(--color-text-secondary)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
