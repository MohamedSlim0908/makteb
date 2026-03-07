# Plan de Sprints — Makteb MVP (3 Devs, 6 semaines)

> **GitHub Project** : https://github.com/users/MohamedSlim0908/projects/2
> Chaque sprint = 1 semaine. Travail reparti entre 3 developpeurs (Dev A, Dev B, Dev C).
> Priorite : UI first, page par page, les grosses pages ont leur propre sprint.

---

## Resume visuel

```
Sem.  Sprint                          Dev A              Dev B              Dev C
----  ------                          -----              -----              -----
 1    Sprint 0 — Stabilisation        ESLint big pages   ESLint small pages TiptapEditor
 2    Sprint 1 — Auth + Discover      Login/Register     Settings refactor  Discover/Search
 3    Sprint 2 — CommunityPage        Feed + Classroom   Calendar + About   Members + Leaderboard
 4    Sprint 3 — Pages contenu        PostPage           CoursePage         CourseLearnPage
 5    Sprint 4 — Dashboard + Settings DashboardPage      Settings 1-5       Settings 6-10 + backend
 6    Sprint 5 — Polish + Responsive  Admin + remaining  Responsive pass    States + animations
```

---

## Sprint 0 — Stabilisation + TiptapEditor (Semaine 1)

### Dev A : Fix ESLint (grosses pages)
- [ ] **SettingsPage.jsx** (18 erreurs) — extraire chaque section en sous-composant
- [ ] **CommunityPage.jsx** — extraire les hooks conditionnels en composants
- [ ] **AdminPage.jsx** — extraire chaque onglet en sous-composant

### Dev B : Fix ESLint (petites pages) + cleanup
- [ ] **CommunitySettingsPage.jsx** — corriger setState dans useEffect + Date.now() en render
- [ ] **AuthCallbackPage.jsx** — corriger setState dans useEffect
- [ ] Supprimer toutes les variables et imports inutilises
- [ ] Verifier `npm run build` + `npm run lint` = zero erreurs

### Dev C : Build TiptapEditor + RichContent
- [ ] Creer `components/ui/TiptapEditor.jsx` (@tiptap/react + starter-kit + placeholder)
- [ ] Toolbar : gras, italique, titres (H2/H3), listes, liens, citations, blocs de code
- [ ] Variante compacte (posts) + variante complete (lecons)
- [ ] Output en HTML, placeholder configurable
- [ ] Installer DOMPurify pour le rendu HTML securise
- [ ] Creer `components/ui/RichContent.jsx` — rendu HTML sanitise avec DOMPurify

**Critere de fin :** `npm run build` OK, `npm run lint` OK, `npm test` OK, TiptapEditor pret.

---

## Sprint 1 — Auth + Discover + Search (Semaine 2)

> Pas de LandingPage — DiscoverPage est la page d'accueil (`/`).

### Dev A : LoginPage + RegisterPage + ForgotPasswordPage
- [ ] **LoginPage** : boutons OAuth (Google, Facebook), toggle visibilite mot de passe, lien "Mot de passe oublie" fonctionnel
- [ ] **RegisterPage** : indicateur force mot de passe, toggle visibilite, validation temps reel, liens CGU/privacy
- [ ] **ForgotPasswordPage** (nouvelle) : formulaire email simple (stub — backend plus tard)

### Dev B : SettingsPage refactoring (avance sur Sprint 4)
- [ ] Extraire chaque section en composant individuel (`ProfileSection.jsx`, `AccountSection.jsx`, etc.)
- [ ] Eliminer les 18 erreurs ESLint liees aux hooks conditionnels
- [ ] Reorganiser : 1 fichier parent + 10 composants de section
- [ ] Verifier que chaque section s'affiche correctement apres extraction

