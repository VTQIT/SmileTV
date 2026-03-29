# SmileTV 📺

SmileTV is a high-performance, mobile-first IPTV web application designed for a seamless live television experience. Built with a futuristic glassmorphism aesthetic, it allows users to easily load, manage, and watch their favorite IPTV streams directly in the browser.

![SmileTV Preview](https://picsum.photos/seed/smiletv/1200/600)

## ✨ Features

- **🚀 Instant Playback**: Powered by HLS.js for low-latency `.m3u8` streaming.
- **📂 Smart M3U Parsing**: Upload or drag-and-drop `.m3u` files to instantly extract channel names, logos, and categories.
- **🌐 Remote Playlists**: Load playlists directly from URLs (supports CORS-enabled links).
- **📰 News Hub**: Quick-access buttons for the official `iptv-org` global news and index playlists.
- **📱 Mobile Priority**: Optimized touch targets (44px+), responsive grids, and floating navigation for a native-app feel.
- **❤️ Favorites & History**: Save your most-watched channels and quickly resume from your recent history.
- **🔍 Advanced Filtering**: Search by channel name or filter by category with smooth, animated transitions.
- **🛠️ Manual Addition**: Add individual channels manually with custom names, URLs, and logos.
- **🌙 Glassmorphism UI**: A dark, futuristic interface with blurred surfaces and vibrant orange accents.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Video Engine**: HLS.js
- **Animations**: Motion (Framer Motion)
- **Build Tool**: Vite 6

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd smiletv
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 How to Use

1. **Load Channels**: Use the "Upload" button to select an `.m3u` file, or click the "URL" button to paste a link to a remote playlist.
2. **Quick Start**: Click the **"News"** or **"iptv-org"** buttons in the header to instantly load curated channels from the `iptv-org` repository.
3. **Watch**: Click any channel card to open the player. Use the **'F'** key for fullscreen and **'Esc'** to close the player.
4. **Favorites**: Click the heart icon on any channel to add it to your favorites list.

## ⚠️ Important Notes

- **CORS Restrictions**: Some remote playlists may fail to load due to browser CORS policies. If a URL fails, try downloading the `.m3u` file and uploading it manually.
- **Stream Availability**: SmileTV does not host any content. Stream availability depends entirely on the source provided in your M3U playlist.

## 🙏 Credits

- Streams provided by the amazing [iptv-org](https://github.com/iptv-org/iptv) community.
- UI inspired by modern futuristic design trends.

---

Built with ❤️ for the open-source IPTV community.
