import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Avatar } from '../components/ui/Avatar';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
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
    <div className="min-h-[calc(100dvh-3.5rem)] bg-[#f5f5f5]">
      <div className="max-w-xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Edit profile</h2>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <Avatar src={avatar || user.avatar} name={name || user.name} size="xl" />
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
                    <Camera className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none transition-colors"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" isLoading={updateMutation.isPending}>
                  Save Changes
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
