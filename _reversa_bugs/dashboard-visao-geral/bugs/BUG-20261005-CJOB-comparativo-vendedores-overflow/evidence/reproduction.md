# Cápsula de reprodução — BUG-20261005-CJOB

- Commit base: `bd87e4bc` (branch `main`)
- Ambiente: macOS (darwin), Node >= 18.17, projeto Next.js 14 / React 18
- Alvo: `/dashboard` (Visão Geral) → card "Comparativo por vendedor"
- Classificação: `deterministic`, taxa `10/10`
- Comando/observação:

## Sintoma A — vendedores ausentes no comparativo

`comparativoPorVendedor` (`src/lib/dashboard-metrics.ts`) monta o mapa percorrendo apenas as
vendas do recorte no período e ignorando `CANCELADA`. Vendedor sem venda no período não entra no
resultado, logo não é plotado. A página ainda passa somente `perfis` como fonte de nomes, sem
semear a lista completa de vendedores.

Verificação determinística: iterar as vendas de outubro apenas de `u1` produz uma lista com um
único vendedor, mesmo quando existem `u1` e `u2` cadastrados como vendedores.

## Sintoma B — fonte grande transbordando o quadro

`ComparisonChart` usa `className="w-full"` sobre um `viewBox` de largura mínima fixa
(`Math.max(360, 16*2 + n*110)`) com `fontSize` em unidades do viewBox. Em um contêiner largo
(~1200px) com poucos vendedores, o SVG de 360x270 é esticado e amplia os textos junto:

```
escala aplicada: 3.33 | fontSize 12 -> 40.0px   (Node, contêiner 1200px, viewBox 360x270)
```

Resultado: rótulos de 40px saem do quadro e quebram a leitura.

## Passos

1. Login com papel `GESTOR`, `AUDITOR` ou `FINANCEIRO`.
2. Abrir `/dashboard` no período "Mês atual".
3. Observar o card "Comparativo por vendedor": ausência de vendedores sem venda no período e
   rótulos ampliados transbordando.
