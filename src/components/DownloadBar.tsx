import { motion } from 'framer-motion';
import { Download, Package } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useI18n } from '../i18n';
import { formatBytes } from '../utils/format';

export function DownloadBar() {
  const { t } = useI18n();
  const results = useStore((s) => s.results);
  const downloadAll = useStore((s) => s.downloadAll);

  if (results.length === 0) return null;

  const totalSize = results.reduce((s, r) => s + r.resultSize, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="mt-8 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0 justify-between"
      style={{ background: 'var(--color-bg-surface)', border: `1px solid var(--color-border)` }}
    >
      <div>
        <p className="text-sm" style={{ fontFamily: 'var(--font-display)' }}>
          {t('download.ready')}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
          {results.length} {t('download.files')} · {formatBytes(totalSize)}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {results.map((r) => (
          <DownloadButton key={r.taskId} taskId={r.taskId} />
        ))}
        {results.length > 1 && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={downloadAll}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer"
            style={{
              background: 'var(--color-accent)',
              color: '#0C0C0E',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <Package size={16} />
            {t('download.zipAll')}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

function DownloadButton({ taskId }: { taskId: string }) {
  const downloadOne = useStore((s) => s.downloadOne);

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => downloadOne(taskId)}
      className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer"
      style={{ background: 'var(--color-bg-raised)', border: `1px solid var(--color-border)` }}
      aria-label="Download file"
    >
      <Download size={15} style={{ color: 'var(--color-accent)' }} />
    </motion.button>
  );
}
