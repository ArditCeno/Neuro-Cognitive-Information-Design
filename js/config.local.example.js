/*
 * PRIVATE CONFIG TEMPLATE.
 * Copy this file to js/config.local.js and fill in your own values.
 * js/config.local.js is gitignored, so nothing here is published.
 *
 * Any combination may be enabled; every configured target receives the session.
 */
window.NCID_LOCAL = {
  storage: {
    // Option A - Spring Boot backend (see /backend). Recommended.
    // e.g. https://ncid-backend.onrender.com
    backend: { url: null },

    // Option B - Supabase (direct REST, free, EU region for GDPR).
    // Table: sessions(id_anonim text, payload jsonb, created_at timestamptz default now())
    supabase: {
      url: null,          // "https://YOUR-PROJECT.supabase.co"
      anonKey: null       // "YOUR_PUBLIC_ANON_KEY"
    },

    // Option C - Google Apps Script email delivery (the default path).
    // The endpoint is public; no token is needed.
    submission: {
      url: null,               // optional JSON endpoint (Edge Function)
      fallbackUrl: null,       // "https://script.google.com/macros/s/.../exec"
      fallbackToken: null,     // optional/legacy; leave null
      includeGaze: false
    }
  },

  // Email delivery of the full report as an HTML table.
  email: {
    to: "arditceno82@gmail.com",
    // Option 1 - EmailJS (create a free account, then paste these three values).
    emailjs: { publicKey: null, serviceId: null, templateId: null }
  }
};
