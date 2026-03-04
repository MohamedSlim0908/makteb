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
   - 8.3 [Sprints suggérés](#83-sprints-suggérés)
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

### 8.3 Sprints suggérés

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
