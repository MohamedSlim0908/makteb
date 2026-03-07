import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronDown,
  Coins,
  Copy,
  Eye,
  EyeOff,
  MapPin,
  MessageCircle,
  MessageCircleOff,
  Pin,
  Settings as SettingsIcon,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { useAuth } from '../hooks/useAuth';
import { api, getErrorMessage } from '../lib/api';
import toast from 'react-hot-toast';

const SETTINGS_SECTIONS = [
  { id: 'communities', label: 'Communities' },
  { id: 'profile', label: 'Profile' },
  { id: 'affiliates', label: 'Affiliates' },
  { id: 'payouts', label: 'Payouts' },
  { id: 'account', label: 'Account' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'chat', label: 'Chat' },
  { id: 'payment-methods', label: 'Payment methods' },
  { id: 'payment-history', label: 'Payment history' },
  { id: 'theme', label: 'Theme' },
];

const STORAGE_KEYS = {
  location: 'settings_location',
  theme: 'settings_theme',
  notificationSettings: 'settings_notifications',
  communityChatMode: 'settings_community_chat_mode',
  communityVisibility: 'settings_community_visibility',
  communityPinned: 'settings_community_pinned',
  communityNotificationMode: 'settings_community_notification_mode',
  socialLinks: 'settings_social_links',
  membershipVisibility: 'settings_membership_visibility',
  paymentMethods: 'settings_payment_methods',
  myersBriggs: 'settings_myers_briggs',
  timezone: 'settings_timezone',
  payoutSettings: 'settings_payout_settings',
};

const DEFAULT_NOTIFICATION_SETTINGS = {
  follower: true,
  likes: true,
  kaching: true,
  affiliate: false,
  chat: true,
  email: true,
};

const COMMUNITY_NOTIFICATION_LEVELS = ['All', 'Mentions', 'Muted'];
const DEFAULT_SOCIAL_LINKS = { website: '', x: '', youtube: '' };
const DEFAULT_MYERS_BRIGGS = "Don't show";
const DEFAULT_MEMBERSHIP_VISIBILITY = 'Public';
const TIMEZONE_OPTIONS = [
  { value: 'Africa/Tunis', label: '(GMT +01:00) Africa/Tunis' },
  { value: 'UTC', label: '(GMT +00:00) UTC' },
  { value: 'Europe/Berlin', label: '(GMT +02:00) Europe/Berlin' },
];

function isValidSettingsSection(sectionId) {
  return SETTINGS_SECTIONS.some((section) => section.id === sectionId);
}

