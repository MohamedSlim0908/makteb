# Developer workflow: local → production

How to develop Makteb and take it to production. Use this with [FRONTEND-DEPLOYMENT-PLAN.md](./FRONTEND-DEPLOYMENT-PLAN.md) for the full deployment checklist.

---

## 1. Local development

**One terminal – frontend (Vite):**
```bash
cd client && npm run dev
```
Runs at `http://localhost:5173`. Vite proxies `/api`, `/auth`, `/socket.io` to the backend.

**Second terminal – backend (Express):**
```bash
cd server && npm run dev
```
Runs at `http://localhost:4000`. Uses `.env` at project root (see below).

**Optional – DB and Redis:**
- PostgreSQL: set `DATABASE_URL` in `.env`; run `npm run db:push` in `server/` when schema changes.
- Redis: optional for sessions/queues; default `redis://localhost:6379`.

Use **Phase 0** of the deployment plan to get familiar with the app before deploying.

---

## 2. Environment variables

**Root `.env` (backend and tooling):**
Copy `.env.example` from the project root and fill in values. At least:

```env
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://user:pass@localhost:5432/makteb
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret
```

For production, set `CLIENT_URL` to your deployed frontend URL (e.g. `https://makteb.vercel.app`) so CORS works.

**Client (Vite):**
- **Development:** No file needed. The app uses Vite’s proxy; `VITE_API_URL` is optional and defaults to `/api`.
- **Production:** Set `VITE_API_URL` where you build/deploy (e.g. Vercel env):
  ```env
  VITE_API_URL=https://api.yoursite.com/api
  ```
  No trailing slash. The client’s `api.js` uses this when set.

---

## 3. Getting production-ready (build & preview)

Before deploying:

1. **Backend:** Ensure production `.env` has real `DATABASE_URL`, `JWT_*`, and `CLIENT_URL` (your frontend URL).
2. **Frontend:** Set `VITE_API_URL` for the build (see above).
3. **Build and test locally:**
   ```bash
   cd client && npm run build && npm run preview
   ```
   Open `http://localhost:4173`, test login, API calls, and navigation.
4. **Lint:** `cd client && npm run lint` (fix any errors).

Then follow **Phases 1–3** of the deployment plan (env, build, deploy, CORS, routing).

---

## 4. Deploying

- **Frontend:** Use the deployment plan (Vercel / Netlify / Railway). Set **Root Directory** to `client`, **Build** to `npm run build`, **Output** to `dist`, and add `VITE_API_URL` in the host’s env.
- **Backend:** Deploy the `server/` app to a Node host (Railway, Render, Fly.io, etc.). Set env there (including `CLIENT_URL` = your frontend URL). Run migrations (`db:push` or your migration command) on the production DB.
- **CORS:** Backend already uses `CLIENT_URL` / `clientUrls` in `server/src/config/env.js`. Set `CLIENT_URL` to your production frontend URL so the API allows that origin.

---

## 5. After deploy

- Hit the frontend URL and test: landing, register, login, main flows.
- If you see CORS errors: double-check `CLIENT_URL` and that the frontend URL has no trailing slash.
- If refresh on a route gives 404: add SPA fallback (see deployment plan – `vercel.json`, `netlify.toml`, or nginx `try_files`).
- **Socket.io:** The client currently connects to the same origin. If the API is on another domain, you’ll need to point the socket client at the backend (e.g. a `VITE_WS_URL` or base URL from `VITE_API_URL`) and ensure the server allows that origin for WebSockets.

---

## 6. Day-to-day flow

| Task              | Command / action |
|-------------------|------------------|
| Run app locally   | `client`: `npm run dev`; `server`: `npm run dev` |
| Test prod build   | `cd client && npm run build && npm run preview` |
| Lint client       | `cd client && npm run lint` |
| DB schema change  | Edit `server/prisma/schema.prisma`, then `cd server && npm run db:push` |
| Deploy frontend   | Push to `main` (if Vercel/Netlify connected) or run host’s deploy command |

Use the deployment plan for the full checklist (env files, CORS, routing, error boundaries, protected routes, CI, monitoring).
