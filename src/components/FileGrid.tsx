import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { useI18n } from '../i18n';
import { FileCard } from './FileCard';
import { Plus } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

export function FileGrid() {
  const { t } = useI18n();
  const files = useStore((s) => s.files);
  const addFiles = useStore((s) => s.addFiles);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (accepted) => { if (accepted.length > 0) addFiles(accepted); },
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.bmp', '.tiff'],
      'video/*': ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v', '.ogv', '.3gp'],
    },
    noClick: true,
    noKeyboard: true,
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="mt-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs tracking-widest uppercase" style={{ color: 'var(--color-text-secondary)' }}>
          {t('file.fileList')} <span style={{ color: 'var(--color-accent)' }}>({files.length})</span>
        </h2>
      </div>

      <div {...getRootProps()} className="relative">
        <input {...getInputProps()} />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          <AnimatePresence>
            {files.map((file, i) => (
              <FileCard key={file.id} file={file} index={i} />
            ))}
          </AnimatePresence>

          {/* Add more button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: files.length * 0.03 }}
            onClick={(e) => {
              e.stopPropagation();
              const input = document.createElement('input');
              input.type = 'file';
              input.multiple = true;
              input.accept = 'image/*,video/*,.mkv,.flv,.wmv,.m4v,.ogv,.3gp';
              input.onchange = (ev) => {
                const fileList = (ev.target as HTMLInputElement).files;
                if (fileList) addFiles(Array.from(fileList));
              };
              input.click();
            }}
            className="aspect-[4/3] rounded-xl border border-dashed flex flex-col items-center justify-center gap-2 transition-all duration-300 cursor-pointer hover:scale-[1.02]"
            style={{
              borderColor: isDragActive ? 'var(--color-accent)' : 'var(--color-border)',
              background: isDragActive ? 'rgba(244,157,55,0.05)' : 'var(--color-bg-surface)',
            }}
          >
            <Plus size={22} style={{ color: 'var(--color-text-secondary)' }} />
            <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
              {t('file.addMore')}
            </span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
