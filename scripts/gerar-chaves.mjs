#!/usr/bin/env node
/**
 * Gera ANON_KEY e SERVICE_ROLE_KEY a partir do JWT_SECRET definido no .env
 *
 * Uso:
 *   node scripts/gerar-chaves.mjs
 *
 * Pré-requisito: defina JWT_SECRET no arquivo .env (ou .env.docker)
 */
import { createHmac } from 'crypto'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// Lê JWT_SECRET do ambiente ou do arquivo .env / .env.docker
let secret = process.env.JWT_SECRET
if (!secret) {
  for (const fname of ['.env', '.env.docker']) {
    const fpath = resolve(fname)
    if (existsSync(fpath)) {
      const m = readFileSync(fpath, 'utf8').match(/^JWT_SECRET=(.+)$/m)
      if (m) { secret = m[1].trim(); break }
    }
  }
}

if (!secret || secret.includes('SUBSTITUA') || secret.length < 32) {
  console.error('\n❌ JWT_SECRET não encontrado ou inválido.')
  console.error('   Edite o arquivo .env e defina JWT_SECRET com pelo menos 32 caracteres.\n')
  process.exit(1)
}

function b64url(str) {
  return Buffer.from(str).toString('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function jwt(payload) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body   = b64url(JSON.stringify(payload))
  const sig    = createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  return `${header}.${body}.${sig}`
}

const iat = Math.floor(Date.now() / 1000)
const exp = iat + 10 * 365 * 24 * 3600 // 10 anos

const anonKey    = jwt({ role: 'anon',         iss: 'supabase', iat, exp })
const serviceKey = jwt({ role: 'service_role', iss: 'supabase', iat, exp })

console.log('\n# Cole estas duas linhas no arquivo .env (substitua os PLACEHOLDERs):')
console.log(`ANON_KEY=${anonKey}`)
console.log(`SERVICE_ROLE_KEY=${serviceKey}`)
console.log(`\n✅ Gerado com JWT_SECRET: ${secret.slice(0, 6)}...${secret.slice(-4)} (${secret.length} chars)\n`)
