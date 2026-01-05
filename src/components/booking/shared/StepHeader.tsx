import React from 'react';

interface StepHeaderProps {
  title: string;
  className?: string;
}

export const StepHeader = ({ title, className = '' }: StepHeaderProps) => {
  return (
    <div className={`bg-primary text-white w-full px-4 py-3 mb-6 ${className}`}>
      <h2 className="text-base font-semibold tracking-wide">{title}</h2>
    </div>
  );
};
