import { ChevronDown, MapPin } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { getInitials } from '../settingsConstants';

export function ProfileSection({
  user,
  firstName,
  lastName,
  bio,
  location,
  myersBriggs,
  socialLinks,
  membershipVisibility,
  profilePanelOpen,
  isPending,
  onFirstNameChange,
  onLastNameChange,
  onBioChange,
  onLocationChange,
  onMyersBriggsChange,
  onSocialLinksChange,
  onMembershipVisibilityChange,
  onChangeProfilePhoto,
  onSaveName,
  onSaveProfile,
  onChangeMapLocation,
  onRemoveMapLocation,
  onTogglePanel,
  onResetLocalProfileSettings,
}) {
  const profileUrl = '';

  return (
    <Card className="p-6 space-y-6">
      <h1 className="text-3xl font-semibold text-gray-900">Profile</h1>

      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-full overflow-hidden border border-gray-200">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gray-900 text-white flex items-center justify-center text-xl font-bold">
              {getInitials(user.name)}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onChangeProfilePhoto}
          className="text-primary-600 font-semibold hover:text-primary-700 disabled:opacity-60"
          disabled={isPending}
        >
          Change profile photo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">First Name</label>
          <input
            value={firstName}
            onChange={(e) => onFirstNameChange(e.target.value)}
            className="w-full h-12 rounded-md border border-gray-300 px-3 text-gray-700"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Last Name</label>
          <input
            value={lastName}
            onChange={(e) => onLastNameChange(e.target.value)}
            className="w-full h-12 rounded-md border border-gray-300 px-3 text-gray-700"
          />
        </div>
      </div>
      <p className="text-sm text-gray-500">
        You can only change your name once, and you must use your real name.{' '}
        <button
          type="button"
          onClick={onSaveName}
          className="text-primary-600 hover:text-primary-700 disabled:opacity-60"
          disabled={isPending}
        >
          Change name.
        </button>
      </p>

      <div>
        <label className="block text-xs text-gray-400 mb-1">URL</label>
        <input
          value={profileUrl}
          readOnly
          placeholder="No public profile URL yet"
          className="w-full h-12 rounded-md border border-gray-300 px-3 text-gray-400 bg-gray-50"
        />
      </div>
      <p className="text-sm text-gray-500">
        Public profile URLs are not configured for this account yet.
      </p>

      <div>
        <label className="block text-xs text-gray-400 mb-1">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => onBioChange(e.target.value.slice(0, 150))}
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-700 resize-none"
        />
        <p className="text-right text-sm text-gray-500 mt-1">{bio.length} / 150</p>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">Location</label>
        <input
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
          placeholder="Location"
          className="w-full h-12 rounded-md border border-gray-300 px-3 text-gray-700"
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={onChangeMapLocation}
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
        >
          <MapPin className="w-4 h-4" />
          Change my map location
        </button>
        <button type="button" onClick={onRemoveMapLocation} className="text-gray-400 hover:text-gray-500">
          Remove my map location
        </button>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">Myers Briggs</label>
        <select
          value={myersBriggs}
          onChange={(e) => onMyersBriggsChange(e.target.value)}
          className="w-full h-12 rounded-md border border-gray-300 px-3 text-gray-700 bg-white"
        >
          <option>Don&apos;t show</option>
          <option>INTJ</option>
          <option>INFJ</option>
          <option>ENTP</option>
          <option>ESFP</option>
        </select>
      </div>

      <div className="space-y-6">
        <div>
          <button
            type="button"
            onClick={() => onTogglePanel('social')}
            className="inline-flex items-center gap-2 text-lg font-semibold text-gray-900"
          >
            Social links
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${profilePanelOpen.social ? 'rotate-180' : ''}`} />
          </button>
          {profilePanelOpen.social && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                value={socialLinks.website || ''}
                onChange={(e) => onSocialLinksChange((current) => ({ ...current, website: e.target.value }))}
                placeholder="Website URL"
                className="h-11 rounded-md border border-gray-300 px-3 text-sm text-gray-700"
              />
              <input
                value={socialLinks.x || ''}
                onChange={(e) => onSocialLinksChange((current) => ({ ...current, x: e.target.value }))}
                placeholder="X username"
                className="h-11 rounded-md border border-gray-300 px-3 text-sm text-gray-700"
              />
              <input
                value={socialLinks.youtube || ''}
                onChange={(e) => onSocialLinksChange((current) => ({ ...current, youtube: e.target.value }))}
                placeholder="YouTube URL"
                className="h-11 rounded-md border border-gray-300 px-3 text-sm text-gray-700"
              />
            </div>
          )}
        </div>

        <div>
          <button
            type="button"
            onClick={() => onTogglePanel('membership')}
            className="inline-flex items-center gap-2 text-lg font-semibold text-gray-900"
          >
            Membership visibility
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${profilePanelOpen.membership ? 'rotate-180' : ''}`} />
          </button>
          {profilePanelOpen.membership && (
            <div className="mt-3">
              <select
                value={membershipVisibility}
                onChange={(e) => onMembershipVisibilityChange(e.target.value)}
                className="h-11 rounded-md border border-gray-300 px-3 text-sm text-gray-700 bg-white"
              >
                <option>Public</option>
                <option>Private</option>
              </select>
            </div>
          )}
        </div>

        <div>
          <button
            type="button"
            onClick={() => onTogglePanel('advanced')}
            className="inline-flex items-center gap-2 text-lg font-semibold text-gray-900"
          >
            Advanced
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${profilePanelOpen.advanced ? 'rotate-180' : ''}`} />
          </button>
          {profilePanelOpen.advanced && (
            <div className="mt-3">
              <button
                type="button"
                onClick={onResetLocalProfileSettings}
                className="h-11 rounded-md border border-gray-300 px-4 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                RESET LOCAL PROFILE SETTINGS
              </button>
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onSaveProfile}
        disabled={isPending}
        className="h-12 w-full rounded-md bg-[#f0c96b] text-gray-900 font-bold disabled:opacity-60"
      >
        {isPending ? 'SAVING...' : 'SAVE PROFILE'}
      </button>
    </Card>
  );
}
