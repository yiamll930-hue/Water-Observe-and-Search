import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  meta?: ReactNode
  actions?: ReactNode
  as?: 'h1' | 'h2'
}

// 页面抬头 — 标题、口径说明与操作区
export default function PageHeader({
  title,
  description,
  meta,
  actions,
  as: Heading = 'h1',
}: PageHeaderProps) {
  return (
    <header className="page-head">
      <div className="page-heading">
        <div className="page-title">
          <Heading>{title}</Heading>
        </div>
        {description && <p className="page-sub">{description}</p>}
        {meta && <div className="meta-strip" style={{ marginTop: 10 }}>{meta}</div>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  )
}
