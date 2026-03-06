export function GroupNameInput({ value, onChange, maxLength = 30 }) {
  return (
    <div className="space-y-1">
      <label htmlFor="settings-group-name" className="text-sm font-semibold text-gray-700">
        Group name
      </label>
      <input
        id="settings-group-name"
        type="text"
        maxLength={maxLength}
        value={value}
        onChange={(event) => onChange(event.target.value.slice(0, maxLength))}
        className="h-12 w-full rounded-lg border border-gray-200 bg-white px-3 text-base text-gray-900 focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100"
      />
      <p className="text-right text-xs text-gray-500">
        {value.length}/{maxLength}
      </p>
    </div>
  );
}
