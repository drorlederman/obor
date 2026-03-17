import type { BookingType } from '@/types'

const TYPE_CONFIG: Record<
  BookingType,
  { label: string; bg: string; text: string }
> = {
  private_sail: {
    label: 'שיט פרטי',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
  },
  partner_sail: {
    label: 'שיט משותף',
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
  },
  marina_use: {
    label: 'שימוש בעגינה',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-300',
  },
  maintenance_block: {
    label: 'חסימת תחזוקה',
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
  },
}

export const BOOKING_TYPE_DOT: Record<BookingType, string> = {
  private_sail: 'bg-blue-500',
  partner_sail: 'bg-green-500',
  marina_use: 'bg-orange-500',
  maintenance_block: 'bg-red-500',
}

export const BOOKING_TYPE_LABELS: Record<BookingType, string> = Object.fromEntries(
  Object.entries(TYPE_CONFIG).map(([k, v]) => [k, v.label]),
) as Record<BookingType, string>

interface Props {
  type: BookingType
  size?: 'sm' | 'md'
}

export default function BookingTypeChip({ type, size = 'md' }: Props) {
  const cfg = TYPE_CONFIG[type]
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${cfg.bg} ${cfg.text} ${
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'
      }`}
    >
      {cfg.label}
    </span>
  )
}
