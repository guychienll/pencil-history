# .pen File Structure Contract

<!--
  憲章要求 (Constitution Requirement):
  本文件必須使用繁體中文（zh-TW）撰寫
  This document MUST be written in Traditional Chinese (zh-TW)
-->

**Feature**: PencilHistory.xyz - Git 歷史視覺化檢視器
**Date**: 2026-02-24
**Branch**: 001-pen-history-viewer

## 概述

本文件定義 .pen 檔案的結構契約，包括 JSON schema、節點類型、屬性規則和驗證要求。PencilHistory.xyz 必須能夠解析並驗證 .pen 檔案格式以進行視覺化渲染和 diff 比較。

---

## .pen 檔案格式

**.pen 檔案**是 JSON 格式的設計檔案，描述視覺設計的節點樹狀結構。

**檔案副檔名**：`.pen`
**MIME Type**：`application/json`
**編碼**：UTF-8

---

## 根結構（Root Structure）

```typescript
interface PenFile {
  version: string;              // .pen 格式版本（例如 "1.0.0"）
  root: PenNode;                // 根節點（通常為 document 或 canvas）
  metadata?: PenMetadata;       // 可選的檔案 metadata
}

interface PenMetadata {
  createdAt?: string;           // ISO 8601 日期
  modifiedAt?: string;          // ISO 8601 日期
  author?: string;              // 作者名稱
  description?: string;         // 檔案說明
  [key: string]: any;           // 其他自訂 metadata
}
```

**最小有效 .pen 檔案範例**：
```json
{
  "version": "1.0.0",
  "root": {
    "id": "document",
    "type": "document",
    "children": []
  }
}
```

---

## 節點結構（PenNode）

每個節點代表設計中的一個元素（frame, text, shape, etc.）。

```typescript
interface PenNode {
  id: string;                   // 節點唯一識別碼（必填）
  type: string;                 // 節點類型（必填，見下方）
  name?: string;                // 節點名稱（可選，用於 UI 顯示）
  properties: NodeProperties;   // 節點屬性（視 type 而定）
  children?: PenNode[];         // 子節點（可選，某些類型無 children）
}

interface NodeProperties {
  // 通用屬性（所有節點）
  visible?: boolean;            // 是否可見（預設 true）
  locked?: boolean;             // 是否鎖定（預設 false）
  opacity?: number;             // 不透明度（0-1）

  // 佈局屬性（container 節點）
  layout?: 'horizontal' | 'vertical' | 'absolute';
  gap?: number;                 // 間距（px）
  padding?: number | number[];  // 內距（px）

  // 尺寸屬性
  width?: number | 'auto' | 'fill';
  height?: number | 'auto' | 'fill';
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;

  // 位置屬性（absolute layout）
  x?: number;                   // X 座標（px）
  y?: number;                   // Y 座標（px）

  // 樣式屬性
  fill?: string | Fill;         // 填充顏色或漸層
  stroke?: string;              // 邊框顏色
  strokeWidth?: number;         // 邊框寬度
  cornerRadius?: number | number[]; // 圓角半徑

  // 文字屬性（text 節點）
  content?: string;             // 文字內容
  fontSize?: number;            // 字體大小
  fontFamily?: string;          // 字體家族
  fontWeight?: number | string; // 字重
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;          // 行高

  // 其他自訂屬性
  [key: string]: any;
}

type Fill = string | GradientFill | ImageFill;

interface GradientFill {
  type: 'linear' | 'radial';
  stops: Array<{ offset: number; color: string }>;
  angle?: number;               // 角度（線性漸層）
}

interface ImageFill {
  type: 'image';
  url: string;
  fit?: 'fill' | 'contain' | 'cover';
}
```

---

## 節點類型（Node Types）

### 1. document

根節點，代表整個文件。

**屬性**：
- `width`: number
- `height`: number

