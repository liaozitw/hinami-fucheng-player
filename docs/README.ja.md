# Hinami Fucheng Player

[English](../README.md) · [繁體中文](USER_GUIDE.md) · [日本語](README.ja.md)

Hinami Fucheng Player は、TypeScript で開発されたローカル動画ライブラリ兼 VR プレイヤーです。macOS、Windows、Linux に対応し、動画・パス・評価・再生履歴はクラウドへアップロードされず、すべて自分のコンピューターに保存されます。

## 主な特徴

- macOS、Windows、Linux のフォルダー選択画面に対応
- ソースフォルダーごとの手動スキャン、進捗表示、キャンセル
- フォルダー階層からタグを自動生成
- 元動画ファイルの直接ストリーミングと Range シーク
- カテゴリー／ソースフォルダー別表示とページ分割
- 180°／360° VR、視点ドラッグ、ズーム
- 「良い／普通／良くない」の個人評価と CSV 出力
- SQLite によるローカル保存
- English／繁體中文／日本語の画面切り替え

## クイックスタート

Node.js 24 LTS 以上、npm、FFmpeg、FFprobe が必要です。

```bash
git clone https://github.com/liaozitw/hinami-fucheng-player.git
cd hinami-fucheng-player
npm install
npm run dev
```

ブラウザーで <http://localhost:8787> を開きます。管理画面は <http://localhost:8787/admin> です。

フォルダーを追加しても自動スキャンは始まりません。管理画面から対象フォルダーの「スキャン」を手動で実行してください。

## フォルダー選択

- macOS：Finder のフォルダー選択画面
- Windows：Windows 標準のフォルダー選択画面
- Linux：Zenity または KDialog
- すべての環境で絶対パスを直接入力できます

## 開発者を応援

このプロジェクトが役に立った場合は、[台南意向 Tainan Outlook の Facebook ページ](https://www.facebook.com/tainanoutlook)で「いいね」、フォロー、シェア、購読をお願いします。

## ライセンス

このリポジトリのオリジナルのソースコードとソフトウェア文書は [MIT License](../LICENSE) で公開されています。ブランド、キャラクター、画像、動画、音声、記事、利用者が追加したメディア、第三者コンテンツには自動的に適用されません。詳細は [権利に関する声明](../BRAND_AND_CONTENT_NOTICE.md)を参照してください。
