# Guia de Configuração — Painel Locadora de Imóveis

---

## Opção A — Rodar tudo com Docker (recomendado para local e Hostinger)

Tudo fica em containers: banco, autenticação, storage, realtime e o Next.js.

### Pré-requisitos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e rodando
- Node.js 20+ (só para rodar o script de geração de chaves)

### Passo 1 — Criar o arquivo `.env`

```bash
cp .env.docker .env
```

Edite o `.env` e defina:

1. **`POSTGRES_PASSWORD`** — uma senha segura para o banco
2. **`JWT_SECRET`** — string aleatória com **pelo menos 32 caracteres** (crie no site [randomkeygen.com](https://randomkeygen.com) ou use `openssl rand -base64 32`)
3. **`SECRET_KEY_BASE`** — string hex de 128 chars:
   ```
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

### Passo 2 — Gerar as chaves JWT

Com o `JWT_SECRET` já definido no `.env`, execute:

```bash
node scripts/gerar-chaves.mjs
```

Copie o output (`ANON_KEY=...` e `SERVICE_ROLE_KEY=...`) e cole no `.env` substituindo os PLACEHOLDERs.

### Passo 3 — Subir os containers

```bash
docker compose up --build
```

Na primeira execução, o Docker baixa todas as imagens e constrói o Next.js (~5-10 min).
Nas próximas execuções, sem `--build`, é muito mais rápido.

### Passo 3.1 — Rodar as migrações do Realtime e aplicar o schema

O banco sobe só com os schemas internos do Supabase (auth, storage, roles). Faltam três
passos manuais que **não** rodam sozinhos no `docker compose up`:

```bash
# a) Migrações internas do Realtime (cria as tabelas _realtime.tenants/extensions)
docker compose run --rm realtime /app/bin/migrate

# b) Registrar o tenant "localhost" no Realtime (necessário para o chat funcionar)
#    Substitua $JWT_SECRET, $SERVICE_ROLE_KEY e $POSTGRES_PASSWORD pelos valores do seu .env
curl -X PUT "http://localhost:4000/api/tenants/localhost" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"tenant": {"name": "localhost", "external_id": "localhost", "jwt_secret": "'"$JWT_SECRET"'", "extensions": [{"type": "postgres_cdc_rls", "settings": {"db_host": "db", "db_name": "postgres", "db_user": "supabase_admin", "db_password": "'"$POSTGRES_PASSWORD"'", "db_port": "5432", "region": "us-east-1", "poll_interval": 100, "poll_max_record_bytes": 1048576, "ssl_enforced": false}}]}}'

# c) Aplicar o schema da aplicação (tabelas, RLS, storage policies) — só depois do banco estar de pé,
#    porque o schema referencia auth.users, que só existe depois que o serviço `auth` sobe.
docker compose exec -T db psql -U postgres -d postgres < supabase/schema.sql
```

> Isso só precisa ser feito uma vez por volume de banco (se você rodar `docker compose down -v`,
> repita os passos a-c).

### Passo 4 — Criar os buckets de Storage

Após o stack estar de pé, execute estes comandos (use as suas chaves do `.env`):

```bash
# Substitua ANON_KEY e SERVICE_ROLE_KEY pelos valores do seu .env
# Bucket público (fotos dos imóveis)
curl -X POST http://localhost:8000/storage/v1/bucket \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"id":"imovel-fotos","name":"imovel-fotos","public":true}'

# Bucket privado (documentos)
curl -X POST http://localhost:8000/storage/v1/bucket \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"id":"documentos","name":"documentos","public":false}'

# Bucket privado (anexos do chat)
curl -X POST http://localhost:8000/storage/v1/bucket \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"id":"chat-anexos","name":"chat-anexos","public":false}'
```

No Windows (PowerShell), substitua `$SERVICE_ROLE_KEY` e `$ANON_KEY` pelos valores diretos.

### Passo 5 — Criar o primeiro usuário ADM

Conecte diretamente ao banco e execute:

```bash
docker compose exec db psql -U postgres -d postgres -c "
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@locadora.com',
    crypt('senha123', gen_salt('bf')),
    now(), now(), now(),
    '{\"provider\":\"email\",\"providers\":[\"email\"]}',
    '{}',
    '', '', '', '', ''
  );
"
```

> As colunas `confirmation_token`/`recovery_token`/`email_change*` precisam ser string vazia,
> não `NULL` — o GoTrue quebra o login com `500: Database error querying schema` se ficarem `NULL`.
> Pelo mesmo motivo, se você criar inquilinos manualmente via SQL direto na tabela `auth.users`
> (em vez de usar a tela **Inquilinos > Novo**, que já cuida disso), lembre de setar
> `role = 'authenticated'` também — a Admin API do GoTrue (`inviteUserByEmail`/`createUser`)
> não define essa coluna sozinha nesta versão.

Em seguida, atualize o perfil para admin:

```bash
docker compose exec db psql -U postgres -d postgres -c "
  UPDATE public.profiles SET role = 'admin', nome = 'Administrador'
  WHERE email = 'admin@locadora.com';
"
```

> **Alternativa mais simples:** crie o usuário pelo painel de autenticação do Supabase
> acessando `http://localhost:8000/auth/v1` com a service role key — ou use a
> rota `/api/admin/criar-inquilino` da própria aplicação após ter o primeiro admin criado
> manualmente.

### Acessos locais

| Serviço | URL |
|---------|-----|
| Aplicação | http://localhost:3000 |
| API Supabase | http://localhost:8000 |
| E-mails capturados (Inbucket) | http://localhost:9000 |
| Banco de dados direto | `localhost:5432` (user: postgres) |

### Parar / reiniciar