**範例**：
```json
{
  "id": "document",
  "type": "document",
  "properties": {
    "width": 1920,
    "height": 1080
  },
  "children": [...]
}
```

---

### 2. frame

容器節點，可包含子節點。

**支援屬性**：
- 通用屬性
- 佈局屬性（`layout`, `gap`, `padding`）
- 尺寸屬性
- 位置屬性（若 parent 為 absolute layout）
- 樣式屬性（`fill`, `stroke`, `cornerRadius`）

**範例**：
```json
{
  "id": "frame1",
  "type": "frame",
  "name": "Header",
  "properties": {
    "layout": "horizontal",
    "gap": 16,
    "padding": 24,
    "width": "fill",
    "height": 80,
    "fill": "#FFFFFF",
    "cornerRadius": 8
  },
  "children": [...]
}
```

---

### 3. text

文字節點。

**支援屬性**：
- 通用屬性
- 尺寸屬性（通常 auto）
- 位置屬性
- 文字屬性（`content`, `fontSize`, `fontFamily`, etc.）

**範例**：
```json
{
  "id": "text1",
  "type": "text",
  "name": "Title",
  "properties": {
    "content": "Welcome to PencilHistory",
    "fontSize": 32,
    "fontFamily": "Inter",
    "fontWeight": 700,
    "fill": "#000000",
    "textAlign": "center"
  }
}
```

---

### 4. rectangle

矩形節點。

**支援屬性**：
- 通用屬性
- 尺寸屬性
- 位置屬性
- 樣式屬性

**範例**：
```json
{
  "id": "rect1",
  "type": "rectangle",
  "properties": {
    "width": 100,
    "height": 100,
    "x": 50,
    "y": 50,
    "fill": "#FF6B6B",
    "cornerRadius": 12
  }
}
```

---

### 5. ellipse

橢圓/圓形節點。

**支援屬性**：
- 通用屬性
- 尺寸屬性
- 位置屬性
- 樣式屬性

**範例**：
```json
{
  "id": "circle1",
  "type": "ellipse",
  "properties": {
    "width": 60,
    "height": 60,
    "fill": "#4ECDC4",
    "stroke": "#2C3E50",
    "strokeWidth": 2
  }
}
```

---

### 6. path

任意路徑節點（SVG path）。

**支援屬性**：
- 通用屬性
- 尺寸屬性
- 位置屬性
- 樣式屬性
- `geometry`: SVG path data

**範例**：
```json
{
  "id": "path1",
  "type": "path",
  "properties": {
    "geometry": "M 0 0 L 100 50 L 50 100 Z",
    "fill": "#95E1D3",
    "strokeWidth": 0
  }
}
```

---

### 7. image

圖片節點。

**支援屬性**：
- 通用屬性
- 尺寸屬性
- 位置屬性
- `src`: 圖片 URL
- `fit`: 'fill' | 'contain' | 'cover'

**範例**：
```json
{
  "id": "img1",
  "type": "image",
  "properties": {
    "src": "https://example.com/image.png",
    "width": 300,
    "height": 200,
    "fit": "cover"
  }
}
```

---

### 8. ref (Component Instance)

元件實例，引用可重複使用的元件。

**支援屬性**：
- `ref`: 被引用的元件 ID
- `overrides`: 覆寫子節點屬性

**範例**：
```json
{
  "id": "button-instance-1",
  "type": "ref",
  "properties": {
    "ref": "button-component",
    "overrides": {
      "button-label": {
        "content": "Click Me"
      }
    }
  }
}
```

---

## 節點 ID 規則

### ID 唯一性

- 每個節點的 `id` 在整個文件中必須**唯一**
- ID 用於 diff 演算法追蹤節點變更
- ID 格式：字母開頭，可包含字母、數字、連字號、底線

**有效 ID**：
- `document`
- `frame-1`
- `text_title`
- `button123`

**無效 ID**：
- `123-frame`（數字開頭）
- `frame 1`（包含空白）
- `frame/1`（包含非法字元）

