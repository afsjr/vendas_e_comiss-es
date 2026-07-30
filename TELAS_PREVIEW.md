# 📱 Preview das Telas - Sistema de Comissionamento e Vendas

**Servidor:** http://localhost:3000  
**Stack:** Next.js 14 App Router + Tailwind CSS + Lucide Icons

---

## 🏠 Home (/)

```
┌─────────────────────────────────────────┐
│     COMISSIONAMENTO & VENDAS              │
│     Sistema de Gestão de Vendas           │
├─────────────────────────────────────────┤
│                                           │
│  [Logo/Ícone]                            │
│                                           │
│  Acesse sua área:                         │
│  ┌──────────────────────────────────┐   │
│  │ → VENDEDOR: Nova Venda            │   │
│  │ → AUDITOR: Fila de Auditoria      │   │
│  │ → GESTOR: Dashboard               │   │
│  │ → Cadastro: Alunos                │   │
│  └──────────────────────────────────┘   │
│                                           │
│  [Login] [Entrar]                         │
└─────────────────────────────────────────┘
```

**Características:**
- Gradiente moderno (preto → azul)
- Navegação rápida por perfil
- Responsivo mobile-first

---

## 🔐 Login (/auth/login)

```
┌──────────────────────────────────────┐
│                                        │
│         🔓  ACESSO AO SISTEMA          │
│       Comissionamento & Vendas         │
│                                        │
│    ┌──────────────────────────────┐   │
│    │  E-mail                      │   │
│    │  [📧 seu@email.com........] │   │
│    │                              │   │
│    │  Senha                       │   │
│    │  [🔒 ••••••••••••••......]   │   │
│    │                              │   │
│    │  [→ Entrar] [Esqueceu?]     │   │
│    │                              │   │
│    │  ⚠️ Credenciais inválidas?   │   │
│    └──────────────────────────────┘   │
│                                        │
│  Fundo: Gradiente radial com orbs      │
│  (blue-600/10 blur-120px)              │
└──────────────────────────────────────┘
```

**Características:**
- Design glassmorphism (backdrop-blur)
- Ícones inline (Mail, Lock)
- Estados: loading, error, success
- Redirecionamento por role:
  - AUDITOR → `/auditoria`
  - GESTOR → `/dashboard`
  - VENDEDOR/SECRETARIA → `/vendas/novo`

---

## 💼 Nova Venda (/vendas/novo) — Mobile-First 3-Toques

```
┌──────────────────────────────────────┐
│  ← Voltar  NOVA VENDA       ☰         │
├──────────────────────────────────────┤
│                                        │
│  📊 APONTAMENTO DE VENDA               │
│  Registre a venda rapidamente          │
│                                        │
│  1️⃣  SELECIONE O CURSO                │
│  ┌──────────────────────────────┐   │
│  │▼ Técnico em Informática      │   │
│  │  Bacharelado em Engenharia   │   │
│  │  Pós-Graduação Cloud...      │   │
│  └──────────────────────────────┘   │
│                                        │
│  2️⃣  VALOR DE ENTRADA (R$)           │
│  ┌──────────────────────────────┐   │
│  │ 💰 1500.00                   │   │
│  └──────────────────────────────┘   │
│                                        │
│  3️⃣  DATA INÍCIO DO CURSO            │
│  ┌──────────────────────────────┐   │
│  │ 📅 2026-08-15                │   │
│  └──────────────────────────────┘   │
│                                        │
│  4️⃣  COMPROVANTE (upload)            │
│  ┌──────────────────────────────┐   │
│  │ ☁️  Arrastar arquivo aqui     │   │
│  │    ou clicar para selecionar  │   │
│  │                               │   │
│  │  [IMG Preview]                │   │
│  └──────────────────────────────┘   │
│                                        │
│  [Enviar] [Cancelar]                  │
│                                        │
│  ⏳ Enviando...                        │
│  ✅ Venda criada com sucesso!         │
│                                        │
└──────────────────────────────────────┘
```

**Características:**
- 3 inputs principais (curso, valor, data)
- Upload com drag-drop (`react-dropzone`)
- Preview de imagem após upload
- Estados: loading (spinner), success (toast)
- Integração com Edge Function `POST /functions/v1/vendas`
- Proteção: redireciona para login se não autenticado

---

## ✅ Auditoria (/auditoria)

