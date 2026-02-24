# Tasks: PencilHistory.xyz - Git 歷史視覺化檢視器

<!--
  憲章要求 (Constitution Requirement):
  根據憲章原則 II「測試標準」,測試優先原則為強制性要求。
  所有功能必須先撰寫失敗的測試,再進行實作。

  According to Constitution Principle II "Testing Standards", test-first is MANDATORY.
  All features must have failing tests written before implementation.
-->

**功能分支**: `001-pen-history-viewer`
**輸入來源**: 設計文件來自 `/specs/001-pen-history-viewer/`
**前置條件**: plan.md ✓, spec.md ✓, data-model.md ✓, contracts/ ✓, research.md ✓

**測試要求**: 根據專案憲章,契約測試和整合測試為所有功能的強制性要求。測試必須優先撰寫 (Red-Green-Refactor 循環)。

**組織方式**: 任務依使用者故事分組,以實現每個故事的獨立實作和測試。

## 格式: `[ID] [P?] [Story] 描述`

- **[P]**: 可平行執行 (不同檔案,無相依性)
- **[Story]**: 此任務屬於哪個使用者故事 (例如: US1, US2, US3)
- 描述中包含確切的檔案路徑

---

## Phase 1: Setup (共享基礎設施)

**目的**: 專案初始化和基本結構建立

- [x] T001 根據 plan.md 建立 Next.js 15 專案結構
- [x] T002 [P] 安裝核心相依套件 (React 18, TypeScript 5.x, Tailwind CSS v4, Octokit, idb-keyval)
- [x] T003 [P] 安裝開發相依套件 (Vitest, Playwright, React Testing Library, ESLint, Prettier)
- [x] T004 [P] 配置 TypeScript in tsconfig.json 依照 plan.md 結構
- [x] T005 [P] 配置 Tailwind CSS v4 in tailwind.config.js 和 app/globals.css
- [x] T006 [P] 配置 ESLint in .eslintrc.json 含 Next.js 和 TypeScript 規則
- [x] T007 [P] 配置 Prettier in .prettierrc.json
- [x] T008 [P] 設定 Husky pre-commit hooks 用於 ESLint 和 Prettier
- [x] T009 [P] 配置 Vitest in vitest.config.ts 用於單元和整合測試
- [x] T010 [P] 配置 Playwright in playwright.config.ts 用於 E2E 測試
- [x] T011 [P] 建立 Next.js 配置 in next.config.js (static export, 環境變數)
- [x] T012 [P] 依 plan.md 建立專案目錄結構 (src/, app/, tests/, public/)
- [x] T013 [P] 建立 .gitignore 含 Node.js, Next.js 和 IDE 項目
- [x] T014 [P] 設定 Vercel 部署配置 in vercel.json 用於 serverless functions

---

## Phase 2: Foundational (阻塞性前置條件)

**目的**: 所有使用者故事開始前必須完成的核心基礎設施

**⚠️ 關鍵**: 在此階段完成前,無法開始任何使用者故事的工作

### 型別定義

- [x] T015 [P] 定義 TypeScript 型別 PenFile in src/types/app.ts
- [x] T016 [P] 定義 TypeScript 型別 Repository in src/types/app.ts
- [x] T017 [P] 定義 TypeScript 型別 Commit in src/types/app.ts
- [x] T018 [P] 定義 TypeScript 型別 FileVersion in src/types/app.ts
- [x] T019 [P] 定義 TypeScript 型別 VisualDesign in src/types/app.ts
- [x] T020 [P] 定義 TypeScript 型別 DiffComparison in src/types/app.ts
- [x] T021 [P] 定義 GitHub API 型別 in src/types/github.ts
- [x] T022 [P] 定義 .pen 檔案型別 in src/types/pen.ts

### 工具函式與錯誤處理

- [x] T023 [P] 建立自訂錯誤類別 in src/lib/utils/errors.ts (GitHubAPIError, PenFileError, ValidationError)
- [x] T024 [P] 實作效能追蹤工具 in src/lib/utils/performance.ts (measureLoadTime, measureRenderTime)
- [x] T025 [P] 建立 URL 工具函式 in src/lib/utils/url.ts (isValidURL, formatURL)

