/*
 * PRIVATE CONFIG TEMPLATE.
 * Copy this file to js/config.local.js and fill in your own values.
 * js/config.local.js is gitignored, so nothing here is published.
 *
 * Any combination may be enabled; every configured target receives the session.
 */
window.NCID_LOCAL = {
  storage: {
    // Option A — Spring Boot backend (see /backend). Recommended.
    // e.g. https://ncid-backend.onrender.com
    backend: { url: null },

    // Option B — Supabase (direct REST, free, EU region for GDPR).
    // Table: sessions(id_anonim text, payload jsonb, created_at timestamptz default now())
    supabase: {
      url: null,          // "https://YOUR-PROJECT.supabase.co"
      anonKey: null       // "YOUR_PUBLIC_ANON_KEY"
    },

    // Option C — any other JSON endpoint (Google Apps Script, Formspree, own API).
    submission: { url: null, includeGaze: false }
  }
};
