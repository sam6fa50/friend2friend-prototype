# Friend2Friend — Interactive Prototype

A clickable, interactive prototype of the **Friend2Friend** app — a
location-based social app that connects people nearby who share interests.

It renders inside a simulated iOS 26 device frame (402 × 874) and is fully
interactive — swipe to match, send messages, edit your bio, climb the
leaderboard, block users, and more.

> Built for the UCI INF43 group project. The requirements / architecture / UI
> design docs live in the team's coursework repo; this repo is just the
> runnable prototype.

## Tech

- **React 18** + **Babel Standalone**, both loaded from a CDN (unpkg).
- **No build step and no dependencies to install.** The `.jsx` files are
  compiled in the browser at load time.
- Each module attaches its components to `window`; `app.jsx` wires them together.

## Running it locally

The page loads its `.jsx` modules with `<script src="...">`, which browsers
block over the `file://` protocol. So serve the folder over HTTP rather than
double-clicking the file:

```bash
# from this repo's root
python -m http.server 8000
```

Then open: <http://localhost:8000/Friend2Friend.html>

Any static server works (`npx serve`, the VS Code "Live Server" extension,
etc.). The page auto-scales to fit your window.

> Note: the prototype fetches React/Babel from unpkg, so the first load needs
> an internet connection.

## Hosting on GitHub Pages

This repo is static and Pages-ready (a `.nojekyll` file is included so the
files are served as-is). To publish:

1. **Settings → Pages → Source: "Deploy from a branch"**, pick your branch and
   the **`/ (root)`** folder, then Save.
2. After it deploys, the app is at:
   `https://<your-username>.github.io/<repo-name>/Friend2Friend.html`

## Using the app

- **Onboarding (first launch):** welcome → pick interests → set your visibility
  radius. To replay it: `localStorage.removeItem('f2f_onboarded'); location.reload();`
- **Discover** 🏠 — drag cards left/right (or use ✕ / ♥) to pass or connect.
  A right-swipe creates a chat. Tap the info bar for the full profile + block.
- **Messages** 💬 — **Chats** (open one to send messages) and **Invites**
  (Accept/Decline). The ••• menu in a chat blocks the person.
- **Leaderboard** 🏆 — Nearby / California / National scopes, your stats card,
  and ranked members. Blocked users appear grayed out.
- **Profile** 👤 — edit your bio (255-char limit + content moderation), toggle
  socials, manage interests, set location sharing + radius, and equip up to 5
  badges. **Preview** shows how others see you.

## Files

| File | Role |
|------|------|
| `Friend2Friend.html` | Entry point — loads React/Babel and all modules, mounts the app |
| `ios-frame.jsx` | iOS 26 device bezel, status bar, nav bar, on-screen keyboard |
| `data.jsx` | Mock data (UCI / Petr the Anteater theme) |
| `ui.jsx` | Shared components: icons, avatar, interest pill, map, social chips, bottom nav, toast |
| `sheets.jsx` | Bottom sheets: interest search, block scopes, profile detail |
| `discover.jsx` | Discover — Tinder-style swipe deck |
| `messages.jsx` | Messages — DM list, chat view, invites (accept/decline) |
| `leaderboard.jsx` | Leaderboard — ranked board + personal stats card |
| `profile.jsx` | Profile / bio editor — bio moderation, socials, interests, radius, badges |
| `onboarding.jsx` | First-launch onboarding flow (3 steps) |
| `app.jsx` | App shell — routing, state, match/block/toast logic |

## Features covered

Multi-interest subscription · User bio (with moderation) · In-app chat ·
Leaderboard · User blocking (scoped) · Profile badges · User range.

---

*Generated from a Claude Design (claude.ai/design) handoff bundle.*
