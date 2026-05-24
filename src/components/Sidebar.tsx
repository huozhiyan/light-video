import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { useI18n } from '../i18n';
import { FormatSelector } from './FormatSelector';
import { QualitySlider } from './QualitySlider';
import { PresetButtons } from './PresetButtons';
import { AdvancedOptions } from './AdvancedOptions';
import { ResolutionInput } from './ResolutionInput';
import { Play, Square } from 'lucide-react';

export function Sidebar() {
  const { t } = useI18n();
  const files = useStore((s) => s.files);
  const isProcessing = useStore((s) => s.isProcessing);
  const startProcessing = useStore((s) => s.startProcessing);
  const cancelAll = useStore((s) => s.cancelAll);
  const hasFiles = files.length > 0;

  if (!hasFiles) return null;

  return (
    <motion.aside
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
      className="w-[300px] shrink-0 overflow-y-auto pl-7 pr-5 py-6 flex flex-col gap-6"
      style={{ background: 'var(--color-bg-surface)' }}
    >
      <div>
        <h2
          className="text-xs tracking-widest uppercase mb-3"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {t('sidebar.outputSettings')}
        </h2>
        <FormatSelector />
      </div>

      <QualitySlider />

      <ResolutionInput />

      <PresetButtons />

      <AdvancedOptions />

      <div className="mt-auto pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        {!isProcessing ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={startProcessing}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium tracking-wide cursor-pointer"
            style={{
              background: 'var(--color-accent)',
              color: '#0C0C0E',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <Play size={16} />
            {t('sidebar.start')}
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={cancelAll}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium tracking-wide cursor-pointer"
            style={{
              background: 'var(--color-error)',
              color: '#E6DDD0',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <Square size={16} />
            {t('sidebar.cancel')}
          </motion.button>
        )}
      </div>
    </motion.aside>
  );
}
