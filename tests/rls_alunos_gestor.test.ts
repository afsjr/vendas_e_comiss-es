import { assertMatch } from "https://deno.land/std@0.210.0/assert/mod.ts";

const MIGRATIONS_DIR = `${Deno.cwd()}/supabase/migrations`;

async function lerMigrations(): Promise<string> {
  let ddl = "";
  for await (const entry of Deno.readDir(MIGRATIONS_DIR)) {
    if (!entry.isFile || !entry.name.endsWith(".sql")) continue;
    ddl += await Deno.readTextFile(`${MIGRATIONS_DIR}/${entry.name}`) + "\n";
  }
  return ddl;
}

Deno.test("RLS alunos: policy de INSERT autoriza GESTOR (BUG-20260909-xg7e)", async () => {
  const ddl = await lerMigrations();
  assertMatch(
    ddl,
    /CREATE POLICY "Alunos insertable by GESTOR" ON alunos[\s]+FOR INSERT WITH CHECK[\s\S]*?'GESTOR'\s*\)[\s\S]*?;/
  );
});

Deno.test("RLS alunos: policy original de INSERT VENDEDOR/SECRETARIA preservada (regressao)", async () => {
  const ddl = await lerMigrations();
  assertMatch(
    ddl,
    /CREATE POLICY "Alunos insertable by VENDEDOR and SECRETARIA" ON alunos[\s]+FOR INSERT WITH CHECK[\s\S]*?\('VENDEDOR', 'SECRETARIA'\)/
  );
});