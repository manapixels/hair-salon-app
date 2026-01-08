import Image from 'next/image';

interface ServiceStat {
  label: string;
  value: string;
}

interface ServiceStatsProps {
  stats: ServiceStat[];
}

export function ServiceStats({ stats }: ServiceStatsProps) {
  return (
    <section className="py-8 md:py-16 px-4 md:px-6 -mt-20 relative z-10">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl border border-primary/40 p-6 md:p-8 relative overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 relative z-10">
            {stats.map((stat, index) => (
              <div key={index} className="text-right md:text-center">
                <div className="text-xs text-stone-500 uppercase tracking-widest mb-2">
                  {stat.label}
                </div>
                <div className="text-md md:text-lg font-medium text-stone-600">{stat.value}</div>
              </div>
            ))}
          </div>
          <div className="w-[170px] h-[150px] md:w-[100px] md:h-[85px] absolute -bottom-2 -left-2">
            <Image
              src="/images/peony-line-illustration.jpg"
              alt="Peony Line Illustration"
              fill
              className="object-cover pointer-events-none"
              sizes="(max-width: 768px) 170px, 100px"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
