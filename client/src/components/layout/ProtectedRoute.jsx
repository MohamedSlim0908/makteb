import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { PageSpinner } from '../ui/Spinner';

export function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <PageSpinner />;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}