### ID 穩定性

**重要**：節點 ID 在編輯過程中應保持穩定，以便：
- Diff 演算法能追蹤同一節點的屬性變更
- 避免誤判為「刪除 + 新增」

**不好**（每次儲存重新生成 ID）：
```json
// Commit 1
{ "id": "temp_abc123", "type": "frame", ... }

// Commit 2（相同節點，ID 變更）
{ "id": "temp_def456", "type": "frame", ... }
```

**好**（ID 穩定）：
```json
// Commit 1
{ "id": "header-frame", "type": "frame", ... }

// Commit 2（相同節點，ID 不變）
{ "id": "header-frame", "type": "frame", "properties": { ... } }
```

---

## 驗證規則

### 1. 必填欄位驗證

```typescript
function validatePenFile(file: any): ValidationResult {
  // 檢查根結構
  if (!file.version) {
    return { valid: false, error: '缺少 version 欄位' };
  }

  if (!file.root) {
    return { valid: false, error: '缺少 root 節點' };
  }

  // 驗證根節點
  return validateNode(file.root);
}

function validateNode(node: any): ValidationResult {
  if (!node.id) {
    return { valid: false, error: '節點缺少 id' };
  }

  if (!node.type) {
    return { valid: false, error: `節點 ${node.id} 缺少 type` };
  }

  // 驗證子節點
  if (node.children) {
    for (const child of node.children) {
      const result = validateNode(child);
      if (!result.valid) return result;
    }
  }

  return { valid: true };
}
```

### 2. ID 唯一性驗證

```typescript
function validateUniqueIds(root: PenNode): ValidationResult {
  const ids = new Set<string>();

  function traverse(node: PenNode) {
    if (ids.has(node.id)) {
      return { valid: false, error: `重複的 ID: ${node.id}` };
    }
    ids.add(node.id);

    if (node.children) {
      for (const child of node.children) {
        const result = traverse(child);
        if (!result.valid) return result;
      }
    }

    return { valid: true };
  }

  return traverse(root);
}
```

### 3. 型別特定驗證

```typescript
function validateNodeType(node: PenNode): ValidationResult {
  switch (node.type) {
    case 'text':
      if (!node.properties.content) {
        return { valid: false, error: `text 節點 ${node.id} 缺少 content` };
      }
      break;

    case 'ref':
      if (!node.properties.ref) {
        return { valid: false, error: `ref 節點 ${node.id} 缺少 ref 屬性` };
      }
      break;

    case 'path':
      if (!node.properties.geometry) {
        return { valid: false, error: `path 節點 ${node.id} 缺少 geometry` };
      }
      break;
  }

  return { valid: true };
}
```

---

## 檔案大小限制

**最大檔案大小**：10MB（10,485,760 bytes）

**驗證**：
```typescript
function validateFileSize(content: string): ValidationResult {
  const sizeInBytes = new Blob([content]).size;
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (sizeInBytes > maxSize) {
    return {
      valid: false,
      error: `檔案大小 ${(sizeInBytes / 1024 / 1024).toFixed(2)} MB 超過 10MB 限制`
    };
  }

  return { valid: true };
}
```

---

## 錯誤處理契約

### 解析錯誤

**情境**：.pen 檔案不是有效 JSON

**處理**：
```typescript
try {
  const penFile = JSON.parse(fileContent);
} catch (error) {
  throw new Error('無效的 .pen 檔案格式：JSON 解析失敗');
}
```

**使用者訊息**：
```
無法解析 .pen 檔案
檔案格式損壞或不符合 JSON 規範
```

### 格式版本不相容

**情境**：.pen 檔案版本與系統支援版本不符

**處理**：
```typescript
const supportedVersions = ['1.0.0', '1.1.0'];

if (!supportedVersions.includes(penFile.version)) {
  throw new Error(`不支援的 .pen 格式版本：${penFile.version}`);
}
```

