import { ChevronDown } from 'lucide-react';
import { CoverUploader } from './CoverUploader';
import { DescriptionTextarea } from './DescriptionTextarea';
import { GroupNameInput } from './GroupNameInput';
import { IconUploader } from './IconUploader';
import { PrivacySelector } from './PrivacySelector';
import { SaveControls } from './SaveControls';
import { UrlInput } from './UrlInput';

const COLOR_OPTIONS = ['#767676', '#2563eb', '#0891b2', '#15803d', '#7c2d12', '#be123c', '#6d28d9'];

export function GeneralSettings({ settings, onChange, onCancel }) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onChange.commit();
      }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <IconUploader iconImage={settings.iconImage} onUpload={onChange.iconImage} />
        <CoverUploader coverImage={settings.coverImage} onUpload={onChange.coverImage} />
      </div>

      <GroupNameInput value={settings.communityName} onChange={onChange.communityName} />
      <UrlInput value={settings.communityUrl} />
      <DescriptionTextarea value={settings.description} onChange={onChange.description} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="settings-initials" className="text-sm font-semibold text-gray-700">
            Initials
          </label>
          <input
            id="settings-initials"
            type="text"
            maxLength={3}
            value={settings.avatarInitials}
            onChange={(event) => onChange.avatarInitials(event.target.value.toUpperCase())}
            className="h-12 w-full rounded-lg border border-gray-200 bg-white px-3 text-base text-gray-900 focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="settings-color" className="text-sm font-semibold text-gray-700">
            Color
          </label>
          <div className="relative">
            <select
              id="settings-color"
              value={settings.avatarColor}
              onChange={(event) => onChange.avatarColor(event.target.value)}
              className="h-12 w-full appearance-none rounded-lg border border-gray-200 bg-white pl-12 pr-9 text-base text-gray-900 focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100"
            >
              {COLOR_OPTIONS.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
            <span
              className="pointer-events-none absolute left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-md border border-gray-300"
              style={{ backgroundColor: settings.avatarColor }}
            />
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      <PrivacySelector value={settings.privacyType} onChange={onChange.privacyType} />
      <SaveControls onCancel={onCancel} />
    </form>
  );
}