function readStoredObject(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function readStoredArray(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function getInitials(name) {
  return (name || 'C').trim().charAt(0).toUpperCase();
}

function splitName(fullName = '') {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { first: '', last: '' };
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-emerald-200' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-6 w-6 rounded-full transition-transform ${
          checked ? 'translate-x-5 bg-emerald-600' : 'translate-x-0 bg-gray-500'
        }`}
      />
    </button>
  );
}

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

  useEffect(() => {
    const parsed = splitName(user.name);
    setFirstName(parsed.first);
    setLastName(parsed.last);
    setBio(user.bio || '');
  }, [user.name, user.bio]);

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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.location, location);
  }, [location]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.notificationSettings, JSON.stringify(notificationSettings));
  }, [notificationSettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.communityChatMode, JSON.stringify(communityChatMode));
  }, [communityChatMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.communityVisibility, JSON.stringify(communityVisibility));
  }, [communityVisibility]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.communityPinned, JSON.stringify(communityPinned));
  }, [communityPinned]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.communityNotificationMode, JSON.stringify(communityNotificationMode));
  }, [communityNotificationMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.socialLinks, JSON.stringify(socialLinks));
  }, [socialLinks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.myersBriggs, myersBriggs);
  }, [myersBriggs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.membershipVisibility, membershipVisibility);
  }, [membershipVisibility]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.timezone, timezone);
  }, [timezone]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.paymentMethods, JSON.stringify(paymentMethods));
  }, [paymentMethods]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.payoutSettings, JSON.stringify(payoutSettings));
  }, [payoutSettings]);

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

  const profileUrl = '';
  const affiliateCommunity = createdCommunities[0] || communities[0] || null;
  const affiliateCommunityLabel = affiliateCommunity?.name || '';
  const affiliateUrl = affiliateCommunity ? `${window.location.origin}/community/${affiliateCommunity.slug}` : '';

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

  function renderCommunityAvatar(community) {
    if (community.coverImage) {
      return (
        <img
          src={community.coverImage}
          alt={community.name}
          className="h-10 w-10 rounded-lg object-cover border border-gray-200"
        />
      );
    }

    return (
      <div className="h-10 w-10 rounded-lg bg-gray-900 text-white text-sm font-bold flex items-center justify-center">
        {getInitials(community.name)}
      </div>
    );
  }

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
            <Card className="p-6">
              <h1 className="text-3xl font-semibold text-gray-900">Communities</h1>
              <p className="mt-2 text-sm text-gray-500">Drag and drop to reorder, pin to sidebar, or hide.</p>

              {communities.length > 0 ? (
                <div className="mt-6 space-y-4">
                  {communities.map((community) => (
                    <div key={community.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {renderCommunityAvatar(community)}
                        <p className="font-semibold text-gray-900 truncate">{community.name}</p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <Link
                          to={`/community/${community.slug}/settings`}
                          className="inline-flex h-10 min-w-[120px] items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                        >
                          SETTINGS
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleCommunityVisibilityToggle(community)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
                          aria-label={`${communityVisibility[community.id] === false ? 'Show' : 'Hide'} ${community.name}`}
                        >
                          {communityVisibility[community.id] === false ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCommunityPinToggle(community)}
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-gray-100 ${
                            communityPinned[community.id] ? 'text-amber-600' : 'text-gray-400'
                          }`}
                          aria-label={`Pin ${community.name}`}
                        >
                          <Pin className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-6 text-sm text-gray-500">No communities yet. Join a course or create a community first.</p>
              )}
            </Card>
          )}

          {activeSection === 'profile' && (
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
                  onClick={handleChangeProfilePhoto}
                  className="text-primary-600 font-semibold hover:text-primary-700 disabled:opacity-60"
                  disabled={updateProfileMutation.isPending}
                >
                  Change profile photo
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">First Name</label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full h-12 rounded-md border border-gray-300 px-3 text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Last Name</label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full h-12 rounded-md border border-gray-300 px-3 text-gray-700"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500">
                You can only change your name once, and you must use your real name.{' '}
                <button
                  type="button"
                  onClick={handleSaveName}
                  className="text-primary-600 hover:text-primary-700 disabled:opacity-60"
                  disabled={updateProfileMutation.isPending}
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
                  onChange={(e) => setBio(e.target.value.slice(0, 150))}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-700 resize-none"
                />
                <p className="text-right text-sm text-gray-500 mt-1">{bio.length} / 150</p>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Location</label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location"
                  className="w-full h-12 rounded-md border border-gray-300 px-3 text-gray-700"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={handleChangeMapLocation}
                  className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
                >
                  <MapPin className="w-4 h-4" />
                  Change my map location
                </button>
                <button type="button" onClick={handleRemoveMapLocation} className="text-gray-400 hover:text-gray-500">
                  Remove my map location
                </button>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Myers Briggs</label>
                <select
                  value={myersBriggs}
                  onChange={(e) => setMyersBriggs(e.target.value)}
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
                    onClick={() => toggleProfilePanel('social')}
                    className="inline-flex items-center gap-2 text-lg font-semibold text-gray-900"
                  >
                    Social links
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${profilePanelOpen.social ? 'rotate-180' : ''}`} />
                  </button>
                  {profilePanelOpen.social && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        value={socialLinks.website || ''}
                        onChange={(e) => setSocialLinks((current) => ({ ...current, website: e.target.value }))}
                        placeholder="Website URL"
                        className="h-11 rounded-md border border-gray-300 px-3 text-sm text-gray-700"
                      />
                      <input
                        value={socialLinks.x || ''}
                        onChange={(e) => setSocialLinks((current) => ({ ...current, x: e.target.value }))}
                        placeholder="X username"
                        className="h-11 rounded-md border border-gray-300 px-3 text-sm text-gray-700"
                      />
                      <input
                        value={socialLinks.youtube || ''}
                        onChange={(e) => setSocialLinks((current) => ({ ...current, youtube: e.target.value }))}
                        placeholder="YouTube URL"
                        className="h-11 rounded-md border border-gray-300 px-3 text-sm text-gray-700"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => toggleProfilePanel('membership')}
                    className="inline-flex items-center gap-2 text-lg font-semibold text-gray-900"
                  >
                    Membership visibility
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${profilePanelOpen.membership ? 'rotate-180' : ''}`} />
                  </button>
                  {profilePanelOpen.membership && (
                    <div className="mt-3">
                      <select
                        value={membershipVisibility}
                        onChange={(e) => setMembershipVisibility(e.target.value)}
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
                    onClick={() => toggleProfilePanel('advanced')}
                    className="inline-flex items-center gap-2 text-lg font-semibold text-gray-900"
                  >
                    Advanced
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${profilePanelOpen.advanced ? 'rotate-180' : ''}`} />
                  </button>
                  {profilePanelOpen.advanced && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={handleResetLocalProfileSettings}
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
                onClick={handleSaveProfile}
                disabled={updateProfileMutation.isPending}
                className="h-12 w-full rounded-md bg-[#f0c96b] text-gray-900 font-bold disabled:opacity-60"
              >
                {updateProfileMutation.isPending ? 'SAVING...' : 'SAVE PROFILE'}
              </button>
            </Card>
          )}

          {activeSection === 'affiliates' && (
            <Card className="p-6 space-y-6">
              <div>
                <h1 className="text-3xl font-semibold text-gray-900">Affiliates</h1>
                <p className="mt-2 text-lg text-gray-700">
                  Share your real community link when you want to invite new members.
                </p>
              </div>

              {affiliateCommunity ? (
                <>
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Community</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900">{affiliateCommunityLabel}</p>
                    <p className="mt-2 text-sm text-gray-500">
                      This link uses your real community route instead of seeded affiliate demo data.
                    </p>
                  </div>

                  <div>
                    <div className="flex">
                      <input
                        readOnly
                        value={affiliateUrl}
                        className="flex-1 h-12 rounded-l-md border border-gray-300 px-3 text-primary-600 font-semibold"
                      />
                      <button
                        type="button"
                        onClick={copyAffiliateLink}
                        className="h-12 px-10 rounded-r-md border border-[#eac76a] bg-[#f0c96b] font-bold text-gray-800 inline-flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        COPY
                      </button>
                    </div>
                  </div>

                  <div className="min-h-[220px] rounded-xl border border-gray-200 flex flex-col items-center justify-center text-center">
                    <Coins className="w-12 h-12 text-yellow-500" />
                    <p className="mt-4 text-lg text-gray-700">No referral records available.</p>
                  </div>
                </>
              ) : (
                <div className="min-h-[220px] rounded-xl border border-gray-200 flex flex-col items-center justify-center text-center">
                  <Coins className="w-12 h-12 text-yellow-500" />
                  <p className="mt-4 text-lg text-gray-700">Create a community to generate a share link.</p>
                </div>
              )}
            </Card>
          )}

          {activeSection === 'payouts' && (
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-semibold text-gray-900">Payouts</h1>
                  <p className="mt-2 text-lg text-gray-500">Payouts for community and affiliate earnings.</p>
                </div>
                <button type="button" onClick={handlePayoutSettingsClick} className="text-gray-400 hover:text-gray-500">
                  <SettingsIcon className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-8 text-lg text-gray-500">No payouts yet</p>
              <div className="mt-6 rounded-xl border border-gray-200 p-4 space-y-2">
                <h2 className="text-lg font-semibold text-gray-900">Payout destination</h2>
                <p className="text-sm text-gray-500">Method: {payoutSettings.method || 'Not set'}</p>
                <p className="text-sm text-gray-500">Destination: {payoutSettings.destination || 'Not set'}</p>
              </div>
            </Card>
          )}

          {activeSection === 'account' && (
            <Card className="p-6 space-y-8">
              <h1 className="text-3xl font-semibold text-gray-900">Account</h1>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Email</h2>
                  <p className="text-lg text-gray-700 mt-1">{user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={handleChangeEmail}
                  disabled={updateEmailMutation.isPending}
                  className="h-12 min-w-[180px] rounded-md border border-gray-300 text-gray-500 font-semibold disabled:opacity-60"
                >
                  {updateEmailMutation.isPending ? 'UPDATING...' : 'CHANGE EMAIL'}
                </button>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Password</h2>
                  <p className="text-lg text-gray-700 mt-1">Change your password</p>
                </div>
                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={updatePasswordMutation.isPending}
                  className="h-12 min-w-[180px] rounded-md border border-gray-300 text-gray-500 font-semibold disabled:opacity-60"
                >
                  {updatePasswordMutation.isPending ? 'UPDATING...' : 'CHANGE PASSWORD'}
                </button>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Timezone</h2>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full h-12 rounded-md border border-gray-300 px-3 text-lg text-gray-700 bg-white"
                >
                  {TIMEZONE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Log out of all devices</h2>
                  <p className="text-lg text-gray-700 mt-1">Log out of all active sessions on all devices.</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogoutEverywhere}
                  className="h-12 min-w-[180px] rounded-md border border-gray-300 text-gray-500 font-semibold"
                >
                  LOG OUT EVERYWHERE
                </button>
              </div>
            </Card>
          )}

          {activeSection === 'notifications' && (
            <Card className="p-6 space-y-6">
              <h1 className="text-3xl font-semibold text-gray-900">Notifications</h1>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg text-gray-900">New follower</span>
                  <Toggle
                    checked={notificationSettings.follower}
                    onChange={() => setNotificationSettings((prev) => ({ ...prev, follower: !prev.follower }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg text-gray-900">Likes</span>
                  <Toggle
                    checked={notificationSettings.likes}
                    onChange={() => setNotificationSettings((prev) => ({ ...prev, likes: !prev.likes }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg text-gray-900">Ka-ching</span>
                  <Toggle
                    checked={notificationSettings.kaching}
                    onChange={() => setNotificationSettings((prev) => ({ ...prev, kaching: !prev.kaching }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg text-gray-900">Affiliate referral</span>
                  <Toggle
                    checked={notificationSettings.affiliate}
                    onChange={() => setNotificationSettings((prev) => ({ ...prev, affiliate: !prev.affiliate }))}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-2">
                {communities.map((community) => (
                  <div key={community.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {renderCommunityAvatar(community)}
                      <p className="font-semibold text-gray-900 truncate">{community.name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => cycleCommunityNotificationMode(community.id)}
                      className="inline-flex items-center gap-1 text-gray-500"
                    >
                      {communityNotificationMode[community.id] || 'All'}
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeSection === 'chat' && (
            <Card className="p-6 space-y-8">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-semibold text-gray-900">Notifications</h1>
                  <p className="mt-2 text-lg text-gray-800">
                    Notify me with sound and blinking tab header when somebody messages me.
                  </p>
                </div>
                <Toggle
                  checked={notificationSettings.chat}
                  onChange={() => setNotificationSettings((prev) => ({ ...prev, chat: !prev.chat }))}
                />
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-3xl font-semibold text-gray-900">Email notifications</h2>
                  <p className="mt-2 text-lg text-gray-800">
                    If you&apos;re offline and somebody messages you, we&apos;ll let you know via email. We won&apos;t email you if you&apos;re online.
                  </p>
                </div>
                <Toggle
                  checked={notificationSettings.email}
                  onChange={() => setNotificationSettings((prev) => ({ ...prev, email: !prev.email }))}
                />
              </div>

              <div>
                <h2 className="text-3xl font-semibold text-gray-900">Who can message me?</h2>
                <p className="mt-2 text-lg text-gray-800">
                  Only members in the group you&apos;re in can message you. You choose what group users can message you from by turning your chat on/off below.
                </p>
              </div>

              <div className="space-y-3">
                {communities.map((community) => {
                  const mode = communityChatMode[community.id] || 'ON';
                  return (
                    <div key={community.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {renderCommunityAvatar(community)}
                        <p className="font-semibold text-gray-900 truncate">{community.name}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setCommunityChatMode((current) => ({
                            ...current,
                            [community.id]: (current[community.id] || 'ON') === 'ON' ? 'OFF' : 'ON',
                          }))
                        }
                        className="inline-flex h-12 min-w-[124px] items-center justify-center gap-2 rounded-md border border-gray-300 text-lg font-semibold text-gray-500 bg-white"
                      >
                        {mode === 'ON' ? <MessageCircle className="w-4 h-4" /> : <MessageCircleOff className="w-4 h-4" />}
                        {mode}
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div>
                <h2 className="text-3xl font-semibold text-gray-900">Blocked users</h2>
                <p className="mt-3 text-lg text-gray-800">You have no blocked users.</p>
              </div>
            </Card>
          )}

          {activeSection === 'payment-methods' && (
            <Card className="p-6">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-3xl font-semibold text-gray-900">Payment methods</h1>
                <button
                  type="button"
                  onClick={handleAddPaymentMethod}
                  className="h-12 px-8 rounded-md border border-[#eac76a] bg-[#f0c96b] text-gray-800 font-bold"
                >
                  ADD PAYMENT METHOD
                </button>
              </div>

              {paymentMethods.length > 0 ? (
                <div className="mt-10 space-y-4">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-semibold text-gray-900">{method.brand} •••• {method.last4}</p>
                        <p className="mt-2 text-lg text-gray-800">Expires: {method.expiry}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePaymentMethod(method.id)}
                        className="h-12 w-12 rounded-md border border-gray-300 text-gray-400 text-2xl"
                        aria-label={`Remove ${method.brand} ending ${method.last4}`}
                      >
                        •••
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-10 text-lg text-gray-500">No payment methods saved.</p>
              )}
            </Card>
          )}

          {activeSection === 'payment-history' && (
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <h1 className="text-3xl font-semibold text-gray-900">Payment history</h1>
                <button type="button" onClick={handlePaymentHistorySettingsClick} className="text-gray-400 hover:text-gray-500">
                  <SettingsIcon className="w-5 h-5" />
                </button>
              </div>

              {payments.length > 0 ? (
                <div className="mt-10 space-y-4 text-lg">
                  {payments.map((payment) => (
                    <div key={payment.id}>
                      <span className="text-primary-600">
                        {new Date(payment.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="text-gray-700">
                        {' '}— ${Number(payment.amount || 0).toFixed(2)} for {payment.type.toLowerCase()} payment
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-10 text-lg text-gray-500">No payments yet.</p>
              )}
            </Card>
          )}

          {activeSection === 'theme' && (
            <Card className="p-6">
              <h1 className="text-3xl font-semibold text-gray-900">Theme</h1>
              <div className="mt-6">
                <label className="block text-sm text-gray-500 mb-1">Theme</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full h-12 rounded-md border border-gray-300 px-3 text-lg text-gray-700 bg-white"
                >
                  <option>Light (default)</option>
                  <option>Dark</option>
                  <option>System</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleSaveTheme}
                className="mt-6 h-12 w-full rounded-md bg-[#f0c96b] text-gray-900 font-bold"
              >
                SAVE
              </button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

