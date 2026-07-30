# Lineage 1 Reborn 台灣時間腳本：規格與開發交接

## 1. 專案目標

建立一個可公開分享的 Tampermonkey userscript，將 Lineage 1 Reborn 網站顯示的美東時間（ET／EST／EDT）轉換為台灣時間（Asia/Taipei、UTC+8）。

程式碼預計放在 GitHub 公開 Repository，供朋友安裝，並由 Tampermonkey 自動檢查更新。

建議 Repository 名稱：

```text
lineage1reborn-taiwan-time
```

## 2. 工作範圍

### 網域

正式網站：

```text
https://lineage1reborn.com/
```

Tampermonkey metadata 建議同時涵蓋根網域與可能的 `www`：

```javascript
// @match        https://lineage1reborn.com/*
// @match        https://www.lineage1reborn.com/*
```

以上涵蓋這兩個 host 下的所有路徑，但不包含任意其他子網域。

若確認未來要涵蓋所有子網域，可改用：

```javascript
// @match        https://*.lineage1reborn.com/*
```

目前建議採明確列出根網域與 `www`，權限範圍較小。

### 頁面範圍

第一階段需支援首頁：

```text
https://lineage1reborn.com/
```

腳本 metadata 可涵蓋整個 domain，但程式只處理實際偵測到 ET／EST／EDT 時間的元素，不修改其他內容。

## 3. 已知時間格式

目前首頁至少包含以下三類：

```text
09:50:36 PM EDT
Jul 30, 10:00pm ET
1 Aug 10 AM ET
1 Aug 3 PM ET
```

來源時區統一使用：

```text
America/New_York
```

目標時區統一使用：

```text
Asia/Taipei
```

不可直接寫死 `+12` 或 `+13` 小時，必須使用 IANA 時區规则處理 EST／EDT 夏令時間。

## 4. 顯示規格

### 4.1 原地替換

右側欄寬度有限，不可再插入大型 badge 或把原始與轉換結果並排。

應直接在原位置顯示台灣時間：

| 網站原文 | 台灣顯示 |
| --- | --- |
| `10:12:51 PM EDT` | `10:12:51 AM TW` |
| `1 Aug 10 AM ET` | `1 Aug 22:00 TW` |
| `1 Aug 3 PM ET` | `2 Aug 03:00 TW` |
| `Jul 30, 10:00pm ET` | `Jul 31, 10:00 TW` |

### 4.2 保留原始資料

- 替換後元素的 `title` 顯示原始內容，例如：`Original: 1 Aug 3 PM ET`。
- 原始字串應保存在 `data-l1r-original-time`。
- 不可讓同一內容被重複換算。

### 4.3 不破壞排版

- 不新增第二行。
- 不使用大面積背景色或 padding。
- 建議只為 `TW` 使用較淡的強調色。
- 不應改變卡片高度、寬度、flex/grid 結構。
- 不應用 `element.innerHTML = ...` 或 `element.textContent = ...` 覆蓋整個父容器，避免移除網站既有子元素與事件。

## 5. 日期規則

### 5.1 必須處理跨日

```text
1 Aug 3 PM ET
```

正確結果：

```text
2 Aug 03:00 TW
```

不可只改時間而保留 `1 Aug`。

### 5.2 年份推斷

網站可能只顯示月、日，不顯示年份。

建議從美東時間的去年、今年、明年中，選出距離現在最近的日期，避免 12 月／1 月交界誤判。

### 5.3 動態時鐘

首頁 `TIME NOW` 每秒更新，腳本也必須同步更新台灣時間。

可採其中一種方式：

1. 保留網站時鐘更新，監聽文字變化後轉換。
2. 首次辨識後由腳本自行每秒產生台灣時間。

必須避免 MutationObserver 和腳本自身修改互相觸發，形成無限循環。

## 6. DOM 實作要求

網站可能把日期與時間拆成不同的文字節點或子元素，例如：

```text
1 Aug
10 AM ET
```

因此：

- 不可假設完整日期時間一定在單一 text node。
- 應先找出包含完整組合的最小容器。
- 再只替換相關文字節點或使用 Range 精確替換。
- 正式實作前，請使用 Chrome DevTools 確認首頁實際 selector。
- 優先採用網站穩定的 class／`data-*` 屬性；避免依賴 `nth-child`。
- 若沒有穩定 selector，再使用「最小匹配容器＋文字 Range」策略。

## 7. Tampermonkey 權限提醒

Chrome 138+ 搭配 Tampermonkey 5.3+，需在 Tampermonkey 的擴充功能詳細資料中開啟：

```text
允許使用者腳本（Allow User Scripts）
```

或啟用 Chrome 擴充功能頁面的「開發人員模式」。

Tampermonkey 的網站存取權需允許：

