export const StylistCardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 animate-pulse"
        >
          {/* Avatar + Name */}
          <div className="flex items-center mb-3">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full mr-3" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2 mb-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
          </div>

          {/* Specialty tags */}
          <div className="flex gap-1">
            <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-6 w-14 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      ))}
    </>
  );
};
