import { Card } from '../../../components/ui/Card';

export function PaymentMethodsSection({ paymentMethods, onAddPaymentMethod, onRemovePaymentMethod }) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-3xl font-semibold text-gray-900">Payment methods</h1>
        <button
          type="button"
          onClick={onAddPaymentMethod}
          className="h-12 px-8 rounded-md border border-[#eac76a] bg-[#f0c96b] text-gray-800 font-bold"
        >
          ADD PAYMENT METHOD
        </button>
      </div>

      {paymentMethods.length > 0 ? (
        <div className="mt-10 space-y-4">
          {paymentMethods.map((method) => (
            <div key={method.id} className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-gray-900">{method.brand} •••• {method.last4}</p>
                <p className="mt-2 text-lg text-gray-800">Expires: {method.expiry}</p>
              </div>
              <button
                type="button"
                onClick={() => onRemovePaymentMethod(method.id)}
                className="h-12 w-12 rounded-md border border-gray-300 text-gray-400 text-2xl"
                aria-label={`Remove ${method.brand} ending ${method.last4}`}
              >
                •••
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-10 text-lg text-gray-500">No payment methods saved.</p>
      )}
    </Card>
  );
}
