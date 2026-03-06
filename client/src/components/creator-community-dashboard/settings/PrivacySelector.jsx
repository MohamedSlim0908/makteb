import { Globe2, Lock } from 'lucide-react';

const OPTIONS = [
  {
    value: 'private',
    label: 'Private',
    description: 'Only members can see the community content.',
    Icon: Lock,
  },
  {
    value: 'public',
    label: 'Public',
    description: 'Anyone can view posts and members.',
    Icon: Globe2,
  },
];

export function PrivacySelector({ value, onChange }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-gray-700">Privacy settings</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {OPTIONS.map((option) => {
          const selected = value === option.value;
          const Icon = option.Icon;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                selected
                  ? 'border-primary-500 bg-primary-50/60'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                    selected ? 'border-primary-500' : 'border-gray-300'
                  }`}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${selected ? 'bg-primary-600' : ''}`} />
                </span>
                <Icon className="h-4 w-4 text-gray-700" />
                <span className="text-lg font-semibold text-gray-900">{option.label}</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">{option.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
