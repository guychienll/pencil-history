# Quick Start Guide: PencilHistory.xyz

<!--
  憲章要求 (Constitution Requirement):
  本文件必須使用繁體中文（zh-TW）撰寫
  This document MUST be written in Traditional Chinese (zh-TW)
-->

**Feature**: PencilHistory.xyz - Git 歷史視覺化檢視器
**Date**: 2026-02-24
**Branch**: 001-pen-history-viewer

## 概述

本指南協助開發者快速設定 PencilHistory.xyz 專案的開發環境，並開始開發、測試和部署。

---

## 系統需求

### 必要環境

- **Node.js**: 18.x 或更高版本
- **npm**: 9.x 或更高版本
- **Git**: 2.x 或更高版本
- **作業系統**: macOS, Linux, or Windows (with WSL2)

### 瀏覽器支援

開發和測試需支援以下瀏覽器：

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### 檢查環境

```bash
# 檢查 Node.js 版本
node --version
# 應輸出: v18.x.x 或更高

# 檢查 npm 版本
npm --version
# 應輸出: 9.x.x 或更高

# 檢查 Git 版本
git --version
# 應輸出: git version 2.x.x 或更高
```

### 升級 npm（若版本過舊）

```bash
npm install -g npm@latest
```

---

## 專案設定

### 1. Clone Repository

```bash
# Clone repository
git clone https://github.com/[your-org]/pencil-history.git
cd pencil-history

# 切換到功能分支
git checkout 001-pen-history-viewer
```

### 2. 安裝相依套件

```bash
# 安裝相依套件
npm install
```

**預期輸出**：

```
added 523 packages, and audited 524 packages in 18s

found 0 vulnerabilities
```

### 3. 環境變數設定（可選）

建立 `.env.local` 檔案（目前無需環境變數，但為未來擴展準備）：

```bash
# .env.local
# 目前無需任何環境變數
# 未來可能需要：
# NEXT_PUBLIC_GITHUB_TOKEN=（Phase 2 功能）
```

---

## 開發工作流程

### 啟動開發伺服器

```bash
npm dev
```

**預期輸出**：

```
▲ Next.js 15.0.0
- Local:        http://localhost:3000
- Network:      http://192.168.1.100:3000

✓ Ready in 1.8s
```

開啟瀏覽器訪問 `http://localhost:3000`

### 檔案監聽與熱重載

Next.js 會自動監聽檔案變更並即時重載：

- **頁面變更**：自動刷新
- **元件變更**：熱模組替換（HMR）
- **樣式變更**：即時更新

### 開發工具

**建議使用的 VSCode 擴充功能**：

- ESLint
- Prettier - Code formatter
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar)

---

## 程式碼品質檢查

### Linting

```bash
# 執行 ESLint 檢查
npm lint

# 自動修復可修復的問題
npm lint:fix
```

### 格式化

```bash
# 使用 Prettier 格式化所有檔案
npm format

# 檢查格式（不修改檔案）
npm format:check
```

### 型別檢查

```bash
# TypeScript 型別檢查
npm type-check
```

---

## 測試

### 執行所有測試

```bash
# 執行所有測試（unit + integration）
npm test

# 執行測試並顯示覆蓋率
npm test:coverage
```

### 執行特定測試

```bash
# 僅執行單元測試
npm test:unit

# 僅執行整合測試
npm test:integration

# 執行特定檔案的測試
npm test src/lib/github/parser.test.ts

# Watch 模式（開發時使用）
npm test:watch
```

### E2E 測試（Playwright）

```bash
# 安裝 Playwright 瀏覽器（首次執行）
npx playwright install

# 執行 E2E 測試
npm run test:e2e

# 互動模式（可視化除錯）
npm run test:e2e:ui

# 特定瀏覽器
npm run test:e2e -- --project=chromium
```

---

## 建置

### 開發建置

```bash
# 建置專案（開發模式）
npm build:dev
```

### 生產建置

```bash
# 建置專案（生產模式）
npm build

# 建置輸出位於 ./out 目錄
```

