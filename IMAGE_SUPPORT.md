# .pen 檔案圖片支援說明

## 功能說明

現在 .pen 檔案中的圖片填充（image fill）會自動解析為 GitHub repository 中的相對路徑圖片。

## 支援的 .pen 檔案格式

系統支援兩種圖片填充格式：

### 格式 1: Pencil 格式 (推薦)

```json
{
  "type": "image",
  "enabled": true,
  "url": "232543043.jpeg",
  "mode": "fill"
}
```

### 格式 2: 標準格式

```json
{
  "type": "image",
  "imageUrl": "assets/logo.png"
}
```

兩種格式都會被正確解析！

## 圖片路徑解析規則

### 1. 相對路徑 (推薦)

如果 .pen 檔案中的圖片使用相對路徑，系統會自動轉換為 GitHub raw URL：

**Pencil 格式：**

```json
{
  "type": "rectangle",
  "fill": {
    "type": "image",
    "url": "232543043.jpeg"
  }
}
```

**標準格式：**

```json
{
  "type": "rectangle",
  "fill": {
    "type": "image",
    "imageUrl": "assets/logo.png"
  }
}
```

都會被解析為：

```
https://raw.githubusercontent.com/{owner}/{repo}/{commit-sha}/232543043.jpeg
https://raw.githubusercontent.com/{owner}/{repo}/{commit-sha}/assets/logo.png
```

### 2. 絕對路徑

以 `/` 開頭的路徑也會被處理：

```json
{
  "imageUrl": "/public/banner.jpg"
}
```

解析為：

```
https://raw.githubusercontent.com/{owner}/{repo}/{commit-sha}/public/banner.jpg
```

### 3. 完整 URL

如果已經是完整的 HTTP/HTTPS URL，會直接使用：

```json
{
  "imageUrl": "https://example.com/image.png"
}
```

### 4. Data URL

Data URL 也可以直接使用：

```json
{
  "imageUrl": "data:image/png;base64,iVBORw0KG..."
}
```

## 使用時機

### ✅ 適合使用相對路徑的情況：

- 圖片存放在同一個 repository 中
- 需要追蹤圖片的版本歷史
- 圖片與設計檔案關聯性強

### ✅ 適合使用完整 URL 的情況：

- 圖片來自 CDN 或外部服務
- 圖片不會變動（如公司 logo）
- 跨 repository 共用的資源

## 範例

### Repository 結構

```
my-design-repo/
├── designs/
│   └── homepage.pen       // 設計檔案
└── assets/
    ├── hero-image.jpg     // 主視覺圖片
    ├── logo.png           // Logo
    └── icons/
        └── icon-1.svg     // 圖示
```

### .pen 檔案範例

```json
{
  "version": "1.0",
  "children": [
    {
      "id": "hero",
      "type": "rectangle",
      "width": 1200,
      "height": 600,
      "fill": {
        "type": "image",
        "imageUrl": "assets/hero-image.jpg"
      }
    },
    {
      "id": "logo",
      "type": "rectangle",
      "width": 200,
      "height": 100,
      "fill": {
        "type": "image",
        "imageUrl": "assets/logo.png"
      }
    }
  ]
}
```

## 技術細節

### 解析流程

1. **讀取 .pen 檔案** - 從 GitHub 獲取指定 commit 的 .pen 檔案
2. **提取 repo context** - 取得 owner, repo, commit SHA
3. **收集圖片填充** - 遍歷所有節點，找出 `type: "image"` 的 fill
4. **轉換路徑** - 相對路徑轉換為 GitHub raw URL
5. **生成 SVG** - 使用 SVG pattern 嵌入圖片
6. **渲染截圖** - 轉換為 data URL 顯示

### 快取機制

圖片解析結果會被快取，快取 key 包含：

- .pen 檔案內容的 hash
- node ID
- 寬高尺寸
- **repo context (owner/repo/ref)**

確保不同 commit 的相同檔案路徑會被正確區分。

## 注意事項

### ⚠️ 圖片必須在 repository 中

- 圖片檔案必須在對應的 commit 中存在
- 使用的 commit SHA 必須包含該圖片

### ⚠️ 路徑大小寫敏感

GitHub 路徑是大小寫敏感的：

- ✅ `assets/Logo.png`
- ❌ `assets/logo.png` (如果檔案名稱是 Logo.png)

### ⚠️ 圖片格式支援

瀏覽器支援的所有圖片格式：

- PNG, JPG, JPEG
- SVG
- WebP
- GIF

### ⚠️ CORS 限制

GitHub raw URLs 支援 CORS，但其他外部 URL 可能會有跨域限制。

## Troubleshooting

### 圖片無法顯示

1. **檢查檔案路徑** - 確認路徑正確且檔案存在
2. **檢查 commit** - 確認該 commit 包含圖片檔案
3. **檢查權限** - 確認 GitHub token 有讀取 repo 的權限
4. **檢查網路** - GitHub raw URL 是否可正常存取

### 顯示為灰色佔位符

如果圖片顯示為灰色（#e5e7eb），表示：

- `imageUrl` 未設定
- 路徑解析失敗
- 圖片載入失敗

### 清除快取

如果更新圖片後未生效：

```bash
# 方法 1: 硬重新整理
Cmd+Shift+R (Mac) 或 Ctrl+Shift+R (Windows)

# 方法 2: 清除瀏覽器快取
開發者工具 > Application > Clear storage
```

## 實作位置

相關程式碼位置：

- `src/types/pen.ts` - 添加 `repoContext` 到 `PenScreenshotRequest`
- `src/components/viewer/PenViewer.tsx` - 傳遞 repo 資訊
- `src/hooks/useScreenshot.ts` - 支援 `repoContext`
- `src/lib/pen/renderer.ts` - 圖片 URL 解析與 SVG pattern 生成
- `app/api/screenshot/generate.ts` - 傳遞 `repoContext` 給 renderer
