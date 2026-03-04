import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Avatar } from '../components/ui/Avatar';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export function SettingsPage() {
  const { user } = useAuth();
  if (!user) return null;

  return <SettingsForm key={user.id ?? 'current-user'} user={user} />;
}

function SettingsForm({ user }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(user?.name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [avatar, setAvatar] = useState(user?.avatar ?? '');

  const updateMutation = useMutation({
    mutationFn: (body) => api.put('/auth/me', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      toast.success('Profile updated');
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    },
  });

  function handleSubmit(e) {
    e.preventDefault();
    updateMutation.mutate({ name, bio: bio || undefined, avatar: avatar || undefined });
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Edit profile</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar src={avatar || user.avatar} name={name || user.name} size="xl" />
              <div className="flex-1">
                <Input
                  label="Avatar URL"
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <Button type="submit" isLoading={updateMutation.isPending}>
              Save
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
