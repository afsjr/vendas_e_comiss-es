import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { CookieOptions } from '@supabase/ssr';

const ROUTE_ROLES: { prefix: string; roles: string[] }[] = [
  { prefix: '/admin', roles: ['GESTOR'] },
  { prefix: '/auditoria', roles: ['GESTOR', 'AUDITOR'] },
  { prefix: '/pre-auditoria', roles: ['GESTOR'] },
  { prefix: '/postvenda', roles: ['SECRETARIA', 'FINANCEIRO', 'GESTOR', 'AUDITOR'] },
  { prefix: '/consolidado', roles: ['GESTOR', 'FINANCEIRO'] },
  { prefix: '/comissoes', roles: ['GESTOR', 'AUDITOR', 'FINANCEIRO'] },
  { prefix: '/carteira', roles: ['GESTOR', 'VENDEDOR'] },
  { prefix: '/minhas-vendas', roles: ['VENDEDOR', 'SECRETARIA'] },
  { prefix: '/alunos', roles: ['GESTOR', 'AUDITOR', 'VENDEDOR', 'SECRETARIA'] },
  { prefix: '/cadastro-unificado', roles: ['GESTOR', 'VENDEDOR', 'SECRETARIA'] },
  { prefix: '/vendas', roles: ['GESTOR', 'VENDEDOR'] },
  { prefix: '/dashboard', roles: ['GESTOR', 'VENDEDOR', 'SECRETARIA', 'AUDITOR', 'FINANCEIRO'] },
];

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: { headers: req.headers } });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];

  const supabase = createServerClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { name: `sb-${projectRef}-auth-token` },
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({ name, value, ...options });
          res = NextResponse.next({ request: { headers: req.headers } });
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({ name, value: '', ...options });
          res = NextResponse.next({ request: { headers: req.headers } });
          res.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  const { pathname } = req.nextUrl;
  const rule = ROUTE_ROLES.find(
    (r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`)
  );

  if (rule) {
    const role = (user.app_metadata as { app_role?: string } | undefined)?.app_role;
    if (!role || !rule.roles.includes(role)) {
      return NextResponse.redirect(new URL('/dashboard?aviso=acesso-negado', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/auditoria/:path*',
    '/pre-auditoria/:path*',
    '/postvenda/:path*',
    '/consolidado/:path*',
    '/comissoes/:path*',
    '/carteira/:path*',
    '/minhas-vendas/:path*',
    '/alunos/:path*',
    '/vendas/:path*',
    '/cadastro-unificado/:path*',
  ],
};
