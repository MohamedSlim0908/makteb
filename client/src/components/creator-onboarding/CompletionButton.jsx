export function CompletionButton({ disabled, isSubmitting, children }) {
  return (
    <button
      type="submit"
      disabled={disabled || isSubmitting}
      className={`mt-4 inline-flex h-12 w-full items-center justify-center rounded-xl text-sm font-bold tracking-wide transition-all ${
        disabled || isSubmitting
          ? 'cursor-not-allowed bg-gray-200 text-gray-500'
          : 'bg-primary-600 text-white shadow-[0_10px_24px_rgba(37,99,235,0.26)] hover:bg-primary-700 active:scale-[0.99]'
      }`}
    >
      {isSubmitting ? 'SAVING...' : children}
    </button>
  );
}
