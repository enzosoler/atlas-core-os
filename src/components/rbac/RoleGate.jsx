import { useAuth } from '@/lib/AuthContext';
import { canAccess } from '@/lib/rbac';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

/**
 * RoleGate — verifica autorização e redireciona se necessário.
 * Hooks chamados incondicionalmente (React Rules of Hooks).
 */
export default function RoleGate({ page, roles, redirect = true, children }) {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const role = user?.atlas_role || 'athlete';
  const allowed = isAuthenticated
    ? page ? canAccess(role, page) : (roles || []).includes(role)
    : false;

  // Redirect effects — always called, conditionally active
  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      navigate('/Landing', { replace: true });
    }
  }, [isLoadingAuth, isAuthenticated, navigate]);

  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated && !allowed && redirect) {
      navigate('/Today', { replace: true });
    }
  }, [isLoadingAuth, isAuthenticated, allowed, redirect, navigate]);

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[hsl(var(--bg))]">
        <div className="w-8 h-8 border-[3px] border-[hsl(var(--border))] border-t-[hsl(var(--primary))] rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const nextUrl = `${window.location.origin}${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/auth?mode=login&next=${encodeURIComponent(nextUrl)}`} replace />;
  }

  if (!allowed) {
    if (redirect) return <Navigate to="/Today" replace />;
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center p-8">
        <div className="w-12 h-12 rounded-2xl bg-[hsl(var(--err)/0.08)] flex items-center justify-center">
          <span className="text-2xl">🔒</span>
        </div>
        <p className="t-subtitle">Acesso Restrito</p>
        <p className="t-caption max-w-xs">Você não tem permissão para acessar este recurso.</p>
      </div>
    );
  }

  return children;
}
