const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const outputDir = '/Users/itouch/Documents/projetos_escola/comissionamento e venda/screenshots';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const pages = [
  { url: 'http://localhost:3000', name: '01-home' },
  { url: 'http://localhost:3000/auth/login', name: '02-login' },
  { url: 'http://localhost:3000/vendas/novo', name: '03-vendas-novo' },
  { url: 'http://localhost:3000/auditoria', name: '04-auditoria' },
  { url: 'http://localhost:3000/carteira', name: '05-carteira' },
  { url: 'http://localhost:3000/dashboard', name: '06-dashboard' },
  { url: 'http://localhost:3000/alunos/novo', name: '07-alunos-novo' },
];

(async () => {
  const browser = await chromium.launch();
  const context = await browser.createBrowserContext({
    viewport: { width: 1280, height: 720 }
  });
  
  for (const page of pages) {
    try {
      console.log(`📸 Capturando: ${page.name}...`);
      const p = await context.newPage();
      await p.goto(page.url, { waitUntil: 'networkidle', timeout: 10000 });
      await p.screenshot({ 
        path: path.join(outputDir, `${page.name}.png`),
        fullPage: true 
      });
      console.log(`✅ ${page.name}.png salvo`);
      await p.close();
    } catch (e) {
      console.log(`⚠️ Erro ao capturar ${page.name}: ${e.message}`);
    }
  }
  
  await context.close();
  await browser.close();
  console.log('\n🎉 Screenshots salvos em:', outputDir);
})();
