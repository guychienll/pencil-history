# Feature Specification: PencilHistory.xyz - Git 歷史視覺化檢視器

<!--
  憲章要求 (Constitution Requirement):
  本文件必須使用繁體中文（zh-TW）撰寫
  This document MUST be written in Traditional Chinese (zh-TW)
-->

**Feature Branch**: `001-pen-history-viewer`
**Created**: 2026-02-24
**Status**: Draft
**Input**: User description: "我要做一個極度類似於 https://githistory.xyz/babel/babel/blob/master/packages/babel-core/test/browserify.js 的網站，其功能是依照檔案的 commit 歷史紀錄全數撈取出來，並且比較每一次的差異性，我的網站叫做 pencilhistory.xyz，其中唯一有差異部分是上述網站顯示 code 部分需要替換成依照 .pen 格式選染出來的內容。此功能只要在 github 上就好"

## Clarifications

### Session 2026-02-24

- Q: GitHub API authentication approach (anonymous 60 req/hr vs server-side proxy 5000 req/hr vs user OAuth)? → A: 完全使用匿名 API 呼叫（60 請求/小時限制，使用者很快會遇到限制）
- Q: Deployment architecture (pure frontend static vs frontend+backend API vs frontend+serverless functions)? → A: 前端 + 後端 serverless API 架構，前端為 Next.js 靜態網站，後端使用 Vercel Serverless Functions 整合 Pencil MCP server，部署於 Vercel，網域為 pencilhistory.xyz
- Q: Which .pen rendering library/engine? → A: 使用後端 Pencil MCP server 的 get_screenshot 工具生成截圖，透過 @modelcontextprotocol/sdk 整合，截圖快取於客戶端 IndexedDB
- Q: When to fetch .pen file content (eager load all 100 commits vs lazy load on demand vs hybrid pre-fetch nearby)? → A: Lazy loading（僅在使用者選擇特定 commit 時才載入該 commit 的 .pen 內容，節省 API quota）
- Q: Diff algorithm for P3 comparison feature (JSON text diff vs node-level structural diff vs visual pixel diff)? → A: Node-level structural diff（比較 .pen 內部節點結構、屬性、ID，能準確偵測元素層級的變更）
- Q: Package manager choice (npm vs pnpm vs yarn)? → A: 使用 npm 作為 package manager
- Q: Deployment platform (Vercel vs Netlify vs GitHub Pages vs self-hosted)? → A: 使用 Vercel 部署（支援 serverless functions、自動 HTTPS、全球 CDN）

## User Scenarios & Testing _(mandatory)_

### User Story 1 - 檢視 .pen 檔案的 Git 歷史時間軸 (Priority: P1)

使用者想要查看某個 .pen 設計檔案在 Git 儲存庫中的完整變更歷史。使用者輸入一個指向 .pen 檔案的 Git URL（例如：GitHub 上的檔案路徑），系統會顯示該檔案所有 commit 的時間軸，並以視覺化方式呈現每個版本的設計內容。

**Why this priority**: 這是核心功能，沒有這個就無法提供任何價值。使用者必須能夠載入並瀏覽 .pen 檔案的歷史記錄。

**Independent Test**: 可以獨立測試：使用者輸入一個有效的 .pen 檔案 URL，系統成功顯示該檔案的所有 commit 清單和時間軸，並能瀏覽任一 commit 的視覺化設計內容。

**Acceptance Scenarios**:

1. **Given** 使用者開啟 PencilHistory.xyz 網站首頁，**When** 使用者輸入有效的 .pen 檔案 Git URL 並送出，**Then** 系統顯示該檔案最新 100 筆 commit 的歷史時間軸，包含每個 commit 的日期、作者、訊息（不預先載入所有 commit 的 .pen 檔案內容）
2. **Given** 系統已載入 .pen 檔案的歷史時間軸，**When** 使用者選擇時間軸上的任一 commit 節點，**Then** 系統動態載入該 commit 版本的 .pen 檔案內容並顯示視覺化設計（非程式碼）
3. **Given** 系統已顯示 100 筆 commit 且該檔案還有更多歷史記錄，**When** 使用者點擊「載入更多」按鈕，**Then** 系統載入並顯示下一批 100 筆 commit
4. **Given** 使用者輸入的 URL 指向檔案大小超過 10MB 的 .pen 檔案，**When** 系統嘗試載入，**Then** 顯示錯誤訊息說明檔案過大無法處理
5. **Given** 使用者輸入的 URL 指向私有儲存庫的 .pen 檔案，**When** 系統嘗試載入，**Then** 顯示錯誤訊息說明僅支援公開儲存庫
6. **Given** 使用者輸入非 GitHub 平台的 URL（例如 GitLab 或 Bitbucket），**When** 系統嘗試載入，**Then** 顯示錯誤訊息說明僅支援 GitHub 平台
7. **Given** 使用者輸入的 URL 指向不存在的檔案，**When** 系統嘗試載入，**Then** 顯示友善的錯誤訊息說明檔案不存在
8. **Given** 使用者輸入的 URL 指向非 .pen 檔案，**When** 系統嘗試載入，**Then** 顯示錯誤訊息說明僅支援 .pen 檔案格式

