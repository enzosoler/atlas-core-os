import React from 'react';

/**
 * Simple error boundary para capturar crashes não-esperados
 * Fornece fallback sem quebrar o app inteiro
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center p-8">
          <div className="w-12 h-12 rounded-2xl bg-[hsl(var(--err)/0.08)] flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="t-subtitle">Erro Inesperado</p>
          <p className="t-caption max-w-xs">Algo deu errado. Tente recarregar a página.</p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-secondary mt-4"
          >
            Recarregar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}