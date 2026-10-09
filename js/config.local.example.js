/*
 * PRIVATE CONFIG TEMPLATE.
 * Copy this file to js/config.local.js and fill in your own values.
 * js/config.local.js is gitignored, so nothing here is published.
 *
 * Then deploy: participants' sessions POST to your chosen backend.
 */
window.NCID_LOCAL = {
  storage: {
    // Option A — Supabase (free, EU region recommended for GDPR)
    // Create a table: sessions(id_anonim text, payload jsonb, created_at timestamptz default now())
    supabase: {
      url: "https://YOUR-PROJECT.supabase.co",
      anonKey: "YOUR_PUBLIC_ANON_KEY"
    },

    // Option B — any JSON endpoint (Google Apps Script Web App, Formspree, own API)
    // Leave url null to disable.
    submission: {
      url: null,
      includeGaze: false
    }
  }
};
