import { CircleCheck, Loader, Clock, XCircle } from 'lucide-react'
import styles from './TaskTable.module.css'

export interface TaskRow {
  id: string
  type: 'extract'
  name: string
  status: 'pending' | 'running' | 'done' | 'fail'
  createdAt: string
  duration: string
}

interface Props {
  tasks: TaskRow[]
}

// 任务类型标签
const TYPE_LABEL: Record<string, string> = { extract: '提取' }

// 状态指示器
function StatusIcon({ status }: { status: TaskRow['status'] }) {
  const cls = styles[status]
  switch (status) {
    case 'done':
      return <span className={cls}><CircleCheck size={14} /> 完成</span>
    case 'running':
      return <span className={cls}><Loader size={14} className={styles.spin} /> 运行中</span>
    case 'pending':
      return <span className={cls}><Clock size={14} /> 等待中</span>
    case 'fail':
      return <span className={cls}><XCircle size={14} /> 失败</span>
  }
}

export default function TaskTable({ tasks }: Props) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>任务 ID</th>
          <th>类型</th>
          <th>名称</th>
          <th>状态</th>
          <th>创建时间</th>
          <th>耗时</th>
        </tr>
      </thead>
      <tbody>
        {tasks.map((t) => (
          <tr key={t.id}>
            <td className={styles.mono}>{t.id}</td>
            <td>{TYPE_LABEL[t.type]}</td>
            <td>{t.name}</td>
            <td><StatusIcon status={t.status} /></td>
            <td className={styles.muted}>{t.createdAt}</td>
            <td className={styles.muted}>{t.duration}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