---

### User Story 2 - 逐一瀏覽 commit 查看設計變化 (Priority: P2)

使用者想要循序漸進地查看設計檔案在不同 commit 之間的變化。使用者可以使用播放/暫停功能自動播放歷史記錄，或使用左右鍵/滑桿手動切換不同 commit，觀察設計如何隨時間演變。

**Why this priority**: 這是檢視歷史記錄的核心體驗，讓使用者能有效理解設計的演變過程，但依賴 P1 的基礎載入功能。

**Independent Test**: 可以獨立測試：在已載入的 .pen 檔案歷史中，使用者可以使用鍵盤方向鍵、時間軸滑桿或播放按鈕，順暢地在不同 commit 之間切換，每次切換都能看到對應版本的視覺化設計內容。

**Acceptance Scenarios**:

1. **Given** 系統已顯示 .pen 檔案的歷史時間軸，**When** 使用者按下右方向鍵，**Then** 時間軸前進到下一個 commit 並更新視覺化內容
2. **Given** 系統已顯示 .pen 檔案的歷史時間軸，**When** 使用者按下左方向鍵，**Then** 時間軸後退到上一個 commit 並更新視覺化內容
3. **Given** 系統已顯示 .pen 檔案的歷史時間軸，**When** 使用者點擊播放按鈕，**Then** 系統自動按時間順序逐一播放每個 commit 的視覺化內容
4. **Given** 系統正在自動播放 commit 歷史，**When** 使用者點擊暫停按鈕，**Then** 播放停止並停留在當前 commit
5. **Given** 系統已顯示 .pen 檔案的歷史時間軸，**When** 使用者拖曳時間軸滑桿到特定位置，**Then** 系統跳轉到對應的 commit 並顯示該版本的視覺化內容

---

### User Story 3 - 查看 commit 之間的差異比較 (Priority: P3)

使用者想要直接比較兩個不同 commit 之間的設計差異。系統能夠視覺化標示出哪些設計元素被新增、修改或刪除，幫助使用者快速理解具體的變更內容。

**Why this priority**: 這是進階功能，可以提升使用體驗，但不是 MVP 的必要功能。使用者可以透過 P2 的逐一瀏覽來比較差異。

**Independent Test**: 可以獨立測試：使用者選擇兩個不同的 commit，系統並排顯示兩個版本的視覺化設計，並以視覺標記（例如顏色、邊框）標示出新增、修改、刪除的元素。

**Acceptance Scenarios**:

1. **Given** 系統已顯示 .pen 檔案的歷史時間軸，**When** 使用者選擇比較模式並選定兩個 commit，**Then** 系統載入兩個 commit 的 .pen 檔案內容，執行 node-level structural diff，並排顯示兩個版本的視覺化設計內容
2. **Given** 系統正在比較兩個 commit，**When** 視覺化內容載入完成且 diff 演算法執行完畢，**Then** 新增的元素以綠色標示、刪除的元素以紅色標示、修改的元素以黃色標示
3. **Given** 使用者正在比較兩個 commit，**When** 使用者將滑鼠懸停在標示的元素上，**Then** 系統顯示該元素的具體變更詳情（例如節點 ID、屬性名稱、變更前後的屬性值）

---

### Edge Cases

