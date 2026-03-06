import { PostCard } from './PostCard';

export function PostFeed({ posts }) {
  return (
    <section className="space-y-3">
      {posts.length === 0 ? (
        <p className="text-[1.7rem] font-semibold text-gray-900">
          This is the start of something special
        </p>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </section>
  );
}