### Dev C : DiscoverPage (home) + SearchPage
- [ ] **DiscoverPage** : pagination, tri (Populaire/Nouveau/Prix), grid responsive (1/2/3 cols), dropdown categories
- [ ] Configurer DiscoverPage comme route `/` dans App.jsx
- [ ] **SearchPage** : filtres (categorie, gratuit/payant), tri, debounce + spinner, pagination

**Critere de fin :** Parcours Register → Login → Discover (home) fluide, SettingsPage refactoree.

---

## Sprint 2 — CommunityPage (Semaine 3)

Grosse page — les 3 devs travaillent sur des onglets differents.

### Dev A : Onglet Community (feed) + Onglet Classroom
- [ ] Post Composer avec TiptapEditor + selecteur categorie + upload image Cloudinary
- [ ] PostCard : rendu rich content, compteurs likes/commentaires cliquables
- [ ] Infinite scroll + indicateur chargement + bouton "Retour en haut"
- [ ] **Classroom** : cards cours avec barre de progression, badges, bouton "Continuer"

### Dev B : Onglet Calendar + Onglet About
- [ ] Calendrier visuel mensuel + points colores sur les jours avec evenements
- [ ] Clic jour → liste evenements, formulaire creation evenement (admin/owner)
- [ ] **About** : verifier completude

### Dev C : Onglet Members + Onglet Leaderboards
- [ ] Barre de recherche membres, badges role + niveau gamification, actions rapides
- [ ] **Leaderboards** : verifier pagination, polish layout

**Critere de fin :** 6 onglets fonctionnels avec donnees reelles, posts riches, calendrier avec evenements.

---

## Sprint 3 — PostPage + CoursePage + CourseLearnPage (Semaine 4)

3 pages de contenu — une par dev.

### Dev A : PostPage
- [ ] Rendu riche du contenu (RichContent avec DOMPurify)
- [ ] Bouton partage (copier le lien)
- [ ] Tri des commentaires (recent, ancien)
- [ ] Indicateur nombre de reponses par commentaire

### Dev B : CoursePage
- [ ] Barre de progression globale pour les inscrits
- [ ] Indicateur par module : "3/5 lecons completes" + barre de progression
- [ ] Badge "Complete" sur les modules termines
- [ ] Bouton "Continuer" intelligent (prochaine lecon incomplete)

### Dev C : CourseLearnPage
- [ ] Boutons "Lecon suivante" / "Lecon precedente" + auto-scroll
- [ ] Lecon en cours surlignee dans la sidebar
- [ ] Checkmarks sur les lecons completees dans la sidebar
- [ ] Rendu riche du contenu (RichContent)
- [ ] Indicateur progression globale ("Lecon 3 sur 12")

**Critere de fin :** Contenu riche, progression visible partout, navigation entre lecons fluide.

---

## Sprint 4 — DashboardPage + SettingsPage (Semaine 5)

Deux grosses pages. DashboardPage absorbe CreatorCommunityDashboardPage.

### Dev A : DashboardPage (unifie)
- [ ] **Vue membre** : communautes inscrites, cours avec progression, activite recente
- [ ] **Vue createur** (si communautes) :
  - [ ] Cards "Mes communautes" avec stats (membres, posts, revenus)
  - [ ] Cards "Mes cours" avec boutons editer/publier
  - [ ] Confirmations suppression (modale) pour cours/modules/lecons
  - [ ] Creation cours/module/lecon dans des modales propres
  - [ ] Stats avec vrais chiffres API (pas de mock)
  - [ ] Checklist onboarding + barre de progression "Setup 2/4 complete"

### Dev B : SettingsPage — sections 1 a 5
- [ ] Extraire chaque section en composant individuel
- [ ] **Profile** : avatar upload Cloudinary, bio, location, liens sociaux — sauvegarde via `PUT /auth/me`
- [ ] **Account** : changement email, changement mot de passe, timezone en DB
- [ ] **Notifications** : preferences sauvegardees en base (pas localStorage)
- [ ] **Communities** : verifier
- [ ] **Payment Methods** : remplacer `window.prompt()` par modale, persister en DB

