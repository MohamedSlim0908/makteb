# Makteb — Documentation Projet

> Plateforme communautaire d'apprentissage en ligne : cours, discussions, gamification et paiements.

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Stack technique](#2-stack-technique)
3. [Architecture du projet](#3-architecture-du-projet)
   - 3.1 [Structure des dossiers](#31-structure-des-dossiers)
   - 3.2 [Frontend](#32-frontend)
   - 3.3 [Backend](#33-backend)
   - 3.4 [Base de données](#34-base-de-données)
   - 3.5 [Temps réel](#35-temps-réel)
   - 3.6 [Authentification](#36-authentification)
4. [Modules fonctionnels](#4-modules-fonctionnels)
5. [API — Endpoints disponibles](#5-api--endpoints-disponibles)
6. [Points forts actuels](#6-points-forts-actuels)
7. [Points à améliorer](#7-points-à-améliorer)
8. [Plan de développement en équipe de 3](#8-plan-de-développement-en-équipe-de-3)
   - 8.1 [Répartition des rôles](#81-répartition-des-rôles)
   - 8.2 [Workflow Git](#82-workflow-git)
   - 8.3 [Mise en place avant le Sprint 1](#83-mise-en-place-avant-le-sprint-1)
   - 8.4 [Déroulement d'un sprint](#84-déroulement-dun-sprint-2-semaines)
   - 8.5 [Cycle concret pour chaque tâche](#85-cycle-concret-pour-chaque-tâche)
   - 8.6 [Ordre de démarrage du Sprint 1](#86-ordre-de-démarrage-du-sprint-1)
   - 8.7 [Sprints suggérés](#87-sprints-suggérés)
   - 8.8 [Plan MVP — Première version déployable](#88-plan-mvp--première-version-déployable-promotion-du-produit)
9. [Démarrage rapide](#9-démarrage-rapide)

---

## 1. Vue d'ensemble

**Makteb** (مكتب) est une plateforme qui combine :

- Des **communautés** thématiques (publiques ou privées, gratuites ou payantes)
- Des **cours** structurés (modules → leçons : texte, vidéo, quiz)
- Un **forum** de discussion par communauté (posts, commentaires, likes)
- Un système de **gamification** (points, niveaux, classement)
- Des **paiements** via Flouci (gateway tunisien)

L'application est composée de deux parties indépendantes qui communiquent via une API REST et WebSocket :

```
client/   →  React 19 + Vite
server/   →  Express 5 + Prisma + PostgreSQL + Redis
```

---

## 2. Stack technique

| Couche | Technologie | Rôle |
|---|---|---|
| **Frontend** | React 19, Vite 7 | UI principale |
| **Routing** | React Router v7 | Navigation côté client |
| **State serveur** | TanStack Query v5 | Cache + fetching des données |
| **State client** | Zustand v5 | Auth, UI globale |
| **Styles** | Tailwind CSS v4 | Design system utilitaire |
| **HTTP** | Axios v1 | Requêtes + intercepteur refresh automatique |
| **Éditeur** | Tiptap v3 | Éditeur de texte riche (posts, leçons) |
| **Backend** | Express.js v5 | API REST + WebSocket |
| **ORM** | Prisma v7 | Accès base de données typé |
| **BDD** | PostgreSQL 16 | Stockage principal |
| **Cache / Queue** | Redis 7 + BullMQ v5 | Cache, jobs asynchrones |
| **Auth** | Passport.js + JWT | Local, Google, Facebook OAuth |
| **Validation** | Zod v4 | Validation des entrées (backend) |
| **Real-time** | Socket.IO v4 | Events en direct |
| **Fichiers** | Multer + Cloudinary | Upload d'images (infrastructure en place) |
| **Paiements** | Flouci | Gateway tunisien (TND) |
| **Tests** | Vitest v4 + Supertest | Tests unitaires et d'intégration |
| **Infra** | Docker Compose | PostgreSQL + Redis en local |

---

## 3. Architecture du projet

### 3.1 Structure des dossiers

```
makteb/
├── docker-compose.yml          PostgreSQL + Redis
├── .env.example                Variables d'environnement à copier
│
├── client/                     Frontend React
│   └── src/
│       ├── App.jsx             Routeur principal + providers
│       ├── components/
│       │   ├── layout/         AppLayout (shell), Navbar
│       │   └── ui/             Composants réutilisables (Button, Input, Avatar)
│       ├── features/           Dossiers prévus par domaine (à remplir)
│       │   ├── auth/
│       │   ├── community/
│       │   ├── courses/
│       │   ├── dashboard/
│       │   └── gamification/
│       ├── hooks/              useAuth.js
│       ├── lib/                api.js (Axios), socket.js, theme.jsx
│       ├── pages/              Une page par route
│       └── store/              authStore.js (Zustand)
│
└── server/                     Backend Express
    ├── prisma/
    │   └── schema.prisma       Schéma de la base de données (13 modèles)
    └── src/
        ├── app.js              Express app, middlewares, routes
        ├── index.js            Démarrage du serveur
        ├── config/env.js       Variables d'env centralisées
        ├── lib/                prisma, redis, socket, helpers
        ├── middleware/         auth, validate, error-handler
        └── modules/            Un dossier par domaine métier
            ├── auth/
            ├── community/
            ├── courses/
            ├── gamification/
            └── payments/
```

### 3.2 Frontend

Le frontend suit une architecture **pages + features** :

- **`pages/`** : Composants de niveau page (un par route). Ils orchestrent les appels et affichent les features.
- **`features/`** : Logique métier par domaine (queries, mutations, composants spécifiques). Ce dossier est **prévu mais vide** — c'est l'un des principaux chantiers.
- **`components/ui/`** : Design system minimaliste (Button, Input, Avatar). À enrichir.
- **`lib/api.js`** : Instance Axios avec intercepteur qui rafraîchit automatiquement le token à chaque 401.
- **`store/authStore.js`** : État d'authentification global via Zustand.

Flux de données :

```
Page → TanStack Query (useQuery / useMutation)
     → api.js (Axios)
     → Express API
     → Prisma → PostgreSQL
```

### 3.3 Backend

Le backend suit une architecture **module-per-feature** stricte :

```
routes.js   →  valide la requête HTTP (Zod) + appelle le service
service.js  →  logique métier, accès Prisma, appel gamification
```

Les routes ne contiennent **aucune logique métier**. Tout passe par les services. Cela rend les services testables indépendamment.

**Middlewares clés :**
- `requireAuth` : Vérifie le Bearer token JWT, expose `req.userId` et `req.userRole`
- `optionalAuth` : Identique mais non bloquant (pour les routes publiques avec contexte)
- `validate(schema)` : Middleware Zod générique, remplace `req.body` par les données parsées
- `errorHandler` : Capture toutes les erreurs Express 5 async, retourne un JSON structuré

### 3.4 Base de données

13 modèles Prisma répartis en 5 domaines :

```
Utilisateurs    : User
Communautés     : Community, CommunityMember
Contenu         : Post, Comment, Like
Cours           : Course, Module, Lesson, Enrollment
Gamification    : PointEntry, Level
Paiements       : Payment
Notifications   : Notification
```

**Schéma simplifié des relations :**

```
User ──┬── Community (créateur)
       ├── CommunityMember (N-N avec Community)
       ├── Post / Comment / Like
       ├── Enrollment (N-N avec Course)
       ├── PointEntry (par communauté)
       └── Payment

Community ──┬── Course ── Module ── Lesson
            ├── Post
            └── Level
```

### 3.5 Temps réel

Socket.IO est utilisé avec un pattern de **rooms par communauté** :

```
Client: socket.emit('join:community', communityId)

Server broadcasts to 'community:<id>':
  - post:created
  - post:deleted
  - comment:created
  - points:awarded
```

### 3.6 Authentification

Double token strategy :

| Token | Durée | Stockage | Usage |
|---|---|---|---|
| Access token | 15 minutes | `localStorage` | Header `Authorization: Bearer` |
| Refresh token | 7 jours | Cookie `httpOnly` | Renouvelé automatiquement par l'intercepteur Axios |

Flux de refresh automatique (transparent pour l'utilisateur) :
```
Requête → 401 → POST /api/auth/refresh (cookie) → nouveau access token → retry
```

---

## 4. Modules fonctionnels

### Communautés
- Création / modification / suppression (créateur uniquement)
- Visibilité public/privé, prix optionnel (TND)
- Rejoindre / quitter (avec gate de paiement si payante)
- Gestion des membres : rôles (OWNER / ADMIN / MODERATOR / MEMBER)
- 5 niveaux de gamification créés automatiquement à la création

### Posts & Commentaires
- Types : DISCUSSION, ANNOUNCEMENT, POLL
- Feed paginé (posts épinglés en premier)
- Commentaires threaded (2 niveaux)
- Like, pin (modérateurs), suppression
- Events Socket.IO en temps réel

### Cours
- Hiérarchie : Course → Module → Lesson
- Types de leçons : TEXT, VIDEO, QUIZ
- Drag-to-reorder (modules et leçons)
- Enrollment avec gate de paiement
- Progression trackée (completedLessons + progress %)

### Gamification
- Points attribués automatiquement sur chaque action
- Niveaux par communauté avec seuils de points
- Leaderboard (top 20), activité personnelle
- Event temps réel `points:awarded`

### Paiements
- Flouci (TND, montants en millimes)
- Types : COURSE ou COMMUNITY
- Commission plateforme : 10%
- Historique des paiements et bilan des revenus créateur

---

## 5. API — Endpoints disponibles

### Auth `/api/auth`
| Méthode | Route | Description |
|---|---|---|
| POST | `/register` | Inscription email/password |
| POST | `/login` | Connexion |
| POST | `/refresh` | Renouveler l'access token |
| GET | `/me` | Profil courant |
| PUT | `/me` | Modifier nom / bio / avatar |
| POST | `/logout` | Déconnexion |
| GET | `/google` | OAuth Google |
| GET | `/facebook` | OAuth Facebook |

### Communautés `/api/communities`
| Méthode | Route | Description |
|---|---|---|
| GET | `/` | Liste des communautés publiques |
| GET | `/:slug` | Détail d'une communauté |
| POST | `/` | Créer une communauté |
| PUT | `/:id` | Modifier |
| DELETE | `/:id` | Supprimer |
| POST | `/:id/join` | Rejoindre |
| DELETE | `/:id/leave` | Quitter |
| GET | `/:id/members` | Liste des membres |
| GET | `/:id/membership` | Statut d'adhésion |

### Posts `/api/posts`
| Méthode | Route | Description |
|---|---|---|
| GET | `/community/:id` | Feed de posts |
| GET | `/:id` | Détail post + commentaires |
| POST | `/` | Créer un post |
| PUT | `/:id` | Modifier |
| DELETE | `/:id` | Supprimer |
| PUT | `/:id/pin` | Épingler / désépingler |
| POST | `/:id/like` | Toggle like |
| POST | `/:id/comments` | Ajouter un commentaire |
| DELETE | `/comments/:id` | Supprimer un commentaire |

### Cours `/api/courses` & `/api/lessons`
| Méthode | Route | Description |
|---|---|---|
| GET | `/community/:id` | Cours d'une communauté |
| GET | `/:id` | Détail cours + modules + leçons |
| POST | `/` | Créer un cours |
| POST | `/:id/modules` | Ajouter un module |
| PUT | `/:id/reorder-modules` | Réordonner les modules |
| POST | `/:id/enroll` | S'inscrire |
| GET | `/:id/progress` | Progression |
| POST | `/lessons/:id/complete` | Marquer une leçon comme terminée |

### Gamification `/api/gamification`
| Méthode | Route | Description |
|---|---|---|
| GET | `/leaderboard/:id` | Top 20 utilisateurs |
| GET | `/points/:id` | Points + niveau courant |
| GET | `/activity/:id` | 30 derniers événements |
| GET | `/levels/:id` | Niveaux de la communauté |

### Paiements `/api/payments`
| Méthode | Route | Description |
|---|---|---|
| POST | `/initiate` | Initier un paiement Flouci |
| POST | `/verify/:id` | Vérifier un paiement |
| GET | `/my` | Historique personnel |
| GET | `/earnings/:id` | Revenus créateur |

---

## 6. Points forts actuels

- **Architecture claire** : Séparation routes / services / middlewares bien respectée
- **Sécurité solide** : Double token JWT, cookies httpOnly, bcrypt 12 rounds, Helmet, CORS
- **Validation robuste** : Zod sur tous les inputs backend + middleware générique réutilisable
- **Gestion d'erreurs centralisée** : `AppError` + handler global, pas de try/catch dispersés
- **Tests en place** : Vitest + Supertest sur chaque module avec couverture
- **Docker Compose** : Environnement local reproductible en une commande
- **Gamification transversale** : `awardPoints()` appelé depuis les services existants sans couplage fort
- **Refresh token transparent** : L'intercepteur Axios gère le renouvellement sans intervention utilisateur
- **Real-time prêt** : Socket.IO avec pattern de rooms, events définis dans tous les modules

---

## 7. Points à améliorer

### Frontend — Priorité haute

| # | Problème | Impact |
|---|---|---|
| F1 | **`features/` est vide** — toute la logique est dans les pages, ce qui les rend trop grosses (ex : `CommunityPage.jsx` fait 654 lignes) | Maintenabilité, lisibilité |
| F2 | **Pas de composants de formulaire réutilisables** — les formulaires sont dupliqués dans chaque page | DRY, cohérence |
| F3 | **Upload de fichiers non implémenté côté client** — Cloudinary est configuré côté serveur mais aucun composant d'upload n'existe | Feature manquante |
| F4 | **Gestion d'erreurs des formulaires incomplète** — les messages d'erreur de l'API ne sont pas toujours affichés à l'utilisateur | UX |
| F5 | **Pas de composant `LoadingSpinner` ou `Skeleton`** — les états de chargement ne sont pas gérés uniformément | UX |
| F6 | **`CoursePage.jsx` et `CommunityPage.jsx` doivent être découpés** en sous-composants | Maintenabilité |
| F7 | **Aucune protection des routes privées** côté client (`ProtectedRoute` manquant) | Sécurité / UX |

### Backend — Priorité moyenne

| # | Problème | Impact |
|---|---|---|
| B1 | **BullMQ non connecté** — l'infrastructure Redis + BullMQ est en place mais aucun job n'est déclenché (emails, notifications async) | Feature manquante |
| B2 | **Upload Cloudinary non implémenté** — Multer et les env vars sont là, mais les routes d'upload n'existent pas | Feature manquante |
| B3 | **Notifications non servies** — le modèle `Notification` existe en BDD mais aucune route ni service ne l'utilise | Feature manquante |
| B4 | **Konnect (second gateway) non implémenté** — seule la clé API est stockée, pas de client | Paiements |
| B5 | **Pas de rate limiting** — un attaquant peut brute-forcer `/auth/login` | Sécurité |
| B6 | **Les durées JWT sont hardcodées** dans `auth.utils.js` et non configurables par env | Flexibilité |
| B7 | **`requireRole` middleware non utilisé dans les routes** — la logique de rôle est répétée inline dans chaque service | Cohérence |
| B8 | **Pas de pagination sur les membres et leaderboard** | Performance |

### Infrastructure & Qualité

| # | Problème | Impact |
|---|---|---|
| I1 | **Pas de CI/CD** — aucun pipeline GitHub Actions pour lancer les tests automatiquement | Qualité |
| I2 | **Pas de Dockerfile** pour le client et le serveur (uniquement docker-compose pour les services) | Déploiement |
| I3 | **Pas de seed de données** — difficile de tester l'application sans données de démo | Développement |
| I4 | **Pas de variables d'env côté client** (`.env` Vite) — l'URL de l'API est hardcodée dans le proxy Vite uniquement | Configuration |

---

## 8. Plan de développement en équipe de 3

### 8.1 Répartition des rôles

L'équipe est organisée en **3 pôles** avec des responsabilités principales claires, mais chaque membre peut contribuer aux autres pôles.

---

#### Membre 1 — Frontend & Design System
**Responsabilités :**
- Mettre en place les composants UI réutilisables (`features/`, composants Skeleton, ProtectedRoute, formulaires)
- Découper les grandes pages en sous-composants
- Implémenter l'upload d'images (composant + intégration Cloudinary)
- Gérer l'expérience utilisateur (états de chargement, messages d'erreur, toasts)
- Assurer la cohérence visuelle (dark mode, responsive)

**Chantiers principaux :**
- F1 Remplir `features/` par domaine
- F2 Composants de formulaire réutilisables
- F3 Composant d'upload
- F5 Skeletons + LoadingSpinner
- F7 `ProtectedRoute`

---

#### Membre 2 — Backend & API
**Responsabilités :**
- Implémenter les features manquantes (upload Cloudinary, notifications, rate limiting)
- Connecter BullMQ pour les jobs asynchrones (emails de bienvenue, notifications)
- Refactoriser les checks de rôles pour utiliser `requireRole`
- Ajouter la pagination manquante
- Écrire et maintenir les tests

**Chantiers principaux :**
- B1 Connecter BullMQ
- B2 Routes d'upload
- B3 Module notifications (routes + service)
- B5 Rate limiting (`express-rate-limit`)
- B7 Uniformiser l'usage de `requireRole`

---

#### Membre 3 — Fullstack & Infrastructure
**Responsabilités :**
- Implémenter les features fullstack qui touchent client + serveur (ex : notifications en temps réel, cours quiz interactifs)
- Mettre en place CI/CD (GitHub Actions)
- Créer les seeds de données de démo
- Préparer le déploiement (Dockerfiles, variables d'env de production)
- Coordonner les reviews de PR et la résolution de conflits

**Chantiers principaux :**
- I1 GitHub Actions CI (lint + test)
- I2 Dockerfiles client + serveur
- I3 Seed de données
- Notifications temps réel (end-to-end)
- Quiz interactifs (end-to-end)

---

### 8.2 Workflow Git

#### Branches

```
main          →  code stable, protégée (pas de push direct)
develop       →  branche d'intégration principale
feat/<nom>    →  nouvelle fonctionnalité
fix/<nom>     →  correction de bug
refactor/<nom>→  refactoring sans ajout de feature
chore/<nom>   →  tooling, config, deps
```

#### Règles de base

1. **On ne pousse jamais directement sur `main` ni `develop`**
2. Toute feature commence par une branche `feat/` tirée de `develop`
3. Chaque PR doit être reviewée par **au moins 1 autre membre** avant merge
4. Les commits suivent la convention **Conventional Commits** :
   ```
   feat(community): add member role update endpoint
   fix(auth): refresh token not cleared on logout
   refactor(courses): extract lesson ordering to service
   chore: add GitHub Actions CI workflow
   ```
5. Avant de créer une PR, s'assurer que :
   - Les tests passent (`npm test`)
   - Le linter ne renvoie pas d'erreurs (`npm run lint`)
   - La branche est à jour avec `develop` (`git rebase develop`)

#### Cycle d'une feature

```
1. git checkout develop && git pull
2. git checkout -b feat/ma-feature
3. Développement + commits réguliers
4. git rebase develop (résoudre les conflits)
5. Ouvrir une Pull Request vers develop
6. Review par un autre membre
7. Merge squash dans develop
8. Merge de develop dans main à chaque fin de sprint
```

---

### 8.3 Mise en place avant le Sprint 1

Avant de commencer à coder, ces étapes d'organisation sont à faire **une seule fois**.

#### Étape 1 — Initialiser la branche `develop`

```bash
# Sur le repo partagé (à faire par M3)
git checkout -b develop
git push -u origin develop
```

Protéger `main` sur GitHub :
`Settings → Branches → Add branch protection rule`
- Branch name: `main`
- Cocher : "Require a pull request before merging"
- Cocher : "Require approvals" → 1 reviewer minimum

#### Étape 2 — Créer les issues GitHub

Pour chaque tâche du tableau sprint, créer une issue GitHub correspondante :
- **Titre** : `[Sprint X] Description courte de la tâche`
- **Assigné** : M1, M2 ou M3
- **Labels** : `frontend` / `backend` / `infra` + `sprint-1`, `sprint-2`, etc.

Exemple :
```
[Sprint 1] Ajouter ProtectedRoute              → assigné M1, labels: frontend, sprint-1
[Sprint 1] Rate limiting sur /auth/login        → assigné M2, labels: backend, sprint-1
[Sprint 1] Configurer GitHub Actions CI         → assigné M3, labels: infra, sprint-1
```

#### Étape 3 — Créer le board Kanban GitHub

`Repo → Projects → New project → Board view`

Colonnes à créer :
```
Backlog  →  In Progress  →  In Review  →  Done
```

Chaque issue se déplace dans ces colonnes au fil du sprint. Chaque membre ne doit avoir **qu'une seule carte en "In Progress"** à la fois.

#### Étape 4 — Règle des territoires (éviter les conflits Git)

Pour minimiser les conflits, chaque membre a un périmètre exclusif :

| Membre | Périmètre |
|---|---|
| M1 | `client/src/` uniquement |
| M2 | `server/src/` et `prisma/` uniquement |
| M3 | `.github/`, `docker-compose.yml`, `Dockerfile*`, et les features fullstack end-to-end |

Les fichiers partagés à risque (`package.json`, `prisma/schema.prisma`) : **communiquer avant de les modifier**, ne jamais modifier les deux en même temps sans coordination.

---

### 8.4 Déroulement d'un sprint (2 semaines)

```
── Semaine 1 ──────────────────────────────────────────────
Lundi     → Réunion de lancement (30 min)
              Chacun présente ce qu'il prend, identifie les dépendances
              Ex: M2 doit finir l'endpoint avant que M1 puisse connecter l'UI

Mar–Ven   → Développement sur sa branche feat/
              Commits réguliers (au moins 1 par jour de travail)
              Rester à jour avec develop : git fetch && git rebase origin/develop

Vendredi  → Point d'équipe (15 min)
              Blocages ? Dépendances entre membres ? Ajustements ?

── Semaine 2 ──────────────────────────────────────────────
Lun–Mer   → Fin du développement + écriture/mise à jour des tests
              Chaque feature doit avoir ses tests avant d'ouvrir la PR

Jeudi     → Ouverture des Pull Requests vers develop
              Review croisée : chaque PR doit être lue par un autre membre
              Commentaires constructifs, suggestions, approbation

Vendredi  → Merge des PRs approuvées dans develop
              Merge de develop dans main (tag de version : v1.0, v1.1...)
              Démo rapide (15 min) : chacun montre ce qu'il a livré
              Rétrospective (10 min) : ce qui a bien marché, ce qui bloque
```

---

### 8.5 Cycle concret pour chaque tâche

```bash
# 1. Toujours partir de develop à jour
git checkout develop && git pull

# 2. Créer sa branche avec un nom clair
git checkout -b feat/sprint1-protected-route     # M1
git checkout -b feat/sprint1-rate-limiting       # M2
git checkout -b feat/sprint1-ci-pipeline         # M3

# 3. Développer + commiter régulièrement
git add .
git commit -m "feat(auth): add ProtectedRoute component"
git commit -m "fix(auth): redirect to /login when token missing"

# 4. Rester synchronisé avec develop (surtout en semaine 2)
git fetch origin
git rebase origin/develop
# En cas de conflit : résoudre, puis git rebase --continue

# 5. Pousser et ouvrir la PR
git push -u origin feat/sprint1-protected-route
# Sur GitHub : New Pull Request → base: develop ← compare: feat/sprint1-protected-route
# Ajouter : description, screenshots si UI, issue liée (#numéro)

# 6. Attendre la review, appliquer les retours, puis merge squash
```

---

### 8.6 Ordre de démarrage du Sprint 1

Le Sprint 1 doit démarrer dans cet ordre précis car certaines tâches débloquent les autres :

```
Jour 1-2  →  M3 : Configure GitHub Actions CI
              (les PRs suivantes auront les tests automatiques dès le départ)

Jour 2-3  →  M2 : Crée le seed de données
              (M1 et M3 peuvent tester l'app avec de vraies données)

Jour 1+   →  M1 : Commence ProtectedRoute + refacto des pages
              (indépendant, peut démarrer immédiatement)
```

---

### 8.7 Sprints suggérés

> Durée suggérée : **2 semaines par sprint**

#### Sprint 1 — Fondations & Stabilisation
**Objectif : rendre l'app utilisable de bout en bout**

| Membre | Tâches |
|---|---|
| M1 | `ProtectedRoute`, refacto `CommunityPage` + `CoursePage`, états de chargement |
| M2 | Rate limiting `/auth/login`, seed de données, corriger les bugs existants |
| M3 | GitHub Actions CI, Dockerfiles, `.env` client Vite |

**Livrables :** App stable, CI fonctionnel, données de démo disponibles

---

#### Sprint 2 — Upload & Notifications
**Objectif : permettre aux utilisateurs d'uploader du contenu et de recevoir des notifications**

| Membre | Tâches |
|---|---|
| M1 | Composant d'upload d'image (avatar, cover community, cover course) |
| M2 | Routes Cloudinary (upload avatar, upload cover), module notifications (CRUD) |
| M3 | Notifications temps réel (Socket.IO `notification:new`), badge non lu dans la Navbar |

**Livrables :** Upload fonctionnel, notifications temps réel

---

#### Sprint 3 — Quiz & Gamification avancée
**Objectif : rendre les cours interactifs et enrichir la gamification**

| Membre | Tâches |
|---|---|
| M1 | Composant Quiz (questions + réponses multiples), UI leaderboard animé |
| M2 | Backend quiz (stocker les questions/réponses dans le `content` JSON des leçons), validation des réponses |
| M3 | Points pour réussite de quiz, niveaux personnalisables par le créateur |

**Livrables :** Leçons quiz jouables, gamification enrichie

---

#### Sprint 4 — Paiements & Déploiement
**Objectif : finaliser les paiements et préparer la mise en production**

| Membre | Tâches |
|---|---|
| M1 | Flows de paiement côté client (UI Flouci, écran de confirmation) |
| M2 | Implémenter Konnect, webhooks de paiement, jobs BullMQ pour emails |
| M3 | Pipeline de déploiement (Railway / Render / VPS), env de staging |

**Livrables :** Paiements stables, app déployée en staging

---

#### Sprint 5 — Profils & Réseaux sociaux
**Objectif : enrichir les profils utilisateurs et la dimension sociale**

| Membre | Tâches |
|---|---|
| M1 | Page profil public (`/u/:username`), liste des communautés rejointes, cours en cours, badges obtenus |
| M2 | Endpoint profil public, endpoint `GET /api/users/:id/stats`, système de badge par niveau |
| M3 | Système de suivi (follow/unfollow) : modèle `UserFollow`, endpoints + UI |

**Livrables :** Page profil complète, suivi d'utilisateurs

---

#### Sprint 6 — Recherche & Découverte
**Objectif : permettre aux utilisateurs de trouver facilement contenu et communautés**

| Membre | Tâches |
|---|---|
| M1 | Page Discover améliorée (filtres par catégorie, tri, recherche en temps réel avec debounce) |
| M2 | Recherche full-text PostgreSQL sur communautés, cours et posts (`tsvector` + `to_tsquery`) |
| M3 | Page de résultats unifiée, mise en avant des communautés tendance (basé sur activité récente) |

**Livrables :** Recherche full-text fonctionnelle, découverte enrichie

---

#### Sprint 7 — Éditeur de contenu avancé
**Objectif : offrir une expérience de création de contenu riche**

| Membre | Tâches |
|---|---|
| M1 | Éditeur Tiptap avancé (images inline, blocs de code, tableaux, mentions `@user`) |
| M2 | Upload d'image inline dans l'éditeur (endpoint dédié Cloudinary), gestion des mentions en BDD |
| M3 | Prévisualisation en temps réel du contenu, mode lecture optimisé (typographie) |

**Livrables :** Éditeur riche opérationnel, images dans les posts et leçons

---

#### Sprint 8 — Analytics & Tableau de bord créateur
**Objectif : donner aux créateurs de communauté des insights sur leur contenu**

| Membre | Tâches |
|---|---|
| M1 | Dashboard créateur : graphiques revenus, inscriptions, activité membres (recharts ou Chart.js) |
| M2 | Endpoints analytics : évolution des inscriptions, revenus par période, taux de complétion des cours |
| M3 | Export CSV des données, rapport hebdomadaire par email (job BullMQ) |

**Livrables :** Dashboard analytics créateur, emails automatisés

---

#### Sprint 9 — Performance & Accessibilité
**Objectif : optimiser l'application pour la production**

| Membre | Tâches |
|---|---|
| M1 | Audit accessibilité (ARIA, navigation clavier, contrastes), lazy loading des pages (React.lazy) |
| M2 | Mise en cache Redis sur les routes fréquentes (leaderboard, liste communautés), indexes BDD supplémentaires |
| M3 | Audit Lighthouse, optimisation des images (WebP via Cloudinary transforms), compression Gzip/Brotli |

**Livrables :** Score Lighthouse > 90, temps de réponse API < 200ms sur les routes critiques

---

#### Sprint 10 — Sécurité
**Objectif : auditer et renforcer la sécurité de l'application de bout en bout**

| Membre | Tâches |
|---|---|
| M1 | Sanitisation des inputs dans les formulaires (DOMPurify sur le contenu Tiptap), protection CSRF sur les formulaires sensibles, vérification que les données utilisateur ne sont jamais rendues en `dangerouslySetInnerHTML` sans nettoyage |
| M2 | Rate limiting sur toutes les routes sensibles (`/auth/login`, `/auth/register`, `/payments/initiate`), rotation des secrets JWT via env, validation stricte des `referenceId` dans les paiements, audit des permissions (vérifier que chaque route protégée ne peut pas être contournée), logs de sécurité (tentatives de connexion échouées) |
| M3 | Audit des headers HTTP (Helmet config complète : CSP, HSTS, X-Frame-Options), scan des dépendances vulnérables (`npm audit`), revue des variables d'env en production (secrets non exposés), test de pénétration basique (OWASP Top 10) |

**Checklist sécurité à valider en fin de sprint :**
- [ ] Aucun secret dans le code source (`git log` + `git grep`)
- [ ] Tous les tokens expirés sont bien rejetés (tests automatisés)
- [ ] Les routes d'admin/créateur sont inaccessibles sans le bon rôle
- [ ] Les paiements ne peuvent pas être vérifiés par un autre utilisateur
- [ ] Les uploads acceptent uniquement les types MIME autorisés (images)
- [ ] Les cookies `httpOnly` + `Secure` + `SameSite=Strict` en production
- [ ] `npm audit` renvoie 0 vulnérabilités critiques/high

**Livrables :** Rapport de sécurité, 0 vulnérabilité critique, checklist complétée

---

#### Sprint 11 — Lancement & Post-lancement
**Objectif : mettre en production et stabiliser après le lancement**

| Membre | Tâches |
|---|---|
| M1 | Page landing finale (hero, features, pricing, témoignages), page 404/500 personnalisées |
| M2 | Monitoring : intégration Sentry (erreurs frontend + backend), alertes Uptime |
| M3 | Déploiement production final, CDN pour les assets statiques, backup automatique PostgreSQL |

**Livrables :** Application en production, monitoring en place

---

### 8.8 Plan MVP — Première version déployable (promotion du produit)

> **Objectif :** Enchaîner 3–4 sprints courts pour déployer une première version simple et fonctionnelle, puis commencer à promouvoir le produit (landing, premiers utilisateurs, feedback).

Ces sprints reprennent et priorisent des éléments des sprints 1–4 et 11. On vise **une app en ligne, stable et présentable** avant d’enchaîner sur les fonctionnalités avancées (quiz, analytics, etc.).

#### Principes

- **Sprints courts possibles** : 1 à 2 semaines selon la capacité de l’équipe.
- **Un seul objectif par sprint** : déploiement → landing → parcours visiteur → (optionnel) paiement ou monitoring.
- **Livrable déployé à chaque fin de sprint** : toujours une URL publique à montrer.

---

#### Sprint MVP 1 — Déploiement & stabilité

**Objectif :** Avoir l’application en ligne (staging ou production) et stable.

| Qui | Tâches |
|-----|--------|
| **Frontend** | États de chargement et erreurs sur les pages principales, variables d’env pour l’API en prod |
| **Backend** | Rate limiting sur `/auth/login` et `/auth/register`, seed de démo si pas encore fait |
| **Infra** | Dockerfiles client + serveur, pipeline de déploiement (Railway / Render / VPS), `.env` production et staging |

**Livrable :** App déployée et accessible via une URL (ex. `https://staging.makteb.tn` ou sous-domaine fournisseur).

**Critère de fin :** Un visiteur peut ouvrir l’URL, voir la liste des communautés (ou la page d’accueil actuelle) sans crash.

---

#### Sprint MVP 2 — Landing & première impression

**Objectif :** Donner une vraie page d’accueil pour la promotion (réseaux, bouche-à-oreille).

| Qui | Tâches |
|-----|--------|
| **Frontend** | Page landing : hero, valeur ajoutée (communautés, cours), CTA « Découvrir » / « S’inscrire », pages 404/500 personnalisées |
| **Backend** | (Optionnel) Endpoint stats publiques pour la landing (ex. nombre de communautés, de cours) |
| **Infra** | Domaine personnalisé si prévu, redirection HTTPS, env de prod finalisée |

**Livrable :** Landing présentable + parcours « Visiteur → Inscription » fonctionnel.

**Critère de fin :** On peut partager le lien et dire « Voici Makteb » avec une page d’accueil claire et un bouton d’inscription qui marche.

---

#### Sprint MVP 3 — Parcours visiteur & découverte

**Objectif :** Que quelqu’un qui débarque puisse comprendre le produit et faire un premier parcours utile (sans payer si on reporte les paiements).

| Qui | Tâches |
|-----|--------|
| **Frontend** | Parcours clair : accueil → liste communautés → détail communauté → aperçu cours (ou premier module gratuit), inscription/connexion au bon moment |
| **Backend** | Routes publiques propres (communautés, cours en lecture seule), pagination si besoin |
| **Infra** | Monitoring basique (Sentry ou équivalent) pour voir les erreurs en prod |

**Livrable :** Un visiteur peut s’inscrire, rejoindre une communauté (gratuite), voir un cours ou un extrait sans bloquer.

**Critère de fin :** « Inscription → Rejoindre une communauté → Voir du contenu » fonctionne de bout en bout en production.

---

#### Sprint MVP 4 (optionnel) — Paiement ou monitoring

**Objectif :** Soit ouvrir les communautés payantes, soit sécuriser la prod pour la promo.

- **Option A — Paiements :** Flow Flouci minimal (rejoindre une communauté payante), webhook, statut « payé » visible. Permet de promouvoir des communautés payantes.
- **Option B — Monitoring :** Sentry (front + back), alertes uptime, backup BDD. Permet de promouvoir en étant serein sur la stabilité.

Choisir A ou B selon la priorité (monétisation vs. confiance technique).

---

#### Après les sprints MVP

- **Promotion :** Partager la landing, premiers posts réseaux, feedback utilisateurs.
- **Suite :** Revenir au plan détaillé (sprints 2–11) en priorisant selon les retours (ex. recherche, profils, éditeur avancé, analytics).

*Document mis à jour le 4 mars 2026 — Plan MVP ajouté pour une première version déployable et promotable.*

---

## 9. Démarrage rapide

### Prérequis
- Node.js 20+
- Docker + Docker Compose
- Un fichier `.env` à la racine du projet (copier `.env.example`)

### Installation

```bash
# 1. Cloner le repo et installer les dépendances
cd makteb
npm install --prefix client
npm install --prefix server

# 2. Lancer PostgreSQL + Redis
docker compose up -d

# 3. Appliquer le schéma Prisma
cd server && npx prisma migrate dev

# 4. (Optionnel) Lancer le seed de données
cd server && npm run seed

# 5. Lancer le serveur backend (port 4000)
cd server && npm run dev

# 6. Lancer le client frontend (port 5173)
cd client && npm run dev
```

### Commandes utiles

```bash
# Tests backend
cd server && npm test

# Couverture de tests
cd server && npm run coverage

# Prisma Studio (visualiser la BDD)
cd server && npx prisma studio

# Lint frontend
cd client && npm run lint
```

---

*Document rédigé le 3 mars 2026 — À mettre à jour à chaque fin de sprint.*
