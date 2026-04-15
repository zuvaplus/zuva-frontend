export function FeedSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden bg-surface-200">
          <div className="skeleton aspect-[9/16] sm:aspect-video" />
          <div className="p-4 space-y-2">
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function WalletSkeleton() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-32 rounded-2xl" />
      <div className="skeleton h-12 rounded-xl" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-16 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="skeleton w-20 h-20 rounded-full" />
        <div className="space-y-2 flex-1">
          <div className="skeleton h-6 w-40" />
          <div className="skeleton h-4 w-28" />
        </div>
      </div>
      <div className="skeleton h-16 rounded-xl" />
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-24 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
