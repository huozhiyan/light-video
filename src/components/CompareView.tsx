import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { GripVertical } from 'lucide-react';
import type { ProcessingResult } from '../types';
import { useStore } from '../store/useStore';
import { useI18n } from '../i18n';
import { formatBytes, formatLabel } from '../utils/format';

interface Props {
  result: ProcessingResult;
}

export function CompareView({ result }: Props) {
  const { t } = useI18n();
  const [split, setSplit] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const files = useStore((s) => s.files);
  const originalFile = files.find((f) => f.id === result.fileId)?.file;

  const originalUrl = useMemo(() => {
    if (originalFile) return URL.createObjectURL(originalFile);
    return null;
  }, [originalFile]);

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      setSplit(Math.max(5, Math.min(95, x)));
    },
    [isDragging]
  );

  const onMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
    }
  }, [isDragging, onMouseMove, onMouseUp]);

  const savings = ((1 - result.resultSize / result.originalSize) * 100).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--color-bg-surface)', border: `1px solid var(--color-border)` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <span className="text-xs truncate max-w-[60%]">{result.fileName}</span>
        <div className="flex items-center gap-3 text-[10px]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>
          <span>{formatLabel(result.originalFormat)} → {formatLabel(result.resultFormat)}</span>
          <span>{formatBytes(result.originalSize)} → {formatBytes(result.resultSize)}</span>
          <span style={{
            color: Number(savings) > 0 ? 'var(--color-success)' : 'var(--color-error)',
          }}>
            {Number(savings) > 0 ? '-' : '+'}{Math.abs(Number(savings))}%
          </span>
        </div>
      </div>

      {/* Comparison viewer */}
      <div
        ref={containerRef}
        className="relative aspect-video select-none overflow-hidden"
        style={{ background: 'var(--color-bg-deepest)', cursor: isDragging ? 'col-resize' : 'default' }}
      >
        {result.type === 'image' ? (
          <>
            {/* Before (left side) */}
            <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}>
              {originalUrl && (
                <img
                  src={originalUrl}
                  alt="Original"
                  className="w-full h-full object-contain"
                />
              )}
              <span className="absolute top-3 left-3 text-[10px] px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(0,0,0,0.6)', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                {t('compare.original')}
              </span>
            </div>

            {/* After (right side) */}
            <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${split}%)` }}>
              <img
                src={result.url}
                alt="Result"
                className="w-full h-full object-contain"
              />
              <span className="absolute top-3 right-3 text-[10px] px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(244,157,55,0.3)', color: 'var(--color-accent-glow)', fontFamily: 'var(--font-mono)' }}>
                {result.resultFormat.toUpperCase()}
              </span>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <video src={result.url} controls className="max-w-full max-h-full rounded" />
          </div>
        )}

        {/* Draggable divider */}
        {result.type === 'image' && (
          <div
            className="absolute top-0 bottom-0 w-0.5 cursor-col-resize z-10"
            style={{ left: `${split}%`, background: 'var(--color-accent)', boxShadow: '0 0 8px rgba(244,157,55,0.5)' }}
            onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); }}
          >
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center"
              style={{
                background: 'var(--color-accent)',
                boxShadow: '0 0 12px rgba(244,157,55,0.4)',
              }}
            >
              <GripVertical size={14} color="#0C0C0E" />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
