'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { Dices } from 'lucide-react'
import type { Profile } from '@/lib/types'

function gerarSenha() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export function InquilinoEditForm({ inquilino }: { inquilino: Profile }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nome: inquilino.nome,
    email: inquilino.email,
    telefone: inquilino.telefone ?? '',
    cpf: inquilino.cpf ?? '',
    senha: '',
  })
  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/admin/editar-inquilino', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: inquilino.id, ...form }),
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
              Só preencha se quiser trocar a senha do inquilino. Compartilhe a nova senha com ele diretamente.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" loading={loading}>Salvar</Button>
      </div>
    </form>
  )
}
