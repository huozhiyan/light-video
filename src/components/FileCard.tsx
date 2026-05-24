import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Image, Film } from 'lucide-react';
import type { MediaFile } from '../types';
import { useStore } from '../store/useStore';
import { useI18n } from '../i18n';
import { formatBytes, formatLabel } from '../utils/format';

interface Props {
  file: MediaFile;
  index: number;
}

export function FileCard({ file, index }: Props) {
  const { t } = useI18n();
  const removeFile = useStore((s) => s.removeFile);
  const selectFile = useStore((s) => s.selectFile);
  const results = useStore((s) => s.results);
  const [isHovered, setIsHovered] = useState(false);

  const result = results.find((r) => r.fileId === file.id);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: 'easeOut' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => selectFile(file.id)}
      className="relative group rounded-xl overflow-hidden cursor-pointer transition-shadow duration-300"
      style={{
        background: 'var(--color-bg-surface)',
        border: `1px solid var(--color-border)`,
        boxShadow: isHovered
          ? '0 0 20px rgba(244,157,55,0.08), 0 4px 16px rgba(0,0,0,0.3)'
          : '0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      {/* Thumbnail */}
      <div className="aspect-[4/3] relative overflow-hidden" style={{ background: 'var(--color-bg-deepest)' }}>
        {file.thumbnail ? (
          <img
            src={file.thumbnail}
            alt={file.file.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {file.type === 'video' ? (
              <Film size={28} style={{ color: 'var(--color-text-secondary)', opacity: 0.4 }} />
            ) : (
              <Image size={28} style={{ color: 'var(--color-text-secondary)', opacity: 0.4 }} />
            )}
          </div>
        )}

        {/* Hover overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(12,12,14,0.85) 0%, transparent 50%)',
          }}
        />

        {/* Type badge */}
        <div
          className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider"
          style={{
            background: file.type === 'video' ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.5)',
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-mono)',
            backdropFilter: 'blur(4px)',
          }}
        >
          {file.type === 'video' ? t('file.video') : t('file.image')}
        </div>

        {/* Remove button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isHovered ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
          onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        >
          <X size={12} style={{ color: 'var(--color-text-secondary)' }} />
        </motion.button>
      </div>

      {/* Info bar */}
      <div className="p-2.5 flex flex-col gap-1">
        <p className="text-xs truncate" style={{ color: 'var(--color-text-primary)' }}>
          {file.file.name}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
            {formatBytes(file.file.size)}
          </span>
          <span className="text-[10px]" style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>
            {formatLabel(file.settings.format)}
          </span>
        </div>

        {/* Result badge */}
        {result && (
          <div className="mt-1 flex items-center gap-2 text-[10px]" style={{ fontFamily: 'var(--font-mono)' }}>
            <span style={{ color: 'var(--color-cool)' }}>
              {formatBytes(result.resultSize)}
            </span>
            <span style={{ color: 'var(--color-text-secondary)', opacity: 0.5 }}>
              ({((1 - result.resultSize / result.originalSize) * 100).toFixed(0)}%)
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
