export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-white border border-gray-200 flex items-center justify-center mb-5 text-3xl">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-xs mb-6 leading-relaxed">{description}</p>
      )}
      {action && action}
    </div>
  );
}
