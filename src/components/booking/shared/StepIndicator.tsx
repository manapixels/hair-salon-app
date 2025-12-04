'use client';

import { memo } from 'react';
import { Check } from 'lucide-react';

export interface Step {
  number: number;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
}

interface StepIndicatorProps {
  steps: Step[];
  className?: string;
}

/**
 * Visual progress indicator for multi-step forms
 * Optimized for mobile with large touch targets and clear visual feedback
 */
export const StepIndicator = memo(function StepIndicator({
  steps,
  className = '',
}: StepIndicatorProps) {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;

          return (
            <div key={step.number} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    flex items-center justify-center
                    w-10 h-10 rounded-full font-semibold text-sm
                    transition-all duration-300
                    ${
                      step.isActive
                        ? 'bg-primary text-white shadow-lg scale-110'
                        : step.isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                    }
                  `}
                >
                  {step.isCompleted ? <Check className="h-5 w-5" /> : <span>{step.number}</span>}
                </div>

                {/* Step Label (hidden on very small screens) */}
                <span
                  className={`
                    hidden sm:block text-xs mt-2 font-medium text-center
                    transition-colors duration-300
                    ${
                      step.isActive
                        ? 'text-primary'
                        : step.isCompleted
                          ? 'text-green-600'
                          : 'text-gray-500'
                    }
                  `}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector Line */}
              {!isLast && (
                <div className="flex-1 mx-2">
                  <div
                    className={`
                      h-1 rounded-full transition-all duration-300
                      ${step.isCompleted ? 'bg-green-500' : 'bg-gray-200'}
                    `}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile-only current step label */}
      <div className="sm:hidden mt-4 text-center">
        <p className="text-sm font-medium text-primary">{steps.find(s => s.isActive)?.label}</p>
        <p className="text-xs text-gray-500 mt-1">
          Step {steps.find(s => s.isActive)?.number} of {steps.length}
        </p>
      </div>
    </div>
  );
});

/**
 * Simplified step indicator that creates steps from current step number
 */
export const SimpleStepIndicator = memo(function SimpleStepIndicator({
  currentStep,
  totalSteps,
  stepLabels,
  className = '',
}: {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
  className?: string;
}) {
  const steps: Step[] = Array.from({ length: totalSteps }, (_, i) => ({
    number: i + 1,
    label: stepLabels[i] || `Step ${i + 1}`,
    isActive: i + 1 === currentStep,
    isCompleted: i + 1 < currentStep,
  }));

  return <StepIndicator steps={steps} className={className} />;
});
