interface MaintenanceTipProps {
  title: string;
  text: string;
}

export function MaintenanceTip({ title, text }: MaintenanceTipProps) {
  return (
    <div className="bg-stone-50 p-6 rounded-lg">
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-stone-600">{text}</p>
    </div>
  );
}
