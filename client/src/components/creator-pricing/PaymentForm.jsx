import { CreditCard } from 'lucide-react';

export function PaymentForm({
  cardNumber,
  expiry,
  cvc,
  onCardNumberChange,
  onExpiryChange,
  onCvcChange,
}) {
  return (
    <div className="mt-5">
      <div className="flex h-12 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 transition-colors focus-within:border-primary-400 focus-within:bg-white">
        <CreditCard className="h-4 w-4 shrink-0 text-gray-400" />

        <input
          type="text"
          inputMode="numeric"
          placeholder="Card number"
          aria-label="Card number"
          value={cardNumber}
          onChange={(event) => onCardNumberChange(event.target.value)}
          className="min-w-0 flex-1 border-0 bg-transparent text-base text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />

        <input
          type="text"
          inputMode="numeric"
          placeholder="MM / YY"
          aria-label="Expiry date"
          value={expiry}
          onChange={(event) => onExpiryChange(event.target.value)}
          className="w-[82px] border-0 bg-transparent text-base text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />

        <input
          type="text"
          inputMode="numeric"
          placeholder="CVC"
          aria-label="CVC"
          value={cvc}
          onChange={(event) => onCvcChange(event.target.value)}
          className="w-[54px] border-0 bg-transparent text-base text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />
      </div>
    </div>
  );
}
