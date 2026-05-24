import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { useI18n } from '../i18n';
import { CompareView } from './CompareView';
import { DownloadBar } from './DownloadBar';
import { RotateCcw } from 'lucide-react';

export function ResultPanel() {
  const { t } = useI18n();
  const results = useStore((s) => s.results);
  const clearResults = useStore((s) => s.clearResults);

  if (results.length === 0) return null;

  const totalOriginal = results.reduce((s, r) => s + r.originalSize, 0);
  const totalResult = results.reduce((s, r) => s + r.resultSize, 0);
  const savings = ((1 - totalResult / totalOriginal) * 100).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-full p-8 pb-16"
    >
      <div className="max-w-4xl mx-auto">
        {/* Summary header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-lg mb-1" style={{ fontFamily: 'var(--font-display)' }}>
              {t('result.title')}
            </h2>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {t('result.filesProcessed')} {results.length} {t('download.files')}
              <span className="mx-2" style={{ color: 'var(--color-border)' }}>|</span>
              <span style={{ color: 'var(--color-success)' }}>{t('result.saved')} {savings}%</span>
            </p>
          </div>
          <button
            onClick={clearResults}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs cursor-pointer transition-colors"
            style={{ border: `1px solid var(--color-border)`, color: 'var(--color-text-secondary)' }}
          >
            <RotateCcw size={13} /> {t('result.newBatch')}
          </button>
        </div>

        {/* Compare views */}
        <div className="flex flex-col gap-6">
          {results.map((result) => (
            <CompareView key={result.taskId} result={result} />
          ))}
        </div>

        {/* Download bar */}
        <DownloadBar />
      </div>
    </motion.div>
  );
}