- 當 .pen 檔案的 commit 歷史超過 100 筆時，系統顯示「載入更多」按鈕讓使用者分頁載入下一批 100 筆 commit
- 當 .pen 檔案大小超過 10MB 時，系統顯示錯誤訊息說明檔案過大無法處理
- 當 .pen 檔案內容過於複雜導致渲染緩慢時，系統顯示載入指示器並提供取消操作選項
- 當 .pen 檔案格式版本不相容或檔案損壞時，系統顯示錯誤訊息說明檔案無法解析
- 當使用者輸入私有儲存庫的 URL 時，系統顯示錯誤訊息說明目前僅支援公開儲存庫
- 當使用者輸入非 GitHub 平台的 URL（GitLab、Bitbucket 等）時，系統顯示錯誤訊息說明僅支援 GitHub 平台
- 當 GitHub API 速率限制時，系統顯示錯誤訊息並建議稍後再試
- 當兩個連續的 commit 之間沒有實質變化時，系統仍顯示該 commit 節點但在視覺化內容中標示「無變更」

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: 系統必須接受並解析指向 .pen 檔案的 GitHub URL（例如：https://github.com/user/repo/blob/branch/path/to/file.pen）
- **FR-002**: 系統必須能夠擷取指定 .pen 檔案的完整 commit 歷史記錄，包含 commit hash、作者、日期、訊息
- **FR-003**: 系統必須採用 lazy loading 策略，僅在使用者選擇或切換到特定 commit 時才擷取該 commit 版本的 .pen 檔案內容（而非預先載入所有 commit 的內容）
- **FR-004**: 系統必須能夠將 .pen 檔案內容渲染成視覺化設計呈現（而非顯示程式碼或原始文字），透過後端 serverless API 呼叫 Pencil MCP server 的 get_screenshot 工具生成截圖
- **FR-005**: 系統必須提供時間軸介面讓使用者瀏覽所有 commit
- **FR-006**: 系統必須允許使用者使用鍵盤方向鍵在不同 commit 之間切換
- **FR-007**: 系統必須提供播放/暫停功能自動循環播放 commit 歷史
- **FR-008**: 系統必須提供拖曳式滑桿讓使用者跳轉到特定 commit
- **FR-009**: 系統必須顯示每個 commit 的詳細資訊（作者、日期、訊息、commit hash）
- **FR-010**: 系統必須在使用者輸入無效 URL、不存在的檔案或非 .pen 檔案時，顯示清楚的錯誤訊息
- **FR-011**: 系統必須處理網路錯誤和 API 失敗情況，並提供使用者友善的錯誤提示
- **FR-012**: 系統必須支援比較兩個不同 commit 的視覺化內容，使用 node-level structural diff 演算法比較 .pen 檔案內部的節點結構、屬性、ID
- **FR-013**: 系統必須在比較模式中標示新增、修改、刪除的設計元素，並能提供具體的屬性變更詳情（例如顏色、尺寸、位置等屬性的前後差異）
- **FR-014**: 系統僅支援公開儲存庫，不支援私有儲存庫的存取
- **FR-015**: 系統必須能處理最大 10MB 的 .pen 檔案，超過此大小時顯示錯誤訊息
- **FR-016**: 系統必須使用分頁載入機制，每次載入最多 100 筆 commit 記錄，並提供載入更多歷史記錄的選項
- **FR-017**: 當檔案的 commit 歷史超過目前已載入的數量時，系統必須顯示「載入更多」按鈕讓使用者可以載入下一批 commit
- **FR-018**: 當使用者輸入的 .pen 檔案來自私有儲存庫時，系統必須顯示錯誤訊息說明僅支援公開儲存庫
- **FR-019**: 當使用者輸入非 GitHub 平台的 URL（例如 GitLab、Bitbucket）時，系統必須顯示錯誤訊息說明僅支援 GitHub 平台
- **FR-020**: 系統必須使用匿名方式呼叫 GitHub API（無需驗證），接受 60 請求/小時的速率限制
- **FR-021**: 當遇到 GitHub API 速率限制（HTTP 403 with rate limit exceeded）時，系統必須顯示清楚的錯誤訊息，告知使用者已達速率上限及預計恢復時間
- **FR-022**: 系統必須為純前端靜態網站架構，所有資料處理、API 呼叫、.pen 檔案渲染均在使用者瀏覽器中執行，不依賴後端伺服器
- **FR-023**: 系統必須在記憶體中快取已載入的 commit 之 .pen 檔案內容，避免使用者切換回已瀏覽過的 commit 時重複發送 API 請求
- **FR-024**: 系統的 diff 演算法必須能夠識別 .pen 節點的唯一 ID（如果存在），以準確追蹤同一元素在不同 commit 之間的屬性變更，而非誤判為刪除後新增

### Key Entities

- **Pen 檔案 (Pen File)**: 使用者想要檢視歷史的 .pen 設計檔案，包含檔案路徑、檔案名稱、所屬儲存庫
- **Commit 記錄 (Commit)**: Git commit 記錄，包含 commit hash、作者、作者電子郵件、提交日期、commit 訊息、父 commit 關聯
- **檔案版本內容 (File Version)**: 特定 commit 中的 .pen 檔案完整內容，用於渲染視覺化設計
- **儲存庫 (Repository)**: .pen 檔案所在的 GitHub 儲存庫，包含儲存庫 URL、分支名稱
- **視覺化設計 (Visual Design)**: .pen 檔案渲染後的視覺化呈現，包含設計元素、版面配置、樣式
- **差異比較 (Diff Comparison)**: 兩個不同 commit 版本之間的變更資訊，使用 node-level structural diff 演算法產生，包含新增的節點清單、刪除的節點清單、修改的節點清單及其屬性變更詳情（節點 ID、屬性名稱、舊值、新值）

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 使用者從輸入 URL 到看到完整 commit 歷史時間軸，載入時間在 10 秒內（針對包含 100 筆 commit 以內的檔案）
- **SC-002**: 系統能夠處理包含至少 1000 筆 commit 的檔案歷史記錄
- **SC-003**: .pen 檔案的視覺化渲染準確度達 100%（與 .pen 規格完全相符）
- **SC-004**: 使用者在不同 commit 之間切換時，視覺化內容更新延遲在 2 秒內
- **SC-005**: 90% 的使用者能在第一次嘗試時成功載入並瀏覽 .pen 檔案的 commit 歷史
- **SC-006**: 系統能夠正確解析和載入來自 GitHub 平台的 .pen 檔案 URL
- **SC-007**: 自動播放功能的播放速度可調整，並且在預設速度下使用者能清楚觀察每個 commit 的變化（建議每個 commit 停留 2-3 秒）
- **SC-008**: 錯誤訊息清楚易懂，95% 的使用者能根據錯誤訊息理解問題並採取正確的下一步行動

