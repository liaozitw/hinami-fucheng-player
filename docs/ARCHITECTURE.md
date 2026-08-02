# Hinami Fucheng Player 技術架構

## 執行模型

Hinami Fucheng Player 是單一 Node.js 程序的本機應用：

```text
Browser
   │
   ├── React UI
   │     ├── 影片庫
   │     ├── 播放器／VR
   │     └── 管理後台
   │
   └── Express :8787
         ├── Library API
         ├── SQLite
         ├── 原始影片 Range streaming
         └── FFmpeg thumbnails
```

開發模式下 Express 掛載 Vite middleware；正式模式則提供 `dist` 靜態檔案及 SPA fallback。

## 主要目錄

```text
.
├── server/
│   └── index.ts       # API、SQLite、掃描與串流
├── src/
│   ├── App.tsx        # 前台影片庫
│   ├── Admin.tsx      # 管理後台
│   ├── Player.tsx     # 一般與 VR 播放器
│   ├── main.tsx       # 前台入口與路徑切換
│   ├── styles.css
│   └── types.ts
├── docs/
├── index.html
└── vite.config.ts
```

## SQLite

資料庫位於 `.luma/library.sqlite`。主要資料表：

- `directories`：使用者加入的影片目錄及最後掃描時間
- `videos`：影片中繼資料、Tags、VR 標記及私人評分
- `playback_history`：最後觀看時間、進度與影片長度
- `scan_extensions`：掃描副檔名設定
- `scan_exclusions`：略過目錄名稱
- `library_tags`：Tag 索引

重新掃描目錄時先在記憶體收集結果，完成後再使用 transaction 替換該來源的索引。取消或遍歷失敗不會破壞既有索引。

## 目錄掃描

每個掃描都是記憶體中的背景工作，包含：

- 狀態：running、completed、cancelled、failed
- 已檢查檔案數
- 找到的影片數
- 目前路徑
- 開始與完成時間

掃描工作在服務重啟後不會恢復。影片索引只有在掃描完整完成後才更新。

## 影片播放

所有格式都透過支援 HTTP Range 的 `/api/video/:id` 直接提供原始檔案，不在播放時轉碼。伺服器會依副檔名回傳 MIME type，並驗證瀏覽器送出的位元範圍。實際能否播放取決於瀏覽器與作業系統是否支援影片內部的影音編碼。

## VR 播放器

Three.js 使用 `VideoTexture` 將影片貼到內側球面。攝影機位於球心，滑鼠拖曳改變觀看方向；縮放控制則調整 PerspectiveCamera 的 FOV。

## 本機安全模型

- Express 綁定 `127.0.0.1`，預設只允許本機存取
- 影片不會上傳至第三方服務
- SQLite 與快取均位於 `.luma` 並被 Git 忽略
- API 接收的目錄路徑只用於本機索引與讀取
- 完全重置不會刪除來源影片

這是一套單人本機工具，尚未實作帳號、權限或多使用者隔離。若要暴露到區域網路或網際網路，必須先增加驗證、路徑授權、CSRF 防護與反向代理安全設定。
