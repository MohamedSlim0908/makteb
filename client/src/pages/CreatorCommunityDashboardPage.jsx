import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CommunityDashboard } from '../components/creator-community-dashboard/CommunityDashboard';
import { CompleteProfileModal } from '../components/creator-onboarding/CompleteProfileModal';

function toStorageKey(groupName) {
  return `creator-profile-complete-${groupName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

function toGroupSlug(groupName) {
  return groupName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toInitials(groupName) {
  return groupName
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function CreatorCommunityDashboardPage() {
  const [searchParams] = useSearchParams();
  const groupName = searchParams.get('groupName') || 'Small Business Konnect';
  const privacy = (searchParams.get('privacy') || 'private').toLowerCase();
  const isPrivate = privacy !== 'public';
  const groupSlug = toGroupSlug(groupName);

  const initialCommunityData = useMemo(
    () => ({
      name: groupName,
      url: `skool.com/${groupSlug || 'small-business-konnect'}-9944`,
      privacyType: isPrivate ? 'private' : 'public',
      description: 'Add your group description here by clicking the Settings button.',
      stats: { members: 1, online: 0, admins: 1 },
      avatarInitials: toInitials(groupName) || 'SB',
      avatarColor: '#767676',
      iconImage: '',
      coverImage: '',
    }),
    [groupName, groupSlug, isPrivate]
  );

  const initialPosts = useMemo(() => [], []);

  const localStorageKey = useMemo(() => toStorageKey(groupName), [groupName]);
  const hasCompletedProfile =
    typeof window !== 'undefined' && window.localStorage.getItem(localStorageKey) === 'true';
  const shouldShowOnboarding = searchParams.get('onboarding') === '1' && !hasCompletedProfile;
  const [isModalOpen, setIsModalOpen] = useState(shouldShowOnboarding);

  function handleCompleteProfile() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(localStorageKey, 'true');
    }
    setIsModalOpen(false);
  }

  return (
    <div className="relative">
      <CommunityDashboard
        initialCommunityData={initialCommunityData}
        initialPosts={initialPosts}
      />

      <CompleteProfileModal
        isOpen={isModalOpen}
        allowSkip={false}
        onClose={() => setIsModalOpen(false)}
        onComplete={handleCompleteProfile}
      />
    </div>
  );
}
