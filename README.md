# Hinami Fucheng Player

Hinami Fucheng Player 是一套以 TypeScript 打造的本機影片庫、瀏覽器播放器與 VR 影院。它可以掃描電腦中的影片目錄、建立縮圖、播放瀏覽器原生格式，並使用 FFmpeg 將其他格式即時轉成 HLS。

影片、評分、播放記錄與路徑資料都保留在本機，不會上傳到雲端。

## 主要功能

- 串流平台風格的影片瀏覽介面
- 獨立的 `/admin` 目錄管理後台
- 從 macOS Finder 點選影片目錄
- 每個目錄獨立掃描、顯示進度與取消掃描
- 自訂掃描副檔名及略過目錄
- 依目錄層級自動建立 Tags
- 清理沒有影片引用的 Tags
- MP4、WebM 等格式直接播放
- WMV、AVI、MKV、MOV 等格式經 FFmpeg 轉成 HLS
- 180°／360° VR 播放、拖曳視角與縮放
- 播放器選單閒置自動隱藏
- 「好／中等／不好」三級私人評分
- 依評分篩選影片及匯出 CSV 清單
- 播放記錄、進度保存及一鍵清空
- 完全重置資料庫與快取，不刪除原始影片

## 系統需求

- macOS、Linux 或 Windows
- Node.js 20 以上版本
- npm
- FFmpeg 及 FFprobe

Finder 目錄選擇器目前只支援 macOS；其他系統仍可輸入完整目錄路徑。

### macOS 安裝需求

使用 Homebrew：

```bash
brew install node ffmpeg
```

確認版本：

```bash
node --version
npm --version
ffmpeg -version
ffprobe -version
```

### Linux 安裝需求

建議使用 Node.js 官方下載頁提供的 `nvm` 方式安裝目前的 LTS 版本。

Ubuntu／Debian：

```bash
sudo apt update
sudo apt install -y git curl ffmpeg
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.5/install.sh | bash
\. "$HOME/.nvm/nvm.sh"
nvm install 24
```

Fedora：

```bash
sudo dnf install -y git curl ffmpeg-free
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.5/install.sh | bash
\. "$HOME/.nvm/nvm.sh"
nvm install 24
```

Arch Linux：

```bash
sudo pacman -Syu --needed git nodejs npm ffmpeg
```

完成後確認：

```bash
node --version
npm --version
ffmpeg -version
ffprobe -version
```

Linux 沒有 macOS Finder 選擇器。請在前台「加入目錄」視窗輸入絕對路徑，例如 `/home/user/Videos` 或 `/mnt/media/Movies`。

### Windows 安裝需求

在 Windows 10／11 開啟 PowerShell，使用 WinGet：

```powershell
winget install --id Git.Git -e
winget install --id OpenJS.NodeJS.LTS -e
winget install --id Gyan.FFmpeg -e
```

安裝完成後關閉並重新開啟 PowerShell，再確認：

```powershell
git --version
node --version
npm --version
ffmpeg -version
ffprobe -version
```

