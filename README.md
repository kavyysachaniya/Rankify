# Rankify

**Rank anything. Your way.**

A collaborative tier-list ranking app with drag-and-drop editing, real-time multiplayer voting, and PNG export. Built with React 19 + Vite + Tailwind CSS + Socket.io.

## Features

- **Drag-and-drop tier list editor** — rank images or text items across customizable S-F tiers
- **Image support** — drag images from Google, your browser, or desktop; auto-crops to selected aspect ratio
- **Text items** — add labeled items with custom colors, backgrounds, and icons
- **Tier customization** — rename, recolor, add background images or icons, reorder, add/remove rows
- **Real-time multiplayer** — create rooms, invite friends, vote simultaneously on item placements
- **Community templates** — pre-built templates for movies, games, sports, music, anime, food
- **Save/load templates** — save your tier lists and reload them later
- **PNG export** — download your ranked tier list as an image
- **Mobile-friendly** — tap-to-place on mobile, drag-and-drop on desktop

## Quick Start

```bash
git clone https://github.com/your-username/Rankify.git
cd Rankify

npm install
cd server && npm install && cd ..

npm run dev:all
```

Open `http://localhost:5173` — sign up, create a tier list, and start ranking.

## Documentation

| Document | Description |
|----------|-------------|
| [Setup Guide](docs/setup.md) | Installation, scripts, project structure, environment variables, troubleshooting |
| [Frontend Architecture](docs/frontend.md) | React components, state management, hooks, drag-and-drop, image handling |
| [Backend Architecture](docs/backend.md) | Express server, Socket.io, room lifecycle, ranking algorithm, data model |
| [Application Flows](docs/flow.md) | Auth flow, editor flow, multiplayer flow, image processing, data persistence |
| [Socket.io API Reference](docs/api.md) | All client/server events, request/response formats, room object schema |
| [Deployment Guide](docs/deployment.md) | Render / Railway / Fly.io setup, production checklist, scaling considerations |
| [Contributing](docs/contributing.md) | Code style, architecture decisions, testing multiplayer, adding templates |
| [Supabase Roadmap](ROADMAP.md) | Step-by-step guide for Supabase auth + database integration, feature ideas |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Tailwind CSS 4 |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Routing | react-router-dom 7 |
| Image Export | html2canvas |
| Real-time | Socket.io (client + server) |
| Backend | Express 5, Node.js |
| Auth | localStorage (Supabase planned) |
| Storage | localStorage (Supabase planned) |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:all` | Start frontend + backend for development |
| `npm run build` | Build frontend to `dist/` |
| `npm start` | Production server (serves frontend + WebSocket) |
| `npm run lint` | Run ESLint |

## Multiplayer

1. Click **Start Multiplayer** on the home screen
2. Enter a display name to create a room
3. Share the room link with friends
4. Admin sets up the template and starts ranking
5. Everyone votes on each item — consensus determines placement
6. Export the results as a PNG

## License

MIT
