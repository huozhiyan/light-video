import { useStore } from './store/useStore';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { Sidebar } from './components/Sidebar';
import { FileGrid } from './components/FileGrid';
import { ProgressPanel } from './components/ProgressPanel';
import { ResultPanel } from './components/ResultPanel';
import { GuidePanel } from './components/GuidePanel';
import { ToastContainer } from './components/Toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const activeView = useStore((s) => s.activeView);
  const hasFiles = useStore((s) => s.files.length > 0);
  const mobileSidebarOpen = useStore((s) => s.mobileSidebarOpen);
  const closeMobileSidebar = useStore((s) => s.closeMobileSidebar);

  return (
    <div className="h-full flex flex-col relative z-10">
      <Header />
      <div className="flex-1 flex overflow-hidden md:gap-x-3 md:px-4 pb-4 md:pb-4">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/50 md:hidden"
                onClick={closeMobileSidebar}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed left-0 top-0 bottom-0 z-50 md:hidden"
              >
                <Sidebar mobile onClose={closeMobileSidebar} />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <main className="flex-1 overflow-y-auto relative">
          <div className="scanlines" />
          {(activeView === 'dropzone' || activeView === 'files') && (
            <div className={hasFiles ? 'min-h-full p-4 md:p-8 pb-16' : 'min-h-full flex flex-col items-center justify-center px-4 md:px-6 py-4 md:py-8'}>
              <div className={hasFiles ? '' : 'w-full max-w-2xl'}>
                <DropZone />
              </div>
              {!hasFiles && <GuidePanel />}
              {activeView === 'files' && <FileGrid />}
            </div>
          )}
          {activeView === 'progress' && <ProgressPanel />}
          {activeView === 'results' && <ResultPanel />}
        </main>
      </div>
      <div className="safelight-top" />
      <div className="safelight-bottom" />
      <div className="grain-overlay" />
      <ToastContainer />
    </div>
  );
}
