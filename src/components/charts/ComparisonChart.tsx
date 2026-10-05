"use client";

import { formatBRL, type ComparativoLinha } from '@/lib/dashboard-metrics';

const GROUP_W = 110;
const BAR_W = 26;
const BAR_GAP = 4;
const CHART_H = 200;
const TOP = 12;
const LEFT = 16;
const BOTTOM = 58;

function truncar(nome: string, max = 14): string {
  return nome.length > max ? `${nome.slice(0, max - 1)}…` : nome;
}

export default function ComparisonChart({ dados }: { dados: ComparativoLinha[] }) {
  const max = Math.max(1, ...dados.flatMap((d) => [d.valor, d.repasse]));
  const width = Math.max(360, LEFT * 2 + dados.length * GROUP_W);
  const height = TOP + CHART_H + BOTTOM;
  const base = TOP + CHART_H;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Comparativo lado a lado por vendedor" className="w-full">
        <title>Comparativo lado a lado por vendedor</title>
        <line x1={LEFT} y1={base} x2={width - LEFT} y2={base} stroke="#334155" strokeWidth={1} />
        {dados.map((d, i) => {
          const groupX = LEFT + i * GROUP_W;
          const barsX = groupX + (GROUP_W - (2 * BAR_W + BAR_GAP)) / 2;
          const hValor = (d.valor / max) * CHART_H;
          const hRepasse = (d.repasse / max) * CHART_H;
          return (
            <g key={d.vendedor_id}>
              <rect x={barsX} y={base - hValor} width={BAR_W} height={hValor} rx={4} fill="#f43f5e" fillOpacity={0.85}>
                <title>{`${truncar(d.nome)} · Entradas ${formatBRL(d.valor)}`}</title>
              </rect>
              <rect x={barsX + BAR_W + BAR_GAP} y={base - hRepasse} width={BAR_W} height={hRepasse} rx={4} fill="#d946ef" fillOpacity={0.85}>
                <title>{`${truncar(d.nome)} · Repasse ${formatBRL(d.repasse)}`}</title>
              </rect>
              <text x={groupX + GROUP_W / 2} y={base + 18} textAnchor="middle" fill="#cbd5e1" fontSize="12">
                {truncar(d.nome)}
              </text>
              <text x={groupX + GROUP_W / 2} y={base + 34} textAnchor="middle" fill="#94a3b8" fontSize="11">
                {d.quantidade} vendas
              </text>
            </g>
          );
        })}
      </svg>

      <table className="sr-only">
        <caption>Comparativo por vendedor</caption>
        <thead>
          <tr>
            <th>Vendedor</th>
            <th>Vendas</th>
            <th>Entradas</th>
            <th>Repasse</th>
          </tr>
        </thead>
        <tbody>
          {dados.map((d) => (
            <tr key={d.vendedor_id}>
              <td>{d.nome}</td>
              <td>{d.quantidade}</td>
              <td>{formatBRL(d.valor)}</td>
              <td>{formatBRL(d.repasse)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
