export const StylistCardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 border rounded-lg bg-white animate-pulse">
          {/* Avatar + Name - matches StylistSelector card layout */}
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gray-200 rounded-full mr-4 shrink-0" />
            <div className="overflow-hidden flex-1">
              <div className="flex items-center justify-between">
                <div className="h-5 bg-gray-200 rounded w-24" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};
