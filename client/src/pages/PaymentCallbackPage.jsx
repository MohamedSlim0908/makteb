import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useVerifyPayment } from '../features/payments/useVerifyPayment';

export function PaymentCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const verifyPayment = useVerifyPayment();
  const [status, setStatus] = useState('verifying'); // verifying | success | failed

  useEffect(() => {
    // paymentId can come from the Flouci redirect query param or from sessionStorage
    const paymentId =
      searchParams.get('paymentId') || sessionStorage.getItem('pendingPaymentId');
    const returnPath = sessionStorage.getItem('pendingPaymentReturn') || '/discover';

    if (!paymentId) {
      setStatus('failed');
      return;
    }

    verifyPayment.mutate(paymentId, {
      onSuccess: (res) => {
        const paymentStatus = res.data.status;
        if (paymentStatus === 'COMPLETED' || paymentStatus === 'SUCCEEDED') {
          setStatus('success');
          sessionStorage.removeItem('pendingPaymentId');
          sessionStorage.removeItem('pendingPaymentReturn');
          setTimeout(() => navigate(returnPath), 3000);
        } else {
          setStatus('failed');
        }
      },
      onError: () => setStatus('failed'),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-white flex items-center justify-center">
      <div className="max-w-sm w-full mx-4 text-center">
        {status === 'verifying' && (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 text-gray-400 animate-spin mx-auto" />
            <h1 className="text-xl font-bold text-gray-900">Verifying your payment...</h1>
            <p className="text-sm text-gray-500">Please wait while we confirm your transaction.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Payment successful!</h1>
            <p className="text-sm text-gray-500">You will be redirected shortly...</p>
            <Button variant="outline" onClick={() => navigate(sessionStorage.getItem('pendingPaymentReturn') || '/discover')}>
              Go back now
            </Button>
          </div>
        )}

        {status === 'failed' && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Payment failed</h1>
            <p className="text-sm text-gray-500">
              Your payment could not be verified. No charge was made. Please try again.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => navigate(sessionStorage.getItem('pendingPaymentReturn') || '/discover')}>
                Go back
              </Button>
              <Button variant="ghost" onClick={() => navigate('/discover')}>
                Browse courses
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
