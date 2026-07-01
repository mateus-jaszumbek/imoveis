export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      locadoras: {
        Row: {
          id: string
          nome: string
          criado_em: string
        }
        Insert: {
          id?: string
          nome: string
          criado_em?: string
        }
        Update: {
          id?: string
          nome?: string
          criado_em?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          locadora_id: string | null
          nome: string
          email: string
          telefone: string | null
          cpf: string | null
          role: 'admin' | 'cliente'
          consentimento_lgpd_em: string | null
          criado_em: string
          atualizado_em: string
        }
        Insert: {
          id: string
          locadora_id?: string | null
          nome: string
          email: string
          telefone?: string | null
          cpf?: string | null
          role: 'admin' | 'cliente'
          consentimento_lgpd_em?: string | null
          criado_em?: string
          atualizado_em?: string
        }
        Update: {
          id?: string
          locadora_id?: string | null
          nome?: string
          email?: string
          telefone?: string | null
          cpf?: string | null
          role?: 'admin' | 'cliente'
          consentimento_lgpd_em?: string | null
          criado_em?: string
          atualizado_em?: string
        }
        Relationships: []
      }
      imoveis: {
        Row: {
          id: string
          locadora_id: string
          codigo: string | null
          tipo: 'apartamento' | 'casa' | 'comercial' | 'sala' | 'outro'
          endereco: string
          numero: string | null
          complemento: string | null
          bairro: string | null
          cidade: string
          uf: string
          cep: string | null
          valor_aluguel: number | null
          valor_condominio: number | null
          valor_iptu: number | null
          quartos: number | null
          area: number | null
          descricao: string | null
          status: 'disponivel' | 'alugado' | 'em_analise'
          criado_em: string
          atualizado_em: string
        }
        Insert: {
          id?: string
          locadora_id?: string
          codigo?: string | null
          tipo: 'apartamento' | 'casa' | 'comercial' | 'sala' | 'outro'
          endereco: string
          numero?: string | null
          complemento?: string | null
          bairro?: string | null
          cidade: string
          uf: string
          cep?: string | null
          valor_aluguel?: number | null
          valor_condominio?: number | null
          valor_iptu?: number | null
          quartos?: number | null
          area?: number | null
          descricao?: string | null
          status?: 'disponivel' | 'alugado' | 'em_analise'
          criado_em?: string
          atualizado_em?: string
        }
        Update: {
          id?: string
          locadora_id?: string
          codigo?: string | null
          tipo?: 'apartamento' | 'casa' | 'comercial' | 'sala' | 'outro'
          endereco?: string
          numero?: string | null
          complemento?: string | null
          bairro?: string | null
          cidade?: string
          uf?: string
          cep?: string | null
          valor_aluguel?: number | null
          valor_condominio?: number | null
          valor_iptu?: number | null
          quartos?: number | null
          area?: number | null
          descricao?: string | null
          status?: 'disponivel' | 'alugado' | 'em_analise'
          criado_em?: string
          atualizado_em?: string
        }
        Relationships: []
      }
      imovel_fotos: {
        Row: {
          id: string
          imovel_id: string
          url: string
          nome_arquivo: string | null
          ordem: number
          criado_em: string
        }
        Insert: {
          id?: string
          imovel_id: string
          url: string
          nome_arquivo?: string | null
          ordem?: number
          criado_em?: string
        }
        Update: {
          id?: string
          imovel_id?: string
          url?: string
          nome_arquivo?: string | null
          ordem?: number
          criado_em?: string
        }
        Relationships: [
          { foreignKeyName: 'imovel_fotos_imovel_id_fkey'; columns: ['imovel_id']; referencedRelation: 'imoveis'; referencedColumns: ['id'] }
        ]
      }
      locacoes: {
        Row: {
          id: string
          locadora_id: string
          imovel_id: string
          inquilino_id: string
          data_inicio: string
          data_fim: string | null
          dia_vencimento: number
          valor: number
          indice_reajuste: string | null
          seguro_corretora: string | null
          seguro_apolice: string | null
          status: 'ativa' | 'encerrada'
          observacoes: string | null
          criado_em: string
          atualizado_em: string
        }
        Insert: {
          id?: string
          locadora_id?: string
          imovel_id: string
          inquilino_id: string
          data_inicio: string
          data_fim?: string | null
          dia_vencimento: number
          valor: number
          indice_reajuste?: string | null
          seguro_corretora?: string | null
          seguro_apolice?: string | null
          status?: 'ativa' | 'encerrada'
          observacoes?: string | null
          criado_em?: string
          atualizado_em?: string
        }
        Update: {
          id?: string
          locadora_id?: string
          imovel_id?: string
          inquilino_id?: string
          data_inicio?: string
          data_fim?: string | null
          dia_vencimento?: number
          valor?: number
          indice_reajuste?: string | null
          seguro_corretora?: string | null
          seguro_apolice?: string | null
          status?: 'ativa' | 'encerrada'
          observacoes?: string | null
          criado_em?: string
          atualizado_em?: string
        }
        Relationships: [
          { foreignKeyName: 'locacoes_imovel_id_fkey'; columns: ['imovel_id']; referencedRelation: 'imoveis'; referencedColumns: ['id'] },
          { foreignKeyName: 'locacoes_inquilino_id_fkey'; columns: ['inquilino_id']; referencedRelation: 'profiles'; referencedColumns: ['id'] }
        ]
      }
      documentos: {
        Row: {
          id: string
          locacao_id: string
          tipo: 'contrato' | 'vistoria_entrada' | 'vistoria_saida' | 'entrega_chaves' | 'rg' | 'cpf' | 'comprovante_renda' | 'extrato' | 'apólice' | 'outro'
          nome_arquivo: string
          url: string
          criado_em: string
          criado_por: string | null
        }
        Insert: {
          id?: string
          locacao_id: string
          tipo: 'contrato' | 'vistoria_entrada' | 'vistoria_saida' | 'entrega_chaves' | 'rg' | 'cpf' | 'comprovante_renda' | 'extrato' | 'apólice' | 'outro'
          nome_arquivo: string
          url: string
          criado_em?: string
          criado_por?: string | null
        }
        Update: {
          id?: string
          locacao_id?: string
          tipo?: 'contrato' | 'vistoria_entrada' | 'vistoria_saida' | 'entrega_chaves' | 'rg' | 'cpf' | 'comprovante_renda' | 'extrato' | 'apólice' | 'outro'
          nome_arquivo?: string
          url?: string
          criado_em?: string
          criado_por?: string | null
        }
        Relationships: [
          { foreignKeyName: 'documentos_locacao_id_fkey'; columns: ['locacao_id']; referencedRelation: 'locacoes'; referencedColumns: ['id'] }
        ]
      }
      boletos: {
        Row: {
          id: string
          locacao_id: string
          mes_referencia: string
          vencimento: string
          valor: number
          descricao: string | null
          linha_digitavel: string | null
          url_pdf: string | null
          status: 'em_aberto' | 'pago' | 'vencido'
          pago_em: string | null
          criado_em: string
          atualizado_em: string
        }
        Insert: {
          id?: string
          locacao_id: string
          mes_referencia: string
          vencimento: string
          valor: number
          descricao?: string | null
          linha_digitavel?: string | null
          url_pdf?: string | null
          status?: 'em_aberto' | 'pago' | 'vencido'
          pago_em?: string | null
          criado_em?: string
          atualizado_em?: string
        }
        Update: {
          id?: string
          locacao_id?: string
          mes_referencia?: string
          vencimento?: string
          valor?: number
          descricao?: string | null
          linha_digitavel?: string | null
          url_pdf?: string | null
          status?: 'em_aberto' | 'pago' | 'vencido'
          pago_em?: string | null
          criado_em?: string
          atualizado_em?: string
        }
        Relationships: [
          { foreignKeyName: 'boletos_locacao_id_fkey'; columns: ['locacao_id']; referencedRelation: 'locacoes'; referencedColumns: ['id'] }
        ]
      }
      conversas: {
        Row: {
          id: string
          locacao_id: string
          criado_em: string
        }
        Insert: {
          id?: string
          locacao_id: string
          criado_em?: string
        }
        Update: {
          id?: string
          locacao_id?: string
          criado_em?: string
        }
        Relationships: [
          { foreignKeyName: 'conversas_locacao_id_fkey'; columns: ['locacao_id']; referencedRelation: 'locacoes'; referencedColumns: ['id'] }
        ]
      }
      mensagens: {
        Row: {
          id: string
          conversa_id: string
          autor_id: string
          autor_role: 'admin' | 'cliente'
          texto: string | null
          lida: boolean
          criado_em: string
        }
        Insert: {
          id?: string
          conversa_id: string
          autor_id: string
          autor_role: 'admin' | 'cliente'
          texto?: string | null
          lida?: boolean
          criado_em?: string
        }
        Update: {
          id?: string
          conversa_id?: string
          autor_id?: string
          autor_role?: 'admin' | 'cliente'
          texto?: string | null
          lida?: boolean
          criado_em?: string
        }
        Relationships: [
          { foreignKeyName: 'mensagens_conversa_id_fkey'; columns: ['conversa_id']; referencedRelation: 'conversas'; referencedColumns: ['id'] },
          { foreignKeyName: 'mensagens_autor_id_fkey'; columns: ['autor_id']; referencedRelation: 'profiles'; referencedColumns: ['id'] }
        ]
      }
      mensagem_anexos: {
        Row: {
          id: string
          mensagem_id: string
          tipo: 'imagem' | 'pdf'
          url: string
          nome_arquivo: string
          tamanho: number | null
          criado_em: string
        }
        Insert: {
          id?: string
          mensagem_id: string
          tipo: 'imagem' | 'pdf'
          url: string
          nome_arquivo: string
          tamanho?: number | null
          criado_em?: string
        }
        Update: {
          id?: string
          mensagem_id?: string
          tipo?: 'imagem' | 'pdf'
          url?: string
          nome_arquivo?: string
          tamanho?: number | null
          criado_em?: string
        }
        Relationships: [
          { foreignKeyName: 'mensagem_anexos_mensagem_id_fkey'; columns: ['mensagem_id']; referencedRelation: 'mensagens'; referencedColumns: ['id'] }
        ]
      }
      agendamentos: {
        Row: {
          id: string
          locadora_id: string
          tipo: 'visita' | 'entrega_chaves' | 'retirada_chaves'
          imovel_id: string
          locacao_id: string | null
          nome_contato: string | null
          telefone_contato: string | null
          email_contato: string | null
          data_hora: string
          status: 'agendado' | 'realizado' | 'cancelado'
          observacoes: string | null
          criado_em: string
          atualizado_em: string
        }
        Insert: {
          id?: string
          locadora_id?: string
          tipo: 'visita' | 'entrega_chaves' | 'retirada_chaves'
          imovel_id: string
          locacao_id?: string | null
          nome_contato?: string | null
          telefone_contato?: string | null
          email_contato?: string | null
          data_hora: string
          status?: 'agendado' | 'realizado' | 'cancelado'
          observacoes?: string | null
          criado_em?: string
          atualizado_em?: string
        }
        Update: {
          id?: string
          locadora_id?: string
          tipo?: 'visita' | 'entrega_chaves' | 'retirada_chaves'
          imovel_id?: string
          locacao_id?: string | null
          nome_contato?: string | null
          telefone_contato?: string | null
          email_contato?: string | null
          data_hora?: string
          status?: 'agendado' | 'realizado' | 'cancelado'
          observacoes?: string | null
          criado_em?: string
          atualizado_em?: string
        }
        Relationships: [
          { foreignKeyName: 'agendamentos_imovel_id_fkey'; columns: ['imovel_id']; referencedRelation: 'imoveis'; referencedColumns: ['id'] },
          { foreignKeyName: 'agendamentos_locacao_id_fkey'; columns: ['locacao_id']; referencedRelation: 'locacoes'; referencedColumns: ['id'] }
        ]
      }
    }
    Views: { [_ in never]?: never }
    Functions: { [_ in never]?: never }
    Enums: { [_ in never]?: never }
    CompositeTypes: { [_ in never]?: never }
  }
}

