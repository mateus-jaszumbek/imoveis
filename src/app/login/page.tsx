'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForgot, setShowForgot] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('E-mail ou senha incorretos.')
      setLoading(false)
      return
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()
    router.push(profile?.role === 'admin' ? '/admin/dashboard' : '/cliente/meu-imovel')
    router.refresh()
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })
    setForgotSent(true)
    setLoading(false)
  }

  if (showForgot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 mb-4">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Recuperar senha</h1>
            <p className="mt-1 text-sm text-gray-500">Digite seu e-mail para receber o link</p>
          </div>
          {forgotSent ? (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
              <p className="text-sm text-green-800 font-medium">E-mail enviado!</p>
              <p className="text-xs text-green-700 mt-1">Verifique sua caixa de entrada.</p>
              <button onClick={() => { setShowForgot(false); setForgotSent(false) }} className="mt-3 text-sm text-blue-600 hover:underline">
                Voltar ao login
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <Input id="email" label="E-mail" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              <Button type="submit" loading={loading} className="w-full">Enviar link</Button>
              <button type="button" onClick={() => setShowForgot(false)} className="w-full text-sm text-gray-500 hover:text-gray-700">
                Voltar ao login
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 mb-4">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Locadora</h1>
          <p className="mt-1 text-sm text-gray-500">Acesse o painel de gestão</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleLogin} className="space-y-4">
            <Input id="email" label="E-mail" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
            <Input id="password" label="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" loading={loading} className="w-full" size="lg">Entrar</Button>
          </form>
          <button
            type="button"
            onClick={() => setShowForgot(true)}
            className="mt-4 w-full text-center text-sm text-gray-500 hover:text-blue-600"
          >
            Esqueci minha senha
          </button>
        </div>
        <p className="mt-4 text-center text-sm text-gray-500">
          Não tem conta?{' '}
          <Link href="/cadastro" className="text-blue-600 hover:underline font-medium">
            Cadastre sua locadora
          </Link>
        </p>
      </div>
    </div>
  )
}
