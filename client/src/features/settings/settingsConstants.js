export const SETTINGS_SECTIONS = [
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

export const STORAGE_KEYS = {
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

export const DEFAULT_NOTIFICATION_SETTINGS = {
  follower: true,
  likes: true,
  kaching: true,
  affiliate: false,
  chat: true,
  email: true,
};

export const COMMUNITY_NOTIFICATION_LEVELS = ['All', 'Mentions', 'Muted'];
export const DEFAULT_SOCIAL_LINKS = { website: '', x: '', youtube: '' };
export const DEFAULT_MYERS_BRIGGS = "Don't show";
export const DEFAULT_MEMBERSHIP_VISIBILITY = 'Public';

export const TIMEZONE_OPTIONS = [
  { value: 'Africa/Tunis', label: '(GMT +01:00) Africa/Tunis' },
  { value: 'UTC', label: '(GMT +00:00) UTC' },
  { value: 'Europe/Berlin', label: '(GMT +02:00) Europe/Berlin' },
];

export function isValidSettingsSection(sectionId) {
  return SETTINGS_SECTIONS.some((section) => section.id === sectionId);
}

export function readStoredObject(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function readStoredArray(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function getInitials(name) {
  return (name || 'C').trim().charAt(0).toUpperCase();
}

export function splitName(fullName = '') {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { first: '', last: '' };
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}
