# Accessibility statement

The public site targets **WCAG 2.2 level AA**.

## What is implemented

- Keyboard access to the header, skip link, calibration targets, quizzes and NASA-TLX sliders.
- Visible `:focus-visible` outlines on interactive elements.
- `aria-current` on the active navigation item and `aria-pressed` on the language switch.
- `role="status"` + `aria-live="polite"` for calibration progress and report delivery.
- `aria-label` on every calibration target and decorative SVGs marked `aria-hidden` where they carry no meaning.
- `prefers-reduced-motion` support; the calibration pulse and reveals stop.
- Touch targets of at least 44 px for calibration on coarse pointers.
- Bilingual `lang` switching (`en` / `sq`) and paired `data-en` / `data-al` attributes.
- Charts include text labels and accessible names; a table view is provided where space allows.

## Known limits

- **Admin dashboard** is a researcher-only tool and is intentionally frozen for this release: it is not localized and does not have a full focus trap.
- **Eye tracking** requires a camera and a reasonably lit room. Calibration can fail on low-end devices; the study explains the error and offers a retry.
- **GitHub Pages** does not allow custom security headers (HSTS, CSP header). A custom domain behind a proxy would be required for that.
- PDF reports are generated client-side; screen-reader support depends on the PDF viewer.

## Reporting an issue

Email **arditceno82@gmail.com** with the page, device, browser and a short description. Accessibility reports are treated as bugs.
