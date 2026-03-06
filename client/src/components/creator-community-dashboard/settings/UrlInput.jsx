export function UrlInput({ value }) {
  return (
    <div className="space-y-1">
      <label htmlFor="settings-url" className="text-sm font-semibold text-gray-700">
        URL
      </label>
      <input
        id="settings-url"
        type="text"
        readOnly
        value={value}
        className="h-12 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-base text-gray-500"
      />
      <p className="text-xs text-gray-500">
        You can change your URL with a paid account.{' '}
        <button type="button" className="font-semibold text-primary-600 hover:text-primary-700">
          Upgrade now?
        </button>
      </p>
    </div>
  );
}
