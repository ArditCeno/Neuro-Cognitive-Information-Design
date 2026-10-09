/*
 * Neuro-Cognitive Information Design
 * Central study configuration. Edit study parameters and the 5 field
 * protocols here. AOIs are read from the material DOM via [data-aoi]
 * attributes, so no coordinates are hard-coded.
 */

export const CONFIG = {
  study: {
    title: "Neuro-Cognitive Information Design",
    modulesPerSession: 3,
    design: "within",            // "within" = each participant reads both A and B
    quizPerDoc: 8,               // 8-10 per activity diagram
    nasaTlx: "perModule",        // "end" | "perModule"
    useJsPsych: true,            // jsPsych v7 primary, DOM auto-fallback
    calibrationThresholdPx: 150, // sessions above this are flagged / re-calibrated
    calibrationMaxAttempts: 2,   // then offer MouseView.js plan B
    mouseFallback: true,
    fixationDispersionPx: 40,    // I-DT dispersion threshold
    fixationMinDurationMs: 100,
    saccadeVelocityPxS: 300
  },

  // Optional cloud backend. Leave null to stay local-first.
  // Example: { url: "https://xxxx.supabase.co", anonKey: "public-anon-key" }
  // `submission.url` can be any endpoint that accepts a JSON POST, e.g. a
  // Google Apps Script Web App, Formspree, Formspark or your own API.
  storage: {
    supabase: null,
    submission: { url: null, includeGaze: false },
    keyName: "ncid_session_buffer_v1",
    langKey: "ncid_lang",
    counterKey: "ncid_session_counter"
  },

  // CDN sources (loaded lazily at runtime).
  cdn: {
    webgazer: "https://webgazer.cs.brown.edu/webgazer.js",
    heatmap: "https://cdn.jsdelivr.net/npm/heatmapjs@2.0.2/build/heatmap.min.js",
    mediapipeFaceMesh: "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js",
    mediapipeCamera: "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1640029074/camera_utils.js",
    mouseview: "https://cdn.jsdelivr.net/npm/mouseviewjs/dist/mouseview.min.js",
    jsPsych: "https://unpkg.com/jspsych@7.3.4",
    jsPsychHtmlButton: "https://unpkg.com/@jspsych/plugin-html-button-response@1.1.3",
    jsPsychSurveyLikert: "https://unpkg.com/@jspsych/plugin-survey-likert@1.1.3"
  },

  fields: [
    {
      id: "software",
      name: { al: "Informatikë", en: "Software" },
      task: {
        al: "Lexo kodin dhe përgjigju: a lejohet hyrja për përdoruesin aktiv që ka paguar?",
        en: "Read the code and answer: is access granted for an active user who has paid?"
      },
      materials: {
        A: { al: "materials/software_a.al.html", en: "materials/software_a.en.html" },
        B: { al: "materials/software_b.al.html", en: "materials/software_b.en.html" }
      },
      quiz: [
        { q: { al: "Kur jepet hyrja (access)?", en: "When is access granted?" },
          options: [
            { al: "Kur përdoruesi ekziston", en: "When the user exists" },
            { al: "Kur përdoruesi është aktiv dhe ka paguar", en: "When the user is active and has paid" },
            { al: "Kur përdoruesi ka paguar, pa kushte", en: "When the user has paid, unconditionally" },
            { al: "Gjithmonë", en: "Always" } ],
          correct: 1, critical: true },
        { q: { al: "Çfarë kthehet nëse përdoruesi është null?", en: "What is returned if the user is null?" },
          options: [
            { al: "access", en: "access" },
            { al: "deny", en: "deny" },
            { al: "gabim", en: "an error" },
            { al: "asgjë", en: "nothing" } ],
          correct: 1, critical: true },
        { q: { al: "Sa kushte duhet të plotësohen për hyrje?", en: "How many conditions must hold for access?" },
          options: [ { al: "1", en: "1" }, { al: "2", en: "2" }, { al: "3", en: "3" }, { al: "0", en: "0" } ],
          correct: 2, critical: false },
        { q: { al: "Nëse user.active = false, çfarë ndodh?", en: "If user.active = false, what happens?" },
          options: [
            { al: "Hyrja jepet", en: "Access is granted" },
            { al: "Hyrja refuzohet", en: "Access is denied" },
            { al: "Kontrollohet pagesa", en: "Payment is still checked" },
            { al: "Rikthehet null", en: "null is returned" } ],
          correct: 1, critical: false },
        { q: { al: "Cila strukturë përdoret në Versionin B?", en: "Which structure is used in Version B?" },
          options: [
            { al: "if/else të thella", en: "Deeply nested if/else" },
            { al: "Guard Clauses", en: "Guard Clauses" },
            { al: "switch", en: "switch" },
            { al: "try/catch", en: "try/catch" } ],
          correct: 1, critical: false },
        { q: { al: "Nëse user.paid = false, vlera e kthyer është:", en: "If user.paid = false, the returned value is:" },
          options: [ { al: "access", en: "access" }, { al: "deny", en: "deny" }, { al: "true", en: "true" }, { al: "undefined", en: "undefined" } ],
          correct: 1, critical: true },
        { q: { al: "Çfarë lloji është vlera e kthyer nga funksioni?", en: "What type is the value returned by the function?" },
          options: [ { al: "Varg (string)", en: "String" }, { al: "Boolean", en: "Boolean" }, { al: "Numër", en: "Number" }, { al: "null", en: "null" } ],
          correct: 0, critical: false },
        { q: { al: "Në Versionin B, sa deklarata 'return' ka funksioni?", en: "In Version B, how many 'return' statements does the function have?" },
          options: [ { al: "2", en: "2" }, { al: "3", en: "3" }, { al: "4", en: "4" }, { al: "5", en: "5" } ],
          correct: 2, critical: false }
      ]
    },

    {
      id: "legal",
      name: { al: "Drejtësi", en: "Legal" },
      task: {
        al: "Gjej klauzolën e përgjegjësisë dhe afatin e njoftimit.",
        en: "Find the liability clause and the notice period."
      },
      materials: {
        A: { al: "materials/legal_a.al.html", en: "materials/legal_a.en.html" },
        B: { al: "materials/legal_b.al.html", en: "materials/legal_b.en.html" }
      },
      quiz: [
        { q: { al: "Sa është kufiri i përgjegjësisë?", en: "What is the cap on liability?" },
          options: [
            { al: "Tarifat e paguara në 12 muajt e fundit", en: "Fees paid in the last 12 months" },
            { al: "Tarifat e paguara në 6 muajt e fundit", en: "Fees paid in the last 6 months" },
            { al: "Pa kufi", en: "Unlimited" },
            { al: "1000 EUR fiks", en: "Fixed 1000 EUR" } ],
          correct: 0, critical: true },
        { q: { al: "Sa është afati i njoftimit të shkeljes?", en: "What is the breach notice period?" },
          options: [ { al: "15 ditë", en: "15 days" }, { al: "30 ditë", en: "30 days" }, { al: "60 ditë", en: "60 days" }, { al: "90 ditë", en: "90 days" } ],
          correct: 1, critical: true },
        { q: { al: "Sa zgjat konfidencialiteti pas përfundimit?", en: "How long does confidentiality last after termination?" },
          options: [ { al: "1 vit", en: "1 year" }, { al: "3 vjet", en: "3 years" }, { al: "5 vjet", en: "5 years" }, { al: "Përgjithmonë", en: "Forever" } ],
          correct: 2, critical: false },
        { q: { al: "Sa ditë njoftim kërkohet për zgjidhjen e kontratës?", en: "How much notice is required to terminate the contract?" },
          options: [ { al: "30 ditë", en: "30 days" }, { al: "45 ditë", en: "45 days" }, { al: "60 ditë", en: "60 days" }, { al: "90 ditë", en: "90 days" } ],
          correct: 2, critical: false },
        { q: { al: "Cila është pasoja e një shkeljeje të pariparueshme?", en: "What is the consequence of an irreparable breach?" },
          options: [
            { al: "Zgjidhje e menjëhershme", en: "Immediate termination" },
            { al: "Afat shtesë 30 ditë", en: "Additional 30-day cure period" },
            { al: "Gjobë 500 EUR", en: "500 EUR penalty" },
            { al: "Asnjë pasojë", en: "No consequence" } ],
          correct: 0, critical: false },
        { q: { al: "Kush mbulon kostot ligjore sipas kontratës?", en: "Who bears legal costs under the contract?" },
          options: [
            { al: "Palët mbajnë kostot e veta", en: "Each party bears its own costs" },
            { al: "Klienti mbulon gjithçka", en: "The client bears everything" },
            { al: "Furnizori mbulon gjithçka", en: "The provider bears everything" },
            { al: "Ndahet 50/50", en: "Split 50/50" } ],
          correct: 0, critical: false },
        { q: { al: "Cili ligj është në fuqi sipas marrëveshjes?", en: "Which governing law applies under the agreement?" },
          options: [ { al: "Shqipëria", en: "Albania" }, { al: "Italia", en: "Italy" }, { al: "Gjermania", en: "Germany" }, { al: "Neutral", en: "Neutral" } ],
          correct: 0, critical: false },
        { q: { al: "Kur zgjidhja e kontratës bëhet e menjëhershme?", en: "When is termination immediate?" },
          options: [
            { al: "Gjithmonë", en: "Always" },
            { al: "Vetëm me shkelje të pariparueshme", en: "Only on an irreparable breach" },
            { al: "Vetëm me urdhër gjykate", en: "Only by court order" },
            { al: "Pas 90 ditësh", en: "After 90 days" } ],
          correct: 1, critical: true }
      ]
    },

    {
      id: "finance",
      name: { al: "Financë", en: "Finance" },
      task: {
        al: "Gjej anomalinë në pasqyrën P&L (një kosto jashtë trendit).",
        en: "Find the anomaly in the P&L statement (a cost out of trend)."
      },
      materials: {
        A: { al: "materials/finance_a.al.html", en: "materials/finance_a.en.html" },
        B: { al: "materials/finance_b.al.html", en: "materials/finance_b.en.html" }
      },
      quiz: [
        { q: { al: "Cila linjë përmban anomali?", en: "Which line contains the anomaly?" },
          options: [
            { al: "Kosto e marketingut", en: "Marketing cost" },
            { al: "Të hyrat", en: "Revenue" },
            { al: "Paga e stafit", en: "Staff salaries" },
            { al: "Qiraja", en: "Rent" } ],
          correct: 0, critical: true },
        { q: { al: "Cili është trendi normal mujor i marketingut?", en: "What is the normal monthly marketing trend?" },
          options: [ { al: "~10k EUR", en: "~10k EUR" }, { al: "~25k EUR", en: "~25k EUR" }, { al: "~50k EUR", en: "~50k EUR" }, { al: "~5k EUR", en: "~5k EUR" } ],
          correct: 0, critical: true },
        { q: { al: "Sa u rrit kostot e marketingut në muajin e anomalisë?", en: "How much did marketing costs jump in the anomaly month?" },
          options: [ { al: "~10k EUR", en: "~10k EUR" }, { al: "~45k EUR", en: "~45k EUR" }, { al: "~100k EUR", en: "~100k EUR" }, { al: "nuk u rrit", en: "it did not jump" } ],
          correct: 1, critical: false },
        { q: { al: "Cili është fitimi neto për Q3?", en: "What is the net profit for Q3?" },
          options: [ { al: "42k EUR", en: "42k EUR" }, { al: "0 EUR", en: "0 EUR" }, { al: "negative", en: "negative" }, { al: "120k EUR", en: "120k EUR" } ],
          correct: 2, critical: false },
        { q: { al: "Cila KPI theksohet në Versionin B?", en: "Which KPI is highlighted in Version B?" },
          options: [
            { al: "Marzhi bruto", en: "Gross margin" },
            { al: "Numri i punonjësve", en: "Headcount" },
            { al: "Qiraja mesatare", en: "Average rent" },
            { al: "Të hyrat totale", en: "Total revenue" } ],
          correct: 0, critical: false },
        { q: { al: "A bie anomali në sy më shpejt në grafik (B)?", en: "Is the anomaly spotted faster in the chart (B)?" },
          options: [ { al: "Po", en: "Yes" }, { al: "Jo", en: "No" }, { al: "E njëjta kohë", en: "Same time" }, { al: "Nuk dihet", en: "Unknown" } ],
          correct: 0, critical: false },
        { q: { al: "Sa është marzhi bruto?", en: "What is the gross margin?" },
          options: [ { al: "30%", en: "30%" }, { al: "40%", en: "40%" }, { al: "50%", en: "50%" }, { al: "60%", en: "60%" } ],
          correct: 2, critical: false },
        { q: { al: "Çfarë forme paraqitjeje ka Versioni A?", en: "What presentation format does Version A use?" },
          options: [ { al: "Grafik", en: "A chart" }, { al: "Tabelë numrash", en: "A number table" }, { al: "Listë", en: "A list" }, { al: "Kod", en: "Code" } ],
          correct: 1, critical: false }
      ]
    },

    {
      id: "business",
      name: { al: "Biznes", en: "Business" },
      task: {
        al: "Gjej rekomandimin strategjik dhe analizën kosto-përfitim.",
        en: "Find the strategic recommendation and the cost-benefit analysis."
      },
      materials: {
        A: { al: "materials/business_a.al.html", en: "materials/business_a.en.html" },
        B: { al: "materials/business_b.al.html", en: "materials/business_b.en.html" }
      },
      quiz: [
        { q: { al: "Cili është rekomandimi kryesor?", en: "What is the main recommendation?" },
          options: [
            { al: "Hyrja në tregun X", en: "Enter market X" },
            { al: "Tërheqja nga tregu", en: "Exit the market" },
            { al: "Ruajtja e status quo-s", en: "Keep the status quo" },
            { al: "Blerja e një konkurrenti", en: "Acquire a competitor" } ],
          correct: 0, critical: true },
        { q: { al: "Sa është buxheti i propozuar?", en: "What is the proposed budget?" },
          options: [ { al: "50k EUR", en: "50k EUR" }, { al: "200k EUR", en: "200k EUR" }, { al: "500k EUR", en: "500k EUR" }, { al: "1M EUR", en: "1M EUR" } ],
          correct: 1, critical: true },
        { q: { al: "Sa është periudha e shlyerjes (payback)?", en: "What is the payback period?" },
          options: [ { al: "6 muaj", en: "6 months" }, { al: "12 muaj", en: "12 months" }, { al: "18 muaj", en: "18 months" }, { al: "24 muaj", en: "24 months" } ],
          correct: 2, critical: false },
        { q: { al: "Cili është rreziku kryesor?", en: "What is the main risk?" },
          options: [
            { al: "Rregullator", en: "Regulatory" },
            { al: "Teknologjik", en: "Technological" },
            { al: "Mjedisor", en: "Environmental" },
            { al: "Asnjë rrezik", en: "No risk" } ],
          correct: 0, critical: false },
        { q: { al: "Cili është ROI i pritur?", en: "What is the expected ROI?" },
          options: [ { al: "5%", en: "5%" }, { al: "15%", en: "15%" }, { al: "30%", en: "30%" }, { al: "60%", en: "60%" } ],
          correct: 2, critical: false },
        { q: { al: "Sa faza ka plani i zbatimit?", en: "How many phases does the implementation plan have?" },
          options: [ { al: "2", en: "2" }, { al: "3", en: "3" }, { al: "4", en: "4" }, { al: "5", en: "5" } ],
          correct: 1, critical: false },
        { q: { al: "Çfarë formati ka Versioni B?", en: "What format does Version B use?" },
          options: [
            { al: "Raport i gjatë 2-faqesh", en: "A long 2-page report" },
            { al: "Executive Summary me karta", en: "An Executive Summary with cards" },
            { al: "Grafik i thjeshtë", en: "A simple chart" },
            { al: "Kod", en: "Code" } ],
          correct: 1, critical: false },
        { q: { al: "Kur rekomandohet hyrja në tregun X?", en: "When is entering market X recommended?" },
          options: [
            { al: "Vitit të ardhshëm fiskal", en: "Next fiscal year" },
            { al: "Brenda 5 vjetësh", en: "Within 5 years" },
            { al: "Nuk rekomandohet", en: "It is not recommended" },
            { al: "Pas 10 vjetësh", en: "After 10 years" } ],
          correct: 0, critical: false }
      ]
    },

    {
      id: "health",
      name: { al: "Mjekësi", en: "Health" },
      task: {
        al: "Gjej alergjitë dhe dozën kritike për vendimin e urgjencës.",
        en: "Find the allergies and the critical dose for the emergency decision."
      },
      materials: {
        A: { al: "materials/health_a.al.html", en: "materials/health_a.en.html" },
        B: { al: "materials/health_b.al.html", en: "materials/health_b.en.html" }
      },
      quiz: [
        { q: { al: "Cilës substancë është alergjik pacienti?", en: "To which substance is the patient allergic?" },
          options: [ { al: "Penicilinë", en: "Penicillin" }, { al: "Paracetamol", en: "Paracetamol" }, { al: "Ibuprofen", en: "Ibuprofen" }, { al: "Aspirinë", en: "Aspirin" } ],
          correct: 0, critical: true },
        { q: { al: "Sa është doza e përshkruar?", en: "What is the prescribed dose?" },
          options: [ { al: "250 mg", en: "250 mg" }, { al: "500 mg", en: "500 mg" }, { al: "1000 mg", en: "1000 mg" }, { al: "125 mg", en: "125 mg" } ],
          correct: 1, critical: true },
        { q: { al: "Në cilin kod triazhi është pacienti?", en: "Which triage code is the patient in?" },
          options: [ { al: "E kuqe", en: "Red" }, { al: "E verdhë", en: "Yellow" }, { al: "E gjelbër", en: "Green" }, { al: "Blu", en: "Blue" } ],
          correct: 1, critical: false },
        { q: { al: "Çfarë do të thotë 'S' në SOAP?", en: "What does 'S' mean in SOAP?" },
          options: [ { al: "Subjektiv", en: "Subjective" }, { al: "Simptomë", en: "Symptom" }, { al: "Sistem", en: "System" }, { al: "Sasi", en: "Quantity" } ],
          correct: 0, critical: false },
        { q: { al: "Sa është temperatura e regjistruar?", en: "What is the recorded temperature?" },
          options: [ { al: "36.5 C", en: "36.5 C" }, { al: "37.0 C", en: "37.0 C" }, { al: "38.9 C", en: "38.9 C" }, { al: "39.5 C", en: "39.5 C" } ],
          correct: 2, critical: false },
        { q: { al: "Cila është veprimi i menjëhershëm?", en: "What is the immediate action?" },
          options: [
            { al: "Jep antibiotik alternativ", en: "Give an alternative antibiotic" },
            { al: "Jep penicilinë", en: "Give penicillin" },
            { al: "Dërgo në shtëpi", en: "Send home" },
            { al: "Pres pa veprim", en: "Wait without action" } ],
          correct: 0, critical: true },
        { q: { al: "Sa është frekuenca kardiake e regjistruar?", en: "What is the recorded heart rate?" },
          options: [ { al: "72", en: "72" }, { al: "95", en: "95" }, { al: "112", en: "112" }, { al: "150", en: "150" } ],
          correct: 2, critical: false },
        { q: { al: "Sa ditë zgjat terapia e përshkruar?", en: "How many days does the prescribed therapy last?" },
          options: [ { al: "3", en: "3" }, { al: "5", en: "5" }, { al: "7", en: "7" }, { al: "10", en: "10" } ],
          correct: 2, critical: false }
      ]
    }
  ],

  // NASA-TLX six subscales (0-100 sliders).
  nasaTlx: [
    { id: "mental", al: "Kërkesa mendore", en: "Mental demand", low: { al: "E ulët", en: "Low" }, high: { al: "E lartë", en: "High" } },
    { id: "physical", al: "Kërkesa fizike", en: "Physical demand", low: { al: "E ulët", en: "Low" }, high: { al: "E lartë", en: "High" } },
    { id: "temporal", al: "Kërkesa kohore", en: "Temporal demand", low: { al: "E ulët", en: "Low" }, high: { al: "E lartë", en: "High" } },
    { id: "performance", al: "Performanca", en: "Performance", low: { al: "E mirë", en: "Good" }, high: { al: "E dobët", en: "Poor" } },
    { id: "effort", al: "Përpjekja", en: "Effort", low: { al: "E ulët", en: "Low" }, high: { al: "E lartë", en: "High" } },
    { id: "frustration", al: "Frustrimi", en: "Frustration", low: { al: "I ulët", en: "Low" }, high: { al: "I lartë", en: "High" } }
  ],

  expertiseLevels: [
    { id: "beginner", al: "Fillestar", en: "Beginner" },
    { id: "student", al: "Student", en: "Student" },
    { id: "professional", al: "Profesional", en: "Professional" }
  ]
};

/*
 * Private overrides. Create js/config.local.js (gitignored) to inject your
 * Supabase project or a private submission endpoint without committing them:
 *
 *   window.NCID_LOCAL = {
 *     storage: {
 *       supabase: { url: "https://xxxx.supabase.co", anonKey: "eyJ..." },
 *       submission: { url: "https://script.google.com/macros/s/.../exec", includeGaze: false }
 *     }
 *   };
 */
if (typeof window !== "undefined" && window.NCID_LOCAL) {
  const local = window.NCID_LOCAL;
  if (local.storage) Object.assign(CONFIG.storage, local.storage);
  if (local.study) Object.assign(CONFIG.study, local.study);
  if (local.cdn) Object.assign(CONFIG.cdn, local.cdn);
}
