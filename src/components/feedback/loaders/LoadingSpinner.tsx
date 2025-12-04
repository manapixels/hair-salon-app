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
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-4',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div
        className={`animate-spin rounded-full border-gray-200 border-t-primary ${sizeClasses[size]}`}
        role="status"
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
