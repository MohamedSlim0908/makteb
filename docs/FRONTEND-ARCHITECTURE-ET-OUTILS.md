# Architecture frontend Makteb — À quoi sert chaque outil

Ce document décrit **l’architecture du client** et **le rôle de chaque technologie** (React, Vite, React Router, etc.) pour que tu comprennes vraiment à quoi ça sert, pas juste « c’est installé ».

---

## 1. Vue d’ensemble : qui fait quoi

```
index.html
    │
    └── <script type="module" src="/src/main.jsx">
              │
              ▼
         main.jsx  →  monte React dans #root, enveloppe tout dans <StrictMode>
              │
              ▼
         App.jsx   →  Routeur + tous les "providers" (Query, Theme, Toaster)
              │
              ├── ThemeProvider      (thème clair/sombre)
              ├── QueryClientProvider (cache et requêtes serveur)
              ├── BrowserRouter      (routes URL)
              ├── Suspense           (chargement des pages en lazy)
              ├── Routes / Route     (définition des URLs)
              └── Toaster            (notifications toast)
```

- **Point d’entrée navigateur** : `index.html` + `main.jsx`.
- **Cœur de l’app** : `App.jsx` (routage + fourniture de contexte à toute l’app).

---

## 2. Les outils un par un

### 2.1 Vite — Build et dev server

**Rôle :** outil de **build** et **serveur de développement**. Ce n’est pas un framework, c’est ce qui :

- **En dev** : sert tes fichiers, transforme JSX/ES modules à la volée, fait le hot reload.
- **En prod** : bundle ton code (JS/CSS), minifie, génère les assets dans `dist/`.

**Où on le voit :**

- `package.json` : scripts `"dev": "vite"`, `"build": "vite build"`, `"preview": "vite preview"`.
- `vite.config.js` : configuration (plugins React + Tailwind, proxy vers l’API, port 5173).

**Pourquoi Vite et pas Create React App (CRA) ?**  
Vite utilise **esbuild** en dev (très rapide) et **Rollup** en build. CRA est déprécié ; Vite est le standard actuel pour React.

**En résumé :** Vite = « moteur » qui lance l’app et la compile.

---

### 2.2 React — UI en composants

**Rôle :** bibliothèque pour construire l’**interface** en **composants** réutilisables, avec un **état** et un **cycle de vie**.

**Concepts utiles ici :**

- **Composants** : fonctions qui retournent du JSX (ex. `Button`, `Navbar`, `CommunityPage`).
- **Hooks** : `useState`, `useEffect`, `useCallback`, etc. pour l’état et les effets.
- **Contexte** : partager des valeurs sans passer par toutes les props (ex. `ThemeProvider`).
- **StrictMode** (dans `main.jsx`) : aide à repérer des bugs (effets en double en dev).

**Où on le voit :**

- `main.jsx` : `createRoot` + `render` → React monte l’app dans le DOM.
- Tous les fichiers `.jsx` : pages, layouts, composants UI.

**En résumé :** React = la couche qui dessine l’écran et réagit aux actions utilisateur.

---

### 2.3 React Router (react-router-dom) — Routes et URLs

**Rôle :** faire correspondre une **URL** à un **composant** (une page). Sans Router, une seule page ; avec lui, `/login`, `/community/:slug`, etc. affichent chacun leur composant.

**Éléments utilisés dans `App.jsx` :**

- **`BrowserRouter`** : utilise l’API History du navigateur (URLs propres sans `#`).
- **`Routes` / `Route`** : déclaration des chemins et des composants.
- **`Navigate`** : redirection (ex. `*` → `/`).
- **`Outlet`** (dans `AppLayout`) : emplacement où s’affiche la page enfant quand on utilise un layout commun.
- **`useParams`** (dans les pages) : récupérer les paramètres d’URL (ex. `slug`, `id`).
- **`Link`** : liens qui ne rechargent pas toute la page (navigation SPA).

**Exemple de flux :**  
URL `/community/mon-groupe` → Route `path="/community/:slug"` → composant `CommunityPage` → `useParams()` donne `{ slug: 'mon-groupe' }`.

**En résumé :** React Router = « quelle page afficher pour quelle URL ».

---

### 2.4 TanStack Query (React Query) — Données serveur et cache

**Rôle :** gérer les **données qui viennent du serveur** : chargement, cache, revalidation, erreurs. Tu ne gères plus à la main le `loading`, le `error` et le cache.

**Concepts :**

