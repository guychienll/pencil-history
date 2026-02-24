# 位置調試說明

## 預期位置（根據 .pen 檔案）

```json
{
  "type": "frame",
  "x": 180,
  "y": 228,
  "width": 294,
  "height": 376,
  "children": [
    {
      "type": "rectangle",
      "x": 47, // 相對於 Frame
      "y": 88, // 相對於 Frame
      "width": 200,
      "height": 200
    }
  ]
}
```

### 計算

**Frame:**

- 位置: (180, 228)
- 尺寸: 294 x 376

**Rectangle (圖片):**

- 相對位置: (47, 88)
- 絕對位置: (180+47, 228+88) = **(227, 316)**
- 尺寸: 200 x 200

**居中驗證:**

- 水平: (294 - 200) / 2 = 47 ✓
- 垂直: (376 - 200) / 2 = 88 ✓

圖片應該在 Frame 正中間！

## 請提供以下資訊

### 1. Console Log

重新載入後，查看 console 中的座標信息：

```javascript
Rendering frame (BCm8s): {
  relative: { x: 180, y: 228 },
  parent: { x: 0, y: 0 },
  absolute: { x: 180, y: 228 },
  size: { width: 294, height: 376 }
}

Rendering rectangle (KYrZB): {
  relative: { x: 47, y: 88 },
  parent: { x: 180, y: 228 },
  absolute: { x: 227, y: 316 },
  size: { width: 200, height: 200 }
}
```

### 2. SVG viewBox

查看 "SVG preview" log，看看 viewBox 的值：

```xml
<svg viewBox="minX minY width height">
```

### 3. 視覺描述

目前圖片的位置：

- [ ] 在 Frame 左上角
- [ ] 在 Frame 右下角
- [ ] 偏離中心（往哪個方向？）
- [ ] 其他：\***\*\_\_\*\***

### 4. 截圖對比

如果可以的話，提供：

- 原始設計圖（已提供）
- 目前渲染結果的截圖

## 可能的問題

### 問題 1: viewBox 計算錯誤

如果 viewBox 的 minX/minY 不正確，會導致整個畫面偏移。

```javascript
// calculateBounds() 函數
const padding = 20;
minX = minX - padding; // 這可能導致偏移
minY = minY - padding;
```

### 問題 2: 座標系統理解錯誤

是否子節點座標是：

- [ ] 相對於父節點左上角（目前假設）
- [ ] 相對於畫布原點
- [ ] 其他座標系統

### 問題 3: transform/rotation 影響

```javascript
rotation: 2.4251729446159314e-14;
```

這個極小的 rotation 值可能導致浮點數誤差？

## 測試建議

創建一個簡化的測試 SVG：

```xml
<svg width="800" height="600" viewBox="0 0 800 600">
  <!-- Frame -->
  <rect x="180" y="228" width="294" height="376" fill="#FFFFFF" stroke="black"/>

  <!-- Rectangle (absolute position) -->
  <rect x="227" y="316" width="200" height="200" rx="100" fill="#FF0000"/>

  <!-- Center lines for verification -->
  <line x1="327" y1="0" x2="327" y2="600" stroke="blue" stroke-dasharray="5,5"/>
  <line x1="0" y1="416" x2="800" y2="416" stroke="blue" stroke-dasharray="5,5"/>
</svg>
```

如果這個測試 SVG 顯示正確（紅色圓形在白色矩形正中間），說明計算邏輯正確，問題可能在 viewBox。
