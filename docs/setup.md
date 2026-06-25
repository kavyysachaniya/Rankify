# Setup Guide

## Prerequisites

- **Node.js** v18+ (v22 recommended)
- **npm** v9+
- **Git**

## Quick Start

```bash
# Clone
git clone https://github.com/your-username/Rankify.git
cd Rankify

# Install frontend dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..

# Start both frontend and backend
npm run dev:all
```

The app opens at `http://localhost:5173` with the backend on port `3001`.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (frontend only) |
| `npm run dev:server` | Start Express/Socket.io server (backend only) |
| `npm run dev:all` | Start both concurrently |
| `npm run build` | Build frontend to `dist/` |
| `npm start` | Serve built frontend + backend (production mode) |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build locally via Vite |

## Project Structure

```
Rankify/
├── src/                          # Frontend source
│   ├── components/               # React components
│   │   ├── room/                 # Multiplayer components
│   │   │   ├── RoomView.jsx      # Room router (join/create + phase display)
│   │   │   ├── RoomSetup.jsx     # Admin template editor for rooms
│   │   │   ├── RoomLobby.jsx     # Waiting room + invite link
│   │   │   ├── RankingPhase.jsx  # Live voting UI
│   │   │   ├── ResultsScreen.jsx # Final ranked results
│   │   │   ├── RoomHeader.jsx    # Room status bar
│   │   │   ├── PlayerList.jsx    # Player roster
│   │   │   └── PlayerVotePanel.jsx # Tier vote buttons
│   │   ├── AuthScreen.jsx        # Login / signup form
│   │   ├── StartScreen.jsx       # Home screen
│   │   ├── TierCanvas.jsx        # Tier rows container
│   │   ├── TierRow.jsx           # Single tier row
│   │   ├── TierEditModal.jsx     # Tier settings modal
│   │   ├── ItemPool.jsx          # Unranked items panel + image upload
│   │   ├── ItemCard.jsx          # Draggable item card
│   │   ├── TemplateManager.jsx   # Save/load templates modal
│   │   ├── CommunityTemplates.jsx# Pre-built template gallery
│   │   └── TemplateCard.jsx      # Template preview card
│   ├── hooks/
│   │   ├── useAuth.jsx           # Auth state + template CRUD
│   │   ├── useTierList.js        # Editor state (useReducer)
│   │   ├── useRoom.js            # Room socket events
│   │   └── useRanking.js         # Ranking phase socket events
│   ├── context/
│   │   └── SocketContext.jsx     # Socket.io provider (lazy connect)
│   ├── utils/
│   │   ├── exportImage.js        # html2canvas PNG export
│   │   ├── cropImage.js          # Aspect ratio cropping
│   │   └── uuid.js               # UUID generator
│   ├── constants/
│   │   └── aspectRatios.js       # Aspect ratio options + CSS class map
│   ├── data/
│   │   └── community-templates.json  # Pre-built templates
│   ├── App.jsx                   # Root component + routing
│   ├── main.jsx                  # Entry point + ErrorBoundary
│   └── index.css                 # Global styles + Tailwind import
├── server/
│   ├── index.js                  # Express + Socket.io server
│   ├── roomManager.js            # Room CRUD + player management
│   ├── rankingEngine.js          # Vote processing + results
│   └── package.json              # Server dependencies
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── package.json                  # Frontend dependencies + scripts
├── vite.config.js                # Vite + Tailwind + proxy config
├── eslint.config.js              # ESLint flat config
├── index.html                    # HTML entry point
└── docs/                         # Documentation
```

## Environment Variables

No environment variables are required for local development. The Vite dev server proxies `/socket.io` requests to `http://127.0.0.1:3001` automatically.

For production, only `PORT` matters (most hosting platforms inject it automatically).

For future Supabase integration, you'll need:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Troubleshooting

**Port 3001 already in use:**
```bash
# Find and kill the process
npx kill-port 3001
```

**Node modules out of sync:**
```bash
rm -rf node_modules server/node_modules
npm install && cd server && npm install
```

**Build fails:**
Ensure Node.js v18+. The project uses ES modules (`"type": "module"`).