### 基礎 UI 元件

- [x] T026 [P] 建立基礎 Button 元件 in src/components/ui/Button.tsx
- [x] T027 [P] 建立基礎 Input 元件 in src/components/ui/Input.tsx
- [x] T028 [P] 建立 ErrorBoundary 元件 in src/components/layout/ErrorBoundary.tsx
- [x] T029 [P] 建立 LoadingSpinner 元件 in src/components/layout/LoadingSpinner.tsx
- [x] T030 [P] 建立 ErrorMessage 元件 in src/components/layout/ErrorMessage.tsx
- [x] T031 [P] 建立 Header 元件 in src/components/layout/Header.tsx

### App Router 基礎

- [x] T032 [P] 建立 root layout in app/layout.tsx 含 Tailwind CSS imports
- [x] T033 [P] 設定 IndexedDB helper functions 使用 idb-keyval in src/lib/pen/cache.ts

**Checkpoint**: 基礎設施就緒 - 使用者故事實作現在可以平行開始

---

## Phase 3: User Story 1 - 檢視 .pen 檔案的 Git 歷史時間軸 (Priority: P1) 🎯 MVP

**目標**: 使用者能夠輸入 GitHub .pen 檔案 URL,系統顯示該檔案的 commit 歷史時間軸,並以視覺化方式呈現每個版本的設計內容。

**獨立測試**: 使用者輸入一個有效的 .pen 檔案 URL,系統成功顯示該檔案的所有 commit 清單和時間軸,並能瀏覽任一 commit 的視覺化設計內容。

### User Story 1 測試 (憲章強制要求) ⚠️

> **憲章要求: 先撰寫測試,確保測試失敗後再實作**
> **Red-Green-Refactor 循環: 紅燈 (測試失敗) → 綠燈 (測試通過) → 重構 (保持綠燈)**

- [x] T034 [P] [US1] GitHub API commits 端點契約測試 in tests/contract/github-api.test.ts
- [x] T035 [P] [US1] GitHub API 檔案內容端點契約測試 in tests/contract/github-api.test.ts
- [x] T036 [P] [US1] .pen 檔案結構驗證契約測試 in tests/contract/pen-file.test.ts
- [x] T037 [P] [US1] Pencil MCP 截圖 API 契約測試 in tests/contract/pencil-mcp-api.test.ts
- [x] T038 [US1] 完整 URL 輸入→時間軸→視覺化流程整合測試 in tests/integration/user-story-1.test.ts

### User Story 1 實作

#### 核心 GitHub 整合

- [x] T039 [P] [US1] 實作 GitHub URL 解析器 in src/lib/github/parser.ts (parseGitHubURL, validateURL)
- [x] T040 [P] [US1] 實作 Octokit wrapper client in src/lib/github/client.ts (initialize, handleRateLimit)
- [x] T041 [US1] 實作 fetchCommits 函式 in src/lib/github/commits.ts (分頁, 最多 100 commits)
- [x] T042 [US1] 實作 fetchFileContent 函式 in src/lib/github/files.ts (取得特定 SHA 的檔案, 處理 10MB 限制)

#### .pen 檔案處理

- [x] T043 [P] [US1] 實作 .pen 檔案解析器 in src/lib/pen/parser.ts (parsePenFile, validatePenFile)
- [x] T044 [P] [US1] 實作 .pen 檔案驗證器 in src/lib/pen/validator.ts (validateStructure, validateFileSize, validateNodeIds)
- [x] T045 [US1] 實作 FileVersion 記憶體快取 in src/lib/pen/cache.ts (LRU cache, 最多 50 items)

#### Pencil MCP 截圖服務整合

- [x] T046 [US1] 實作 Pencil MCP client 初始化 in app/api/screenshot/pencil-mcp-client.ts
- [x] T047 [US1] 實作截圖生成函式 in app/api/screenshot/generate.ts (呼叫 get_screenshot 工具)
- [x] T048 [US1] 實作 POST /api/screenshot 端點 in app/api/screenshot/route.ts (驗證, timeout 處理, 錯誤處理)
- [x] T049 [US1] 實作前端截圖服務 in src/lib/pen/screenshot-service.ts (API 呼叫, IndexedDB 快取)
- [x] T050 [US1] 實作 useScreenshot React hook in src/hooks/useScreenshot.ts