// Tipos derivados para uso nos componentes
export type Locadora = Database['public']['Tables']['locadoras']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Imovel = Database['public']['Tables']['imoveis']['Row']
export type ImovelFoto = Database['public']['Tables']['imovel_fotos']['Row']
export type Locacao = Database['public']['Tables']['locacoes']['Row']
export type Documento = Database['public']['Tables']['documentos']['Row']
export type Boleto = Database['public']['Tables']['boletos']['Row']
export type Conversa = Database['public']['Tables']['conversas']['Row']
export type Mensagem = Database['public']['Tables']['mensagens']['Row']
export type MensagemAnexo = Database['public']['Tables']['mensagem_anexos']['Row']
export type Agendamento = Database['public']['Tables']['agendamentos']['Row']

export type LocacaoComRelacoes = Locacao & {
  imoveis: Imovel
  profiles: Profile
}

export type MensagemComAnexos = Mensagem & {
  profiles: { nome: string }
  mensagem_anexos: MensagemAnexo[]
}

export type AgendamentoComRelacoes = Agendamento & {
  imoveis: Pick<Imovel, 'endereco' | 'numero' | 'cidade' | 'uf'> | null
  locacoes: (Pick<Locacao, 'id'> & { profiles: Pick<Profile, 'nome' | 'telefone'> }) | null
}
