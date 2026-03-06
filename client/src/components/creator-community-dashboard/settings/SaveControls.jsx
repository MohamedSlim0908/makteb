export function SaveControls({ onCancel }) {
  return (
    <div className="flex items-center justify-end gap-2 pt-2">
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-200 px-5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        className="inline-flex h-11 items-center justify-center rounded-lg bg-primary-600 px-5 text-sm font-semibold text-white hover:bg-primary-700"
      >
        Save changes
      </button>
    </div>
  );
}