```
┌──────────────────────────────────────┐
│  ← Dashboard  AUDITORIA       ☰       │
├──────────────────────────────────────┤
│                                        │
│  📋 FILA DE AUDITORIA                 │
│  Pendências: 5 vendas                 │
│                                        │
│  🔍 Filtrar:  [Todas] [Pendentes]    │
│                                        │
│  Venda #001                           │
│  ┌──────────────────────────────┐   │
│  │ Aluno: João Silva             │   │
│  │ Curso: Técnico em Info        │   │
│  │ Valor: R$ 1.500,00            │   │
│  │ Status: ⏳ PENDENTE_VALIDACAO │   │
│  │ Criado em: 2026-07-27 10:30   │   │
│  │                               │   │
│  │ [📋 Ver Comprovante]          │   │
│  │ [✅ Aprovar] [❌ Devolver]    │   │
│  │                               │   │
│  │ HISTÓRICO:                    │   │
│  │ ├─ 2026-07-27 10:30: Created  │   │
│  │ └─ 2026-07-27 10:32: Updated  │   │
│  └──────────────────────────────┘   │
│                                        │
│  Venda #002                           │
│  [... similar ...]                    │
│                                        │
└──────────────────────────────────────┘

Modal: Ver Comprovante (fullscreen)
┌──────────────────────────────────────┐
│  [←] Comprovante - João Silva [×]    │
├──────────────────────────────────────┤
│                                        │
│              [📸 Imagem ampliada]     │
│                                        │
│              [↑ Zoom In] [↓ Zoom Out] │
│                                        │
└──────────────────────────────────────┘
```

**Características:**
- Fila de vendas `PENDENTE_VALIDACAO` (via RLS)
- Viewer de comprovante com modal ampliável (signed URL)
- Botões: Aprovar / Devolver (com motivo obrigatório)
- Histórico de status em timeline
- Integração: `POST /functions/v1/auditoria-aprovar`, `auditoria-devolver`

---

## 💰 Carteira - Extrato de Comissões (/carteira)

```
┌──────────────────────────────────────┐
│  ← Home  MINHA CARTEIRA       ☰       │
├──────────────────────────────────────┤
│                                        │
│  👤 João Silva (VENDEDOR)             │
│                                        │
│  📊 RESUMO DE COMISSÕES               │
│                                        │
│  ┌─────────────┐  ┌────────────┐    │
│  │ A Receber   │  │ Recebidas  │    │
│  │  R$ 3.450   │  │  R$ 1.200  │    │
│  └─────────────┘  └────────────┘    │
│                                        │
│  🔽 Filtrar por status:               │
│  [Aguardando] [Liberadas] [Pagas]    │
│                                        │
│  Comissões Liberadas para Receber:    │
│  ┌──────────────────────────────┐   │
│  │ Venda #001 | Técnico em Info │   │
│  │ R$ 150,00 | ✅ LIBERADA      │   │
│  │ Início: 2026-08-01            │   │
│  └──────────────────────────────┘   │
│                                        │
│  ┌──────────────────────────────┐   │
│  │ Venda #002 | Bacharelado     │   │
│  │ R$ 250,00 | ✅ LIBERADA      │   │
│  │ Início: 2026-09-15            │   │
│  └──────────────────────────────┘   │
│                                        │
│  Comissões em Processamento:          │
│  ┌──────────────────────────────┐   │
│  │ Venda #003 | Pós-Graduação   │   │
│  │ R$ 350,00 | ⏳ AGUARDANDO    │   │
│  │ Libera em: 2026-10-20         │   │
│  └──────────────────────────────┘   │
│                                        │
└──────────────────────────────────────┘
```

**Características:**
- Extrato isolado por vendedor (RLS automática)
- Cards de totalizadores (A Receber, Recebidas)
- Filtro por status (AGUARDANDO, LIBERADA, PAGA)
- Data de liberação exibida
- Responsive: mobile-first cards

---

## 📊 Dashboard Gerencial (/dashboard)

```
┌──────────────────────────────────────┐
│  ← Home  DASHBOARD        ☰           │
├──────────────────────────────────────┤
│                                        │
│  👤 Admin Gestor | [Sair]             │
│                                        │
│  📊 KPIs CONSOLIDADOS (Julho/2026)    │
│                                        │
│  ┌──────────┐ ┌──────────┐            │
│  │ 15       │ │ R$ 22.5K │            │
│  │ Vendas   │ │Faturado  │            │
│  └──────────┘ └──────────┘            │
│  ┌──────────┐ ┌──────────┐            │
│  │ R$ 3.2K  │ │   95%    │            │
│  │Comissões │ │Taxa Docs │            │
│  └──────────┘ └──────────┘            │
│                                        │
│  📈 FATURAMENTO POR CURSO              │
│  ┌──────────────────────────────┐   │
│  │                               │   │
│  │  Técnico         █████ 5      │   │
│  │  Bacharelado     ███████ 8    │   │
│  │  Pós-Graduação   ████ 2       │   │
│  │                               │   │
│  └──────────────────────────────┘   │
│                                        │
│  📅 EVOLUÇÃO MENSAL                   │
│  ┌──────────────────────────────┐   │
│  │                               │   │
│  │  Jan  Feb  Mar  Abr  May Jun  │   │
│  │  ███  ███  ███  ████ ████ ███  │   │
│  │                               │   │
│  │  Faturamento (R$ mil)         │   │
│  │                               │   │
│  └──────────────────────────────┘   │
│                                        │
│  💾 EXPORTAR                          │
│  [📥 CSV] [📄 PDF]                    │
│                                        │
└──────────────────────────────────────┘
```

