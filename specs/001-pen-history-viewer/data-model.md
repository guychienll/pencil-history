# Data Model: PencilHistory.xyz

<!--
  憲章要求 (Constitution Requirement):
  本文件必須使用繁體中文（zh-TW）撰寫
  This document MUST be written in Traditional Chinese (zh-TW)
-->

**Feature**: PencilHistory.xyz - Git 歷史視覺化檢視器
**Date**: 2026-02-24
**Branch**: 001-pen-history-viewer

## 概述

本文件定義 PencilHistory.xyz 的核心資料模型，包括實體、欄位、關聯、驗證規則和狀態轉換。

---

## 核心實體

### 1. PenFile (Pen 檔案)

使用者想要檢視歷史的 .pen 設計檔案。

**欄位**：

| 欄位名稱 | 型別 | 必填 | 說明 | 驗證規則 |
|---------|------|------|------|---------|
| `owner` | string | ✓ | GitHub 使用者/組織名稱 | 1-39 字元，英數字與連字號 |
| `repo` | string | ✓ | GitHub repository 名稱 | 1-100 字元，不含空白 |
| `path` | string | ✓ | 檔案在 repository 中的路徑 | 必須以 `.pen` 結尾 |
| `branch` | string | ✓ | Git 分支名稱 | 預設 `main`，從 URL 解析 |
| `size` | number | - | 檔案大小（bytes） | 最大 10MB (10485760 bytes) |
| `url` | string | ✓ | GitHub 檔案 URL | 必須為有效 GitHub URL 格式 |

**關聯**：
- 屬於一個 `Repository`
- 有多個 `FileVersion`（每個 commit 一個）

**驗證規則**：
```typescript
function validatePenFile(file: PenFile): ValidationResult {
  if (!file.path.endsWith('.pen')) {
    return { valid: false, error: '檔案必須為 .pen 格式' };
  }

  if (file.size && file.size > 10485760) {
    return { valid: false, error: '檔案大小超過 10MB 限制' };
  }

  if (!isValidGitHubURL(file.url)) {
    return { valid: false, error: '無效的 GitHub URL' };
  }

  return { valid: true };
}
```

---

### 2. Repository (儲存庫)

.pen 檔案所在的 GitHub 儲存庫。

**欄位**：

| 欄位名稱 | 型別 | 必填 | 說明 | 驗證規則 |
|---------|------|------|------|---------|
| `owner` | string | ✓ | 擁有者名稱 | 1-39 字元 |
| `name` | string | ✓ | Repository 名稱 | 1-100 字元 |
| `fullName` | string | ✓ | 完整名稱 (owner/name) | 格式：`{owner}/{name}` |
| `branch` | string | ✓ | 預設分支 | 通常為 `main` 或 `master` |
| `isPrivate` | boolean | ✓ | 是否為私有 repository | 必須為 `false`（不支援私有） |
| `url` | string | ✓ | Repository URL | GitHub repository URL |

**關聯**：
- 包含多個 `PenFile`
- 有多個 `Commit`

**驗證規則**：
```typescript
function validateRepository(repo: Repository): ValidationResult {
  if (repo.isPrivate) {
    return { valid: false, error: '僅支援公開儲存庫' };
  }

  if (!repo.url.includes('github.com')) {
    return { valid: false, error: '僅支援 GitHub 平台' };
  }

  return { valid: true };
}
```

---

### 3. Commit (Commit 記錄)

Git commit 記錄，代表檔案的某個版本。

**欄位**：

| 欄位名稱 | 型別 | 必填 | 說明 | 驗證規則 |
|---------|------|------|------|---------|
| `sha` | string | ✓ | Commit SHA (唯一識別碼) | 40 字元 hex 字串 |
| `message` | string | ✓ | Commit 訊息 | 最多 72 字元（標題） |
| `author` | Author | ✓ | 作者資訊 | 見 Author 型別 |
| `committer` | Author | ✓ | Committer 資訊 | 見 Author 型別 |
| `date` | Date | ✓ | Commit 日期 | ISO 8601 格式 |
| `parents` | string[] | - | 父 commit SHA 列表 | 每個為 40 字元 hex |
| `url` | string | ✓ | Commit 在 GitHub 的 URL | GitHub commit URL |

**Author 子型別**：
```typescript
interface Author {
  name: string;        // 作者名稱
  email: string;       // 作者 email
  date: Date;          // 時間戳記
}
```

**關聯**：
- 屬於一個 `Repository`
- 有一個 `FileVersion`（該 commit 的檔案內容）
- 有零到多個父 `Commit`（merge commits 有多個父節點）

**排序規則**：
- 預設按 `date` 降序排列（最新在前）
- 分頁：每次載入 100 筆

---

### 4. FileVersion (檔案版本內容)

特定 commit 中的 .pen 檔案完整內容。

**欄位**：

