# 圖片顯示問題調試清單

## 🔍 調試步驟

### 1. 打開瀏覽器 DevTools Console

查看是否有以下 log 輸出：

#### a) PenViewer Component

```javascript
PenViewer repoContext: {
  hasRepoContext: true,
  owner: "guychienll",
  repo: "pen-diff",
  commitSha: "abc123",
  hasFileVersion: true
}
```

**檢查點：**

- ✅ `hasRepoContext` 應該是 `true`
- ✅ `owner` 和 `repo` 應該正確
- ✅ `commitSha` 應該有值

#### b) Screenshot Service

```javascript
Screenshot request: {
  hasRepoContext: true,
  repoContext: {
    owner: "guychienll",
    repo: "pen-diff",
    ref: "abc123def..."
  },
  penContentLength: 1234
}
```

**檢查點：**

- ✅ `hasRepoContext` 應該是 `true`
- ✅ `repoContext` 應該包含完整資訊

#### c) Screenshot API (Server)

```javascript
Rendering with repoContext: {
  owner: "guychienll",
  repo: "pen-diff",
  ref: "abc123def..."
}
```

**檢查點：**

- ✅ Server 端應該收到 repoContext

#### d) Image URL Resolution

```javascript
Resolved image URL: {
  original: "232543043.jpeg",
  resolved: "https://raw.githubusercontent.com/guychienll/pen-diff/abc123/232543043.jpeg",
  context: { owner, repo, ref }
}
```

**檢查點：**

- ✅ `resolved` URL 應該是完整的 GitHub raw URL
- ✅ URL 應該包含正確的 owner/repo/ref

### 2. 檢查網路請求

在 DevTools Network tab:

#### a) Screenshot API 請求

```
POST /api/screenshot
Status: 200 OK
```

查看 Request Payload:

```json
{
  "penContent": "...",
  "repoContext": {
    "owner": "guychienll",
    "repo": "pen-diff",
    "ref": "..."
  }
}
```

#### b) 圖片請求

應該看到對 GitHub raw URL 的請求：

```
GET https://raw.githubusercontent.com/guychienll/pen-diff/{sha}/232543043.jpeg
Status: 200 OK
Content-Type: image/jpeg
```

**如果失敗：**

- ❌ Status 404: 圖片不存在於該 commit
- ❌ Status 403: GitHub 權限問題
- ❌ CORS error: 跨域問題（不應該發生）

### 3. 驗證 SVG 生成

在 Console 執行：

```javascript
// 獲取 SVG 內容
const svg = document.querySelector('img[src^="data:image/svg"]');
if (svg) {
  const src = svg.src;
  const base64 = src.split(",")[1];
  const decoded = atob(base64);
  console.log(decoded);
}
```

檢查 SVG 是否包含：

```xml
<defs>
  <pattern id="image-xxxxx" ...>
    <image href="https://raw.githubusercontent.com/..." />
  </pattern>
</defs>
<rect ... fill="url(#image-xxxxx)" />
```

### 4. 手動測試圖片 URL

複製 console log 中的 resolved URL，在新分頁開啟：

```
https://raw.githubusercontent.com/guychienll/pen-diff/{sha}/232543043.jpeg
```

**預期結果：**

- ✅ 應該能看到圖片
- ❌ 如果是 404，表示圖片不在該 commit 中

### 5. 檢查 .pen 檔案內容

確認 .pen 檔案中有正確的圖片填充：

```json
{
  "type": "rectangle",
  "fill": {
    "type": "image",
    "imageUrl": "232543043.jpeg"
  }
}
```

或使用完整 URL：

```json
{
  "fill": {
    "type": "image",
    "imageUrl": "https://raw.githubusercontent.com/guychienll/pen-diff/main/232543043.jpeg"
  }
}
```

## 🐛 常見問題排查

### 問題 1: 圖片顯示灰色 (#e5e7eb)

**原因：**

- 沒有 `imageUrl` 或 `imageUrl` 為空
- `fill.type` 不是 "image"

**解決：**
檢查 .pen 檔案的 fill 結構

### 問題 2: Console 沒有 "Resolved image URL" log

**原因：**

- `collectImageFills` 沒有找到圖片
- repoContext 沒有傳遞到 renderer

**解決：**
檢查 console 是否有 "No repo context" 警告

### 問題 3: 圖片 URL 正確但不顯示

**原因：**

- SVG pattern 語法錯誤
- 圖片 CORS 問題
- 瀏覽器快取問題

**解決：**

```bash
# 清除快取並硬重新整理
Cmd+Shift+R (Mac) 或 Ctrl+Shift+R (Windows)
```

### 問題 4: repoContext 為 undefined

**原因：**

- Page 沒有傳遞 owner/repo 給 PenViewer
- PenViewer 沒有傳遞給 useScreenshot
- useScreenshot 沒有傳遞給 API

**解決：**
檢查 console logs 確認傳遞鏈

## 📝 測試文件

已創建以下測試文件：

- `test-image-render.html` - 瀏覽器中測試 SVG pattern
- `test-pen-svg.js` - Node.js 測試 SVG 生成
- `test-output.svg` - 生成的測試 SVG

開啟這些文件來驗證：

```bash
open test-image-render.html
open test-output.svg
```

## ✅ 完整調試流程

1. ✅ 開啟頁面並選擇一個 commit
2. ✅ 打開 DevTools Console
3. ✅ 確認看到 "PenViewer repoContext" log
4. ✅ 確認看到 "Screenshot request" log
5. ✅ 確認看到 "Rendering with repoContext" log
6. ✅ 確認看到 "Resolved image URL" log
7. ✅ 檢查 Network tab 的圖片請求
8. ✅ 手動測試 resolved URL
9. ✅ 檢查生成的 SVG 結構

如果以上都正常，圖片應該能正確顯示！
