export function ModalFooter({ chargeDateText, planPrice }) {
  return (
    <p className="mt-5 text-center text-xs leading-relaxed text-gray-500">
      Your first charge will be on {chargeDateText} for ${planPrice}. Cancel anytime with 1-click.
      By clicking below, you accept our{' '}
      <button type="button" className="text-primary-600 hover:text-primary-700">
        terms
      </button>
      .
    </p>
  );
}
