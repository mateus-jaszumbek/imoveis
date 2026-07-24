import Link from 'next/link'
import type { Metadata } from 'next'
import './page.css'

export const metadata: Metadata = {
  title: 'Locadora — Painel de gestão para imobiliárias',
  description: 'Faturamento, despesas e retorno por imóvel, tipo e região — controle financeiro completo para quem administra locação de imóveis.',
}

export default function Home() {
  return (
    <div className="lp-root">
      <div className="lp-ledger">
        <div className="lp-shell">

          <header className="lp-top">
            <div className="lp-brand">
              <span className="lp-mark">R$</span>
              Locadora<span className="lp-tag">painel de gestão</span>
            </div>
          </header>

          <section className="lp-hero" style={{ borderTop: 'none' }}>
            <p className="lp-eyebrow">Novo módulo · Controle Financeiro</p>
            <h1 className="lp-headline">
              Sua imobiliária já sabe quanto <em>fatura</em>.<br />
              Agora vai saber quanto realmente <em>lucra</em>.
            </h1>
            <p className="lp-sub">
              Boletos recebidos, despesas por imóvel e retorno por tipo e por região — tudo num único painel,
              calculado automaticamente a partir dos contratos e cobranças que você já cadastra no sistema.
              Sem planilha paralela, sem fechamento manual de mês.
            </p>
            <div className="lp-hero-ctas">
              <Link href="/cadastro" className="lp-btn lp-btn-brass">Criar minha conta</Link>
              <Link href="/login" className="lp-btn lp-btn-ghost">Já uso o sistema — Entrar</Link>
            </div>

            {/* Dashboard mockup — ilustrativo, com números fictícios para demonstração */}
            <div className="lp-mock-wrap">
              <div className="lp-mock-titlebar">
                <span className="lp-name">Financeiro</span>
                <span className="lp-path lp-tabular">/admin/financeiro</span>
              </div>

              <div className="lp-kpi-row">
                <div className="lp-kpi"><div className="lp-label">Faturamento do mês</div><div className="lp-value lp-tabular">R$ 84.230</div></div>
                <div className="lp-kpi"><div className="lp-label">Despesas do mês</div><div className="lp-value lp-tabular">R$ 11.940</div></div>
                <div className="lp-kpi"><div className="lp-label">Lucro líquido</div><div className="lp-value lp-tabular lp-good">R$ 72.290</div></div>
                <div className="lp-kpi"><div className="lp-label">Boletos recebidos</div><div className="lp-value lp-tabular">57</div></div>
                <div className="lp-kpi"><div className="lp-label">Inadimplência</div><div className="lp-value lp-tabular lp-good">3,2%</div></div>
              </div>

              <div className="lp-chart-block">
                <div className="lp-panel">
                  <div className="lp-ptitle">Faturamento, despesas e lucro — últimos 12 meses</div>
                  <svg viewBox="0 0 420 120" width="100%" height="120" preserveAspectRatio="none" role="img" aria-label="Gráfico de tendência mensal de faturamento, despesas e lucro">
                    <line x1="0" y1="30" x2="420" y2="30" stroke="var(--lp-rule)" strokeWidth="1" />
                    <line x1="0" y1="60" x2="420" y2="60" stroke="var(--lp-rule)" strokeWidth="1" />
                    <line x1="0" y1="90" x2="420" y2="90" stroke="var(--lp-rule)" strokeWidth="1" />
                    <g fill="var(--lp-brass)" opacity="0.9">
                      <rect x="6" y="58" width="16" height="52" rx="2" />
                      <rect x="41" y="50" width="16" height="60" rx="2" />
                      <rect x="76" y="62" width="16" height="48" rx="2" />
                      <rect x="111" y="44" width="16" height="66" rx="2" />
                      <rect x="146" y="40" width="16" height="70" rx="2" />
                      <rect x="181" y="52" width="16" height="58" rx="2" />
                      <rect x="216" y="36" width="16" height="74" rx="2" />
                      <rect x="251" y="30" width="16" height="80" rx="2" />
                      <rect x="286" y="34" width="16" height="76" rx="2" />
                      <rect x="321" y="24" width="16" height="86" rx="2" />
                      <rect x="356" y="20" width="16" height="90" rx="2" />
                      <rect x="391" y="14" width="16" height="96" rx="2" />
                    </g>
                    <g fill="var(--lp-red)" opacity="0.75">
                      <rect x="6" y="102" width="16" height="8" rx="1.5" />
                      <rect x="41" y="100" width="16" height="10" rx="1.5" />
                      <rect x="76" y="103" width="16" height="7" rx="1.5" />
                      <rect x="111" y="98" width="16" height="12" rx="1.5" />
                      <rect x="146" y="96" width="16" height="14" rx="1.5" />
                      <rect x="181" y="101" width="16" height="9" rx="1.5" />
                      <rect x="216" y="95" width="16" height="15" rx="1.5" />
                      <rect x="251" y="93" width="16" height="17" rx="1.5" />
                      <rect x="286" y="97" width="16" height="13" rx="1.5" />
                      <rect x="321" y="90" width="16" height="20" rx="1.5" />
                      <rect x="356" y="88" width="16" height="22" rx="1.5" />
                      <rect x="391" y="85" width="16" height="25" rx="1.5" />
                    </g>
                    <polyline points="14,52 49,44 84,55 119,38 154,33 189,45 224,29 259,23 294,27 329,17 364,13 399,8"
                      fill="none" stroke="var(--lp-green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="399" cy="8" r="3.2" fill="var(--lp-green)" />
                  </svg>
                  <div className="lp-legend-row">
                    <span><i className="lp-dot" style={{ background: 'var(--lp-brass)' }} />Faturamento</span>
                    <span><i className="lp-dot" style={{ background: 'var(--lp-red)' }} />Despesas</span>
                    <span><i className="lp-dot" style={{ background: 'var(--lp-green)' }} />Lucro líquido</span>
                  </div>
                </div>

                <div className="lp-panel">
                  <div className="lp-ptitle">Imóveis mais lucrativos</div>
                  <div className="lp-rank-row">
                    <div><div className="lp-addr">Rua Aimberê, 210</div><div className="lp-bar" style={{ width: '88%' }} /></div>
                    <div className="lp-figs lp-tabular">R$ 6.140</div>
                  </div>
                  <div className="lp-rank-row">
                    <div><div className="lp-addr">Av. Higienópolis, 88</div><div className="lp-bar" style={{ width: '74%' }} /></div>
                    <div className="lp-figs lp-tabular">R$ 5.120</div>
                  </div>
                  <div className="lp-rank-row">
                    <div><div className="lp-addr">Rua Pamplona, 512</div><div className="lp-bar" style={{ width: '61%' }} /></div>
                    <div className="lp-figs lp-tabular">R$ 4.380</div>
                  </div>
                  <div className="lp-rank-row">
                    <div><div className="lp-addr">Sala 14, Ed. Delta</div><div className="lp-bar" style={{ width: '44%' }} /></div>
                    <div className="lp-figs lp-tabular">R$ 3.010</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="lp-section">
            <div className="lp-section-head">
              <p className="lp-eyebrow">O problema</p>
              <h2 className="lp-section-title">A maioria das imobiliárias sabe o total do mês. Poucas sabem de onde vem o lucro.</h2>
              <p className="lp-desc">Boleto pago é só metade da conta — manutenção, comissão, imposto e seguro comem parte do que entra, e isso quase sempre fica espalhado em planilhas separadas, se é que fica registrado em algum lugar.</p>
            </div>
            <div className="lp-compare">
              <div className="lp-antes">
                <h3>Do jeito que costuma ser</h3>
                <ul>
                  <li>Faturamento somado à mão no fim do mês, a partir dos boletos pagos</li>
                  <li>Despesas de manutenção e comissão numa planilha à parte — se anotadas</li>
                  <li>Nenhuma resposta rápida para &quot;qual imóvel dá mais lucro?&quot;</li>
                  <li>Sem comparação entre tipos de imóvel ou entre bairros/cidades</li>
                </ul>
              </div>
              <div className="lp-depois">
                <h3>Com o módulo Financeiro</h3>
                <ul>
                  <li>Faturamento, despesas e lucro líquido calculados automaticamente, mês a mês</li>
                  <li>Despesa lançada direto na ficha do imóvel — manutenção, imposto, seguro, comissão</li>
                  <li>Ranking dos imóveis mais lucrativos e dos que pedem atenção, sempre atualizado</li>
                  <li>Comparativo por tipo (apartamento, casa, comercial) e por região, lado a lado</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="lp-section">
            <div className="lp-section-head">
              <p className="lp-eyebrow">O que o painel calcula</p>
              <h2 className="lp-section-title">Quatro perguntas que todo gestor de carteira faz — respondidas sem planilha</h2>
            </div>
            <div className="lp-cap-grid">
              <div className="lp-cap">
                <div className="lp-ctitle">Quanto entrou, quanto saiu, quanto sobrou</div>
                <p className="lp-cdesc">Faturamento e despesas dos últimos 12 meses, com o lucro líquido em destaque — a mesma leitura de um fluxo de caixa, sem precisar fechar nada manualmente.</p>
                <div className="lp-cviz lp-mini-bars">
                  <div className="lp-b" style={{ height: '40%' }} /><div className="lp-b" style={{ height: '55%' }} />
                  <div className="lp-b lp-hi" style={{ height: '70%' }} /><div className="lp-b" style={{ height: '48%' }} />
                  <div className="lp-b lp-hi" style={{ height: '82%' }} /><div className="lp-b" style={{ height: '60%' }} />
                  <div className="lp-b lp-hi" style={{ height: '90%' }} /><div className="lp-b" style={{ height: '65%' }} />
                </div>
              </div>
              <div className="lp-cap">
                <div className="lp-ctitle">Ranking de imóveis por lucro</div>
                <p className="lp-cdesc">Do mais lucrativo ao que está dando prejuízo, ordenado automaticamente a partir dos boletos pagos e despesas lançadas em cada imóvel.</p>
                <div className="lp-cviz lp-mini-row">
                  <span className="lp-chip lp-top">Rua Aimberê, 210 ↑</span>
                  <span className="lp-chip">Sala 14, Ed. Delta</span>
                </div>
              </div>
              <div className="lp-cap">
                <div className="lp-ctitle">Apartamento, casa ou comercial — o que rende mais</div>
                <p className="lp-cdesc">Lucro e margem agrupados por tipo de imóvel, para saber onde vale a pena concentrar a captação de novos contratos.</p>
                <div className="lp-cviz lp-mini-row">
                  <span className="lp-chip lp-top">Comercial · 34% margem</span>
                  <span className="lp-chip">Sala · 19% margem</span>
                </div>
              </div>
              <div className="lp-cap">
                <div className="lp-ctitle">Qual bairro ou cidade dá mais retorno</div>
                <p className="lp-cdesc">Retorno agrupado por região, com destaque automático para a que mais rende e a que menos rende — direto do endereço já cadastrado no imóvel.</p>
                <div className="lp-cviz lp-mini-row">
                  <span className="lp-chip lp-top">Higienópolis ↑</span>
                  <span className="lp-chip">Zona Leste ↓</span>
                </div>
              </div>
            </div>
          </section>

          <section className="lp-section">
            <div className="lp-section-head">
              <p className="lp-eyebrow">O resto do sistema</p>
              <h2 className="lp-section-title">O financeiro é novo. A gestão completa da carteira já vem junto.</h2>
              <p className="lp-desc">O módulo financeiro lê os mesmos dados que sua equipe já cadastra no dia a dia — nada de sistema separado.</p>
            </div>
            <div className="lp-feat-list">
              <div className="lp-feat">
                <div className="lp-ficon">⌂</div>
                <div className="lp-ftitle">Imóveis e locações</div>
                <div className="lp-fdesc">Cadastro completo de imóveis, fotos, contratos de locação e histórico por inquilino.</div>
              </div>
              <div className="lp-feat">
                <div className="lp-ficon">$</div>
                <div className="lp-ftitle">Boletos e cobrança</div>
                <div className="lp-fdesc">Emissão e controle de boletos por locação, com status de pago, em aberto e vencido.</div>
              </div>
              <div className="lp-feat">
                <div className="lp-ficon">◔</div>
                <div className="lp-ftitle">Portal do inquilino</div>
                <div className="lp-fdesc">O inquilino acompanha o próprio contrato, boletos e documentos sem precisar ligar para a imobiliária.</div>
              </div>
              <div className="lp-feat">
                <div className="lp-ficon">✉</div>
                <div className="lp-ftitle">Chat direto</div>
                <div className="lp-fdesc">Conversa entre administradora e inquilino dentro do próprio sistema, por locação.</div>
              </div>
              <div className="lp-feat">
                <div className="lp-ficon">▤</div>
                <div className="lp-ftitle">Agenda de visitas e chaves</div>
                <div className="lp-fdesc">Agendamento de visitas a imóveis disponíveis e de entrega/retirada de chaves.</div>
              </div>
              <div className="lp-feat">
                <div className="lp-ficon">▣</div>
                <div className="lp-ftitle">Documentos centralizados</div>
                <div className="lp-fdesc">Contrato, vistorias, comprovantes e apólices guardados por locação, com acesso controlado.</div>
              </div>
              <div className="lp-feat">
                <div className="lp-ficon">◈</div>
                <div className="lp-ftitle">Cada imobiliária, isolada</div>
                <div className="lp-fdesc">Estrutura multi-empresa: os dados da sua carteira nunca se misturam com os de outra locadora no mesmo sistema.</div>
              </div>
              <div className="lp-feat">
                <div className="lp-ficon">§</div>
                <div className="lp-ftitle">Conformidade com a LGPD</div>
                <div className="lp-fdesc">Consentimento e direitos do titular tratados dentro do próprio fluxo de cadastro.</div>
              </div>
              <div className="lp-feat">
                <div className="lp-ficon">↻</div>
                <div className="lp-ftitle">Tudo no mesmo lugar</div>
                <div className="lp-fdesc">O financeiro nasce dos boletos e despesas que a equipe já lança — sem exportar nada para planilha.</div>
              </div>
            </div>
          </section>

          <section className="lp-section">
            <div className="lp-section-head">
              <p className="lp-eyebrow">Preço</p>
              <h2 className="lp-section-title">Um plano só, sem letra miúda</h2>
            </div>
            <div className="lp-price-card">
              <div className="lp-price-value">
                <span className="lp-price-currency">R$</span>150<span className="lp-price-period">/mês</span>
              </div>
              <p className="lp-price-trial">5 dias grátis para testar. Cancele quando quiser.</p>
              <ul className="lp-price-list">
                <li>Controle financeiro completo, com repasse a proprietários</li>
                <li>Imóveis, locações e boletos sem limite</li>
                <li>Portal do inquilino e portal do proprietário inclusos</li>
                <li>Chat, agenda de visitas e documentos centralizados</li>
              </ul>
              <Link href="/cadastro" className="lp-btn lp-btn-brass lp-price-cta">Começar meu teste grátis</Link>
            </div>
          </section>

          <section className="lp-section">
            <div className="lp-closing">
              <p className="lp-eyebrow">Próximo passo</p>
              <h2 className="lp-headline">Veja o retorno da sua própria carteira, não de uma carteira de exemplo.</h2>
              <p className="lp-desc">Cadastre alguns imóveis e boletos que você já tem em mãos e o painel financeiro já mostra os números reais — faturamento, lucro, ranking e retorno por região, calculados a partir dos seus dados. 5 dias grátis, depois R$ 150/mês.</p>
              <div className="lp-hero-ctas">
                <Link href="/cadastro" className="lp-btn lp-btn-brass">Cadastrar minha imobiliária</Link>
              </div>
            </div>
          </section>

          <footer className="lp-footer">
            <span>Locadora — painel de gestão para imobiliárias</span>
            <Link href="/privacidade" className="lp-fmark">política de privacidade</Link>
          </footer>

        </div>
      </div>
    </div>
  )
}
