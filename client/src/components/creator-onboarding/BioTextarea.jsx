export function BioTextarea({ value, onChange, maxLength = 150 }) {
  return (
    <div className="mt-5">
      <label htmlFor="creator-bio" className="sr-only">
        Bio
      </label>
      <textarea
        id="creator-bio"
        value={value}
        onChange={(event) => onChange(event.target.value.slice(0, maxLength))}
        placeholder="Add your bio..."
        className="min-h-[120px] w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100"
      />
      <p className="mt-2 text-right text-xs text-gray-500">
        {value.length} / {maxLength}
      </p>
    </div>
  );
}
