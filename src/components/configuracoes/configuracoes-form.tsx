'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import type { Profile } from '@/lib/types'

type PerfilBasico = Pick<Profile, 'id' | 'nome' | 'email' | 'telefone'>

export function ConfiguracoesForm({ profile }: { profile: PerfilBasico }) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [nome, setNome] = useState(profile.nome)
  const [telefone, setTelefone] = useState(profile.telefone ?? '')
  const [email, setEmail] = useState(profile.email)
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (novaSenha && novaSenha.length < 6) { setError('A nova senha deve ter pelo menos 6 caracteres.'); return }
    if (novaSenha && novaSenha !== confirmarSenha) { setError('As senhas não coincidem.'); return }

    setLoading(true)

    if (nome !== profile.nome || telefone !== (profile.telefone ?? '')) {
      const { error: perfilError } = await supabase
        .from('profiles')
        .update({ nome, telefone: telefone || null })
        .eq('id', profile.id)
      if (perfilError) { setLoading(false); setError(perfilError.message); return }
    }

    const emailAlterado = email !== profile.email
    if (emailAlterado) {
      const { error: emailError } = await supabase.auth.updateUser({ email })
      if (emailError) { setLoading(false); setError(emailError.message); return }
    }

    if (novaSenha) {
      const { error: senhaError } = await supabase.auth.updateUser({ password: novaSenha })
      if (senhaError) { setLoading(false); setError(senhaError.message); return }
    }

    setLoading(false)
    setNovaSenha('')
    setConfirmarSenha('')
    toast(
      emailAlterado
        ? 'Dados salvos! Confira seu novo e-mail para confirmar a troca — até lá, o login continua com o e-mail atual.'
        : 'Dados atualizados com sucesso!',
      'success'
    )
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Meus dados</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input id="nome" label="Nome completo" value={nome} onChange={e => setNome(e.target.value)} required />
          <Input id="telefone" label="Telefone" value={telefone} onChange={e => setTelefone(e.target.value)} />
          <div>
            <Input id="email" label="E-mail" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <p className="mt-1 text-xs text-gray-500">
              Ao trocar o e-mail, enviaremos um link de confirmação para o endereço novo antes da troca valer.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Alterar senha</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input
            id="novaSenha" label="Nova senha" type="password" value={novaSenha}
            onChange={e => setNovaSenha(e.target.value)} minLength={6}
            placeholder="Deixe em branco para manter a senha atual"
          />
          <Input
            id="confirmarSenha" label="Confirmar nova senha" type="password" value={confirmarSenha}
            onChange={e => setConfirmarSenha(e.target.value)}
            placeholder="Deixe em branco para manter a senha atual"
          />
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end">
        <Button type="submit" loading={loading}>Salvar alterações</Button>
      </div>
    </form>
  )
}
