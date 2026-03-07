import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { setAccessToken } from '../hooks/useAuth';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const authError = searchParams.get('error');

    if (authError) {
      setError('Sign in failed. Please try again.');
      toast.error('Sign in failed. Please try again.');
      return;
    }

    if (token) {
      localStorage.setItem('accessToken', token);
      setAccessToken(token);
      api.get('/auth/me').then(({ data }) => {
        const dest = data.user?.role === 'CREATOR' ? '/creator/community' : '/discover';
        navigate(dest, { replace: true });
      }).catch(() => {
        navigate('/discover', { replace: true });
      });
    } else {
      setError('No authentication token received. Please try signing in again.');
    }
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Authentication failed</h1>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <div className="flex flex-col gap-2">
            <Button onClick={() => navigate('/login', { replace: true })}>
              Back to Login
            </Button>
            <Button variant="ghost" onClick={() => navigate('/', { replace: true })}>
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}
