# Custom domain (.com)

**Checked:** 2026-10-31 via Verisign RDAP. Availability changes; re-check at the registrar before buying.

## Recommendation

| Rank | Domain | Why |
|---:|---|---|
| 1 | **ncidlab.com** | 7 letters; short, academic, extensible lab identity |
| 2 | **readlytics.com** | 10 letters; "reading analytics", brandable and topical |
| 3 | **gazelytics.com** | 11 letters; eye-tracking analytics niche |
| 4 | **ncidresearch.com** | Exact acronym + "research"; authoritative, longer |
| 5 | **readneuro.com** | 9 letters; cognitive reading, slightly informal |
| 6 | **ncidhq.com** | 6 letters; very short and brandable |
| 7 | **ncidl.com** | 5 letters; shortest, but cryptic and possibly premium |
| 8 | **ncidapp.com** | 7 letters; product-style, clear |
| 9 | **eyereadlab.com** | 11 letters; descriptive eye-tracking lab |
| 10 | **layoutmetrics.com** | 14 letters; descriptive, longer |

Available at check time: `ncidlab.com`, `readlytics.com`, `gazelytics.com`,
`ncidresearch.com`, `readneuro.com`, `ncidhq.com`, `ncidl.com`, `ncidapp.com`,
`eyereadlab.com`, `layoutmetrics.com`, `ncidlabs.com`, `ncidproject.com`,
`ncidresearchlab.com`, `readabilityscience.com`, `cognitivelayout.com`,
`designforcognition.com`, `readmindlab.com`, `neuroreadlab.com`,
`cognitivereading.com`, `readablelab.com`, `layoutclarity.com`.

Not available at check time: `readabilitylab.com`, `readclarity.com`,
`clearlayout.com`, `readingclarity.com`, `clarityreading.com`, `readlab.com`,
`neurodesignlab.com`, `ncid.com`.

**Recommended choice:** **ncidlab.com** for a short lab brand, or
**readlytics.com** if you want the domain to signal the topic.

## Why a .com

- Trust and recall for reviewers, participants and citations.
- Easy to type and print on a poster.
- Fits both the study and a future lab identity.

## Setup after purchase

1. Buy at **Cloudflare Registrar** (at-cost, no upsell), **Porkbun** or
   **Namecheap**.
2. Add the domain to Cloudflare DNS (or keep the registrar DNS).
3. Point the apex to GitHub Pages:
   - `A @ 185.199.108.153`
   - `A @ 185.199.109.153`
   - `A @ 185.199.110.153`
   - `A @ 185.199.111.153`
   - `CNAME www arditceno.github.io`
4. GitHub → Settings → Pages → **Custom domain**:
   `ncidresearch.com` → Save → enable **Enforce HTTPS**.
5. Add a `CNAME` file at the repo root containing exactly:
   ```text
   ncidresearch.com
   ```
6. Worker CORS: add the new origins to `ALLOWED_ORIGIN` in
   `worker/wrangler.toml`:
   ```text
   ALLOWED_ORIGIN = "https://ncidresearch.com,https://www.ncidresearch.com,https://arditceno.github.io"
   ```
   then `npx wrangler deploy`.
7. Update every absolute URL:
   - canonical / Open Graph / Twitter / manifest
   - `sitemap.xml`, `robots.txt`, `.well-known/security.txt`
   - `README.md`, `CITATION.cff`, conference pages
   - `js/config.js` only if the Worker gets a custom API hostname
8. Verify:
   - `https://ncidresearch.com` and `https://www.ncidresearch.com` load with HTTPS.
   - Admin login works (CSP + CORS).
   - One test submission reaches D1 and email.
   - Old `arditceno.github.io` links redirect or remain in CORS during the transition.

## Optional: nicer API hostname

If the domain is on Cloudflare DNS, add a Worker Custom Domain
`api.ncidresearch.com` (Workers → ncid-api → Settings → Domains & Routes).
Then update:

- `js/config.js` → `https://api.ncidresearch.com/submit`
- CSP `connect-src` → `https://api.ncidresearch.com`
- Worker CORS remains the site origins.

This makes the public URLs cleaner:

- Site: `https://ncidresearch.com`
- Admin: `https://ncidresearch.com/admin.html`
- API: `https://api.ncidresearch.com/health`

## Rollback

Keep the old `arditceno.github.io` origin in `ALLOWED_ORIGIN` for one release.
If DNS or HTTPS fails, remove the custom domain in Pages settings; the old URL
continues to work.
