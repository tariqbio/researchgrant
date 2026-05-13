import { formatDistanceToNow, format, differenceInDays } from 'date-fns'

export function formatDeadline(deadline: string | null): string {
  if (!deadline) return 'No deadline'
  return format(new Date(deadline), 'd MMMM yyyy')
}

export function deadlineDaysLeft(deadline: string | null): number | null {
  if (!deadline) return null
  return Math.max(0, differenceInDays(new Date(deadline), new Date()))
}

export function deadlineUrgency(days: number | null): 'urgent' | 'soon' | 'ok' | 'none' {
  if (days === null) return 'none'
  if (days <= 7) return 'urgent'
  if (days <= 30) return 'soon'
  return 'ok'
}

export const urgencyClasses: Record<string, string> = {
  urgent: 'bg-red-100 text-red-800',
  soon: 'bg-amber-100 text-amber-800',
  ok: 'bg-green-100 text-green-800',
  none: 'bg-gray-100 text-gray-600',
}

export function formatFunding(min: number | null, max: number | null, currency = 'BDT'): string {
  const symbol = currency === 'BDT' ? '৳' : '$'
  const fmt = (n: number) => {
    if (n >= 10_00_000) return `${(n / 10_00_000).toFixed(1)}M`
    if (n >= 1_00_000) return `${(n / 1_00_000).toFixed(1)}L`
    return n.toLocaleString()
  }
  if (min && max) return `${symbol}${fmt(min)} – ${symbol}${fmt(max)}`
  if (max) return `Up to ${symbol}${fmt(max)}`
  if (min) return `From ${symbol}${fmt(min)}`
  return 'Not specified'
}

export function formatRelativeTime(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
}

export function slugToLabel(slug: string): string {
  return slug.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function clsx(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
