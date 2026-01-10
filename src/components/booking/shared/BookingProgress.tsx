import { Progress } from '@/components/ui/progress';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookingProgressProps {
  currentStep: number;
  totalSteps?: number;
  className?: string;
  isAllComplete?: boolean; // When true, all steps show checkmarks
}

export function BookingProgress({
  currentStep,
  totalSteps = 4,
  className,
  isAllComplete = false,
}: BookingProgressProps) {
  const progress = isAllComplete ? 100 : (currentStep / totalSteps) * 100;

  return (
    <div className={cn('w-full flex flex-col items-center', className)}>
      <div className="relative w-full max-w-md">
        {/* Progress Bar */}
        <Progress value={progress} className="h-1 bg-gray-200" />

        {/* Step Circles */}
        <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 flex justify-between px-0.5">
          {Array.from({ length: totalSteps }).map((_, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber <= currentStep || isAllComplete;
            const isCompleted = stepNumber < currentStep || isAllComplete;

            return (
              <div
                key={stepNumber}
                className={cn(
                  'relative flex h-4 w-4 items-center justify-center rounded-full border-2 transition-all duration-300',
                  isActive ? 'border-stone-900 bg-white' : 'border-gray-300 bg-white',
                  isCompleted && 'bg-stone-900 border-stone-900',
                )}
              >
                {isCompleted && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                {isActive && !isCompleted && (
                  <div className="h-1.5 w-1.5 rounded-full bg-stone-900" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
