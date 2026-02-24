# GitHub Token 設定說明

為了避免 GitHub API rate limit 限制，您需要設定 GitHub Personal Access Token。

## 步驟 1: 建立 GitHub Personal Access Token

1. 前往 GitHub Settings: https://github.com/settings/tokens
2. 點擊 "Generate new token" > "Generate new token (classic)"
3. 設定 token 名稱，例如: `pencil-history-viewer`
4. 選擇以下權限 (scopes):
   - 如果只需要存取**公開** repository: 勾選 `public_repo`
   - 如果需要存取**私人** repository: 勾選完整的 `repo` 權限
5. 點擊 "Generate token"
6. **重要**: 複製生成的 token (只會顯示一次！)

## 步驟 2: 設定環境變數

1. 在專案根目錄建立 `.env.local` 檔案:

   ```bash
   cp .env.example .env.local
   ```

2. 編輯 `.env.local` 檔案，將 `your_github_token_here` 替換為剛才複製的 token:

   ```env
   GITHUB_TOKEN=ghp_your_actual_token_here
   ```

3. 儲存檔案

## 步驟 3: 重新啟動開發伺服器

```bash
npm run dev
```

## Rate Limit 說明

- **無 token**: 60 requests/hour (非常容易超過)
- **有 token**: 5,000 requests/hour (足夠正常使用)

## 安全性注意事項

⚠️ **重要安全提醒**:

1. **絕對不要** commit `.env.local` 到 git repository
2. `.env.local` 已經在 `.gitignore` 中，請確認它存在
3. 如果 token 不小心外洩，請立即到 GitHub 設定頁面刪除該 token
4. 不要在前端程式碼中直接使用 token (已改為 server-side API)

## 驗證設定

啟動 server 後，查看 console log 應該會看到:

```
GitHub API Rate Limit: xxxx/5000
```

如果看到 `xxxx/60`，表示 token 未正確設定。

## Troubleshooting

### Token 無效

- 確認 token 已複製完整 (通常以 `ghp_` 開頭)
- 確認 token 權限已正確勾選
- 確認 `.env.local` 檔案格式正確 (沒有多餘空格或引號)

### 仍然遇到 rate limit

- 確認有重新啟動開發伺服器
- 檢查 `GITHUB_TOKEN` 環境變數是否正確載入:
  ```bash
  node -e "console.log(process.env.GITHUB_TOKEN)"
  ```

### API 錯誤

- 確認要存取的 repository 是公開的，或 token 有對應權限
- 檢查 GitHub token 是否過期或被刪除
