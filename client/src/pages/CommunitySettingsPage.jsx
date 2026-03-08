import { useState, useRef,useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Save,
  UserMinus,
  ShieldCheck,
  Settings,
  Copy,
  Send,
  Trash2,
  Plus,
  Pencil,
  X,
  Link as LinkIcon,
  ExternalLink,
  Users,
  Trophy,
  Mail,
  BarChart3,
  Tag,
  Camera,
  Loader2,
  TrendingUp,
  MessageSquare,
  BookOpen,
  Calendar,
  Eye,
  EyeOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../hooks/useAuth';
import { useCommunity } from '../features/community/useCommunity';
import { useMembership } from '../features/community/useMembership';
import { useMembers } from '../features/community/useMembers';
import { api } from '../lib/api';

// ─── Sidebar tabs ────────────────────────────────────────────────────────────

const SIDEBAR_TABS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'invite', label: 'Invite', icon: Mail },
  { id: 'gamification', label: 'Gamification', icon: Trophy },
  { id: 'categories', label: 'Categories', icon: Tag },
  { id: 'metrics', label: 'Metrics', icon: BarChart3 },
  { id: 'links', label: 'Links', icon: LinkIcon },
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

const POST_CATEGORIES = [
  { value: 'GENERAL', label: 'General', description: 'General discussion topics' },
  { value: 'WINS', label: 'Wins', description: 'Share your wins and achievements' },
  { value: 'BRANDING_CLIENTS', label: 'Branding / Clients', description: 'Branding and client-related posts' },
  { value: 'WORKFLOW_PRODUCTIVITY', label: 'Workflow / Productivity', description: 'Tips for workflows and productivity' },
  { value: 'BANTER', label: 'Banter', description: 'Casual and fun conversations' },
  { value: 'INTRODUCE_YOURSELF', label: 'Introduce Yourself', description: 'New member introductions' },
];

// ─── Image Upload helpers ────────────────────────────────────────────────────

