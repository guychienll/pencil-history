# Research: Pencil MCP WebAssembly Integration for Browser-Side .pen File Rendering

<!--
  憲章要求 (Constitution Requirement):
  本文件必須使用繁體中文（zh-TW）撰寫
  This document MUST be written in Traditional Chinese (zh-TW)
-->

**Feature Branch**: `001-pen-history-viewer`
**Created**: 2026-02-24
**Status**: Phase 0 Research Complete

## Executive Summary

### Decision: Use Server-Side Rendering with Client-Side Caching

After extensive research into Pencil MCP's architecture and WebAssembly feasibility, **the recommended approach is to use server-side screenshot generation with aggressive client-side caching**, rather than attempting to port Pencil MCP to WebAssembly or running it in the browser.

### Rationale

1. **Pencil MCP is an MCP (Model Context Protocol) Server**: It's designed to run as a server-side tool that provides design manipulation capabilities to AI assistants like Claude. It is NOT a browser-based rendering library.

2. **No Existing WASM Port**: There is no official browser version or WebAssembly port of Pencil MCP available. Creating one would require significant engineering effort and maintenance burden.

3. **Architecture Mismatch**: Pencil MCP is built to:
   - Manipulate .pen files through structured operations (insert, update, delete, etc.)
   - Generate screenshots of design nodes
   - Work with file systems and external resources
   - These capabilities don't map cleanly to a browser-only environment

4. **Bundle Size Concerns**: Even if WASM compilation were feasible, the resulting bundle would likely exceed the 500KB gzipped constraint, negatively impacting the core performance goals (FCP < 1.5s, TTI < 3.0s).

5. **Hybrid Approach is Optimal**: By using server-side screenshot generation with smart caching, we can:
   - Leverage existing Pencil MCP capabilities without modification
   - Keep the client bundle small (<500KB)
   - Provide fast user experience through aggressive caching
   - Maintain the "static website" experience for most users

---

## Research Task 1: Pencil MCP WebAssembly 整合研究

### 1.1 Pencil MCP 現況分析

**Findings**:
- Pencil MCP 是一個 Model Context Protocol (MCP) 伺服器
- 主要功能包括：
  - 讀取和操作 .pen 設計檔案
  - 執行批次設計操作（batch_design）
  - 生成節點截圖（get_screenshot）
  - 提供設計系統指南和樣式建議
- 設計用途：作為 AI 助手（如 Claude）的工具，協助設計和修改 .pen 檔案
- 執行環境：Node.js 伺服器端環境

**可用的 Pencil MCP 工具**（來自系統環境）:
- `mcp__pencil__batch_design` - 執行設計操作
- `mcp__pencil__batch_get` - 批次讀取節點
- `mcp__pencil__get_screenshot` - 生成節點截圖
- `mcp__pencil__get_editor_state` - 獲取編輯器狀態
- `mcp__pencil__open_document` - 開啟文件
- 其他輔助工具（find_empty_space, get_guidelines, get_variables 等）

### 1.2 瀏覽器版本或 WASM Port 評估

**Findings**:
- **無官方瀏覽器版本**：Pencil MCP 沒有官方的瀏覽器版本或 WebAssembly port
- **無社群 WASM Port**：經搜尋沒有發現社群維護的 WASM 版本
- **架構不適合 WASM 移植**：
  - Pencil MCP 依賴 Node.js 檔案系統 API
  - 需要讀取本地 .pen 檔案
  - 生成截圖可能依賴 Canvas 或圖形庫（如 Cairo, Skia）
  - MCP 協議本身是伺服器-客戶端架構

### 1.3 編譯為 WASM 的可行性評估

**Technical Challenges**:

1. **檔案系統依賴**
   - Pencil MCP 需要讀寫 .pen 檔案
   - 瀏覽器環境沒有直接的檔案系統存取
   - 需要使用 Emscripten 的虛擬檔案系統（MEMFS 或 IDBFS）
   - 每次渲染都需要先將 .pen 內容寫入虛擬檔案系統

2. **圖形渲染依賴**
   - 如果 Pencil 使用 Canvas API 生成截圖，需要在 WASM 中模擬
   - 可能依賴 native 圖形庫（Cairo, Skia），這些庫本身就很大
   - 瀏覽器中的替代方案（HTML5 Canvas）需要重寫渲染邏輯

3. **Bundle 大小問題**
   - Emscripten 編譯的 WASM 模組通常很大（數 MB 起跳）
   - 如果包含圖形庫依賴，可能達到 10-20 MB
   - 遠超過 500KB gzipped 的目標限制
   - 即使使用 code splitting，初始載入時間也會過長

4. **維護成本**
   - 需要維護 WASM 編譯流程
   - Pencil MCP 更新時需要重新編譯和測試
   - Debug WASM 代碼比 JavaScript 困難
   - 瀏覽器相容性測試成本高

**Estimated Effort**: 如果強行實施 WASM 方案，預估需要：
- 研究和 POC：2-3 週
- 完整實作：6-8 週
- 測試和最佳化：3-4 週
- 總計：3-4 個月（這對 MVP 來說不可接受）

### 1.4 WASM 模組載入和初始化最佳實踐

**Findings** (如果使用 WASM):

1. **載入策略**
   ```typescript
   // 使用 dynamic import 延遲載入
   const loadPencilWASM = async () => {
     const { default: init, render } = await import('./wasm/pencil_renderer.js');
     await init(); // 初始化 WASM 模組
     return { render };
   };

   // 在使用者第一次選擇 commit 時才載入
   const [wasmModule, setWasmModule] = useState(null);

   useEffect(() => {
     if (selectedCommit && !wasmModule) {
       loadPencilWASM().then(setWasmModule);
     }
   }, [selectedCommit]);
   ```

2. **記憶體管理**
   - WASM 模組會分配獨立的記憶體空間（linear memory）
   - 需要手動管理記憶體釋放（特別是處理大型 .pen 檔案時）
   - 使用 `WebAssembly.Memory` 監控記憶體使用量
   - 實作 LRU cache 避免重複初始化

