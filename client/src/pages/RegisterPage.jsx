import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { SocialAuthButtons } from '../components/auth/SocialAuthButtons';

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LEGAL_DOCUMENTS = {
  terms: {
    title: 'Terms of Service',
    intro:
      'These terms explain the basic rules for using Makteb, joining communities, and accessing creator content.',
    sections: [
      {
        heading: 'Account responsibilities',
        body:
          'You are responsible for keeping your account details accurate and for maintaining the security of your login credentials.',
      },
      {
        heading: 'Community and course access',
        body:
          'Access to communities, lessons, and member spaces depends on the pricing and visibility rules set for each offering.',
      },
      {
        heading: 'Acceptable use',
        body:
          'You may not abuse the platform, interfere with other users, upload unlawful content, or attempt to bypass payment or access controls.',
      },
      {
        heading: 'Billing and cancellations',
        body:
          'Paid products may include separate billing terms, renewal settings, and refund rules depending on how the creator configured the offer.',
      },
      {
        heading: 'Platform changes',
        body:
          'Makteb may update platform features, policies, or availability over time. Continued use means you accept the latest published terms.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    intro:
      'This policy describes what information Makteb collects, how it is used, and the controls available to users.',
    sections: [
      {
        heading: 'What we collect',
        body:
          'We collect information you provide directly, such as your name, email address, profile details, and activity inside communities and courses.',
      },
      {
        heading: 'How we use your data',
        body:
          'Your information is used to create your account, deliver platform features, improve the product, and support payments, notifications, and security.',
      },
      {
        heading: 'Sharing and visibility',
        body:
          'Some profile and activity data may be visible to other members depending on community settings. We do not sell your personal information.',
      },
      {
        heading: 'Security and retention',
        body:
          'We apply reasonable safeguards to protect stored data and retain information only as long as needed for service delivery, compliance, and support.',
      },
      {
        heading: 'Your choices',
        body:
          'You can update account details, change visibility settings, and request account changes through the controls available inside the platform.',
      },
    ],
  },
};

function getPasswordStrength(password) {
  if (!password) {
    return {
      label: 'Add a password',
      message: `Use at least ${MIN_PASSWORD_LENGTH} characters.`,
      percent: 0,
      barClassName: 'bg-gray-200',
      textClassName: 'text-gray-500',
    };
  }

  let score = 0;
  if (password.length >= MIN_PASSWORD_LENGTH) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      label: 'Too short',
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
      percent: 20,
      barClassName: 'bg-red-500',
      textClassName: 'text-red-600',
    };
  }

  if (score <= 2) {
    return {
      label: 'Weak',
      message: 'Add uppercase letters, numbers, or symbols to strengthen it.',
      percent: 40,
      barClassName: 'bg-red-500',
      textClassName: 'text-red-600',
    };
  }

  if (score === 3) {
    return {
      label: 'Fair',
      message: 'This works, but another character type would make it better.',
      percent: 60,
      barClassName: 'bg-amber-500',
      textClassName: 'text-amber-600',
    };
  }

  if (score === 4) {
    return {
      label: 'Good',
      message: 'Strong enough for most accounts.',
      percent: 80,
      barClassName: 'bg-primary-600',
      textClassName: 'text-primary-600',
    };
  }

  return {
    label: 'Strong',
    message: 'Strong password.',
    percent: 100,
    barClassName: 'bg-emerald-500',
    textClassName: 'text-emerald-600',
  };
}

