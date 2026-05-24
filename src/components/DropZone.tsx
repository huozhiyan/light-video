import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Image, Film } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useI18n } from '../i18n';

export function DropZone() {
  const { t } = useI18n();
  const addFiles = useStore((s) => s.addFiles);
  const files = useStore((s) => s.files);
  const hasFiles = files.length > 0;

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length > 0) addFiles(accepted);
    },
    [addFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.bmp', '.tiff'],
      'video/*': ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v', '.ogv', '.3gp'],
    },
  });

  return (
    <AnimatePresence mode="wait">
      {!hasFiles && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97, y: -10 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div
            {...getRootProps()}
            className="relative rounded-2xl cursor-pointer overflow-hidden"
            style={{
              background: 'var(--color-bg-surface)',
              border: `1px dashed ${isDragActive ? 'var(--color-accent)' : 'var(--color-border)'}`,
              transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
              boxShadow: isDragActive
                ? '0 0 40px rgba(244,157,55,0.1), inset 0 0 80px rgba(244,157,55,0.03)'
                : 'none',
            }}
          >
            <input {...getInputProps()} />

            {/* Light table glow */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(244,157,55,0.15) 0%, transparent 70%)',
              }}
            />

            <div className="relative flex flex-col items-center justify-center py-12 px-8 gap-4">
              <motion.div
                animate={isDragActive ? { scale: 1.08, y: -4 } : { scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background: 'var(--color-bg-raised)',
                  boxShadow: isDragActive
                    ? '0 0 30px rgba(244,157,55,0.2)'
                    : '0 4px 20px rgba(0,0,0,0.3)',
                }}
              >
                <Upload size={32} style={{ color: isDragActive ? 'var(--color-accent)' : 'var(--color-text-secondary)' }} />
              </motion.div>

              <div className="text-center">
                <p className="text-base mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
                  {isDragActive ? t('dropzone.dropHere') : t('dropzone.dropMedia')}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('dropzone.hint')}
                </p>
              </div>

              <div className="flex items-center gap-6 mt-2">
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  <Image size={14} />
                  <span>JPG / PNG / WebP / AVIF</span>
                </div>
                <div className="w-px h-4" style={{ background: 'var(--color-border)' }} />
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  <Film size={14} />
                  <span>{t('dropzone.formats')}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