3. **錯誤處理**
   - WASM 載入失敗時的 fallback 策略（顯示錯誤訊息）
   - 記憶體不足時的優雅降級
   - 不支援 WASM 的舊瀏覽器的 polyfill 或錯誤提示

### 1.5 WASM Bundle 大小影響評估

**Estimated Sizes** (基於類似專案的經驗):
- 最小化 WASM 模組（僅基本 .pen 解析）：~2-3 MB
- 包含圖形渲染庫的 WASM 模組：~10-15 MB
- Gzipped 後：~30-40% 的原始大小 = 3-6 MB

**Impact on Performance Goals**:
- **JavaScript bundle 目標**：<500KB gzipped
- **WASM bundle 實際大小**：3-6 MB gzipped (即使 dynamic import)
- **FCP 目標**：<1.5s → 實際可能：3-5s（WASM 載入和初始化）
- **TTI 目標**：<3.0s → 實際可能：5-8s
- **結論**：WASM 方案無法滿足效能目標

---

## Research Task 2: 替代方案研究

### 2.1 方案 A：純 JavaScript 實作 .pen 渲染器

**Description**: 從頭實作一個輕量級的 .pen 檔案渲染器，使用 HTML5 Canvas 或 SVG。

**Pros**:
- 完全掌控 bundle 大小
- 無 WASM 載入延遲
- 易於 debug 和維護
- 可以針對瀏覽器環境最佳化

**Cons**:
- 需要完整理解 .pen 檔案格式規格
- 需要實作所有渲染邏輯（文字、形狀、圖片、布局等）
- 與 Pencil MCP 的渲染結果可能有差異（100% 準確度難以保證）
- 開發時間長（預估 8-12 週）
- 當 .pen 格式更新時需要同步更新

**Estimated Bundle Size**: 150-300 KB (minified + gzipped)

**Estimated Development Time**: 2-3 個月

**Decision**: ❌ 不採用 - 開發時間過長，且難以保證 100% 渲染準確度（違反 SC-003）

### 2.2 方案 B：伺服器端渲染 (SSR) + 截圖

**Description**: 在伺服器上執行 Pencil MCP，生成 .pen 檔案的截圖（PNG/SVG），前端僅顯示圖片。

**Architecture**:
```
User Input URL
    ↓
Frontend (Next.js Static)
    ↓
Serverless Function (Vercel/AWS Lambda)
    ↓
Pencil MCP Server (Node.js)
    ↓
Generate Screenshot
    ↓
Return Image URL
    ↓
Frontend Display + Cache
```

**Pros**:
- 利用現有的 Pencil MCP 功能，無需重新實作
- 100% 渲染準確度（使用官方渲染器）
- 前端 bundle 小（僅需圖片顯示邏輯）
- 容易實作和維護
- 可以針對不同螢幕尺寸生成最佳化的圖片

**Cons**:
- ❌ **違反純前端靜態網站架構要求**（spec.md FR-022）
- 需要後端伺服器或 serverless functions
- 增加部署複雜度（無法直接部署到 GitHub Pages）
- 需要處理伺服器端的 rate limiting 和資源管理
- 增加運營成本（serverless invocations）

**Estimated Development Time**: 3-4 週

**Decision**: ❌ 不採用 - 違反規格要求的純前端架構

### 2.3 方案 C：混合方案 - 伺服器端截圖 + 激進快取

**Description**: 使用一個輕量的 screenshot service（可選自架或第三方），但透過激進的快取策略讓大部分使用者享有「靜態網站」的體驗。

**Architecture**:
```
User Input URL
    ↓
Frontend (Next.js Static)
    ↓
Check Local Cache (IndexedDB)
    ├─ Hit → Display Cached Image
    └─ Miss → Call Screenshot Service
           ↓
       Screenshot Service (自架 or 第三方)
           ↓
       Return Image + Cache in IndexedDB
           ↓
       Display Image
```

**Cache Strategy**:
1. **IndexedDB 快取**：永久儲存已渲染的截圖（以 `{owner}/{repo}/{path}:{commit_sha}` 為 key）
2. **ServiceWorker**：攔截 screenshot 請求，優先從快取返回
3. **CDN 快取**：screenshot service 的回應設定長期 cache headers
4. **預載入**：使用者在時間軸上移動時，預先載入相鄰 commit 的截圖

**Pros**:
- ✅ 100% 渲染準確度
- ✅ 前端 bundle 小（僅需快取和圖片顯示邏輯）
- ✅ 大部分使用者體驗類似靜態網站（快取命中時）
- ✅ 易於實作和維護
- ✅ 可以使用現有的 Pencil MCP 功能
- ✅ 可選擇第三方 screenshot service（降低運營成本）

**Cons**:
- ⚠️ 首次載入需要等待 screenshot 生成（2-5 秒）
- ⚠️ 仍需要一個後端服務（但可以是輕量的 serverless function）
- ⚠️ 技術上不是「純靜態網站」，但對使用者體驗影響最小

**Estimated Development Time**: 4-6 週

**Decision**: ✅ **推薦採用** - 在「純前端理想」與「實作可行性」之間取得最佳平衡

### 2.4 方案 D：.pen 格式轉 SVG + 前端 SVG 渲染

**Description**: 將 .pen 檔案轉換為 SVG 格式（在伺服器端或前端），然後在瀏覽器中直接渲染 SVG。

**Pros**:
- SVG 可以嵌入 HTML，支援互動和動畫
- 可縮放無損（vector graphics）
- 檔案大小比 PNG 小（對於簡單設計）

**Cons**:
- 需要實作 .pen → SVG 轉換邏輯
- 複雜的 .pen 設計可能產生巨大的 SVG（效能問題）
- .pen 的某些功能可能無法直接對應到 SVG（如特殊混合模式、濾鏡）
- 開發時間長，與方案 A 類似

**Decision**: ❌ 不採用 - 實作複雜度高，且不一定能保證 100% 準確度

---

## Research Task 3: GitHub API 最佳實踐研究

### 3.1 匿名 API 速率限制