若系統沒有 `winget`，請先從 Microsoft Store 安裝或更新「應用程式安裝程式」（App Installer），也可從 [Node.js 官方下載頁](https://nodejs.org/en/download) 安裝 LTS MSI，並依 [FFmpeg 官方下載頁](https://ffmpeg.org/download.html) 提供的 Windows builds 安裝 FFmpeg。

Windows 沒有 macOS Finder 選擇器。請從前台輸入完整路徑，例如：

```text
C:\Users\你的帳號\Videos
D:\Movies
```

### 下載並啟動專案

macOS／Linux：

```bash
git clone https://github.com/liaozitw/hinami-fucheng-player.git
cd hinami-fucheng-player
npm install
npm run dev
```

Windows PowerShell：

```powershell
git clone https://github.com/liaozitw/hinami-fucheng-player.git
Set-Location hinami-fucheng-player
npm install
npm run dev
```

參考來源：[Node.js 官方下載說明](https://nodejs.org/en/download)、[Microsoft WinGet 文件](https://learn.microsoft.com/windows/package-manager/winget/)、[FFmpeg 官方下載頁](https://ffmpeg.org/download.html)。

## 安裝與啟動

```bash
git clone <你的 GitHub repository URL>
cd hinami-fucheng-player
npm install
npm run dev
```

開啟：

- 前台：<http://localhost:8787>
- 管理後台：<http://localhost:8787/admin>

開發模式由同一個 Express 程序載入 Vite middleware，因此前台與 API 使用相同連接埠。

## 正式模式

```bash
npm run build
npm start
```

正式服務同樣位於 <http://localhost:8787>。

## 基本操作

### 1. 加入目錄

前往 `/admin`，點擊「加入新目錄」並從 Finder 選擇資料夾。加入時只會登記路徑，不會立即掃描，避免大型目錄讓介面看起來沒有回應。

### 2. 掃描目錄

在指定目錄旁點擊「掃描」。後台會顯示：

- 已檢查檔案數
- 目前處理路徑
- 已找到影片數
- 取消掃描按鈕

掃描完成後才會以 SQLite transaction 更新該目錄的影片索引。取消或失敗時，原有索引保持不變。

### 3. 避免掃描無關內容

後台可以管理「略過目錄」清單。預設略過：

```text
Library
Applications
node_modules
.git
.Trash
Caches
.cache
.npm
.cargo
.local
.hermes
.real_chrome_cdp_profile
DerivedData
```

建議加入具體影片資料夾，不要直接掃描整個 Home 目錄。

### 4. VR 影片

檔名包含獨立的 `VR`、`180` 或 `360` 時會自動標記為 VR，例如：

```text
vacation-360.mp4
concert_VR.mkv
travel-180.mp4
```

播放時可以：

- 用滑鼠拖曳視角
- 使用滾輪或觸控板縮放
- 用播放器的加減按鈕調整 60% 至 250%
- 點擊百分比或重設按鈕回到 100%

若檔名沒有關鍵字，即使畫面比例為 2:1，目前也不會自動標記為 VR。

## 支援格式

### 瀏覽器直接播放

- MP4
- WebM
- M4V
- OGV

實際能否直接播放仍取決於影片內部 codec。副檔名是 MP4 不代表瀏覽器一定支援其中的影像或音訊編碼。

### FFmpeg 轉成 HLS

- WMV
- AVI
- MKV
- MOV
- MPEG／MPG
- M2TS

`.ts` 與 `.mts` 預設停用，因為容易把 TypeScript 原始碼誤認為影片。可在後台自行啟用。

## 私人評分與匯出

播放器提供：

- 好
- 中等
- 不好

前台可以直接依評分篩選。後台則可分別匯出三種 CSV，欄位包含：

- 評分
- 影片名稱
- 完整檔案路徑
- 副檔名
- 來源目錄

## 播放記錄

開始播放時會建立記錄，播放期間每 10 秒及暫停／離開播放器時保存進度。前台「播放記錄」會依最近觀看時間排序。

「清空播放記錄」只會刪除歷史資料，不會刪除影片或評分。

## 資料與隱私

執行後會建立：

```text
.luma/
├── library.sqlite
└── cache/
```

- `library.sqlite`：目錄、影片索引、評分、播放記錄、Tags 與設定
- `cache/`：縮圖及 HLS 轉碼檔案

`.luma` 是為了相容舊版資料而保留的內部儲存名稱，已列入 `.gitignore`，不會提交到 GitHub。

伺服器預設只監聽 `127.0.0.1:8787`，不會直接暴露給區域網路或網際網路。

## 完全重置

管理後台底部提供「完全重置」。輸入 `RESET` 後會清除：

- 影片目錄
- 影片索引
- 私人評分
- 播放記錄
- Tags
- 副檔名與略過目錄設定
- 縮圖及轉碼快取

原始影片不會被移動、修改或刪除。

## npm 指令

| 指令 | 用途 |
| --- | --- |
| `npm run dev` | 啟動整合式開發服務 |
| `npm run build` | 執行 TypeScript 檢查並建立正式前台 |
| `npm start` | 啟動正式服務 |

## 技術架構

- TypeScript
- React
- Vite
- Express
- Node.js SQLite (`node:sqlite`)
- FFmpeg／FFprobe
- Hls.js
- Three.js
- Lucide React

詳細說明請參閱 [架構文件](docs/ARCHITECTURE.md)。

第一次使用請參閱 [完整使用教學](docs/USER_GUIDE.md)。

## 常見問題

### 掃描很久

確認是否加入整個 Home、磁碟根目錄或包含大量開發檔案的目錄。使用後台的目前路徑與檔案計數判斷進度，必要時取消並改加入更精確的目錄。

### `.ts` 影片沒有出現

`.ts` 預設停用，避免誤掃 TypeScript。確定它是 MPEG transport stream 後，可在後台啟用。

### 終端顯示 FFmpeg 使用大量 CPU

瀏覽器不支援的格式需要轉碼。高解析度或長影片可能使用大量 CPU，第一次播放尤其明顯。

### Finder 選擇器無法開啟

確認是在 macOS 本機執行服務。也可改用完整路徑輸入。掃描器會略過 macOS 拒絕存取的目錄。

### 影片沒有縮圖

FFmpeg 無法解碼、影片太短或檔案損壞時，介面會顯示預設縮圖，不影響片庫索引。

## GitHub 上傳

本專案必須使用獨立 Git repository，請勿從 Home 目錄直接執行 `git add -A`。

```bash
cd /Users/tainanoutlook/netflix
git init
git add .gitignore README.md docs index.html package.json package-lock.json server src tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts
git commit -m "Initial Hinami Fucheng Player"
git branch -M main
git remote add origin https://github.com/<帳號>/<repository>.git
git push -u origin main
```

## 授權

目前未指定開源授權。若 repository 設為公開，其他人仍可閱讀程式碼，但在加入 LICENSE 前不代表授權他人使用、修改或散布。

## 品牌與開發者人設

本專案以「府城・日南／日南（ひなみ）／Hinami Fucheng」作為開發者與產品角色。她象徵府城的日光、溫暖、時間感與慢活精神；播放器希望讓私人影像也能以安靜、從容的方式被保存與重新觀看。

- 角色定位：府城的時間守望者
- 品牌關鍵字：日光、溫暖、慢活、府城記憶
- 角色資料：[「府城・日南」介紹](https://www.tainanoutlook.com/blog/1003190263)
