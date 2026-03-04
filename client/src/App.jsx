import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './lib/theme.jsx';
import { AppLayout } from './components/layout/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { CommunityPage } from './pages/CommunityPage';
import { PostPage } from './pages/PostPage';
import { CoursePage } from './pages/CoursePage';
import { DashboardPage } from './pages/DashboardPage';
import { SettingsPage } from './pages/SettingsPage';

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
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/community/:slug" element={<CommunityPage />} />
            <Route path="/post/:id" element={<PostPage />} />
            <Route path="/course/:id" element={<CoursePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'dark:bg-gray-800 dark:text-white dark:border-gray-700',
        }}
      />
    </QueryClientProvider>
    </ThemeProvider>
  );
}
