import Image from 'next/image';

interface ServiceTypeCardProps {
  title: string;
  description: string;
  image: string;
}

export function ServiceTypeCard({ title, description, image }: ServiceTypeCardProps) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
      <div className="relative h-64">
        <Image src={image} alt={title} fill className="object-cover" />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-stone-600">{description}</p>
      </div>
    </div>
  );
}