**使用者訊息**：
```
此 .pen 檔案使用版本 ${version}
目前僅支援版本 1.0.0 和 1.1.0
```

### 缺少必填欄位

**使用者訊息**：
```
.pen 檔案格式不完整
缺少必要欄位：${missingField}
```

---

## 測試契約

### 契約測試（Contract Tests）

```typescript
describe('.pen File Contract Tests', () => {
  it('解析有效的 .pen 檔案', () => {
    const validPenFile = {
      version: '1.0.0',
      root: {
        id: 'document',
        type: 'document',
        properties: {},
        children: []
      }
    };

    const result = validatePenFile(validPenFile);
    expect(result.valid).toBe(true);
  });

  it('拒絕缺少 version 的檔案', () => {
    const invalidFile = {
      root: { id: 'document', type: 'document', children: [] }
    };

    const result = validatePenFile(invalidFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('version');
  });

  it('偵測重複的節點 ID', () => {
    const fileWithDuplicateIds = {
      version: '1.0.0',
      root: {
        id: 'document',
        type: 'document',
        children: [
          { id: 'frame1', type: 'frame', properties: {} },
          { id: 'frame1', type: 'frame', properties: {} } // 重複！
        ]
      }
    };

    const result = validateUniqueIds(fileWithDuplicateIds.root);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('重複的 ID');
  });

  it('驗證檔案大小限制', () => {
    const largeContent = JSON.stringify({
      version: '1.0.0',
      root: {
        id: 'document',
        type: 'document',
        children: Array(100000).fill({ id: 'test', type: 'frame', properties: {} })
      }
    });

    const result = validateFileSize(largeContent);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('10MB');
  });
});
```

---

## 完整範例

**簡單的設計檔案**：
```json
{
  "version": "1.0.0",
  "metadata": {
    "createdAt": "2024-02-20T10:00:00Z",
    "author": "Design Team"
  },
  "root": {
    "id": "document",
    "type": "document",
    "properties": {
      "width": 375,
      "height": 812
    },
    "children": [
      {
        "id": "screen-1",
        "type": "frame",
        "name": "Home Screen",
        "properties": {
          "layout": "vertical",
          "gap": 24,
          "padding": 16,
          "width": "fill",
          "height": "fill",
          "fill": "#F5F5F5"
        },
        "children": [
          {
            "id": "header",
            "type": "frame",
            "name": "Header",
            "properties": {
              "layout": "horizontal",
              "gap": 12,
              "padding": 16,
              "width": "fill",
              "height": 60,
              "fill": "#FFFFFF",
              "cornerRadius": 12
            },
            "children": [
              {
                "id": "title",
                "type": "text",
                "properties": {
                  "content": "PencilHistory.xyz",
                  "fontSize": 24,
                  "fontWeight": 700,
                  "fill": "#1A1A1A"
                }
              }
            ]
          },
          {
            "id": "content",
            "type": "frame",
            "name": "Content Area",
            "properties": {
              "layout": "vertical",
              "gap": 16,
              "width": "fill",
              "height": "fill"
            },
            "children": [
              {
                "id": "card-1",
                "type": "frame",
                "properties": {
                  "width": "fill",
                  "height": 120,
                  "fill": "#FFFFFF",
                  "cornerRadius": 8,
                  "padding": 16
                },
                "children": [
                  {
                    "id": "card-1-text",
                    "type": "text",
                    "properties": {
                      "content": "View commit history",
                      "fontSize": 16,
                      "fill": "#333333"
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}
```

---

## 參考資源

**相關標準**：
- JSON Schema: https://json-schema.org/
- SVG Path Specification: https://www.w3.org/TR/SVG/paths.html

**工具**：
- JSON Schema Validator
- .pen Linter（未來開發）

---

**文件版本**：1.0.0
**最後更新**：2026-02-24
**狀態**：完成 ✅
