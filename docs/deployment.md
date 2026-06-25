# Deployment Guide

## Why Not Vercel?

Rankify uses Socket.io for real-time multiplayer. Vercel's serverless functions don't support persistent WebSocket connections. You need a platform that runs a long-lived Node.js process.

## Recommended Platforms

### Render (Free Tier)

1. Push repo to GitHub
2. Go to [render.com](https://render.com) → **New** → **Web Service**
3. Connect your GitHub repo
4. Configure:

| Setting | Value |
|---------|-------|
| Root Directory | *(leave blank)* |
| Build Command | `npm install && cd server && npm install && cd .. && npm run build` |
| Start Command | `npm start` |
| Environment | Node |

5. Deploy — Render injects `PORT` automatically

**Free tier note:** Render free services spin down after 15 minutes of inactivity. First request after spin-down takes ~30 seconds. Upgrade to paid ($7/mo) for always-on.

### Railway

1. Push repo to GitHub
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
3. Configure:

| Setting | Value |
|---------|-------|
| Build Command | `npm install && cd server && npm install && cd .. && npm run build` |
| Start Command | `npm start` |

4. Railway auto-detects Node.js and injects `PORT`

**Pricing:** $5/mo includes $5 of usage (generous for small apps).

### Fly.io

1. Install CLI: `curl -L https://fly.io/install.sh | sh`
2. Create a `Dockerfile` in the project root:

```dockerfile
FROM node:22-slim
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY server/package*.json ./server/
RUN cd server && npm install

COPY . .
RUN npm run build

EXPOSE 3001
CMD ["npm", "start"]
```

3. Run:
```bash
fly launch
fly deploy
```

**Pricing:** Free tier includes 3 shared VMs.

## Production Build

```bash
# Build frontend
npm run build

# Start production server (serves frontend + WebSocket)
npm start
```

The server auto-detects the `dist/` folder and serves it. All non-API routes return `index.html` for SPA routing.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3001` | Server port (most platforms inject this) |
| `VITE_SUPABASE_URL` | No* | — | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | No* | — | Supabase public API key |

*Required after Supabase integration.

**Note:** `VITE_*` variables are embedded at build time, not runtime. Set them before running `npm run build`.

## Production Checklist

### Before Going Live

- [ ] Restrict CORS origin in `server/index.js`:
  ```js
  const io = new Server(httpServer, {
    cors: { origin: 'https://your-domain.com' },
  })
  ```
- [ ] Add rate limiting:
  ```bash
  npm install express-rate-limit
  ```
  ```js
  import rateLimit from 'express-rate-limit'
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }))
  ```
- [ ] Integrate Supabase auth (see `ROADMAP.md`) — localStorage auth is not secure for public use
- [ ] Set up a custom domain
- [ ] Add error monitoring (Sentry, LogRocket, etc.)

### After Going Live

- [ ] Monitor memory usage — all rooms are in-memory; many concurrent rooms = high RAM
- [ ] Set up health checks — hosting platforms usually provide these
- [ ] Add analytics (Plausible, PostHog, etc.)

## Custom Domain

Most platforms support custom domains:

- **Render:** Settings → Custom Domains → add your domain → update DNS
- **Railway:** Settings → Domains → add domain → update DNS
- **Fly.io:** `fly certs add your-domain.com` → update DNS

## Scaling Considerations

The current architecture works for **hundreds of concurrent rooms** on a single server. Beyond that:

| Bottleneck | Solution |
|-----------|----------|
| Room state in memory | Add Redis for shared state across instances |
| Single server | Use Socket.io Redis adapter for multi-instance |
| Large base64 images | Move to Supabase Storage / S3 |
| Client bundle size (598KB) | Code-split multiplayer routes with `React.lazy()` |
