import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Avatar } from '../components/ui/Avatar';
import { ImageUpload } from '../components/ui/ImageUpload';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { useUpdateProfile } from '../features/auth/useUpdateProfile';

export function SettingsPage() {
  const { user } = useAuth();
  return <SettingsForm key={user.id ?? 'current-user'} user={user} />;
}

function SettingsForm({ user }) {
  const [name, setName] = useState(user?.name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [avatar, setAvatar] = useState(user?.avatar ?? '');

  const updateMutation = useUpdateProfile();

  function handleSubmit(e) {
    e.preventDefault();
    updateMutation.mutate(
      { name, bio: bio || undefined, avatar: avatar || undefined },
      {
        onSuccess: () => toast.success('Profile updated'),
      }
    );
  }

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-white">
      <div className="max-w-xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-5">
            <ImageUpload
              currentImage={avatar || user.avatar}
              onUpload={(url) => setAvatar(url)}
              label="Change avatar"
            />
            <div className="flex-1">
              <Avatar src={avatar || user.avatar} name={name || user.name} size="xl" />
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
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none transition-colors"
            />
          </div>

          <Button type="submit" isLoading={updateMutation.isPending}>
            Save Changes
          </Button>
        </form>
      </div>
    </div>
  );
}
