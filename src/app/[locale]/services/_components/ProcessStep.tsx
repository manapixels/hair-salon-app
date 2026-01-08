type ColorScheme = 'primary' | 'amber' | 'teal' | 'rose';

interface ProcessStepProps {
  number: string;
  title: string;
  description: string;
  colorScheme?: ColorScheme;
}

const colorClasses: Record<ColorScheme, string> = {
  primary: 'bg-primary',
  amber: 'bg-amber-500',
  teal: 'bg-teal-500',
  rose: 'bg-rose-500',
};

export function ProcessStep({
  number,
  title,
  description,
  colorScheme = 'primary',
}: ProcessStepProps) {
  return (
    <div className="flex gap-6">
      <div
        className={`${colorClasses[colorScheme]} text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg flex-shrink-0`}
      >
        {number}
      </div>
      <div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-stone-600">{description}</p>
      </div>
    </div>
  );
}
