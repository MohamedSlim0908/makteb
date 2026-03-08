import { useEffect, useState } from 'react';
import { GeneralSettings } from './GeneralSettings';
import { SettingsHeader } from './SettingsHeader';
import { SettingsSidebar, SETTINGS_SECTION_OPTIONS } from './SettingsSidebar';

function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function CommunitySettingsModal({ isOpen, community, onClose, onSave }) {
  const [activeSection, setActiveSection] = useState('General');
  const [communityName, setCommunityName] = useState(community?.name || '');
  const [communityUrl, setCommunityUrl] = useState(community?.url || '');
  const [description, setDescription] = useState(community?.description || '');
  const [privacyType, setPrivacyType] = useState(community?.privacyType || 'private');
  const [iconImage, setIconImage] = useState(community?.iconImage || '');
  const [coverImage, setCoverImage] = useState(community?.coverImage || '');
  const [avatarInitials, setAvatarInitials] = useState(community?.avatarInitials || 'SB');
  const [avatarColor, setAvatarColor] = useState(community?.avatarColor || '#767676');

  const [prevKey, setPrevKey] = useState(`${isOpen}-${community?.id}`);
  const currentKey = `${isOpen}-${community?.id}`;
  if (currentKey !== prevKey) {
    setPrevKey(currentKey);
    if (isOpen && community) {
      setCommunityName(community.name || '');
      setCommunityUrl(community.url || '');
      setDescription(community.description || '');
      setPrivacyType(community.privacyType || 'private');
      setIconImage(community.iconImage || '');
      setCoverImage(community.coverImage || '');
      setAvatarInitials(community.avatarInitials || 'SB');
      setAvatarColor(community.avatarColor || '#767676');
      setActiveSection('General');
    }
  }

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !community) return null;

  const settingsState = {
    communityName,
    communityUrl,
    description,
    privacyType,
    iconImage,
    coverImage,
    avatarInitials,
    avatarColor,
  };

  const settingsChangeHandlers = {
    communityName: setCommunityName,
    communityUrl: setCommunityUrl,
    description: setDescription,
    privacyType: setPrivacyType,
    avatarInitials: setAvatarInitials,
    avatarColor: setAvatarColor,
    iconImage: async (file) => {
      const next = await toDataUrl(file);
      setIconImage(next);
    },
    coverImage: async (file) => {
      const next = await toDataUrl(file);
      setCoverImage(next);
    },
    commit: () => {
      onSave({
        ...community,
        name: communityName.trim() || community.name,
        url: communityUrl,
        description,
        privacyType,
        iconImage,
        coverImage,
        avatarInitials: avatarInitials.trim() || 'SB',
        avatarColor,
      });
      onClose();
    },
  };

  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center bg-black/55 px-3 py-5 animate-fade-in"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="h-[90vh] w-full max-w-[980px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-modal">
        <SettingsHeader
          community={{
            ...community,
            name: communityName,
            iconImage,
            avatarInitials,
            avatarColor,
          }}
          onClose={onClose}
        />

        <div className="flex h-[calc(90vh-76px)] min-h-0">
          <aside className="hidden w-[250px] shrink-0 border-r border-gray-200 md:block">
            <SettingsSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
          </aside>

          <div className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="mb-4 md:hidden">
              <label htmlFor="settings-section" className="mb-1 block text-sm font-semibold text-gray-700">
                Section
              </label>
              <select
                id="settings-section"
                value={activeSection}
                onChange={(event) => setActiveSection(event.target.value)}
                className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900"
              >
                {SETTINGS_SECTION_OPTIONS.map((section) => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
              </select>
            </div>

            {activeSection === 'General' ? (
              <GeneralSettings
                settings={settingsState}
                onChange={settingsChangeHandlers}
                onCancel={onClose}
              />
            ) : (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                <h3 className="text-xl font-semibold text-gray-900">{activeSection}</h3>
                <p className="mt-2 text-sm text-gray-600">
                  This section will be available in the next settings iteration.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