```bash
docker compose down          # Para tudo (dados preservados nos volumes)
docker compose down -v       # Para e APAGA os volumes (dados perdidos)
docker compose restart app   # Reinicia só o Next.js
```

---

## Opção B — Desenvolvimento local sem Docker (mais rápido para codar)

Útil quando você quer hot-reload do Next.js durante o desenvolvimento.

### 1. Criar projeto no Supabase Cloud

1. Acesse [supabase.com](https://supabase.com) → **New Project**
2. Em **Settings > API**, anote:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### 2. Configurar `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Executar o schema

No Supabase Dashboard → **SQL Editor** → cole e execute `supabase/schema.sql`.

### 4. Criar buckets de Storage

**Storage** → **New bucket**:

| Bucket | Público? |
|--------|----------|
| `imovel-fotos` | ✅ Sim |
| `documentos` | ❌ Não |
| `chat-anexos` | ❌ Não |

### 5. Criar o primeiro ADM

**Authentication** → **Users** → **Add user** → depois no SQL Editor:

```sql
UPDATE public.profiles SET role = 'admin', nome = 'Seu Nome'
WHERE email = 'seu@email.com';
```

### 6. Rodar

```bash
npm run dev
```

Acesse: http://localhost:3000

---

## Deploy no Hostinger (VPS com Docker)

1. No seu VPS Hostinger, instale Docker e Docker Compose
2. Faça `git clone` do repositório
3. Siga a **Opção A** acima, mas mude no `.env`:
   ```
   SITE_URL=https://seudominio.com.br
   API_EXTERNAL_URL=https://api.seudominio.com.br
   ```
4. No `docker-compose.yml`, mude o build arg do serviço `app`:
   ```yaml
   args:
     NEXT_PUBLIC_SUPABASE_URL: https://api.seudominio.com.br
   ```
5. Configure um reverse proxy (Nginx/Caddy) no VPS para mapear:
   - `seudominio.com.br` → `localhost:3000`
   - `api.seudominio.com.br` → `localhost:8000`
6. `docker compose up --build -d`

---

## Estrutura do projeto

```
src/
  app/
    login/              → Página de login
    admin/              → Painel do ADM (protegido)
      dashboard/        → Visão geral
      imoveis/          → CRUD de imóveis + fotos
      inquilinos/       → Cadastro de inquilinos
      locacoes/         → Vínculos inquilino ↔ imóvel
      boletos/          → Visão geral de boletos
      documentos/       → Visão geral de documentos
      mensagens/        → Caixa de entrada do chat
    cliente/            → Painel do inquilino (protegido)
      meu-imovel/       → Dados do imóvel
      meus-boletos/     → Status e download de boletos
      meus-documentos/  → Download de contratos
      chat/             → Chat com o ADM
    privacidade/        → Política de privacidade LGPD
    api/
      admin/criar-inquilino/ → Cria usuário via service role
  components/
    ui/                 → Botões, inputs, modais, cards, toast
    layout/             → Sidebars admin e cliente
    imoveis/            → Formulários e upload de fotos
    inquilinos/         → Formulários
    locacoes/           → Formulários
    boletos/            → Listas e modais de boleto
    documentos/         → Upload e download de documentos
    chat/               → Chat admin e cliente com Realtime
  lib/
    supabase/
      client.ts         → Cliente para o browser
      server.ts         → Cliente para o servidor (usa SUPABASE_INTERNAL_URL no Docker)
    types.ts            → Tipos TypeScript do banco
    utils.ts            → Formatadores (moeda, data, etc.)
  proxy.ts              → Controle de acesso por rota
supabase/
  schema.sql            → Schema completo do banco + RLS
docker/
  nginx.conf            → Gateway que une todos os serviços Supabase
scripts/
  gerar-chaves.mjs      → Gera ANON_KEY e SERVICE_ROLE_KEY
Dockerfile              → Build da imagem Next.js (standalone)
docker-compose.yml      → Stack completo (banco + auth + realtime + storage + app)
.env.docker             → Template de variáveis de ambiente
```

## Multi-tenant (várias locadoras)

O sistema suporta múltiplas locadoras isoladas entre si — qualquer pessoa pode
criar sua própria conta de administrador em `/cadastro` (nome da locadora, nome,
e-mail, senha). A partir daí, essa locadora só enxerga os próprios imóveis,
inquilinos, locações, boletos, documentos e mensagens — nunca dados de outra
locadora que também use o sistema. Isso é garantido por RLS no Postgres
(coluna `locadora_id` + policies), não só pela interface.

Se você já tinha um banco rodando antes dessa funcionalidade existir, rode
`supabase/migrate-multi-tenant.sql` uma única vez para migrar os dados
existentes sem perdê-los (instalações novas já usam `supabase/schema.sql`,
que já vem pronto).

## Checklist de validação

- [ ] Logar como ADM e acessar `/admin/dashboard`
- [ ] Cadastrar um imóvel e subir fotos
- [ ] Cadastrar um inquilino (admin define e-mail e senha de acesso na hora)
- [ ] Criar uma locação vinculando inquilino ↔ imóvel
- [ ] Subir um contrato na aba de documentos da locação
- [ ] Cadastrar um boleto e marcar como pago
- [ ] Agendar uma visita a um imóvel (sem precisar de conta do visitante)
- [ ] Agendar entrega/retirada de chaves de uma locação e marcar como realizado
- [ ] Logar como cliente e verificar que **só vê o próprio imóvel**
- [ ] Trocar mensagens no chat (ADM → cliente e cliente → ADM)
- [ ] Anexar uma foto no chat
- [ ] Baixar um documento como cliente (via link temporário)
- [ ] Cadastrar uma segunda locadora em `/cadastro` e confirmar que ela **não vê** nada da primeira
- [ ] Testar no celular (mobile-first)
