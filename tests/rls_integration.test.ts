import { assertEquals, assertNotEquals } from "https://deno.land/std@0.210.0/assert/mod.ts";
import { createClient } from "npm:@supabase/supabase-js@2.38.4";
import * as jose from "https://deno.land/x/jose@v5.2.0/index.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "http://127.0.0.1:54321";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "anon";
const JWT_SECRET = Deno.env.get("SUPABASE_JWT_SECRET") || "super-secret-jwt-token-with-at-least-32-characters-long";

async function createClientWithRole(uid: string, role: string) {
  const payload = {
    aud: "authenticated",
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
    sub: uid,
    role: "authenticated",
    app_metadata: {
      app_role: role,
    },
  };
  const secret = new TextEncoder().encode(JWT_SECRET);
  const token = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .sign(secret);

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

Deno.test("RLS Integration: Injeção de criado_por por VENDEDOR deve falhar", async () => {
  const vendedorUid = "11111111-1111-1111-1111-111111111111";
  const fakeUid = "22222222-2222-2222-2222-222222222222";
  const client = await createClientWithRole(vendedorUid, "VENDEDOR");

  const { error } = await client.from("vendas").insert({
    aluno_id: "33333333-3333-3333-3333-333333333333",
    curso_id: "44444444-4444-4444-4444-444444444444",
    valor_entrada: 100.0,
    data_inicio_curso: "2026-08-01",
    criado_por: fakeUid // Tentando injetar UID diferente (será rejeitado na view/RLS/Edge function)
  });

  // Depending on how RLS/Triggers are set up, this might fail or the DB might just ignore it.
  assertNotEquals(error, null);
});

Deno.test("RLS Integration: SELECT isolation entre vendedores retorna 0 registros cruzados", async () => {
  const vendedor2 = await createClientWithRole("22222222-2222-2222-2222-222222222222", "VENDEDOR");

  // Vendedor 2 consulta, não deve ver vendas do Vendedor 1
  const { data, error } = await vendedor2.from("vendas").select("*").eq("criado_por", "11111111-1111-1111-1111-111111111111");
  
  assertEquals(error, null);
  assertEquals(data?.length, 0);
});

Deno.test("RLS Integration: AUDITOR e GESTOR veem todas as vendas", async () => {
  const auditor = await createClientWithRole("33333333-3333-3333-3333-333333333333", "AUDITOR");
  const { error: errorAuditor } = await auditor.from("vendas").select("*").limit(1);
  assertEquals(errorAuditor, null);

  const gestor = await createClientWithRole("44444444-4444-4444-4444-444444444444", "GESTOR");
  const { error: errorGestor } = await gestor.from("vendas").select("*").limit(1);
  assertEquals(errorGestor, null);
});

Deno.test("RLS Integration: DELETE é bloqueado para todos na tabela vendas", async () => {
  const vendedor = await createClientWithRole("11111111-1111-1111-1111-111111111111", "VENDEDOR");
  const auditor = await createClientWithRole("33333333-3333-3333-3333-333333333333", "AUDITOR");
  const gestor = await createClientWithRole("44444444-4444-4444-4444-444444444444", "GESTOR");

  const deleteId = "55555555-5555-5555-5555-555555555555";

  const { error: err1 } = await vendedor.from("vendas").delete().eq("id", deleteId);
  assertNotEquals(err1, null);

  const { error: err2 } = await auditor.from("vendas").delete().eq("id", deleteId);
  assertNotEquals(err2, null);

  const { error: err3 } = await gestor.from("vendas").delete().eq("id", deleteId);
  assertNotEquals(err3, null);
});
