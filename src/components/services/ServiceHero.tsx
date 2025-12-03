import { Badge } from '@/components/ui/badge';

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
      className="relative h-[80vh] md:h-[60vh] lg:h-[70vh] flex items-center justify-center text-center bg-cover bg-center"
      style={{ backgroundImage: `url('${backgroundImage}')` }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-6 pt-[20vh]">
        <Badge variant="default" className="mb-4 md:mb-6 text-sm md:text-base">
          {badge.text}
        </Badge>
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6 whitespace-pre-line leading-tight">
          {headline}
        </h1>
        <p className="text-base md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
          {subheading}
        </p>
      </div>
    </section>
  );
}
