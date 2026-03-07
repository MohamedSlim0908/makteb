# Makteb Frontend — Deployment Plan (Beginner-Friendly)

> Your step-by-step guide to deploying the Makteb frontend.
> Designed for someone learning to become a senior dev with the help of agentic AI (Claude Code).

---

## How to use this plan

- Work through each phase in order. Each phase builds on the previous one.
- Use Claude Code to help you with every step — describe what you want, let it write the code, then **read and understand** what it wrote. That's how you learn.
- Check off tasks as you complete them. Don't skip steps.

---

## Phase 0 — Understand what you have (Day 1)

Before writing any code, understand the codebase. This is what senior devs do first.

- [ ] Run `cd client && npm run dev` and click through every page
- [ ] Open `client/src/App.jsx` — read the router, understand which URL goes to which page
- [ ] Open 2-3 page files (`LandingPage.jsx`, `DiscoverPage.jsx`, `DashboardPage.jsx`) — skim them
- [ ] Open `client/src/lib/api.js` — understand how it talks to the backend
- [ ] Open `client/src/store/authStore.js` — understand how login state is managed
- [ ] Run `cd server && npm run dev` alongside the client — test login/register with the real backend

**What you learn:** The full picture. You can't deploy what you don't understand.

---

## Phase 1 — Make the app build-ready (Day 2-3)

Your app must build without errors before you can deploy it.

### 1.1 Environment variables

- [ ] Create `client/.env.production`:
  ```
  VITE_API_URL=https://your-backend-url.com/api
  ```
- [ ] Update `client/src/lib/api.js` to use `import.meta.env.VITE_API_URL` instead of any hardcoded URL
- [ ] Create `client/.env.development` for local dev:
  ```
  VITE_API_URL=http://localhost:4000/api
  ```

### 1.2 Test the production build locally

- [ ] Run `cd client && npm run build` — fix any errors
- [ ] Run `cd client && npm run preview` — test the built app at `http://localhost:4173`
- [ ] Click through pages — make sure routing works, API calls work, login works

### 1.3 Fix common build issues

These are things that work in dev but break in production:

