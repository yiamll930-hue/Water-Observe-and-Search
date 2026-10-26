import type { ReactNode } from 'react'

interface PanelProps {
  title?: ReactNode
  subtitle?: ReactNode
  icon?: ReactNode
  tools?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
  flush?: boolean
  ariaLabel?: string
}

// 学术面板 — 统一标题、工具与内容区
export default function Panel({
  title,
  subtitle,
  icon,
  tools,
  footer,
  children,
  className,
  bodyClassName,
  flush = false,
  ariaLabel,
}: PanelProps) {
  return (
    <section className={['panel', className].filter(Boolean).join(' ')} aria-label={ariaLabel}>
      {(title || tools) && (
        <header className="panel-head">
          <div className="panel-title">
            {icon}
            <span>{title}</span>
            {subtitle && <span className="panel-sub">{subtitle}</span>}
          </div>
          {tools && <div className="panel-tools">{tools}</div>}
        </header>
      )}
      <div className={`${flush ? 'panel-body-flush' : 'panel-body'} ${bodyClassName ?? ''}`.trim()}>
        {children}
      </div>
      {footer && <footer className="panel-foot">{footer}</footer>}
    </section>
  )
}
