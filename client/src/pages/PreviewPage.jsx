import { Link } from 'react-router-dom';
import {
  Home,
  Compass,
  Users,
  FileText,
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  Settings,
  LogIn,
  UserPlus,
  ExternalLink,
} from 'lucide-react';

/** IDs/slugs utilisés pour l’aperçu (correspondent aux données seed si présentes) */
const PREVIEW_IDS = {
  communitySlug: 'creator-academy',
  courseId: '1',
  postId: '1',
};

const PAGES = [
  {
    title: 'Accueil',
    path: '/',
    description: 'Page d’accueil et présentation de Makteb',
    icon: Home,
  },
  {
    title: 'Découvrir',
    path: '/discover',
    description: 'Explorer les communautés',
    icon: Compass,
  },
  {
    title: 'Communauté',
    path: `/community/${PREVIEW_IDS.communitySlug}`,
    description: 'Page d’une communauté (onglets, posts, membres)',
    icon: Users,
  },
  {
    title: 'Publication',
    path: `/post/${PREVIEW_IDS.postId}`,
    description: 'Détail d’un post avec commentaires',
    icon: FileText,
  },
  {
    title: 'Cours',
    path: `/course/${PREVIEW_IDS.courseId}`,
    description: 'Page d’un cours (Community, Classroom, etc.)',
    icon: BookOpen,
  },
  {
    title: 'Apprendre (cours)',
    path: `/course/${PREVIEW_IDS.courseId}/learn`,
    description: 'Parcours d’apprentissage d’un cours',
    icon: GraduationCap,
  },
  {
    title: 'Tableau de bord',
    path: '/dashboard',
    description: 'Tableau de bord utilisateur',
    icon: LayoutDashboard,
  },
  {
    title: 'Paramètres',
    path: '/settings',
    description: 'Profil et paramètres du compte',
    icon: Settings,
  },
  {
    title: 'Connexion',
    path: '/login',
    description: 'Page de connexion',
    icon: LogIn,
  },
  {
    title: 'Inscription',
    path: '/register',
    description: 'Création de compte',
    icon: UserPlus,
  },
];

export function PreviewPage() {
  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Aperçu des pages
          </h1>
          <p className="text-gray-500 mt-1">
            Cliquez sur une page pour l’ouvrir dans l’application.
          </p>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2">
          {PAGES.map(({ title, path, description, icon }) => {
            const Icon = icon;
            return (
            <li key={path}>
              <Link
                to={path}
                className="flex items-start gap-4 p-4 rounded-xl bg-white border border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md transition-all group"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 group-hover:bg-gray-200 group-hover:text-gray-900 transition-colors">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-gray-900 group-hover:text-gray-700 block">
                    {title}
                  </span>
                  <span className="text-sm text-gray-500 block mt-0.5">
                    {description}
                  </span>
                  <span className="text-xs text-gray-400 font-mono mt-2 block truncate">
                    {path}
                  </span>
                </div>
                <ExternalLink className="h-4 w-4 shrink-0 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </Link>
            </li>
          );
          })}
        </ul>

        <p className="text-sm text-gray-400 mt-8">
          Les pages Communauté, Publication et Cours utilisent des identifiants
          de démo ({PREVIEW_IDS.communitySlug}, id cours/post = {PREVIEW_IDS.courseId}). Si la base
          n’est pas seedée, certaines peuvent afficher des états vides ou des erreurs.
        </p>
      </div>
    </div>
  );
}
