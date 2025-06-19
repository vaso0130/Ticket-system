# 演唱會售票系統

此專案為一個簡易的演唱會售票網站，採用純 HTML、CSS 與 JavaScript 開發。資料預設存放在瀏覽器的 `localStorage` 中，所有模組均放置於 `js` 目錄並以 ES modules 載入。

## 快速接入資料庫

`js/db.js` 提供了基本的 API 介面，會嘗試透過 `/api` 路徑向後端讀寫資料；若請求失敗，則退回使用 `localStorage`。因此，只要在後端實作以下路由即可串接真實的資料庫：

```bash
GET  /api/data/<key>
POST /api/data/<key>
```

路由實作可使用 Express 搭配 MongoDB 或其他框架。由於前端的資料存取都集中在 `fetchFromDB` 與 `saveToDB` 兩個函式，故無需大幅修改即可切換至資料庫。

## 開發方式

直接以瀏覽器開啟 `index.html` 即可。主要進入點為 `js/main.js`，會在 `DOMContentLoaded` 事件觸發後啟動，能更快載入頁面。

## 可能的優化

- 架設簡易後端 (如 Express) 儲存資料。
- 視專案規模拆分較大的資料檔，方便維護。
- 上線前建議壓縮 CSS 與 JavaScript 檔案，提高效能。
