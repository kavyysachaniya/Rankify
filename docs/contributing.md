# Contributing

## Development Setup

```bash
git clone https://github.com/your-username/Rankify.git
cd Rankify
npm install
cd server && npm install && cd ..
npm run dev:all
```

## Code Style

- **No TypeScript** — plain JavaScript with JSX
- **Tailwind CSS** — no custom CSS classes, utility-first
- **No comments** unless the "why" is non-obvious
- **Functional components** only — no class components
- **Hooks** for all state and side effects
- Run `npm run lint` before committing

## Branch Strategy

- `main` — production-ready code
- Feature branches — `feature/shareable-links`, `fix/export-bug`, etc.
- PRs into `main`

## Architecture Decisions

### Why localStorage for auth?

Speed of development. Supabase integration is planned (see `ROADMAP.md`) but the current system lets users start immediately without email verification or account setup.

### Why no TypeScript?

Prioritized shipping speed over type safety. The app is small enough that runtime errors are caught quickly. TypeScript migration is welcome as the codebase grows.

### Why Socket.io over WebSocket API?

Socket.io provides automatic reconnection, room management, acknowledgement callbacks, and fallback to HTTP long-polling. These features would require significant code to implement with raw WebSockets.

### Why html2canvas over dom-to-image?

html2canvas has better browser support and handles more CSS edge cases. The oklch color conversion workaround is needed because Tailwind v4 uses modern color formats that html2canvas doesn't understand natively.

### Why base64 images in localStorage?

Simplicity. No server-side storage needed. The tradeoff is a ~5-10MB localStorage limit per origin. Supabase Storage will replace this for cloud-hosted images.

## Testing Multiplayer Locally

Open two browser windows (or one regular + one incognito):

1. Window 1: Create a room → copy the URL
2. Window 2: Paste the URL → join with a different name
3. Window 1 (admin): Start Setup → add items → Start Ranking
4. Both windows: Vote on items
5. Both windows: See results

## Adding a New Community Template

Edit `src/data/community-templates.json`:

```json
{
  "id": "tmpl-your-category-name",
  "name": "Your Template Name",
  "category": "games",
  "itemCount": 10,
  "data": {
    "tiers": [
      { "id": "t1", "name": "S", "color": "#d4a0a0", "bgImage": null, "icon": null, "visualMode": "color", "items": [] },
      { "id": "t2", "name": "A", "color": "#d4b8a0", "bgImage": null, "icon": null, "visualMode": "color", "items": [] }
    ],
    "items": [
      { "id": "x1", "type": "text", "label": "Item Name", "bgColor": "#333333", "bgImage": null, "icon": null, "aspectRatio": "square" }
    ],
    "pool": ["x1"]
  }
}
```

Categories with built-in colors: `movies`, `games`, `sports`, `music`, `anime`, `food`.

## File Naming Conventions

- Components: `PascalCase.jsx` (e.g. `TierCanvas.jsx`)
- Hooks: `camelCase.js` or `.jsx` (e.g. `useTierList.js`)
- Utils: `camelCase.js` (e.g. `exportImage.js`)
- Constants: `camelCase.js` (e.g. `aspectRatios.js`)
