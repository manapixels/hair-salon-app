import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  count?: number;
  height?: string;
  className?: string;
  variant?: 'text' | 'card' | 'avatar' | 'image';
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  count = 1,
  height = 'h-12',
  className = '',
  variant = 'text',
}) => {
  const variantClasses = {
    text: 'w-full',
    card: 'w-full p-4',
    avatar: 'w-12 h-12 rounded-full',
    image: 'w-full aspect-video',
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={cn(variantClasses[variant], height, className)} />
      ))}
    </>
  );
};
