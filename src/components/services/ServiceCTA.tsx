import { ServiceBookingWrapper } from '@/components/services';

interface ServiceCTAProps {
  title: string;
  description: string;
  serviceName: string;
}

export function ServiceCTA({ title, description, serviceName }: ServiceCTAProps) {
  return (
    <section className="py-20 px-4 bg-stone-900 text-white">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl font-bold mb-6">{title}</h2>
        <p className="text-xl mb-8 text-stone-300">{description}</p>
        <ServiceBookingWrapper serviceName={serviceName} />
      </div>
    </section>
  );
}
