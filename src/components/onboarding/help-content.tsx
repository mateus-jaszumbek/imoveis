'use client'
import { useState } from 'react'
import { ChevronDown, PlayCircle, MessageCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TourModal } from '@/components/onboarding/tour-modal'
import { HELP_SECTIONS, SUPORTE } from '@/lib/onboarding-content'
import { cn } from '@/lib/utils'

export function HelpContent() {
  const [aberta, setAberta] = useState<string | null>(HELP_SECTIONS[0]?.id ?? null)
  const [tourAberto, setTourAberto] = useState(false)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-4 flex flex-col justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">Central de Ajuda</p>
            <p className="text-sm text-gray-600 mt-1">Quer rever a explicação inicial do sistema, com os módulos principais?</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setTourAberto(true)} className="self-start">
            <PlayCircle className="h-4 w-4" />
            Rever tour guiado
          </Button>
        </Card>

        <Card className="p-4 flex flex-col justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">Fale com o suporte</p>
            <p className="text-sm text-gray-600 mt-1">Ficou com alguma dúvida que o manual não resolveu? Chame direto no WhatsApp: {SUPORTE.telefoneFormatado}.</p>
          </div>
          <a href={SUPORTE.whatsappUrl} target="_blank" rel="noopener noreferrer" className="self-start">
            <Button variant="default" size="sm">
              <MessageCircle className="h-4 w-4" />
              Chamar no WhatsApp
            </Button>
          </a>
        </Card>
      </div>

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
