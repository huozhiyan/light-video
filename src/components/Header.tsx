import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Circle, Cpu, Sun, Moon } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useI18n } from '../i18n';

export function Header() {
  const { t } = useI18n();
  const files = useStore((s) => s.files);
  const isProcessing = useStore((s) => s.isProcessing);
  const clearFiles = useStore((s) => s.clearFiles);
  const theme = useStore((s) => s.theme);
  const locale = useStore((s) => s.locale);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const toggleLocale = useStore((s) => s.toggleLocale);
  const workerCount = useMemo(
    () => Math.max(1, navigator.hardwareConcurrency - 1 || 3),
    []
  );

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="flex items-center justify-between px-6 py-4 border-b shrink-0"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <div
        className="flex items-center gap-3 cursor-pointer group"
        onClick={clearFiles}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') clearFiles(); }}
      >
        <div className="relative w-7 h-7 rounded-full flex items-center justify-center transition-shadow duration-300 group-hover:shadow-lg"
          style={{
            background: `radial-gradient(circle, var(--color-accent) 0%, rgba(244,157,55,0.3) 100%)`,
            boxShadow: '0 0 12px rgba(244,157,55,0.3)',
          }}
        >
          <Circle size={12} fill="var(--color-bg-deepest)" stroke="none" />
        </div>
        <h1
          className="text-lg tracking-wide transition-opacity duration-200 group-hover:opacity-80"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        >
          Light<span style={{ color: 'var(--color-accent)' }}>Video</span>
        </h1>
      </div>

      <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer transition-colors hover:bg-opacity-10"
          style={{ background: 'var(--color-bg-raised)' }}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun size={13} style={{ color: 'var(--color-accent)' }} />
          ) : (
            <Moon size={13} style={{ color: 'var(--color-accent)' }} />
          )}
        </button>

        {/* Locale toggle */}
        <button
          onClick={toggleLocale}
          className="px-1.5 py-0.5 rounded text-[10px] font-medium cursor-pointer transition-colors"
          style={{
            background: 'var(--color-bg-raised)',
            color: 'var(--color-accent)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {locale === 'zh' ? 'EN' : '中'}
        </button>

        <div className="w-px h-4" style={{ background: 'var(--color-border)' }} />

        <div className="flex items-center gap-2">
          <Cpu size={13} />
          <span>{workerCount} {t('header.workers')}</span>
        </div>
        {files.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full"
              style={{
                background: isProcessing ? 'var(--color-accent)' : 'var(--color-success)',
                boxShadow: isProcessing
                  ? '0 0 6px var(--color-accent)'
                  : '0 0 6px var(--color-success)',
              }}
            />
            <span>{files.length} {t('header.files')}</span>
          </div>
        )}
      </div>
    </motion.header>
  );
}
