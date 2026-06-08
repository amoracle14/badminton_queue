import { createClient } from "@supabase/supabase-js";

const getSupabaseBrowserEnv = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
    );
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
  };
};

export const createBrowserSupabaseClient = () => {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseBrowserEnv();

  return createClient(supabaseUrl, supabaseAnonKey);
};
