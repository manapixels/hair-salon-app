interface SkeletonLoaderProps {
  count?: number;
  height?: string;
  className?: string;
  variant?: 'text' | 'card' | 'avatar' | 'image';
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  count = 1,
  height = 'h-12',
  className = '',
  variant = 'text',
}) => {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg';

  const variantClasses = {
    text: 'w-full',
    card: 'w-full p-4',
    avatar: 'w-12 h-12 rounded-full',
    image: 'w-full aspect-video',
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${baseClasses} ${variantClasses[variant]} ${height} ${className}`}
          aria-hidden="true"
        />
      ))}
    </>
  );
};
