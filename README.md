# 🔥 Faahh — AI Roast-to-Work

> The focus app that roasts you back to work. Powered by Claude AI.

[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-33-blue)](https://electronjs.org)
[![Claude AI](https://img.shields.io/badge/AI-Claude%20by%20Anthropic-blueviolet)](https://anthropic.com)

---

## What is Faahh?

Faahh sits quietly in your system tray and watches for idle time. The moment you slack off, it fires a brutally honest (or motivationally unhinged) AI-generated roast — loud sound included — until you get back to work.

No dashboards. No blockers. Just instant chaos and shame.

**Inspired by the original [Faahh on Product Hunt](https://www.producthunt.com/products/faahh-app-that-roasts-you-back-to-work).**

---

## Features

| Feature | Details |
|---|---|
| 🕐 Idle Detection | Detects inactivity via system power monitor (1–30 min threshold) |
| 🤖 AI Roasts | Claude AI generates personalized roasts (brutal / gentle / hype modes) |
| 🔕 Offline Mode | 32 built-in roasts when no API key is set |
| 🔊 Sound Alert | Plays a loud beep + shows desktop notification |
| 🎵 Custom Sounds | Drop in any MP3/WAV for your personal alarm |
| 📊 Stats & Streaks | Track daily roasts received and focus day streaks |
| 🚀 Auto-start | Launch at login support |
| 🔒 Private | Zero telemetry, all data stored locally |

---

## Open Source MCP Connector — Anthropic Claude SDK

This project uses the **[`@anthropic-ai/sdk`](https://github.com/anthropics/anthropic-sdk-node)** as its AI connector.

When idle time is detected, the app calls Claude (Haiku model — fast & cheap) with a persona-specific system prompt to generate a fresh roast. Three roast personas ship out of the box:

- **Brutal** — Gordon Ramsay meets Dave Chappelle, zero mercy
- **Gentle** — Disappointed-but-loving-parent energy
- **Hype** — Tony Robbins meets The Rock

No API key? No problem — Faahh falls back to 32 hand-crafted offline roasts instantly.

---

## Quick Start

### Prerequisites
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com) *(optional — offline roasts work without one)*

### Install & Run

```bash
git clone https://github.com/jitu2611/faahh-roast-to-work.git
cd faahh-roast-to-work
npm install
npm start
```

Faahh will appear in your system tray. Right-click to open Settings and configure your idle threshold and API key.

---

## Configuration

All settings are managed via the in-app Settings window (right-click tray icon → Settings):

| Setting | Default | Description |
|---|---|---|
| Idle threshold | 5 min | Minutes of inactivity before roasting |
| Roast mode | Brutal | brutal / gentle / motivational |
| Anthropic API key | *(empty)* | Enables AI roasts |
| Sound | On | Play alert sound on roast |
| Custom sound | *(none)* | Override default beep with your file |
| Auto-start | Off | Launch at system login |

---

## Build for Distribution

```bash
# All platforms
npm run build

# Platform-specific
npm run build:win    # Windows NSIS installer + portable
npm run build:mac    # macOS DMG
npm run build:linux  # AppImage + .deb
```

---

## Project Structure

```
faahh-roast-to-work/
├── src/
│   ├── main.js           # Electron main — tray, idle monitor, IPC
│   ├── preload.js        # Context bridge for renderer
│   ├── roast-engine.js   # Claude AI roast generation (Anthropic SDK)
│   ├── sound-player.js   # Cross-platform audio playback
│   └── stats-tracker.js  # Streak & daily stats
├── renderer/
│   ├── settings/         # Settings UI
│   └── stats/            # Stats & streak UI
├── sounds/
│   └── faahh.wav         # Default alert sound
└── assets/
    └── tray-icon.png     # System tray icon
```

---

## Contributing

PRs welcome! Ideas for future features:

- [ ] Calendar integration (don't roast during meetings)
- [ ] Website/app detection for smarter idle context
- [ ] Multiple roast sound packs
- [ ] Windows/Linux taskbar support
- [ ] Mobile companion app push notifications

---

## License

MIT © 2026 [jitu2611](https://github.com/jitu2611)
