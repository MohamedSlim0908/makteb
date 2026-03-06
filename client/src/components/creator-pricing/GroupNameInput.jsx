export function GroupNameInput({ value, onChange, maxLength = 30 }) {
  const charCount = value.length;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor="group-name" className="text-sm font-semibold text-gray-900">
          Group name
        </label>
      </div>

      <input
        id="group-name"
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value.slice(0, maxLength))}
        maxLength={maxLength}
        placeholder="Small Business Konnect"
        className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-base text-gray-900 placeholder:text-gray-400 focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100"
      />

      <div className="mt-2 flex items-center justify-end text-xs">
        <p className="text-gray-500">
          {charCount} / {maxLength}
        </p>
      </div>
    </div>
  );
}
