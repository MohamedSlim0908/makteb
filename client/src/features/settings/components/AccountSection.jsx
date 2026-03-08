import { Card } from '../../../components/ui/Card';
import { TIMEZONE_OPTIONS } from '../settingsConstants';

export function AccountSection({
  user,
  timezone,
  isEmailPending,
  isPasswordPending,
  onTimezoneChange,
  onChangeEmail,
  onChangePassword,
  onLogoutEverywhere,
}) {
  return (
    <Card className="p-6 space-y-8">
      <h1 className="text-3xl font-semibold text-gray-900">Account</h1>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Email</h2>
          <p className="text-lg text-gray-700 mt-1">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={onChangeEmail}
          disabled={isEmailPending}
          className="h-12 min-w-[180px] rounded-md border border-gray-300 text-gray-500 font-semibold disabled:opacity-60"
        >
          {isEmailPending ? 'UPDATING...' : 'CHANGE EMAIL'}
        </button>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Password</h2>
          <p className="text-lg text-gray-700 mt-1">Change your password</p>
        </div>
        <button
          type="button"
          onClick={onChangePassword}
          disabled={isPasswordPending}
          className="h-12 min-w-[180px] rounded-md border border-gray-300 text-gray-500 font-semibold disabled:opacity-60"
        >
          {isPasswordPending ? 'UPDATING...' : 'CHANGE PASSWORD'}
        </button>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Timezone</h2>
        <select
          value={timezone}
          onChange={(e) => onTimezoneChange(e.target.value)}
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
          onClick={onLogoutEverywhere}
          className="h-12 min-w-[180px] rounded-md border border-gray-300 text-gray-500 font-semibold"
        >
          LOG OUT EVERYWHERE
        </button>
      </div>
    </Card>
  );
}
