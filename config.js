/*
  Supabase-Konfiguration - Glueckshafen Basel
  Publishable Key fuer die oeffentliche GitHub-Pages-App.
  Niemals einen service_role- oder Secret-Key hier eintragen.
*/
const SUPABASE_URL = 'https://tfoqdoyqlsgmvrrsmwqs.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_WUPutvjUKKMWaV8sWu70Xg_bfeuP3Sp';

const hasSupabaseConfiguration = (
  /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(SUPABASE_URL)
  && SUPABASE_PUBLISHABLE_KEY.startsWith('sb_publishable_')
  && SUPABASE_PUBLISHABLE_KEY.length > 20
);

window.supabaseClient = (
  window.supabase && hasSupabaseConfiguration
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
    : null
);

const supabaseClient = window.supabaseClient;
