export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-[#151921] border border-[#21262E] flex items-center justify-center mb-5 text-3xl">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-[#E8ECF1] mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-[#8B95A5] max-w-xs mb-6 leading-relaxed">{description}</p>
      )}
      {action && action}
    </div>
  );
}
