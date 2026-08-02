# Hinami Fucheng Player 使用教學

[English](../README.md) · [繁體中文](USER_GUIDE.md) · [日本語](README.ja.md)

這份教學適合第一次從 GitHub 下載並使用 Hinami Fucheng Player 的使用者。

本程式需要 Node.js 24 LTS 或更新版本。

## 目錄

1. [安裝程式](#1-安裝程式)
2. [啟動網站](#2-啟動網站)
3. [加入影片目錄](#3-加入影片目錄)
4. [掃描影片](#4-掃描影片)
5. [管理掃描規則](#5-管理掃描規則)
6. [播放影片](#6-播放影片)
7. [VR 播放](#7-vr-播放)
8. [評分與篩選](#8-評分與篩選)
9. [播放記錄](#9-播放記錄)
10. [匯出清單](#10-匯出清單)
11. [Tags](#11-tags)
12. [移除目錄與完全重置](#12-移除目錄與完全重置)
13. [常見問題](#13-常見問題)
14. [支持開發者](#14-支持開發者)

## 1. 安裝程式

### macOS

先安裝 Homebrew，再執行：

```bash
brew install node ffmpeg
```

從 GitHub 下載專案：

```bash
git clone https://github.com/liaozitw/hinami-fucheng-player.git
cd hinami-fucheng-player
npm install
```

也可以在 GitHub 點擊 `Code` → `Download ZIP`，解壓縮後在該目錄執行 `npm install`。

### Linux

Ubuntu／Debian（`zenity` 用於開啟圖形化目錄選擇器）：

```bash
sudo apt update
sudo apt install -y git curl ffmpeg zenity
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.5/install.sh | bash
\. "$HOME/.nvm/nvm.sh"
nvm install 24
git clone https://github.com/liaozitw/hinami-fucheng-player.git
cd hinami-fucheng-player
npm install
```

Fedora：

```bash
sudo dnf install -y git curl ffmpeg-free
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.5/install.sh | bash
\. "$HOME/.nvm/nvm.sh"
nvm install 24
git clone https://github.com/liaozitw/hinami-fucheng-player.git
cd hinami-fucheng-player
npm install
```

Arch Linux：

```bash
sudo pacman -Syu --needed git nodejs npm ffmpeg
git clone https://github.com/liaozitw/hinami-fucheng-player.git
cd hinami-fucheng-player
npm install
```

Linux 使用者加入目錄時，請輸入 `/home/user/Videos`、`/mnt/media/Movies` 等絕對路徑。

### Windows 10／11

開啟 PowerShell：

```powershell
winget install --id Git.Git -e
winget install --id OpenJS.NodeJS.LTS -e
winget install --id Gyan.FFmpeg -e
```

關閉並重新開啟 PowerShell：

```powershell
git --version
node --version
npm --version
ffmpeg -version
ffprobe -version
git clone https://github.com/liaozitw/hinami-fucheng-player.git
Set-Location hinami-fucheng-player
npm install
```

若沒有 `winget`，從 Microsoft Store 安裝或更新「應用程式安裝程式」（App Installer）。也可以從 [Node.js 官方網站](https://nodejs.org/en/download) 下載 LTS MSI，並從 [FFmpeg 官方下載頁](https://ffmpeg.org/download.html) 選擇 Windows build。

Windows 使用者請在前台輸入 `C:\Users\你的帳號\Videos` 或 `D:\Movies` 等完整路徑。

## 2. 啟動網站

macOS／Linux 開發模式：

```bash
npm run dev
```

Windows PowerShell 使用相同指令：

```powershell
npm run dev
```

看到以下訊息表示啟動成功：

```text
Hinami Fucheng Player: http://localhost:8787
```

瀏覽器開啟：

- 影片前台：<http://localhost:8787>
- 管理後台：<http://localhost:8787/admin>

關閉程式時，在終端按 `Control + C`。

## 3. 加入影片目錄

1. 進入管理後台。
2. 點右上角「加入新目錄」。
3. macOS、Windows 會開啟系統資料夾選擇器；Linux 會使用 Zenity 或 KDialog。
4. 選擇存放影片的資料夾。
5. 目錄會出現在「影片來源」清單。

加入目錄不會立刻掃描，因此即使目錄很大也能迅速完成。

建議選擇明確的影片目錄：

```text
/Users/你的帳號/Movies
/Users/你的帳號/Downloads/影片
/Volumes/外接硬碟/Movies
```

不要直接加入 `/` 或整個 Home 目錄，否則仍可能需要檢查大量無關檔案。

## 4. 掃描影片

在「影片來源」中找到目錄，點擊右側「掃描」。畫面會持續顯示：

- 已檢查幾個檔案
- 目前正在處理哪個路徑
- 已找到幾部影片

掃描在背景執行，期間仍能操作其他管理功能。點「取消」可停止該目錄掃描；取消時不會破壞前一次的片庫資料。

新增、移動或刪除原始影片後，需回到後台手動重新掃描對應目錄。

## 5. 管理掃描規則

### 副檔名

在「掃描副檔名」選擇要辨識的格式，再點「儲存設定」。

`.ts` 與 `.mts` 預設關閉，因為開發專案中的 TypeScript 檔案也可能使用這兩個副檔名。

### 略過目錄

在「略過目錄」輸入單一目錄名稱，例如：

```text
build
archive
temporary
```

掃描器只比較目錄名稱，不要輸入完整路徑或斜線。刪除規則後，下次掃描才會重新進入該目錄。

## 6. 播放影片

回到首頁，點擊影片卡片即可播放。

播放器支援：

- 播放／暫停
- 音量與靜音
- 拖曳播放進度
- 全螢幕
- 60% 至 250% 畫面縮放
- 閒置 2.5 秒後自動隱藏控制列

移動滑鼠、點擊、觸控或按鍵盤即可重新顯示控制列。

## 7. VR 播放

檔名包含獨立的 `VR`、`180` 或 `360`，掃描後會被放入「VR 空間」。

範例：

```text
tainan-night-360.mp4
temple_VR.mkv
trip-180.mov
```

VR 操作：

- 按住滑鼠拖曳：改變觀看方向
- 滾輪或觸控板：拉近或拉遠
- `+`／`-`：逐級縮放
- 百分比／重設按鈕：回到 100%
- VR 按鈕：一般模式與沉浸模式切換

如果 VR 影片沒有出現，先確認檔名包含關鍵字，再重新掃描該目錄。

## 8. 評分與篩選

播放控制列提供三級私人評分：

- 好
- 中等
- 不好

再次點擊目前的評分可以取消。回到前台後，使用上方評分按鈕只顯示指定評分的影片。

評分保存在本機 SQLite，即使重新掃描目錄也會依影片路徑保留。

## 9. 播放記錄

前台點擊「播放記錄」可查看最近觀看的影片。播放進度會在以下時機保存：

- 開始播放
- 每 10 秒
- 暫停
- 離開播放器

點擊「清空播放記錄」只會刪除觀看歷史，不影響影片、評分或原始檔案。

## 10. 匯出清單

管理後台的「匯出我的評分」提供三個 CSV 下載按鈕。

CSV 可用 Excel、Numbers 或 Google Sheets 開啟，包含完整影片路徑，方便日後移動、備份或刪除原始檔案。

## 11. Tags

影片的 Tags 來自來源目錄以下的資料夾層級。

例如：

```text
Movies/旅行/台南/安平.mp4
```

會建立：

```text
Movies
旅行
台南
```

前台可點 Tag 篩選。後台「整理 Tags」會刪除已經沒有影片引用的 Tag 索引。

## 12. 移除目錄與完全重置

### 移除目錄

點目錄右側垃圾桶，只會從 SQLite 清除該來源索引，不會刪除硬碟影片。

### 完全重置

在後台最下方點擊「完全重置」，輸入：

```text
RESET
```

這會清除所有 Hinami Player 資料、設定及快取，但不會刪除原始影片。

## 13. 常見問題

### 頁面無法開啟

確認終端仍在執行 `npm run dev`，並使用 <http://localhost:8787>，不要直接雙擊 `index.html`。

### `EADDRINUSE: address already in use`

代表 8787 連接埠已有另一個程序。先關閉先前的 Hinami Player 終端，或找出占用程序：

```bash
lsof -nP -iTCP:8787 -sTCP:LISTEN
```

### 哪些格式可以直接播放

播放器不會在播放時轉碼，所有影片都直接串流原始檔案。MP4、WebM 等格式通常支援較好；WMV、AVI、MKV、MOV 或 HEVC 是否能播放，取決於 Windows 與瀏覽器安裝的解碼器。

### 目錄掃描看起來沒有結束

查看後台顯示的目前路徑。如果正在掃描大量無關內容，點取消，新增略過規則，或改用更精確的來源目錄。

### 影片播放失敗

先確認影片可在目前瀏覽器播放。即使副檔名是 MP4，也可能包含瀏覽器不支援的 codec；必要時可在播放前自行轉成 H.264/AAC MP4。

### 如何更新程式

```bash
git pull
npm install
npm run build
```

一般更新會保留原有的片庫、評分與播放記錄。如果這些資料很重要，更新前可另外複製 `.luma/library.sqlite` 作為備份。

## 14. 支持開發者

如果 Hinami Fucheng Player 對你有幫助，歡迎前往 [台南意向 Tainan Outlook Facebook 粉絲專頁](https://www.facebook.com/tainanoutlook)：

- 按讚並追蹤粉絲專頁
- 訂閱最新消息
- 分享粉絲專頁或本專案給朋友

謝謝你的支持，這會幫助 Hinami Fucheng Player 持續改善。
