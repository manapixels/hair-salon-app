import Image from 'next/image';

interface ServiceTypeCardProps {
  title: string;
  description: string;
  image: string;
}

export function ServiceTypeCard({ title, description, image }: ServiceTypeCardProps) {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-base-primary/40 active-scale transition-all duration-300 hover:-translate-y-1">
      <div className="relative h-48 md:h-64">
        <Image src={image} alt={title} fill className="object-cover" />
      </div>
      <div className="p-5 md:p-6">
        <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">{title}</h3>
        <p className="text-stone-600 text-sm md:text-base">{description}</p>
      </div>
    </div>
  );
}
