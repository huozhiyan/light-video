import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { useI18n } from '../i18n';
import { CompareView } from './CompareView';
import { DownloadBar } from './DownloadBar';
import { RotateCcw, AlertTriangle } from 'lucide-react';

export function ResultPanel() {
  const { t } = useI18n();
  const results = useStore((s) => s.results);
  const tasks = useStore((s) => s.tasks);
  const clearResults = useStore((s) => s.clearResults);

  const totalOriginal = results.reduce((s, r) => s + r.originalSize, 0);
  const totalResult = results.reduce((s, r) => s + r.resultSize, 0);
  const savings = results.length > 0 ? ((1 - totalResult / totalOriginal) * 100).toFixed(1) : '0';

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
              {results.length > 0 ? (
                <>{t('result.filesProcessed')} {results.length} {t('download.files')}
                  <span className="mx-2" style={{ color: 'var(--color-border)' }}>|</span>
                  <span style={{ color: 'var(--color-success)' }}>{t('result.saved')} {savings}%</span>
                </>
              ) : (
                <span style={{ color: 'var(--color-error)' }}>
                  <AlertTriangle size={12} className="inline mr-1" />
                  {t('result.allFailed')}
                </span>
              )}
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

        {/* Error list */}
        {results.length === 0 && tasks.some(t => t.status === 'error') && (
          <div className="mb-6 flex flex-col gap-2">
            {tasks.filter(x => x.status === 'error').map(task => (
              <div
                key={task.id}
                className="px-4 py-3 rounded-lg text-xs"
                style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-error)', color: 'var(--color-error)', fontFamily: 'var(--font-mono)' }}
              >
                {task.fileName}: {task.error || 'Error'}
              </div>
            ))}
          </div>
        )}

        {/* Compare views */}
        {results.length > 0 && (
          <div className="flex flex-col gap-6">
            {results.map((result) => (
              <CompareView key={result.taskId} result={result} />
            ))}
          </div>
        )}

        {/* Download bar */}
        {results.length > 0 && <DownloadBar />}
      </div>
    </motion.div>
  );
}
