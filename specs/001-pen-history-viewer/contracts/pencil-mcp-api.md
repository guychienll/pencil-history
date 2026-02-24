# Pencil MCP Screenshot API Contract

<!--
  憲章要求 (Constitution Requirement):
  本文件必須使用繁體中文（zh-TW）撰寫
  This document MUST be written in Traditional Chinese (zh-TW)
-->

**Feature**: PencilHistory.xyz - Git 歷史視覺化檢視器
**Date**: 2026-02-24
**Branch**: 001-pen-history-viewer

## 概述

本文件定義 PencilHistory.xyz 後端 API 如何整合 Pencil MCP server 生成 .pen 檔案截圖的契約，包括 API 端點設計、Pencil MCP 呼叫方式、快取策略和錯誤處理。

---

## 架構概覽

```
使用者瀏覽器
    ↓ HTTP POST
Next.js Serverless API (/api/screenshot)
    ↓ MCP Protocol
Pencil MCP Server (get_screenshot tool)
    ↓ Screenshot Image
返回給使用者（Base64 或 URL）
```

**關鍵決策**：

- 使用 Next.js API Routes（Vercel Serverless Functions）
- 透過 `@modelcontextprotocol/sdk` 與 Pencil MCP server 通訊
- 呼叫 Pencil MCP 的 `get_screenshot` 工具
- 截圖快取於 IndexedDB（客戶端）+ 可選的 CDN 快取

---

## API 端點設計

### POST /api/screenshot

**用途**：接收 .pen 檔案內容，呼叫 Pencil MCP server 生成截圖，返回截圖 URL 或 Base64。

**請求格式**：

```typescript
interface ScreenshotRequest {
  penFile: {
    version: string; // .pen 格式版本
    root: PenNode; // .pen 根節點
    metadata?: any; // 可選 metadata
  };
  options?: {
    width?: number; // 截圖寬度（預設：自動）
    height?: number; // 截圖高度（預設：自動）
    format?: "png" | "jpg"; // 圖片格式（預設：png）
    quality?: number; // 品質 0-100（jpg 專用，預設：90）
    nodeId?: string; // 特定節點 ID（可選，預設：root）
  };
  cache?: {
    key: string; // 快取 key（通常為 commit SHA）
    ttl?: number; // 快取 TTL（秒，預設：86400 = 24 小時）
  };
}
```

**請求範例**：

```http
POST /api/screenshot HTTP/1.1
Host: pencilhistory.xyz
Content-Type: application/json

{
  "penFile": {
    "version": "1.0.0",
    "root": {
      "id": "document",
      "type": "document",
      "properties": {
        "width": 375,
        "height": 812
      },
      "children": [...]
    }
  },
  "options": {
    "width": 800,
    "format": "png"
  },
  "cache": {
    "key": "abc123def456...",
    "ttl": 86400
  }
}
```

**回應格式**：

```typescript
interface ScreenshotResponse {
  success: boolean;
  screenshot: {
    format: "png" | "jpg";
    width: number;
    height: number;
    dataUrl?: string; // Base64 data URL（小圖）
    url?: string; // CDN URL（大圖，Phase 2）
    size: number; // 檔案大小（bytes）
  };
  cache: {
    key: string;
    hit: boolean; // 是否快取命中
    expiresAt: string; // 快取過期時間（ISO 8601）
  };
  performance: {
    generationTime: number; // 生成時間（ms）
    totalTime: number; // 總時間（ms）
  };
}
```

**回應範例（成功）**：

```json
{
  "success": true,
  "screenshot": {
    "format": "png",
    "width": 800,
    "height": 1200,
    "dataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "size": 45678
  },
  "cache": {
    "key": "abc123def456...",
    "hit": false,
    "expiresAt": "2024-02-21T10:30:00Z"
  },
  "performance": {
    "generationTime": 1250,
    "totalTime": 1280
  }
}
```

**錯誤回應**：

```typescript
interface ScreenshotError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

**錯誤範例**：

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PEN_FILE",
    "message": "Invalid .pen file structure: missing root node",
    "details": {
      "field": "root",
      "expected": "PenNode object"
    }
  }
}
```

---

## Pencil MCP 整合

### 1. 初始化 MCP Client

```typescript
// app/api/screenshot/pencil-mcp-client.ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

let mcpClient: Client | null = null;

export async function getMCPClient(): Promise<Client> {
  if (mcpClient) {
    return mcpClient;
  }

  // 啟動 Pencil MCP server process
  const transport = new StdioClientTransport({
    command: "node",
    args: ["/path/to/pencil-mcp-server/build/index.js"],
    env: process.env,
  });

  mcpClient = new Client(
    {
      name: "pencilhistory-client",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  await mcpClient.connect(transport);

  return mcpClient;
}
```

### 2. 呼叫 get_screenshot 工具