export function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [openLegalDocument, setOpenLegalDocument] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const normalizedEmail = email.trim();
  const isEmailValid = normalizedEmail.length > 0 && EMAIL_REGEX.test(normalizedEmail);
  const hasStartedEmail = normalizedEmail.length > 0;
  const hasPasswordMinLength = password.length >= MIN_PASSWORD_LENGTH;
  const passwordStrength = getPasswordStrength(password);
  const activeLegalDocument = openLegalDocument ? LEGAL_DOCUMENTS[openLegalDocument] : null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const name = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
    if (!name) {
      setError('Please enter your first and last name.');
      return;
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setError('Enter a valid email address.');
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await register(name, normalizedEmail, password);
      navigate(user.role === 'CREATOR' ? '/creator/community' : '/discover');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const isDisabled =
    isSubmitting ||
    !firstName.trim() ||
    !lastName.trim() ||
    !isEmailValid ||
    !hasPasswordMinLength;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[400px] animate-slide-up">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              M
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h1>
          <p className="text-gray-500 text-sm">Start your learning journey</p>
        </div>

        <div className="mb-6">
          <SocialAuthButtons dividerLabel="Or sign up with email" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="reg-first" className="block text-sm font-medium text-gray-700 mb-1.5">
                First name
              </label>
              <input
                id="reg-first"
                type="text"
                value={firstName}
                onChange={(e) => {
                  if (error) setError('');
                  setFirstName(e.target.value);
                }}
                autoComplete="given-name"
                className="w-full h-11 px-3.5 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors"
                required
              />
            </div>
            <div>
              <label htmlFor="reg-last" className="block text-sm font-medium text-gray-700 mb-1.5">
                Last name
              </label>
              <input
                id="reg-last"
                type="text"
                value={lastName}
                onChange={(e) => {
                  if (error) setError('');
                  setLastName(e.target.value);
                }}
                autoComplete="family-name"
                className="w-full h-11 px-3.5 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Email
            </label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => {
                if (error) setError('');
                setEmail(e.target.value);
              }}
              placeholder="you@example.com"
              autoComplete="email"
              className={`w-full h-11 px-3.5 rounded-lg border text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                hasStartedEmail
                  ? isEmailValid
                    ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500'
                    : 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-gray-900 focus:ring-gray-900'
              }`}
              aria-invalid={hasStartedEmail && !isEmailValid}
              required
            />
            {hasStartedEmail && (
              <p className={`mt-1.5 text-xs ${isEmailValid ? 'text-emerald-600' : 'text-red-600'}`}>
                {isEmailValid ? 'Email looks good.' : 'Enter a valid email address.'}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  if (error) setError('');
                  setPassword(e.target.value);
                }}
                placeholder="Create a password"
                autoComplete="new-password"
                className={`w-full h-11 rounded-lg border pl-3.5 pr-11 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                  password.length > 0
                    ? hasPasswordMinLength
                      ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500'
                      : 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-gray-900 focus:ring-gray-900'
                }`}
                aria-invalid={password.length > 0 && !hasPasswordMinLength}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-gray-400 transition-colors hover:text-gray-600 focus:outline-none focus-visible:text-gray-700"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
            <div className="mt-2">
              <div className="flex items-center justify-between gap-3">
                <p className={`text-xs font-medium ${passwordStrength.textClassName}`}>
                  {passwordStrength.label}
                </p>
                <p className="text-xs text-gray-400">
                  {password.length}/{MIN_PASSWORD_LENGTH}+ chars
                </p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${passwordStrength.barClassName}`}
                  style={{ width: `${passwordStrength.percent}%` }}
                />
              </div>
              <p className={`mt-1.5 text-xs ${passwordStrength.textClassName}`}>
                {passwordStrength.message}
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isDisabled}
            isLoading={isSubmitting}
            className="w-full h-11"
          >
            Create Account
          </Button>

          <p className="text-xs text-gray-400 text-center leading-relaxed">
            By signing up, you accept our{' '}
            <button
              type="button"
              onClick={() => setOpenLegalDocument('terms')}
              className="font-medium underline underline-offset-2 hover:text-gray-600"
            >
              Terms of Service
            </button>{' '}
            and{' '}
            <button
              type="button"
              onClick={() => setOpenLegalDocument('privacy')}
              className="font-medium underline underline-offset-2 hover:text-gray-600"
            >
              Privacy Policy
            </button>.
          </p>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-gray-900 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <Modal
        isOpen={Boolean(activeLegalDocument)}
        onClose={() => setOpenLegalDocument(null)}
        title={activeLegalDocument?.title}
        size="lg"
      >
        {activeLegalDocument && (
          <div className="space-y-5">
            <p className="text-sm leading-6 text-gray-600">{activeLegalDocument.intro}</p>
            <div className="space-y-4">
              {activeLegalDocument.sections.map((section) => (
                <section key={section.heading} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <h3 className="text-sm font-semibold text-gray-900">{section.heading}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-gray-600">{section.body}</p>
                </section>
              ))}
            </div>
            <div className="flex justify-end">
              <Button type="button" onClick={() => setOpenLegalDocument(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
