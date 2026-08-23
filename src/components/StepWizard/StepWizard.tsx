import type { ReactNode } from 'react'
import styles from './StepWizard.module.css'

interface Step {
  label: string
  content: ReactNode
}

interface StepWizardProps {
  steps: Step[]
  current: number
}

export default function StepWizard({ steps, current }: StepWizardProps) {
  return (
    <div>
      <div className={styles.steps}>
        {steps.map((s, i) => (
          <div
            key={i}
            className={`${styles.step} ${i === current ? styles.active : ''} ${i < current ? styles.done : ''}`}
          >
            <span className={styles.stepNum}>{i < current ? '✓' : i + 1}</span>
            {s.label}
          </div>
        ))}
      </div>
    </div>
  )
}
