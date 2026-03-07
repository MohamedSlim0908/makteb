import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { api, getErrorMessage } from '../lib/api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedEmail = email.trim();
  const isEmailValid = normalizedEmail.length > 0 && EMAIL_REGEX.test(normalizedEmail);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isEmailValid) return;
    setError('');
    setIsSubmitting(true);

    try {
      const { data } = await api.post('/auth/forgot-password', { email: normalizedEmail });
      setMessage(data.message || 'If an account exists for that email, the password reset request has been received.');
      setSubmitted(true);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to submit your reset request right now.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px] animate-slide-up">
        <Link
          to="/login"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 text-gray-700">
              <Mail className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Forgot password</h1>
            <p className="mt-1 text-sm text-gray-500">
              Enter your account email and we will process the reset request.
            </p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="forgot-email" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Email
                </label>
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      if (error) setError('');
                      setEmail(e.target.value);
                    }}
                    placeholder="you@example.com"
                    autoComplete="email"
                  className={`w-full h-11 rounded-lg border px-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                    normalizedEmail.length > 0
                      ? isEmailValid
                        ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500'
                        : 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-gray-900 focus:ring-gray-900'
                  }`}
                  required
                />
                {normalizedEmail.length > 0 && (
                  <p className={`mt-1.5 text-xs ${isEmailValid ? 'text-emerald-600' : 'text-red-600'}`}>
                    {isEmailValid ? 'Email looks valid.' : 'Enter a valid email address.'}
                  </p>
                )}
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button type="submit" className="h-11 w-full" disabled={!isEmailValid || isSubmitting} isLoading={isSubmitting}>
                Continue
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {message}
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full"
                onClick={() => {
                  setSubmitted(false);
                  setMessage('');
                }}
              >
                Use a different email
              </Button>
            </div>
          )}

          <p className="mt-5 text-xs leading-relaxed text-gray-400">
            If your account was created with Google or Facebook, use that provider from the sign-in page instead of a
            password reset.
          </p>
        </div>
      </div>
    </div>
  );
}