#### 狀態管理

- [x] T051 [P] [US1] 建立 history store 使用 Zustand in src/store/history-store.ts (commits, currentCommitIndex, fileVersions, loading states)
- [x] T052 [P] [US1] 建立 UI preferences store in src/store/ui-store.ts (playbackSpeed, preferences)

#### React Hooks

- [x] T053 [US1] 實作 useCommits hook in src/hooks/useCommits.ts (fetch commits, 分頁, 錯誤處理)
- [x] T054 [US1] 實作 usePenFile hook in src/hooks/usePenFile.ts (lazy load 檔案內容, 解析, 驗證)

#### 時間軸 UI 元件

- [x] T055 [P] [US1] 建立 CommitNode 元件 in src/components/timeline/CommitNode.tsx (顯示 commit 資訊, 可選取)
- [x] T056 [US1] 建立 Timeline 元件 in src/components/timeline/Timeline.tsx (渲染 commits, 捲動, 「載入更多」按鈕)

#### .pen 檢視器元件

- [x] T057 [P] [US1] 建立 PenRenderer 元件 in src/components/viewer/PenRenderer.tsx (顯示 API 回傳的截圖)
- [x] T058 [US1] 建立 PenViewer 元件 in src/components/viewer/PenViewer.tsx (容器, loading 狀態, 錯誤處理)

#### 頁面

- [x] T059 [US1] 實作首頁含 URL 輸入表單 in app/page.tsx (表單, 驗證, 導航)
- [x] T060 [US1] 實作歷史檢視器頁面 in app/history/[owner]/[repo]/[...path]/page.tsx (時間軸, 檢視器, commit 資訊)

#### 錯誤處理 UI

- [x] T061 [P] [US1] 處理 GitHub URL 驗證錯誤 (顯示友善訊息)
- [x] T062 [P] [US1] 處理檔案找不到錯誤 (404)
- [x] T063 [P] [US1] 處理非 .pen 檔案錯誤
- [x] T064 [P] [US1] 處理私有儲存庫錯誤
- [x] T065 [P] [US1] 處理非 GitHub 平台錯誤 (GitLab, Bitbucket)
- [x] T066 [P] [US1] 處理檔案大小限制錯誤 (> 10MB)
- [x] T067 [P] [US1] 處理 GitHub API 速率限制錯誤
- [x] T068 [P] [US1] 處理 .pen 檔案解析錯誤
- [x] T069 [P] [US1] 處理網路錯誤
- [x] T070 [P] [US1] 處理 Pencil MCP 截圖生成錯誤

**Checkpoint**: 此時 User Story 1 應完全可用且可獨立測試

---

## Phase 4: User Story 2 - 逐一瀏覽 commit 查看設計變化 (Priority: P2)

**目標**: 使用者能夠循序漸進地查看設計檔案在不同 commit 之間的變化,使用播放/暫停功能、鍵盤方向鍵或時間軸滑桿進行導航。

**獨立測試**: 在已載入的 .pen 檔案歷史中,使用者可以使用鍵盤方向鍵、時間軸滑桿或播放按鈕,順暢地在不同 commit 之間切換,每次切換都能看到對應版本的視覺化設計內容。

### User Story 2 測試 (憲章強制要求) ⚠️

- [x] T071 [P] [US2] 鍵盤導航整合測試 in tests/integration/user-story-2.test.ts (左/右方向鍵)
- [x] T072 [P] [US2] 播放控制整合測試 in tests/integration/user-story-2.test.ts (播放/暫停)
- [x] T073 [P] [US2] 時間軸滑桿整合測試 in tests/integration/user-story-2.test.ts (拖曳到 commit)

### User Story 2 實作

#### 導航 Hooks

- [x] T074 [P] [US2] 實作 useKeyboardNav hook in src/hooks/useKeyboardNav.ts (方向鍵, 上一個/下一個 commit)
- [x] T075 [P] [US2] 實作 usePlayback hook in src/hooks/usePlayback.ts (播放/暫停, 速度控制, 自動前進)

#### 時間軸滑桿元件

