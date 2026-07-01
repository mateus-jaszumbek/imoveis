import Link from 'next/link'
import { Building2 } from 'lucide-react'

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/login" className="flex items-center gap-2 mb-8 text-blue-600 hover:text-blue-700">
          <Building2 className="h-5 w-5" />
          <span className="font-semibold">Locadora de Imóveis</span>
        </Link>
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Política de Privacidade</h1>
          <p className="text-sm text-gray-500 mb-6">Atualizado em junho de 2026</p>

          <div className="prose prose-gray max-w-none text-sm space-y-6">
            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-2">1. Dados Coletados</h2>
              <p className="text-gray-600">Coletamos nome, e-mail, telefone, CPF e documentos comprobatórios (RG, comprovante de renda, extrato bancário) exclusivamente para fins de análise cadastral, seguro-fiança e execução do contrato de locação, em conformidade com a Lei 13.709/2018 (LGPD).</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-2">2. Base Legal</h2>
              <p className="text-gray-600">O tratamento dos seus dados pessoais é fundamentado na execução do contrato de locação (art. 7º, V da LGPD) e, quando aplicável, no consentimento do titular (art. 7º, I).</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-2">3. Armazenamento e Segurança</h2>
              <p className="text-gray-600">Seus dados são armazenados em servidores seguros com criptografia em repouso e em trânsito. Senhas nunca são armazenadas em texto puro. Documentos sensíveis são acessados somente por link temporário e autenticado.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-2">4. Compartilhamento</h2>
              <p className="text-gray-600">Não compartilhamos seus dados com terceiros, exceto quando exigido por lei ou quando necessário para a prestação do serviço (ex.: corretoras de seguro-fiança), sempre com sua ciência.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-2">5. Seus Direitos</h2>
              <p className="text-gray-600">Conforme a LGPD, você tem direito a: confirmar a existência de tratamento; acessar seus dados; corrigir dados incompletos ou desatualizados; solicitar anonimização ou exclusão; revogar o consentimento. Para exercer seus direitos, entre em contato conosco pelo chat do painel.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-2">6. Retenção de Dados</h2>
              <p className="text-gray-600">Dados são mantidos pelo prazo necessário à execução do contrato e cumprimento de obrigações legais. Após o encerramento da locação, documentos são retidos por 5 anos conforme legislação civil e tributária, depois descartados de forma segura.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-2">7. Cookies</h2>
              <p className="text-gray-600">Utilizamos cookies de sessão estritamente necessários para autenticação. Nenhum cookie de rastreamento ou publicidade é utilizado.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-2">8. Contato</h2>
              <p className="text-gray-600">Para dúvidas sobre esta política ou exercício de direitos como titular, utilize o chat no painel ou entre em contato com o Encarregado de Dados pelo e-mail da administradora.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
