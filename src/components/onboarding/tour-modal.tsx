'use client'
import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { TOUR_STEPS } from '@/lib/onboarding-content'
import { cn } from '@/lib/utils'

export function TourModal({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState(0)
  const isLast = step === TOUR_STEPS.length - 1
  const current = TOUR_STEPS[step]
  const Icon = current.icon

  return (
    <Modal open onClose={onFinish}>
      <div className="flex flex-col items-center text-center gap-4 py-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{current.title}</h2>
          <p className="mt-2 text-sm text-gray-600">{current.body}</p>
        </div>
        <div className="flex items-center gap-1.5 py-1">
          {TOUR_STEPS.map((s, i) => (
            <span
              key={s.id}
              className={cn('h-1.5 rounded-full transition-all', i === step ? 'w-4 bg-blue-600' : 'w-1.5 bg-gray-200')}
            />
          ))}
        </div>
        <div className="flex w-full items-center justify-between gap-3 pt-2">
          <Button variant="ghost" size="sm" onClick={onFinish}>
            Pular
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={() => setStep(s => s - 1)}>
                Anterior
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => (isLast ? onFinish() : setStep(s => s + 1))}
            >
              {isLast ? 'Concluir' : 'Próximo'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
