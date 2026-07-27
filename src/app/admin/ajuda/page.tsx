import { PageHeader } from '@/components/layout/page-header'
import { HelpContent } from '@/components/onboarding/help-content'

export default function AjudaPage() {
  return (
    <div>
      <PageHeader title="Ajuda" description="Guia completo de como usar cada módulo do sistema" />
      <HelpContent />
    </div>
  )
}
