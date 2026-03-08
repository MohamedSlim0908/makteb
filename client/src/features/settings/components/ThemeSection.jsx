import { Card } from '../../../components/ui/Card';

export function ThemeSection({ theme, onThemeChange, onSaveTheme }) {
  return (
    <Card className="p-6">
      <h1 className="text-3xl font-semibold text-gray-900">Theme</h1>
      <div className="mt-6">
        <label className="block text-sm text-gray-500 mb-1">Theme</label>
        <select
          value={theme}
          onChange={(e) => onThemeChange(e.target.value)}
          className="w-full h-12 rounded-md border border-gray-300 px-3 text-lg text-gray-700 bg-white"
        >
          <option>Light (default)</option>
          <option>Dark</option>
          <option>System</option>
        </select>
      </div>

      <button
        type="button"
        onClick={onSaveTheme}
        className="mt-6 h-12 w-full rounded-md bg-[#f0c96b] text-gray-900 font-bold"
      >
        SAVE
      </button>
    </Card>
  );
}