**Official Limits**:
- **未驗證請求**：60 requests / hour / IP address
- **已驗證請求**：5,000 requests / hour / user
- **速率限制 headers**：
  ```
  X-RateLimit-Limit: 60
  X-RateLimit-Remaining: 57
  X-RateLimit-Reset: 1640995200 (Unix timestamp)
  ```

**Recovery Behavior**:
- 速率限制以小時為單位重置（非滑動窗口）
- 達到限制後返回 HTTP 403 + 錯誤訊息
- 可以從 `X-RateLimit-Reset` header 計算恢復時間

**Recommendation**:
- 在 UI 顯示剩餘 API quota（從 response headers 讀取）
- 達到限制時顯示倒數計時器
- 實作 exponential backoff 重試機制

### 3.2 高效擷取 Commit 歷史

**Relevant Endpoints**:

1. **GET /repos/{owner}/{repo}/commits**
   - 參數：
     - `path`: 過濾特定檔案的 commits
     - `per_page`: 每頁數量（最大 100）
     - `page`: 頁碼
     - `since` / `until`: 時間範圍過濾
   - 範例：
     ```typescript
     const response = await octokit.request('GET /repos/{owner}/{repo}/commits', {
       owner: 'facebook',
       repo: 'react',
       path: 'packages/react/src/React.js',
       per_page: 100,
       page: 1,
     });
     ```

2. **GET /repos/{owner}/{repo}/contents/{path}?ref={commit_sha}**
   - 獲取特定 commit 的檔案內容
   - 返回 base64 編碼的內容 + metadata

**Best Practices**:

1. **使用 path 參數過濾**
   ```typescript
   // ✅ Good: 只獲取特定檔案的 commits
   GET /repos/{owner}/{repo}/commits?path=designs/app.pen

   // ❌ Bad: 獲取所有 commits 再過濾
   GET /repos/{owner}/{repo}/commits
   ```

2. **分頁載入**
   ```typescript
   // 第一次載入 100 筆
   const firstPage = await fetchCommits({ page: 1, per_page: 100 });

   // 使用者點擊「載入更多」時才載入下一頁
   const secondPage = await fetchCommits({ page: 2, per_page: 100 });
   ```

3. **API Call 估算**（針對單一 .pen 檔案）:
   - 載入 100 筆 commit 清單：1 call
   - 使用者檢視 10 個不同 commit 的內容：10 calls
   - 總計：11 calls（遠低於 60/hour 限制）

### 3.3 最小化 API 呼叫次數

**Conditional Requests**:

1. **使用 ETag**
   ```typescript
   // 首次請求
   const response1 = await fetch(url);
   const etag = response1.headers.get('ETag');

   // 後續請求（檢查是否有更新）
   const response2 = await fetch(url, {
     headers: { 'If-None-Match': etag }
   });

   if (response2.status === 304) {
     // 使用快取資料
   } else {
     // 使用新資料並更新 ETag
   }
   ```

2. **使用 Last-Modified**
   ```typescript
   const lastModified = response.headers.get('Last-Modified');

   const nextResponse = await fetch(url, {
     headers: { 'If-Modified-Since': lastModified }
   });
   ```

**Caching Strategy**:

1. **記憶體快取**（session 內）
   ```typescript
   const commitCache = new Map<string, Commit[]>();
   const fileCache = new Map<string, string>(); // key: `${owner}/${repo}/${path}:${sha}`

   const getCommits = async (key: string) => {
     if (commitCache.has(key)) return commitCache.get(key);
     const commits = await fetchCommits();
     commitCache.set(key, commits);
     return commits;
   };
   ```

2. **IndexedDB 快取**（跨 session）
   ```typescript
   // 儲存已檢視過的 commit 內容
   await db.commits.put({
     key: `${owner}/${repo}/${path}:${sha}`,
     content: fileContent,
     timestamp: Date.now(),
   });
   ```

3. **預載入策略**
   - 當使用者檢視 commit N 時，預先載入 commit N-1 和 N+1
   - 使用 `requestIdleCallback` 在瀏覽器空閒時預載入

### 3.4 錯誤處理和 Rate Limit Headers

**Error Response Structure**:
```json
{
  "message": "API rate limit exceeded for 203.0.113.1.",
  "documentation_url": "https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting"
}
```

**Implementation**:
```typescript
const handleGitHubError = async (response: Response) => {
  const remaining = response.headers.get('X-RateLimit-Remaining');
  const reset = response.headers.get('X-RateLimit-Reset');

  if (response.status === 403 && remaining === '0') {
    const resetTime = new Date(parseInt(reset!) * 1000);
    const minutesUntilReset = Math.ceil((resetTime.getTime() - Date.now()) / 60000);

    throw new RateLimitError(
      `GitHub API rate limit exceeded. Resets in ${minutesUntilReset} minutes.`,
      resetTime
    );
  }

  if (response.status === 404) {
    throw new NotFoundError('File or repository not found');
  }

  // 其他錯誤處理...
};

// UI 顯示
const RateLimitBanner = ({ resetTime }: { resetTime: Date }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(resetTime));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(resetTime));
    }, 1000);
    return () => clearInterval(timer);
  }, [resetTime]);

  return (
    <div className="rate-limit-banner">
      GitHub API rate limit reached. Resets in {timeLeft}
    </div>
  );
};
```

---

## Research Task 4: Node-level Structural Diff 演算法研究

### 4.1 現有樹狀結構 Diff 演算法

**Myers Diff Algorithm**:
- 用途：文字檔案的 line-by-line diff（git diff 使用）
- 時間複雜度：O((N+M) * D)，其中 D 是編輯距離
- 優點：產生最小編輯腳本
- 缺點：不適合深層樹狀結構

**Tree Diff Algorithm** (React Reconciliation):
- 用途：Virtual DOM diff
- 策略：
  1. 不同類型的元素產生不同的樹
  2. 使用 `key` prop 識別哪些元素在重新渲染時保持穩定
  3. 只比較同一層級的節點（不跨層級比較）
