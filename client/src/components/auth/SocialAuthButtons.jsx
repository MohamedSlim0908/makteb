import { FaFacebookF } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { Button } from '../ui/Button';

const apiBase = import.meta.env.VITE_API_URL ?? '/api';

const providers = [
  {
    id: 'google',
    label: 'Continue with Google',
    icon: FcGoogle,
    iconClassName: 'text-[18px]',
    iconWrapperClassName: 'bg-white border border-gray-200',
  },
  {
    id: 'facebook',
    label: 'Continue with Facebook',
    icon: FaFacebookF,
    iconClassName: 'text-[15px] text-white',
    iconWrapperClassName: 'bg-[#1877F2]',
  },
];

export function SocialAuthButtons({ dividerLabel = 'Or use email' }) {
  function handleOAuth(providerId) {
    window.location.assign(`${apiBase}/auth/${providerId}`);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2.5">
        {providers.map((provider) => {
          const Icon = provider.icon;

          return (
            <Button
              key={provider.id}
              type="button"
              variant="outline"
              onClick={() => handleOAuth(provider.id)}
              className="h-11 w-full justify-start gap-3 border-gray-300 bg-white px-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <span
                className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${provider.iconWrapperClassName}`}
                aria-hidden="true"
              >
                <Icon className={provider.iconClassName} />
              </span>
              <span className="flex-1 text-center pr-7">{provider.label}</span>
            </Button>
          );
        })}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
            {dividerLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
