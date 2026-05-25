// Конфигурация приложения
export const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },
  siteUrl: import.meta.env.VITE_SITE_URL || window.location.origin,
}

if (!config.supabase.url || !config.supabase.anonKey) {
  console.error('Supabase configuration missing:', {
    url: !!config.supabase.url,
    anonKey: !!config.supabase.anonKey
  });
}
