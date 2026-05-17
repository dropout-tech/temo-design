# Prompt：斜線分割 + Hover 抬起區段

> 把下面整段文字貼進任何 AI（Claude / ChatGPT / Cursor / v0…），它就會幫你做出類似的「斜線把畫面切成幾塊、滑鼠 hover 那塊會抬起變亮」的視覺區段。
>
> **使用方式**：先看「[需要你提供什麼](#需要你提供什麼)」、把那些資料填好，再把整份 prompt 貼給 AI。

---

## ✂️ 從這行開始複製 ─────────────────────────

## 任務

請用純 HTML/CSS 做一個 **full viewport** 的視覺區段，效果如下：

- 整面當底（水泥、混凝土、磨砂、磚牆等質感圖均可）
- 由幾條斜線把畫面切成幾個梯形「板子」
- 每個板子內有自己的文字/編號
- 滑鼠 hover 任一板子 → 該板子**抬起**、**變亮**、**長出陰影**、**clip-path 變寬讓內容完整露出**、**整塊浮到最上層**

⚠️ 重要：不要做動畫的「滑出/滑入」，而是「整塊板子像被光打到一樣抬起來」的感覺。

## 需要你提供什麼

**1. 設計畫布尺寸**（必要）
例：`1920 × 1080` 或 `1834 × 1062`

**2. N 條斜線的座標**（必要，用原始畫布 px）
格式：每條線 `(x_top, y_top) → (x_bottom, y_bottom)`
**N 條斜線會切出 N-1 個板子。**

**3. 每個板子的內容**（必要）
- 板子裡要顯示哪些文字/編號
- 該板子的主色（建議由淺到深、或由暖到冷遞進）

**4. 周邊元素位置**（可選）
- 標題、副標、段落文字的位置與字級
- 共用的標籤、按鈕等

**5. 字體**（可選）
- 中文：建議 Noto Sans TC / Source Han Sans
- 英文：建議 Barlow / Inter / Helvetica Neue

## 實作架構（請依此順序）

### 圖層（z-index 由小到大）

```
z-1  整面背景（水泥圖）
z-2  N-1 個板子（.panel.pN，全頁面 inset:0 + clip-path 切出梯形）
       └ 板子背景（同樣的水泥圖，會跟著 hover 抬起）
       └ 板子內容（文字、編號 — 也跟著抬起）
z-3  N 條斜線（SVG，stroke-width 統一）
z-5  左/右側固定文字（標題、段落）
z-6  ★ Hover 時的板子（從 z-2 提升到 z-6，覆蓋其他層）
```

### 每個板子 (.panel) 的結構

```html
<div class="panel p1">
  <div class="panel-bg"></div>           <!-- 同樣的背景紋，會跟著抬起 -->
  <div class="panel-text">大字文字</div>
  <div class="panel-num">01</div>        <!-- 編號也包進來，這樣會跟著抬 -->
</div>
```

關鍵：**`.panel` 是 `position: absolute; inset: 0;` 全頁面**。用 `clip-path` 切出梯形可見區。這樣 clip-path 座標可以**直接用 viewport %**，不用算相對位置。

### clip-path 怎麼算

對每條斜線，**延伸到 y=0 跟 y=100%**，得到該線在頂部/底部的 x。

例：斜線在畫布上是 `(260, 983) → (901, 170)`，畫布是 1834×1062：
- 線方向：dx = 901-260 = 641，dy = 170-983 = -813
- 延伸到 y=0：x = 901 + (0-170) × 641 / -813 = 1035.05 → 1035.05/1834 = **56.44%**
- 延伸到 y=1062：x = 260 + (1062-983) × 641 / -813 = 197.70 → 197.70/1834 = **10.78%**

相鄰兩條線之間就是一個板子的 clip-path（順時針：TL → TR → BR → BL）：

```css
.panel.p1 {
  clip-path: polygon(
    [L1 在 y=0 的 x%]    0,
    [L2 在 y=0 的 x%]    0,
    [L2 在 y=100% 的 x%] 100%,
    [L1 在 y=100% 的 x%] 100%
  );
}
```

### Hover 時擴寬 clip-path（讓內容完整露出）

每個多邊形頂點往外推約 ±5–7%：
- 左邊兩個點 x 各 **-6%**
- 右邊兩個點 x 各 **+6%**

```css
.panel.p1:hover {
  clip-path: polygon(
    [TL.x - 6]% 0,
    [TR.x + 6]% 0,
    [BR.x + 6]% 100%,
    [BL.x - 6]% 100%
  );
}
```

⚠️ 預設跟 hover 的多邊形**頂點數必須一致**（同樣 4 點），否則動畫不會作用。

### Hover 效果（全部一起做）

```css
.panel {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: auto;
  transition:
    transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
    filter 0.4s ease,
    clip-path 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.panel:hover {
  transform: translateY(-10px);
  filter: brightness(1.13) drop-shadow(0 14px 22px rgba(0, 0, 0, 0.4));
  z-index: 6;
  /* clip-path 換成寬版 — 見上一節 */
}
```

### 字體規格範例（請依設計調整）

| 元素 | font-size | weight | letter-spacing | color |
|---|---|---|---|---|
| 主標題 | 6–8vw | 900 | -0.01em | 對比色（白/黑） |
| 副標 | 2–3vw | 700 | 0.05–0.1em | 對比色 80% 透明 |
| 板子內大字 | 5–6vw | 900 | 0.1–0.15em | 板子主色 |
| 板子內編號 | 3–4vw | 900 | 0.1em | 對比色 |

### N 條白色斜線 SVG

```html
<svg preserveAspectRatio="none" viewBox="0 0 [畫布寬] [畫布高]"
     style="position:absolute; inset:0; z-index:3; pointer-events:none; width:100%; height:100%;">
  <line x1="..." y1="..." x2="..." y2="..."
        stroke="#F2F2F2"
        stroke-width="4"
        vector-effect="non-scaling-stroke" />
  <!-- 重複 N 次 -->
</svg>
```

`vector-effect: non-scaling-stroke` 保證 stroke 寬度不會被 SVG 縮放影響。

## 容易踩的 5 個坑

1. **編號 `.panel-num` 必須 `pointer-events: none`**（如果寫在 panel 外面才需要；如果在 panel 內就不用）— 否則會擋下層 hover
2. **`transition` 要包含 `clip-path`** — 不然 hover 時邊界會「閃」、沒過渡
3. **編號 / 大字 DOM 一定要寫在 `.panel` 裡面** — 不然 hover 時不會跟著抬
4. **預設與 hover 的 polygon 頂點數要一致** — 4 點對 4 點，不能 4 對 5
5. **每個 `.panel` 必須是全頁面 `inset:0`** — 不是只佔斜線內的小區塊，這樣 clip-path 才能直接用 viewport %

## 輸出格式

請給我一份完整的單檔 HTML（含 `<style>` 和 `<body>`），可以直接用瀏覽器打開或丟到 dev server，路徑請用 `/your-image.png` 這種絕對路徑（之後我會放到 public 資料夾）。

✂️ 複製到這行為止 ─────────────────────────

---

## 使用者注意事項

### 怎麼填「需要你提供什麼」

最辛苦的是斜線座標。如果你只有設計稿（PNG / Figma），用以下方法量：

1. **設計稿截圖**：用螢幕截圖工具，畫布尺寸要記住（例如 1834×1062）
2. **量斜線**：用 Figma / Photoshop / 甚至小畫家，把游標放在斜線跟畫布上下邊界的交點，讀座標
3. **記下來**：每條線記成 `(x_top, y_top) → (x_bottom, y_bottom)`，y_top 通常接近 0、y_bottom 通常接近畫布高度

### 如果你 AI 跑出來的結果不對

最常見的 3 個問題：

| 症狀 | 可能原因 | 怎麼修 |
|---|---|---|
| 漢字 / 文字被切掉 | clip-path 太窄，預設或 hover 版都要 | 把擴寬從 ±6% 改 ±8% 或 ±10% |
| Hover 沒反應 | `.panel` 沒 `pointer-events: auto` 或被別層擋住 | 檢查 z-index、pointer-events |
| 板子抬起時數字沒跟著動 | 數字 DOM 寫在 `.panel` 外面 | 把數字 `<div>` 搬進 `.panel` 裡 |

### 進階：把這個區段做成 React component

把 panels 陣列化、clip-path 用 `style` prop 動態算，整段就能變成可重用的 component。如果你要這個版本，跟 AI 多說一句「請改寫成 React + TypeScript 版本，panels 用 props 傳入」就好。
