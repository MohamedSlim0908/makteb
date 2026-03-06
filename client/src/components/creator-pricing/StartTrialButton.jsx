export function StartTrialButton({ disabled, children }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className={`mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl text-sm font-bold tracking-wide transition-all ${
        disabled
          ? 'cursor-not-allowed bg-gray-200 text-gray-500'
          : 'border border-[#d8ad45] bg-[#e8c569] text-gray-900 shadow-[0_8px_22px_rgba(193,153,60,0.22)] hover:bg-[#e1bc59] active:scale-[0.99]'
      }`}
    >
      {children}
    </button>
  );
}
