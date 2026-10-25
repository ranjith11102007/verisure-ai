import type { ReactNode } from 'react'

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
}: {
  title: string
  subtitle?: string
  eyebrow?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        {eyebrow && (
          <div className="flex items-center gap-2 text-on-surface-variant text-xs uppercase tracking-wider mb-1">
            {eyebrow}
          </div>
        )}
        <h1 className="text-2xl font-headline font-bold text-on-surface">{title}</h1>
        {subtitle && <p className="text-sm text-on-surface-variant mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Card({
  children,
  className = '',
  padded = true,
}: {
  children: ReactNode
  className?: string
  padded?: boolean
}) {
  return (
    <div
      className={`bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 ${
        padded ? 'p-6' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}

export function StatCard({
  label,
  value,
  icon,
  hint,
  loading,
}: {
  label: string
  value: ReactNode
  icon: string
  hint?: string
  loading?: boolean
}) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/20">
      <div className="flex items-start justify-between">
        <div className="text-xs uppercase tracking-wider text-outline">{label}</div>
        <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
      </div>
      <div className="mt-4 text-3xl font-headline font-bold text-on-surface">
        {loading ? '-' : value}
      </div>
      {hint && <div className="mt-1 text-xs text-on-surface-variant">{hint}</div>}
    </div>
  )
}

const badgeStyles: Record<string, string> = {
  draft: 'bg-surface-container text-on-surface-variant',
  submitted: 'bg-primary-fixed text-on-primary-fixed-variant',
  processing: 'bg-surface-container-high text-on-surface',
  under_review: 'bg-secondary-container/40 text-on-secondary-container',
  more_info_required: 'bg-error-container/40 text-on-error-container',
  approved: 'bg-secondary-fixed/60 text-on-secondary-fixed-variant',
  rejected: 'bg-error-container text-on-error-container',
  archived: 'bg-surface-container text-outline',
  pending: 'bg-surface-container-high text-on-surface',
  accepted: 'bg-secondary-fixed/60 text-on-secondary-fixed-variant',
  rejected_finding: 'bg-error-container text-on-error-container',
  resolved: 'bg-secondary-fixed/60 text-on-secondary-fixed-variant',
  uploaded: 'bg-primary-fixed text-on-primary-fixed-variant',
  extracted: 'bg-secondary-fixed/60 text-on-secondary-fixed-variant',
  low: 'bg-surface-container text-on-surface-variant',
  medium: 'bg-primary-fixed text-on-primary-fixed-variant',
  high: 'bg-error-container/40 text-on-error-container',
  critical: 'bg-error-container text-on-error-container',
}

export function StatusBadge({ status }: { status?: string }) {
  const key = (status || 'draft').toLowerCase()
  const style = badgeStyles[key] || 'bg-surface-container text-on-surface-variant'
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize ${style}`}>
      {(status || '-').replace(/_/g, ' ')}
    </span>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="text-center py-12 text-on-surface-variant">
      <span className="material-symbols-outlined text-4xl mb-2 block">{icon}</span>
      <p className="font-medium text-on-surface">{title}</p>
      {description && <p className="text-sm mt-1 max-w-md mx-auto">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}

export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-error/30 bg-error-container/30 px-4 py-3">
      <div className="flex items-start gap-2 text-sm text-on-error-container">
        <span className="material-symbols-outlined text-[18px]">error</span>
        <span>{message}</span>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="text-xs font-medium text-primary hover:underline whitespace-nowrap">
          Retry
        </button>
      )}
    </div>
  )
}

export function PrimaryButton({
  children,
  onClick,
  type = 'button',
  disabled,
  icon,
}: {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
  icon?: string
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-primary text-on-primary hover:bg-primary-container disabled:opacity-50 text-sm shadow-sm"
    >
      {icon && <span className="material-symbols-outlined text-[18px]">{icon}</span>}
      {children}
    </button>
  )
}

export function SecondaryButton({
  children,
  onClick,
  type = 'button',
  disabled,
  icon,
}: {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
  icon?: string
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-surface-container text-on-surface hover:bg-surface-container-high disabled:opacity-50 text-sm"
    >
      {icon && <span className="material-symbols-outlined text-[18px]">{icon}</span>}
      {children}
    </button>
  )
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: ReactNode
  hint?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-on-surface mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-on-surface-variant mt-1">{hint}</p>}
    </div>
  )
}

export const inputClass =
  'w-full h-9 px-3 rounded border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-1 focus:ring-primary text-sm'