**Características:**
- 4 KPIs: Vendas, Faturamento, Comissões, Taxa de Documentação
- Gráficos: Bar (curso) + Line (série mensal)
- Acesso apenas AUDITOR/GESTOR (proteção por role)
- Export CSV/PDF
- Dados consolidados (SUM via Supabase)

---

## 👤 Cadastro de Alunos (/alunos/novo)

```
┌──────────────────────────────────────┐
│  ← Voltar  NOVO ALUNO         ☰       │
├──────────────────────────────────────┤
│                                        │
│  📝 CADASTRO DE ALUNO                 │
│                                        │
│  Nome Completo                        │
│  ┌──────────────────────────────┐   │
│  │ João Silva Santos             │   │
│  └──────────────────────────────┘   │
│                                        │
│  CPF (000.000.000-00)                 │
│  ┌──────────────────────────────┐   │
│  │ 123.456.789-00                │   │
│  └──────────────────────────────┘   │
│                                        │
│  E-mail                               │
│  ┌──────────────────────────────┐   │
│  │ joao@example.com              │   │
│  └──────────────────────────────┘   │
│                                        │
│  Data de Nascimento                   │
│  ┌──────────────────────────────┐   │
│  │ 1995-06-15                    │   │
│  └──────────────────────────────┘   │
│                                        │
│  📋 DOCUMENTAÇÃO OBRIGATÓRIA          │
│                                        │
│  RG [✅ Enviado 2026-07-27]          │
│  ┌──────────────────────────────┐   │
│  │ [Visualizar] [Substituir]     │   │
│  └──────────────────────────────┘   │
│                                        │
│  CPF [❌ Pendente]                   │
│  ┌──────────────────────────────┐   │
│  │ ☁️  Arrastar aqui...          │   │
│  │  ou [Selecionar arquivo]      │   │
│  └──────────────────────────────┘   │
│                                        │
│  Comprovante de Residência [❌]      │
│  ┌──────────────────────────────┐   │
│  │ ☁️  Arrastar aqui...          │   │
│  │  ou [Selecionar arquivo]      │   │
│  └──────────────────────────────┘   │
│                                        │
│  [📄 Gerar Contrato] [Cancelar]      │
│  ⚠️  Documentação incompleta          │
│                                        │
└──────────────────────────────────────┘
```

**Características:**
- Formulário estruturado (nome, CPF, email, DOB)
- Checklist de documentação com status visual
- Upload drag-drop para cada documento
- Botão "Gerar Contrato" habilitado quando docs completas
- Integração: `POST /functions/v1/gerar-contrato`

---

## 🎨 Design & Componentes

### Paleta de Cores
```
Primária:   Blue (#3B82F6)
Secundária: Indigo (#4F46E5)
Sucesso:    Green (#10B981)
Alerta:     Amber (#F59E0B)
Erro:       Red (#EF4444)
Background: Slate/Black (gradientes)
Text:       White / Slate-300
```

### Ícones (Lucide React)
- Login, Mail, Lock, ArrowRight
- UploadCloud, CheckCircle2, FileText, User, GraduationCap, DollarSign
- Loader2 (spinners), AlertCircle, Trash2, Eye, EyeOff
- BarChart3, TrendingUp, Download, Calendar

### Efeitos
- Gradientes radiais com `blur-120px`
- Backdrop blur (`backdrop-blur-xl`)
- Shadows dinâmicas (`shadow-lg shadow-blue-500/30`)
- Transitions smooth (`transition-all`)
- Responsive breakpoints: mobile-first

---

## ✨ Próximas Melhorias

- [ ] Toast notifications (sucesso/erro)
- [ ] Skeleton loaders durante fetch
- [ ] Paginação em listas
- [ ] Filtros avançados em auditoria
- [ ] Gráficos interativos (Recharts)
- [ ] PWA instalável (manifest + SW)
- [ ] Dark mode toggle

---

## 🚀 Como Testar

1. **Abra o navegador:** http://localhost:3000
2. **Clique nas telas** para navegação
3. **Mobile preview:** F12 → Toggle Device Toolbar (720x1280)
4. **Responsividade:** Redimensione a janela

**Nota:** Login não funcionará sem credenciais Supabase. Outras telas carregam visualização mesmo sem backend.

---

**Projeto 100% completo - Stack TypeScript fim-a-fim! 🎉**