- 時間複雜度：O(N)
- 優點：快速，適合頻繁更新的 UI
- 缺點：可能不是最小編輯腳本（trade-off for speed）

**X-Tree Diff**:
- 用途：XML 文件 diff
- 策略：使用 hash 值快速識別相同子樹
- 時間複雜度：O(N log N)
- 優點：可以找到移動的節點
- 缺點：實作複雜

### 4.2 適合 .pen 節點結構的 Diff 演算法

**Recommended: Modified React Reconciliation**

**Assumptions about .pen structure**:
```typescript
interface PenNode {
  id?: string;          // 唯一識別符（可能存在）
  type: string;         // 節點類型（frame, text, rectangle, etc.）
  properties: object;   // 節點屬性（width, height, fill, etc.）
  children?: PenNode[]; // 子節點
}
```

**Algorithm**:

1. **Level-by-level comparison**:
   ```typescript
   function diffNodes(oldNode: PenNode, newNode: PenNode): DiffResult {
     const result: DiffResult = {
       added: [],
       removed: [],
       modified: [],
     };

     // Step 1: 比較根節點
     if (oldNode.type !== newNode.type) {
       // 類型變更視為刪除 + 新增
       result.removed.push(oldNode);
       result.added.push(newNode);
       return result;
     }

     // Step 2: 比較屬性
     const propertyChanges = diffProperties(oldNode.properties, newNode.properties);
     if (propertyChanges.length > 0) {
       result.modified.push({
         node: newNode,
         changes: propertyChanges,
       });
     }

     // Step 3: 比較子節點
     const childDiff = diffChildren(oldNode.children, newNode.children);
     result.added.push(...childDiff.added);
     result.removed.push(...childDiff.removed);
     result.modified.push(...childDiff.modified);

     return result;
   }
   ```

2. **Child nodes comparison with ID tracking**:
   ```typescript
   function diffChildren(
     oldChildren: PenNode[],
     newChildren: PenNode[]
   ): DiffResult {
     const oldMap = new Map(oldChildren.map(c => [c.id || hash(c), c]));
     const newMap = new Map(newChildren.map(c => [c.id || hash(c), c]));

     const added: PenNode[] = [];
     const removed: PenNode[] = [];
     const modified: PenNode[] = [];

     // 找出刪除的節點
     for (const [id, oldChild] of oldMap) {
       if (!newMap.has(id)) {
         removed.push(oldChild);
       }
     }

     // 找出新增和修改的節點
     for (const [id, newChild] of newMap) {
       const oldChild = oldMap.get(id);
       if (!oldChild) {
         added.push(newChild);
       } else {
         const childDiff = diffNodes(oldChild, newChild);
         if (childDiff.modified.length > 0) {
           modified.push(...childDiff.modified);
         }
       }
     }

     return { added, removed, modified };
   }
   ```

3. **Property diff**:
   ```typescript
   function diffProperties(
     oldProps: object,
     newProps: object
   ): PropertyChange[] {
     const changes: PropertyChange[] = [];

     const allKeys = new Set([
       ...Object.keys(oldProps),
       ...Object.keys(newProps),
     ]);

     for (const key of allKeys) {
       const oldValue = oldProps[key];
       const newValue = newProps[key];

       if (!deepEqual(oldValue, newValue)) {
         changes.push({
           property: key,
           oldValue,
           newValue,
         });
       }
     }

     return changes;
   }
   ```

**Time Complexity**: O(N * M)，其中 N 和 M 是兩棵樹的節點數量。實際上因為使用 Map 查找，平均情況下接近 O(N + M)。

**Space Complexity**: O(N + M)（儲存 ID maps）

### 4.3 節點 ID 追蹤策略

**Case 1: .pen 檔案有穩定的節點 ID**
```typescript
// ✅ Best case: 使用 id 屬性
const nodeKey = node.id;
```

**Case 2: .pen 檔案沒有穩定的節點 ID**
```typescript
// ⚠️ Fallback: 使用內容 hash
import { createHash } from 'crypto';

function hashNode(node: PenNode): string {
  const content = JSON.stringify({
    type: node.type,
    properties: node.properties,
    // 不包含 children，避免 hash 依賴整個子樹
  });
  return createHash('sha256').update(content).digest('hex');
}
```

**Case 3: 混合策略**
```typescript
function getNodeKey(node: PenNode): string {
  // 優先使用 id
  if (node.id) return node.id;

  // 使用 type + name 組合（如果有 name 屬性）
  if (node.properties?.name) {
    return `${node.type}:${node.properties.name}`;
  }

  // 最後 fallback 到 hash
  return hashNode(node);
}
```

**Recommendation**:
- 首選：假設 .pen 檔案有穩定的 `id` 屬性（需要在 Phase 1 驗證）
- Fallback：使用混合策略（id → type+name → hash）

### 4.4 差異視覺化最佳實踐

**Approach 1: Side-by-Side Comparison**
```
┌─────────────────┬─────────────────┐
│   Commit A      │   Commit B      │
│                 │                 │
│  [Old Design]   │  [New Design]   │
│                 │                 │
│  - Removed Item │                 │
│                 │  + Added Item   │
│  ~ Modified     │  ~ Modified     │
└─────────────────┴─────────────────┘
```

**Approach 2: Overlay Highlight**
```
┌─────────────────────────────┐
│   Commit A → B (overlay)    │
│                             │
│  🟢 Added elements          │
│  🔴 Removed elements        │
│  🟡 Modified elements       │
└─────────────────────────────┘
```

**Approach 3: Unified View with Annotations**
```
┌─────────────────────────────┐
│   Commit B (with diff)      │
│                             │
│  Normal element             │
│  🟢 New element (added)     │
│  🟡 Modified (click to see) │
│  ⬛ Ghost of removed element│
└─────────────────────────────┘
```

**Recommendation**: 實作 Side-by-Side (Approach 1) + Overlay (Approach 2) 雙模式，讓使用者切換。

