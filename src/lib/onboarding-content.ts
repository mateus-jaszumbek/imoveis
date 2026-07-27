import {
  LayoutDashboard, Building2, Users, Home, DollarSign, Landmark,
  CalendarDays, Receipt, FileText, MessageSquare, Settings, CreditCard,
  type LucideIcon,
} from 'lucide-react'

export interface TourStep {
  id: string
  title: string
  body: string
  icon: LucideIcon
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'boas-vindas',
    title: 'Bem-vindo à sua locadora',
    body: 'Este painel reúne tudo que você precisa para gerenciar seus imóveis, inquilinos, contratos e o financeiro em um só lugar. Vamos fazer um tour rápido pelas telas principais — leva menos de um minuto.',
    icon: LayoutDashboard,
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    body: 'É a tela inicial: mostra um resumo do seu negócio (imóveis ocupados, receita prevista, boletos em aberto, etc.) para você ter uma visão geral sem precisar entrar em cada módulo.',
    icon: LayoutDashboard,
  },
  {
    id: 'imoveis',
    title: 'Imóveis',
    body: 'Cadastre cada imóvel da sua carteira com endereço, valores de aluguel/condomínio/IPTU e status (disponível, alugado, em manutenção). É a partir daqui que você cria as locações depois.',
    icon: Building2,
  },
  {
    id: 'inquilinos',
    title: 'Inquilinos',
    body: 'Cadastre os inquilinos e defina um e-mail e senha de acesso para eles. Com isso, cada inquilino consegue entrar no próprio painel para ver boletos, documentos e conversar com você.',
    icon: Users,
  },
  {
    id: 'locacoes',
    title: 'Locações',
    body: 'Aqui você une um imóvel a um inquilino: define datas do contrato, valor do aluguel, dia de vencimento e índice de reajuste. É a locação que gera os boletos automaticamente.',
    icon: Home,
  },
  {
    id: 'financeiro',
    title: 'Financeiro',
    body: 'Acompanhe receitas, despesas e o lucro real da sua operação, com rankings por imóvel e por região. Use para saber se a locadora está dando lucro de verdade, não só faturamento.',
    icon: DollarSign,
  },
  {
    id: 'final',
    title: 'Pronto para começar',
    body: 'Você tem alguns dias grátis para testar o sistema; depois disso, a assinatura garante o acesso contínuo (menu "Assinatura"). Se precisar relembrar qualquer parte do sistema, o Manual de Ajuda no menu lateral explica todos os módulos em detalhe, a qualquer momento.',
    icon: CreditCard,
  },
]

export interface HelpSection {
  id: string
  title: string
  icon: LucideIcon
  paragraphs: string[]
}

