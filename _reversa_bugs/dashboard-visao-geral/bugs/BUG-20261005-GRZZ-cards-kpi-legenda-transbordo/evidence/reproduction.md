# Cápsula de reprodução — BUG-20261005-GRZZ

- Ambiente: MacBook Pro 13", navegador a 100%; macOS (darwin)
- Alvo: `/dashboard` (Visão Geral)
- Classificação: `deterministic`, taxa `10/10`
- Evidência visual: imagem enviada no chat (captura da tela)

## Cálculo determinístico do transbordo

Viewport lógico ~1440px; conteúdo `max-w-7xl` (1280) menos `lg:p-10` (80) = ~1200px.

### Cards de KPI (grid xl:grid-cols-5, gap 24)

- largura por card = (1200 - 4*24) / 5 = 220,8px
- largura útil = 220,8 - 2*24 (p-6) = ~172,8px
- "R$ 4.858,89" em `text-3xl` (30px) bold: ~10 glifos a ~17-18px = ~175-185px -> ultrapassa a borda

### Legenda "Entradas por categoria" (coluna lg:col-span-1)

- largura da coluna = (1200 - 2*24) / 3 = 384px; útil = 384 - 48 = ~336px
- layout `sm:flex-row`: donut `w-44` (176) + `gap-4` (16) -> sobra ~144px para a legenda
- item "Cursos Livres" (~90px) + gap (12) + "84% · R$ 4.083,89" (~120px) = ~222px > 144px -> cortado à direita

## Passos

1. Login com `GESTOR`/`AUDITOR`/`FINANCEIRO`.
2. Abrir `/dashboard` em MacBook Pro 13" a 100%.
3. Observar os valores dos cards saindo da borda e a legenda de categoria cortada.
