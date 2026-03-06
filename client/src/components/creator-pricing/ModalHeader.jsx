export function ModalHeader({ monthlyPrice, referralName = 'Exclusive Access' }) {
  return (
    <header className="px-6 pb-2 pt-6 text-center sm:px-8 sm:pt-7">
      <div className="inline-flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-gray-900 text-sm font-bold text-white">
          M
        </span>
        <span className="text-lg font-semibold tracking-tight text-gray-900">makteb</span>
      </div>

      <h2 className="mt-4 text-2xl font-bold text-gray-900 sm:text-[2rem]">Create your community</h2>
      <p className="mt-1 text-base text-gray-600">
        Free for 14 days, then ${monthlyPrice}/month. Cancel anytime.
      </p>
      <p className="mt-3 text-sm text-gray-500">
        You were referred by <span className="font-medium text-gray-700">{referralName}</span>
      </p>
    </header>
  );
}