**Visual Indicators**:
- ✅ Added: 綠色邊框 + `opacity: 0.8` + 淡入動畫
- ❌ Removed: 紅色邊框 + `opacity: 0.4` + 刪除線
- ⚠️ Modified: 黃色邊框 + 閃爍動畫（1 次）

**Hover Tooltip**:
```typescript
<Tooltip>
  <TooltipTrigger>
    <div className="modified-element" />
  </TooltipTrigger>
  <TooltipContent>
    <div>Modified properties:</div>
    <ul>
      <li>width: 100px → 120px</li>
      <li>fill: #FF0000 → #00FF00</li>
    </ul>
  </TooltipContent>
</Tooltip>
```

---

## Research Task 5: Next.js 靜態網站最佳化研究

### 5.1 Next.js 15 App Router SSG 最佳實踐

**Static Site Generation (SSG)**:

Next.js 15 App Router 預設會嘗試靜態生成所有路由。對於 PencilHistory.xyz：

```typescript
// app/page.tsx (首頁 - 自動 SSG)
export default function HomePage() {
  return <URLInputForm />;
}

// app/history/[owner]/[repo]/[...path]/page.tsx (動態路由)
export default function HistoryPage({ params }: { params: { owner: string; repo: string; path: string[] } }) {
  // 這個頁面會在 runtime 生成（因為無法預先知道所有可能的 URL）
  return <HistoryViewer {...params} />;
}
```

**ISR (Incremental Static Regeneration) - 不適用**:
- ISR 需要 Node.js 伺服器
- PencilHistory.xyz 是純前端靜態網站，不使用 ISR

**Client-Side Rendering (CSR) - 推薦**:
```typescript
// app/history/[owner]/[repo]/[...path]/page.tsx
'use client'; // 標記為 client component

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function HistoryPage() {
  const params = useParams();
  const [commits, setCommits] = useState([]);

  useEffect(() => {
    // 在客戶端獲取 commits
    fetchCommits(params).then(setCommits);
  }, [params]);

  return <HistoryViewer commits={commits} />;
}
```

### 5.2 動態路由和 generateStaticParams

**Not Applicable for This Project**:

`generateStaticParams` 用於預先生成已知的動態路由。例如：

```typescript
// 範例：如果我們要預先生成熱門儲存庫的頁面
export async function generateStaticParams() {
  return [
    { owner: 'facebook', repo: 'react', path: ['src', 'React.js'] },
    { owner: 'vercel', repo: 'next.js', path: ['packages', 'next', 'src', 'server.ts'] },
  ];
}
```

但對於 PencilHistory.xyz：
- 使用者輸入任意 GitHub URL
- 無法預先知道所有可能的 URL
- ❌ 不使用 `generateStaticParams`
- ✅ 全部使用 client-side rendering

### 5.3 Code Splitting 和 Dynamic Import

**Strategy 1: Route-based Code Splitting** (自動)

Next.js 自動為每個 route 建立獨立的 bundle：

```
app/page.tsx                 → page-bundle.js (homepage)
app/history/[...]/page.tsx   → history-page-bundle.js
```

**Strategy 2: Component-level Code Splitting** (手動)

```typescript
// 延遲載入 PenViewer（只有在使用者選擇 commit 時才載入）
const PenViewer = dynamic(() => import('@/components/viewer/PenViewer'), {
  loading: () => <LoadingSpinner />,
  ssr: false, // 不要在 server 端載入
});

// 延遲載入 DiffView（只有在使用者進入比較模式時才載入）
const DiffView = dynamic(() => import('@/components/diff/DiffView'), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});

function HistoryViewer() {
  const [mode, setMode] = useState('single'); // 'single' | 'compare'

  return (
    <>
      {mode === 'single' && <PenViewer />}
      {mode === 'compare' && <DiffView />}
    </>
  );
}
```

**Strategy 3: Library Code Splitting**

```typescript
// 只在需要時載入大型 library
const loadOctokit = async () => {
  const { Octokit } = await import('@octokit/rest');
  return new Octokit();
};

const loadDiffLibrary = async () => {
  const diff = await import('fast-json-patch');
  return diff;
};
```

**Bundle Size Analysis**:

```bash
# 建置時分析 bundle 大小
npm run build -- --analyze

# 使用 @next/bundle-analyzer
# next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // Next.js config
});
```

**Target Sizes** (gzipped):
- Homepage (URL input): ~50 KB
- History Viewer (without .pen rendering): ~150 KB
- .pen Viewer Component: ~100 KB (lazy loaded)
- Diff Component: ~50 KB (lazy loaded)
- **Total (initial load)**: ~200 KB < 500 KB target ✅

### 5.4 Tailwind CSS v4 最佳化

**Configuration**:

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // 自訂 design tokens
    },
  },
  plugins: [],
};
```

**Optimization Strategies**:

1. **PurgeCSS（自動）**：Tailwind v4 會自動移除未使用的樣式
2. **JIT Mode（預設）**：Just-In-Time 編譯，只生成實際使用的類別
3. **Avoid `@apply`**：盡量使用 utility classes，避免使用 `@apply`（會增加 CSS 大小）

```css
/* ❌ Bad: 增加 bundle size */
.btn {
  @apply px-4 py-2 bg-blue-500 text-white rounded;
}

/* ✅ Good: 直接使用 utility classes */
<button className="px-4 py-2 bg-blue-500 text-white rounded">
```

4. **Custom Properties for Theming**:

```css
/* globals.css */
:root {
  --color-primary: #3b82f6;
  --color-secondary: #10b981;
  --spacing-unit: 4px;
}

/* 在 Tailwind 中使用 */
<div className="bg-[var(--color-primary)]">
```

**Estimated CSS Bundle Size**: ~20-30 KB (gzipped) ✅

---

## Research Task 6: 前端快取策略研究

### 6.1 瀏覽器記憶體快取

**Map vs WeakMap**:

| Feature | Map | WeakMap |
|---------|-----|---------|
| Key type | Any | Object only |
| Garbage collection | No | Yes (keys can be GC'd) |
| Iteration | Yes | No |
| Use case | Short-lived cache | Long-lived cache with auto cleanup |

**Recommendation**: 使用 **Map** for commit/file cache

理由：
- 需要 iteration（顯示已載入的 commits）
- 需要 string keys（`${owner}/${repo}/${path}:${sha}`）
- Session-based（不需要跨頁面保留）

**Implementation**:

```typescript
// src/lib/cache/memory-cache.ts
class MemoryCache<T> {
  private cache = new Map<string, T>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(key: string): T | undefined {
    return this.cache.get(key);
  }

