import { Check, X } from 'lucide-react';

export function FeatureItem({ label, included }) {
  return (
    <li className="flex items-center gap-3">
      <span
        className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          included ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
        }`}
      >
        {included ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      </span>
      <span className={`text-[15px] ${included ? 'text-gray-700' : 'text-gray-500'}`}>
        {label}
      </span>
    </li>
  );
}
