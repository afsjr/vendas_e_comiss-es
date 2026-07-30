import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  // Idealmente aqui usamos createMiddlewareClient do supabase para auth
  // e verificamos a tabela 'perfis' para ver a role.
  // Como estamos numa estrutura básica, esta é a base do bloqueio.
  
  if (req.nextUrl.pathname.startsWith('/admin')) {
    // Exemplo estrutural de onde entra a lógica:
    // const supabase = createMiddlewareClient({ req, res });
    // const { data: { session } } = await supabase.auth.getSession();
    // if (!session) return NextResponse.redirect(new URL('/login', req.url));
    // const { data: perfil } = await supabase.from('perfis').select('role').eq('id', session.user.id).single();
    // if (perfil?.role !== 'GESTOR' && perfil?.role !== 'AUDITOR') {
    //   return NextResponse.redirect(new URL('/acesso-negado', req.url));
    // }
  }
  return res;
}

export const config = {
  matcher: ['/admin/:path*'],
};
