import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  loadingText = 'Loading...',
  children,
  disabled,
  className,
  ...props
}) => {
  return (
    <Button disabled={disabled || loading} className={className} {...props}>
      {loading ? (
        <>
          <Spinner className="mr-2 h-4 w-4" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
};
