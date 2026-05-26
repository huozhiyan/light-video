# CLAUDE.md

本文件为 Claude Code（claude.ai/code）在此仓库工作时提供指导。

## 常用命令

```bash
npm run dev      # 启动开发服务器 (http://localhost:5173)
npm run build    # TypeScript 检查 + Vite 生产构建
npm run deploy   # 构建并推送 dist/ 到 gh-pages 分支
npm run preview  # 本地预览生产构建
```

## 架构概览

### 技术栈
React 19 + TypeScript + Vite 5 + Tailwind CSS 4 + Zustand + Framer Motion + FFmpeg.wasm

### 关键架构决策

**视频处理在主线程运行，而非 Web Worker。**
FFmpeg.wasm v0.12.x 内部会自行创建 Worker。如果我们在自己的 Worker 中再创建 FFmpeg 实例，会出现「Worker 嵌套 Worker」的情况，浏览器安全策略会阻止跨域 Worker 创建，报错 `cannot be accessed from origin`。解决方案：从 npm 直接导入 FFmpeg（`import { FFmpeg } from '@ffmpeg/ffmpeg'`），让 Vite 打包其 JS 类和 worker.js。Vite 打包后的 worker.js 是同源的，Worker 创建成功。

**FFmpeg 核心文件放在 `public/ffmpeg/`**（已 gitignore，需在初始化时下载）。
WASM 二进制（约 32MB）和 JS 胶水代码（约 112KB）必须同源。从 `cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.9/dist/esm/` 下载到 `public/ffmpeg/`。Vite 构建时自动将 public/ 复制到 dist/。

**图片处理使用 Canvas API 在 Web Worker 中运行**（`src/workers/image.worker.ts`）。
每个文件创建一个 Worker 实例，线程池大小 = `navigator.hardwareConcurrency - 1`。

**`resolve.conditions` 必须排除 `'node'` 条件。**
`@ffmpeg/ffmpeg` 的 package.json 中 `"node": "./dist/esm/empty.mjs"` 指向一个空桩文件（直接 throw Error）。Vite 配置必须显式设置 `resolve.conditions: ['browser', 'import', 'module', 'default']` 才能匹配到浏览器 ESM 版本。

### 状态管理（Zustand）

**全局设置与单文件设置的同步是按类型过滤的：**
- `updateGlobalSettings()` 只同步兼容字段：`codec/fps/audioCodec/audioBitrate` 仅同步到视频文件；`quality/resolution` 同步到所有文件；`format` 检查类型兼容后同步
- `updateFileSettings()` 在合并前校验格式兼容性
- 处理时读取的是 `file.settings`，不是 `globalSettings`——点击开始处理前，全局设置的变更必须先同步到各文件

**取消操作使用模块级 `_cancelToken` 标记。**
`processImagesInParallel` 的 worker 循环和 `processVideo` 的 exec 前都会检查该标记。`cancelAll()` 设置标记并将所有未完成的任务标记为错误。

### FFmpeg 参数构建

**GIF 输出需要完全不同的代码路径：**
- 不能用标准视频编码器（libx264/h265）——GIF 封装器会拒绝
- 必须使用基于调色板的编码：`-vf "fps=N,scale=...,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse"`
- 必须强制单视频流映射：`-map 0:v:0 -an`
- 不能有音频编码参数

**分辨率缩放必须强制偶数尺寸：**
scale 滤镜加 `force_divisible_by=2`。竖拍视频的 rotation 元数据会导致自动旋转，配合 `force_original_aspect_ratio=decrease` 可能产生奇数像素（如 203x360），H.264 编码器拒绝奇数尺寸。

**流复制（`-c:v copy -c:a copy`）不能同时使用 `-vf` 或 `-r`**——跳过所有滤镜和帧率设置。

### Blob URL 生命周期

