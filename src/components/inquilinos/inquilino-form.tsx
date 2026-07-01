'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { Dices } from 'lucide-react'

function gerarSenha() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export function InquilinoForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', cpf: '', senha: '' })
  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    // A criação do usuário é feita no servidor com a service role key,
    // para não afetar a sessão do admin logado no navegador.
    const res = await fetch('/api/admin/criar-inquilino', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) { toast(json.error ?? 'Erro ao cadastrar', 'error'); return }
    toast(`Inquilino cadastrado! Compartilhe com ele: e-mail ${form.email} e a senha definida.`, 'success')
    router.push('/admin/inquilinos')
    router.refresh()
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
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
              Compartilhe o e-mail e esta senha diretamente com o inquilino (WhatsApp, etc.) para ele acessar sua locação.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
            <Button type="submit" loading={loading}>Cadastrar Inquilino</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
