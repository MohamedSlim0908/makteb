import { useMemo, useState } from 'react';
import { CommunitySidebar } from './CommunitySidebar';
import { CommunityTabs } from './CommunityTabs';
import { FeedFilters } from './FeedFilters';
import { PostComposer } from './PostComposer';
import { PostFeed } from './PostFeed';
import { TopNavbar } from './TopNavbar';
import { CommunitySettingsModal } from './settings/CommunitySettingsModal';

export function CommunityDashboard({ initialCommunityData, initialPosts = [] }) {
  const [activeTab, setActiveTab] = useState('Community');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [posts] = useState(initialPosts);
  const [communityData, setCommunityData] = useState(initialCommunityData);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const filteredPosts = useMemo(() => {
    if (activeFilter === 'ALL') return posts;
    return posts.filter((post) => post.category === activeFilter);
  }, [activeFilter, posts]);

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      <TopNavbar community={communityData} />
      <CommunityTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_320px] sm:px-6">
        <main className="space-y-4 min-w-0">
          {activeTab === 'Community' ? (
            <>
              <PostComposer />
              <FeedFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />
              <PostFeed posts={filteredPosts} />
            </>
          ) : (
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
              <h2 className="text-3xl font-semibold text-gray-900">{activeTab}</h2>
              <p className="mt-2 text-sm text-gray-500">
                This section is ready for the next implementation step.
              </p>
            </section>
          )}
        </main>

        <CommunitySidebar
          communityData={communityData}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      </div>

      <CommunitySettingsModal
        isOpen={isSettingsOpen}
        community={communityData}
        onClose={() => setIsSettingsOpen(false)}
        onSave={setCommunityData}
      />
    </div>
  );
}