```typescript
// app/api/screenshot/generate.ts
import { getMCPClient } from "./pencil-mcp-client";

interface GenerateScreenshotOptions {
  penFile: any;
  nodeId?: string;
  width?: number;
  height?: number;
}

export async function generateScreenshot(
  options: GenerateScreenshotOptions
): Promise<{ dataUrl: string; width: number; height: number }> {
  const client = await getMCPClient();

  // 呼叫 Pencil MCP 的 get_screenshot 工具
  const result = await client.callTool({
    name: "get_screenshot",
    arguments: {
      filePath: null, // 不使用檔案路徑，直接傳入內容
      fileContent: JSON.stringify(options.penFile),
      nodeId: options.nodeId || "root",
      width: options.width,
      height: options.height,
    },
  });

  // 解析回應
  if (!result.content || result.content.length === 0) {
    throw new Error("Pencil MCP returned empty response");
  }

  const content = result.content[0];

  if (content.type === "image") {
    return {
      dataUrl: content.data, // Base64 data URL
      width: content.mimeType.includes("png") ? options.width || 800 : options.width || 800,
      height: content.mimeType.includes("png") ? options.height || 600 : options.height || 600,
    };
  }

  throw new Error(`Unexpected response type: ${content.type}`);
}
```

### 3. API Route 實作

```typescript
// app/api/screenshot/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateScreenshot } from "./generate";
import { validatePenFile } from "@/lib/pen/validator";

export const runtime = "nodejs"; // 必須使用 Node.js runtime（非 Edge）
export const maxDuration = 10; // Vercel timeout 限制

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. 驗證請求
    if (!body.penFile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_PEN_FILE",
            message: "penFile is required",
          },
        },
        { status: 400 }
      );
    }

    // 2. 驗證 .pen 檔案格式
    const validation = validatePenFile(body.penFile);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_PEN_FILE",
            message: validation.error,
          },
        },
        { status: 400 }
      );
    }

    // 3. 檢查檔案大小
    const penFileSize = JSON.stringify(body.penFile).length;
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (penFileSize > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FILE_TOO_LARGE",
            message: `File size ${(penFileSize / 1024 / 1024).toFixed(2)}MB exceeds 10MB limit`,
          },
        },
        { status: 413 }
      );
    }

    // 4. 生成截圖
    const startTime = Date.now();
    const screenshot = await generateScreenshot({
      penFile: body.penFile,
      nodeId: body.options?.nodeId,
      width: body.options?.width,
      height: body.options?.height,
    });
    const generationTime = Date.now() - startTime;

    // 5. 返回回應
    return NextResponse.json({
      success: true,
      screenshot: {
        format: "png",
        width: screenshot.width,
        height: screenshot.height,
        dataUrl: screenshot.dataUrl,
        size: screenshot.dataUrl.length,
      },
      cache: {
        key: body.cache?.key || "no-cache",
        hit: false,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      },
      performance: {
        generationTime,
        totalTime: Date.now() - startTime,
      },
    });
  } catch (error: any) {
    console.error("Screenshot generation error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SCREENSHOT_GENERATION_FAILED",
          message: error.message || "Unknown error",
          details: process.env.NODE_ENV === "development" ? error.stack : undefined,
        },
      },
      { status: 500 }
    );
  }
}
```

---

## 客戶端整合

### 1. Screenshot Service（前端）

```typescript
// src/lib/pen/screenshot-service.ts
import { get, set } from "idb-keyval";

interface ScreenshotOptions {
  penFile: any;
  nodeId?: string;
  width?: number;
  height?: number;
}

export async function getScreenshot(
  commitSha: string,
  options: ScreenshotOptions
): Promise<string> {
  // 1. 檢查 IndexedDB 快取
  const cacheKey = `screenshot:${commitSha}:${options.nodeId || "root"}`;
  const cached = await get<string>(cacheKey);

  if (cached) {
    console.log("Screenshot cache hit:", cacheKey);
    return cached;
  }

  // 2. 呼叫 API 生成截圖
  const response = await fetch("/api/screenshot", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      penFile: options.penFile,
      options: {
        nodeId: options.nodeId,
        width: options.width || 800,
        height: options.height,
        format: "png",
      },
      cache: {
        key: commitSha,
        ttl: 86400, // 24 小時
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Screenshot generation failed");
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || "Unknown error");
  }

  // 3. 快取截圖
  await set(cacheKey, data.screenshot.dataUrl);

  return data.screenshot.dataUrl;
}
```

### 2. React Hook

```typescript
// src/hooks/useScreenshot.ts
import { useState, useEffect } from "react";
import { getScreenshot } from "@/lib/pen/screenshot-service";

export function useScreenshot(commitSha: string, penFile: any, nodeId?: string) {
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    getScreenshot(commitSha, { penFile, nodeId })
      .then((dataUrl) => {
        if (!cancelled) {
          setScreenshot(dataUrl);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [commitSha, penFile, nodeId]);

  return { screenshot, loading, error };
}
```

### 3. 使用範例

```typescript
// app/history/[owner]/[repo]/[...path]/CommitViewer.tsx
'use client';

import { useScreenshot } from '@/hooks/useScreenshot';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { ErrorMessage } from '@/components/layout/ErrorMessage';

export function CommitViewer({ commit, penFile }: Props) {
  const { screenshot, loading, error } = useScreenshot(
    commit.sha,
    penFile
  );

  if (loading) {
    return <LoadingSpinner message="生成截圖中..." />;
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  return (
    <div className="pen-viewer">
      <img
        src={screenshot}
        alt={`Commit ${commit.sha.slice(0, 7)}`}
        className="w-full h-auto"
      />
    </div>
  );
}
```