### Dev C : SettingsPage — sections 6 a 10 + backend
- [ ] **Payment History** : verifier
- [ ] **Affiliates** : section complete (lien referral, stats, liste referrals)
- [ ] **Payouts** : parametres, infos bancaires, historique
- [ ] **Chat** : toggles notifications, modes par communaute, utilisateurs bloques
- [ ] **Theme** : connecter Light/Dark/System au ThemeProvider
- [ ] **Backend** : `PUT /auth/password`, etendre `PUT /auth/me`, champs Prisma si necessaire

**Critere de fin :** Dashboard unifie membre/createur. Settings 100% fonctionnelle, zero stub, donnees persistees.

---

## Sprint 5 — Admin + remaining pages + Responsive + Polish (Semaine 6)

### Dev A : AdminPage + pages restantes
- [ ] **AdminPage** : bulk actions (selectionner plusieurs → supprimer/bannir), filtres avances
- [ ] **PaymentCallbackPage** : details d'echec, meilleur etat de succes
- [ ] **CreatorLandingPage + CreatorPricingPage** : verifier flow, connecter CreateCommunityModal a l'API

### Dev B : Pass responsive (TOUTES les pages)
- [ ] DiscoverPage (home) : grid 1 col mobile
- [ ] CommunityPage : sidebar en dessous, tabs scrollables
- [ ] CoursePage : sidebar en dessous
- [ ] CourseLearnPage : sidebar overlay (verifier)
- [ ] DashboardPage : cards 1 col
- [ ] SettingsPage : sidebar → hamburger mobile
- [ ] AdminPage : tables scrollables horizontal
- [ ] PostPage : pleine largeur

### Dev C : Etats loading/error/empty + micro-interactions
- [ ] Skeleton loaders : Discover, Community feed, Course, Dashboard
- [ ] Composant ErrorState reutilisable (icone, message, bouton "Reessayer")
- [ ] Error Boundary React global
- [ ] Revoir tous les EmptyState (message clair + CTA)
- [ ] Transitions tabs (fade), animation likes (pulse)
- [ ] Toasts de confirmation apres chaque action
- [ ] Scroll-to-top smooth apres navigation

**Critere de fin :** Toutes les pages responsive mobile, tous les etats geres, animations fluides.

---

## Regles pour chaque sprint

1. **Une branche par tache** — `feat/tiptap-editor`, `fix/settings-profile`, etc.
2. **Petites PR** — max 300 lignes par PR
3. **Tester avant merge** — `npm test` + `npm run lint` + `npm run build`
4. **Mobile first** — tester chaque UI sur mobile pendant le dev
5. **Daily sync** — 15 min standup pour eviter les conflits de merge entre les 3 devs
6. **Composants partages en premier** — si 2 devs ont besoin du meme composant, un le construit en debut de semaine

---

## Verification apres chaque sprint

1. `cd client && npm run lint` — zero erreurs
2. `cd client && npm run build` — build reussi
3. `cd server && npm test` — tous les tests passent
4. Test manuel sur mobile (Chrome DevTools 375px)
5. Parcours complet : register → discover → join communaute → creer post → s'inscrire a un cours → completer une lecon → settings
6. Cross-review : chaque dev review les PRs d'un autre dev

---

## Post-MVP (backlog)

- [ ] Deploiement (Docker, CI/CD, HTTPS)
- [ ] Service email (password reset, invitations, BullMQ)
- [ ] Socket.IO auth + events temps reel
- [ ] Monitoring (Pino, Sentry, health checks)
- [ ] Paiements robustes (webhooks, abonnements)
- [ ] Recherche avancee (pg_trgm)
- [ ] Quiz interactifs dans les lecons
- [ ] App mobile (PWA)
- [ ] Internationalisation (i18n)
- [ ] Dark mode complet
