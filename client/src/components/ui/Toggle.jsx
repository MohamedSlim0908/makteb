export function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-emerald-200' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-6 w-6 rounded-full transition-transform ${
          checked ? 'translate-x-5 bg-emerald-600' : 'translate-x-0 bg-gray-500'
        }`}
      />
    </button>
  );
}
