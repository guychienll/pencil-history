# GitHub API Integration Contract

<!--
  憲章要求 (Constitution Requirement):
  本文件必須使用繁體中文（zh-TW）撰寫
  This document MUST be written in Traditional Chinese (zh-TW)
-->

**Feature**: PencilHistory.xyz - Git 歷史視覺化檢視器
**Date**: 2026-02-24
**Branch**: 001-pen-history-viewer

## 概述

本文件定義 PencilHistory.xyz 與 GitHub REST API 的整合契約，包括所需端點、請求/回應格式、錯誤處理和速率限制策略。

---

## API 版本與認證

**API 版本**：GitHub REST API v3
**Base URL**：`https://api.github.com`
**認證方式**：匿名請求（無 token）
**速率限制**：60 請求/小時/IP

**User-Agent Header**：
```
User-Agent: PencilHistory.xyz v1.0
```

---

## 端點契約

### 1. 擷取 Commit 歷史

**端點**：`GET /repos/{owner}/{repo}/commits`

**用途**：擷取指定 repository 和檔案路徑的 commit 歷史。

**請求參數**：

| 參數 | 類型 | 必填 | 說明 | 範例 |
|------|------|------|------|------|
| `owner` | string | ✓ | Repository 擁有者 | `facebook` |
| `repo` | string | ✓ | Repository 名稱 | `react` |
| `path` | string | - | 檔案路徑篩選 | `packages/react/src/React.js` |
| `sha` | string | - | 分支或 commit SHA | `main` |
| `per_page` | number | - | 每頁結果數（預設 30，最大 100） | `100` |
| `page` | number | - | 頁碼（預設 1） | `1` |
| `since` | string | - | 起始日期（ISO 8601） | `2024-01-01T00:00:00Z` |
| `until` | string | - | 結束日期（ISO 8601） | `2024-12-31T23:59:59Z` |

**請求範例**：
```http
GET /repos/facebook/react/commits?path=packages/react/src/React.js&per_page=100&page=1
Host: api.github.com
User-Agent: PencilHistory.xyz v1.0
Accept: application/vnd.github+json
```

**回應格式**：
```typescript
interface CommitResponse {
  sha: string;                    // Commit SHA (40 字元)
  node_id: string;                // GraphQL node ID
  commit: {
    message: string;              // Commit 訊息
    author: {
      name: string;               // 作者名稱
      email: string;              // 作者 email
      date: string;               // ISO 8601 日期
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: {                       // GitHub 使用者資訊
    login: string;
    avatar_url: string;
  } | null;
  committer: {
    login: string;
    avatar_url: string;
  } | null;
  parents: Array<{
    sha: string;
    url: string;
  }>;
  url: string;                    // API URL
  html_url: string;               // GitHub 網頁 URL
}

type CommitsListResponse = CommitResponse[];
```

**回應範例**：
```json
[
  {
    "sha": "abc123def456...",
    "commit": {
      "message": "Fix bug in component",
      "author": {
        "name": "John Doe",
        "email": "john@example.com",
        "date": "2024-02-20T10:30:00Z"
      },
      "committer": {
        "name": "John Doe",
        "email": "john@example.com",
        "date": "2024-02-20T10:30:00Z"
      }
    },
    "author": {
      "login": "johndoe",
      "avatar_url": "https://avatars.githubusercontent.com/..."
    },
    "parents": [
      {
        "sha": "parent123...",
        "url": "https://api.github.com/repos/facebook/react/commits/parent123..."
      }
    ],
    "url": "https://api.github.com/repos/facebook/react/commits/abc123def456...",
    "html_url": "https://github.com/facebook/react/commit/abc123def456..."
  }
]
```

