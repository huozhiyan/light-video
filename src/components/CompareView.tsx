import { useState, useRef, useCallback, useEffect } from 'react';
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
  // Reuse the thumbnail blob URL already created when the file was added, instead of creating a new one
  const originalUrl = files.find((f) => f.id === result.fileId)?.thumbnail || null;

  const getClientX = useCallback((e: MouseEvent | TouchEvent) => {
    if ('touches' in e) return e.touches[0].clientX;
    return e.clientX;
  }, []);

  const onPointerMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !containerRef.current) return;
      e.preventDefault();
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((getClientX(e) - rect.left) / rect.width) * 100;
      setSplit(Math.max(5, Math.min(95, x)));
    },
    [isDragging, getClientX]
  );

  const onPointerUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onPointerMove as (e: Event) => void);
      window.addEventListener('mouseup', onPointerUp);
      window.addEventListener('touchmove', onPointerMove as (e: Event) => void, { passive: false });
      window.addEventListener('touchend', onPointerUp);
      return () => {
        window.removeEventListener('mousemove', onPointerMove as (e: Event) => void);
        window.removeEventListener('mouseup', onPointerUp);
        window.removeEventListener('touchmove', onPointerMove as (e: Event) => void);
        window.removeEventListener('touchend', onPointerUp);
      };
    }
  }, [isDragging, onPointerMove, onPointerUp]);

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
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            {['mp4', 'webm'].includes(result.resultFormat) ? (
              <video src={result.url} controls className="max-w-full max-h-full rounded" />
            ) : (
              <>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  {result.resultFormat.toUpperCase()} 格式无法在浏览器中预览
                </p>
                <button
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = result.url;
                    a.download = result.fileName.replace(/\.[^.]+$/, '') + '_converted.' + result.resultFormat;
                    a.click();
                  }}
                  className="px-3 py-1.5 rounded text-xs font-medium cursor-pointer"
                  style={{ background: 'var(--color-accent)', color: '#0C0C0E', fontFamily: 'var(--font-mono)' }}
                >
                  下载文件
                </button>
              </>
            )}
          </div>
        )}

        {/* Draggable divider */}
        {result.type === 'image' && (
          <div
            className="absolute top-0 bottom-0 w-0.5 cursor-col-resize z-10 touch-none"
            style={{ left: `${split}%`, background: 'var(--color-accent)', boxShadow: '0 0 8px rgba(244,157,55,0.5)' }}
            onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); }}
            onTouchStart={(e) => { e.preventDefault(); setIsDragging(true); }}
          >
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 md:w-7 md:h-7 rounded-full flex items-center justify-center"
              style={{
                background: 'var(--color-accent)',
                boxShadow: '0 0 12px rgba(244,157,55,0.4)',
              }}
            >
              <GripVertical size={14} color="#0C0C0E" className="hidden md:block" />
              <GripVertical size={18} color="#0C0C0E" className="md:hidden" />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