## Out of Scope _(optional)_

以下功能不在此版本的範圍內：

- 支援 .pen 以外的其他檔案格式
- 支援 GitHub 以外的 Git 平台（GitLab、Bitbucket、自架 Git 伺服器等）
- 使用者帳號系統與儲存檢視歷史記錄功能
- 直接在網站上編輯 .pen 檔案
- 將特定版本的 .pen 檔案下載或匯出
- 與 Git 儲存庫的雙向同步（例如建立新的 commit）
- 支援本地端檔案系統的 Git 儲存庫（僅支援遠端 GitHub 儲存庫）
- 顯示 branch 或 tag 資訊（僅支援單一 branch 的 commit 歷史）
- 註解或標記特定 commit 的功能

## Assumptions _(optional)_

1. .pen 檔案格式有明確的規格定義，且 Pencil MCP server 提供可在瀏覽器環境執行的渲染引擎（瀏覽器版本或 WebAssembly port）
2. 使用者輸入的 URL 會遵循標準的 GitHub URL 格式（例如：`https://github.com/user/repo/blob/branch/path/to/file.pen`）
3. 使用者的網路連線穩定且頻寬足夠載入多個版本的 .pen 檔案內容
4. GitHub API 在正常情況下可用且回應速度合理
5. 使用者主要檢視 GitHub 公開儲存庫的 .pen 檔案，私有儲存庫支援不在此版本範圍內
6. .pen 檔案的視覺化渲染可以在瀏覽器環境中進行（不需要伺服器端渲染），系統為純前端靜態網站架構，可部署於 GitHub Pages、Vercel、Netlify 等靜態託管平台
7. 播放功能的預設速度為每個 commit 停留 2 秒，使用者可自行調整速度
8. 大部分 .pen 檔案大小在 10MB 以內，超過此大小的檔案屬於例外情況
9. 分頁載入機制（每次 100 筆 commit）可以滿足大部分使用情境的效能需求
10. 僅支援 GitHub 平台，不支援其他 Git 託管平台（GitLab、Bitbucket 等）
11. 採用 lazy loading 策略後，使用者在短時間內實際檢視的 commit 數量有限（相較於載入的 100 筆 commit 清單），可以接受 GitHub API 匿名呼叫的 60 請求/小時速率限制；當達到限制時使用者需等待至下一個小時週期
12. 已載入的 .pen 檔案內容可以在使用者的瀏覽器記憶體中快取，使用者在同一 session 中切換回已瀏覽過的 commit 不需重複載入

## Dependencies _(optional)_

1. GitHub API 存取：系統依賴 GitHub 提供的公開 API 來擷取 commit 歷史和檔案內容（使用匿名呼叫，速率限制為 60 請求/小時/IP）
2. Pencil MCP .pen 檔案渲染引擎：系統需要 Pencil MCP server 的瀏覽器版本或 WebAssembly port 來解析和渲染 .pen 檔案格式（必須可在瀏覽器環境執行）
3. 瀏覽器支援：系統需要使用者的瀏覽器支援現代 Web 標準（HTML5、CSS3、JavaScript ES6+）及 WebAssembly（如果使用 WASM port）
4. 靜態網站託管平台：系統需要部署於支援靜態網站託管的平台（如 GitHub Pages、Vercel、Netlify），網域名稱為 pencilhistory.xyz

## Open Questions _(optional)_

1. 是否需要提供永久連結（permalink）功能，讓使用者可以分享特定 commit 的檢視畫面？
2. 是否需要支援不同的 .pen 檔案格式版本？如果舊版本格式與新版本不相容，如何處理？
3. 分頁載入時，是否需要提供「全部載入」選項讓進階使用者一次性載入所有 commit？
4. 是否需要提供下載單一 commit 版本的 .pen 檔案功能？
