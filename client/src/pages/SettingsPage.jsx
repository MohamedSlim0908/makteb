import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { api, getErrorMessage } from '../lib/api';
import toast from 'react-hot-toast';

import {
  SETTINGS_SECTIONS,
  STORAGE_KEYS,
  DEFAULT_NOTIFICATION_SETTINGS,
  DEFAULT_SOCIAL_LINKS,
  DEFAULT_MYERS_BRIGGS,
  DEFAULT_MEMBERSHIP_VISIBILITY,
  COMMUNITY_NOTIFICATION_LEVELS,
  TIMEZONE_OPTIONS,
  isValidSettingsSection,
  readStoredObject,
  readStoredArray,
  splitName,
} from '../features/settings/settingsConstants';

import { CommunitiesSection } from '../features/settings/components/CommunitiesSection';
import { ProfileSection } from '../features/settings/components/ProfileSection';
import { AffiliatesSection } from '../features/settings/components/AffiliatesSection';
import { PayoutsSection } from '../features/settings/components/PayoutsSection';
import { AccountSection } from '../features/settings/components/AccountSection';
import { NotificationsSection } from '../features/settings/components/NotificationsSection';
import { ChatSection } from '../features/settings/components/ChatSection';
import { PaymentMethodsSection } from '../features/settings/components/PaymentMethodsSection';
import { PaymentHistorySection } from '../features/settings/components/PaymentHistorySection';
import { ThemeSection } from '../features/settings/components/ThemeSection';

export function SettingsPage() {
  const { user, fetchUser, logout } = useAuth();

  if (!user) return null;

  return <SettingsPageContent user={user} fetchUser={fetchUser} logout={logout} />;
}

