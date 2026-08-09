/*
  Supabase-Konfiguration
  ----------------------
  Trage hier die Project URL und den Publishable Key eines aktiven
  Supabase-Projekts ein. Fuer ein neues Projekt siehe README.md und
  SUPABASE-SETUP.sql.

  Wichtig: Niemals einen service_role- oder Secret-Key im Browser veröffentlichen.
*/
const SUPABASE_URL = 'HIER_DEINE_SUPABASE_PROJECT_URL_EINTRAGEN';
const SUPABASE_PUBLISHABLE_KEY = 'HIER_DEINEN_SUPABASE_PUBLISHABLE_KEY_EINTRAGEN';

const hasSupabaseConfiguration = (
  /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(SUPABASE_URL)
  && !SUPABASE_PUBLISHABLE_KEY.startsWith('HIER_')
  && SUPABASE_PUBLISHABLE_KEY.length > 20
);

window.supabaseClient = (
  window.supabase && hasSupabaseConfiguration
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
    : null
);

const supabaseClient = window.supabaseClient;
