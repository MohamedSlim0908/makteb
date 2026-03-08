import { X, CreditCard, Loader2, AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { useInitiatePayment } from '../../features/payments/useInitiatePayment';

// TODO: wire onSuccess callback after payment verification flow is implemented
export function PaymentModal({ isOpen, onClose, type, referenceId, amount, itemName, onSuccess: _onSuccess }) {
  const initPayment = useInitiatePayment();

  if (!isOpen) return null;

  async function handlePay() {
    try {
      const { data } = await initPayment.mutateAsync({ type, referenceId, amount });
      // Store paymentId for verification after return from Flouci
      sessionStorage.setItem('pendingPaymentId', data.paymentId);
      sessionStorage.setItem('pendingPaymentReturn', window.location.pathname);
      // Redirect to Flouci external payment page
      window.location.href = data.paymentUrl;
    } catch {
      // Error state is handled by the mutation — displayed below
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-white rounded-xl border border-gray-200 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-0">
          <h2 className="text-lg font-bold text-gray-900">Complete your purchase</h2>
          <button
            onClick={onClose}
            disabled={initPayment.isPending}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {/* Item summary */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-sm font-medium text-gray-500">Item</p>
            <p className="text-base font-semibold text-gray-900 mt-1">{itemName}</p>
            <div className="flex items-baseline gap-1 mt-3">
              <span className="text-2xl font-bold text-gray-900">{amount}</span>
              <span className="text-sm font-medium text-gray-500">TND</span>
            </div>
          </div>

          {/* Error message */}
          {initPayment.isError && (
            <div className="flex items-start gap-2.5 mt-4 p-3 bg-red-50 border border-red-100 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Payment initiation failed</p>
                <p className="text-xs text-red-600 mt-0.5">
                  {initPayment.error?.response?.data?.message || 'Something went wrong. Please try again.'}
                </p>
              </div>
            </div>
          )}

          {/* Payment info */}
          <p className="text-xs text-gray-400 mt-4 text-center">
            You will be redirected to Flouci to complete payment securely.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex flex-col gap-2">
          <Button
            size="lg"
            onClick={handlePay}
            isLoading={initPayment.isPending}
            className="w-full"
          >
            {!initPayment.isPending && <CreditCard className="w-4 h-4" />}
            {initPayment.isPending ? 'Redirecting...' : 'Pay with Flouci'}
          </Button>
          <Button
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={initPayment.isPending}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
