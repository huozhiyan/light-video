import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  Image, Film, Shuffle, Sliders, FileImage, Monitor,
  Zap, Package, Eye, Download,
} from 'lucide-react';
import { useI18n } from '../i18n';

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.4 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0, 0, 0.2, 1] },
  },
};

export function GuidePanel() {
  const { t } = useI18n();

  const sections = useMemo(() => [
    {
      title: t('guide.import'),
      icon: Package,
      items: [
        { icon: Image, label: t('guide.imageFormats'), desc: t('guide.imageFormatsDesc') },
        { icon: Film, label: t('guide.videoFormats'), desc: t('guide.videoFormatsDesc') },
        { icon: Monitor, label: t('guide.dragDrop'), desc: t('guide.dragDropDesc') },
      ],
    },
    {
      title: t('guide.imageProcessing'),
      icon: FileImage,
      items: [
        { icon: Shuffle, label: t('guide.imageConvert'), desc: t('guide.imageConvertDesc') },
        { icon: Sliders, label: t('guide.imageCompress'), desc: t('guide.imageCompressDesc') },
        { icon: Eye, label: t('guide.imageResize'), desc: t('guide.imageResizeDesc') },
      ],
    },
    {
      title: t('guide.videoProcessing'),
      icon: Film,
      items: [
        { icon: Shuffle, label: t('guide.videoConvert'), desc: t('guide.videoConvertDesc') },
        { icon: Sliders, label: t('guide.videoCodecQuality'), desc: t('guide.videoCodecQualityDesc') },
        { icon: Zap, label: t('guide.presets'), desc: t('guide.presetsDesc') },
      ],
    },
    {
      title: t('guide.output'),
      icon: Download,
      items: [
        { icon: Eye, label: t('guide.compare'), desc: t('guide.compareDesc') },
        { icon: Package, label: t('guide.batchDownload'), desc: t('guide.batchDownloadDesc') },
        { icon: Zap, label: t('guide.localProcessing'), desc: t('guide.localProcessingDesc') },
      ],
    },
  ], [t]);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-3xl w-full mt-4 md:mt-6 pb-8"
    >
      {/* Divider above guide */}
      <motion.div
        variants={item}
        className="flex items-center gap-3 md:gap-4 mb-10 md:mb-14"
      >
        <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
        <h2
          className="text-lg md:text-xl tracking-wide shrink-0"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        >
          {t('guide.title')}
        </h2>
        <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
      </motion.div>

      {/* Subtitle */}
      <motion.p
        variants={item}
        className="text-center mb-12 text-sm"
        style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}
      >
        {t('guide.subtitle')}
      </motion.p>

      {/* Feature grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
        {sections.map((section) => {
          const SectionIcon = section.icon;
          return (
            <motion.div
              key={section.title}
              variants={item}
              className="rounded-xl p-5 md:p-7 transition-shadow duration-300 hover:shadow-lg"
              style={{
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(244,157,55,0.12)' }}
                >
                  <SectionIcon size={18} style={{ color: 'var(--color-accent)' }} />
                </div>
                <h3
                  className="text-base tracking-wide"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
                >
                  {section.title}
                </h3>
                <div className="flex-1 h-px ml-2" style={{ background: 'var(--color-border)' }} />
              </div>

              <div className="flex flex-col gap-5">
                {section.items.map((it) => {
                  const ItIcon = it.icon;
                  return (
                    <div key={it.label} className="flex items-start gap-3.5">
                      <ItIcon
                        size={14}
                        className="mt-0.5 shrink-0"
                        style={{ color: 'var(--color-text-secondary)' }}
                      />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                          {it.label}
                        </span>
                        <span
                          className="text-xs leading-relaxed"
                          style={{ color: 'var(--color-text-secondary)', opacity: 0.65, fontFamily: 'var(--font-mono)' }}
                        >
                          {it.desc}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
