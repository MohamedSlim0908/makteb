import { Settings as SettingsIcon } from 'lucide-react';
import { Card } from '../../../components/ui/Card';

export function PayoutsSection({ payoutSettings, onPayoutSettingsClick }) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Payouts</h1>
          <p className="mt-2 text-lg text-gray-500">Payouts for community and affiliate earnings.</p>
        </div>
        <button type="button" onClick={onPayoutSettingsClick} className="text-gray-400 hover:text-gray-500">
          <SettingsIcon className="w-5 h-5" />
        </button>
      </div>
      <p className="mt-8 text-lg text-gray-500">No payouts yet</p>
      <div className="mt-6 rounded-xl border border-gray-200 p-4 space-y-2">
        <h2 className="text-lg font-semibold text-gray-900">Payout destination</h2>
        <p className="text-sm text-gray-500">Method: {payoutSettings.method || 'Not set'}</p>
        <p className="text-sm text-gray-500">Destination: {payoutSettings.destination || 'Not set'}</p>
      </div>
    </Card>
  );
}
