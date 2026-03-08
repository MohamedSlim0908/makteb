import { useEffect, useMemo, useState } from 'react';
import { ModalHeader } from './ModalHeader';
import { GroupNameInput } from './GroupNameInput';
import { PrivacySelector } from './PrivacySelector';
import { PaymentForm } from './PaymentForm';
import { StartTrialButton } from './StartTrialButton';
import { ModalFooter } from './ModalFooter';

function formatCardNumber(rawValue) {
  const digits = rawValue.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiry(rawValue) {
  const digits = rawValue.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
}

function formatCvc(rawValue) {
  return rawValue.replace(/\D/g, '').slice(0, 4);
}

function toOrdinal(day) {
  if (day > 3 && day < 21) return `${day}th`;
  switch (day % 10) {
    case 1: return `${day}st`;
    case 2: return `${day}nd`;
    case 3: return `${day}rd`;
    default: return `${day}th`;
  }
}

function getTrialChargeDate() {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  const month = date.toLocaleDateString(undefined, { month: 'long' });
  const day = toOrdinal(date.getDate());
  return `${month} ${day}`;
}

function isValidExpiry(expiry) {
  const match = expiry.match(/^(\d{2}) \/ (\d{2})$/);
  if (!match) return false;

  const month = Number(match[1]);
  const year = Number(match[2]);
  if (month < 1 || month > 12) return false;

  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;

  return true;
}

export function CreateCommunityModal({ isOpen, plan, onClose, onSubmit }) {
  const [groupName, setGroupName] = useState('');
  const [privacyType, setPrivacyType] = useState('private');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const [prevResetKey, setPrevResetKey] = useState(`${isOpen}-${plan?.id}`);
  const currentResetKey = `${isOpen}-${plan?.id}`;
  if (currentResetKey !== prevResetKey) {
    setPrevResetKey(currentResetKey);
    if (isOpen) {
      setGroupName('');
      setPrivacyType('private');
      setCardNumber('');
      setExpiry('');
      setCvc('');
    }
  }

  const chargeDateText = useMemo(() => getTrialChargeDate(), []);

  const groupNameValid = groupName.trim().length > 0;
  const cardDigits = cardNumber.replace(/\s/g, '');
  const cardValid = cardDigits.length >= 12;
  const expiryValid = isValidExpiry(expiry);
  const cvcValid = cvc.length >= 3;
  const isFormValid = groupNameValid && cardValid && expiryValid && cvcValid;

  if (!isOpen || !plan) return null;

  function handleSubmit(event) {
    event.preventDefault();
    if (!isFormValid) return;

    onSubmit({
      plan,
      groupName: groupName.trim(),
      privacyType,
      cardNumber,
      expiry,
      cvc,
    });
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-[1px] animate-fade-in"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Create your community signup"
        className="w-full max-w-[440px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-modal animate-scale-in"
      >
        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-0 sm:px-7">
          <ModalHeader monthlyPrice={plan.price} />

          <div className="mt-4">
            <GroupNameInput value={groupName} onChange={setGroupName} maxLength={30} />
          </div>

          <PrivacySelector value={privacyType} onChange={setPrivacyType} />

          <PaymentForm
            cardNumber={cardNumber}
            expiry={expiry}
            cvc={cvc}
            onCardNumberChange={(value) => setCardNumber(formatCardNumber(value))}
            onExpiryChange={(value) => setExpiry(formatExpiry(value))}
            onCvcChange={(value) => setCvc(formatCvc(value))}
          />

          <ModalFooter chargeDateText={chargeDateText} planPrice={plan.price} />

          <StartTrialButton disabled={!isFormValid}>START FREE TRIAL</StartTrialButton>
        </form>
      </div>
    </div>
  );
}
