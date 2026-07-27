'use client'
import { useState } from 'react'
import { ChevronDown, PlayCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TourModal } from '@/components/onboarding/tour-modal'
import { HELP_SECTIONS } from '@/lib/onboarding-content'
import { cn } from '@/lib/utils'

export function HelpContent() {
  const [aberta, setAberta] = useState<string | null>(HELP_SECTIONS[0]?.id ?? null)
  const [tourAberto, setTourAberto] = useState(false)

  return (
    <div className="space-y-4">
      <Card className="p-4 flex items-center justify-between gap-4">
        <p className="text-sm text-gray-600">
          Quer rever a explicação inicial do sistema, com os módulos principais?
        </p>
        <Button variant="outline" size="sm" onClick={() => setTourAberto(true)}>
          <PlayCircle className="h-4 w-4" />
          Rever tour guiado
        </Button>
      </Card>

      <div className="space-y-2">
        {HELP_SECTIONS.map(section => {
          const Icon = section.icon
          const aberto = aberta === section.id
          return (
            <Card key={section.id} className="overflow-hidden">
              <button
                onClick={() => setAberta(aberto ? null : section.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <Icon className="h-4 w-4 shrink-0 text-blue-600" />
                <span className="flex-1 text-sm font-semibold text-gray-900">{section.title}</span>
                <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform', aberto && 'rotate-180')} />
              </button>
              {aberto && (
                <div className="space-y-2 border-t border-gray-100 px-4 py-3">
                  {section.paragraphs.map((p, i) => (
                    <p key={i} className="text-sm text-gray-600">{p}</p>
                  ))}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {tourAberto && <TourModal onFinish={() => setTourAberto(false)} />}
    </div>
  )
}
