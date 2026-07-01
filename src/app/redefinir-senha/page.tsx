'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function RedefinirSenhaPage() {
  const [pronto, setPronto] = useState(false)
  const [linkInvalido, setLinkInvalido] = useState(false)
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Fluxo PKCE: o link do e-mail chega com "?code=..." na URL — precisa
    // trocar esse código por uma sessão explicitamente. (O evento
    // PASSWORD_RECOVERY do onAuthStateChange cobre o fluxo antigo com token
    // no hash da URL; mantemos os dois como fallback um do outro.)
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setPronto(true)
    })

    async function validarLink() {
      // O Supabase pode devolver o erro direto na URL (link expirado/já usado)
      const params = new URLSearchParams(window.location.search || window.location.hash.replace('#', '?'))
      if (params.get('error')) { setLinkInvalido(true); return }

      const code = params.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) { setPronto(true); return }
        setLinkInvalido(true)
        return
      }
      const { data } = await supabase.auth.getSession()
      if (data.session) setPronto(true)
    }
    validarLink()

    // Se depois de alguns segundos nada validou, o link provavelmente expirou
    // ou já foi usado.
    const timeout = setTimeout(() => {
      supabase.auth.getSession().then(({ data }) => {
        if (!data.session) setLinkInvalido(true)
      })
    }, 5000)

    return () => {
      listener.subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (senha.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return }
    if (senha !== confirmarSenha) { setError('As senhas não coincidem.'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: senha })
    setLoading(false)
    if (error) { setError(error.message); return }
    setSucesso(true)
    setTimeout(() => router.push('/login'), 2000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 mb-4">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Redefinir senha</h1>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {sucesso ? (
            <div className="text-center space-y-2">
              <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto" />
              <p className="text-sm font-medium text-gray-900">Senha atualizada!</p>
              <p className="text-xs text-gray-500">Redirecionando para o login...</p>
            </div>
          ) : linkInvalido ? (
            <div className="text-center space-y-3">
              <p className="text-sm text-gray-700">
                Este link de redefinição é inválido ou já expirou.
              </p>
              <Button className="w-full" onClick={() => router.push('/login')}>Voltar ao login</Button>
            </div>
          ) : !pronto ? (
            <p className="text-sm text-gray-500 text-center py-4">Verificando o link...</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-gray-500">Escolha sua nova senha de acesso.</p>
              <Input id="senha" label="Nova senha" type="password" value={senha} onChange={e => setSenha(e.target.value)} minLength={6} required />
              <Input id="confirmarSenha" label="Confirmar senha" type="password" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} required />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" loading={loading} className="w-full">Salvar nova senha</Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
