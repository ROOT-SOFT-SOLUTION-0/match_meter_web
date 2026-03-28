import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks';
import { Button, InputField } from '../components';
import { useUIStore } from '../store';
import authService from '../services/auth.service';

const getLandingRouteByRole = (role?: 'user' | 'admin' | 'super_admin') => {
  if (role === 'super_admin') return '/super-admin';
  if (role === 'admin') return '/admin';
  return '/player';
};

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signInWithGoogle, loading, error } = useAuth();
  const showError = useUIStore((state) => state.showError);
  const showSuccess = useUIStore((state) => state.showSuccess);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!email) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Invalid email format';

    if (!password) errors.password = 'Password is required';
    else if (password.length < 6) errors.password = 'Password must be at least 6 characters';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const redirectByProfileRole = async () => {
    const firebaseUser = authService.getCurrentUser();
    if (!firebaseUser) {
      navigate('/tournaments');
      return;
    }

    const profile = await authService.getUserProfile(firebaseUser.uid);
    navigate(getLandingRouteByRole(profile?.role));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await signIn(email, password);
      await redirectByProfileRole();
      showSuccess('Sign in successful!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
      showError(errorMessage);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      await redirectByProfileRole();
      showSuccess('Google sign in successful!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Google sign in failed';
      showError(errorMessage);
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-secondary-50 dark:bg-secondary-950 px-4 py-6 sm:py-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-md rounded-2xl border border-gray-100/80 dark:border-gray-800/80 bg-white/90 dark:bg-secondary-900/90 px-5 py-5 sm:px-7 sm:py-6 shadow-soft">
        <div className="mb-5 sm:mb-6 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-2xl font-bold text-primary">
            M
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">Sign in</h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Access your MatchMeter dashboard</p>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-400/50 bg-red-900/20 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <InputField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (validationErrors.email) setValidationErrors({ ...validationErrors, email: '' });
            }}
            error={validationErrors.email}
            disabled={loading}
            className="!bg-gray-50 dark:!bg-gray-900 border-gray-200 dark:border-gray-700"
          />

          <InputField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (validationErrors.password) setValidationErrors({ ...validationErrors, password: '' });
            }}
            error={validationErrors.password}
            disabled={loading}
            className="!bg-gray-50 dark:!bg-gray-900 border-gray-200 dark:border-gray-700"
          />

          <Button type="submit" fullWidth isLoading={loading} className="mt-2 py-2.5 shadow-sm">
            Sign In
          </Button>
        </form>

        <div className="my-8 flex items-center">
          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
          <span className="px-4 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Or</span>
          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
        </div>

        <Button
          type="button"
          onClick={handleGoogleSignIn}
          variant="outline"
          fullWidth
          disabled={loading}
          className="mb-6 py-2.5 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#EEEFF2" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google
        </Button>

        <div className="mt-2 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/60 dark:bg-blue-900/10 p-3 text-[11px] leading-relaxed text-blue-800 dark:text-blue-300 hidden xs:block">
          Super Admins sign in with the same email and password. If your email is listed in
          <span className="px-1 font-semibold">VITE_SUPER_ADMIN_EMAILS</span>, you are routed to the Super Admin dashboard.
        </div>

        <p className="mt-4 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          Don't have an account?{' '}
          <Link to="/signup" className="font-semibold text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}