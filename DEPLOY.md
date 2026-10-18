# Deploy and verify (one-time)

Everything in the code is ready. These steps wire the live backend (storing
sessions + emailing the report) and prove it works end to end. Until step 5 is
done, submissions only sit in the participant's browser and are lost.

Project ref: `kvfqvnvlledzzxstgdch` (https://kvfqvnvlledzzxstgdch.supabase.co)

---

## 0. Repository / Pages

- Repository must be **public**.
- Settings → Pages → **Source = GitHub Actions** (no branch), custom domain empty.
- The `Deploy to GitHub Pages` workflow publishes on every push to `main`.

---

## 1. Create the schema

Supabase → **SQL Editor** → New query → paste all of `supabase/security.sql` → **Run**.

This creates `sessions`, `participant_identity`, `rate_limit`, the
`check_rate_limit()` function, and locks reads to the owner only.

## 2. Create the admin (researcher) login

Supabase → **Authentication → Users → Add user**:

- Email: `arditceno82@gmail.com`
- Password: a strong password (this is what you type on `admin.html`)
- Confirm the user (toggle "Auto confirm").

Only this email can read data (`CONFIG.adminEmail`).

## 3. Google Apps Script (email sender)

1. https://script.google.com → **New project**.
2. Replace the sample code with the whole of `email-setup/Code.gs`.
3. **Project Settings → Script properties → Add property**:
   `TOKEN = <a long random string>`.
4. **Deploy → New deployment → Web app**:
   Execute as **Me**, Who has access **Anyone**.
5. Copy the **Web app URL** (ends with `/exec`).

## 4. Deploy the Edge Function

Install the CLI once, then log in and deploy:

```bash
npm i -g supabase
supabase login                       # opens the browser
supabase link --project-ref kvfqvnvlledzzxstgdch

supabase secrets set \
  APPS_SCRIPT_URL="<the /exec URL from step 3>" \
  APPS_SCRIPT_TOKEN="<the same TOKEN as step 3>"

supabase functions deploy submit --no-verify-jwt
```

Confirm it is live (should return JSON, not 404):

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  "https://kvfqvnvlledzzxstgdch.supabase.co/functions/v1/submit" \
  -H "Content-Type: application/json" -d '{"id_anonim":"SMOKE_TEST_0001"}'
```

## 5. Verify end to end

1. Open the live study on a desktop with a camera:
   https://arditceno.github.io/Neuro-Cognitive-Information-Design/study.html
2. Complete one session, **enter a name and surname**.
3. Check:
   - the report email arrives at `arditceno82@gmail.com` (name, ID, profession,
     expertise, age, session data, results, NASA-TLX, biometrics, every answer);
   - the row appears in the admin panel after signing in at `/admin.html`.
4. Delete the test row: in the admin panel find its `id_anonim`, or in Supabase
   run `delete from sessions where id_anonim = '<id>';`.

---

## Admin login (email + code)

The admin panel signs in with email + password, then a 6-digit code sent to the
researcher's email, and shows the sessions read from the mailbox. This needs the
current `email-setup/Code.gs` deployed:

1. Apps Script → paste the whole of `email-setup/Code.gs` → **Save**.
2. **Project Settings → Script properties**: add **`TOKEN`** = `ncid_k9f3Xq2Lm7Pz`
   (the value the study sends; without it every submission is rejected) and set
   the admin password (`ADMIN_PASSWORD`, or run `setupAdminPassword()` once).
3. **Deploy → Manage deployments → edit → Version: New version → Deploy** (this
   keeps the same `/exec` URL). Authorise the new **Gmail** access when asked.
4. Open `/admin.html`: enter `arditceno82@gmail.com` + your password → **Send
   code** → enter the 6-digit code from the email → the panel loads.

If the panel says "Could not reach the server", the deployment URL in
`js/config.js` (`storage.submission.fallbackUrl`) must match the `/exec` URL.

## Local checks (no backend needed)

```bash
node scripts/test-all.mjs      # structure, 108 materials, 108 diagrams, config
node scripts/test-report.mjs   # end-to-end report with a named participant
```

`test-report.mjs` writes inspectable samples to `test-output/` (open
`test-output/email.html` in a browser to see exactly what the email looks like).

---

## Before you distribute

- [ ] Step 1 schema run
- [ ] Step 2 admin user created and confirmed
- [ ] Step 3 Apps Script deployed with the TOKEN property
- [ ] Step 4 Edge Function deployed, `curl` returns 200
- [ ] Step 5 one real session stored + emailed, test row deleted
- [ ] Tried the study on a phone (should show the desktop-only notice) and a laptop
- [ ] Recruit toward ~10 completed participants per profession (12 × 10 = 120)
