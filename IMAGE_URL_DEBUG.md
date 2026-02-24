# 圖片 URL 解析調試說明

## 目前實作

系統會將 .pen 檔案中的相對路徑自動轉換為 GitHub raw URL：

```
原始路徑: 232543043.jpeg
解析後: https://raw.githubusercontent.com/{owner}/{repo}/{commit-sha}/232543043.jpeg
```

## 實際範例

假設：
- Owner: `guychienll`
- Repo: `pen-diff`
- Commit SHA: `abc123def456...`
- 圖片路徑: `232543043.jpeg`

解析結果：
```
https://raw.githubusercontent.com/guychienll/pen-diff/abc123def456.../232543043.jpeg
```

## 為什麼使用 Commit SHA？

使用 commit SHA 而不是 branch name 有以下優點：

1. **版本一致性** - 確保圖片與 .pen 檔案版本完全匹配
2. **歷史追溯** - 可以查看過去任何版本的設計
3. **避免變動** - 不會因為 branch 更新而改變

## 支援的格式

### ✅ GitHub 支援的 ref 格式

以下格式都可以正常工作：

1. **Commit SHA (推薦)**
   ```
   https://raw.githubusercontent.com/guychienll/pen-diff/abc123def/232543043.jpeg
   ```

2. **Branch name**
   ```
   https://raw.githubusercontent.com/guychienll/pen-diff/main/232543043.jpeg
   ```

3. **Full branch reference**
   ```
   https://raw.githubusercontent.com/guychienll/pen-diff/refs/heads/main/232543043.jpeg
   ```

4. **Tag**
   ```
   https://raw.githubusercontent.com/guychienll/pen-diff/v1.0.0/232543043.jpeg
   ```

## 調試步驟

### 1. 檢查 Console Log

開啟瀏覽器 DevTools Console，會看到圖片 URL 解析的 log：

```javascript
Resolved image URL: {
  original: "232543043.jpeg",
  resolved: "https://raw.githubusercontent.com/guychienll/pen-diff/abc123def/232543043.jpeg",
  context: {
    owner: "guychienll",
    repo: "pen-diff",
    ref: "abc123def..."
  }
}
```

### 2. 驗證圖片是否存在

手動測試解析後的 URL：

```bash
curl -I "https://raw.githubusercontent.com/guychienll/pen-diff/{commit-sha}/232543043.jpeg"
```

應該返回 `HTTP/2 200` 表示圖片存在。

### 3. 檢查 .pen 檔案內容

確認 .pen 檔案中的圖片路徑格式：

```json
{
  "type": "rectangle",
  "fill": {
    "type": "image",
    "imageUrl": "232543043.jpeg"  // ← 相對路徑
  }
}
```

或

```json
{
  "fill": {
    "type": "image",
    "imageUrl": "https://raw.githubusercontent.com/guychienll/pen-diff/main/232543043.jpeg"  // ← 完整 URL
  }
}
```

## 常見問題

### Q: 圖片顯示為灰色

**可能原因：**
1. 圖片在該 commit 中不存在
2. 路徑錯誤（檢查大小寫）
3. GitHub token 權限不足
4. 網路問題或 CORS

**解決方法：**
```bash
# 檢查圖片是否存在
curl -I "https://raw.githubusercontent.com/{owner}/{repo}/{sha}/{path}"

# 檢查 commit 內容
git show {sha}:{path}
```

### Q: 想使用 branch 而不是 commit SHA

修改 `PenViewer.tsx`:

```typescript
repoContext: owner && repo
  ? {
      owner,
      repo,
      ref: branch, // 使用 branch 而不是 commit.sha
    }
  : undefined,
```

⚠️ **注意：** 使用 branch 會導致：
- 歷史版本的圖片可能改變
- 無法追溯到準確的設計版本

### Q: 圖片在不同的 repo

如果圖片和 .pen 檔案在不同的 repository，使用完整 URL：

```json
{
  "imageUrl": "https://raw.githubusercontent.com/other-owner/other-repo/main/image.jpg"
}
```

## 實作位置

- `src/lib/pen/renderer.ts:resolveImageUrl()` - URL 解析邏輯
- `src/components/viewer/PenViewer.tsx` - repo context 傳遞
- `src/types/pen.ts` - repoContext 定義

## 測試範例

創建一個測試 .pen 檔案：

```json
{
  "version": "1.0",
  "children": [
    {
      "id": "test-image",
      "type": "rectangle",
      "x": 0,
      "y": 0,
      "width": 400,
      "height": 300,
      "fill": {
        "type": "image",
        "imageUrl": "232543043.jpeg"
      }
    }
  ]
}
```

Commit 並查看 history viewer，檢查 console log 確認 URL 解析正確。
