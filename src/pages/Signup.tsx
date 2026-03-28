import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks';
import { Button, Card, CardBody, InputField } from '../components';
import { useUIStore } from '../store';

export default function Signup() {
  const navigate = useNavigate();
  const { signUp, signInWithGoogle, loading, error } = useAuth();
  const showError = useUIStore((state) => state.showError);
  const showSuccess = useUIStore((state) => state.showSuccess);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name) errors.name = 'Name is required';
    if (!formData.email) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email format';

    if (!formData.phone) errors.phone = 'Phone is required';
    else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) errors.phone = 'Invalid phone number';

    if (!formData.password) errors.password = 'Password is required';
    else if (formData.password.length < 8) errors.password = 'Password must be at least 8 characters';

    if (!formData.confirmPassword) errors.confirmPassword = 'Please confirm password';
    else if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwords do not match';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await signUp(formData.email, formData.password, {
        displayName: formData.name,
        email: formData.email,
        phone: formData.phone,
      });
      showSuccess('Account created successfully!');
      navigate('/tournaments');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign up failed';
      showError(errorMessage);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      await signInWithGoogle();
      showSuccess('Google sign up successful!');
      navigate('/tournaments');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Google sign up failed';
      showError(errorMessage);
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center bg-secondary-50 dark:bg-secondary-950 px-4 py-6 sm:py-8 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <Card className="relative w-full max-w-md border border-gray-100/80 dark:border-gray-800/80 bg-white/90 dark:bg-secondary-900/90">
        <CardBody>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-1">Create account</h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">Join MatchMeter in a few seconds.</p>

          {error && (
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <InputField
              label="Full Name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={validationErrors.name}
              disabled={loading}
            />

            <InputField
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={validationErrors.email}
              disabled={loading}
            />

            <InputField
              label="Phone"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              error={validationErrors.phone}
              disabled={loading}
              helperText="10 digit mobile number"
            />

            <InputField
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={validationErrors.password}
              disabled={loading}
              helperText="Minimum 8 characters"
            />

            <InputField
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={validationErrors.confirmPassword}
              disabled={loading}
            />

            <Button type="submit" fullWidth isLoading={loading}>
              Create Account
            </Button>
          </form>

          <div className="flex items-center my-5">
            <div className="flex-1 border-t border-gray-300 dark:border-gray-600" />
            <span className="px-3 text-gray-500 dark:text-gray-400">Or sign up with</span>
            <div className="flex-1 border-t border-gray-300 dark:border-gray-600" />
          </div>

          <Button
            type="button"
            onClick={handleGoogleSignUp}
            variant="outline"
            fullWidth
            disabled={loading}
            className="mb-4"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#1f2937" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </Button>

          <p className="mt-1 text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-semibold">
              Sign in
            </Link>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
