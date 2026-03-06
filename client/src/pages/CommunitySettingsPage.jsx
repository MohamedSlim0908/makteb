import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Save,
  UserMinus,
  ShieldCheck,
  Settings,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Tabs } from '../components/ui/Tabs';
import { useAuth } from '../hooks/useAuth';
import { useCommunity } from '../features/community/useCommunity';
import { useMembership } from '../features/community/useMembership';
import { useMembers } from '../features/community/useMembers';
import { api } from '../lib/api';

const TABS = [
  { id: 'general', label: 'General' },
  { id: 'members', label: 'Members' },
];

const VISIBILITY_OPTIONS = [
  { value: 'PUBLIC', label: 'Public' },
  { value: 'PRIVATE', label: 'Private' },
];

const ROLE_OPTIONS = [
  { value: 'MEMBER', label: 'Member' },
  { value: 'MODERATOR', label: 'Moderator' },
  { value: 'ADMIN', label: 'Admin' },
];

function GeneralSettings({ community }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: community.name || '',
    description: community.description || '',
    visibility: community.visibility || 'PUBLIC',
    coverImage: community.coverImage || '',
  });

  const updateMutation = useMutation({
    mutationFn: (data) => api.put(`/communities/${community.id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community', community.slug] });
      toast.success('Community updated');
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to update'),
  });

  function handleSubmit(e) {
    e.preventDefault();
    updateMutation.mutate({
      name: form.name.trim(),
      description: form.description.trim(),
      visibility: form.visibility,
      coverImage: form.coverImage.trim() || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
      <Input
        label="Community Name"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        required
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-gray-900 transition-colors resize-none"
          placeholder="Describe your community..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Visibility</label>
        <select
          value={form.visibility}
          onChange={(e) => setForm((f) => ({ ...f, visibility: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-gray-900 transition-colors"
        >
          {VISIBILITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <Input
        label="Cover Image URL"
        value={form.coverImage}
        onChange={(e) => setForm((f) => ({ ...f, coverImage: e.target.value }))}
        placeholder="https://..."
      />
      <Button type="submit" isLoading={updateMutation.isPending}>
        <Save className="w-4 h-4 mr-1" />
        Save Changes
      </Button>
    </form>
  );
}

function MembersSettings({ community }) {
  const qc = useQueryClient();
  const { data: members = [] } = useMembers(community.id);

  const removeMemberMutation = useMutation({
    mutationFn: (userId) => api.delete(`/communities/${community.id}/members/${userId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community-members', community.id] });
      toast.success('Member removed');
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to remove member'),
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({ userId, role }) => api.put(`/communities/${community.id}/members/${userId}/role`, { role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community-members', community.id] });
      toast.success('Role updated');
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to update role'),
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{members.length} member{members.length !== 1 ? 's' : ''}</p>
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Member</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Joined</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                        {(m.user?.name || '?').charAt(0)}
                      </div>
                      <span className="font-medium text-gray-900">{m.user?.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {m.role === 'OWNER' ? (
                      <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-900 text-white">
                        Owner
                      </span>
                    ) : (
                      <select
                        value={m.role}
                        onChange={(e) => changeRoleMutation.mutate({ userId: m.userId, role: e.target.value })}
                        className="px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white"
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(m.joinedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {m.role !== 'OWNER' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => removeMemberMutation.mutate(m.userId, {
                          onError: (err) => toast.error(err?.response?.data?.error || 'Failed'),
                        })}
                        isLoading={removeMemberMutation.isPending}
                      >
                        <UserMinus className="w-3.5 h-3.5 mr-1" />
                        Remove
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function CommunitySettingsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');

  const { data: community, isLoading } = useCommunity(slug);
  const communityId = community?.id;
  const { data: membership } = useMembership(communityId, user?.id);

  const memberRole = membership?.membership?.role;
  const canManage = memberRole === 'OWNER' || memberRole === 'ADMIN';

  if (isLoading) {
    return (
      <div className="min-h-[calc(100dvh-3.5rem)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!community || !canManage) {
    return (
      <div className="min-h-[calc(100dvh-3.5rem)] bg-white flex items-center justify-center">
        <div className="text-center">
          <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900">Access Denied</h2>
          <p className="text-sm text-gray-500 mt-1">You need admin access to manage this community.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(`/community/${slug}`)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold text-lg">
              {(community.name || 'C').charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{community.name}</h1>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Settings className="w-3.5 h-3.5" />
                Community Settings
              </p>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200 mb-6">
          <Tabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {activeTab === 'general' && <GeneralSettings community={community} />}
        {activeTab === 'members' && <MembersSettings community={community} />}
      </div>
    </div>
  );
}
