import { createClient } from "@supabase/supabase-js";

// service role key — bypasses RLS for backend operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export default supabase;