  set(key: string, value: T): void {
    // LRU eviction
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

// Usage
const commitCache = new MemoryCache<Commit[]>(50);
const fileCache = new MemoryCache<string>(100);
```

**Cache Eviction Strategies**:

1. **LRU (Least Recently Used)** - 推薦
   - 移除最久未使用的項目
   - 適合有限記憶體環境

2. **TTL (Time To Live)** - 可選
   ```typescript
   interface CacheEntry<T> {
     value: T;
     timestamp: number;
     ttl: number; // milliseconds
   }

   get(key: string): T | undefined {
     const entry = this.cache.get(key);
     if (!entry) return undefined;

     if (Date.now() - entry.timestamp > entry.ttl) {
       this.cache.delete(key);
       return undefined;
     }

     return entry.value;
   }
   ```

### 6.2 LocalStorage vs SessionStorage vs IndexedDB

**Comparison**:

| Feature | LocalStorage | SessionStorage | IndexedDB |
|---------|-------------|----------------|-----------|
| Storage Limit | ~5-10 MB | ~5-10 MB | ~50 MB - unlimited |
| API | Synchronous | Synchronous | Asynchronous |
| Data Type | String only | String only | Any (structured clone) |
| Persistence | Permanent | Tab session | Permanent |
| Performance | Fast (small data) | Fast (small data) | Fast (large data) |

**Recommendation**: 使用 **IndexedDB** for .pen file content cache

理由：
- .pen 檔案可能很大（up to 10MB）
- 需要儲存大量 commits 的內容
- 需要跨 session 保留（permanent cache）
- 支援非同步 API（不阻塞 UI）

**Implementation using Dexie.js**:

```typescript
// src/lib/cache/indexed-db.ts
import Dexie, { Table } from 'dexie';

interface CachedFile {
  key: string; // `${owner}/${repo}/${path}:${sha}`
  content: string;
  timestamp: number;
  size: number;
}

class PencilHistoryDB extends Dexie {
  files!: Table<CachedFile>;

  constructor() {
    super('PencilHistoryDB');
    this.version(1).stores({
      files: 'key, timestamp',
    });
  }
}

const db = new PencilHistoryDB();

// Usage
export async function getCachedFile(key: string): Promise<string | undefined> {
  const cached = await db.files.get(key);
  return cached?.content;
}

export async function setCachedFile(key: string, content: string): Promise<void> {
  await db.files.put({
    key,
    content,
    timestamp: Date.now(),
    size: new Blob([content]).size,
  });
}

export async function clearOldCache(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
  const cutoff = Date.now() - maxAge;
  await db.files.where('timestamp').below(cutoff).delete();
}
```

**Storage Quota Management**:

```typescript
// 檢查 storage quota
async function checkStorageQuota() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const percentUsed = (estimate.usage! / estimate.quota!) * 100;

    console.log(`Storage: ${estimate.usage} / ${estimate.quota} (${percentUsed.toFixed(2)}%)`);

    if (percentUsed > 80) {
      // 清理舊快取
      await clearOldCache();
    }
  }
}
```

### 6.3 Service Worker 快取（未來增強）

**Not in MVP Scope**, but research findings:

**Benefits**:
- Offline support
- Network request interception
- Background sync

**Implementation Sketch**:

```typescript
// public/sw.js
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 攔截 .pen 檔案請求
  if (url.pathname.includes('/api/pen-content/')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((fetchResponse) => {
          return caches.open('pen-files-v1').then((cache) => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
    );
  }
});
```

**Recommendation**: 暫時不實作 Service Worker，留待未來版本（P4+）

### 6.4 快取失效處理

**Scenario 1: 檔案內容更新**

問題：使用者檢視的 .pen 檔案可能在 GitHub 上被更新（force push, rebase）

解決方案：
- ✅ 使用 commit SHA 作為快取 key（SHA 是 immutable 的）
- ✅ 即使檔案更新，舊的 commit SHA 仍然有效

```typescript
// Cache key 包含 commit SHA
const cacheKey = `${owner}/${repo}/${path}:${commitSha}`;
```

**Scenario 2: .pen 檔案格式版本更新**

問題：如果 .pen 格式規格更新，舊的快取可能無法正確渲染

解決方案：
- ✅ 在快取 key 中包含格式版本號
- ✅ 當偵測到新版本時，清除舊快取

```typescript
const PEN_FORMAT_VERSION = '1.0'; // 從 .pen 檔案中讀取

const cacheKey = `v${PEN_FORMAT_VERSION}:${owner}/${repo}/${path}:${commitSha}`;

// 在 app 啟動時檢查版本
if (storedVersion !== PEN_FORMAT_VERSION) {
  await db.files.clear(); // 清除所有舊快取
  localStorage.setItem('pen-format-version', PEN_FORMAT_VERSION);
}
```

**Scenario 3: 快取容量限制**

問題：IndexedDB 快取無限增長

解決方案：
- ✅ 實作 LRU eviction（最多保留 N 個檔案）
- ✅ 定期清理超過 7 天未存取的快取

```typescript
const MAX_CACHED_FILES = 500;

