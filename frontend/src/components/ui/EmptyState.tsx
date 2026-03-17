interface EmptyStateProps {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  icon?: string // SVG path d attribute
}

function DefaultIcon() {
  return (
    <svg
      width={48}
      height={48}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-gray-300 dark:text-gray-600"
    >
      <path d="M9 17H5a2 2 0 00-2 2v1h18v-1a2 2 0 00-2-2h-4M9 17V9m0 8h6m0-8V9m0 8M3 9h18M9 9a3 3 0 116 0" />
    </svg>
  )
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-4">
      {icon ? (
        <svg
          width={48}
          height={48}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gray-300 dark:text-gray-600"
        >
          <path d={icon} />
        </svg>
      ) : (
        <DefaultIcon />
      )}
      <div className="space-y-1">
        <p className="text-base font-semibold text-gray-700 dark:text-gray-300">{title}</p>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">{description}</p>
        )}
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