```text
lineage1reborn.com
```

## 8. 建議 Repository 結構

```text
lineage1reborn-taiwan-time/
├─ lineage1reborn-taiwan-time.user.js
├─ README.md
├─ CHANGELOG.md
├─ LICENSE
└─ docs/
   └─ SPEC.md
```

本檔可放到：

```text
docs/SPEC.md
```

## 9. Userscript metadata 範本

請將 `<GITHUB_USER>` 換成實際 GitHub 帳號：

```javascript
// ==UserScript==
// @name         Lineage 1 Reborn - Taiwan Time
// @namespace    https://github.com/<GITHUB_USER>/lineage1reborn-taiwan-time
// @version      1.0.0
// @description  Convert Lineage 1 Reborn Eastern Time displays to Taiwan time.
// @author       <GITHUB_USER>
// @license      MIT
// @match        https://lineage1reborn.com/*
// @match        https://www.lineage1reborn.com/*
// @run-at       document-idle
// @grant        none
// @updateURL    https://raw.githubusercontent.com/<GITHUB_USER>/lineage1reborn-taiwan-time/main/lineage1reborn-taiwan-time.user.js
// @downloadURL  https://raw.githubusercontent.com/<GITHUB_USER>/lineage1reborn-taiwan-time/main/lineage1reborn-taiwan-time.user.js
// ==/UserScript==
```

每次發布必須增加 `@version`，否則 Tampermonkey 可能不會判定為新版。

## 10. 時區轉換核心參考程式碼

以下程式碼可作為正式 userscript 的轉換核心。DOM selector 與原地替換部分應在檢查網站實際 HTML 後完成。

```javascript
const SOURCE_ZONE = 'America/New_York';
const TARGET_ZONE = 'Asia/Taipei';

function partsAt(date, zone) {
  const values = {};
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  for (const part of formatter.formatToParts(date)) {
    if (part.type !== 'literal') {
      values[part.type] = Number(part.value);
    }
  }

  return values;
}

function zonedDate(year, month, day, hour, minute, second, zone) {
  const desired = Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minute,
    second
  );

  let guess = desired;

  for (let i = 0; i < 4; i += 1) {
    const parts = partsAt(new Date(guess), zone);
    const represented = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second
    );

    const adjustment = desired - represented;
    guess += adjustment;

    if (adjustment === 0) break;
  }

  return new Date(guess);
}

function formatTaiwan(date, includeSeconds = false) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TARGET_ZONE,
    hourCycle: 'h23',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds ? { second: '2-digit' } : {})
  }).format(date);
}
```

## 11. 驗收標準

### 功能

- [ ] 首頁頂端 EDT／EST 動態時鐘顯示正確台灣時間。
- [ ] `Jul 30, 10:00pm ET` 正確轉換並處理跨日。
- [ ] `1 Aug 10 AM ET` 顯示 `1 Aug 22:00 TW`。
- [ ] `1 Aug 3 PM ET` 顯示 `2 Aug 03:00 TW`。
- [ ] EST 與 EDT 使用正確歷史／當期 offset。
- [ ] 網站動態重新渲染內容後仍能轉換。

### UI

- [ ] 原地替換，不新增第二行。
- [ ] 不改變卡片高度及寬度。
- [ ] 手機或窄版右側欄不跑版。
- [ ] Hover 可看到原始 ET 文字。
- [ ] 不重複加入 `TW` 或重複轉換。

### 安裝與更新

- [ ] Chrome 開啟 Allow User Scripts 後可執行。
- [ ] GitHub Raw URL 可安裝。
- [ ] 提升 `@version` 後 Tampermonkey 可偵測更新。

## 12. 建議 Commit

```text
chore: initialize userscript repository
feat: convert homepage ET times to Taiwan time
fix: handle date rollover for Taiwan time
fix: replace time in place without changing sidebar layout
docs: add installation and Chrome permission instructions
```

## 13. 給本機 Claude 的執行要求

```text
請依 docs/SPEC.md 完成 lineage1reborn-taiwan-time.user.js。

要求：
1. 先檢查 https://lineage1reborn.com/ 的實際 DOM，找出首頁時鐘、活動結束時間與兩筆攻城時間的穩定 selector。
2. 不要使用大型 badge；改成原地替換，hover 顯示原始 ET 文字。
3. 使用 America/New_York → Asia/Taipei 的 IANA 時區轉換，正確處理 EDT、EST 與跨日。
4. 保留網站既有 DOM 結構與事件，不可用 innerHTML/textContent 覆蓋整個卡片。
5. 建立 README.md、CHANGELOG.md、MIT LICENSE 與完整 userscript。
6. 執行語法檢查，並列出仍需人工瀏覽器驗證的項目。
7. 在我確認前不要 push；先顯示 git diff 與建議 commit。
```

