import { motion } from 'framer-motion';
import { Loader, Check, AlertTriangle, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useI18n } from '../i18n';

export function ProgressPanel() {
  const { t } = useI18n();
  const tasks = useStore((s) => s.tasks);
  const cancelAll = useStore((s) => s.cancelAll);
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const errorCount = tasks.filter((t) => t.status === 'error').length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-full p-8 pb-16"
    >
      <div className="max-w-xl mx-auto">
        {/* Summary */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-lg mb-1" style={{ fontFamily: 'var(--font-display)' }}>
              {t('progress.title')}
            </h2>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {completedCount}/{tasks.length} {t('progress.completed')}
              {errorCount > 0 && ` · ${errorCount} ${t('progress.errors')}`}
            </p>
          </div>
          <button
            onClick={cancelAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs cursor-pointer transition-colors"
            style={{ border: `1px solid var(--color-border)`, color: 'var(--color-text-secondary)' }}
          >
            <X size={13} /> {t('progress.cancel')}
          </button>
        </div>

        {/* Task list */}
        <div className="flex flex-col gap-3">
          {tasks.map((task, i) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-3 rounded-lg"
              style={{
                background: 'var(--color-bg-surface)',
                border: `1px solid ${task.status === 'error' ? 'var(--color-error)' : 'var(--color-border)'}`,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Status icon */}
                  {task.status === 'loading-ffmpeg' && (
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <Loader size={14} style={{ color: 'var(--color-accent)' }} />
                    </motion.div>
                  )}
                  {task.status === 'processing' && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                    >
                      <Loader size={14} style={{ color: 'var(--color-accent)' }} />
                    </motion.div>
                  )}
                  {task.status === 'completed' && (
                    <Check size={14} style={{ color: 'var(--color-success)' }} />
                  )}
                  {task.status === 'error' && (
                    <AlertTriangle size={14} style={{ color: 'var(--color-error)' }} />
                  )}
                  {task.status === 'pending' && (
                    <div className="w-3.5 h-3.5 rounded-full border" style={{ borderColor: 'var(--color-text-secondary)' }} />
                  )}

                  <span className="text-xs truncate">{task.fileName}</span>
                </div>

                <span
                  className="text-[10px] shrink-0 ml-2"
                  style={{
                    color: task.status === 'completed' ? 'var(--color-success)' : 'var(--color-text-secondary)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {task.status === 'loading-ffmpeg' ? `${t('progress.loadingEngine')} ${task.progress}%` :
                   task.status === 'processing' ? `${task.progress}%` :
                   task.status === 'completed' ? t('progress.done') :
                   task.status === 'error' ? task.error || t('progress.error') :
                   t('progress.queued')}
                </span>
              </div>

              {/* Progress bar */}
              {(task.status === 'processing' || task.status === 'loading-ffmpeg') && (
                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-deepest)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    animate={{ width: `${task.progress}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    style={{
                      background: 'var(--color-accent)',
                      boxShadow: '0 0 6px rgba(244,157,55,0.4)',
                    }}
                  />
                </div>
              )}

              {task.status === 'completed' && (
                <div className="h-1 rounded-full" style={{ background: 'var(--color-success)', opacity: 0.3 }} />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
