// Script único, usado para gerar os screenshots reais da apresentação comercial (/apresentacao).
// Roda contra o ambiente local (docker-compose) com dados de demonstração já semeados.
// Uso: node scripts/capturar-apresentacao.mjs
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const BASE_URL = 'http://localhost:3000';
const OUT_DIR = 'public/apresentacao';

const VIEWPORT = { width: 1440, height: 900 };

async function login(page, email, senha) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', senha);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15000 });
  await page.waitForLoadState('networkidle');
}

async function shot(page, path, outName, opts = {}) {
  await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(opts.wait ?? 600);
  await page.screenshot({ path: `${OUT_DIR}/${outName}.png`, fullPage: opts.fullPage ?? false });
  console.log('captured', outName);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  // ---- Admin ----
  await login(page, 'admin@locadora.com', 'senha123');
  await shot(page, '/admin/dashboard', 'admin-dashboard');
  await shot(page, '/admin/financeiro', 'admin-financeiro', { wait: 1200 });
  await shot(page, '/admin/imoveis', 'admin-imoveis');
  await shot(page, '/admin/imoveis/26a330da-55e4-46d9-9987-eaf2e17ebcce', 'admin-imovel-detalhe', { wait: 900 });
  await shot(page, '/admin/locacoes', 'admin-locacoes');
  await shot(page, '/admin/boletos', 'admin-boletos');
  await shot(page, '/admin/proprietarios', 'admin-proprietarios');
  await shot(page, '/admin/inquilinos', 'admin-inquilinos').catch(() => {});
  await shot(page, '/admin/agenda', 'admin-agenda').catch(() => {});
  await shot(page, '/admin/mensagens', 'admin-mensagens').catch(() => {});
  await context.close();

  // ---- Proprietário ----
  const ctxProp = await browser.newContext({ viewport: VIEWPORT });
  const pageProp = await ctxProp.newPage();
  await login(pageProp, 'proprietario.demo@teste.com', 'senha123');
  await shot(pageProp, '/proprietario/meus-imoveis', 'proprietario-meus-imoveis');
  await shot(pageProp, '/proprietario/repasses', 'proprietario-repasses', { wait: 900 });
  await ctxProp.close();

  // ---- Cliente / inquilino ----
  const ctxCliente = await browser.newContext({ viewport: VIEWPORT });
  const pageCliente = await ctxCliente.newPage();
  await login(pageCliente, 'inquilino.casa@teste.com', 'senha123');
  await shot(pageCliente, '/cliente/meu-imovel', 'cliente-meu-imovel');
  await shot(pageCliente, '/cliente/meus-boletos', 'cliente-meus-boletos');
  await ctxCliente.close();

  await browser.close();
  console.log('done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
