# SEO plan

**Goal:** make the study discoverable for readability, eye-tracking and
cognitive-load searches, and build enough authority for the conference and
journal versions.

## Domain shortlist (.com, checked 2026-10-31)

| Domain | Length | Best for | Notes |
|---|---:|---|---|
| **ncidlab.com** | 7 | Brand + lab identity | Short, academic, extensible; best overall |
| **readlytics.com** | 10 | Keyword signal | "reading analytics"; brandable, memorable |
| **gazelytics.com** | 11 | Eye-tracking niche | Strong topical signal, narrower |
| **ncidresearch.com** | 14 | Authority | Exact project name; longer |
| **readneuro.com** | 9 | Cognitive reading | Interesting, slightly awkward |
| **eyereadlab.com** | 11 | Descriptive | Clear but longer |
| **ncidhq.com** | 6 | Very short | Brandable, less descriptive |
| **ncidl.com** | 5 | Shortest | Cryptic; may be premium-priced |

**Recommendation:** `ncidlab.com` for a long-term lab brand, or
`readlytics.com` if you want the domain itself to hint at the topic.

> Availability is not a price quote. Short `.com` names are often premium;
> check the registrar price before buying.

## Keyword map

| Page | Primary keyword | Secondary |
|---|---|---|
| `index.html` | eye-tracking readability study | document layout, cognitive load, information design |
| `study-info.html` | eye-tracking study participation | webcam study, 30-minute study, data privacy |
| `methodology.html` | A/B document readability experiment | NASA-TLX, counterbalanced design, comprehension |
| `fields.html` | readability across professions | 12 professions, expertise levels, document design |
| `about.html` | neuro-cognitive information design | Ardit Ceno, University of Tirana, KShSN-UT 2026 |
| `conference/` | readability eye-tracking conference | abstract, poster, KShSN-UT |
| `docs/PROTOCOL.md` | eye-tracking study protocol | pre-registration, ethics, analysis plan |

Long-tail examples:

- how document layout affects reading comprehension
- structured vs compressed document layout
- eye tracking readability experiment
- NASA-TLX document reading study
- readability study across professions
- eye-tracking study Albania

## On-page checklist

- [x] One `<h1>` per page; keyword in the first 100 words.
- [x] Title and meta description unique per page.
- [x] Canonical URL on every public page.
- [x] Open Graph + Twitter cards.
- [x] `ResearchProject` and `WebSite` JSON-LD on the landing page.
- [x] `FAQPage` JSON-LD on `study-info.html`.
- [x] `robots.txt` + `sitemap.xml`.
- [x] `admin.html` has `noindex,nofollow`.
- [x] Preconnect to the Worker on study/admin.
- [ ] Add a short author bio (name, institution, role) on `about.html`.
- [ ] Add a `Dataset`/`ScholarlyArticle` JSON-LD once the DOI exists.
- [ ] Add `hreflang` if EN/AL move to separate URLs.

## Technical SEO

- **HTTPS** everywhere; no mixed content.
- **Canonical host:** one of `https://ncidlab.com` or `https://www.ncidlab.com`;
  301 the other.
- **Sitemap:** submit `sitemap.xml` in Google Search Console and Bing Webmaster.
- **robots.txt:** keep `/admin.html` disallowed and `noindex`.
- **Core Web Vitals:** keep the hero preload, lazy images, and preconnect; do
  not load WebGazer on the landing page.
- **Structured data:** validate with the Rich Results Test after deployment.
- **Indexing:** request indexing for the landing, study-info, methodology and
  conference pages.

## Content plan (authority)

Publish 4–6 short, cited pages under `/insights/`:

1. What eye-tracking measures in reading (fixations, regressions, TTFF).
2. Structured vs compressed layout: what the evidence says.
3. NASA-TLX for document reading, explained.
4. How to run a browser eye-tracking study responsibly.
5. The 12 professions and why expertise changes reading.
6. First results / conference abstract.

Each page: one keyword, 800–1200 words, 2–4 citations, internal links to the
study, author box, and a clear call to participate.

## Backlink plan

- University / faculty page and KShSN-UT conference page.
- OSF pre-registration and Zenodo DOI.
- ResearchGate / LinkedIn / GitHub.
- Open materials on Zenodo with a link back.
- Guest post or interview on a readability/UX/psychology blog.
- Local Albanian tech/education communities.

## Measurement

- Google Search Console: impressions, clicks, CTR, average position, queries.
- Bing Webmaster Tools.
- Privacy-friendly analytics (Cloudflare Web Analytics or Plausible).
- Track `study.html` starts and completions (aggregate only).

## 90-day plan

| Week | Action |
|---:|---|
| 1 | Buy domain, HTTPS, canonical host, GSC + Bing, submit sitemap |
| 2 | Add author bio, validate JSON-LD, request indexing |
| 3–4 | Publish insights 1–2; internal links |
| 5–6 | OSF + Zenodo DOI; add `ScholarlyArticle`/`Dataset` schema |
| 7–8 | Publish insights 3–4; outreach for backlinks |
| 9–10 | Conference page, abstract, poster indexed |
| 11–12 | Publish first results; review GSC queries and improve titles |

## Rules

- No keyword stuffing, cloaking, bought links or expired-domain tricks.
- Prioritise E-E-A-T: named author, institution, ethics, citations, DOI.
- The domain helps with recall; **content and backlinks** drive rankings.