- **`useQuery`** : « récupère cette donnée (ex. communauté par slug), met-la en cache, affiche loading/error ».
- **`useMutation`** : « envoie une action (créer un post, like) puis invalide le cache pour rafraîchir ».
- **`useQueryClient`** : invalider ou mettre à jour le cache (ex. après une mutation).
- **`queryKey`** : identifiant du cache (ex. `['community', slug]`).
- **`staleTime`** (dans `App.jsx`) : durée pendant laquelle la donnée est considérée fraîche (ex. 30 s) avant revalidation.

**Où on le voit :**

- `App.jsx` : `QueryClientProvider` + `QueryClient` avec `staleTime: 30_000`, `retry: 1`.
- Pages comme `CommunityPage` : `useQuery` pour la communauté, `useInfiniteQuery` pour la liste de posts, `useMutation` pour créer un post, puis `queryClient.invalidateQueries(...)` pour mettre à jour l’affichage.

**En résumé :** TanStack Query = « données API + cache + états loading/error » sans réinventer la roue.

---

### 2.5 Zustand — État global côté client

**Rôle :** **store** léger pour l’état qui doit être partagé dans toute l’app (auth, préférences), sans passer par des props ou beaucoup de contexte.

**Dans ce projet :**

- **`authStore`** (`store/authStore.js`) : `user`, `isLoading`, `setUser`, `logout`, etc.
- N’importe quel composant peut faire `useAuthStore()` pour lire ou mettre à jour cet état.

**Pourquoi Zustand et pas Redux ?**  
Zustand est minimal (peu de boilerplate), pas de providers à envelopper partout, et suffisant pour un état global simple (auth, thème, etc.). Redux est utile pour des flux très complexes.

**En résumé :** Zustand = état global client (ici surtout l’auth).

---

### 2.6 Axios — Requêtes HTTP vers l’API

**Rôle :** client HTTP pour appeler le **backend** (GET, POST, etc.) avec une config centralisée.

**Où on le voit :**

- **`lib/api.js`** : instance Axios avec `baseURL` (env ou proxy `/api`), `withCredentials: true` (cookies), intercepteur sur **401** qui tente un refresh token puis réessaie la requête.

**Pourquoi Axios et pas `fetch` ?**  
`fetch` est natif mais plus verbeux ; Axios offre intercepteurs, `baseURL`, gestion des erreurs, et ici le refresh token est plus simple à coder.

**En résumé :** Axios = « la façon standard dans l’app d’appeler l’API », avec refresh token géré au même endroit.

---

### 2.7 Socket.IO client — Temps réel

**Rôle :** connexion **WebSocket** pour recevoir des événements en temps réel (nouveaux posts, commentaires, points, etc.) sans recharger la page.

**Où on le voit :**

- **`lib/socket.js`** : `getSocket()`, `connectSocket()`, `disconnectSocket()` — une seule instance partagée, avec `withCredentials: true` pour les cookies.
- Le serveur utilise des **rooms** (ex. par communauté) ; le client rejoint une room quand il entre dans une communauté.

**Flux typique :**  
Tu entres sur une communauté → le client se connecte au socket et rejoint la room `community:<id>` → le serveur émet `post:created` → le client reçoit et peut invalider les queries ou mettre à jour l’UI.

**En résumé :** Socket.IO = temps réel (notifications, feed, etc.) entre serveur et client.

---

### 2.8 Tailwind CSS — Styles utilitaires

**Rôle :** framework CSS **utility-first** : tu styles avec des classes (ex. `flex`, `rounded-lg`, `bg-gray-100`) au lieu d’écrire du CSS dans des fichiers séparés.

**Où on le voit :**

- **`vite.config.js`** : plugin `@tailwindcss/vite`.
- **`index.css`** : `@import "tailwindcss"` + `@theme` pour les variables (couleurs primary, accent, etc.).
- Tous les composants : `className="flex items-center gap-2 rounded-lg bg-white border ..."`.

**Pourquoi Tailwind ?**  
Cohérence des espacements/couleurs, pas de noms de classes à inventer, purge en prod (CSS minimal), et design system via `@theme`.

**En résumé :** Tailwind = le langage de style de l’app (couleurs, layout, responsive).

---

### 2.9 react-hot-toast — Notifications toast

**Rôle :** afficher des **petits messages** temporaires (succès, erreur, info) en haut ou en bas de l’écran.

**Où on le voit :**

- **`App.jsx`** : `<Toaster position="top-center" toastOptions={{ ... }} />`.
- Dans les pages : `toast.success('Post créé')`, `toast.error('Erreur')`, etc.

**En résumé :** react-hot-toast = retours utilisateur immédiats après une action.

---

### 2.10 Lucide React (et react-icons) — Icônes

