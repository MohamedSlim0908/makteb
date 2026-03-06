export function DescriptionTextarea({ value, onChange, maxLength = 150 }) {
  return (
    <div className="space-y-1">
      <label htmlFor="settings-description" className="text-sm font-semibold text-gray-700">
        Group description
      </label>
      <textarea
        id="settings-description"
        maxLength={maxLength}
        value={value}
        onChange={(event) => onChange(event.target.value.slice(0, maxLength))}
        placeholder="Describe your community"
        className="min-h-[120px] w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100"
      />
      <p className="text-right text-xs text-gray-500">
        {value.length}/{maxLength}
      </p>
    </div>
  );
}