function ImageUploadBox({ label, currentImage, onUpload, recommended, aspectClass = 'w-28 h-28' }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage || '');

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreview(data.url);
      onUpload(data.url);
      toast.success(`${label} uploaded`);
    } catch {
      setPreview(currentImage || '');
      toast.error(`Failed to upload ${label.toLowerCase()}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <p className="text-sm font-semibold text-gray-900 mb-1">{label}</p>
      {recommended && <p className="text-xs text-gray-400 mb-2">{recommended}</p>}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      <div
        onClick={() => inputRef.current?.click()}
        className={`${aspectClass} rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-400 bg-gray-50 flex items-center justify-center cursor-pointer overflow-hidden relative group transition-colors`}
      >
        {preview ? (
          <img src={preview} alt={label} className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm text-primary-600 font-medium">Upload</span>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Camera className="w-5 h-5 text-white" />
        </div>
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700"
      >
        <Camera className="w-3 h-3" /> Change
      </button>
    </div>
  );
}

// ─── General Settings ────────────────────────────────────────────────────────

function GeneralSettings({ community }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: community.name || '',
    description: community.description || '',
    visibility: community.visibility || 'PUBLIC',
    coverImage: community.coverImage || '',
    iconImage: community.iconImage || '',
  });

  const updateMutation = useMutation({
    mutationFn: (data) => api.put(`/communities/${community.id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community', community.slug] });
      toast.success('Settings updated');
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
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Icon & Cover uploads */}
      <div className="flex gap-8 flex-wrap">
        <ImageUploadBox
          label="Icon"
          recommended="Recommended: 128×128"
          currentImage={form.iconImage}
          onUpload={(url) => setForm((f) => ({ ...f, iconImage: url }))}
          aspectClass="w-28 h-28"
        />
        <ImageUploadBox
          label="Cover"
          recommended="Recommended: 1084×576"
          currentImage={form.coverImage}
          onUpload={(url) => setForm((f) => ({ ...f, coverImage: url }))}
          aspectClass="w-64 h-36"
        />
      </div>

      {/* Group name */}
      <div>
        <Input
          label="Group name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          maxLength={30}
          required
        />
        <p className="text-xs text-gray-400 mt-1 text-right">{form.name.length}/30</p>
      </div>

      {/* URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">URL</label>
        <div className="flex items-center gap-0 border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
          <span className="px-3 py-2 text-sm text-gray-400 select-none border-r border-gray-200">makteb.com/</span>
          <input
            value={community.slug}
            disabled
            className="flex-1 px-3 py-2 text-sm bg-gray-50 text-gray-500 outline-none"
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">You can change your URL with a paid account.</p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Group description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-gray-900 transition-colors resize-none"
          placeholder="Add your group description here..."
        />
      </div>

      {/* Visibility */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Group settings</label>
        <div className="space-y-3">
          {VISIBILITY_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                form.visibility === opt.value ? 'border-gray-900 bg-gray-900' : 'border-gray-300 group-hover:border-gray-400'
              }`}>
                {form.visibility === opt.value && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <div>
                <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  {opt.value === 'PRIVATE' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {opt.label}
                </span>
                <p className="text-xs text-gray-400">
                  {opt.value === 'PUBLIC' ? 'Anyone can find and view this community' : 'Only members can see content, hidden from search'}
                </p>
              </div>
              <input
                type="radio"
                name="visibility"
                value={opt.value}
                checked={form.visibility === opt.value}
                onChange={(e) => setForm((f) => ({ ...f, visibility: e.target.value }))}
                className="hidden"
              />
            </label>
          ))}
        </div>
      </div>

      <Button type="submit" isLoading={updateMutation.isPending}>
        <Save className="w-4 h-4" />
        Update settings
      </Button>
    </form>
  );
}

// ─── Members Settings ────────────────────────────────────────────────────────

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
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{members.length} member{members.length !== 1 ? 's' : ''}</p>
      </div>
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
                <tr key={m.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {m.user?.avatar ? (
                        <img src={m.user.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                          {(m.user?.name || '?').charAt(0)}
                        </div>
                      )}
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
                        onClick={() => removeMemberMutation.mutate(m.userId)}
                        isLoading={removeMemberMutation.isPending}
                      >
                        <UserMinus className="w-3.5 h-3.5" />
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

// ─── Invite Settings ─────────────────────────────────────────────────────────

function InviteSettings({ community }) {
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const inviteLink = `${window.location.origin}/community/${community.slug}?tab=about`;

  const { data: invitesData } = useQuery({
    queryKey: ['community-invites', community.id],
    queryFn: async () => {
      const { data } = await api.get(`/communities/${community.id}/invites`);
      return data.invites;
    },
  });
  const invites = invitesData || [];

  const sendInviteMutation = useMutation({
    mutationFn: (inviteEmail) => api.post(`/communities/${community.id}/invites`, { email: inviteEmail }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community-invites', community.id] });
      setEmail('');
      toast.success('Invite sent');
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to send invite'),
  });

  const deleteInviteMutation = useMutation({
    mutationFn: (inviteId) => api.delete(`/communities/${community.id}/invites/${inviteId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community-invites', community.id] });
      toast.success('Invite cancelled');
    },
  });

  function handleSendInvite(e) {
    e.preventDefault();
    if (!email.trim()) return;
    sendInviteMutation.mutate(email.trim());
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(inviteLink);
    toast.success('Invite link copied!');
  }

  return (
    <div className="space-y-8">
      {/* Manual invite */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Invite by email</h3>
        <form onSubmit={handleSendInvite} className="flex gap-2">
          <Input
            placeholder="member@example.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" isLoading={sendInviteMutation.isPending} className="shrink-0">
            <Send className="w-4 h-4" />
            Send invite
          </Button>
        </form>
      </div>

      {/* Invite link */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Invite link</h3>
        <p className="text-xs text-gray-500 mb-2">Share this link with your audience to invite them to join.</p>
        <div className="flex gap-2">
          <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 truncate">
            {inviteLink}
          </div>
          <Button variant="outline" onClick={handleCopyLink} className="shrink-0">
            <Copy className="w-4 h-4" />
            Copy
          </Button>
        </div>
      </div>

      {/* Pending invites */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Pending invites {invites.length > 0 && <span className="text-gray-400 font-normal">({invites.length})</span>}
        </h3>
        {invites.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No pending invites</p>
        ) : (
          <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
            {invites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{invite.invitedEmail}</p>
                  <p className="text-xs text-gray-400">
                    Sent {new Date(invite.createdAt).toLocaleDateString()} · Expires {new Date(invite.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => deleteInviteMutation.mutate(invite.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Gamification Settings ───────────────────────────────────────────────────

function GamificationSettings({ community }) {
  const qc = useQueryClient();
  const [editingLevel, setEditingLevel] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: levelsData } = useQuery({
    queryKey: ['community-levels', community.id],
    queryFn: async () => {
      const { data } = await api.get(`/gamification/levels/${community.id}`);
      return data.levels;
    },
  });
  const levels = levelsData || [];

  const createLevelMutation = useMutation({
    mutationFn: (data) => api.post(`/gamification/levels/${community.id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community-levels', community.id] });
      setShowAddModal(false);
      toast.success('Level created');
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to create level'),
  });

  const updateLevelMutation = useMutation({
    mutationFn: ({ levelId, ...data }) => api.put(`/gamification/levels/${community.id}/${levelId}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community-levels', community.id] });
      setEditingLevel(null);
      toast.success('Level updated');
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to update level'),
  });

  const deleteLevelMutation = useMutation({
    mutationFn: (levelId) => api.delete(`/gamification/levels/${community.id}/${levelId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community-levels', community.id] });
      toast.success('Level deleted');
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500 mb-4">
          Gamification drives engagement by rewarding members with points and levels. Members earn points through posting, commenting, and engaging in your community.
        </p>
      </div>

      {/* Points info */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">How points work</h4>
        <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
          <div className="flex items-center gap-2"><MessageSquare className="w-3.5 h-3.5 text-gray-400" /> Post = +5 points</div>
          <div className="flex items-center gap-2"><MessageSquare className="w-3.5 h-3.5 text-gray-400" /> Comment = +2 points</div>
          <div className="flex items-center gap-2"><BookOpen className="w-3.5 h-3.5 text-gray-400" /> Lesson = +3 points</div>
          <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-gray-400" /> Event RSVP = +2 points</div>
        </div>
      </div>

      {/* Levels */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Levels</h3>
          <Button size="sm" variant="outline" onClick={() => setShowAddModal(true)}>
            <Plus className="w-3.5 h-3.5" />
            Add level
          </Button>
        </div>

        <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
          {levels.map((level, i) => (
            <div key={level.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-xs">
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{level.name}</p>
                  <p className="text-xs text-gray-400">{level.minPoints} points required</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditingLevel(level)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (confirm('Delete this level?')) deleteLevelMutation.mutate(level.id);
                  }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {levels.length === 0 && (
            <p className="text-sm text-gray-400 py-6 text-center">No levels configured yet</p>
          )}
        </div>
      </div>

      {/* Add Level Modal */}
      <LevelModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Level"
        onSave={(data) => createLevelMutation.mutate(data)}
        isPending={createLevelMutation.isPending}
      />

      {/* Edit Level Modal */}
      <LevelModal
        isOpen={!!editingLevel}
        onClose={() => setEditingLevel(null)}
        title="Edit Level"
        initial={editingLevel}
        onSave={(data) => updateLevelMutation.mutate({ levelId: editingLevel.id, ...data })}
        isPending={updateLevelMutation.isPending}
      />
    </div>
  );
}

function LevelModal({ isOpen, onClose, title, initial, onSave, isPending }) {
  const [name, setName] = useState(initial?.name || '');
  const [minPoints, setMinPoints] = useState(initial?.minPoints ?? 0);
  const [desc, setDesc] = useState(initial?.unlockDescription || '');

  // Reset form when initial changes (state-during-render pattern)
  const [prevInitial, setPrevInitial] = useState(initial);
  if (prevInitial !== initial) {
    setPrevInitial(initial);
    setName(initial?.name || '');
    setMinPoints(initial?.minPoints ?? 0);
    setDesc(initial?.unlockDescription || '');
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave({ name: name.trim(), minPoints: Number(minPoints), unlockDescription: desc.trim() || null });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Level name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rookie" required />
        <Input label="Min points" type="number" value={minPoints} onChange={(e) => setMinPoints(e.target.value)} min={0} required />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Unlock description (optional)</label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-gray-900 transition-colors resize-none"
            placeholder="e.g. Unlocks access to exclusive courses"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={isPending}>
            <Save className="w-4 h-4" />
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Categories Settings ─────────────────────────────────────────────────────

function CategoriesSettings() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Categories are used to organize posts within your community. Members can filter by category when browsing the feed.
      </p>
      <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
        {POST_CATEGORIES.map((cat) => (
          <div key={cat.value} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">{cat.label}</p>
              <p className="text-xs text-gray-400">{cat.description}</p>
            </div>
            <span className="text-xs text-gray-300 bg-gray-50 px-2 py-1 rounded-md font-mono">{cat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Metrics Settings ────────────────────────────────────────────────────────

const WEEK_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

function MetricsSettings({ community }) {
  const { data: members = [] } = useMembers(community.id);

  const memberCount = community._count?.members || members.length;
  const postCount = community._count?.posts || 0;
  const courseCount = community._count?.courses || 0;

  const recentMembers = useMemo(() => {
    return members.filter((m) => new Date(m.joinedAt) >= WEEK_AGO);
  }, [members]);

  const stats = [
    { label: 'Total members', value: memberCount, icon: Users, color: 'from-blue-400 to-blue-600' },
    { label: 'Total posts', value: postCount, icon: MessageSquare, color: 'from-green-400 to-green-600' },
    { label: 'Courses', value: courseCount, icon: BookOpen, color: 'from-purple-400 to-purple-600' },
    { label: 'New this week', value: recentMembers.length, icon: TrendingUp, color: 'from-orange-400 to-orange-600' },
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">See how your community is performing at a glance.</p>

      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
            </div>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent members */}
      {recentMembers.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent joins (this week)</h3>
          <div className="flex flex-wrap gap-2">
            {recentMembers.map((m) => (
              <div key={m.id} className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-full px-3 py-1.5">
                {m.user?.avatar ? (
                  <img src={m.user.avatar} alt="" className="w-5 h-5 rounded-full" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-[10px] font-bold text-white">
                    {(m.user?.name || '?').charAt(0)}
                  </div>
                )}
                <span className="text-xs font-medium text-gray-700">{m.user?.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Links Settings ──────────────────────────────────────────────────────────

function LinksSettings({ community }) {
  const [links, setLinks] = useState(community.links || []);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  function addLink(e) {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;
    setLinks((prev) => [...prev, { id: Date.now().toString(), title: newTitle.trim(), url: newUrl.trim() }]);
    setNewTitle('');
    setNewUrl('');
    setShowAdd(false);
    toast.success('Link added (saved locally)');
  }

  function removeLink(id) {
    setLinks((prev) => prev.filter((l) => l.id !== id));
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        Add helpful links that your members can quickly access from the community sidebar.
      </p>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Helpful links</h3>
        <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>
          <Plus className="w-3.5 h-3.5" />
          Add link
        </Button>
      </div>

      {links.length > 0 ? (
        <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
          {links.map((link) => (
            <div key={link.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{link.title}</p>
                  <p className="text-xs text-gray-400 truncate">{link.url}</p>
                </div>
              </div>
              <button
                onClick={() => removeLink(link.id)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
          No links added yet
        </div>
      )}

      {/* Add link form */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Link">
        <form onSubmit={addLink} className="space-y-4">
          <Input label="Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Helpful articles" required />
          <Input label="URL" type="url" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://..." required />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button type="submit">
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─── Main Settings Page ──────────────────────────────────────────────────────

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

  function renderContent() {
    switch (activeTab) {
      case 'general': return <GeneralSettings community={community} />;
      case 'members': return <MembersSettings community={community} />;
      case 'invite': return <InviteSettings community={community} />;
      case 'gamification': return <GamificationSettings community={community} />;
      case 'categories': return <CategoriesSettings community={community} />;
      case 'metrics': return <MetricsSettings community={community} />;
      case 'links': return <LinksSettings community={community} />;
      default: return null;
    }
  }

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-[#f5f5f5]">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-4 mb-6 flex items-center gap-4">
          <button
            onClick={() => navigate(`/community/${slug}`)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold text-lg shrink-0">
            {(community.name || 'C').charAt(0)}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">{community.name}</h1>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Settings className="w-3 h-3" />
              Group settings
            </p>
          </div>
          <button
            onClick={() => navigate(`/community/${slug}`)}
            className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Layout: Sidebar + Content */}
        <div className="flex gap-6">
          {/* Sidebar */}
          <nav className="w-52 shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {SIDEBAR_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors text-left ${
                      isActive
                        ? 'bg-yellow-50 text-gray-900 border-l-[3px] border-yellow-500'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-[3px] border-transparent'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-yellow-600' : 'text-gray-400'}`} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