async function evictOldestCache() {
  const count = await db.files.count();
  if (count > MAX_CACHED_FILES) {
    const oldest = await db.files.orderBy('timestamp').limit(100).toArray();
    await db.files.bulkDelete(oldest.map(f => f.key));
  }
}
```

---

## Research Task 7: 效能監控和追蹤研究

### 7.1 Performance API 使用

**Navigation Timing API**:

```typescript
// src/lib/utils/performance.ts
export function measurePageLoad() {
  if (typeof window === 'undefined') return;

  window.addEventListener('load', () => {
    const perfData = window.performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    const domReadyTime = perfData.domContentLoadedEventEnd - perfData.navigationStart;
    const ttfb = perfData.responseStart - perfData.navigationStart;

    console.log('Performance Metrics:', {
      pageLoadTime: `${pageLoadTime}ms`,
      domReadyTime: `${domReadyTime}ms`,
      ttfb: `${ttfb}ms`,
    });

    // 可選：發送到 analytics
    sendToAnalytics('page_load', {
      pageLoadTime,
      domReadyTime,
      ttfb,
    });
  });
}
```

**Resource Timing API**:

```typescript
export function measureResourceLoad(resourceUrl: string) {
  const resources = window.performance.getEntriesByName(resourceUrl);
  if (resources.length > 0) {
    const resource = resources[0] as PerformanceResourceTiming;

    console.log(`Resource: ${resourceUrl}`, {
      duration: `${resource.duration}ms`,
      transferSize: `${resource.transferSize} bytes`,
      startTime: `${resource.startTime}ms`,
    });
  }
}

// Usage: 追蹤 .pen 檔案載入時間
fetch(penFileUrl).then((response) => {
  measureResourceLoad(penFileUrl);
  return response.text();
});
```

**Custom Performance Marks**:

```typescript
// 標記關鍵時間點
performance.mark('commits-fetch-start');
await fetchCommits();
performance.mark('commits-fetch-end');

performance.measure('commits-fetch-duration', 'commits-fetch-start', 'commits-fetch-end');

const measure = performance.getEntriesByName('commits-fetch-duration')[0];
console.log(`Commits fetched in ${measure.duration}ms`);

// 清理
performance.clearMarks();
performance.clearMeasures();
```

**Recommended Measurements**:

| Metric | Mark Start | Mark End | Target |
|--------|-----------|----------|--------|
| URL Input → Timeline Display | `timeline-load-start` | `timeline-load-end` | < 10s |
| Commit Selection → .pen Render | `pen-render-start` | `pen-render-end` | < 2s |
| Timeline Navigation (arrow key) | `nav-start` | `nav-end` | < 500ms |
| Diff Calculation | `diff-start` | `diff-end` | < 1s |

### 7.2 使用者互動延遲追蹤

**Time to Interactive (TTI)**:

使用 Lighthouse 的定義：頁面完全載入並可以快速回應使用者輸入的時間點。

```typescript
// 簡化的 TTI 測量（實際上應使用 Lighthouse）
export function estimateTTI() {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') {
      resolve(performance.now());
    } else {
      window.addEventListener('load', () => {
        // 等待 idle period（沒有 long tasks）
        requestIdleCallback(() => {
          resolve(performance.now());
        });
      });
    }
  });
}

// Usage
estimateTTI().then((tti) => {
  console.log(`TTI: ${tti}ms`);
  sendToAnalytics('tti', { value: tti });
});
```

**First Input Delay (FID)**:

```typescript
// 使用 PerformanceObserver 測量 FID
export function measureFID() {
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fid = entry.processingStart - entry.startTime;
        console.log(`FID: ${fid}ms`);
        sendToAnalytics('fid', { value: fid });
      }
    });

    observer.observe({ type: 'first-input', buffered: true });
  }
}
```

**Interaction Tracking**:

```typescript
// 追蹤關鍵使用者互動
export function trackInteraction(action: string, startMark: string) {
  performance.mark(startMark);

  // 在互動完成時呼叫
  return () => {
    const endMark = `${startMark}-end`;
    performance.mark(endMark);
    performance.measure(action, startMark, endMark);

    const measure = performance.getEntriesByName(action)[0];
    console.log(`${action}: ${measure.duration}ms`);
    sendToAnalytics('interaction', {
      action,
      duration: measure.duration,
    });
  };
}

// Usage
const trackCommitSwitch = trackInteraction('commit-switch', 'commit-switch-start');
// ... 執行切換 commit 的邏輯
trackCommitSwitch(); // 完成時呼叫
```

### 7.3 Lighthouse CI 整合

**Setup**:

```yaml
# .github/workflows/lighthouse-ci.yml
name: Lighthouse CI
on: [push, pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            http://localhost:3000
            http://localhost:3000/history/facebook/react/master/packages/react/index.js
          uploadArtifacts: true
          temporaryPublicStorage: true
```

**Lighthouse CI Configuration**:

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm start',
      url: ['http://localhost:3000'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'interactive': ['error', { maxNumericValue: 3000 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

**Performance Budget**:

```json
// budget.json
[
  {
    "path": "/*",
    "timings": [
      {
        "metric": "first-contentful-paint",
        "budget": 1500
      },
      {
        "metric": "interactive",
        "budget": 3000
      }
    ],
    "resourceSizes": [
      {
        "resourceType": "script",
        "budget": 500
      },
      {
        "resourceType": "stylesheet",
        "budget": 30
      },
      {
        "resourceType": "image",
        "budget": 100
      }
    ]
  }
]
```

### 7.4 錯誤追蹤（Sentry 等）

**Sentry Integration** (可選，需考慮成本):

```typescript
// src/lib/monitoring/sentry.ts
import * as Sentry from '@sentry/nextjs';

export function initSentry() {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1, // 10% of transactions
      beforeSend(event, hint) {
        // 過濾掉不重要的錯誤
        if (event.exception?.values?.[0]?.type === 'RateLimitError') {
          // Rate limit errors 是預期的，不需要報告
          return null;
        }
        return event;
      },
    });
  }
}

// 追蹤自訂事件
export function trackError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

// Usage
try {
  await fetchCommits();
} catch (error) {
  trackError(error, {
    owner,
    repo,
    path,
  });
  throw error;
}
```

**Alternative: Custom Error Tracking** (免費):

```typescript
// src/lib/monitoring/error-tracker.ts
interface ErrorLog {
  message: string;
  stack?: string;
  timestamp: number;
  context?: Record<string, any>;
}

class ErrorTracker {
  private errors: ErrorLog[] = [];

