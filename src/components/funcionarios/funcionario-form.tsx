'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { Dices } from 'lucide-react'
import { SECOES_FUNCIONARIO, type SecaoFuncionario } from '@/lib/types'

function gerarSenha() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

type Permissoes = Partial<Record<SecaoFuncionario, { ver: boolean; editar: boolean }>>

export function FuncionarioForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', cpf: '', senha: '' })
  const [aceite, setAceite] = useState(false)
  const [permissoes, setPermissoes] = useState<Permissoes>({})
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
    if (!aceite) { toast('Confirme que o funcionário foi informado sobre o tratamento de dados (LGPD)', 'error'); return }
    setLoading(true)
    const permissoesEnviadas = Object.entries(permissoes)
      .filter(([, v]) => v?.ver)
      .map(([secao, v]) => ({ secao, pode_editar: v!.editar }))

    const res = await fetch('/api/admin/criar-funcionario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, aceite, permissoes: permissoesEnviadas }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) { toast(json.error ?? 'Erro ao cadastrar', 'error'); return }
    toast(`Funcionário cadastrado! Compartilhe com ele: e-mail ${form.email} e a senha definida.`, 'success')
    router.push('/admin/funcionarios')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <form id="form-funcionario" onSubmit={handleSubmit} className="space-y-4 pt-2">
            <Input id="nome" label="Nome completo *" value={form.nome} onChange={set('nome')} required />
            <Input id="email" label="E-mail (login) *" type="email" value={form.email} onChange={set('email')} required />
            <Input id="telefone" label="Telefone" type="tel" value={form.telefone} onChange={set('telefone')} placeholder="(00) 00000-0000" />
            <Input id="cpf" label="CPF" value={form.cpf} onChange={set('cpf')} placeholder="000.000.000-00" />
            <div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    id="senha"
                    label="Senha de acesso *"
                    value={form.senha}
                    onChange={set('senha')}
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    required
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
                Compartilhe o e-mail e esta senha diretamente com o funcionário (WhatsApp, etc.) para ele acessar o painel.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Permissões</CardTitle></CardHeader>
        <CardContent>
          <p className="text-xs text-gray-500 mb-4">
            Marque as abas que este funcionário pode acessar. &quot;Editar&quot; permite adicionar e alterar registros; sem marcar, o acesso é só de visualização.
          </p>
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

      <label className="flex items-start gap-2 text-xs text-gray-600">
        <input
          type="checkbox"
          checked={aceite}
          onChange={e => setAceite(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300"
        />
        <span>
          Confirmo que tenho autorização para cadastrar estes dados e que o funcionário foi informado
          sobre o tratamento de dados pessoais conforme a Política de Privacidade e a LGPD.
        </span>
      </label>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
        <Button type="submit" form="form-funcionario" loading={loading}>Cadastrar Funcionário</Button>
      </div>
    </div>
  )
}
