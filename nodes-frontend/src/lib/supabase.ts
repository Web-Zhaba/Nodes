import { createClient } from "@supabase/supabase-js";
import { config } from "@/config";

export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey,
  {
    // Включаем автоматическое обновление токена
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  },
);

