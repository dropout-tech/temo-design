# 今天我想來點_文件

TEMO 官網「今天我想來點」斜線分割 + Hover 抬起區段的所有文件，集中放這裡。

---

## 📂 三份檔案

| 檔案 | 給誰看 | 何時用 |
|---|---|---|
| [01-技術文件.md](./01-技術文件.md) | 你 / 同事 / 未來的自己 | 想搞懂這個 component 怎麼運作的時候 |
| [02-通用-prompt.md](./02-通用-prompt.md) | 任何人 + 任何 AI（ChatGPT / Cursor / v0…） | 想叫 AI 做類似的版型 |
| [03-slash-command-原檔.md](./03-slash-command-原檔.md) | 你（限定 TEMO 專案） | 在 Claude Code 打 `/diagonal-doors` 重做這個版型 |

---

## 🔗 相關檔案位置（不在這個資料夾、但有關聯）

| 檔案 | 用途 |
|---|---|
| `public/four-doors-prototype.html` | Prototype 本體（瀏覽器打開 `localhost:3000/four-doors-prototype.html` 看效果） |
| `public/cement-light.png` | 水泥背景圖（3.6MB，正式上線前要壓縮） |
| `.claude/commands/diagonal-doors.md` | slash command 的入口（是 symlink，實際指向上面的 `03-slash-command-原檔.md`） |
| `components/pages/explore-client.tsx` | 正式頁面（目前用整張背景圖，還沒整合 prototype 的真互動） |

---

## 🧠 重點筆記

### 這次累積的兩個 debug 教訓

1. **`effortLevel: xhigh` 在 plugin 多的時候會撞 rate limit** → 卡 Thinking…
   - 解法：`~/.claude/settings.json` 把 `effortLevel` 改成 `medium`、重啟 Claude Code
2. **claude.ai 連的 MCP 斷線會在 UI 跳訊息** → 嚇人但不影響工作
   - 解法：忽略；想徹底清就到 claude.ai 網頁斷掉那個 connector

### 之後正式上線要補的 4 件事

1. `cement-light.png` 壓縮 → webp，目標 < 300 KB
2. 把 prototype 整合進 `components/pages/explore-client.tsx` 的 `TodayStage`
3. 文字內容抽出來（CMS 或 props）
4. 響應式設計（小螢幕版型還沒做）

---

## 💡 三份檔案怎麼選？

```
我要重做這個 TEMO 區段 ──────────→ 用 03（在 Claude Code 打 /diagonal-doors）

我要做別的專案 / 別的版型 ──────→ 用 02（複製 prompt 到任何 AI）

我只想搞懂程式碼怎麼運作 ──────→ 看 01
```
