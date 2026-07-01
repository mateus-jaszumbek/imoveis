'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function CadastroPage() {
  const [form, setForm] = useState({ nome_locadora: '', nome: '', email: '', senha: '', confirmarSenha: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.senha !== form.confirmarSenha) {
      setError('As senhas não coincidem.')
      return
    }
    setLoading(true)
    const res = await fetch('/api/cadastro-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error ?? 'Erro ao cadastrar')
      setLoading(false)
      return
    }
    const { error: loginError } = await supabase.auth.signInWithPassword({ email: form.email, password: form.senha })
    setLoading(false)
    if (loginError) {
      router.push('/login')
      return
    }
    router.push('/admin/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 mb-4">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Cadastre sua locadora</h1>
          <p className="mt-1 text-sm text-gray-500 text-center">Crie sua conta de administrador e comece a gerenciar seus imóveis</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input id="nome_locadora" label="Nome da locadora" value={form.nome_locadora} onChange={set('nome_locadora')} placeholder="Ex: Imóveis Silva" required />
            <Input id="nome" label="Seu nome" value={form.nome} onChange={set('nome')} required />
            <Input id="email" label="E-mail" type="email" value={form.email} onChange={set('email')} placeholder="seu@email.com" required />
            <Input id="senha" label="Senha" type="password" value={form.senha} onChange={set('senha')} placeholder="Mínimo 6 caracteres" minLength={6} required />
            <Input id="confirmarSenha" label="Confirmar senha" type="password" value={form.confirmarSenha} onChange={set('confirmarSenha')} required />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" loading={loading} className="w-full" size="lg">Criar conta</Button>
          </form>
        </div>
        <p className="mt-4 text-center text-sm text-gray-500">
          Já tem uma conta?{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
