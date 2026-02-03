export function SlideScriptSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600" />
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-600 rounded" />
        </div>
        <div className="h-4 w-12 bg-gray-200 dark:bg-gray-600 rounded" />
      </div>
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-full" />
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-5/6" />
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-4/6" />
      </div>
    </div>
  );
}

export function SlideScriptSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SlideScriptSkeleton key={i} />
      ))}
    </div>
  );
}
