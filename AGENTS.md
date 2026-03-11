# AGENTS.md

## Cursor Cloud specific instructions

This is the `club-system` repository — a campus club activity management system built with **Uniapp (Vue 3) + Node.js/Express + MongoDB**.

### Architecture

| Service | Directory | Port | Description |
|---------|-----------|------|-------------|
| Backend API | `server/` | 3000 | Express.js REST API |
| Frontend H5 | `client/` | 5173 | Uniapp Vue 3 (H5 mode) with Vite |
| MongoDB | — | 27017 | Data storage |

### Starting services

1. **MongoDB**: `mongod --fork --logpath /tmp/mongod.log --dbpath /data/db`
2. **Seed data** (first time): `cd server && node seed.js`
3. **Backend**: `cd server && npm run dev` (uses nodemon for hot-reload)
4. **Frontend**: `cd client && npm run dev:h5` (Vite dev server at port 5173, proxies `/api` to backend)

### Key caveats

- The Uniapp `@dcloudio` packages require `vite@5.2.8` exactly (peer dependency). Do not upgrade Vite without checking compatibility.
- Frontend proxy is configured in `client/vite.config.js` — all `/api` requests proxy to `http://localhost:3000`.
- MongoDB must be running before starting the backend server.
- Test accounts: `admin/123456` (admin), `zhangsan/123456` (club admin), `lisi/123456` (student), `wangwu/123456` (student).

### Commands reference

See `README.md` for full API reference and project structure. Key scripts are in the root `package.json`.