- [ ] Make sure all imports use correct casing (macOS doesn't care, Linux does: `Button.jsx` vs `button.jsx`)
- [ ] Remove any `console.log` that logs sensitive data (tokens, passwords)
- [ ] Check that `vite.config.js` doesn't have a hardcoded proxy that won't exist in production

**Ask Claude Code:** "Check my client code for build issues and hardcoded URLs"

---

## Phase 2 — Deploy the frontend (Day 4-5)

### Option A: Vercel (Recommended for beginners — free, easiest)

Why Vercel: zero config for Vite/React apps, free tier, automatic HTTPS, preview deploys on every PR.

- [ ] Create a [Vercel](https://vercel.com) account (sign in with GitHub)
- [ ] Connect your GitHub repo
- [ ] Set these in Vercel project settings:
  - **Framework Preset:** Vite
  - **Root Directory:** `client`
  - **Build Command:** `npm run build`
  - **Output Directory:** `dist`
- [ ] Add environment variable: `VITE_API_URL` = your backend URL
- [ ] Click Deploy

### Option B: Netlify (Also free, similar to Vercel)

- [ ] Create `client/netlify.toml`:
  ```toml
  [build]
    command = "npm run build"
    publish = "dist"

  # Handle client-side routing (React Router)
  [[redirects]]
    from = "/*"
    to = "/index.html"
    status = 200
  ```
- [ ] Create a [Netlify](https://netlify.com) account
- [ ] Connect your GitHub repo, set base directory to `client`
- [ ] Add environment variable: `VITE_API_URL`
- [ ] Deploy

### Option C: Railway (If you want frontend + backend in one place)

- [ ] Add a `Dockerfile` in `client/`:
  ```dockerfile
  FROM node:20-alpine AS build
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci
  COPY . .
  ARG VITE_API_URL
  RUN npm run build

  FROM nginx:alpine
  COPY --from=build /app/dist /usr/share/nginx/html
  COPY nginx.conf /etc/nginx/conf.d/default.conf
  EXPOSE 80
  CMD ["nginx", "-g", "daemon off;"]
  ```
- [ ] Add `client/nginx.conf`:
  ```nginx
  server {
      listen 80;
      location / {
          root /usr/share/nginx/html;
          try_files $uri $uri/ /index.html;
      }
  }
  ```
- [ ] Deploy on Railway with `VITE_API_URL` set as a build variable

### After deploying

- [ ] Visit your live URL — does the landing page load?
- [ ] Try registering / logging in
- [ ] Check browser console (F12) for errors — especially CORS errors or failed API calls
- [ ] If you see CORS errors: your backend needs to allow your frontend's domain in its CORS config

---

## Phase 3 — Fix post-deployment issues (Day 5-6)

These are the issues every beginner hits. Expect them.

### 3.1 CORS

Your backend must allow your frontend domain. In `server/src/app.js`:
```js
app.use(cors({
  origin: ['http://localhost:5173', 'https://your-deployed-frontend.vercel.app'],
  credentials: true
}));
```

### 3.2 Client-side routing (404 on refresh)

React Router uses client-side URLs. When you refresh `/dashboard`, the server looks for a file called `dashboard` which doesn't exist.

- Vercel: Add `client/vercel.json`:
  ```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
  ```
- Netlify: The `netlify.toml` redirect above handles this
- Nginx: The `try_files` directive above handles this

### 3.3 API URL mismatch

- [ ] Check that `VITE_API_URL` points to your actual backend URL (not localhost)
- [ ] Make sure it includes `/api` if your backend routes start with `/api`
- [ ] No trailing slash: `https://api.makteb.tn/api` not `https://api.makteb.tn/api/`

### 3.4 HTTPS mixed content

If your frontend is on HTTPS (it will be on Vercel/Netlify), your API must also be HTTPS. Browsers block HTTP requests from HTTPS pages.

---

## Phase 4 — Make it production-quality (Week 2)

Now that it's deployed, make it feel real.

### 4.1 Error boundaries

- [ ] Add a React error boundary so the app shows a friendly message instead of a white screen when something crashes
- [ ] Add a custom 404 page for unknown routes

**Ask Claude Code:** "Add a React error boundary and a 404 page to my app"

### 4.2 Loading states

- [ ] Replace any blank screens during data loading with the `Skeleton` and `Spinner` components you already have
- [ ] Show a full-page spinner while checking if the user is logged in (the initial auth check)

### 4.3 Protected routes

- [ ] Create a `ProtectedRoute` component that redirects to `/login` if the user isn't authenticated
- [ ] Wrap all private pages (Dashboard, Settings, Community creation) with it

**Ask Claude Code:** "Create a ProtectedRoute component that checks auth and redirects to login"

### 4.4 SEO basics

- [ ] Set `<title>` and `<meta description>` for the landing page
- [ ] Add an Open Graph image so the link looks good when shared on social media

---

## Phase 5 — Continuous deployment (Week 2-3)

Set it up once, never think about it again.

### 5.1 Auto-deploy on push

If you used Vercel or Netlify, this is already done — every push to `main` auto-deploys.

### 5.2 Preview deploys

Vercel and Netlify create a unique URL for every pull request. Use this to test changes before merging.

### 5.3 GitHub Actions (optional, for tests before deploy)

- [ ] Add a CI workflow that runs `npm run lint` and `npm run build` on every PR
- [ ] Block merging if the build fails

You already have a CI workflow in `.github/` — check if it covers the client.

---

## Phase 6 — Monitor and improve (Ongoing)

### 6.1 Error tracking

- [ ] Add [Sentry](https://sentry.io) (free tier) to catch frontend errors in production
- [ ] When users report bugs, check Sentry first — it shows you the exact error + stack trace

### 6.2 Analytics

- [ ] Add a simple analytics tool (Plausible, Umami, or Google Analytics) to see if anyone visits
- [ ] Track: page views, sign-ups, most visited pages

### 6.3 Performance

- [ ] Run Lighthouse in Chrome DevTools (F12 > Lighthouse tab) — aim for 90+ on Performance
- [ ] Common wins: optimize images, lazy-load pages with `React.lazy()`, use `loading="lazy"` on images

---

## Quick reference — Commands you'll use often

```bash
# Local development
cd client && npm run dev          # Start dev server (hot reload)

# Test production build locally
cd client && npm run build        # Build for production
cd client && npm run preview      # Serve the built files locally

# Check for issues
cd client && npm run lint         # Check code quality

# Deploy (if using Vercel CLI)
npx vercel                        # Deploy to preview
npx vercel --prod                 # Deploy to production
```

---

## How to use Claude Code effectively for each step

1. **Don't just say "deploy my app"** — be specific: "Add environment variables for the API URL in my Vite config"
2. **When you hit an error, paste it** — Claude Code can fix most build/deploy errors if you show the exact error message
3. **After Claude Code writes code, read it** — ask "explain what this code does" if you don't understand
4. **Use Claude Code to debug** — "I'm getting a CORS error in production, here's the console output: ..."
5. **Save what you learn** — when you figure something out, ask Claude Code to update this plan or your project docs

---

## Beginner mistakes to avoid

| Mistake | Why it's bad | What to do instead |
|---------|-------------|-------------------|
| Deploying without testing the build locally | You'll debug deploy issues remotely (slow and painful) | Always `npm run build && npm run preview` first |
| Hardcoding `localhost` in API URLs | Works on your machine, breaks everywhere else | Use `VITE_API_URL` env variable |
| Ignoring CORS errors | "It works in dev" — because Vite proxies. It won't in prod | Configure CORS on your backend for your frontend domain |
| Not reading error messages | You ask for help without context | Read the error, copy it, paste it to Claude Code |
| Trying to do everything at once | You get overwhelmed and nothing works | Follow this plan phase by phase |

---

*This plan was created for the Makteb project on March 4, 2026. Update it as you progress.*
