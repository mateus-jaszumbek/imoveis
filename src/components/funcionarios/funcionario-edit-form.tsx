'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { Dices } from 'lucide-react'
import { SECOES_FUNCIONARIO, type SecaoFuncionario, type Profile } from '@/lib/types'

function gerarSenha() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

type Permissoes = Partial<Record<SecaoFuncionario, { ver: boolean; editar: boolean }>>

export function FuncionarioEditForm({
  funcionario,
  permissoesIniciais,
}: {
  funcionario: Profile
  permissoesIniciais: { secao: SecaoFuncionario; pode_editar: boolean }[]
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nome: funcionario.nome,
    email: funcionario.email,
    telefone: funcionario.telefone ?? '',
    cpf: funcionario.cpf ?? '',
    senha: '',
  })
  const [ativo, setAtivo] = useState(funcionario.ativo)
  const [permissoes, setPermissoes] = useState<Permissoes>(() => {
    const inicial: Permissoes = {}
    for (const p of permissoesIniciais) inicial[p.secao] = { ver: true, editar: p.pode_editar }
    return inicial
  })
  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  function toggleVer(secao: SecaoFuncionario, ver: boolean) {
    setPermissoes(prev => ({ ...prev, [secao]: { ver, editar: ver ? (prev[secao]?.editar ?? false) : false } }))
  }
  function toggleEditar(secao: SecaoFuncionario, editar: boolean) {
    setPermissoes(prev => ({ ...prev, [secao]: { ver: true, editar } }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const permissoesEnviadas = Object.entries(permissoes)
      .filter(([, v]) => v?.ver)
      .map(([secao, v]) => ({ secao, pode_editar: v!.editar }))

    const res = await fetch('/api/admin/editar-funcionario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: funcionario.id, ...form, ativo, permissoes: permissoesEnviadas }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) { toast(json.error ?? 'Erro ao salvar', 'error'); return }
    toast(form.senha ? 'Dados e senha atualizados!' : 'Dados atualizados!', 'success')
    setForm(prev => ({ ...prev, senha: '' }))
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Acesso</CardTitle>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={ativo}
              onChange={e => setAtivo(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            {ativo ? 'Ativo' : 'Inativo (login bloqueado)'}
          </label>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        <Input id="nome" label="Nome completo *" value={form.nome} onChange={set('nome')} required />
        <Input id="telefone" label="Telefone" value={form.telefone} onChange={set('telefone')} />
        <Input id="cpf" label="CPF" value={form.cpf} onChange={set('cpf')} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Login de acesso</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input id="email" label="E-mail (login) *" type="email" value={form.email} onChange={set('email')} required />
          <div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  id="senha"
                  label="Nova senha"
                  value={form.senha}
                  onChange={set('senha')}
                  minLength={6}
                  placeholder="Deixe em branco para manter a senha atual"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setForm(prev => ({ ...prev, senha: gerarSenha() }))}
                title="Gerar senha aleatória"
              >
                <Dices className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Só preencha se quiser trocar a senha do funcionário. Compartilhe a nova senha com ele diretamente.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Permissões</CardTitle></CardHeader>
        <CardContent>
          <div className="divide-y divide-gray-100">
            {SECOES_FUNCIONARIO.map(({ secao, label, temEditar }) => {
              const p = permissoes[secao] ?? { ver: false, editar: false }
              return (
                <div key={secao} className="flex items-center justify-between py-2.5">
                  <span className="text-sm font-medium text-gray-800">{label}</span>
                  <div className="flex items-center gap-5">
                    <label className="flex items-center gap-1.5 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                        checked={p.ver}
                        onChange={e => toggleVer(secao, e.target.checked)}
                      />
                      Ver
                    </label>
                    {temEditar && (
                      <label className="flex items-center gap-1.5 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300"
                          checked={p.editar}
                          onChange={e => toggleEditar(secao, e.target.checked)}
                        />
                        Editar
                      </label>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" loading={loading}>Salvar</Button>
      </div>
    </form>
  )
}
