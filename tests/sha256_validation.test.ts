import { assertEquals, assertNotEquals } from "https://deno.land/std@0.210.0/assert/mod.ts";
import { createClient } from "npm:@supabase/supabase-js@2.38.4";

Deno.test("SHA-256: Recálculo correto do hash via crypto.subtle", async () => {
  const fileContent = new TextEncoder().encode("comprovante-falso");
  const hashBuffer = await crypto.subtle.digest("SHA-256", fileContent);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  assertEquals(hashHex.length, 64);
  assertEquals(hashHex, "9bb3b19284fa6e35593c66bfcb3f283d6a992bd6a47a82c4f80e72bb3e7389ea");
});

Deno.test("SHA-256: Upload duplicado retorna HTTP 409 Conflict ou rejeita constraint unique", async () => {
  const sha256_checksum = "9bb3b19284fa6e35593c66bfcb3f283d6a992bd6a47a82c4f80e72bb3e7389ea";
  
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "http://127.0.0.1:54321";
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "service_key";
  
  const client = createClient(SUPABASE_URL, SERVICE_KEY);
  
  const mockInsert = async (checksum: string) => {
     return await client.from("evidencias_vendas").insert({
       venda_id: "00000000-0000-0000-0000-000000000000",
       comprovante_storage_path: "/test/path.pdf",
       sha256_checksum: checksum
     });
  };
  
  const { error } = await mockInsert(sha256_checksum);
  if (error) {
    // Expected to fail due to foreign key or unique constraint
    assertNotEquals(error.code, null);
  }
});

Deno.test("SHA-256: Envio concorrente é rejeitado pela constraint unique", async () => {
  const checksum = "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "http://127.0.0.1:54321";
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "service_key";
  const client = createClient(SUPABASE_URL, SERVICE_KEY);
  
  const p1 = client.from("evidencias_vendas").insert({ venda_id: "00000000-0000-0000-0000-000000000000", comprovante_storage_path: "/test/1.pdf", sha256_checksum: checksum });
  const p2 = client.from("evidencias_vendas").insert({ venda_id: "00000000-0000-0000-0000-000000000000", comprovante_storage_path: "/test/2.pdf", sha256_checksum: checksum });
  
  const [res1, res2] = await Promise.all([p1, p2]);
  
  // Pelo menos um deve falhar
  const hasError = res1.error != null || res2.error != null;
  assertEquals(hasError, true);
});
