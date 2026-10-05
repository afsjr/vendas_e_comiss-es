"use client";

import type { ReactNode } from 'react';

interface ChartFrameProps {
  title: string;
  subtitle?: string;
  legenda?: ReactNode;
  vazio?: boolean;
  mensagemVazio?: string;
  ariaLabel?: string;
  children: ReactNode;
}

export default function ChartFrame({
  title,
  subtitle,
  legenda,
  vazio = false,
  mensagemVazio = 'Sem dados no período selecionado.',
  ariaLabel,
  children,
}: ChartFrameProps) {
  return (
    <section
      aria-label={ariaLabel || title}
      className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 min-w-0"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
        </div>
        {legenda && <div className="text-xs text-slate-400">{legenda}</div>}
      </div>
      {vazio ? (
        <p className="text-slate-400 text-sm py-10 text-center">{mensagemVazio}</p>
      ) : (
        children
      )}
    </section>
  );
}
