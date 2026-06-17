import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Hexagon, Lock, Mail, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authApi, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/Button';

export function Login() {
  const [email, setEmail] = useState('admin@hexacore.com');
  const [password, setPassword] = useState('AdminHexa2026');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await authApi.login({ email, password }) as any;
      if (res.success && res.data) {
        login(res.data.token, res.data.user);
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemo = async () => {
    setIsDemoLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:3000/api/auth/demo', {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok && data.token) {
        login(data.token, data.user);
        navigate(from, { replace: true });
      } else {
        throw new Error(data.error || 'Error creando demo');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión a la Demo');
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-hc-bg px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-hc-cobalt to-hc-cobalt-dark shadow-xl shadow-hc-cobalt/20">
            <Hexagon className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-white tracking-tight">
            Hexa Core Systems
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            ERP & POS Integrado · Inicia sesión para continuar
          </p>
        </div>

        <form className="mt-8 space-y-6 card" onSubmit={handleSubmit}>
          {error && (
            <div className="flex items-center gap-3 rounded-lg border border-hc-coral/30 bg-hc-coral/10 p-4">
              <AlertTriangle className="h-5 w-5 text-hc-coral" />
              <p className="text-sm font-medium text-hc-coral">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-gray-700/50 bg-hc-surface-dark py-3 pl-10 pr-3 text-white placeholder-gray-500 focus:border-hc-cobalt focus:outline-none focus:ring-1 focus:ring-hc-cobalt sm:text-sm transition-colors"
                  placeholder="admin@hexacore.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-gray-700/50 bg-hc-surface-dark py-3 pl-10 pr-3 text-white placeholder-gray-500 focus:border-hc-cobalt focus:outline-none focus:ring-1 focus:ring-hc-cobalt sm:text-sm transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            disabled={!email || !password}
          >
            Acceder al Sistema
          </Button>
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700/50"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-hc-surface-dark px-2 text-gray-500">O ingresa como invitado</span>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="lg"
            fullWidth
            loading={isDemoLoading}
            onClick={handleDemo}
          >
            Probar Demo en Vivo
          </Button>
        </form>
      </div>
    </div>
  );
}
