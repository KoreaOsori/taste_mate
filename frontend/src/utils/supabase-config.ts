// Helper function to safely access Supabase environment variables
export function getSupabaseConfig() {
  const url = import.meta?.env?.VITE_SUPABASE_URL;
  const key = import.meta?.env?.VITE_SUPABASE_ANON_KEY;
  
  return {
    url: url || '',
    key: key || '',
    isConfigured: !!(url && key)
  };
}
