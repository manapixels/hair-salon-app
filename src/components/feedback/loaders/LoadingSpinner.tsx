import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Spinner
        className={cn('text-primary', sizeClasses[size])}
        aria-label={message || 'Loading'}
      />
      {message && (
        <p className="text-sm text-gray-600" aria-live="polite">
          {message}
        </p>
      )}
    </div>
  );
};
