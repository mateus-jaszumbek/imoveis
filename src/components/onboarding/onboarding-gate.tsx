'use client'
import { useState } from 'react'
import { TourModal } from '@/components/onboarding/tour-modal'

export function OnboardingGate({ completo }: { completo: boolean }) {
  const [dispensado, setDispensado] = useState(false)

  if (completo || dispensado) return null

  async function finalizar() {
    setDispensado(true)
    try {
      await fetch('/api/onboarding/completar', { method: 'POST' })
    } catch {
      // Se a chamada falhar, o tour só reaparece no próximo login — sem impacto no uso do painel.
    }
  }

  return <TourModal onFinish={finalizar} />
}
