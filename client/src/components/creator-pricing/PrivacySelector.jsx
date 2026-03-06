import { Globe, Lock } from 'lucide-react';

const PRIVACY_OPTIONS = [
  {
    id: 'private',
    label: 'Private',
    Icon: Lock,
    description:
      "Only members can see who's in the group and what they post. Content is hidden from search engines.",
  },
  {
    id: 'public',
    label: 'Public',
    Icon: Globe,
    description:
      "Anyone can see who's in the group and what they post. Content is discoverable by search engines.",
  },
];

export function PrivacySelector({ value, onChange }) {
  return (
    <div className="mt-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {PRIVACY_OPTIONS.map((option) => {
          const selected = option.id === value;
          const Icon = option.Icon;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={`rounded-xl border p-3 text-left transition-all ${
                selected
                  ? 'border-primary-500 bg-primary-50/60 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.16)]'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                    selected ? 'border-primary-500' : 'border-gray-300'
                  }`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      selected ? 'bg-primary-600' : 'bg-transparent'
                    }`}
                  />
                </span>

                <Icon className="h-4 w-4 text-gray-700" />
                <span className="text-lg font-semibold text-gray-900">{option.label}</span>
              </div>

              <p className="mt-2 text-sm leading-relaxed text-gray-600">{option.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
