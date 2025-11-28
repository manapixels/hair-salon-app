interface ServiceStat {
  label: string;
  value: string;
}

interface ServiceStatsProps {
  stats: ServiceStat[];
}

export function ServiceStats({ stats }: ServiceStatsProps) {
  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="grid md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-2">
                  {stat.label}
                </div>
                <div className="text-2xl font-bold text-stone-900">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