- [x] T076 [US2] 建立 TimelineSlider 元件 in src/components/timeline/TimelineSlider.tsx (可拖曳, 位置指示器)

#### 播放控制 UI

- [x] T077 [P] [US2] 建立 PlaybackControls 元件 in src/components/timeline/PlaybackControls.tsx (播放/暫停按鈕, 速度選擇器)
- [x] T078 [US2] 整合鍵盤導航到歷史檢視器頁面
- [x] T079 [US2] 整合播放控制到歷史檢視器頁面
- [x] T080 [US2] 整合時間軸滑桿到歷史檢視器頁面

#### 無障礙與焦點管理

- [x] T081 [P] [US2] 加入 ARIA 標籤到導航控制
- [x] T082 [P] [US2] 實作焦點管理用於鍵盤導航
- [x] T083 [P] [US2] 加入鍵盤快捷鍵提示到 UI

**Checkpoint**: 此時 User Stories 1 和 2 應都能獨立運作

---

## Phase 5: User Story 3 - 查看 commit 之間的差異比較 (Priority: P3)

**目標**: 使用者能夠直接比較兩個不同 commit 之間的設計差異,系統視覺化標示出新增、修改、刪除的設計元素。

**獨立測試**: 使用者選擇兩個不同的 commit,系統並排顯示兩個版本的視覺化設計,並以視覺標記標示出新增、修改、刪除的元素。

### User Story 3 測試 (憲章強制要求) ⚠️

- [x] T084 [P] [US3] 節點層級結構 diff 演算法單元測試 in tests/unit/node-diff.test.ts (added, deleted, modified, moved 節點)
- [x] T085 [US3] Diff 比較模式整合測試 in tests/integration/user-story-3.test.ts (選擇兩個 commits, 檢視 diff)

### User Story 3 實作

#### Diff 演算法

- [x] T086 [P] [US3] 實作節點層級結構 diff 演算法 in src/lib/diff/node-diff.ts (compareNodes, detectAdded, detectDeleted, detectModified)
- [x] T087 [P] [US3] 定義 diff 結果型別 in src/lib/diff/types.ts (DiffResult, NodeDiff, PropertyChange)
- [x] T088 [US3] 實作 diff 快取 in src/lib/diff/cache.ts (memoize diff 結果)

#### Diff 視覺化元件

- [x] T089 [P] [US3] 建立 DiffHighlight 元件 in src/components/diff/DiffHighlight.tsx (綠/紅/黃 overlays)
- [x] T090 [US3] 建立 DiffView 元件 in src/components/diff/DiffView.tsx (並排比較)
- [x] T091 [US3] 建立 DiffDetails 元件 in src/components/diff/DiffDetails.tsx (屬性變更 tooltip)

#### Diff 模式 UI 整合

- [x] T092 [US3] 加入比較模式切換到歷史檢視器頁面
- [x] T093 [US3] 實作 commit 選擇用於 diff 比較 (選擇兩個 commits)
- [x] T094 [US3] 整合 DiffView 到歷史檢視器頁面
- [x] T095 [US3] 加入視覺標記用於新增/刪除/修改的元素

**Checkpoint**: 所有使用者故事應現在都能獨立運作

---

## Phase 6: Polish & Cross-Cutting Concerns (打磨與跨領域關注)

**目的**: 影響多個使用者故事的改進

### E2E 測試與品質保證

- [ ] T096 [P] 建立 E2E 測試用於 happy path in tests/e2e/happy-path.spec.ts (Playwright)
- [ ] T097 [P] 建立 E2E 測試用於錯誤處理 in tests/e2e/error-handling.spec.ts (Playwright)

### 效能最佳化

- [ ] T098 [P] 實作效能最佳化 (code splitting, lazy loading, memoization)
- [ ] T099 [P] 實作效能監控使用 Performance API
- [ ] T100 [P] 實作預載入用於相鄰 commits
- [ ] T101 [P] 配置 Lighthouse CI in .github/workflows/ 並最佳化效能分數

### 載入與互動改善

- [ ] T102 [P] 加入 loading 指示器到所有非同步操作
- [ ] T103 [P] 實作 prefetching 策略用於相鄰截圖

### 安全性與審查

