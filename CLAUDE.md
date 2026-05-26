# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # TypeScript check + Vite production build
npm run deploy   # Build + push dist/ to gh-pages branch
npm run preview  # Preview production build locally
```

## Architecture

### Tech Stack
React 19 + TypeScript + Vite 5 + Tailwind CSS 4 + Zustand + Framer Motion + FFmpeg.wasm

### Key Architecture Decisions

**Video processing runs on the main thread, NOT in a Web Worker.**
FFmpeg.wasm v0.12.x creates its own internal Worker. Nesting that inside our Worker caused "Script at CDN URL cannot be accessed from origin" errors because browser security blocks cross-origin Worker creation. Solution: import FFmpeg from npm (`import { FFmpeg } from '@ffmpeg/ffmpeg'`), let Vite bundle the class and its worker.js. The auto-bundled worker.js is same-origin, so Worker creation succeeds.

**FFmpeg core files are served from `public/ffmpeg/`** (gitignored, downloaded at setup).
The WASM binary (~32MB) and JS glue (~112KB) must be same-origin. Downloaded from `cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.9/dist/esm/` into `public/ffmpeg/`. Vite copies public/ to dist/ automatically.

**Image processing uses Canvas API in Web Workers** (`src/workers/image.worker.ts`).
Workers are created per-file, process in parallel (thread pool = `navigator.hardwareConcurrency - 1`).

**`resolve.conditions` must exclude `'node'` for browser-only packages.**
`@ffmpeg/ffmpeg` package.json has `"node": "./dist/esm/empty.mjs"` which throws on import. Vite config must set `resolve.conditions: ['browser', 'import', 'module', 'default']` to match the browser ESM build.

### State Management (Zustand)

**Global vs per-file settings sync is selective by type:**
- `updateGlobalSettings()` syncs only compatible fields: `codec/fps/audioCodec/audioBitrate` → video files only; `quality/resolution` → all files; `format` → checked for type compatibility
- `updateFileSettings()` validates format compatibility before applying
- Processing reads `file.settings`, not `globalSettings` — changes must be synced before processing starts

**Cancellation uses a module-level `_cancelToken` flag** checked in `processImagesInParallel` worker loop and `processVideo` before exec. `cancelAll()` sets the flag and marks pending tasks as errors.

### FFmpeg Argument Construction

**GIF output requires a completely different code path:**
- No standard video codec (libx264/h265) — GIF muxer rejects them
- Must use palette-based encoding: `-vf "fps=N,scale=...,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse"`
- Must force single video stream: `-map 0:v:0 -an`
- No audio codec args allowed

**Resolution scaling must force even dimensions:**
`force_divisible_by=2` on the scale filter prevents H.264 encoder errors when auto-rotation or aspect-ratio scaling produces odd pixel dimensions (e.g., 203x360).

**Sream copy (`-c:v copy -c:a copy`) cannot use `-vf` or `-r`** — skip filters and fps entirely.

### Blob URL Lifecycle

**Never create blob URLs in useMemo with useEffect cleanup** — React StrictMode double-invokes the cleanup, revoking the URL before the component renders. Instead:
- Reuse existing blob URLs (e.g., the `thumbnail` URL created when files are added)
- Or use useRef to track and manually manage the lifecycle in the useMemo itself

**`URL.createObjectURL(file)` for File objects** is valid until explicitly revoked. The File's underlying data persists as long as the File reference exists.

### Theming

CSS `data-theme="dark|light"` attribute on `<html>`. All components use `var(--color-xxx)` for colors. Theme toggle in Header sets the attribute + persists to localStorage. Initial value set in `main.tsx` before React mounts to avoid flash.

### i18n

Flat key-value dictionary in `src/i18n.ts` with `zh`/`en` translations. `useI18n()` hook returns `{ t, locale }`. Locale persisted to localStorage. Store-internal messages use `getTranslation(key, locale)`.

### Mobile Layout

Sidebar becomes a slide-in overlay on mobile (`<md`). Toggle via Header hamburger menu or floating action button. Uses framer-motion AnimatePresence for enter/exit animations. CompareView touch drag uses both `mousemove` and `touchmove` events.

### Git Notes

- `public/ffmpeg/` is gitignored (32MB WASM)
- `*.MP4`, `*.mov`, `*.MOV` are gitignored (test files should not be committed)
- `.claude/` is gitignored
- GitHub Pages deploys from `gh-pages` branch via `npm run deploy`

### Common Pitfalls Fixed

| Symptom | Root Cause | Fix |
|---|---|---|
| Video processing hangs at "loading engine" | `@ffmpeg/ffmpeg` node export matched before browser export | `resolve.conditions` without `'node'` |
| Cross-origin Worker error | FFmpeg creates internal Worker from CDN URL | Import from npm, let Vite bundle worker.js |
| GIF output always fails | libx264 codec + audio stream in GIF container | Separate GIF code path with palette filter |
| Output file 0 bytes | Rotation metadata produces odd dimensions | `force_divisible_by=2` |
| Progress stuck at 99% | Progress callback overwrites exec status | Separate `isExecing` flag for correct status mapping |
| CompareView original image blank | StrictMode double-revokes blob URL | Reuse thumbnail URLs instead of creating new ones |
| cancelAll doesn't stop processing | No cancel mechanism in async loops | Module-level `_cancelToken` flag |