| 欄位名稱 | 型別 | 必填 | 說明 | 驗證規則 |
|---------|------|------|------|---------|
| `sha` | string | ✓ | Commit SHA (關聯 Commit) | 40 字元 hex 字串 |
| `content` | PenFileContent | ✓ | .pen 檔案解析後的 JSON 內容 | 見 PenFileContent 型別 |
| `size` | number | ✓ | 檔案大小（bytes） | 最大 10MB |
| `encoding` | string | - | 檔案編碼 | 通常為 `utf-8` |
| `rawContent` | string | - | 原始檔案內容（base64） | GitHub API 回傳格式 |

**PenFileContent 子型別**：
```typescript
interface PenFileContent {
  version: string;          // .pen 格式版本
  root: PenNode;            // 根節點
  metadata?: {              // 可選 metadata
    createdAt?: Date;
    modifiedAt?: Date;
    author?: string;
  };
}

interface PenNode {
  id: string;               // 節點唯一 ID
  type: string;             // 節點類型 (frame, text, etc.)
  properties: Record<string, any>;  // 節點屬性
  children?: PenNode[];     // 子節點
}
```

**關聯**：
- 屬於一個 `Commit`
- 屬於一個 `PenFile`

**快取規則**：
- 快取 key：`${owner}/${repo}/${path}@${sha}`
- 不可變：commit SHA 不變，內容永不過期
- LRU 淘汰：記憶體快取最多 50 個 FileVersion

---

### 5. VisualDesign (視覺化設計)

.pen 檔案渲染後的視覺化呈現（截圖或渲染輸出）。

**欄位**：

| 欄位名稱 | 型別 | 必填 | 說明 | 驗證規則 |
|---------|------|------|------|---------|
| `sha` | string | ✓ | 關聯的 Commit SHA | 40 字元 hex |
| `screenshotUrl` | string | - | 截圖 URL（Phase 2） | 有效 URL |
| `renderedNodes` | RenderedNode[] | - | 渲染後的節點資訊 | - |
| `width` | number | ✓ | 畫布寬度（px） | > 0 |
| `height` | number | ✓ | 畫布高度（px） | > 0 |
| `generatedAt` | Date | ✓ | 生成時間 | ISO 8601 |

**RenderedNode 子型別**：
```typescript
interface RenderedNode {
  id: string;               // 節點 ID（對應 PenNode.id）
  boundingBox: {            // 邊界框
    x: number;
    y: number;
    width: number;
    height: number;
  };
  visible: boolean;         // 是否可見
}
```

**關聯**：
- 對應一個 `FileVersion`

---

### 6. DiffComparison (差異比較)

兩個不同 commit 版本之間的變更資訊（P3 功能）。

**欄位**：

| 欄位名稱 | 型別 | 必填 | 說明 | 驗證規則 |
|---------|------|------|------|---------|
| `fromSha` | string | ✓ | 比較起點 commit SHA | 40 字元 hex |
| `toSha` | string | ✓ | 比較終點 commit SHA | 40 字元 hex |
| `added` | NodeDiff[] | ✓ | 新增的節點 | - |
| `deleted` | NodeDiff[] | ✓ | 刪除的節點 | - |
| `modified` | NodeDiff[] | ✓ | 修改的節點 | - |
| `moved` | NodeDiff[] | ✓ | 移動的節點 | - |
| `computedAt` | Date | ✓ | Diff 計算時間 | ISO 8601 |

**NodeDiff 子型別**：
```typescript
interface NodeDiff {
  nodeId: string;                    // 節點 ID
  type: 'added' | 'deleted' | 'modified' | 'moved';
  path: string[];                    // 節點路徑（從 root）
  oldNode?: PenNode;                 // 舊節點（deleted/modified）
  newNode?: PenNode;                 // 新節點（added/modified）
  propertyChanges?: PropertyChange[]; // 屬性變更（modified）
}

interface PropertyChange {
  property: string;                  // 屬性名稱（JSON pointer）
  operation: 'add' | 'remove' | 'replace';
  oldValue?: any;
  newValue?: any;
}
```

**關聯**：
- 關聯兩個 `FileVersion`（from 和 to）

**快取規則**：
- 快取 key：`diff:${fromSha}:${toSha}`
- Diff 結果可快取（commit pair 不變）
- 使用 Memoization 避免重複計算

---

## 狀態轉換

### FileVersion 載入狀態

```
[未載入] --使用者選擇 commit--> [載入中]
    |                                  |
    |                                  | API 成功
    |                                  v
    |                              [已載入]
    |                                  |
    |<--快取命中-------------------------
    |
    |--API 失敗--> [錯誤狀態]
```

**狀態定義**：