**預期輸出**：

```
Route (app)                              Size     First Load JS
┌ ○ /                                    1.2 kB         85.2 kB
└ ○ /history/[owner]/[repo]/[...path]   3.4 kB         87.4 kB

○  (Static)  prerendered as static content

✓ Compiled successfully
```

### 分析 Bundle 大小

```bash
# 執行 bundle 分析
ANALYZE=true npm build

# 會開啟瀏覽器顯示 bundle 組成
```

---

## 預覽生產建置

```bash
# 啟動本地靜態伺服器預覽
npm run preview

# 或使用 serve
npm install -g serve
serve out
```

訪問 `http://localhost:3000` 查看生產版本。

---

## 部署

### Vercel 部署（推薦）

#### 方式 1：自動部署（GitHub 整合）

1. 前往 [Vercel](https://vercel.com)
2. 點擊「Import Project」
3. 選擇 GitHub repository
4. Vercel 自動偵測 Next.js 並配置
5. 每次推送至 main 分支自動部署

#### 方式 2：CLI 手動部署

```bash
# 安裝 Vercel CLI（全域）
npm install -g vercel

# 登入
vercel login

# 部署
vercel

# 生產部署
vercel --prod
```

### GitHub Pages 部署

```bash
# 建置靜態檔案
npm build

# 部署到 GitHub Pages
# 確保 package.json 中有 "homepage": "https://[username].github.io/pencil-history"

# 安裝 gh-pages
npm install --save-dev gh-pages

# 部署
npm deploy
```

**`package.json` 添加**：

```json
{
  "scripts": {
    "deploy": "gh-pages -d out"
  }
}
```

### Netlify 部署

1. 前往 [Netlify](https://netlify.com)
2. 點擊「New site from Git」
3. 選擇 repository
4. 配置：
   - **Build command**: `npm build`
   - **Publish directory**: `out`
5. 點擊「Deploy site」

---

## 常見工作流程

### 新增功能開發

```bash
# 1. 建立功能分支
git checkout -b feature/my-new-feature

# 2. 開發（編輯檔案）

# 3. 執行測試
npm test

# 4. 檢查程式碼品質
npm lint
npm format:check
npm type-check

# 5. Commit（Husky 會自動執行 pre-commit hooks）
git add .
git commit -m "feat: add new feature"

# 6. Push
git push origin feature/my-new-feature

# 7. 建立 Pull Request
```

### 修復 Bug

```bash
# 1. 建立 bug 修復分支
git checkout -b fix/bug-description

# 2. 撰寫失敗的測試（複現 bug）
# 編輯 src/**/*.test.ts

# 3. 執行測試確認失敗
npm test

# 4. 修復 bug

# 5. 執行測試確認通過
npm test

# 6. Commit 和 Push
git add .
git commit -m "fix: resolve bug description"
git push origin fix/bug-description
```

### 執行效能基準測試

```bash
# Lighthouse CI
npm lighthouse

# 自訂效能測試
npm test:perf
```

---

## 專案結構快速導覽

```
pencil-history/
├── app/                    # Next.js App Router 頁面
│   ├── page.tsx           # 首頁（URL 輸入）
│   ├── layout.tsx         # 根 layout
│   └── history/           # 歷史檢視器路由
├── src/
│   ├── components/        # React 元件
│   │   ├── ui/           # 基礎 UI 元件
│   │   ├── timeline/     # 時間軸元件
│   │   ├── viewer/       # .pen 檢視器
│   │   └── diff/         # Diff 比較元件
│   ├── lib/              # 核心業務邏輯
│   │   ├── github/       # GitHub API 整合
│   │   ├── pen/          # .pen 檔案處理
│   │   └── diff/         # Diff 演算法
│   ├── hooks/            # 自訂 React hooks
│   ├── store/            # 狀態管理（Zustand）
│   └── types/            # TypeScript 型別
├── tests/
│   ├── contract/         # 契約測試
│   ├── integration/      # 整合測試
│   └── e2e/              # E2E 測試（Playwright）
├── public/               # 靜態資源
├── specs/                # 規格文件
│   └── 001-pen-history-viewer/
│       ├── spec.md       # 功能規格
│       ├── plan.md       # 實作計畫
│       ├── data-model.md # 資料模型
│       └── contracts/    # API 契約
├── .husky/               # Git hooks
├── next.config.js        # Next.js 配置
├── tailwind.config.js    # Tailwind 配置
├── vitest.config.ts      # Vitest 配置
├── playwright.config.ts  # Playwright 配置
└── package.json          # 專案相依
```

---

## 偵錯技巧

### 使用 VSCode 偵錯器

建立 `.vscode/launch.json`：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### 瀏覽器 DevTools

- **React DevTools**: 安裝 React Developer Tools 擴充功能
- **Network Tab**: 檢查 GitHub API 請求
- **Performance Tab**: 分析渲染效能
- **Lighthouse**: 執行效能審計

### 檢視 Bundle 組成

```bash
ANALYZE=true npm build
```

會開啟 `localhost:8888` 顯示互動式 bundle 分析器。

---

## 常見問題排解

### Q: npm install 失敗

**問題**：`EACCES: permission denied`

**解決**：

```bash
# 清除 npm cache
npm store prune

# 重新安裝
npm install
```

### Q: TypeScript 型別錯誤

**問題**：IDE 顯示型別錯誤但程式碼正確

**解決**：

```bash
# 重新啟動 TypeScript 伺服器（VSCode）
Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"

# 或刪除並重新安裝
rm -rf node_modules .next
npm install
```

### Q: 測試失敗（Playwright）

**問題**：E2E 測試無法找到元素

**解決**：

```bash
# 確保瀏覽器已安裝
npm exec playwright install

# 使用 UI 模式除錯
npm test:e2e:ui
```

### Q: Port 3000 已被佔用

**解決**：

```bash
# 方式 1：使用不同 port
PORT=3001 npm dev

# 方式 2：終止佔用程序（macOS/Linux）
lsof -ti:3000 | xargs kill -9

# 方式 3：終止佔用程序（Windows）
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Q: Husky hooks 未執行

**解決**：

```bash
# 重新安裝 Husky
npx husky install

# 確保 hooks 有執行權限
chmod +x .husky/*
```

---

## 效能檢查清單

建置前執行以下檢查：

- [ ] `npm lint` 通過
- [ ] `npm format:check` 通過
- [ ] `npm type-check` 通過
- [ ] `npm test` 所有測試通過
- [ ] `npm test:e2e` E2E 測試通過
- [ ] `ANALYZE=true npm build` bundle 大小 < 500KB gzipped
- [ ] `npm lighthouse` 效能分數 > 90
- [ ] 手動測試關鍵使用者流程

---

## 有用的命令速查

| 命令                     | 說明                |
| ------------------------ | ------------------- |
| `npm dev`                | 啟動開發伺服器      |
| `npm build`              | 生產建置            |
| `npm test`               | 執行所有測試        |
| `npm test:watch`         | Watch 模式測試      |
| `npm lint`               | ESLint 檢查         |
| `npm format`             | Prettier 格式化     |
| `npm type-check`         | TypeScript 型別檢查 |
| `npm test:e2e`           | Playwright E2E 測試 |
| `ANALYZE=true npm build` | Bundle 分析         |
| `npm lighthouse`         | Lighthouse 審計     |

---

## 下一步

1. ✅ 環境設定完成
2. ⏳ 閱讀 [spec.md](./spec.md) 了解功能需求
3. ⏳ 閱讀 [plan.md](./plan.md) 了解技術架構
4. ⏳ 閱讀 [data-model.md](./data-model.md) 了解資料結構
5. ⏳ 開始開發！執行 `/speckit.tasks` 生成任務清單

---

## 取得協助

- **專案文件**: `./specs/001-pen-history-viewer/`
- **Issue Tracker**: GitHub Issues
- **憲章**: `.specify/memory/constitution.md`

---

**文件版本**：1.0.0
**最後更新**：2026-02-24
**狀態**：完成 ✅
