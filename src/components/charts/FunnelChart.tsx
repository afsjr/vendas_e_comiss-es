"use client";

import { formatBRL, ROTULO_ETAPA, type FunilEtapa } from '@/lib/dashboard-metrics';

const ROW_H = 40;
const GAP = 10;
const LABEL_W = 200;
const VALUE_W = 170;
const WIDTH = 720;

export default function FunnelChart({ dados }: { dados: FunilEtapa[] }) {
  const max = Math.max(1, ...dados.map((d) => d.quantidade));
  const barMax = WIDTH - LABEL_W - VALUE_W;
  const height = Math.max(1, dados.length) * (ROW_H + GAP) + 10;

  return (
    <div>
      <svg viewBox={`0 0 ${WIDTH} ${height}`} role="img" aria-label="Funil de vendas por etapa" className="w-full">
        <title>Funil de vendas por etapa</title>
        {dados.map((d, i) => {
          const y = i * (ROW_H + GAP);
          const w = d.quantidade > 0 ? Math.max(4, (d.quantidade / max) * barMax) : 0;
          return (
            <g key={d.etapa}>
              <text x={0} y={y + ROW_H / 2 + 4} fill="#cbd5e1" fontSize="13">
                {ROTULO_ETAPA[d.etapa] || d.etapa}
              </text>
              <rect x={LABEL_W} y={y + 8} width={barMax} height={ROW_H - 16} rx={6} fill="#1e293b" />
              <rect x={LABEL_W} y={y + 8} width={w} height={ROW_H - 16} rx={6} fill="#f43f5e" fillOpacity={0.75} />
              <text x={LABEL_W + barMax + 10} y={y + ROW_H / 2 + 4} fill="#e2e8f0" fontSize="13">
                {d.quantidade} · {formatBRL(d.valor)}
              </text>
            </g>
          );
        })}
      </svg>

      <table className="sr-only">
        <caption>Funil de vendas por etapa</caption>
        <thead>
          <tr>
            <th>Etapa</th>
            <th>Quantidade</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>
          {dados.map((d) => (
            <tr key={d.etapa}>
              <td>{ROTULO_ETAPA[d.etapa] || d.etapa}</td>
              <td>{d.quantidade}</td>
              <td>{formatBRL(d.valor)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
