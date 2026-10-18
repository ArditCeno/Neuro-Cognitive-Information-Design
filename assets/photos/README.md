# Photos to place (assets/photos/)

Drop your images in this folder with **exactly these names**. After placing them,
run `node scripts/apply-photos.mjs` (from the project root) and commit. The script
inserts each photo into the matching module (A and B, EN and AL) automatically.

## Specifications (for a "wow" look)
- **Format:** `.jpg` for photos, `.png` or `.svg` for diagrams. The script also
  accepts `.jpeg`, `.webp`.
- **Size:** 1600 x 1000 px (16:10) recommended; minimum 1200 px wide.
- **Weight:** keep under ~300 KB (JPG quality ~80) for fast loading.
- **Licence:** use free sources (Wikimedia Commons, Unsplash, Pexels) and keep the
  credit. **No real patient/client data.** Diagrams must be licensed or yours.
- **Style:** bright, clean, no heavy filters; the app frames them with rounded corners.

## Exact file names (36)

### Informatike
- `software_m1_ide.jpg` (screenshot of an IDE running Python)
- `software_m2_stack_queue.jpg` (stack/queue diagram)
- `software_m3_traceback.jpg` (a traceback error table)

### Drejtesi
- `legal_m1_gazette.jpg` (Official Gazette page, not sensitive)
- `legal_m2_appeal_route.jpg` (judicial appeal route diagram)
- `legal_m3_printed_code.jpg` (printed code, illustration)

### Financa
- `finance_m1_pl_excel.jpg` (P&L in Excel, fictional data)
- `finance_m2_budget_chart.jpg` (anonymous budget chart)
- `finance_m3_invoice.jpg` (invoice with no personal data)

### Biznes
- `business_m1_swot.jpg` (SWOT on a whiteboard)
- `business_m2_kpi_dashboard.jpg` (fictional KPI dashboard)
- `business_m3_bmc.jpg` (Business Model Canvas sketch)

### Mjekesi
- `health_m1_anatomy.jpg` (licensed anatomical diagram)
- `health_m2_ecg.jpg` (simulated normal ECG)
- `health_m3_devices.jpg` (sphygmomanometer / pulse oximeter)

### Infermieri
- `nurse_m1_handwash.jpg` (WHO hand-washing steps, licensed)
- `nurse_m2_gcs_card.jpg` (GCS assessment card)
- `nurse_m3_med_chart.jpg` (blank medication chart)

### Pedagogji
- `pedagogue_m1_concept_map.jpg` (class concept map)
- `pedagogue_m2_rubric.jpg` (assessment rubric example)
- `pedagogue_m3_lesson_plan.jpg` (printed lesson plan)

### Biologji
- `biologist_m1_cell.jpg` (plant/animal cell under a microscope)
- `biologist_m2_mitosis.jpg` (mitosis phases diagram)
- `biologist_m3_foodchain.jpg` (food chain / ecosystem)

### Bioteknologji
- `biotech_m1_gel.jpg` (agarose gel after electrophoresis)
- `biotech_m2_pcr.jpg` (PCR thermocycler)
- `biotech_m3_plasmid.jpg` (plasmid with restriction sites)

### Kimi
- `chemist_m1_ph_chart.jpg` (pH colour chart)
- `chemist_m2_titration.jpg` (volumetric flask / titration)
- `chemist_m3_periodic_table.jpg` (IUPAC periodic table, licensed)

### Inxhinieri elektrike
- `electrical_m1_breadboard.jpg` (breadboard with an RC circuit)
- `electrical_m2_oscilloscope.jpg` (oscilloscope, sinusoidal signal)
- `electrical_m3_multimeter.jpg` (multimeter measuring voltage)

### Kuzhinieri
- `cook_m1_mise_en_place.jpg` (mise en place at a station)
- `cook_m2_cuts.jpg` (julienne / brunoise cuts)
- `cook_m3_thermometer.jpg` (food thermometer in cooked meat)

## After placing
```bash
node scripts/apply-photos.mjs
git add -A && git commit -m "Add study photos" && git push
```
