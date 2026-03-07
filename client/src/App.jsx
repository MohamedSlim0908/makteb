import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './lib/theme.jsx';
import { AppLayout } from './components/layout/AppLayout';

const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() =>
  import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage }))
);
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage').then(m => ({ default: m.AuthCallbackPage })));
const DiscoverPage = lazy(() => import('./pages/DiscoverPage').then(m => ({ default: m.DiscoverPage })));
const CommunityPage = lazy(() => import('./pages/CommunityPage').then(m => ({ default: m.CommunityPage })));
const CommunitySettingsPage = lazy(() =>
  import('./pages/CommunitySettingsPage').then(m => ({ default: m.CommunitySettingsPage }))
);
const PostPage = lazy(() => import('./pages/PostPage').then(m => ({ default: m.PostPage })));
const CoursePage = lazy(() => import('./pages/CoursePage').then(m => ({ default: m.CoursePage })));
const CourseLearnPage = lazy(() => import('./pages/CourseLearnPage').then(m => ({ default: m.CourseLearnPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const CreatorLandingPage = lazy(() => import('./pages/CreatorLandingPage').then(m => ({ default: m.CreatorLandingPage })));
const CreatorPricingPage = lazy(() => import('./pages/CreatorPricingPage').then(m => ({ default: m.CreatorPricingPage })));
const CreatorCommunityDashboardPage = lazy(() =>
  import('./pages/CreatorCommunityDashboardPage').then(m => ({ default: m.CreatorCommunityDashboardPage }))
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" /></div>}>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Navigate to="/discover" replace />} />
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/discover" element={<DiscoverPage />} />
                <Route path="/community/:slug" element={<CommunityPage />} />
                <Route path="/community/:slug/settings" element={<CommunitySettingsPage />} />
                <Route path="/post/:id" element={<PostPage />} />
                <Route path="/course/:id" element={<CoursePage />} />
                <Route path="/course/:id/learn" element={<CourseLearnPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="/creator" element={<CreatorLandingPage />} />
              <Route path="/creator/pricing" element={<CreatorPricingPage />} />
              <Route path="/creator/community" element={<CreatorCommunityDashboardPage />} />
              <Route path="/sell-your-course" element={<Navigate to="/creator" replace />} />
              <Route path="/sell-your-course/pricing" element={<Navigate to="/creator/pricing" replace />} />
              <Route path="/sell-your-course/community" element={<Navigate to="/creator/community" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            className: 'text-sm',
            style: {
              background: 'var(--color-surface, #fff)',
              color: 'var(--color-text, #111827)',
              border: '1px solid var(--color-border, #e5e7eb)',
              borderRadius: '12px',
              padding: '12px 16px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
            },
          }}
        />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
