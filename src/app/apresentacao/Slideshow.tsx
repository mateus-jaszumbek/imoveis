'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'

type Slide = { id: string; render: () => React.ReactNode }

function ShotSlide({
  eyebrow, title, path, img, alt, bullets,
}: {
  eyebrow: string
  title: React.ReactNode
  path: string
  img: string
  alt: string
  bullets: string[]
}) {
  return (
    <div className="pz-slide-inner">
      <p className="pz-eyebrow">{eyebrow}</p>
      <h2 className="pz-title">{title}</h2>
      <div className="pz-body">
        <div className="pz-copy">
          <ul className="pz-list">
            {bullets.map((b) => <li key={b}>{b}</li>)}
          </ul>
        </div>
        <div className="pz-shot-frame">
          <div className="pz-shot-bar">
            <span /><span /><span />
            <span className="pz-shot-path">{path}</span>
          </div>
          <Image src={img} alt={alt} width={1440} height={900} unoptimized />
        </div>
      </div>
    </div>
  )
}

const slides: Slide[] = [
  {
    id: 'capa',
    render: () => (
      <div className="pz-slide-inner pz-cover">
        <div className="pz-cover-mark">R$</div>
        <p className="pz-eyebrow">Apresentação</p>
        <h1 className="pz-title">Gestão de locação com transparência de verdade para quem tem imóvel com a gente</h1>
        <p className="pz-sub">Um painel só, com o que o proprietário mais pergunta: quanto entrou, quanto saiu e quanto sobrou — mês a mês, sem precisar ligar para saber.</p>
      </div>
    ),
  },
  {
    id: 'problema',
    render: () => (
      <div className="pz-slide-inner">
        <p className="pz-eyebrow">O problema</p>
        <h2 className="pz-title">A maioria das administradoras só manda o boleto. Poucas mostram de onde vem cada real.</h2>
        <div className="pz-body pz-text-only">
          <div className="pz-copy">
            <ul className="pz-list">
              <li>Repasse calculado à mão, muitas vezes sem detalhar despesa por despesa</li>
              <li>Proprietário sem acesso próprio — depende de ligar ou esperar e-mail</li>
              <li>Reajuste anual feito manualmente, às vezes esquecido por meses</li>
              <li>Inquilino sem canal direto: tudo passa por telefone ou WhatsApp pessoal</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'dashboard',
    render: () => (
      <ShotSlide
        eyebrow="Visão geral"
        title="Tudo o que importa, num único painel"
        path="/admin/dashboard"
        img="/apresentacao/admin-dashboard.png"
        alt="Dashboard com total de imóveis, locações ativas, boletos e mensagens"
        bullets={[
          'Total de imóveis, locações ativas e boletos em aberto, sempre atualizados',
          'Boletos pendentes com destaque para quem está próximo do vencimento',
          'Mensagens não lidas de inquilinos, direto na tela inicial',
        ]}
      />
    ),
  },
  {
    id: 'financeiro',
    render: () => (
      <ShotSlide
        eyebrow="Diferencial · Financeiro"
        title={<>Sua administradora sabe quanto <em>fatura</em>. Aqui você sabe quanto <em>lucra</em>.</>}
        path="/admin/financeiro"
        img="/apresentacao/admin-financeiro.png"
        alt="Painel financeiro com faturamento, despesas, lucro líquido e ranking de imóveis"
        bullets={[
          'Faturamento, despesas e lucro líquido — não uma estimativa, o resultado real do mês',
          'Tendência dos últimos 12 meses, com despesas de manutenção e imposto já descontadas',
          'Ranking dos imóveis mais lucrativos e retorno por região, calculado sozinho',
        ]}
      />
    ),
  },
  {
    id: 'repasse',
    render: () => (
      <ShotSlide
        eyebrow="Diferencial · Repasse automático"
        title="O proprietário vê exatamente quanto vai receber, antes mesmo do repasse cair"
        path="/proprietario/repasses"
        img="/apresentacao/proprietario-repasses.png"
        alt="Extrato de repasses do proprietário, mês a mês, com aluguel, despesas e comissão"
        bullets={[
          'Aluguel recebido, despesas do imóvel e comissão da administradora, linha a linha',
          'Histórico mensal completo — sem precisar pedir extrato ou esperar planilha',
          'Repasse líquido calculado automaticamente a partir dos boletos pagos',
        ]}
      />
    ),
  },
  {
    id: 'portal-proprietario',
    render: () => (
      <ShotSlide
        eyebrow="Diferencial · Portal do proprietário"
        title="Um login só seu, com os seus imóveis e nada mais"
        path="/proprietario/meus-imoveis"
        img="/apresentacao/proprietario-meus-imoveis.png"
        alt="Portal do proprietário com a lista de imóveis administrados, aluguel e taxa de administração"
        bullets={[
          'Acesso próprio, separado do painel da administradora',
          'Taxa de administração e inquilino atual, visíveis em cada imóvel',
          'Mesma base de dados do dia a dia — nada é lançado duas vezes',
        ]}
      />
    ),
  },
  {
    id: 'imoveis',
    render: () => (
      <ShotSlide
        eyebrow="Gestão"
        title="Cadastro completo de imóveis, do jeito que a equipe já usa"
        path="/admin/imoveis/[id]"
        img="/apresentacao/admin-imovel-detalhe.png"
        alt="Ficha de um imóvel com informações, valores e locação ativa"
        bullets={[
          'Endereço, valores, fotos e locação ativa numa única ficha',
          'Histórico de despesas lançado direto no imóvel, sem planilha paralela',
          'Base do cálculo financeiro e do repasse ao proprietário',
        ]}
      />
    ),
  },
  {
    id: 'locacoes',
    render: () => (
      <ShotSlide
        eyebrow="Gestão"
        title="Locações ativas e encerradas, sempre à mão"
        path="/admin/locacoes"
        img="/apresentacao/admin-locacoes.png"
        alt="Lista de locações ativas com inquilino, endereço, valor e vencimento"
        bullets={[
          'Contrato, inquilino, valor e dia de vencimento numa única lista',
          'Reajuste automático por IGP-M, IPCA ou INPC — direto da API do Banco Central',
          'Histórico de reajustes aplicados, com valor anterior e novo registrados',
        ]}
      />
    ),
  },
  {
    id: 'boletos',
    render: () => (
      <ShotSlide
        eyebrow="Cobrança"
        title="Boletos por locação, com status sempre em dia"
        path="/admin/boletos"
        img="/apresentacao/admin-boletos.png"
        alt="Lista de boletos com status pago, em aberto e vencido"
        bullets={[
          'Emissão por locação, com valor, vencimento e status automáticos',
          'Pago, em aberto ou vencido — a mesma informação que alimenta o financeiro',
          'Reabertura em um clique quando algo precisa ser corrigido',
        ]}
      />
    ),
  },
  {
    id: 'portal-inquilino',
    render: () => (
      <ShotSlide
        eyebrow="Portal do inquilino"
        title="O inquilino também tem o seu próprio acesso"
        path="/cliente/meu-imovel"
        img="/apresentacao/cliente-meu-imovel.png"
        alt="Portal do inquilino com endereço, valores, contrato e características do imóvel"
        bullets={[
          'Contrato, valores e características do imóvel, sempre à mão',
          'Boletos e documentos próprios, sem precisar pedir por telefone',
          'Menos ligação para a imobiliária, mais autonomia para o inquilino',
        ]}
      />
    ),
  },
  {
    id: 'chat',
    render: () => (
      <ShotSlide
        eyebrow="Relacionamento"
        title="Conversa com o inquilino, dentro do próprio sistema"
        path="/admin/mensagens"
        img="/apresentacao/admin-mensagens.png"
        alt="Chat entre administradora e inquilino sobre manutenção"
        bullets={[
          'Uma conversa por locação, com histórico completo',
          'Sem depender do WhatsApp pessoal de ninguém da equipe',
          'Mensagens não lidas aparecem direto no dashboard',
        ]}
      />
    ),
  },
  {
    id: 'agenda',
    render: () => (
      <ShotSlide
        eyebrow="Operação"
        title="Visitas, entrega e retirada de chaves, sem depender de agenda de papel"
        path="/admin/agenda"
        img="/apresentacao/admin-agenda.png"
        alt="Agenda com visitas e entrega/retirada de chaves"
        bullets={[
          'Visita a imóvel disponível, entrega e retirada de chaves no mesmo lugar',
          'Contato de quem agendou, visível para toda a equipe',
          'Marcar como realizado ou cancelar em um clique',
        ]}
      />
    ),
  },
  {
    id: 'seguranca',
    render: () => (
      <div className="pz-slide-inner">
        <p className="pz-eyebrow">Por trás do painel</p>
        <h2 className="pz-title">Cada imobiliária isolada, com os dados protegidos por padrão</h2>
        <div className="pz-cap-grid">
          <div className="pz-cap">
            <div className="pz-cicon">◈</div>
            <div className="pz-ctitle">Multi-empresa de verdade</div>
            <p className="pz-cdesc">Os dados da sua carteira nunca se misturam com os de outra locadora no mesmo sistema.</p>
          </div>
          <div className="pz-cap">
            <div className="pz-cicon">§</div>
            <div className="pz-ctitle">Conformidade com a LGPD</div>
            <p className="pz-cdesc">Consentimento e direitos do titular tratados dentro do próprio fluxo de cadastro.</p>
          </div>
          <div className="pz-cap">
            <div className="pz-cicon">↻</div>
            <div className="pz-ctitle">Reajuste automático</div>
            <p className="pz-cdesc">IGP-M, IPCA ou INPC calculados a partir da série oficial do Banco Central, sem planilha.</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'fechamento',
    render: () => (
      <div className="pz-slide-inner pz-cover">
        <p className="pz-eyebrow">Próximo passo</p>
        <h2 className="pz-title">Quer ver o painel com os seus próprios imóveis?</h2>
        <p className="pz-sub">É só entrar em contato — a gente configura sua carteira e você acompanha tudo isso a partir dos seus dados reais.</p>
        <div className="pz-price-card">
          <div className="pz-price-value"><span className="pz-price-currency">R$</span>150<span className="pz-price-period">/mês</span></div>
          <p className="pz-price-trial">5 dias grátis para testar</p>
        </div>
      </div>
    ),
  },
]

export default function Slideshow() {
  const [index, setIndex] = useState(0)

  const goTo = useCallback((next: number) => {
    setIndex(Math.max(0, Math.min(slides.length - 1, next)))
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goTo(index + 1) }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(index - 1) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, goTo])

  return (
    <div className="pz-root">
      <div className="pz-topbar">
        <div className="pz-brand">
          <span className="lp-mark">R$</span>
          Locadora<span style={{ color: 'var(--lp-ink-muted)', fontWeight: 400, fontSize: '0.8rem' }}>apresentação</span>
        </div>
        <div className="pz-counter">{index + 1} / {slides.length}</div>
      </div>

      <div className="pz-stage">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className={`pz-slide ${i === index ? 'pz-active' : i < index ? 'pz-prev' : ''}`}
            aria-hidden={i !== index}
          >
            {slide.render()}
          </div>
        ))}
      </div>

      <div className="pz-nav">
        <button className="pz-arrow" onClick={() => goTo(index - 1)} disabled={index === 0}>
          ← Anterior
        </button>
        <div className="pz-dots">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              className={`pz-dot ${i === index ? 'pz-dot-active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Ir para o slide ${i + 1}`}
            />
          ))}
        </div>
        <button
          className="pz-arrow pz-primary"
          onClick={() => goTo(index + 1)}
          disabled={index === slides.length - 1}
        >
          Próximo →
        </button>
      </div>
    </div>
  )
}
