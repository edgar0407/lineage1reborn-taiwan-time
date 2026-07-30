[English](README.md) | 繁體中文

# Lineage 1 Reborn - 台灣時間

一個 Tampermonkey 使用者腳本，將 [lineage1reborn.com](https://lineage1reborn.com/) 網站上顯示的美東時間（ET／EST／EDT）原地轉換為台灣時間（`Asia/Taipei`，UTC+8），不改變版面配置。

## 轉換範圍

| 位置 | 網站顯示 | 轉換後顯示 |
| --- | --- | --- |
| 頁首「Time Now」時鐘 | `09:50:36 PM EDT` | `09:50:36 AM TW`（badge） |
| 活動倒數結束時間 | `Ends Jul 30, 10:00pm ET` | `Ends Jul 31, 10:00 TW`（badge） |
| 城堡「Next Siege」時間 | `1 Aug 10 AM ET` | `1 Aug 22:00 TW`（badge） |
| 活動頁面（`?page=events`）日期 | `Friday, July 24th @ 1:00pm ET` | `Sat Jul 25, 01:00 TW`（badge） |

- 正確處理跨日情況（例如 `1 Aug 3 PM ET` → `2 Aug 03:00 TW`）。
- EDT／EST（夏令時間）透過 IANA 時區規則正確判斷，不使用固定時差。
- 轉換後的時間會以綠底白字的 badge 原地顯示。
- 滑鼠移到轉換後的時間上可看到原始 ET 文字提示（tooltip）。
- 不修改頁面其他內容，不新增列、不造成版面跳動。

## 安裝方式

1. 安裝瀏覽器擴充功能 [Tampermonkey](https://www.tampermonkey.net/)。
2. 若使用 Chrome 138+，開啟 `chrome://extensions`，啟用「開發人員模式」，再到 Tampermonkey 擴充功能詳細資料頁面啟用「允許使用者腳本（Allow User Scripts）」。
3. 透過以下 GitHub Raw 網址安裝腳本：

   ```text
   https://raw.githubusercontent.com/edgar0407/lineage1reborn-taiwan-time/main/lineage1reborn-taiwan-time.user.js
   ```

4. 前往 [lineage1reborn.com](https://lineage1reborn.com/)，Tampermonkey 首次會詢問網站存取權限，請允許 `lineage1reborn.com`。

Tampermonkey 會比對上方網址中的 `@version`，自動提示更新。

## 運作原理

- 首頁即時時鐘（`[data-home-edt-clock]`）透過 `MutationObserver` 攔截網站每秒的更新，同步顯示台灣時間，不會與網站自身的計時器互相干擾。
- 活動倒數的結束時間直接使用倒數元素的 `data-target`（Unix 時間戳，代表精確時刻）計算，而非重新解析畫面上的文字。
- 攻城時間在網站上沒有穩定的 selector，因此腳本透過比對相鄰元素中「`<日> <月>`」／「`<時> AM|PM ET`」的文字樣式，只替換符合此樣式的文字節點。
- 活動頁面的日期時間則用正規表示式在文字中尋找「月份名稱＋日期＋（可選）年份＋時間」的組合，因此也能處理夾在句子中間的時間（例如「... - Ends Saturday, May 30 at ... ET」），不需要固定樣板。

完整規格請參考 [`docs/SPEC.md`](docs/SPEC.md)。

## 限制與已知範圍

- 已驗證首頁（`/`）與活動頁面（`?page=events`）。
- 若 lineage1reborn.com 更改 DOM 結構或文字內容，依賴文字樣式的比對邏輯（攻城時間、活動頁面日期）可能失效——失效時會靜默跳過，不會顯示錯誤資料。
- 活動頁面上「沒有日期、只寫星期幾」的固定行程說明（例如「Friday 1:00 PM ET to Monday 10:00 PM ET」）不會被轉換，因為沒有日期就無法判斷該用 EDT 還是 EST。
- 本專案與 Lineage 1 Reborn 官方無關，亦非官方授權。

## 授權

MIT — 詳見 [LICENSE](LICENSE)。
