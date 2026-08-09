/*
  Supabase-Konfiguration
*/

const SUPABASE_URL = 'https://ftdxqlcnyaarwszpflla.supabase.co/rest/v1/';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_WUPutvjUKKMWaV8sWu70Xg_bfeuP3Sp';

const hasSupabaseConfiguration = (
  /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(SUPABASE_URL)
  && !SUPABASE_PUBLISHABLE_KEY.startsWith('HIER_')
  && SUPABASE_PUBLISHABLE_KEY.length > 20
);

window.supabaseClient = (
  window.supabase && hasSupabaseConfiguration
    ? window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
      )
    : null
);

const supabaseClient = window.supabaseClient;
