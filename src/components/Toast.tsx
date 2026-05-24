import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useStore } from '../store/useStore';

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const colorMap = {
  success: 'var(--color-success)',
  error: 'var(--color-error)',
  info: 'var(--color-cool)',
};

export function ToastContainer() {
  const toasts = useStore((s) => s.toasts);
  const dismissToast = useStore((s) => s.dismissToast);

  return (
    <div className="fixed bottom-6 right-6 z-[10000] flex flex-col-reverse gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = iconMap[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg pointer-events-auto shadow-lg"
              style={{
                background: 'var(--color-bg-raised)',
                border: `1px solid ${colorMap[toast.type]}33`,
                backdropFilter: 'blur(12px)',
              }}
            >
              <Icon size={14} style={{ color: colorMap[toast.type] }} />
              <span className="text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
                {toast.message}
              </span>
              <button
                onClick={() => dismissToast(toast.id)}
                className="ml-1 cursor-pointer"
              >
                <X size={12} style={{ color: 'var(--color-text-secondary)' }} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
