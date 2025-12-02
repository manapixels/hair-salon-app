'use client';

import * as Progress from '@radix-ui/react-progress';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookingProgressProps {
  currentStep: number;
  totalSteps?: number;
  className?: string;
}

export function BookingProgress({ currentStep, totalSteps = 4, className }: BookingProgressProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className={cn('w-full flex flex-col items-center', className)}>
      <div className="relative w-full max-w-md">
        {/* Progress Bar */}
        <Progress.Root
          className="relative h-1 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
          value={progress}
        >
          <Progress.Indicator
            className="h-full w-full flex-1 bg-stone-900 transition-all duration-500 ease-in-out dark:bg-white"
            style={{ transform: `translateX(-${100 - progress}%)` }}
          />
        </Progress.Root>

        {/* Step Circles */}
        <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 flex justify-between px-0.5">
          {Array.from({ length: totalSteps }).map((_, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber <= currentStep;
            const isCompleted = stepNumber < currentStep;

            return (
              <div
                key={stepNumber}
                className={cn(
                  'relative flex h-4 w-4 items-center justify-center rounded-full border-2 transition-all duration-300',
                  isActive
                    ? 'border-stone-900 bg-white dark:border-white dark:bg-stone-900'
                    : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800',
                  isCompleted && 'bg-stone-900 border-stone-900 dark:bg-white dark:border-white',
                )}
              >
                {isCompleted && (
                  <Check className="h-2.5 w-2.5 text-white dark:text-stone-900" strokeWidth={3} />
                )}
                {isActive && !isCompleted && (
                  <div className="h-1.5 w-1.5 rounded-full bg-stone-900 dark:bg-white" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
