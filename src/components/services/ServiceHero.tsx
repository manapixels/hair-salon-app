import { Badge } from '@/components/ui/Badge';

interface ServiceHeroProps {
  backgroundImage: string;
  badge: {
    text: string;
    color?: string; // Optional, not used by Badge component
  };
  headline: string;
  subheading: string;
}

export function ServiceHero({ backgroundImage, badge, headline, subheading }: ServiceHeroProps) {
  return (
    <section
      className="relative h-[70vh] flex items-center justify-center text-center bg-cover bg-center"
      style={{ backgroundImage: `url('${backgroundImage}')` }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 max-w-4xl mx-auto px-4">
        <Badge variant="accent" className="mb-6 text-base">
          {badge.text}
        </Badge>
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 whitespace-pre-line">
          {headline}
        </h1>
        <p className="text-xl text-white/90 max-w-2xl mx-auto">{subheading}</p>
      </div>
    </section>
  );
}