- [ ] T104 [P] 安全性審查用於 XSS 防護和輸入驗證
- [ ] T105 [P] 執行 ESLint 並修復所有警告
- [ ] T106 [P] 執行 TypeScript strict mode 檢查

### 文件與部署

- [ ] T107 [P] 更新 README.md 含專案概述和設定說明
- [ ] T108 [P] 驗證 quickstart.md 指示正確運作
- [ ] T109 [P] 加入 JSDoc 註解到公開 APIs
- [ ] T110 [P] 設定 Vercel 部署並配置環境變數
- [ ] T111 [P] 配置自訂網域 pencilhistory.xyz

### 憲章合規性檢查

- [ ] T112 驗證測試覆蓋率 ≥ 80% (核心業務邏輯)
- [ ] T113 驗證所有契約測試和整合測試通過
- [ ] T114 驗證效能基準測試達標 (FCP < 1.5s, TTI < 3.0s, Bundle < 500KB gzipped)
- [ ] T115 驗證無 OWASP Top 10 安全漏洞
- [ ] T116 執行 quickstart.md 完整驗證流程

---

## 相依性與執行順序

### Phase 相依性

- **Setup (Phase 1)**: 無相依性 - 可立即開始
- **Foundational (Phase 2)**: 依賴 Setup 完成 - 阻塞所有使用者故事
- **User Stories (Phase 3, 4, 5)**: 全部依賴 Foundational phase 完成
  - 使用者故事可平行進行 (若有人力)
  - 或依優先順序循序進行 (P1 → P2 → P3)
- **Polish (Phase 6)**: 依賴所有期望的使用者故事完成

### User Story 相依性

- **User Story 1 (P1)**: Foundational 完成後可開始 - 無其他故事相依性
- **User Story 2 (P2)**: Foundational 完成後可開始 - 與 US1 整合但可獨立測試
- **User Story 3 (P3)**: Foundational 完成後可開始 - 與 US1 整合但可獨立測試

### 每個 User Story 內部

- 測試必須先撰寫並失敗後才實作
- 核心工具優先於元件
- Hooks 優先於使用它們的元件
- 個別元件優先於頁面整合
- 故事完成後才移至下個優先順序

### 平行機會

- **Phase 1**: 所有標記 [P] 的任務 (T002-T014) 可平行執行
- **Phase 2**: 所有標記 [P] 的任務 (T015-T033) 可平行執行
- **User Story 1 內**:
  - 測試 (T034-T037) 可平行執行
  - GitHub 整合任務 (T039-T040) 可平行執行
  - .pen 檔案處理任務 (T043-T044) 可平行執行
  - 狀態管理 (T051-T052) 可平行執行
  - 時間軸元件 (T055) 和檢視器元件 (T057) 可平行執行
  - 所有錯誤處理任務 (T061-T070) 可平行執行
- **User Story 2 內**: 導航 hooks (T074-T075) 和 UI 元件 (T077, T081-T083) 可平行執行
- **User Story 3 內**: Diff 元件 (T089, T091) 可平行執行
- **Phase 6**: 所有打磨任務可平行執行

---

## 平行執行範例: User Story 1

### 平行測試設定

```bash
# 一起啟動所有契約測試:
Task: "GitHub API commits 端點契約測試 in tests/contract/github-api.test.ts"
Task: "GitHub API 檔案內容端點契約測試 in tests/contract/github-api.test.ts"
Task: ".pen 檔案結構驗證契約測試 in tests/contract/pen-file.test.ts"
Task: "Pencil MCP 截圖 API 契約測試 in tests/contract/pencil-mcp-api.test.ts"
```

### 平行核心實作

```bash
# 一起啟動 GitHub 整合任務:
Task: "實作 GitHub URL 解析器 in src/lib/github/parser.ts"
Task: "實作 Octokit wrapper client in src/lib/github/client.ts"

# 一起啟動 .pen 檔案處理任務:
Task: "實作 .pen 檔案解析器 in src/lib/pen/parser.ts"
Task: "實作 .pen 檔案驗證器 in src/lib/pen/validator.ts"

# 一起啟動狀態管理:
Task: "建立 history store 使用 Zustand in src/store/history-store.ts"
Task: "建立 UI preferences store in src/store/ui-store.ts"
```

### 平行錯誤處理

