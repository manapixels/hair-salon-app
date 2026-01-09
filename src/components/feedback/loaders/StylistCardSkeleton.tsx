export const StylistCardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="shrink-0 w-28 py-3 px-4 border-2 border-gray-200 rounded-2xl bg-white animate-pulse flex flex-col items-center"
        >
          {/* Avatar */}
          <div className="w-16 h-16 bg-gray-200 rounded-full mb-3" />
          {/* Name */}
          <div className="h-4 bg-gray-200 rounded w-16 mb-1" />
          {/* Role */}
          <div className="h-3 bg-gray-100 rounded w-12" />
        </div>
      ))}
    </>
  );
};
