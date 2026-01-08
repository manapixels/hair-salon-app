import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';

export default function Loading() {
  return (
    <div className="flex h-[50vh] w-full items-center justify-center">
      <LoadingSpinner size="lg" message="Loading admin resources..." />
    </div>
  );
}