**绝对不要在 useMemo 中创建 blob URL 再用 useEffect 清理。**
React StrictMode 会双重调用 useEffect 的清理函数，导致 blob URL 在组件首次渲染完成前就被撤销。正确做法：
- 复用已有的 blob URL（如文件上传时创建的 `thumbnail` URL）
- 或者用 useRef 手动管理生命周期，在 useMemo 内部撤销旧 URL 再创建新的

**`URL.createObjectURL(file)` 对 File 对象创建的 blob URL**，只要 File 引用存在就持续有效，不需要额外处理。

### 主题

CSS `data-theme="dark|light"` 属性挂载在 `<html>` 上。所有组件通过 `var(--color-xxx)` 引用颜色。Header 中的主题切换按钮设置属性并持久化到 localStorage。初始值在 `main.tsx` 中设置，在 React 挂载前完成以避免闪烁。

### 国际化

`src/i18n.ts` 中扁平的 key-value 字典，包含 `zh`/`en` 两种语言。`useI18n()` hook 返回 `{ t, locale }`。语言选择持久化到 localStorage。Store 中非组件代码使用 `getTranslation(key, locale)`。

### 移动端布局

侧边栏在手机端（`<md`）变成从左侧滑出的浮层面板。通过 Header 的汉堡菜单或右下角的浮动操作按钮触发。使用 framer-motion 的 AnimatePresence 处理进入/退出动画。CompareView 的拖拽分割线同时支持 `mousemove` 和 `touchmove` 事件。

### Git 注意事项

- `public/ffmpeg/` 已 gitignore（32MB WASM 文件）
- `*.MP4`, `*.mov`, `*.MOV` 已 gitignore（测试文件不应提交）
- `.claude/` 已 gitignore
- GitHub Pages 通过 `gh-pages` 分支部署，`npm run deploy` 一键上线

### 常见 Bug 速查表

| 现象 | 根因 | 修复 |
|---|---|---|
| 视频处理卡在"加载引擎" | `@ffmpeg/ffmpeg` 的 node 导出在浏览器条件之前被匹配 | `resolve.conditions` 排除 `'node'` |
| 跨域 Worker 报错 | FFmpeg 从 CDN URL 创建内部 Worker | 从 npm 导入，由 Vite 打包 worker.js |
| GIF 输出始终失败 | libx264 编码器 + 音频流被写入 GIF 容器 | GIF 独立代码路径，调色板滤镜 |
| 输出文件 0 字节 | 旋转元数据导致缩放后尺寸为奇数 | scale 滤镜加 `force_divisible_by=2` |
| 进度条卡在 99% | 进度回调覆盖了 exec 状态 | 用 `isExecing` 标记区分加载/编码阶段 |
| 对比视图原始图片空白 | StrictMode 双重调用清理函数撤销 blob URL | 复用 thumbnail 已有 URL，不再新建 |
| cancelAll 无法停止处理 | 异步循环中没有取消检测机制 | 模块级 `_cancelToken` 标记 |
| 竖拍视频转换失败 | iPhone 的 rotation -90° 元数据 + aspect ratio 缩放 | `force_divisible_by=2` + `force_original_aspect_ratio=decrease` |

### 新增格式支持清单

添加新视频/图片输出格式时，需要同步更新的位置：
1. `src/types/index.ts` — `VideoFormat` / `ImageFormat` 类型联合
2. `src/components/FormatSelector.tsx` — `VIDEO_FORMATS` / `IMAGE_FORMATS` 列表
3. `src/store/useStore.ts` — 格式兼容检查列表（至少 3 处：`updateGlobalSettings`、`updateFileSettings`、`addFiles`）
4. `src/workers/video.worker.ts`（如仍使用）或 `processVideo` 函数 — MIME 类型映射
5. `src/workers/image.worker.ts` — `FORMAT_MIME` 映射
6. `src/components/DropZone.tsx` + `FileGrid.tsx` — accept 扩展名列表
7. `src/i18n.ts` — 格式名翻译 key
