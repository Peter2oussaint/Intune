import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.INTUNE_SUPABASE_URL,
  process.env.INTUNE_SUPABASE_ANON_KEY
);
