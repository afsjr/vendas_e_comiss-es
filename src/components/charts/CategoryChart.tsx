"use client";

import { formatBRL, type CategoriaSlice } from '@/lib/dashboard-metrics';

const CORES = ['#f43f5e', '#f59e0b', '#14b8a6', '#8b5cf6', '#3b82f6', '#ec4899'];
const R = 70;
const SW = 28;
const CX = 100;
const CY = 100;
const CIRC = 2 * Math.PI * R;

export default function CategoryChart({ dados }: { dados: CategoriaSlice[] }) {
  const total = dados.reduce((acc, d) => acc + d.valor, 0);
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox="0 0 200 200" role="img" aria-label="Distribuição das entradas por categoria" className="w-44 h-44 shrink-0">
        <title>Distribuição das entradas por categoria</title>
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#1e293b" strokeWidth={SW} />
        {dados.map((d, i) => {
          const len = d.percentual * CIRC;
          const el = (
            <circle
              key={d.categoria}
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              stroke={CORES[i % CORES.length]}
              strokeWidth={SW}
              strokeDasharray={`${len} ${CIRC - len}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${CX} ${CY})`}
            >
              <title>{`${d.categoria}: ${Math.round(d.percentual * 100)}%`}</title>
            </circle>
          );
          offset += len;
          return el;
        })}
        <text x={CX} y={CY - 4} textAnchor="middle" fill="#e2e8f0" fontSize="12">
          Total
        </text>
        <text x={CX} y={CY + 14} textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="bold">
          {formatBRL(total)}
        </text>
      </svg>

      <ul className="w-full space-y-2">
        {dados.map((d, i) => (
          <li key={d.categoria} className="flex items-center justify-between gap-3 text-sm min-w-0">
            <span className="flex items-center gap-2 text-slate-300 min-w-0">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: CORES[i % CORES.length] }} />
              <span className="truncate">{d.categoria}</span>
            </span>
            <span className="text-slate-400 shrink-0 whitespace-nowrap">
              {Math.round(d.percentual * 100)}% · {formatBRL(d.valor)}
            </span>
          </li>
        ))}
      </ul>

      <table className="sr-only">
        <caption>Distribuição das entradas por categoria</caption>
        <thead>
          <tr>
            <th>Categoria</th>
            <th>Quantidade</th>
            <th>Valor</th>
            <th>Percentual</th>
          </tr>
        </thead>
        <tbody>
          {dados.map((d) => (
            <tr key={d.categoria}>
              <td>{d.categoria}</td>
              <td>{d.quantidade}</td>
              <td>{formatBRL(d.valor)}</td>
              <td>{Math.round(d.percentual * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