---

## 錯誤處理

### 錯誤碼定義

| 錯誤碼                         | HTTP 狀態碼 | 說明                       | 使用者訊息               |
| ------------------------------ | ----------- | -------------------------- | ------------------------ |
| `MISSING_PEN_FILE`             | 400         | 缺少 penFile 欄位          | 無效的請求格式           |
| `INVALID_PEN_FILE`             | 400         | .pen 檔案格式錯誤          | .pen 檔案格式不正確      |
| `FILE_TOO_LARGE`               | 413         | 檔案超過 10MB              | 檔案過大，無法生成截圖   |
| `SCREENSHOT_GENERATION_FAILED` | 500         | Pencil MCP 生成失敗        | 截圖生成失敗，請稍後再試 |
| `MCP_SERVER_UNAVAILABLE`       | 503         | Pencil MCP server 無法連線 | 服務暫時不可用           |
| `TIMEOUT`                      | 504         | 生成時間超過 10 秒         | 處理超時，請稍後再試     |

### Timeout 處理

```typescript
// app/api/screenshot/route.ts
export async function POST(request: NextRequest) {
  const timeoutPromise = new Promise(
    (_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 9000) // 9 秒（留 1 秒緩衝）
  );

  try {
    const result = await Promise.race([generateScreenshot(options), timeoutPromise]);

    // ...
  } catch (error: any) {
    if (error.message === "TIMEOUT") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "TIMEOUT",
            message: "Screenshot generation timeout (>9s)",
          },
        },
        { status: 504 }
      );
    }
    // ...
  }
}
```

---

## 效能最佳化

### 1. 快取策略

**層級 1：IndexedDB（客戶端）**

- Key: `screenshot:${commitSha}:${nodeId}`
- TTL: 24 小時（可調整）
- 大小限制：無（IndexedDB 通常 > 50MB）

**層級 2：Memory Cache（客戶端，Session）**

- 用於當前 session 快速存取
- 最多快取 50 個截圖
- LRU 淘汰

**層級 3：CDN（Phase 2，可選）**

- 將截圖上傳至 CDN（如 Cloudinary、Vercel Blob）
- 回傳 CDN URL 而非 Base64
- 減少 API payload 大小

### 2. 預載入（Prefetching）

```typescript
// src/lib/pen/prefetch.ts
export function prefetchAdjacentScreenshots(
  commits: Commit[],
  currentIndex: number,
  penFiles: Map<string, any>
) {
  // 預載入前後各 2 個 commit
  const range = 2;
  const start = Math.max(0, currentIndex - range);
  const end = Math.min(commits.length - 1, currentIndex + range);

  for (let i = start; i <= end; i++) {
    if (i === currentIndex) continue; // 跳過當前

    const commit = commits[i];
    const penFile = penFiles.get(commit.sha);

    if (penFile) {
      // 背景預載入（不阻塞）
      getScreenshot(commit.sha, { penFile }).catch(() => {
        // 忽略錯誤
      });
    }
  }
}
```

### 3. 壓縮

- PNG 截圖可壓縮（lossy 或 lossless）
- 考慮使用 WebP 格式（更小，但相容性稍差）
- 大圖使用 CDN URL，小圖（< 100KB）使用 Base64

---

## 測試契約

### 契約測試

```typescript
describe("POST /api/screenshot Contract Tests", () => {
  it("接受有效的 .pen 檔案並返回截圖", async () => {
    const response = await fetch("/api/screenshot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        penFile: validPenFile,
        options: { width: 800 },
        cache: { key: "test-key" },
      }),
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.screenshot).toHaveProperty("dataUrl");
    expect(data.screenshot.dataUrl).toMatch(/^data:image\/png;base64,/);
    expect(data.screenshot.width).toBe(800);
  });

  it("拒絕無效的 .pen 檔案", async () => {
    const response = await fetch("/api/screenshot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        penFile: { version: "1.0.0" }, // 缺少 root
      }),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("INVALID_PEN_FILE");
  });

  it("拒絕過大的檔案", async () => {
    const largePenFile = {
      version: "1.0.0",
      root: {
        id: "root",
        type: "frame",
        children: Array(100000).fill({ id: "node", type: "frame" }),
      },
    };

    const response = await fetch("/api/screenshot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ penFile: largePenFile }),
    });

    expect(response.status).toBe(413);
    expect(data.error.code).toBe("FILE_TOO_LARGE");
  });
});
```

---

## 部署配置

### Vercel 配置

```json
// vercel.json
{
  "functions": {
    "app/api/screenshot/route.ts": {
      "maxDuration": 10,
      "memory": 1024
    }
  }
}
```

### 環境變數

```bash
# .env.local
PENCIL_MCP_SERVER_PATH=/path/to/pencil-mcp-server/build/index.js
NODE_ENV=production
```

---

**文件版本**：1.0.0
**最後更新**：2026-02-24
**狀態**：完成 ✅
