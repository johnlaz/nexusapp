# NEXUS — App Portfolio `v4.0`

> A dark-luxury editorial PWA dashboard for managing, monitoring, and launching a personal suite of web apps. Built as a single HTML file — no frameworks, no build tools, no dependencies.

Live at: `https://johnlaz.github.io/nexus/`

---

## Features

### Dashboard
- **20+ apps pre-loaded** with icons, descriptions, and AI-enriched metadata
- **Pinned Apps Strip** — pin up to 6 apps to a persistent quick-launch bar at the top
- **App Groups** — organize apps into named, collapsible groups (Business, Personal, Kids, etc.)
- **Drag-to-reorder** — drag cards or sidebar items to rearrange; persists across sessions
- **Live status monitoring** — per-app status pips with staggered network checks
- **Scan All** — batch status check with animated progress bar

### Sidebar
- **Collapsible rail** — collapse to 52px icon-only rail on desktop
- **Icon rail mode** — shows app icons + live status pips only when collapsed
- **Mobile drawer** — slides in on phones and tablets (≤1024px)
- **Bottom nav** — persistent Apps / Home / Scan / Settings on mobile

### App Configuration
- Per-app name, description, tag, URL, API key, group, and icon
- **Local HTML embedding** — upload a `.html` file; runs via srcdoc (no server needed); marked ● LOCAL
- Auto metadata scraping via 3-proxy fallback chain
- Groq AI enrichment (llama-3.3-70b-versatile) for names, tags, descriptions
- Manual override protection — user fields never overwritten by scans

### Export / Import

| Export | Contains | Safe to share |
|--------|----------|---------------|
| ⚡ Full Restore | Everything — apps, keys, icons, vault, local HTML, groups, pins, notes | ✗ Personal only |
| Full Suite | Apps, icons, keys, descriptions, Groq key | ✓ |
| Marketing Card | PNG portfolio card (2× retina) | ✓ |

### App Data Vault
- Upload each app's own JSON export — stored inside Nexus
- Download any app's file individually to load into that app manually
- Included automatically in Full Restore

---

## Deployment

1. Copy all files to your GitHub repo root (or just `index.html` for updates)
2. **Settings → Pages → Deploy from branch → main / root**
3. Live at `https://johnlaz.github.io/nexus/`

---

## File Structure

```
nexus/
├── index.html          ← Main app (all logic inline)
├── manifest.json       ← PWA manifest
├── sw.js               ← Service worker (cache: nexus-v3.2)
├── README.md
└── icons/
    ├── favicon.ico
    ├── icon-16.png
    ├── icon-32.png
    ├── icon-192.png
    ├── icon-512.png
    └── apple-touch-icon.png
```

---

## Data & Privacy

All data lives in your browser's `localStorage` — nothing is sent to any server except:

- `api.groq.com` — AI features only, when you manually trigger them
- CORS proxies — metadata scraping when you run Scan
- Google Fonts — font loading only

**Full Restore exports contain API keys and local HTML. Keep private — do not commit to GitHub.**

---

## Version History

| Version | Notes |
|---------|-------|
| v3.2 | Pinned apps strip, app grouping, simplified IO menu |
| v3.1 | Full Restore export, mobile 1024px breakpoint, vault HTML support |
| v3.0 | Local HTML embedding, drag-to-reorder, 20 apps |
| v2.5 | Collapsible sidebar, hardware back intercept, App Data Vault |
| v2.2 | Vault system, debounced save, performance fixes |
| v2.1 | Cyan/purple theme, card glow overhaul |
| v2.0 | 12 apps, Notes, Marketing Card, theme color glows |
| v1.x | Scraping, Groq AI, mobile layout, status monitoring |

---
Built with HTML5 · CSS3 · Vanilla JS · No build tools