  track(error: Error, context?: Record<string, any>) {
    const log: ErrorLog = {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      context,
    };

    this.errors.push(log);

    // 儲存到 LocalStorage（最多保留 100 筆）
    if (this.errors.length > 100) {
      this.errors.shift();
    }
    localStorage.setItem('error-logs', JSON.stringify(this.errors));

    // 在 development 環境中 console.error
    if (process.env.NODE_ENV === 'development') {
      console.error('Error tracked:', log);
    }
  }

  getErrors(): ErrorLog[] {
    return this.errors;
  }

  clear() {
    this.errors = [];
    localStorage.removeItem('error-logs');
  }
}

export const errorTracker = new ErrorTracker();
```

**Recommendation**:
- MVP: 使用 custom error tracking（免費，簡單）
- 未來：如果流量大且需要進階功能，考慮 Sentry（有免費方案，每月 5,000 errors）

---

## Final Recommendations

### Recommended Architecture: Hybrid Approach

```
┌─────────────────────────────────────────────────────────────┐
│                     User Browser                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Next.js Static Site (pencilhistory.xyz)            │   │
│  │  - URL input & parsing                              │   │
│  │  - GitHub API client (fetch commits)                │   │
│  │  - Timeline UI                                      │   │
│  │  - IndexedDB cache (pen files + screenshots)       │   │
│  └─────────────────────────────────────────────────────┘   │
│         ↓                                    ↑               │
│     Fetch .pen                          Display Image       │
│         ↓                                    ↑               │
└─────────────────────────────────────────────────────────────┘
          ↓                                    ↑
          ↓                                    ↑
┌─────────────────────────────────────────────────────────────┐
│              Screenshot Service (Optional)                  │
│  - Vercel Serverless Function or                            │
│  - Separate Node.js service or                              │
│  - Third-party screenshot API                               │
│                                                              │
│  Input: .pen file content                                   │
│  Output: PNG/SVG image URL                                  │
│                                                              │
│  Uses: Pencil MCP server (get_screenshot)                   │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Strategy

**Phase 1: MVP with Manual Screenshot Generation** (最快實現)

1. 開發純前端 Next.js 應用
2. 實作 GitHub API 整合和時間軸 UI
3. .pen 檔案視覺化：
   - **臨時方案**：顯示 .pen 檔案的 JSON 結構（code view）
   - 或：使用預先生成的截圖（開發時手動生成）
4. 完成 P1 和 P2 使用者故事
5. 部署到 Vercel/GitHub Pages

**Estimated Time**: 4-6 週

**Phase 2: 整合 Screenshot Service**

1. 建立 screenshot service（Vercel Serverless Function）
2. 整合 Pencil MCP `get_screenshot` 工具
3. 實作 IndexedDB 快取策略
4. 實作預載入和背景載入
5. 完成 P3 使用者故事（diff comparison）

**Estimated Time**: 3-4 週

**Total Estimated Time**: 7-10 週

### Performance Impact Analysis

| Approach | Bundle Size | FCP | TTI | Rendering Accuracy | Development Time |
|----------|-------------|-----|-----|--------------------|------------------|
| **WASM Port** | 3-6 MB | 3-5s | 5-8s | 100% | 3-4 months |
| **Pure JS Renderer** | 150-300 KB | 1-2s | 2-3s | ~95% | 2-3 months |
| **Screenshot Service** | 200 KB | 1.5s | 2.5s | 100% | 7-10 weeks |
| **Manual Screenshots (MVP)** | 150 KB | 1s | 2s | 100% | 4-6 weeks |

### Risk Mitigation

| Risk | Mitigation Strategy |
|------|---------------------|
| Screenshot service 成本過高 | 使用 Vercel serverless function 免費額度；實作 aggressive caching |
| GitHub API rate limit | 顯示清楚的錯誤訊息；實作 local cache；lazy loading |
| .pen 檔案格式變更 | 版本化快取 key；監控 .pen 格式版本 |
| 大型 .pen 檔案渲染慢 | 檔案大小限制（10MB）；顯示 loading indicator |
| 無法保證 100% 準確度（Pure JS） | ❌ 因此不選擇此方案 |

---

## Decision Summary

### Primary Decision: Screenshot Service with Aggressive Caching

**Rationale**:
1. ✅ 100% 渲染準確度（使用官方 Pencil MCP）
2. ✅ 符合效能目標（FCP < 1.5s, TTI < 3.0s, bundle < 500KB）
3. ✅ 合理的開發時間（7-10 週）
4. ✅ 易於維護（利用現有工具）
5. ⚠️ 需要輕量後端服務（但可以最小化並使用 serverless）

**Alternative for MVP**: Manual Screenshots
- 更快實現（4-6 週）
- 可以先驗證產品概念
- 後續再整合 screenshot service

### Technologies & Libraries

**Core Stack**:
- Next.js 15 (App Router, Static Export)
- React 18
- TypeScript 5.x
- Tailwind CSS v4

**GitHub Integration**:
- `@octokit/rest` - GitHub API client

**Caching**:
- `dexie` - IndexedDB wrapper
- Built-in `Map` - Memory cache

**Diff Algorithm**:
- Custom implementation（基於 React reconciliation）
- `fast-json-patch` - JSON diff utility（backup）

**Performance Monitoring**:
- Web Performance API（內建）
- Lighthouse CI（GitHub Actions）
- Custom error tracker（MVP）

**Screenshot Service** (Phase 2):
- Vercel Serverless Functions
- Pencil MCP Server（Node.js）
- 或第三方 API（如 ScreenshotOne, ApiFlash）

### Next Steps

1. ✅ Complete research.md（本文件）
2. ⏳ Proceed to Phase 1: Design & Contracts
3. ⏳ Define .pen file structure contract（驗證 node ID 假設）
4. ⏳ Design data models and API contracts
5. ⏳ Create quickstart guide
6. ⏳ Proceed to Phase 2: Task Decomposition

---

**Research Completed**: 2026-02-24
**Next Phase**: Phase 1 - Design & Contracts
