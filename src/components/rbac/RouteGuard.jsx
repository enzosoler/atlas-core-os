import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { canAccess } from '@/lib/rbac';

/**
 * RouteGuard — proteger rotas com estados bem definidos.
 * Todos os hooks são chamados incondicionalmente (React Rules of Hooks).
 */
export default function RouteGuard({ 
  page, 
  roles, 
  children,
  fallback = 'redirect' // 'redirect' | 'show_403'
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoadingAuth, isAuthenticated, authState } = useAuth();
  
  const userRole = user?.atlas_role || 'athlete';
  const isAuthorized = isAuthenticated
    ? page ? canAccess(userRole, page) : (roles || []).includes(userRole)
    : false;

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      navigate('/Landing', { replace: true });
    }
  }, [isLoadingAuth, isAuthenticated, navigate]);

  // Redirect if not authorized
  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated && !isAuthorized && fallback === 'redirect') {
      navigate('/Today', { replace: true });
    }
  }, [isLoadingAuth, isAuthenticated, isAuthorized, fallback, navigate]);

  if (isLoadingAuth || authState === 'loading') {
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

  if (!isAuthorized) {
    if (fallback === 'redirect') return <Navigate to="/Today" replace />;
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center p-8">
        <div className="w-12 h-12 rounded-2xl bg-[hsl(var(--err)/0.08)] flex items-center justify-center">
          <span className="text-2xl">🔒</span>
        </div>
        <p className="t-subtitle">Acesso Restrito</p>
        <p className="t-caption max-w-xs">Você não tem permissão para acessar este recurso.</p>
        <button
          onClick={() => navigate('/Today', { replace: true })}
          className="btn btn-secondary mt-4"
        >
          Voltar ao Dashboard
        </button>
      </div>
    );
  }

  return children;
}
