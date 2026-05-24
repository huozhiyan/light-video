import { useStore } from './store/useStore';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { Sidebar } from './components/Sidebar';
import { FileGrid } from './components/FileGrid';
import { ProgressPanel } from './components/ProgressPanel';
import { ResultPanel } from './components/ResultPanel';
import { GuidePanel } from './components/GuidePanel';
import { ToastContainer } from './components/Toast';

export default function App() {
  const activeView = useStore((s) => s.activeView);
  const hasFiles = useStore((s) => s.files.length > 0);

  return (
    <div className="h-full flex flex-col relative z-10">
      <Header />
      <div className="flex-1 flex overflow-hidden gap-x-3 px-4 pb-4">
        <Sidebar />
        <main className="flex-1 overflow-y-auto relative">
          <div className="scanlines" />
          {(activeView === 'dropzone' || activeView === 'files') && (
            <div className={hasFiles ? 'min-h-full p-8 pb-16' : 'min-h-full flex flex-col items-center justify-center px-6 py-8'}>
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
