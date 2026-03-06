export function Skeleton({ className = '', variant = 'line' }) {
  const base = 'animate-pulse bg-gray-100 rounded';

  if (variant === 'circle') {
    return <div className={`${base} rounded-full ${className}`} />;
  }

  if (variant === 'card') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
        <div className="h-48 bg-gray-100" />
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg" />
            <div className="h-5 bg-gray-100 rounded w-2/3" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-100 rounded w-full" />
            <div className="h-4 bg-gray-100 rounded w-4/5" />
          </div>
          <div className="flex gap-3 pt-2">
            <div className="h-3 bg-gray-100 rounded w-20" />
            <div className="h-3 bg-gray-100 rounded w-16" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'post') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gray-100 rounded-full" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-100 rounded w-32" />
            <div className="h-3 bg-gray-100 rounded w-20" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-100 rounded w-full" />
          <div className="h-4 bg-gray-100 rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (variant === 'member') {
    return (
      <div className="flex items-center gap-3 py-4 border-b border-gray-100 animate-pulse">
        <div className="w-11 h-11 bg-gray-100 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-100 rounded w-32" />
          <div className="h-3 bg-gray-100 rounded w-20" />
        </div>
        <div className="w-16 h-8 bg-gray-100 rounded-lg shrink-0" />
      </div>
    );
  }

  if (variant === 'course-row') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-20 h-14 bg-gray-100 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-100 rounded w-48" />
            <div className="h-3 bg-gray-100 rounded w-32" />
            <div className="flex gap-3">
              <div className="h-3 bg-gray-100 rounded w-16" />
              <div className="h-3 bg-gray-100 rounded w-12" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'dashboard') {
    return (
      <div className="border border-gray-200 rounded-xl overflow-hidden animate-pulse">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="h-5 bg-gray-100 rounded w-24" />
          <div className="h-8 bg-gray-100 rounded w-20" />
        </div>
        <div className="p-5 space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <div className="h-4 bg-gray-100 rounded w-48" />
                <div className="h-3 bg-gray-100 rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <div className={`${base} ${className}`} />;
}

export function SkeletonGroup({ count = 3, variant = 'card', className = '' }) {
  return (
    <div className={className}>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} variant={variant} />
      ))}
    </div>
  );
}