**Rôle :** composants **icônes** (SVG) pour boutons, menus, listes, etc.

**Où on le voit :**

- Import : `import { MessageCircle, Search, Users } from 'lucide-react'`.
- Usage : `<MessageCircle className="w-4 h-4" />`.

**En résumé :** icônes cohérentes sans gérer des images ou des sprites.

---

### 2.11 ThemeProvider (lib/theme.jsx) — Thème

**Rôle :** fournir le **thème** (mode clair/sombre) à toute l’app via un **contexte React**. Ici le code force le mode clair et expose `useTheme()`.

**En résumé :** thème centralisé ; plus tard tu peux brancher un vrai toggle clair/sombre ici.

---

### 2.12 Lazy + Suspense — Chargement des pages

**Rôle :**  
- **`lazy(() => import('./pages/...'))** : charge le code d’une page **uniquement quand on navigue dessus** (code splitting).  
- **`Suspense fallback={...}`** : affiche un indicateur de chargement pendant que le chunk de la page se charge.

**Où on le voit :**  
`App.jsx` : chaque page est importée en `lazy`, et tout est dans un `<Suspense>` avec un spinner en fallback.

**En résumé :** première charge plus légère, chargement progressif des écrans.

---

### 2.13 Autres dépendances (présentes ou prévues)

- **TipTap** (`@tiptap/*`) : éditeur de texte riche (pour posts, commentaires). Installé mais pas encore utilisé dans le code (PostComposer utilise encore `textarea`).
- **Leaflet / react-leaflet** : cartes (ex. pour événements ou adresses). Utilisable dans des pages type carte.
- **ESLint** (+ plugins React) : qualité de code et règles React en dev.

---

## 3. Flux de données résumé

| Besoin | Outil | Exemple |
|--------|--------|--------|
| Données serveur (lecture / liste) | TanStack Query | `useQuery(['community', slug], () => api.get(...))` |
| Action serveur puis mise à jour UI | TanStack Query | `useMutation` + `queryClient.invalidateQueries` |
| État global client (auth, préférences) | Zustand | `useAuthStore()` |
| Appels HTTP | Axios | `api.get('/communities/' + slug)` via `lib/api.js` |
| Temps réel | Socket.IO | `getSocket().on('post:created', ...)` |
| Navigation par URL | React Router | `Route`, `Link`, `useParams` |
| Affichage et interaction | React | composants + hooks |
| Styles | Tailwind | `className="..."` |
| Feedback immédiat | react-hot-toast | `toast.success(...)` |

---

## 4. Structure des dossiers côté client

```
client/
├── index.html              # Point d’entrée HTML, script vers main.jsx
├── vite.config.js          # Config Vite (plugins, proxy)
├── src/
│   ├── main.jsx            # Monte React dans #root
│   ├── App.jsx             # Router + providers (Query, Theme, Toaster)
│   ├── index.css           # Tailwind + variables @theme
│   ├── components/         # Réutilisables
│   │   ├── layout/         # Navbar, AppLayout
│   │   ├── ui/             # Button, Input, Card, Modal, etc.
│   │   └── course-community/  # PostCard, PostComposer, Leaderboard, etc.
│   ├── pages/              # Une page par route (Landing, Login, Community, Course…)
│   ├── hooks/              # useAuth (auth + appels API auth)
│   ├── lib/                # api.js (Axios), socket.js, theme.jsx
│   └── store/              # authStore (Zustand)
```

---

## 5. Enchaînement typique (ex. « ouvrir une communauté »)

1. **URL** : utilisateur va sur `/community/mon-groupe`.
2. **React Router** : matche la route, rend `CommunityPage`.
3. **CommunityPage** : `useParams()` → `slug = 'mon-groupe'`.
4. **TanStack Query** : `useQuery({ queryKey: ['community', slug], queryFn: () => api.get(...) })` → appel API via **Axios**.
5. **Axios** : requête vers `/api/communities/mon-groupe` (proxy Vite en dev vers le serveur).
6. **Réponse** : données dans le cache Query, composant se re-render avec la communauté.
7. **Zustand** : si la page a besoin de l’utilisateur connecté, `useAuth()` utilise le store auth.
8. **Socket** : la page peut appeler `connectSocket()` et rejoindre la room de la communauté pour recevoir les nouveaux posts en temps réel.
9. **Tailwind** : tout le rendu visuel est fait avec des classes dans les composants.

Tu peux reprendre ce document et le garder à jour au fur et à mesure que tu ajoutes des écrans ou des librairies (ex. quand TipTap sera branché dans PostComposer).
