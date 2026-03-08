import { Settings as SettingsIcon } from 'lucide-react';
import { Card } from '../../../components/ui/Card';

export function PaymentHistorySection({ payments, onRefresh }) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <h1 className="text-3xl font-semibold text-gray-900">Payment history</h1>
        <button type="button" onClick={onRefresh} className="text-gray-400 hover:text-gray-500">
          <SettingsIcon className="w-5 h-5" />
        </button>
      </div>

      {payments.length > 0 ? (
        <div className="mt-10 space-y-4 text-lg">
          {payments.map((payment) => (
            <div key={payment.id}>
              <span className="text-primary-600">
                {new Date(payment.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              <span className="text-gray-700">
                {' '}— ${Number(payment.amount || 0).toFixed(2)} for {payment.type.toLowerCase()} payment
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-10 text-lg text-gray-500">No payments yet.</p>
      )}
    </Card>
  );
}