| 狀態 | 說明 | 可能操作 |
|------|------|---------|
| 未載入 | FileVersion 尚未載入 | 發起載入 |
| 載入中 | API 請求進行中 | 顯示 loading indicator，可取消 |
| 已載入 | 內容已載入並渲染 | 檢視、切換、比較 |
| 錯誤狀態 | 載入失敗 | 重試、返回 |

### DiffComparison 計算狀態

```
[未計算] --使用者選擇兩個 commits--> [計算中]
    |                                       |
    |                                       | 計算完成
    |                                       v
    |                                   [已完成]
    |                                       |
    |<--快取命中-----------------------------|
    |
    |--計算失敗--> [錯誤狀態]
```

---

## 資料流程

### 1. 載入 Commit 歷史

```
使用者輸入 URL
    ↓
解析 URL → PenFile, Repository
    ↓
呼叫 GitHub API 擷取 commits
    ↓
回傳 Commit[] (最多 100 筆)
    ↓
顯示時間軸
```

### 2. Lazy Loading FileVersion

```
使用者點擊 Commit 節點
    ↓
檢查記憶體快取（LRU Cache）
    ↓ 快取未命中
呼叫 GitHub API 擷取檔案內容
    ↓
解析 .pen JSON → FileVersion
    ↓
渲染 VisualDesign
    ↓
儲存至快取
```

### 3. Diff 比較（P3）

```
使用者選擇兩個 commits
    ↓
載入兩個 FileVersion（可能觸發 API）
    ↓
執行 node-level structural diff
    ↓
生成 DiffComparison
    ↓
視覺化標示變更
```

---

## 關聯圖

```
Repository
    │
    ├─── PenFile (1:N)
    │       │
    │       └─── FileVersion (1:N)
    │               │
    │               └─── VisualDesign (1:1)
    │
    └─── Commit (1:N)
            │
            └─── FileVersion (1:1)

DiffComparison (關聯兩個 FileVersion)
```

---

## TypeScript 型別定義

```typescript
// src/types/app.ts

export interface PenFile {
  owner: string;
  repo: string;
  path: string;
  branch: string;
  size?: number;
  url: string;
}

export interface Repository {
  owner: string;
  name: string;
  fullName: string;
  branch: string;
  isPrivate: boolean;
  url: string;
}

export interface Commit {
  sha: string;
  message: string;
  author: Author;
  committer: Author;
  date: Date;
  parents: string[];
  url: string;
}

export interface Author {
  name: string;
  email: string;
  date: Date;
}

export interface FileVersion {
  sha: string;
  content: PenFileContent;
  size: number;
  encoding?: string;
  rawContent?: string;
}

export interface PenFileContent {
  version: string;
  root: PenNode;
  metadata?: {
    createdAt?: Date;
    modifiedAt?: Date;
    author?: string;
  };
}

export interface PenNode {
  id: string;
  type: string;
  properties: Record<string, any>;
  children?: PenNode[];
}

export interface VisualDesign {
  sha: string;
  screenshotUrl?: string;
  renderedNodes?: RenderedNode[];
  width: number;
  height: number;
  generatedAt: Date;
}

export interface RenderedNode {
  id: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  visible: boolean;
}

export interface DiffComparison {
  fromSha: string;
  toSha: string;
  added: NodeDiff[];
  deleted: NodeDiff[];
  modified: NodeDiff[];
  moved: NodeDiff[];
  computedAt: Date;
}

export interface NodeDiff {
  nodeId: string;
  type: 'added' | 'deleted' | 'modified' | 'moved';
  path: string[];
  oldNode?: PenNode;
  newNode?: PenNode;
  propertyChanges?: PropertyChange[];
}

export interface PropertyChange {
  property: string;
  operation: 'add' | 'remove' | 'replace';
  oldValue?: any;
  newValue?: any;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}
```

---

## 索引與查詢最佳化

### 記憶體快取索引

**LRU Cache by Commit SHA**：
- Key: `${owner}/${repo}/${path}@${sha}`
- Value: `FileVersion`
- Max size: 50 items
- Eviction: LRU (Least Recently Used)

### LocalStorage 索引

**最近檢視的 Repositories**：
- Key: `pencilhistory:recentRepos`
- Value: `Array<{ owner, repo, path, lastViewed }>`
- Max: 10 items

**UI 偏好**：
- Key: `pencilhistory:preferences`
- Value: `{ playbackSpeed: number }`

---

## 資料驗證規則總結

| 實體 | 關鍵驗證 |
|------|---------|
| PenFile | 必須 `.pen` 結尾，檔案 < 10MB，有效 GitHub URL |
| Repository | 必須公開，必須 GitHub 平台 |
| Commit | SHA 必須 40 字元 hex |
| FileVersion | Content 必須可解析為 JSON，符合 .pen schema |
| DiffComparison | fromSha ≠ toSha，兩個 SHA 必須存在 |

---

**文件版本**：1.0.0
**最後更新**：2026-02-24
**狀態**：完成 ✅