function SettingsPageContent({ user, fetchUser, logout }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const activeSectionParam = searchParams.get('section');
  const activeSection = isValidSettingsSection(activeSectionParam) ? activeSectionParam : 'profile';

  function handleSectionChange(sectionId) {
    const next = new URLSearchParams(searchParams);
    if (sectionId === 'profile') {
      next.delete('section');
    } else {
      next.set('section', sectionId);
    }
    setSearchParams(next);
  }

  // ── State ──────────────────────────────────────────────────
  const initialName = splitName(user.name);
  const [firstName, setFirstName] = useState(initialName.first);
  const [lastName, setLastName] = useState(initialName.last);
  const [bio, setBio] = useState(user.bio || '');
  const [location, setLocation] = useState(() => localStorage.getItem(STORAGE_KEYS.location) || '');
  const [myersBriggs, setMyersBriggs] = useState(
    () => localStorage.getItem(STORAGE_KEYS.myersBriggs) || DEFAULT_MYERS_BRIGGS
  );
  const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE_KEYS.theme) || 'Light (default)');
  const [notificationSettings, setNotificationSettings] = useState(() =>
    readStoredObject(STORAGE_KEYS.notificationSettings, DEFAULT_NOTIFICATION_SETTINGS)
  );
  const [communityChatMode, setCommunityChatMode] = useState(() =>
    readStoredObject(STORAGE_KEYS.communityChatMode, {})
  );
  const [communityVisibility, setCommunityVisibility] = useState(() =>
    readStoredObject(STORAGE_KEYS.communityVisibility, {})
  );
  const [communityPinned, setCommunityPinned] = useState(() =>
    readStoredObject(STORAGE_KEYS.communityPinned, {})
  );
  const [communityNotificationMode, setCommunityNotificationMode] = useState(() =>
    readStoredObject(STORAGE_KEYS.communityNotificationMode, {})
  );
  const [socialLinks, setSocialLinks] = useState(() =>
    readStoredObject(STORAGE_KEYS.socialLinks, DEFAULT_SOCIAL_LINKS)
  );
  const [membershipVisibility, setMembershipVisibility] = useState(
    () => localStorage.getItem(STORAGE_KEYS.membershipVisibility) || DEFAULT_MEMBERSHIP_VISIBILITY
  );
  const [timezone, setTimezone] = useState(
    () =>
      localStorage.getItem(STORAGE_KEYS.timezone) ||
      TIMEZONE_OPTIONS.find((option) => option.value === Intl.DateTimeFormat().resolvedOptions().timeZone)?.value ||
      'UTC'
  );
  const [payoutSettings, setPayoutSettings] = useState(() =>
    readStoredObject(STORAGE_KEYS.payoutSettings, {
      method: '',
      destination: '',
    })
  );
  const [profilePanelOpen, setProfilePanelOpen] = useState({
    social: false,
    membership: false,
    advanced: false,
  });
  const [paymentMethods, setPaymentMethods] = useState(() => readStoredArray(STORAGE_KEYS.paymentMethods, []));

  // ── Sync user data ─────────────────────────────────────────
  useEffect(() => {
    const parsed = splitName(user.name);
    setFirstName(parsed.first);
    setLastName(parsed.last);
    setBio(user.bio || '');
  }, [user.name, user.bio]);

  // ── Queries ────────────────────────────────────────────────
  const { data: enrolledCourses = [] } = useQuery({
    queryKey: ['settings-enrolled-courses', user.id],
    queryFn: async () => {
      const { data } = await api.get('/courses/enrolled/me');
      return data.enrolledCourses ?? [];
    },
    enabled: Boolean(user?.id),
    staleTime: 60_000,
  });

  const { data: createdCommunities = [] } = useQuery({
    queryKey: ['settings-created-communities', user.id],
    queryFn: async () => {
      const { data } = await api.get('/communities?page=1&limit=100');
      const communities = data.communities ?? [];
      return communities.filter((community) => (community.creatorId ?? community.creator?.id) === user.id);
    },
    enabled: Boolean(user?.id),
    staleTime: 60_000,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['settings-payments', user.id],
    queryFn: async () => {
      const { data } = await api.get('/payments/my');
      return data.payments ?? [];
    },
    enabled: Boolean(user?.id),
    staleTime: 60_000,
  });

  // ── Mutations ──────────────────────────────────────────────
  const updateProfileMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.put('/auth/me', payload);
      return data.user;
    },
    onSuccess: async () => {
      await fetchUser();
      queryClient.invalidateQueries({ queryKey: ['settings-created-communities', user.id] });
      queryClient.invalidateQueries({ queryKey: ['settings-enrolled-courses', user.id] });
      toast.success('Profile updated');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to update profile'),
  });

  const updateEmailMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.put('/auth/email', payload);
      return data.user;
    },
    onSuccess: async () => {
      await fetchUser();
      toast.success('Email updated');
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Failed to update email')),
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.put('/auth/password', payload);
      return data;
    },
    onSuccess: () => {
      toast.success('Password updated');
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Failed to update password')),
  });

  // ── Computed ───────────────────────────────────────────────
  const communities = useMemo(() => {
    const byId = new Map();

    for (const community of createdCommunities) {
      byId.set(community.id, {
        id: community.id,
        name: community.name,
        slug: community.slug,
        coverImage: community.coverImage || '',
      });
    }

    for (const course of enrolledCourses) {
      const community = course.community;
      if (!community) continue;

      if (!byId.has(community.id)) {
        byId.set(community.id, {
          id: community.id,
          name: community.name,
          slug: community.slug,
          coverImage: community.coverImage || '',
        });
      }
    }

    return Array.from(byId.values());
  }, [createdCommunities, enrolledCourses]);

  // ── Effects — community defaults ───────────────────────────
  useEffect(() => {
    if (!communities.length) return;

    setCommunityChatMode((current) => {
      const next = { ...current };
      communities.forEach((community, idx) => {
        if (!next[community.id]) next[community.id] = idx === communities.length - 1 ? 'OFF' : 'ON';
      });
      return next;
    });

    setCommunityVisibility((current) => {
      const next = { ...current };
      communities.forEach((community) => {
        if (next[community.id] === undefined) next[community.id] = true;
      });
      return next;
    });

    setCommunityPinned((current) => {
      const next = { ...current };
      communities.forEach((community) => {
        if (next[community.id] === undefined) next[community.id] = false;
      });
      return next;
    });

    setCommunityNotificationMode((current) => {
      const next = { ...current };
      communities.forEach((community) => {
        if (!next[community.id]) next[community.id] = 'All';
      });
      return next;
    });
  }, [communities]);

  // ── Effects — localStorage sync ────────────────────────────
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.location, location); }, [location]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.notificationSettings, JSON.stringify(notificationSettings)); }, [notificationSettings]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.communityChatMode, JSON.stringify(communityChatMode)); }, [communityChatMode]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.communityVisibility, JSON.stringify(communityVisibility)); }, [communityVisibility]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.communityPinned, JSON.stringify(communityPinned)); }, [communityPinned]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.communityNotificationMode, JSON.stringify(communityNotificationMode)); }, [communityNotificationMode]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.socialLinks, JSON.stringify(socialLinks)); }, [socialLinks]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.myersBriggs, myersBriggs); }, [myersBriggs]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.membershipVisibility, membershipVisibility); }, [membershipVisibility]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.timezone, timezone); }, [timezone]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.paymentMethods, JSON.stringify(paymentMethods)); }, [paymentMethods]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.payoutSettings, JSON.stringify(payoutSettings)); }, [payoutSettings]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'Dark') {
      root.classList.add('dark');
      return;
    }
    if (theme === 'System') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
      return;
    }
    root.classList.remove('dark');
  }, [theme]);

  // ── Derived values ─────────────────────────────────────────
  const affiliateCommunity = createdCommunities[0] || communities[0] || null;
  const affiliateCommunityLabel = affiliateCommunity?.name || '';
  const affiliateUrl = affiliateCommunity ? `${window.location.origin}/community/${affiliateCommunity.slug}` : '';

  // ── Handlers ───────────────────────────────────────────────
  function copyAffiliateLink() {
    if (!affiliateUrl) {
      toast('No affiliate link available yet');
      return;
    }
    navigator.clipboard
      .writeText(affiliateUrl)
      .then(() => toast.success('Affiliate link copied'))
      .catch(() => toast.error('Could not copy link'));
  }

  async function saveProfileFields(nextFields) {
    await updateProfileMutation.mutateAsync(nextFields);
  }

  function handleChangeProfilePhoto() {
    const current = user.avatar || '';
    const next = window.prompt('Paste a new profile image URL:', current);
    if (next === null) return;
    const trimmed = next.trim();
    if (!trimmed) {
      toast.error('Image URL is required');
      return;
    }
    try {
      const parsed = new URL(trimmed);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
      void saveProfileFields({ avatar: parsed.toString() });
    } catch {
      toast.error('Please enter a valid image URL');
    }
  }

  function handleSaveName() {
    const fullName = `${firstName} ${lastName}`.trim();
    if (!fullName) {
      toast.error('Name cannot be empty');
      return;
    }
    if (fullName === user.name) {
      toast('Name is unchanged');
      return;
    }
    void saveProfileFields({ name: fullName });
  }

  function handleSaveProfile() {
    const fullName = `${firstName} ${lastName}`.trim();
    if (!fullName) {
      toast.error('Name cannot be empty');
      return;
    }
    const payload = { name: fullName, bio: bio.trim() };
    void saveProfileFields(payload);
  }

  function handleChangeMapLocation() {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported in this browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const value = `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`;
        setLocation(value);
        toast.success('Map location updated');
      },
      () => toast.error('Unable to get your current location')
    );
  }

  function handleRemoveMapLocation() {
    if (!location) {
      toast('No map location to remove');
      return;
    }
    setLocation('');
    toast.success('Map location removed');
  }

  function toggleProfilePanel(panelId) {
    setProfilePanelOpen((current) => ({ ...current, [panelId]: !current[panelId] }));
  }

  function handleResetLocalProfileSettings() {
    localStorage.removeItem(STORAGE_KEYS.location);
    localStorage.removeItem(STORAGE_KEYS.socialLinks);
    localStorage.removeItem(STORAGE_KEYS.membershipVisibility);
    localStorage.removeItem(STORAGE_KEYS.myersBriggs);
    setLocation('');
    setSocialLinks(DEFAULT_SOCIAL_LINKS);
    setMembershipVisibility(DEFAULT_MEMBERSHIP_VISIBILITY);
    setMyersBriggs(DEFAULT_MYERS_BRIGGS);
    toast.success('Advanced local profile settings reset');
  }

  function handleCommunityVisibilityToggle(community) {
    setCommunityVisibility((current) => {
      const isVisible = current[community.id] !== false;
      const next = { ...current, [community.id]: !isVisible };
      toast.success(`${community.name} ${!isVisible ? 'is now visible' : 'is now hidden'} in sidebar`);
      return next;
    });
  }

  function handleCommunityPinToggle(community) {
    setCommunityPinned((current) => {
      const pinned = Boolean(current[community.id]);
      const next = { ...current, [community.id]: !pinned };
      toast.success(`${community.name} ${!pinned ? 'pinned' : 'unpinned'}`);
      return next;
    });
  }

  function handleChangeEmail() {
    const next = window.prompt('Enter your new email address:', user.email || '');
    if (next === null) return;
    const email = next.trim().toLowerCase();
    if (!email) {
      toast.error('Email cannot be empty');
      return;
    }
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isValidEmail) {
      toast.error('Please enter a valid email');
      return;
    }
    if (email === user.email) {
      toast('Email is unchanged');
      return;
    }

    const currentPassword = window.prompt('Enter your current password to confirm this change:', '');
    if (currentPassword === null) return;
    if (!currentPassword.trim()) {
      toast.error('Current password is required');
      return;
    }

    void updateEmailMutation.mutateAsync({ email, currentPassword: currentPassword.trim() });
  }

  function handleChangePassword() {
    const currentPassword = window.prompt('Enter your current password:', '');
    if (currentPassword === null) return;
    if (!currentPassword.trim()) {
      toast.error('Current password is required');
      return;
    }

    const newPassword = window.prompt('Enter your new password (minimum 8 characters):', '');
    if (newPassword === null) return;
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }

    const confirmPassword = window.prompt('Confirm your new password:', '');
    if (confirmPassword === null) return;
    if (newPassword !== confirmPassword) {
      toast.error('Password confirmation does not match');
      return;
    }

    void updatePasswordMutation.mutateAsync({
      currentPassword: currentPassword.trim(),
      newPassword,
    });
  }

  async function handleLogoutEverywhere() {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  }

  function cycleCommunityNotificationMode(communityId) {
    setCommunityNotificationMode((current) => {
      const active = current[communityId] || COMMUNITY_NOTIFICATION_LEVELS[0];
      const currentIndex = COMMUNITY_NOTIFICATION_LEVELS.indexOf(active);
      const next = COMMUNITY_NOTIFICATION_LEVELS[(currentIndex + 1) % COMMUNITY_NOTIFICATION_LEVELS.length];
      return { ...current, [communityId]: next };
    });
  }

  function handleChatModeToggle(communityId) {
    setCommunityChatMode((current) => ({
      ...current,
      [communityId]: (current[communityId] || 'ON') === 'ON' ? 'OFF' : 'ON',
    }));
  }

  function handleAddPaymentMethod() {
    const brand = (window.prompt('Card brand:', '') || '').trim().toUpperCase();
    if (!brand) return;
    const last4 = (window.prompt('Last 4 digits:', '') || '').trim();
    if (!/^\d{4}$/.test(last4)) {
      toast.error('Last 4 digits must be exactly 4 numbers');
      return;
    }
    const expiry = (window.prompt('Expiry (MM/YYYY):', '') || '').trim();
    if (!/^\d{2}\/\d{4}$/.test(expiry)) {
      toast.error('Expiry must be in MM/YYYY format');
      return;
    }

    const nextMethod = { id: `pm-${Date.now()}`, brand, last4, expiry };
    setPaymentMethods((current) => [nextMethod, ...current]);
    toast.success('Payment method added');
  }

  function handleRemovePaymentMethod(methodId) {
    setPaymentMethods((current) => {
      const next = current.filter((method) => method.id !== methodId);
      toast.success('Payment method removed');
      return next;
    });
  }

  function handlePayoutSettingsClick() {
    const methodInput = window.prompt('Enter your payout method:', payoutSettings.method || '');
    if (methodInput === null) return;

    const method = methodInput.trim();
    if (!method) {
      toast.error('Payout method is required');
      return;
    }

    const destinationInput = window.prompt(
      'Enter your payout destination (email, IBAN, or account reference):',
      payoutSettings.destination || ''
    );
    if (destinationInput === null) return;

    const destination = destinationInput.trim();
    if (!destination) {
      toast.error('Payout destination is required');
      return;
    }

    setPayoutSettings({ method, destination });
    toast.success('Payout settings saved');
  }

  function handlePaymentHistorySettingsClick() {
    queryClient.invalidateQueries({ queryKey: ['settings-payments', user.id] });
    toast.success('Payment history refreshed');
  }

  function handleSaveTheme() {
    localStorage.setItem(STORAGE_KEYS.theme, theme);
    toast.success('Theme saved');
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-[#f5f5f5]">
      <div className="appContainer py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-6">
          <aside>
            <nav className="space-y-1">
              {SETTINGS_SECTIONS.map((section) => {
                const isActive = section.id === activeSection;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => handleSectionChange(section.id)}
                    className={`w-full rounded-xl px-4 py-2.5 text-left text-lg font-semibold transition-colors ${
                      isActive ? 'bg-[#f2deaa] text-gray-900' : 'text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {section.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          {activeSection === 'communities' && (
            <CommunitiesSection
              communities={communities}
              communityVisibility={communityVisibility}
              communityPinned={communityPinned}
              onVisibilityToggle={handleCommunityVisibilityToggle}
              onPinToggle={handleCommunityPinToggle}
            />
          )}

          {activeSection === 'profile' && (
            <ProfileSection
              user={user}
              firstName={firstName}
              lastName={lastName}
              bio={bio}
              location={location}
              myersBriggs={myersBriggs}
              socialLinks={socialLinks}
              membershipVisibility={membershipVisibility}
              profilePanelOpen={profilePanelOpen}
              isPending={updateProfileMutation.isPending}
              onFirstNameChange={setFirstName}
              onLastNameChange={setLastName}
              onBioChange={setBio}
              onLocationChange={setLocation}
              onMyersBriggsChange={setMyersBriggs}
              onSocialLinksChange={setSocialLinks}
              onMembershipVisibilityChange={setMembershipVisibility}
              onChangeProfilePhoto={handleChangeProfilePhoto}
              onSaveName={handleSaveName}
              onSaveProfile={handleSaveProfile}
              onChangeMapLocation={handleChangeMapLocation}
              onRemoveMapLocation={handleRemoveMapLocation}
              onTogglePanel={toggleProfilePanel}
              onResetLocalProfileSettings={handleResetLocalProfileSettings}
            />
          )}

          {activeSection === 'affiliates' && (
            <AffiliatesSection
              affiliateCommunity={affiliateCommunity}
              affiliateCommunityLabel={affiliateCommunityLabel}
              affiliateUrl={affiliateUrl}
              onCopyAffiliateLink={copyAffiliateLink}
            />
          )}

          {activeSection === 'payouts' && (
            <PayoutsSection
              payoutSettings={payoutSettings}
              onPayoutSettingsClick={handlePayoutSettingsClick}
            />
          )}

          {activeSection === 'account' && (
            <AccountSection
              user={user}
              timezone={timezone}
              isEmailPending={updateEmailMutation.isPending}
              isPasswordPending={updatePasswordMutation.isPending}
              onTimezoneChange={setTimezone}
              onChangeEmail={handleChangeEmail}
              onChangePassword={handleChangePassword}
              onLogoutEverywhere={handleLogoutEverywhere}
            />
          )}

          {activeSection === 'notifications' && (
            <NotificationsSection
              notificationSettings={notificationSettings}
              onNotificationSettingsChange={setNotificationSettings}
              communities={communities}
              communityNotificationMode={communityNotificationMode}
              onCycleNotificationMode={cycleCommunityNotificationMode}
            />
          )}

          {activeSection === 'chat' && (
            <ChatSection
              notificationSettings={notificationSettings}
              onNotificationSettingsChange={setNotificationSettings}
              communities={communities}
              communityChatMode={communityChatMode}
              onChatModeToggle={handleChatModeToggle}
            />
          )}

          {activeSection === 'payment-methods' && (
            <PaymentMethodsSection
              paymentMethods={paymentMethods}
              onAddPaymentMethod={handleAddPaymentMethod}
              onRemovePaymentMethod={handleRemovePaymentMethod}
            />
          )}

          {activeSection === 'payment-history' && (
            <PaymentHistorySection
              payments={payments}
              onRefresh={handlePaymentHistorySettingsClick}
            />
          )}

          {activeSection === 'theme' && (
            <ThemeSection
              theme={theme}
              onThemeChange={setTheme}
              onSaveTheme={handleSaveTheme}
            />
          )}
        </div>
      </div>
    </div>
  );
}
