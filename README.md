# LightVideo

A browser-based media processing tool. Compress and convert images & videos entirely locally — no uploads, no servers.

**Website:** [Live Demo](https://\<your-username\>.github.io/light-video)

## Features

- **Image Processing** — Convert between JPG, PNG, WebP, AVIF; adjust quality and resolution
- **Video Processing** — Convert between MP4, WebM, MOV, AVI, MKV, and more; powered by FFmpeg.wasm
- **Presets** — One-click: Web Ready, Max Crush, Video → GIF, Extract Audio
- **Before/After Compare** — Drag-to-split comparison for images
- **Batch Processing** — Process multiple files; download individually or as ZIP
- **Dark/Light Theme** — Toggle between darkroom-inspired dark mode and clean light mode
- **中文 / English** — Full Chinese and English interface
- **100% Local** — All processing runs in your browser via Web Workers

## Tech Stack

React 19 · TypeScript · Vite 5 · Tailwind CSS 4 · Zustand · Framer Motion · FFmpeg.wasm

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages

1. Fork or create a repo named `light-video` on GitHub
2. Update `homepage` in `package.json` and `base` in `vite.config.ts` with your repo name
3. Push to `main` branch — GitHub Actions will auto-deploy
4. Or manually: `npm run deploy`

## License

MIT