export const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
    paragraphs: [
      'Tela inicial do painel administrativo. Mostra um resumo do estado atual da sua locadora: quantos imóveis estão ocupados ou vagos, receita prevista do mês, boletos pendentes e outros indicadores rápidos.',
      'Use esta tela para ter uma visão geral do negócio sem precisar navegar por todos os módulos.',
    ],
  },
  {
    id: 'financeiro',
    title: 'Financeiro',
    icon: DollarSign,
    paragraphs: [
      'Mostra receitas (aluguéis recebidos), despesas lançadas por imóvel e o lucro líquido real da operação — não apenas o faturamento bruto.',
      'Inclui gráficos de tendência mensal, ranking dos imóveis mais rentáveis e ranking por região, além de cartões de indicadores (KPIs) no topo.',
      'As despesas de cada imóvel são lançadas na própria tela do imóvel (aba de despesas), por categoria (ex: manutenção, IPTU, condomínio).',
    ],
  },
  {
    id: 'imoveis',
    title: 'Imóveis',
    icon: Building2,
    paragraphs: [
      'Cadastro de todos os imóveis da locadora: endereço, tipo, código interno, valores de aluguel/condomínio/IPTU, quartos, área e status.',
      '"Código" é um identificador interno seu (ex: AP-001) para facilitar a busca — não é usado por ninguém de fora.',
      '"Status" indica se o imóvel está disponível, alugado ou em manutenção — isso muda automaticamente quando você cria ou encerra uma locação.',
      'Cada imóvel tem sua própria tela de despesas, onde você lança gastos (manutenção, taxas, reparos) que entram no cálculo do Financeiro.',
    ],
  },
  {
    id: 'inquilinos',
    title: 'Inquilinos',
    icon: Users,
    paragraphs: [
      'Cadastro das pessoas que alugam seus imóveis. Ao cadastrar, você define um e-mail e uma senha de acesso — é com essas credenciais que o inquilino entra no próprio painel dele.',
      'No painel do inquilino, ele consegue ver o imóvel alugado, os boletos gerados, documentos compartilhados e conversar com você pelo chat.',
      'O CPF é opcional, mas recomendado: facilita a emissão de documentos e contratos.',
    ],
  },
  {
    id: 'proprietarios',
    title: 'Proprietários',
    icon: Landmark,
    paragraphs: [
      'Cadastro dos donos dos imóveis (quando você administra imóveis de terceiros, não só os seus). Cada imóvel pode ser vinculado a um proprietário.',
      'Proprietários também têm acesso próprio ao sistema, para acompanhar os repasses (valores repassados a eles após descontar taxas de administração).',
    ],
  },
  {
    id: 'locacoes',
    title: 'Locações',
    icon: Home,
    paragraphs: [
      'É aqui que você formaliza o contrato: escolhe um imóvel e um inquilino, define a data de início/fim, valor do aluguel, dia de vencimento e (opcionalmente) índice de reajuste e dados do seguro.',
      '"Dia de vencimento" é o dia do mês em que o boleto do aluguel vence — os boletos futuros são gerados automaticamente nessa data.',
      '"Índice de reajuste" (IGPM, IPCA, etc.) é usado para reajustar o valor do aluguel automaticamente na renovação do contrato, seguindo a lei do inquilinato.',
      'Só existe uma locação ativa por imóvel de cada vez — ao encerrar uma, o imóvel volta a ficar disponível para uma nova.',
    ],
  },
  {
    id: 'agenda',
    title: 'Agenda',
    icon: CalendarDays,
    paragraphs: [
      'Calendário de compromissos e datas importantes relacionadas às suas locações (ex: vencimentos, renovações de contrato, vistorias).',
    ],
  },
  {
    id: 'boletos',
    title: 'Boletos',
    icon: Receipt,
    paragraphs: [
      'Lista os boletos gerados a partir das locações ativas, com status de pagamento (pendente, pago, atrasado).',
      'Os boletos são gerados automaticamente com base no dia de vencimento definido em cada locação.',
    ],
  },
  {
    id: 'documentos',
    title: 'Documentos',
    icon: FileText,
    paragraphs: [
      'Espaço para armazenar e compartilhar documentos com os inquilinos (contratos assinados, comprovantes, vistorias).',
      'Documentos enviados aqui ficam visíveis para o inquilino correspondente no painel dele.',
    ],
  },
  {
    id: 'mensagens',
    title: 'Mensagens',
    icon: MessageSquare,
    paragraphs: [
      'Chat direto entre você (administrador) e cada inquilino, para tratar assuntos do dia a dia da locação sem precisar de WhatsApp ou e-mail.',
    ],
  },
  {
    id: 'configuracoes',
    title: 'Configurações',
    icon: Settings,
    paragraphs: [
      'Dados da sua conta e da locadora (nome, informações de contato) e preferências gerais do sistema.',
    ],
  },
  {
    id: 'assinatura',
    title: 'Assinatura',
    icon: CreditCard,
    paragraphs: [
      'Toda locadora começa com alguns dias de teste grátis. Depois desse período, é necessário assinar o plano mensal para continuar com acesso ao sistema.',
      'Aqui você acompanha o status da sua assinatura (em teste, ativa, atrasada) e realiza o pagamento.',
    ],
  },
]
