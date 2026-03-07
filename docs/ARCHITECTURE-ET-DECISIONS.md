# Architecture et Decisions - Makteb

Ce document t'explique **en profondeur** comment Makteb est construit, **pourquoi** chaque choix a ete fait, et **comment** les pieces s'assemblent. Chaque concept est illustre avec du vrai code du projet.

---

## Table des matieres

1. [C'est quoi une architecture logicielle ?](#1-cest-quoi-une-architecture-logicielle)
2. [La vue d'ensemble : comment Makteb fonctionne](#2-la-vue-densemble)
3. [Le Backend en detail](#3-le-backend-en-detail)
4. [Le Frontend en detail](#4-le-frontend-en-detail)
5. [La base de donnees et Prisma](#5-la-base-de-donnees-et-prisma)
6. [L'authentification : comment on sait qui est connecte](#6-lauthentification)
7. [Le temps reel avec Socket.IO](#7-le-temps-reel-avec-socketio)
8. [Le parcours complet d'une action utilisateur](#8-le-parcours-complet-dune-action)
9. [Les decisions d'architecture : pourquoi ces choix](#9-les-decisions-darchitecture)
10. [Comment developper petit a petit](#10-comment-developper-petit-a-petit)

---

## 1. C'est quoi une architecture logicielle ?

Imagine que tu construis une maison. L'architecture, c'est le plan : ou mettre la cuisine, la salle de bain, les chambres, comment les relier. Si tu mets la cuisine dans le grenier et la salle de bain au sous-sol, ca "marche" techniquement, mais c'est un cauchemar a utiliser et a modifier.

En logiciel, c'est pareil. L'architecture, c'est **comment organiser le code** pour que :
- **Tu t'y retrouves** : quand tu cherches "ou est le code qui cree une communaute ?", tu trouves en 5 secondes
- **Tu peux modifier sans tout casser** : changer le systeme de paiement ne devrait pas casser les commentaires
- **Plusieurs personnes peuvent travailler en parallele** : un dev travaille sur les cours, un autre sur les paiements, sans conflits

**La regle d'or : separation des responsabilites.** Chaque partie du code a UNE mission claire. Comme dans une equipe de foot : le gardien garde, l'attaquant attaque. Si le gardien essaie aussi d'attaquer, c'est le chaos.

---

## 2. La vue d'ensemble

Makteb fonctionne en 3 grandes parties qui communiquent entre elles :

```
  UTILISATEUR (navigateur)
       |
       | Il tape une URL, clique un bouton, ecrit un post...
       v
  +-----------------------------------------+
  |  FRONTEND (client/)                     |
  |  React + Vite                           |
  |  "L'interface que l'utilisateur voit"   |
  |                                         |
  |  - Affiche les pages                    |
  |  - Reagit aux clics                     |
  |  - Envoie des requetes au backend       |
  +-----------------------------------------+
       |                          ^
       | Requete HTTP             | Reponse JSON
       | "Donne-moi la           | { community: { name: "Dev TN",
       |  communaute dev-tn"     |   members: 42, ... } }
       v                          |
  +-----------------------------------------+
  |  BACKEND (server/)                      |
  |  Express + Prisma                       |
  |  "Le cerveau invisible"                 |
  |                                         |
  |  - Recoit les requetes                  |
  |  - Verifie les permissions              |
  |  - Lit/ecrit dans la base de donnees    |
  |  - Renvoie les donnees en JSON          |
  +-----------------------------------------+
       |                          ^
       | SQL                      | Resultats
       | "SELECT * FROM           |
       |  communities WHERE..."   |
       v                          |
  +-----------------------------------------+
  |  BASE DE DONNEES                        |
  |  PostgreSQL + Redis                     |
  |  "La memoire permanente"                |
  |                                         |
  |  - Stocke les utilisateurs, posts,      |
  |    communautes, cours...                |
  |  - Redis : cache + files d'attente      |
  +-----------------------------------------+
```

**Pourquoi 3 parties separees ?**

- **Securite** : l'utilisateur ne touche JAMAIS directement la base de donnees. Tout passe par le backend qui verifie les permissions.
- **Flexibilite** : tu peux changer le frontend (passer de React a Vue) sans toucher le backend. Ou changer PostgreSQL par MySQL sans toucher le frontend.
- **Scalabilite** : si 1000 utilisateurs arrivent, tu peux deployer 3 serveurs backend derriere un load balancer, sans changer le frontend.

---

## 3. Le Backend en detail

### 3.1 Le point d'entree : `server/src/app.js`

Quand le serveur demarre, il fait ceci (en vrai dans le code) :

```js
// 1. Creer l'application Express
const app = express();

// 2. Ajouter des "middlewares" = des couches de securite/utilitaires
app.use(helmet());       // Securite HTTP (headers de protection)
app.use(cors({ ... }));  // Autoriser le frontend a appeler le backend
app.use(morgan('dev'));  // Logger chaque requete dans le terminal
app.use(express.json()); // Comprendre le JSON envoye par le frontend
app.use(cookieParser()); // Lire les cookies (pour le refresh token)

// 3. Initialiser l'authentification et le temps reel
initPassport(app);       // Passport.js = gestion du login
initSocket(httpServer);  // Socket.IO = temps reel

// 4. Brancher les routes par domaine
app.use('/api/auth',          authRoutes);
app.use('/api/communities',   communityRoutes);
app.use('/api/posts',         postRoutes);
app.use('/api/courses',       courseRoutes);
app.use('/api/lessons',       lessonRoutes);
app.use('/api/gamification',  gamificationRoutes);
app.use('/api/payments',      paymentRoutes);

// 5. Gerer les erreurs
app.use(errorHandler);
```

**Analogie** : pense a un restaurant.
- `app` = le restaurant
- Les **middlewares** = la securite a l'entree (helmet), le voiturier (cors), le registre des reservations (morgan)
- Les **routes** = les differentes sections du menu (entrees = auth, plats = communities, desserts = courses)
- Le **errorHandler** = le manager qui gere les plaintes

### 3.2 L'architecture modulaire : un dossier par domaine

```
server/src/modules/
├── auth/              <- Tout ce qui concerne le login/register
├── community/         <- Communautes, membres, invitations
├── courses/           <- Cours, modules, lecons
├── gamification/      <- Points, niveaux, classement
└── payments/          <- Plans, abonnements, paiements
```

**Pourquoi ?** Quand tu cherches "comment marche la creation d'une communaute ?", tu vas dans `modules/community/`. Tu ne fouilles pas dans 50 fichiers melanges.

### 3.3 Le pattern Route → Validation → Service (le plus important a comprendre)

Chaque module suit le meme schema en 3 etapes. Prenons l'exemple concret de **creer une communaute** :

**Etape 1 — La Route** (`community.routes.js`) recoit la requete et orchestre :

```js
router.post('/', requireAuth, validate(createCommunitySchema), async (req, res) => {
  const community = await communityService.createCommunity(req.userId, req.body);
  res.status(201).json({ community });
});
```

Decomposons cette ligne :
- `router.post('/')` : "quand quelqu'un fait un POST sur /api/communities..."
- `requireAuth` : "...verifie d'abord qu'il est connecte (sinon 401)..."
- `validate(createCommunitySchema)` : "...verifie que les donnees envoyees sont valides (sinon 400)..."
- `communityService.createCommunity(...)` : "...alors appelle le service pour creer la communaute..."
- `res.status(201).json(...)` : "...et renvoie le resultat au frontend"

**La route ne contient AUCUNE logique metier.** Elle fait juste : verifier → deleguer → repondre.

**Etape 2 — La Validation** (schema Zod) definit les regles des donnees :

```js
const createCommunitySchema = z.object({
  name: z.string().min(1),                              // obligatoire, au moins 1 caractere
  description: z.string().optional(),                    // facultatif
  visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),  // soit PUBLIC soit PRIVATE
  price: z.number().positive().optional().nullable(),    // nombre positif ou rien
});
```

Si le frontend envoie `{ name: "" }`, Zod rejette avec une erreur 400 AVANT que le service ne soit appele. C'est un garde du corps.

**Etape 3 — Le Service** (`community.service.js`) contient la vraie logique metier :

```js
export async function createCommunity(userId, { name, description, visibility, price }) {
  // 1. Generer un slug unique (ex: "Dev Tunisia" → "dev-tunisia")
  let communitySlug = slugify(name, { lower: true });
  const existing = await prisma.community.findUnique({ where: { slug: communitySlug } });
  if (existing) communitySlug += '-' + Date.now().toString(36);

  // 2. Creer la communaute + le membership OWNER + les niveaux par defaut
  //    (tout en une seule transaction Prisma)
  const community = await prisma.community.create({
    data: {
      name,
      slug: communitySlug,
      description,
      visibility: visibility || 'PUBLIC',
      price: price || null,
      creatorId: userId,
      members: { create: { userId, role: 'OWNER' } },          // Le createur est automatiquement OWNER
      levels: { createMany: { data: DEFAULT_COMMUNITY_LEVELS } }, // 5 niveaux par defaut
    },
  });

  // 3. Promouvoir l'utilisateur en CREATOR (il a maintenant une communaute)
  await prisma.user.update({ where: { id: userId }, data: { role: 'CREATOR' } });

  return community;
}
```

**Pourquoi separer route et service ?**
- **Testabilite** : tu peux tester `createCommunity()` sans lancer un serveur HTTP. Tu appelles juste la fonction.
- **Reutilisabilite** : si demain tu veux creer une communaute depuis un script de seed ou un webhook, tu appelles le meme service.
- **Lisibilite** : la route dit "quoi faire" (verifier + deleguer), le service dit "comment le faire" (logique metier).

### 3.4 La gestion des erreurs

Le backend a une classe `AppError` et un `errorHandler` global :

```js
// Dans le service, quand quelque chose ne va pas :
if (!community) throw new AppError('Community not found', 404);
if (community.creatorId !== userId) throw new AppError('Not authorized', 403);

// Le errorHandler dans app.js attrape TOUTES les erreurs non gerees :
export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  const message = status === 500 ? 'Internal server error' : err.message;
  // En 500 (bug interne), on ne montre PAS le vrai message a l'utilisateur (securite)
  // mais on le log dans le terminal pour debugger
  if (status === 500) console.error(err);
  res.status(status).json({ error: message });
}
```

**L'idee** : le service `throw` une erreur, Express la propage automatiquement jusqu'au `errorHandler` qui la transforme en reponse JSON propre. Le frontend recoit toujours `{ error: "message" }` avec le bon code HTTP.

### 3.5 Les middlewares d'authentification

```
Requete HTTP
    |
    v
[requireAuth] ← "Est-ce qu'il y a un token JWT valide dans le header Authorization ?"
    |                OUI → decode le token, met req.userId = "abc-123", continue
    |                NON → renvoie 401 Unauthorized, arrete la
    v
[validate(schema)] ← "Est-ce que req.body respecte le schema Zod ?"
    |                OUI → continue
    |                NON → renvoie 400 Bad Request avec les erreurs de validation
    v
[route handler] ← la route peut maintenant utiliser req.userId et req.body en toute confiance
```

C'est comme une chaine de controles a l'aeroport : carte d'embarquement → scanner bagage → porte d'embarquement. Si tu echoues a une etape, tu n'atteins pas la suivante.

---

## 4. Le Frontend en detail

### 4.1 Le point d'entree : comment l'app demarre

```
1. Le navigateur charge index.html
2. index.html charge main.jsx
3. main.jsx monte React dans la <div id="root">
4. React rend App.jsx qui configure TOUT le reste
```

### 4.2 App.jsx : le chef d'orchestre

Voici ce que fait `App.jsx` et **pourquoi** chaque "Provider" est necessaire :

```jsx
export default function App() {
  return (
    // 1. ThemeProvider : fournit le theme (clair/sombre) a toute l'app
    <ThemeProvider>

      // 2. QueryClientProvider : fournit le cache de donnees serveur a toute l'app
      //    Sans ca, useQuery() et useMutation() ne marcheraient pas
      <QueryClientProvider client={queryClient}>

        // 3. BrowserRouter : active le systeme de routes (URLs → pages)
        //    Sans ca, <Route> et <Link> ne marcheraient pas
        <BrowserRouter>

          // 4. Suspense : affiche un spinner pendant que les pages lazy se chargent
          <Suspense fallback={<Spinner />}>

            <Routes>
              // Pages AVEC navbar (dans AppLayout)
              <Route element={<AppLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/community/:slug" element={<CommunityPage />} />
                <Route path="/course/:id" element={<CoursePage />} />
                ...
              </Route>

              // Pages SANS navbar (login, register)
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              // Toute URL inconnue → retour a l'accueil
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>

          </Suspense>
        </BrowserRouter>

        // 5. Toaster : zone ou s'affichent les notifications toast
        <Toaster position="top-center" />

      </QueryClientProvider>
    </ThemeProvider>
  );
}
```

**Les Providers fonctionnent comme des poupees russes** : chaque couche "enveloppe" les suivantes et leur fournit quelque chose. Un composant enfant peut acceder a tout ce que ses parents fournissent.

```
ThemeProvider fournit → le theme
  QueryClientProvider fournit → le cache de donnees
    BrowserRouter fournit → le systeme de navigation
      Ton composant peut utiliser useTheme(), useQuery(), useNavigate()
```

### 4.3 Lazy loading : pourquoi les pages se chargent a la demande

```js
const CommunityPage = lazy(() => import('./pages/CommunityPage'));
```

Sans `lazy`, quand l'utilisateur ouvre l'app, le navigateur telecharge le code de TOUTES les pages d'un coup (login, register, community, course, settings...). C'est lent.

Avec `lazy`, le code de `CommunityPage` est telecharge uniquement quand l'utilisateur va sur `/community/...`. C'est comme un restaurant qui ne prepare ton plat que quand tu le commandes, au lieu de preparer tout le menu a l'avance.

Le `<Suspense fallback={<Spinner />}>` affiche un spinner pendant le telechargement du code de la page.

### 4.4 Comment le frontend appelle le backend : Axios + l'intercepteur

Le fichier `lib/api.js` cree une instance Axios configuree :

```js
export const api = axios.create({
  baseURL: '/api',           // Toutes les requetes commencent par /api
  withCredentials: true,     // Envoyer les cookies a chaque requete
});
```

Ensuite, un **intercepteur** gere automatiquement l'expiration du token :

```
Frontend fait: api.get('/communities/dev-tn')
    |
    v
Axios envoie: GET /api/communities/dev-tn + header Authorization: Bearer <accessToken>
    |
    v
Backend repond:
    200 OK → super, on renvoie les donnees
    401 Unauthorized → le token a expire !
        |
        v
    L'intercepteur se declenche automatiquement :
        1. Il appelle POST /api/auth/refresh (avec le cookie refreshToken)
        2. Le backend donne un nouveau accessToken
        3. L'intercepteur REJOUE la requete originale avec le nouveau token
        4. L'utilisateur ne voit rien, tout est transparent

    Si le refresh echoue aussi → redirection vers /login
```

**Pourquoi c'est genial ?** L'utilisateur ne voit JAMAIS "votre session a expire, reconnectez-vous" pendant qu'il utilise l'app. Tant que le refresh token est valide (longue duree), tout est transparent.

### 4.5 TanStack Query : pourquoi c'est central

Sans TanStack Query, pour afficher une communaute tu ecrirais :

```jsx
// ❌ SANS TanStack Query — beaucoup de code repetitif
function CommunityPage() {
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get(`/communities/${slug}`)
      .then(res => setCommunity(res.data.community))
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Spinner />;
  if (error) return <Error />;
  return <div>{community.name}</div>;
}
```

Avec TanStack Query :

```jsx
// ✅ AVEC TanStack Query — propre, cache, revalidation automatique
function CommunityPage() {
  const { slug } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ['community', slug],    // Identifiant unique du cache
    queryFn: () => api.get(`/communities/${slug}`).then(r => r.data),
  });

  if (isLoading) return <Spinner />;
  if (error) return <Error />;
  return <div>{data.community.name}</div>;
}
```

**Mais le vrai pouvoir de TanStack Query c'est le cache intelligent :**

- Tu vas sur `/community/dev-tn` → il charge les donnees depuis l'API, les met en cache avec la cle `['community', 'dev-tn']`
- Tu navigues vers une autre page, puis tu reviens → il affiche INSTANTANEMENT les donnees du cache (pas de spinner) et rafraichit en arriere-plan si elles ont plus de 30 secondes (`staleTime: 30_000`)
- Tu crees un post → `useMutation` + `queryClient.invalidateQueries(['posts'])` invalide le cache des posts → TanStack Query re-fetch automatiquement → le feed se met a jour

**Analogie** : TanStack Query est comme un assistant personnel qui :
- Se souvient de toutes les donnees qu'il a deja cherchees (cache)
- Sait quand elles sont peut-etre perimees (staleTime)
- Va les reverifier en arriere-plan sans te deranger (revalidation)
- Te dit s'il est en train de chercher ou s'il y a eu un probleme (isLoading, error)

### 4.6 Zustand : l'etat global du client

Zustand gere les donnees qui ne viennent PAS du serveur mais qui doivent etre partagees partout dans l'app. Dans Makteb, c'est surtout l'utilisateur connecte :

```js
// store/authStore.js
const useAuthStore = create((set) => ({
  user: null,          // L'utilisateur connecte (ou null)
  isLoading: true,     // Est-ce qu'on verifie encore le token ?
  setUser: (user) => set({ user, isLoading: false }),
  logout: () => set({ user: null, isLoading: false }),
}));
```

N'importe quel composant peut lire ou modifier cet etat :

```jsx
// Dans la Navbar
const user = useAuthStore(state => state.user);
if (user) return <span>Bonjour {user.name}</span>;

// Dans le bouton deconnexion
const logout = useAuthStore(state => state.logout);
onClick={() => logout()};
```

**Pourquoi Zustand et pas TanStack Query pour l'auth ?**
- TanStack Query = donnees serveur (communautes, posts, cours). Elles existent dans la base de donnees.
- Zustand = etat client (qui est connecte maintenant, quel theme est actif). C'est de l'etat local a l'application.

### 4.7 La structure des dossiers frontend

```
client/src/
├── App.jsx                    # Le chef d'orchestre (routes + providers)
├── main.jsx                   # Monte React dans le DOM
├── index.css                  # Tailwind + variables de couleurs
│
├── pages/                     # UNE page par URL
│   ├── LandingPage.jsx        # /
│   ├── LoginPage.jsx          # /login
│   ├── CommunityPage.jsx      # /community/:slug
│   ├── CoursePage.jsx         # /course/:id
│   └── ...
│
├── components/                # Composants reutilisables
│   ├── layout/                # Structure de page (Navbar, AppLayout)
│   ├── ui/                    # Briques de base (Button, Input, Modal, Card)
│   └── course-community/      # Composants specifiques (PostCard, Leaderboard)
│
├── hooks/                     # Logique reutilisable (useAuth)
├── lib/                       # Utilitaires (api.js, socket.js, theme.jsx)
├── store/                     # Etat global Zustand (authStore)
└── features/                  # Logique par domaine (a remplir au fur et a mesure)
```

**La regle** :
- `pages/` = ce qui est affiche pour une URL. Une page UTILISE des composants mais ne devrait pas etre reutilisee ailleurs.
- `components/ui/` = des briques generiques (Button, Modal). Elles ne connaissent PAS le domaine (communaute, cours...).
- `components/course-community/` = des briques specifiques au domaine (PostCard). Elles connaissent le metier.
- `hooks/` et `lib/` = de la logique partagee, sans rendu visuel.

---

## 5. La base de donnees et Prisma

### 5.1 C'est quoi Prisma ?

Prisma est un **ORM** (Object-Relational Mapping). Au lieu d'ecrire du SQL brut, tu ecris du JavaScript qui ressemble a des objets :

```js
// ❌ SQL brut
SELECT * FROM communities WHERE slug = 'dev-tn'

// ✅ Avec Prisma
const community = await prisma.community.findUnique({
  where: { slug: 'dev-tn' },
  include: { creator: true, _count: { select: { members: true } } },
});
```

Prisma traduit ton code JS en SQL, l'envoie a PostgreSQL, et te renvoie un objet JavaScript propre. Tu n'as jamais besoin d'ecrire du SQL.

### 5.2 Le schema Prisma : la carte de la base de donnees

Le fichier `server/prisma/schema.prisma` decrit TOUTES les tables et leurs relations. Voici les concepts cles :

**Les modeles = les tables :**

```prisma
model User {
  id           String   @id @default(uuid())   // Colonne id, cle primaire, UUID auto-genere
  email        String   @unique                 // Unique = pas deux users avec le meme email
  name         String                           // Obligatoire
  avatar       String?                          // Le ? = nullable (peut etre vide)
  role         UserRole @default(MEMBER)        // Valeur par defaut
  createdAt    DateTime @default(now())         // Date de creation automatique
}
```

**Les relations = les liens entre tables :**

```
User ──< CommunityMember >── Community
 "Un user peut etre membre de plusieurs communautes"
 "Une communaute a plusieurs membres"
 "La table CommunityMember fait le lien (table de jointure)"

Community ──< Post ──< Comment
 "Une communaute a plusieurs posts"
 "Un post a plusieurs commentaires"

Course ──< Module ──< Lesson
 "Un cours a plusieurs modules"
 "Un module a plusieurs lecons"
```

### 5.3 Le diagramme complet des donnees

Voici TOUTES les entites de Makteb et comment elles se relient :

```
                        ┌──────────┐
                        │   User   │
                        └────┬─────┘
           ┌────────┬────────┼────────┬──────────┐
           v        v        v        v          v
    ┌────────────┐ ┌────┐ ┌──────┐ ┌──────────┐ ┌──────────────┐
    │ Community  │ │Post│ │Course│ │PointEntry│ │ Notification │
    │   Member   │ │    │ │      │ │          │ │              │
    └─────┬──────┘ └──┬─┘ └──┬───┘ └──────────┘ └──────────────┘
          v           v      v
    ┌──────────┐  ┌───────┐ ┌──────┐
    │Community │  │Comment│ │Module│
    └────┬─────┘  └───┬───┘ └──┬───┘
         |            v        v
    ┌────┼────┐  ┌────────┐ ┌──────┐
    │    │    │  │Reaction│ │Lesson│
    v    v    v  └────────┘ └──┬───┘
  Plan Event Level             v
    |    |                ┌────────────┐
    v    v                │LessonProgress│
  Sub  EventAttendance    └────────────┘
    |
    v
  Payment
```

**Chaque lien a un sens :**
- `User` → `CommunityMember` → `Community` : un user rejoint une communaute via un membership (qui stocke son role : OWNER, ADMIN, MEMBER...)
- `Community` → `Post` → `Comment` → `Reaction` : le contenu social
- `Community` → `Course` → `Module` → `Lesson` → `LessonProgress` : le contenu educatif
- `Community` → `Plan` → `Subscription` → `Payment` : la monetisation
- `User` → `PointEntry`, `Community` → `Level` : la gamification
- `Community` → `Event` → `EventAttendance` : le calendrier

### 5.4 Les enums : des valeurs fixes et controlees

```prisma
enum MemberRole { OWNER  ADMIN  MODERATOR  MEMBER }
enum PostType   { POST  DISCUSSION  ANNOUNCEMENT  POLL  QUESTION }
enum LessonType { VIDEO  TEXT  QUIZ }
```

Un enum, c'est une liste fermee de valeurs possibles. Ca garantit qu'un `role` ne pourra JAMAIS etre "SUPERADMIN" ou "toto" — seulement les valeurs definies. C'est une protection au niveau de la base de donnees.

### 5.5 Les index et contraintes : performance et integrite

```prisma
@@unique([userId, communityId])  // Un user ne peut pas rejoindre 2 fois la meme communaute
@@index([communityId, createdAt]) // Recherche rapide des posts par communaute, tries par date
```

- `@@unique` = contrainte d'unicite. La base de donnees refuse l'insertion si un doublon existe. C'est plus fiable que de verifier dans le code (pas de race condition).
- `@@index` = index pour la performance. Sans index, chercher les posts d'une communaute = parcourir TOUS les posts. Avec index = recherche quasi-instantanee.

---

## 6. L'authentification

### 6.1 Le systeme de double token

Makteb utilise deux tokens JWT (JSON Web Token) :

```
┌─────────────────────────────────────────────────────┐
│  ACCESS TOKEN                                        │
│  - Stocke dans : la memoire du frontend              │
│  - Duree : courte (ex: 15 minutes)                   │
│  - Envoye : header Authorization: Bearer <token>     │
│  - Contient : { userId: "abc-123", role: "MEMBER" }  │
│  - Si vole : le voleur a acces pendant 15 min max    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  REFRESH TOKEN                                       │
│  - Stocke dans : cookie httpOnly (invisible au JS)   │
│  - Duree : longue (ex: 30 jours)                     │
│  - Envoye : automatiquement par le navigateur        │
│  - Sert a : obtenir un nouveau access token           │
│  - Si vole : plus grave, mais httpOnly le protege    │
└─────────────────────────────────────────────────────┘
```

**Pourquoi deux tokens ?**

Un seul token longue duree serait plus simple, mais dangereux. Si quelqu'un le vole (XSS, interception reseau...), il a acces pendant 30 jours. Avec le systeme double :
- L'access token vit peu de temps → si vole, dommage limite
- Le refresh token est dans un cookie `httpOnly` → JavaScript ne peut pas y acceder → protection contre XSS

### 6.2 Le flux complet de login

```
1. L'utilisateur entre email + mot de passe sur /login
2. Frontend envoie POST /api/auth/login { email, password }
3. Backend verifie le mot de passe (bcrypt)
4. Backend cree :
   - accessToken (JWT, 15 min) → renvoye dans la reponse JSON
   - refreshToken (JWT, 30 jours) → place dans un cookie httpOnly
5. Frontend stocke le user dans Zustand (authStore)
6. L'utilisateur est redirige vers la page d'accueil

Plus tard, quand le accessToken expire :
7. Frontend fait une requete → Backend repond 401
8. L'intercepteur Axios intercepte le 401
9. Il appelle POST /api/auth/refresh (le cookie refreshToken est envoye automatiquement)
10. Backend verifie le refreshToken, cree un nouveau accessToken
11. L'intercepteur rejoue la requete originale → tout est transparent pour l'utilisateur
```

### 6.3 Les middlewares auth

```
requireAuth :   "Tu DOIS etre connecte pour acceder a cette route"
                → Utilise pour : creer un post, rejoindre une communaute, modifier ses settings
                → Si pas de token valide : 401 Unauthorized

optionalAuth :  "Si tu es connecte, je le sais. Sinon, ca passe quand meme"
                → Utilise pour : voir une communaute publique (afficher un bouton "Rejoindre" si pas membre)
```

---

## 7. Le temps reel avec Socket.IO

### 7.1 C'est quoi le probleme que ca resout ?

Sans temps reel, si quelqu'un publie un post dans ta communaute, tu ne le vois que quand tu rafraichis la page. C'est comme le mail : tu dois aller verifier.

Avec Socket.IO, c'est comme WhatsApp : le message apparait tout seul.

### 7.2 Comment ca marche

```
1. L'utilisateur ouvre /community/dev-tn
2. Le frontend ouvre une connexion WebSocket avec le serveur
3. Le frontend dit au serveur : "Je veux recevoir les events de la communaute dev-tn"
   → socket.emit('join', { room: 'community:abc-123' })
4. Le serveur enregistre : "Ce client ecoute la room community:abc-123"

Plus tard, quelqu'un d'autre cree un post :
5. Le service backend cree le post dans la DB
6. Le service emet : io.to('community:abc-123').emit('post:created', newPost)
7. TOUS les clients dans cette room recoivent l'event
8. Le frontend peut alors :
   - Invalider le cache TanStack Query pour re-fetch les posts
   - Ou directement ajouter le post dans l'UI
```

**Les rooms** = des canaux prives. Quand tu es sur la communaute "dev-tn", tu recois les events de cette communaute, pas de toutes les autres. Ca evite de noyer le client avec des donnees inutiles.

---

## 8. Le parcours complet d'une action

Pour vraiment comprendre comment tout s'assemble, suivons le parcours complet de **"un utilisateur cree un post dans une communaute"** :

```
UTILISATEUR
    │ Ecrit son post dans le formulaire PostComposer et clique "Publier"
    v
FRONTEND (CommunityPage.jsx)
    │ useMutation appelle api.post('/posts', { communityId, title, content })
    v
AXIOS (lib/api.js)
    │ Ajoute automatiquement :
    │   - baseURL: '/api' → la requete devient POST /api/posts
    │   - withCredentials: true → envoie les cookies
    │   - header Authorization: Bearer <accessToken>
    v
VITE PROXY (en dev seulement)
    │ Vite voit que /api commence par /api
    │ Il redirige vers http://localhost:4000/api/posts
    │ (En production, le frontend appelle directement l'URL du backend)
    v
EXPRESS (app.js)
    │ Matche la route : app.use('/api/posts', postRoutes)
    v
MIDDLEWARE requireAuth
    │ Decode le JWT du header Authorization
    │ Verifie la signature et l'expiration
    │ Met req.userId = "abc-123"
    v
MIDDLEWARE validate(createPostSchema)
    │ Verifie que req.body a un title (string min 1) et un content (string min 1)
    │ Si invalide → renvoie 400 avec les erreurs Zod
    v
ROUTE HANDLER (post.routes.js)
    │ Appelle postService.createPost(req.userId, req.body)
    v
SERVICE (post.service.js)
    │ 1. Verifie que l'utilisateur est bien membre de la communaute (Prisma query)
    │ 2. Cree le post dans PostgreSQL (prisma.post.create)
    │ 3. Attribue des points de gamification (+5 points pour un post)
    │ 4. Emet l'event Socket.IO : io.to('community:xxx').emit('post:created', post)
    │ 5. Retourne le post cree
    v
ROUTE HANDLER
    │ res.status(201).json({ post })
    v
AXIOS (reponse)
    │ Recoit { post: { id: "...", title: "...", ... } }
    v
TANSTACK QUERY (useMutation → onSuccess)
    │ queryClient.invalidateQueries(['posts', communityId])
    │ → TanStack Query sait que le cache des posts est perime
    │ → Il re-fetch automatiquement GET /api/posts?communityId=xxx
    │ → Le feed se met a jour avec le nouveau post
    v
REACT
    │ Re-render du composant avec les nouvelles donnees
    │ toast.success('Post cree !') affiche une notification
    v
UTILISATEUR voit son post dans le feed !

EN PARALLELE, les AUTRES utilisateurs dans la meme communaute :
    │ Leur client Socket.IO recoit l'event 'post:created'
    │ Ils peuvent invalider leur cache aussi → leur feed se met a jour en temps reel
```

---

## 9. Les decisions d'architecture : pourquoi ces choix

### 9.1 Pourquoi Express et pas Fastify/Nest/Hono ?

| Critere | Express | Alternatives |
|---------|---------|-------------|
| Ecosysteme | Le plus grand de Node.js, des milliers de middlewares | Plus petit |
| Documentation | Enorme, beaucoup de tutos | Moins de ressources |
| Simplicite | Tres simple a comprendre | Nest est plus complexe (decorators, DI) |
| Performance | Suffisante pour Makteb | Fastify/Hono sont plus rapides, mais on n'en a pas besoin |
| Express v5 | Support natif des async errors (plus besoin de try-catch) | - |

**La decision** : Express est le choix le plus simple et le plus documente. Makteb n'a pas besoin de gerer 10 000 requetes/seconde. La simplicite prime.

### 9.2 Pourquoi Prisma et pas Drizzle/TypeORM/SQL brut ?

| Critere | Prisma | Alternatives |
|---------|--------|-------------|
| Schema declaratif | `schema.prisma` = source de verite | Drizzle/TypeORM : schema dans le code JS |
| Migrations | `prisma db push`, `prisma migrate` | Drizzle a un bon systeme aussi |
| Prisma Studio | Interface web pour voir/editer la DB | Pas d'equivalent simple |
| Relations | Tres naturelles (`include`, `select`) | SQL brut = JOINs manuels |

**La decision** : Prisma est le plus intuitif pour un projet qui demarre. Le schema est lisible meme par un non-dev. Prisma Studio permet de debugger visuellement.

### 9.3 Pourquoi TanStack Query et pas SWR/Redux/fetch manual ?

- **SWR** : similaire mais moins de features (pas d'infinite queries, mutations moins puissantes)
- **Redux** : trop de boilerplate pour des donnees serveur. Redux est bien pour de l'etat client complexe, pas pour du fetch.
- **fetch manual** : tu reinventes tout (cache, loading, error, revalidation, retry...)

**La decision** : TanStack Query est le standard actuel pour "donnees qui viennent d'une API". Il gere cache, loading, error, retry, revalidation, infinite scroll... en quelques lignes.

### 9.4 Pourquoi Zustand et pas Redux/Context ?

- **Redux** : trop lourd pour un etat simple (auth + theme). Redux brille quand tu as des dizaines de stores interconnectes.
- **Context React** : ok pour du simple, mais cause des re-renders inutiles (tous les enfants re-render quand le contexte change, meme s'ils n'utilisent pas la valeur qui a change).
- **Zustand** : minimal, pas de Provider a rajouter, selection fine (un composant peut ecouter juste `user` sans re-render quand `isLoading` change).

### 9.5 Pourquoi des modules backend et pas des routes a plat ?

```
// ❌ Tout a plat (cauchemar a partir de 20 routes)
server/src/
  routes.js          ← 500 lignes, tout melange
  services.js        ← 1000 lignes, impossible a lire

// ✅ Par module (chaque domaine est isole)
server/src/modules/
  auth/              ← je cherche le login ? c'est ici
  community/         ← je cherche les communautes ? c'est ici
  courses/           ← je cherche les cours ? c'est ici
```

**La decision** : quand le projet grandit, la structure par modules permet de trouver n'importe quoi en 5 secondes. Et si tu travailles en equipe, chacun peut travailler sur son module sans conflits Git.

### 9.6 Pourquoi Socket.IO et pas WebSocket natif/SSE ?

- **WebSocket natif** : bas niveau, tu geres tout toi-meme (reconnexion, rooms, serialisation)
- **SSE (Server-Sent Events)** : unidirectionnel (serveur → client seulement), pas de rooms
- **Socket.IO** : reconnexion automatique, rooms, namespaces, fallback polling, emit/on simple

**La decision** : Socket.IO simplifie enormement le temps reel. Les rooms par communaute sont parfaites pour notre cas d'usage.

### 9.7 Pourquoi PostgreSQL et pas MongoDB/MySQL ?

- **MongoDB** : pas de schema strict, pas de relations fortes. Bien pour des donnees non structurees (logs, analytics). Makteb a des donnees tres structurees (users, posts, courses) avec beaucoup de relations.
- **MySQL** : similaire a PostgreSQL mais moins de features avancees (JSON, full-text search, extensions).
- **PostgreSQL** : relations fortes, ACID, JSON si besoin, full-text search, extensions (PostGIS si on veut des cartes un jour). C'est le choix par defaut pour une app relationnelle moderne.

### 9.8 Redis : pourquoi une deuxieme base de donnees ?

PostgreSQL stocke les donnees permanentes. Redis stocke les donnees temporaires et rapides :

- **Cache** : stocker le resultat d'une requete couteuse pour ne pas la refaire a chaque fois
- **Sessions** : si on ajoute des sessions serveur un jour
- **BullMQ (files d'attente)** : envoyer un email de bienvenue ne doit pas bloquer la reponse HTTP. On met le job dans une file Redis, un worker le traite en arriere-plan.
- **Rate limiting** : compter les requetes par IP pour bloquer les abus

Redis est en memoire (RAM), donc ultra-rapide (~1 ms par operation vs ~5-20 ms pour PostgreSQL).

---

## 10. Comment developper petit a petit

### 10.1 L'ordre recommande

Ne construis pas tout en meme temps. Suis cet ordre qui valide chaque couche avant d'en ajouter une nouvelle :

```
Phase 0 : COMPRENDRE
  → Lire ce document, lancer l'app, naviguer dans le code
  → But : tu dois pouvoir expliquer "comment un post est cree" de bout en bout

Phase 1 : FONDATIONS
  → ProtectedRoute (empecher l'acces aux pages privees si pas connecte)
  → Etats de chargement et erreurs propres sur chaque page
  → Seed de demo (donnees de test realistes)
  → But : l'app est stable et utilisable en local

Phase 2 : DEPLOIEMENT STAGING
  → Variables d'env (VITE_API_URL pour la prod)
  → Dockerfiles client + server
  → Deployer sur un serveur de test
  → But : l'app tourne quelque part, pas juste en local

Phase 3 : UPLOAD D'IMAGES
  → Routes backend pour upload (Multer → Cloudinary)
  → Composant frontend pour choisir/previewer une image
  → Utiliser pour : avatar, cover communaute, cover cours
  → But : les utilisateurs peuvent personnaliser leur contenu

Phase 4 : NOTIFICATIONS
  → CRUD backend pour les notifications
  → BullMQ pour les envoyer en arriere-plan
  → Socket.IO pour les pousser en temps reel
  → Badge "non lu" dans la Navbar
  → But : les utilisateurs sont informes de ce qui se passe

Phase 5 : COURS AVANCES
  → Quiz (structure JSON dans les lecons)
  → Validation des reponses + points de gamification
  → But : les cours deviennent interactifs

Phase 6 : PAIEMENTS
  → Flow Flouci complet (initier → payer → webhook → confirmer)
  → Plans et abonnements
  → But : le createur peut monetiser sa communaute

Phase 7+ : ENRICHISSEMENT
  → Recherche, profils publics, analytics, moderation avancee...
```

### 10.2 Les regles pour avancer proprement

**1. Une feature a la fois**

```
❌ "Je vais faire les notifications, l'upload ET les quiz en meme temps"
✅ "Je vais faire l'upload d'avatar. C'est tout. Quand c'est merge, je passe a la suite."
```

**2. Petites PR, pas des monstres**

```
❌ Une PR de 2000 lignes qui ajoute upload + preview + crop + gallery
✅ PR 1 : route backend upload (50 lignes)
   PR 2 : composant frontend upload (80 lignes)
   PR 3 : brancher l'upload sur l'avatar (30 lignes)
```

**3. Toujours tester le cas nominal + le cas d'erreur**

```
Avant de merger :
- Est-ce que ca marche quand tout va bien ? (cas nominal)
- Est-ce que ca gere proprement quand ca echoue ? (pas de crash, message d'erreur clair)
- Est-ce que l'UI est propre en loading ? (spinner, pas de flash de contenu)
```

**4. Documenter les decisions**

Si tu ajoutes un nouveau pattern, une nouvelle convention ou un nouveau dossier, mets a jour `PROJECT.md` ou ce document. Le prochain dev (ou toi dans 3 mois) doit comprendre POURQUOI ce choix a ete fait.

### 10.3 Workflow Git pour une tache

```
1.  git checkout develop && git pull           # Partir de develop a jour
2.  git checkout -b feat/upload-avatar         # Creer une branche
3.  ... coder par petits commits ...           # Un commit = un objectif clair
4.  npm test (server/)                         # S'assurer que les tests passent
5.  npm run lint (client/)                     # S'assurer que le code est propre
6.  git rebase origin/develop                  # Se remettre a jour si d'autres ont merge
7.  git push -u origin feat/upload-avatar      # Pousser
8.  Ouvrir une PR vers develop                 # Decrire ce qui a ete fait et pourquoi
9.  Review par un coequipier                   # Deuxieme paire d'yeux
10. Merge (squash si convention d'equipe)      # Integrer dans develop
```

---

## Resume en une page

| Question | Reponse |
|----------|---------|
| Qu'est-ce que Makteb ? | Plateforme de communautes + cours en ligne (clone Skool) |
| Frontend | React + Vite. Pages → TanStack Query → Axios → API backend |
| Backend | Express modulaire. Routes → Validation Zod → Services → Prisma |
| Base de donnees | PostgreSQL (donnees) + Redis (cache, queues) |
| Auth | Double token JWT (access court + refresh long en cookie httpOnly) |
| Temps reel | Socket.IO avec rooms par communaute |
| Etat client | Zustand pour l'auth, TanStack Query pour les donnees serveur |
| Styles | Tailwind CSS (classes utilitaires) |
| Pourquoi modulaire ? | Un dossier par domaine = facile a trouver, isoler et tester |
| Pourquoi route/service separes ? | Route = orchestration, service = logique metier testable |
| Comment avancer ? | Phase par phase, une feature a la fois, petites PR |
