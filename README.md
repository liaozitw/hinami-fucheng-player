# Hinami Fucheng Player

[English](README.md) · [繁體中文](docs/USER_GUIDE.md) · [日本語](docs/README.ja.md)

Hinami Fucheng Player is a private, cross-platform video library and VR player built with TypeScript. It indexes local folders, generates thumbnails, and streams original video files directly without playback transcoding.

Your videos, paths, ratings, tags, and watch history stay on your own computer. The application does not upload your media to a cloud service.

## Highlights

- Streaming-platform-style library interface
- Cross-platform folder picker for macOS, Windows, and Linux desktops
- Independent scan controls for every source directory
- Configurable video extensions and excluded folders
- Folder hierarchy converted into searchable Tags
- Direct original-file streaming with byte-range seeking
- Dedicated category and source-directory browsing with pagination
- 180°/360° VR viewing with drag and zoom controls
- Private Good/Average/Bad ratings with CSV export
- Local watch history and playback progress
- SQLite storage with a complete local reset option
- English, Traditional Chinese, and Japanese interface

## Requirements

- macOS, Linux, or Windows 10/11
- Node.js 24 LTS or newer
- npm
- FFmpeg and FFprobe
- Linux folder picker: Zenity or KDialog; full paths can always be entered manually

## Quick start

```bash
git clone https://github.com/liaozitw/hinami-fucheng-player.git
cd hinami-fucheng-player
npm install
npm run dev
```

Open <http://localhost:8787>. The directory administration page is available at <http://localhost:8787/admin>.

Adding a directory does not scan it automatically. Open Admin and start the first scan manually for that directory.

## Installation

### macOS

```bash
brew install node ffmpeg
npm install
npm run dev
```

### Ubuntu / Debian

```bash
sudo apt update
sudo apt install -y git curl ffmpeg zenity
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.5/install.sh | bash
\. "$HOME/.nvm/nvm.sh"
nvm install 24
npm install
npm run dev
```

KDE users can use KDialog instead of Zenity.

### Fedora

```bash
sudo dnf install -y git curl ffmpeg-free zenity
```

Install a current Node.js LTS release, then run `npm install` and `npm run dev`.

### Arch Linux

```bash
sudo pacman -Syu --needed git nodejs npm ffmpeg zenity
npm install
npm run dev
```

### Windows

Open PowerShell:

```powershell
winget install --id Git.Git -e
winget install --id OpenJS.NodeJS.LTS -e
winget install --id Gyan.FFmpeg -e
git clone https://github.com/liaozitw/hinami-fucheng-player.git
cd hinami-fucheng-player
npm install
npm run dev
```

The Windows version uses the native folder selection dialog. A full path such as `D:\Movies` can also be entered manually.

## Production mode

```bash
npm run build
npm start
```

## Platform folder selection

- macOS: native Finder folder dialog
- Windows: native Windows folder dialog
- Linux: Zenity first, then KDialog
- All platforms: manual absolute-path input remains available

The service must run on the same computer that stores the videos. A browser on another device cannot choose folders from that device through the server-side picker.

## Data and privacy

Runtime data is stored under `.luma/` and excluded from Git:

- `library.sqlite`: directories, video index, ratings, history, Tags, and settings
- `cache/`: generated thumbnails

Removing a source or performing a full reset does not delete, move, or modify the original videos.

## Documentation

- [Traditional Chinese user guide](docs/USER_GUIDE.md)
- [Japanese introduction](docs/README.ja.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Brand and content rights notice](BRAND_AND_CONTENT_NOTICE.md)
- [Third-party notices](THIRD_PARTY_NOTICES.md)

## Support the developer

If Hinami Fucheng Player is useful to you, please support [Tainan Outlook on Facebook](https://www.facebook.com/tainanoutlook) by liking, following, sharing, and subscribing for updates.

## License and content rights

Original source code and software documentation in this repository are licensed under the [MIT License](LICENSE).

The MIT License does not automatically apply to character identities, names, illustrations, photographs, videos, audio, logos, articles, user media, or third-party content. See [BRAND_AND_CONTENT_NOTICE.md](BRAND_AND_CONTENT_NOTICE.md) for the complete scope.

FFmpeg is an external program with its own licensing conditions. Distributors are responsible for reviewing the licenses and build configuration of the FFmpeg package they ship.

## Project identity

Hinami Fucheng, also known as 府城・日南, represents sunlight, warmth, time, and the unhurried rhythm of Tainan. Read the [character introduction](https://www.tainanoutlook.com/blog/1003190263).
