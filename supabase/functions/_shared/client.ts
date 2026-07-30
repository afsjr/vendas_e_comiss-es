import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { UserRole } from "./types.ts";

export const getServiceRoleClient = (): SupabaseClient => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

export const getUserAndRole = async (req: Request): Promise<{ user: any; role: UserRole | null; error?: string }> => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return { user: null, role: null, error: "Missing Authorization header" };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
    auth: {
      persistSession: false,
    },
  });

  const { data: { user }, error } = await client.auth.getUser();

  if (error || !user) {
    return { user: null, role: null, error: error?.message || "Invalid JWT" };
  }

  const role = (user.app_metadata?.app_role as UserRole) || null;
  return { user, role };
};
