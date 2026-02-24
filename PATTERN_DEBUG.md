# SVG Pattern 破圖問題調試

## 目前狀況

圖片能載入但顯示破圖或不顯示。

## 請提供以下資訊

### 1. Console 輸出

重新載入頁面後，請複製整段 console log，特別是：

```javascript
=== Starting to collect image fills ===
...
✅ Found image fill: ...
...
Collected image fills: { count: 1, fills: [...] }
Generated pattern: ...
Resolved image URL: ...
SVG preview (first 1500 chars): ...
```

### 2. Network Tab

檢查是否有對圖片的請求：

```
GET https://raw.githubusercontent.com/guychienll/pen-diff/{sha}/232543043.jpeg
```

- Status: ?
- Type: ?
- Size: ?

### 3. 視覺效果

描述一下「破圖」的樣子：

- [ ] 完全空白（白色或灰色）
- [ ] 看到一小部分圖片但變形
- [ ] 圖片重複排列（tile）
- [ ] 其他：****\_\_\_****

### 4. 瀏覽器 DevTools Elements

右鍵點擊破圖的地方 → Inspect，找到 `<img>` 或 `<svg>` 標籤，複製整個 SVG 內容。

## 已知的 SVG Pattern 問題

### 問題 1: objectBoundingBox 座標系統

```xml
<!-- 可能不工作 -->
<pattern patternContentUnits="objectBoundingBox" width="1" height="1">
  <image width="1" height="1" />
</pattern>
```

在某些情況下，`objectBoundingBox` 座標系統可能導致圖片不顯示。

### 問題 2: userSpaceOnUse 需要實際尺寸

```xml
<!-- 需要知道矩形的實際大小 -->
<pattern patternUnits="userSpaceOnUse" width="400" height="300">
  <image width="400" height="300" />
</pattern>
```

問題是我們在生成 pattern 時不知道使用它的矩形大小。

### 問題 3: 圖片載入時機

SVG 轉 data URL 時，圖片可能還沒載入完成。

## 可能的解決方案

### 方案 A: 改用 clipPath + image (推薦)

不使用 pattern fill，直接渲染 image 元素：

```xml
<defs>
  <clipPath id="clip-rect1">
    <rect x="0" y="0" width="400" height="300"/>
  </clipPath>
</defs>
<image href="..." x="0" y="0" width="400" height="300" clip-path="url(#clip-rect1)"/>
```

優點：

- 更簡單直接
- 兼容性更好
- 不需要處理複雜的座標系統

缺點：

- 需要改動渲染邏輯

### 方案 B: 動態 pattern 尺寸

為每個使用圖片的形狀生成對應大小的 pattern：

```javascript
function renderRectangle(node) {
  if (hasImageFill(node)) {
    // 生成專門給這個矩形用的 pattern
    const patternId = `img-${node.id}`;
    svg += `<pattern id="${patternId}" width="${node.width}" height="${node.height}" patternUnits="userSpaceOnUse">
      <image width="${node.width}" height="${node.height}" />
    </pattern>`;
  }
}
```

### 方案 C: 使用 foreignObject

```xml
<foreignObject x="0" y="0" width="400" height="300">
  <img src="..." style="width:100%; height:100%; object-fit:cover"/>
</foreignObject>
```

注意：在 data URL 中使用 foreignObject 可能有安全限制。

### 方案 D: 預載圖片然後 inline

Server 端先下載圖片，轉成 base64 data URL，直接嵌入 SVG。

優點：

- 確保圖片已載入
- 自包含，不依賴外部資源

缺點：

- 增加 SVG 大小
- Server 端需要下載圖片

## 下一步

請提供上面要求的資訊，我會根據實際情況選擇最佳方案。
