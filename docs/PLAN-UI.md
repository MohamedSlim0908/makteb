# Plan d'amélioration UI — Makteb

> Document de référence pour améliorer l’interface utilisateur avant les autres chantiers.  
> Stack : React 19, Vite, Tailwind CSS v4, Lucide.

---

## Table des matières

1. [État des lieux](#1-état-des-lieux)
2. [Design system & fondations](#2-design-system--fondations)
3. [Composants UI réutilisables](#3-composants-ui-réutilisables)
4. [Pages & parcours utilisateur](#4-pages--parcours-utilisateur)
5. [Accessibilité & responsive](#5-accessibilité--responsive)
6. [Performance perçue & feedback](#6-performance-perçue--feedback)
7. [Priorisation & ordre de mise en œuvre](#7-priorisation--ordre-de-mise-en-œuvre)

---

## 1. État des lieux

### Ce qui existe déjà

| Élément | Détail |
|--------|--------|
| **Stack** | Tailwind v4, thème `@theme` avec couleurs primary (bleu), dark mode préparé (variant `dark`) |
| **Layout** | `AppLayout` (Navbar + Outlet), Navbar avec menu Makteb, messages, notifications, avatar |
| **UI de base** | `Button`, `Input`, `Avatar` dans `components/ui/` |
| **Pages** | Landing, Login, Register, Discover, Dashboard, Community, Course, CourseLearn, Post, Settings, AuthCallback |
| **Utilitaires** | `index.css` : `.focus-ring`, `.button-preset`, `.clickable`, `.no-scrollbar`, animation `nav-slide-down` |

### Problèmes identifiés (liés à l’UI)

| # | Problème | Impact |
|---|----------|--------|
| **UI-1** | Thème forcé en light uniquement (`theme.jsx` supprime le dark) | Pas de cohérence si on réactive le dark plus tard |
| **UI-2** | Pas de design tokens centralisés (espacements, rayons, ombres) | Incohérence visuelle entre pages |
| **UI-3** | Typographie : uniquement Inter, pas de hiérarchie claire (h1–h6, body, caption) | Lecture et hiérarchie peu claires |
| **UI-4** | Pas de composants Loading / Skeleton réutilisables | Chargements disparates (ex. Discover : divs `animate-pulse` en dur) |
| **UI-5** | Formulaires : champs natifs ou dupliqués, pas de `Label`, `ErrorMessage`, états erreur/disabled | UX formulaires et accessibilité |
| **UI-6** | Pas de toasts / notifications pour le feedback (succès, erreur) | L’utilisateur ne sait pas si une action a réussi |
| **UI-7** | Landing / Discover : look générique (bleu primary partout) | Identité visuelle peu distinctive |
| **UI-8** | Navbar très chargée (menu, messages, notifications, cours) et comportement différent community vs discover | Complexité et maintenance |
| **UI-9** | Cartes cours / communautés : pas de hover/focus cohérents, pas de variants (compacte / détaillée) | Expérience de navigation |
| **UI-10** | Pas de composant Modal / Dialog réutilisable | Login en overlay custom, pas de pattern commun |

---

## 2. Design system & fondations

### 2.1 Tokens (Tailwind `@theme`)

À définir ou à documenter dans `client/src/index.css` (ou fichier dédié importé) :

- **Couleurs**
  - Conserver `primary-50` à `primary-950`.
  - Ajouter (optionnel) : `success`, `warning`, `error` pour toasts et états.
  - Documenter la sémantique : bouton principal, liens, états erreur, etc.
- **Espacements**
  - Utiliser une échelle cohérente (4, 8, 12, 16, 24, 32, 48, 64) pour padding/margin.
- **Rayons (border-radius)**
  - Définir : `radius-sm`, `radius-md`, `radius-lg`, `radius-xl`, `radius-full` et les utiliser partout.
- **Ombres**
  - `shadow-card`, `shadow-dropdown`, `shadow-modal` pour cohérence des cartes, menus et modales.

### 2.2 Typographie

- **Police** : Garder Inter pour le body ; envisager une police d’accroche pour les titres (Landing, Discover) pour renforcer l’identité.
- **Échelle** : Définir des classes ou composants sémantiques :
  - `text-display` (Landing hero),
  - `text-h1` à `text-h3` (titres de page),
  - `text-body`, `text-body-sm`, `text-caption`, `text-label`.
- **Line-height** : Harmoniser titres (plus serré) et corps (plus aéré).

### 2.3 Dark mode

- Décision : soit réactiver le dark mode dans `ThemeProvider` et s’assurer que toutes les pages/composants passent en dark, soit le désactiver explicitement et retirer les classes `dark:` inutiles pour éviter le code mort.
- Si réactivé : vérifier contraste (WCAG AA minimum) sur fonds et textes.

### 2.4 Identité visuelle (Landing / Discover)

- Choisir une direction : garder le bleu primary ou introduire une palette secondaire (ex. accent pour CTA).
- Hero Landing : varier le fond (motif, dégradé, illustration) pour éviter le “template” bleu.
- Illustrations ou visuels légers pour “How it works” et blocs features.

---

## 3. Composants UI réutilisables

### 3.1 À créer en priorité

| Composant | Rôle | Fichier suggéré |
|-----------|------|------------------|
| **Card** | Conteneur standard (cours, communauté, post). Variants : default, elevated, interactive. | `components/ui/Card.jsx` |
| **Skeleton** | Placeholder de chargement (ligne, bloc, carte, avatar). | `components/ui/Skeleton.jsx` |
| **Spinner** | Indicateur de chargement (bouton, page, inline). Réutiliser le SVG du Button si possible. | `components/ui/Spinner.jsx` |
| **Modal / Dialog** | Overlay + contenu centré, fermeture (clic extérieur, Escape), focus trap. | `components/ui/Modal.jsx` |
| **Toast** | Notifications éphémères (succès, erreur, info). Provider + hook `useToast()`. | `components/ui/Toast.jsx` + `ToastProvider.jsx` |
| **Label** | Label accessible pour formulaire (`htmlFor` + id sur l’input). | `components/ui/Label.jsx` |
| **ErrorMessage** | Affichage des erreurs de champ ou formulaire. | `components/ui/ErrorMessage.jsx` |

### 3.2 Formulaires

- **Input** : Enrichir le composant existant avec :
  - Support `error`, `disabled`, `leftIcon`, `rightIcon`.
  - Variants : default, filled, outline.
- **FormField** : Composant wrapper optionnel : `Label` + `Input`/`Textarea`/select + `ErrorMessage`.
- **Réutiliser** ces blocs dans Login, Register, Settings et formulaires communautés/cours pour éviter la duplication (lien avec F2 du PROJECT.md).

### 3.3 À enrichir

- **Button** : Déjà bien (variants, loading). Ajouter si besoin : `variant="link"`, `iconOnly`, et tailles cohérentes avec le design system.
- **Avatar** : Support des statuts (en ligne, absent) si utile pour les messages/communautés.

---

## 4. Pages & parcours utilisateur

### 4.1 Landing

- **Hero** : Typographie plus forte, CTA plus visibles (taille, contraste).
- **Sections** : Espacement et grille cohérents avec les tokens.
- **CTA final** : Aligné visuellement avec le hero (même style de bouton ou de bloc).

### 4.2 Auth (Login / Register)

- Remplacer l’overlay custom par un **Modal** (ou une page dédiée avec layout simple) pour unifier le pattern.
- Utiliser **Label**, **Input** enrichi, **ErrorMessage** et afficher les erreurs API de façon claire (au-dessus du formulaire ou sous le bouton).
- États : disabled pendant la soumission, message de succès ou redirection claire.

### 4.3 Discover

- Remplacer les divs `animate-pulse` par des **Skeleton** en forme de cartes (image + lignes de texte).
- **Cartes cours** : utiliser un composant **Card** avec état hover/focus cohérent, option “compact” vs “détaillé”.
- Filtres / tri : si ajoutés, les intégrer au design system (boutons, badges, ou champs de filtre).

### 4.4 Dashboard

- Structure claire : sidebar ou blocs bien séparés (mes communautés, mes cours, actions rapides).
- Utiliser **Card** et **Skeleton** pour les listes et états de chargement.

### 4.5 Community & Course

- Réduire la complexité des pages (découpage en sous-composants, lien avec F1/F6 PROJECT.md).
- **Feed / liste de posts** : cartes homogènes (Card + Avatar, métadonnées, actions).
- **Sidebar** : style cohérent (espacements, liens actifs, séparateurs).

### 4.6 Settings

- Formulaires avec **Label**, **Input**, **ErrorMessage** et toasts pour confirmation des mises à jour.

---

## 5. Accessibilité & responsive

### 5.1 Accessibilité

- **Focus visible** : S’assurer que tous les contrôles ont un focus ring (déjà `.focus-ring` et `focus-visible:ring` sur Button).
- **Contraste** : Vérifier textes sur fonds clairs/sombres (primary-100, gray-100, etc.).
- **Labels** : Tous les champs de formulaire associés à un `<label>` (via **Label**).
- **Modales** : Focus trap, retour du focus à l’ouverture/fermeture, `aria-modal`, `role="dialog"`.
- **Messages dynamiques** : `aria-live` pour toasts ou messages d’erreur importants.

### 5.2 Responsive

- **Navbar** : Menu burger sur mobile, regroupement messages/notifications pour petits écrans.
- **Grilles** : Discover, Dashboard, listes de cours/communautés : 1 col mobile, 2–3 cols tablette, 3–4 cols desktop.
- **Modales / panels** : Plein écran ou quasi plein écran sur mobile si besoin.
- **Touch** : Zones cliquables suffisantes (min 44px), espacement entre liens/boutons.

---

## 6. Performance perçue & feedback

### 6.1 Chargement

- **Skeleton** partout où une liste ou un détail est chargé (Discover, Community feed, Dashboard, Course).
- **Spinner** pour les actions (soumission formulaire, rejoindre une communauté, etc.) en complément du bouton disabled.

### 6.2 Feedback utilisateur

- **Toasts** : “Compte créé”, “Paramètres enregistrés”, “Post publié”, “Erreur : …”.
- **Messages d’erreur** : Affichage systématique des erreurs API dans les formulaires (ErrorMessage ou toast selon le cas).
- **Optimistic updates** : Là où c’est pertinent (ex. like, quitter/rejoindre), mettre à jour l’UI tout de suite et annuler en cas d’erreur + toast.

---

## 7. Priorisation & ordre de mise en œuvre

### Phase 1 — Fondations (1–2 semaines)

1. **Design tokens** : Documenter ou ajouter dans `@theme` (rayons, ombres, espacements). Optionnel : couleurs sémantiques (success, error).
2. **Skeleton** + **Spinner** : Créer les composants et les utiliser sur Discover puis Community/Dashboard.
3. **Card** : Créer le composant, l’utiliser pour les cartes cours (Discover) et communautés.
4. **Modal** : Créer Modal/Dialog réutilisable ; migrer Login (ou Register) en exemple.

### Phase 2 — Formulaires & feedback (≈1 semaine)

5. **Label**, **ErrorMessage**, **Input** enrichi : Créer ou modifier les composants.
6. **Toast** : Provider + `useToast()`, intégration sur Login/Register/Settings et une action (ex. copier lien).
7. Formulaires Login, Register, Settings : refactor avec ces composants et affichage des erreurs API.

### Phase 3 — Identité & polish (≈1–2 semaines)

8. **Landing** : Ajustements hero, typo, CTA ; cohérence des sections avec les tokens.
9. **Navbar** : Simplification ou refactor (mobile, regroupement) sans casser les parcours.
10. **Dark mode** : Décision (on/off) et nettoyage des classes inutiles ou validation du contraste.

### Phase 4 — Pages complexes & accessibilité (continu)

11. Découpage **CommunityPage** / **CoursePage** en sous-composants + utilisation de Card, Skeleton, toasts.
12. Audit accessibilité (focus, contraste, labels, modales) et corrections.
13. Audit responsive (navbar, grilles, modales) et corrections.

---

## Résumé des livrables UI

| Livrable | Description |
|----------|-------------|
| **Design tokens** | `@theme` étendu ou documenté (couleurs, espacements, rayons, ombres). |
| **Composants** | Skeleton, Spinner, Card, Modal, Toast, Label, ErrorMessage, Input enrichi. |
| **Pages** | Landing, Auth, Discover, Dashboard, Settings alignées sur le design system. |
| **Feedback** | Toasts sur actions clés ; erreurs API visibles dans les formulaires. |
| **Chargement** | Skeleton/Spinner sur toutes les vues asynchrones principales. |
| **Accessibilité** | Focus, contraste, labels, modales (focus trap, aria). |
| **Responsive** | Navbar mobile, grilles, modales/panels adaptés. |

Ce plan peut être suivi phase par phase ; chaque phase améliore immédiatement la cohérence et l’expérience utilisateur sans bloquer le reste du produit.
