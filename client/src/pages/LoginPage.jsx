import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { useAuth } from '../hooks/useAuth';
import { DiscoverPage } from './DiscoverPage';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/discover');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  }

  const isDisabled = isSubmitting || !email.trim() || !password.trim();

  return (
    <div className="relative h-screen overflow-hidden bg-gray-100">
      <div className="pointer-events-none select-none">
        <Navbar />
        <DiscoverPage />
      </div>

      <div
        className="absolute inset-0 z-50 bg-black/60 px-4 py-8"
        onClick={() => navigate('/discover')}
      >
        <div className="mx-auto flex h-full max-w-[540px] items-center">
          <section
            aria-labelledby="login-title"
            aria-modal="true"
            role="dialog"
            onClick={(e) => e.stopPropagation()}
            className="w-full rounded-2xl border border-gray-200 bg-white px-7 py-8 shadow-2xl sm:px-10 sm:py-9"
          >
            <div className="mb-7 text-center">
              <p className="text-[52px] font-bold leading-none tracking-tight">
                <span className="text-blue-700">M</span>
                <span className="text-red-700">a</span>
                <span className="text-yellow-600">k</span>
                <span className="text-blue-600">t</span>
                <span className="text-emerald-600">e</span>
                <span className="text-orange-600">b</span>
              </p>
              <h1 id="login-title" className="mt-4 text-4xl font-bold text-gray-900">
                Sign in to Makteb
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                autoComplete="email"
                className="h-12 w-full rounded-md border border-gray-300 px-3.5 text-lg text-gray-900 placeholder:text-gray-500 focus:border-gray-500 focus:outline-none"
                required
              />

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                className="h-12 w-full rounded-md border border-gray-300 px-3.5 text-lg text-gray-900 placeholder:text-gray-500 focus:border-gray-500 focus:outline-none"
                required
              />

              <div className="text-right">
                <button type="button" className="text-sm text-primary-600 hover:underline">
                  Forgot password?
                </button>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={isDisabled}
                className="h-12 w-full rounded-md bg-gray-200 text-lg font-bold tracking-wide text-gray-600 transition-colors enabled:bg-gray-900 enabled:text-white enabled:hover:bg-black disabled:cursor-not-allowed disabled:opacity-90"
              >
                {isSubmitting ? 'LOGGING IN...' : 'LOG IN'}
              </button>
            </form>

            <p className="mt-5 text-center text-base text-gray-700">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="font-medium text-primary-600 hover:underline">
                Sign up
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