```bash
# 一起啟動所有錯誤處理任務:
Task: "處理 GitHub URL 驗證錯誤"
Task: "處理檔案找不到錯誤 (404)"
Task: "處理非 .pen 檔案錯誤"
Task: "處理私有儲存庫錯誤"
Task: "處理非 GitHub 平台錯誤"
Task: "處理檔案大小限制錯誤 (> 10MB)"
Task: "處理 GitHub API 速率限制錯誤"
Task: "處理 .pen 檔案解析錯誤"
Task: "處理網路錯誤"
Task: "處理 Pencil MCP 截圖生成錯誤"
```

---

## 實作策略

### MVP 優先 (僅 User Story 1)

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational (關鍵 - 阻塞所有故事)
3. 完成 Phase 3: User Story 1
4. **停止並驗證**: 獨立測試 User Story 1
5. 部署到 Vercel staging 環境
6. 收集回饋後再進行 P2/P3

### 漸進式交付

1. **基礎** (Phase 1 + 2): Setup + 核心型別與工具 → 基礎就緒
2. **MVP** (Phase 3): User Story 1 → 獨立測試 → 部署到 production (核心價值交付!)
3. **增強 1** (Phase 4): User Story 2 → 獨立測試 → 部署 (導航功能加入)
4. **增強 2** (Phase 5): User Story 3 → 獨立測試 → 部署 (Diff 比較加入)
5. **正式版** (Phase 6): Polish → 部署最終版本
6. 每個階段增加價值且不破壞先前功能

### 平行團隊策略

若有多位開發者:

1. **團隊一起完成 Setup + Foundational** (循序, 阻塞)
2. **Foundational 完成後**:
   - 開發者 A: User Story 1 (P1) - 核心功能
   - 開發者 B: User Story 2 (P2) - 導航功能 (可平行開始)
   - 開發者 C: User Story 3 (P3) - Diff 比較 (可平行開始)
3. **故事獨立完成並整合**
4. **團隊協作 Polish phase**

---

## 備註

- [P] 任務 = 不同檔案,無相依性,可平行執行
- [Story] 標籤將任務對應到特定使用者故事以追溯性
- 每個使用者故事應可獨立完成和測試
- 測試必須先撰寫並失敗後才實作 (Red-Green-Refactor)
- 實作前驗證測試失敗 (紅燈)
- 實作直到測試通過 (綠燈)
- 保持測試綠燈的同時重構
- 每個任務或邏輯群組後提交
- 在任何 checkpoint 停止以獨立驗證故事
- 全程使用效能監控確保目標達成 (FCP < 1.5s, TTI < 3.0s)
- 避免: 模糊任務、相同檔案衝突、破壞獨立性的跨故事相依性

---

## 摘要

**總任務數**: 116 tasks
**每個 User Story 的任務數**:

- Setup (Phase 1): 14 tasks
- Foundational (Phase 2): 19 tasks
- User Story 1 (P1): 37 tasks (T034-T070)
- User Story 2 (P2): 13 tasks (T071-T083)
- User Story 3 (P3): 12 tasks (T084-T095)
- Polish (Phase 6): 21 tasks (T096-T116)

**平行機會**: 50+ 任務標記為 [P] 可平行執行

**獨立測試標準**:

- US1: 使用者可輸入 URL 並查看 commit 時間軸和視覺化內容
- US2: 使用者可使用鍵盤/滑桿/播放功能切換 commits
- US3: 使用者可選擇兩個 commits 查看並排差異比較

**建議 MVP 範圍**: Phase 1 (Setup) + Phase 2 (Foundational) + Phase 3 (User Story 1) = 70 tasks
**預估 MVP 複雜度**: 中大型 (需要與 Pencil MCP server 的完整堆疊整合)

**格式驗證**: ✅ 所有任務遵循 checkbox 格式,包含 Task ID, [P] 標記 (若適用), [Story] 標籤 (使用者故事階段), 和檔案路徑

---

**文件版本**: 1.0.0
**最後更新**: 2026-02-24
**狀態**: 準備實作 ✅

**憲章合規性**: 本任務清單遵循專案憲章所有核心原則,包括測試優先、程式碼品質、效能要求和繁體中文文件要求。
