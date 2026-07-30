import Link from 'next/link';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-16">
      <header className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-4">Comissionamento e Vendas</h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">Plataforma de gestão integrada para vendas educacionais</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <Link href="/auth/login" className="block p-8 border-2 border-slate-300 dark:border-slate-600 rounded-lg hover:border-slate-500 transition">
          <h2 className="text-2xl font-bold mb-2">Login</h2>
          <p className="text-slate-600 dark:text-slate-400">Acesse sua conta e comece a trabalhar</p>
        </Link>
        <Link href="/dashboard" className="block p-8 border-2 border-slate-300 dark:border-slate-600 rounded-lg hover:border-slate-500 transition">
          <h2 className="text-2xl font-bold mb-2">Dashboard</h2>
          <p className="text-slate-600 dark:text-slate-400">Visualize seus dados e métricas</p>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Link href="/vendas/novo" className="block p-8 border-2 border-slate-300 dark:border-slate-600 rounded-lg hover:border-slate-500 transition">
          <h2 className="text-2xl font-bold mb-2">Nova Venda</h2>
          <p className="text-slate-600 dark:text-slate-400">Registre uma nova venda</p>
        </Link>
        <Link href="/auditoria" className="block p-8 border-2 border-slate-300 dark:border-slate-600 rounded-lg hover:border-slate-500 transition">
          <h2 className="text-2xl font-bold mb-2">Auditoria</h2>
          <p className="text-slate-600 dark:text-slate-400">Revise e aprove vendas</p>
        </Link>
      </div>
    </div>
  );
}