**回應 Headers（重要）**：
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1708430400
X-RateLimit-Used: 15
ETag: W/"abc123..."
Cache-Control: public, max-age=60, s-maxage=60
```

**錯誤回應**：

| HTTP 狀態碼 | 說明 | 回應範例 |
|------------|------|---------|
| 404 | Repository 或路徑不存在 | `{ "message": "Not Found" }` |
| 403 | 速率限制超過或私有 repository | `{ "message": "API rate limit exceeded" }` |
| 422 | 無效參數 | `{ "message": "Validation Failed" }` |

---

### 2. 擷取檔案內容

**端點**：`GET /repos/{owner}/{repo}/contents/{path}`

**用途**：擷取特定 commit 的檔案內容。

**請求參數**：

| 參數 | 類型 | 必填 | 說明 | 範例 |
|------|------|------|------|------|
| `owner` | string | ✓ | Repository 擁有者 | `facebook` |
| `repo` | string | ✓ | Repository 名稱 | `react` |
| `path` | string | ✓ | 檔案路徑 | `src/App.pen` |
| `ref` | string | - | 分支或 commit SHA | `abc123def456...` |

**請求範例**：
```http
GET /repos/facebook/react/contents/src/App.pen?ref=abc123def456
Host: api.github.com
User-Agent: PencilHistory.xyz v1.0
Accept: application/vnd.github+json
```

**回應格式**：
```typescript
interface FileContentResponse {
  name: string;                   // 檔案名稱
  path: string;                   // 檔案路徑
  sha: string;                    // 檔案 blob SHA
  size: number;                   // 檔案大小（bytes）
  url: string;                    // API URL
  html_url: string;               // GitHub 網頁 URL
  git_url: string;                // Git blob URL
  download_url: string;           // 直接下載 URL
  type: 'file';                   // 類型（file/dir/symlink）
  content: string;                // Base64 編碼內容
  encoding: 'base64';             // 編碼方式
  _links: {
    self: string;
    git: string;
    html: string;
  };
}
```

**回應範例**：
```json
{
  "name": "App.pen",
  "path": "src/App.pen",
  "sha": "file123...",
  "size": 5432,
  "url": "https://api.github.com/repos/facebook/react/contents/src/App.pen?ref=abc123",
  "html_url": "https://github.com/facebook/react/blob/abc123/src/App.pen",
  "download_url": "https://raw.githubusercontent.com/facebook/react/abc123/src/App.pen",
  "type": "file",
  "content": "ewogICJ2ZXJzaW9uIjogIjEuMC4wIiwKICAicm9vdCI6IHsKICAgICJpZCI6...",
  "encoding": "base64",
  "_links": {
    "self": "https://api.github.com/repos/facebook/react/contents/src/App.pen?ref=abc123",
    "git": "https://api.github.com/repos/facebook/react/git/blobs/file123",
    "html": "https://github.com/facebook/react/blob/abc123/src/App.pen"
  }
}
```

**解碼內容**：
```typescript
function decodeFileContent(response: FileContentResponse): string {
  return atob(response.content.replace(/\n/g, ''));
}
```

**錯誤回應**：

| HTTP 狀態碼 | 說明 | 處理方式 |
|------------|------|---------|
| 404 | 檔案在此 commit 不存在 | 顯示「檔案在此版本不存在」 |
| 403 | 速率限制或私有 repository | 顯示速率限制訊息或私有錯誤 |
| 413 | 檔案過大（> 1MB） | GitHub API 限制，使用 `download_url` 或 Git Blob API |

---

### 3. 檢查速率限制狀態

**端點**：`GET /rate_limit`

**用途**：查詢當前 IP 的速率限制狀態（**不消耗 quota**）。

**請求範例**：
```http
GET /rate_limit
Host: api.github.com
User-Agent: PencilHistory.xyz v1.0
Accept: application/vnd.github+json
```

**回應格式**：
```typescript
interface RateLimitResponse {
  resources: {
    core: {
      limit: number;              // 總限制
      used: number;               // 已使用
      remaining: number;          // 剩餘
      reset: number;              // Reset 時間（Unix timestamp）
    };
  };
  rate: {                         // 匿名請求的速率
    limit: number;
    used: number;
    remaining: number;
    reset: number;
  };
}
```

**回應範例**：
```json
{
  "resources": {
    "core": {
      "limit": 60,
      "used": 15,
      "remaining": 45,
      "reset": 1708430400
    }
  },
  "rate": {
    "limit": 60,
    "used": 15,
    "remaining": 45,
    "reset": 1708430400
  }
}
```

---

## 條件請求（Conditional Requests）

### 使用 ETag 節省 Quota

**目的**：當資料未變更時，GitHub 回傳 `304 Not Modified`，**不計入速率限制**。

**第一次請求**：
```http
GET /repos/facebook/react/commits
User-Agent: PencilHistory.xyz v1.0
Accept: application/vnd.github+json
```

**回應包含 ETag**：
```http
HTTP/1.1 200 OK
ETag: W/"abc123def456..."
Content-Type: application/json
...
```

**後續請求（帶 ETag）**：
```http
GET /repos/facebook/react/commits
User-Agent: PencilHistory.xyz v1.0
Accept: application/vnd.github+json
If-None-Match: W/"abc123def456..."
```

**若內容未變更**：
```http
HTTP/1.1 304 Not Modified
ETag: W/"abc123def456..."
X-RateLimit-Remaining: 45  ← 不減少！
```

**實作範例**：
```typescript
async function fetchWithETag(url: string, cachedETag?: string) {
  const headers: Record<string, string> = {
    'User-Agent': 'PencilHistory.xyz v1.0',
    'Accept': 'application/vnd.github+json',
  };

  if (cachedETag) {
    headers['If-None-Match'] = cachedETag;
  }

  const response = await fetch(url, { headers });

  if (response.status === 304) {
    // 使用快取資料，不消耗 API quota
    return { fromCache: true };
  }

  const data = await response.json();
  const etag = response.headers.get('ETag');

  return { data, etag, fromCache: false };
}
```

---

## 錯誤處理契約

### 速率限制超過（403/429）

**偵測**：
```typescript
if (
  (response.status === 403 || response.status === 429) &&
  response.headers.get('X-RateLimit-Remaining') === '0'
) {
  // 速率限制超過
}
```

**取得恢復時間**：
```typescript
const resetTimestamp = parseInt(response.headers.get('X-RateLimit-Reset') || '0');
const resetDate = new Date(resetTimestamp * 1000);
const minutesUntilReset = Math.ceil((resetDate.getTime() - Date.now()) / 60000);
```

**使用者訊息**：
```
GitHub API 速率限制已達上限（60 請求/小時）
將在 ${minutesUntilReset} 分鐘後恢復（${resetDate.toLocaleTimeString()}）
```

### 網路錯誤

**偵測**：
```typescript
try {
  const response = await fetch(url);
} catch (error) {
  if (error.name === 'TypeError') {
    // 網路錯誤（使用者離線或 GitHub 不可用）
    return { error: 'network', message: '網路連線失敗，請檢查網路狀態' };
  }
}
```

### Repository 不存在（404）

**使用者訊息**：
```
找不到此 repository 或檔案
請確認 URL 是否正確
```

### 私有 Repository（404/403）

**偵測**：GitHub API 對私有 repository 回傳 404（非 403，出於安全考量）

**使用者訊息**：
```
僅支援公開 repository
若此為私有 repository，請將其設為公開後重試
```

---

## 效能最佳化策略

### 1. 使用 `path` 參數篩選

**不好**：
```http
GET /repos/facebook/react/commits?per_page=100
```
回傳所有檔案的 commits（包含不相關的）

**好**：
```http
GET /repos/facebook/react/commits?path=src/App.pen&per_page=100
```
僅回傳影響 `src/App.pen` 的 commits（減少 90%+ 資料）

### 2. 使用 `per_page=100`

預設 `per_page=30`，但最大可設為 100，減少請求次數。

### 3. 快取所有回應

**快取 key 格式**：
```
commits:${owner}/${repo}:${path}
content:${owner}/${repo}:${path}@${sha}
```

**快取策略**：
- Commits list：快取 5 分鐘，使用 ETag 驗證
- File content：永久快取（commit SHA 不變）

### 4. 批次請求（避免循環呼叫 API）

**不好**：
```typescript
for (const commit of commits) {
  await fetchFileContent(owner, repo, path, commit.sha); // 100 次 API 呼叫！
}
```

**好**：
```typescript
// 僅在使用者點擊時載入
onClick={(commit) => fetchFileContent(owner, repo, path, commit.sha)}
```

---

## 測試契約

### 契約測試（Contract Tests）

**測試目標**：驗證 GitHub API 回應符合預期格式。

**測試案例**：

```typescript
describe('GitHub API Contract Tests', () => {
  it('GET /repos/:owner/:repo/commits 回應格式正確', async () => {
    const response = await fetch('https://api.github.com/repos/facebook/react/commits?per_page=1');
    const data = await response.json();

    expect(Array.isArray(data)).toBe(true);
    expect(data[0]).toHaveProperty('sha');
    expect(data[0]).toHaveProperty('commit.message');
    expect(data[0]).toHaveProperty('commit.author.date');
    expect(data[0].sha).toMatch(/^[a-f0-9]{40}$/);
  });

  it('GET /repos/:owner/:repo/contents/:path 回應格式正確', async () => {
    const response = await fetch('https://api.github.com/repos/facebook/react/contents/README.md');
    const data = await response.json();

    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('content');
    expect(data).toHaveProperty('encoding', 'base64');
    expect(data.type).toBe('file');
  });

  it('速率限制 headers 存在', async () => {
    const response = await fetch('https://api.github.com/rate_limit');

    expect(response.headers.has('X-RateLimit-Limit')).toBe(true);
    expect(response.headers.has('X-RateLimit-Remaining')).toBe(true);
    expect(response.headers.has('X-RateLimit-Reset')).toBe(true);
  });

  it('ETag 條件請求回傳 304', async () => {
    const url = 'https://api.github.com/repos/facebook/react/commits?per_page=1';

    // 第一次請求
    const firstResponse = await fetch(url);
    const etag = firstResponse.headers.get('ETag');

    // 第二次請求帶 ETag
    const secondResponse = await fetch(url, {
      headers: { 'If-None-Match': etag! }
    });

    expect(secondResponse.status).toBe(304);
  });
});
```

---

## 參考資源

**官方文件**：
- [GitHub REST API Documentation](https://docs.github.com/en/rest)
- [Rate limiting](https://docs.github.com/en/rest/overview/rate-limits-for-the-rest-api)
- [Conditional requests](https://docs.github.com/en/rest/overview/resources-in-the-rest-api#conditional-requests)

**相關端點**：
- [List commits](https://docs.github.com/en/rest/commits/commits#list-commits)
- [Get repository content](https://docs.github.com/en/rest/repos/contents#get-repository-content)
- [Get rate limit status](https://docs.github.com/en/rest/rate-limit/rate-limit#get-rate-limit-status-for-the-authenticated-user)

---

**文件版本**：1.0.0
**最後更新**：2026-02-24
**狀態**：完成 ✅
