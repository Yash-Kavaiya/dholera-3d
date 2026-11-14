/**
 * Dholera SIR data snapshot. The 3D model (src/content/city.js) and the website
 * (scripts/build-pages.mjs) both read from here.
 *
 * Rules:
 * - Every project, milestone and timeline row cites sourceIds that resolve in `sources`.
 * - Official figures come from tier "official". Press items are dated and labelled.
 * - When official and press disagree, both are kept and the conflict is written out in `note`.
 * - Run `npm run fetch:latest` to diff the official pages against this file. It never edits it.
 */

export const meta = Object.freeze({
  dataAsOf: "2026-10-20",
  dsirdaPageUpdated: "2026-08-24",
  siteName: "Dholera SIR — an independent guide",
  siteUrl: "https://dholera-3d.vercel.app",
});

export const facts = Object.freeze({
  sirKm2: 920,
  developableKm2: 422,
  phase1Km2: 153,
  activationKm2: 22.54,
  roadsKm: 72,
  canalKm: 6.6,
  expresswayKm: 109,
  wtpMld: 50,
  wtpMldMax: 150,
  stpMld: 10,
  stpMldMax: 30,
  cetpMld: 20,
  cetpMldMax: 60,
  wtpOffsetKm: 5,
  esrCount: 9,
  mbrCount: 2,
  powerMva: 500,
  powerMvaMax: 1500,
  villageCount: 22,
  plotMinAcres: 1,
  plotMaxAcres: 330,
  fillMinM: 1.5,
  fillMaxM: 2,
  airportKm: 20,
  ahmedabadKm: 100,
});

export const sources = [
  // Official — DSIRDA
  { id: "dsirda-faq", short: "DSIRDA FAQ", tier: "official", publisher: "DSIRDA", title: "DSIRDA FAQ", href: "https://dholera.gujarat.gov.in/faqs", date: "2026-08-24", note: "Area, Activation Area, ABCD, utilities, connectivity, allotment, seasons, policies. The page footer shows Last Updated 24/08/2026." },
  { id: "dsirda-planning", short: "DSIRDA Planning", tier: "official", publisher: "DSIRDA", title: "Planning", href: "https://dholera.gujarat.gov.in/planning", date: "2026-08-24", note: "22 villages, 422 km² in TP1–TP6, Phase I of 153 km² (TP1 and TP2)." },
  { id: "dsirda-about", short: "DSIRDA About", tier: "official", publisher: "DSIRDA", title: "About the authority", href: "https://dholera.gujarat.gov.in/about_us", note: "DICDL, NICDC, the town-planning programme, and the ₹91,000 crore Tata Semiconductor fab." },
  { id: "dsirda-pricing", short: "DSIRDA Pricing", tier: "official", publisher: "DSIRDA", title: "Land pricing", href: "https://dholera.gujarat.gov.in/land_pricing", note: "Official pricing. Not copied into this site." },
  { id: "dsirda-allotment", short: "Allotment policy", tier: "official", publisher: "DSIRDA", title: "Land allotment policy (PDF)", href: "https://dholera.gujarat.gov.in/web/document/download?model=website.documents&field=file&filename_field=Land_Allotment_Policy.pdf&id=1", note: "PDF linked from the FAQ." },
  { id: "dsirda-gdcr", short: "GDCR", tier: "official", publisher: "DSIRDA", title: "General Development Control Regulations (PDF)", href: "https://dholera.gujarat.gov.in/web/document/download?model=website.documents&field=file&filename_field=3.-DP-Report-2-GDCR.pdf&id=33", note: "PDF linked from the FAQ. FAR and height rules live here." },
  { id: "ifp", tier: "official", publisher: "Government of Gujarat", title: "Investor Facilitation Portal", href: "https://ifp.gujarat.gov.in/", note: "Single window for approvals." },
  { id: "policy-semicon", tier: "official", publisher: "Government of Gujarat", title: "Gujarat Semiconductor Policy 2022", href: "https://dst.gujarat.gov.in/Home/GujaratSemiconductorPolicy", note: "Linked from the DSIRDA FAQ." },
  { id: "policy-electronics", tier: "official", publisher: "Government of Gujarat", title: "Gujarat Electronics Policy 2022–28", href: "https://dst.gujarat.gov.in/Home/GujaratElectronicsPolicy", note: "Linked from the DSIRDA FAQ." },
  { id: "policy-it", tier: "official", publisher: "Government of Gujarat", title: "Gujarat IT / ITeS Policy 2022–27", href: "https://dst.gujarat.gov.in/Home/gjstateititespolicy", note: "Linked from the DSIRDA FAQ." },
  { id: "policy-agsi", tier: "official", publisher: "Government of Gujarat", title: "Aatmanirbhar Gujarat Scheme for Industries 2022", href: "https://ic.gujarat.gov.in/documents/aatmanirbhar-gujarat/pdf/pdf.pdf", note: "Linked from the DSIRDA FAQ." },
  // Official — Government of India and companies
  { id: "pib-tata-sez", short: "PIB", tier: "official", publisher: "PIB, Ministry of Commerce", title: "Government notifies India’s first chip fabrication plant at SEZ Dholera", href: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2252649", date: "2026-04-16", note: "SEZ of 66.166 ha for Tata Semiconductor Manufacturing Pvt Ltd, for electronic hardware and software including IT/ITeS." },
  { id: "tatapower-solar", tier: "official", publisher: "Tata Power", title: "Tata Power Renewables commissions 300 MW solar plant in Dholera", href: "https://www.tatapower.com/news-and-media/media-releases/tata-power-renewables-commissions-300-mw-solar-plant-in-dholera-gujarat-with-indias-largest-single-axis-solar-tracker-system", date: "2022-04-04", note: "300 MW, single-axis trackers, about 774 MU a year." },
  { id: "osm", tier: "official", publisher: "OpenStreetMap contributors", title: "OpenStreetMap place nodes", href: "https://www.openstreetmap.org/", note: "Village pins, the solar-park name at Mahadevpura, the airport pin, Kadipur on the expressway, Adhelai, and a Bhimnath node in Botad." },
  // Press — dated, labelled
  { id: "deshgujarat-expressway", tier: "press", publisher: "DeshGujarat", title: "PM Modi to inaugurate Ahmedabad–Dholera Expressway built at ₹5,100 crore", href: "https://deshgujarat.com/2026/03/30/pm-modi-to-inaugurate-ahmedabad-dholera-expressway-built-at-%E2%82%B95100-crore/", date: "2026-03-30", note: "Inauguration set for 31 March 2026. Four NHAI packages, over ₹5,100 crore." },
  { id: "wiki-expressway", tier: "press", publisher: "Wikipedia", title: "Ahmedabad–Dholera Expressway", href: "https://en.wikipedia.org/wiki/Ahmedabad%E2%80%93Dholera_Expressway", note: "Reference article. Records the 31 March 2026 inauguration." },
  { id: "deshgujarat-sez", tier: "press", publisher: "DeshGujarat", title: "Centre notifies 66-hectare SEZ for Tata Semiconductor in Dholera", href: "https://deshgujarat.com/2026/04/15/centre-notifies-66-hectare-sez-for-tata-semiconductor-in-dholera/", date: "2026-04-15", note: "Notified 9 April 2026. Letter of approval 17 March 2026. Plots in TP Scheme 2A." },
  { id: "pioneer-sez", tier: "press", publisher: "The Pioneer", title: "Govt notifies SEZ for Tata Semiconductor plant at Dholera", href: "https://dailypioneer.com/news/govt-notifies-sez-for-tata-semiconductor-plant-at-dholera", date: "2026-04-16", note: "Proposed investment of ₹91,000 crore." },
  { id: "bt-dholera", tier: "press", publisher: "Business Today", title: "Semiconductor chip push, airport milestone, rising land prices", href: "https://www.businesstoday.in/real-estate/story/semiconductor-chip-push-airport-milestone-rising-land-prices-is-dholera-the-next-real-estate-hotspot-540558-2026-07-03", date: "2026-07-03", note: "AAI trial landing on 5 June 2026. Tata Electronics–ASML agreement in May 2026." },
  { id: "gs-airport", tier: "press", publisher: "Gujarat Samachar", title: "First aircraft lands successfully at under-construction Dholera International Airport", href: "https://english.gujaratsamachar.com/news/gujarat/first-aircraft-lands-successfully-at-under-construction-dholera-international-airport-29656371474.html", date: "2026-06", note: "AAI aircraft landing at the site near Pipli." },
  { id: "wiki-airport", tier: "press", publisher: "Wikipedia", title: "Dholera International Airport", href: "https://en.wikipedia.org/wiki/Dholera_International_Airport", note: "Reference article. 3,200 m runway, operations targeted for 2026." },
  { id: "ii-shsr", tier: "press", publisher: "Indian Infrastructure", title: "Ahmedabad (Sarkhej)–Dholera Semi High-Speed Rail Project gets approved", href: "https://indianinfrastructure.com/2026/05/15/ahmedabad-sarkhej-dholera-semi-high-speed-rail-project-gets-approved/", date: "2026-05-15", note: "CCEA approval on 13 May 2026, about ₹20,667 crore, about 134 km." },
  { id: "mrn-shsr-tender", tier: "press", publisher: "Metro Rail News", title: "Western Railway floats ₹18,901.68 cr EPC tender for Sarkhej–Dholera semi high-speed double line", href: "https://metrorailnews.in/western-railway-floats-%E2%82%B918901-68-cr-epc-tender-for-sarkhej-dholera-semi-high-speed-double-rail-line/", date: "2026-08", note: "Single EPC contract covering civil works, track, traction, signalling and telecom, with spurs to Lothal and the airport. 42-month completion." },
  { id: "wiki-dsir", tier: "press", publisher: "Wikipedia", title: "Dholera Special Investment Region", href: "https://en.wikipedia.org/wiki/Dholera_Special_Investment_Region", note: "Reference article. Solar park plan of 4,400 MW, Phase 1 of 1,000 MW, Tata–PSMC fab." },
  { id: "fpj-dc-policy", tier: "press", publisher: "Free Press Journal", title: "Gujarat unveils Data Centre Policy 2026–29", href: "https://www.freepressjournal.in/india/gujarat-unveils-data-centre-policy-2026-29-eyes-6-lakh-crore-investment-in-digital-infrastructure", date: "2026-07-09", note: "Policy launch. First-phase investment expected above ₹6 lakh crore." },
  { id: "ians-dc-policy", tier: "press", publisher: "IANS", title: "Gujarat notifies data centre policy to build 7.5 GW green AI capacity by 2029", href: "https://ianslive.in/gujarat-notifies-data-centre-policy-to-build-75-gw-green-ai-capacity-by-2029--20260807190500", date: "2026-08-07", note: "Notified by Government Resolution. Capital subsidy for projects in the Dholera region." },
];

/** Status vocabulary, in display order. `tone` picks the badge colour in the site CSS. */
export const statuses = [
  { id: "operational", label: "Operational", tone: "done" },
  { id: "built", label: "Built", tone: "done" },
  { id: "construction", label: "Under construction", tone: "active" },
  { id: "tendering", label: "Tendering", tone: "active" },
  { id: "approved", label: "Approved", tone: "next" },
  { id: "initiated", label: "Initiated", tone: "active" },
  { id: "planned", label: "Planned", tone: "next" },
  { id: "policy", label: "Policy", tone: "info" },
];

export const categories = [
  { id: "infrastructure", label: "Trunk infrastructure" },
  { id: "connectivity", label: "Connectivity" },
  { id: "industry", label: "Industry" },
  { id: "energy", label: "Energy" },
  { id: "social", label: "Social" },
];

export const projects = [
  {
    id: "expressway",
    title: "Ahmedabad–Dholera Expressway",
    category: "connectivity",
    status: "operational",
    headline: "109 km, four lanes, access-controlled. Opened 31 March 2026.",
    figures: [["Length", "109 km"], ["Lanes", "4 (expandable)"], ["Builder", "NHAI"], ["Cost", "Over ₹5,100 cr (press)"]],
    milestones: [
      { date: "2026-03-31", text: "Inaugurated by the Prime Minister and opened to traffic.", sourceIds: ["deshgujarat-expressway", "wiki-expressway"] },
    ],
    note: "The DSIRDA FAQ (updated 24 Aug 2026) still describes the expressway as being implemented by NHAI. The opening comes from press reports.",
    asOf: "2026-10-20",
    sourceIds: ["dsirda-faq", "deshgujarat-expressway", "wiki-expressway"],
    explore: "expressway",
  },
  {
    id: "airport",
    title: "Dholera International Airport",
    category: "connectivity",
    status: "construction",
    headline: "AAI flew a trial landing on 5 June 2026. Not yet open to commercial flights.",
    figures: [["Distance", "About 20 km from Dholera"], ["Runway", "3,200 m (reference)"], ["Company", "DIACL: AAI, GoG, NICDIT"]],
    milestones: [
      { date: "2026-06-05", text: "Airports Authority of India aircraft completes a trial landing.", sourceIds: ["bt-dholera", "gs-airport"] },
    ],
    note: "Press reports give different opening targets, from late 2026 to 2027. No commissioning date has been published by AAI or DSIRDA.",
    asOf: "2026-10-20",
    sourceIds: ["dsirda-faq", "bt-dholera", "gs-airport", "wiki-airport"],
    explore: "airport",
  },
  {
    id: "tata-fab",
    title: "Tata–PSMC semiconductor fab",
    category: "industry",
    status: "construction",
    headline: "India’s first commercial chip fab. SEZ of 66.166 ha notified in April 2026.",
    figures: [["Investment", "₹91,000 cr"], ["Partner", "PSMC, Taiwan"], ["SEZ", "66.166 ha"], ["Location", "TP Scheme 2A"]],
    milestones: [
      { date: "2024-02", text: "Union Cabinet approves the Tata Electronics–PSMC fab at Dholera.", sourceIds: ["wiki-dsir"] },
      { date: "2026-04-09", text: "Department of Commerce notifies the SEZ for Tata Semiconductor Manufacturing Pvt Ltd.", sourceIds: ["pib-tata-sez", "deshgujarat-sez"] },
      { date: "2026-05", text: "Tata Electronics signs an agreement with ASML (reported).", sourceIds: ["bt-dholera"] },
    ],
    note: "The production start date is not official. Press estimates range from late 2026 to 2027.",
    asOf: "2026-10-20",
    sourceIds: ["dsirda-about", "pib-tata-sez", "deshgujarat-sez", "pioneer-sez", "bt-dholera", "policy-semicon"],
    explore: "semicon",
  },
  {
    id: "shsr",
    title: "Sarkhej–Dholera semi high-speed rail",
    category: "connectivity",
    status: "tendering",
    headline: "Indian Railways’ first semi high-speed line. Approved May 2026, EPC bids open.",
    figures: [["Sanctioned cost", "About ₹20,667 cr"], ["Length", "About 134 km"], ["EPC tender", "₹18,901.68 cr"], ["Build period", "42 months (tender)"]],
    milestones: [
      { date: "2026-05-13", text: "Cabinet Committee on Economic Affairs approves the project.", sourceIds: ["ii-shsr"] },
      { date: "2026-08", text: "Western Railway invites EPC bids, with spurs to Lothal and the airport.", sourceIds: ["mrn-shsr-tender"] },
    ],
    note: "Figures are from press reports of the Cabinet decision and the tender notice. Check IREPS for the current bid schedule.",
    asOf: "2026-10-20",
    sourceIds: ["dsirda-faq", "ii-shsr", "mrn-shsr-tender"],
    explore: "passenger-rail",
  },
  {
    id: "freight-rail",
    title: "Bhimnath–Dholera freight line",
    category: "connectivity",
    status: "construction",
    headline: "Western Railway line toward the Dedicated Freight Corridor near Ahmedabad.",
    figures: [["Implementer", "Western Railway"]],
    milestones: [],
    note: "DSIRDA lists the line as under implementation. No completion date is published.",
    asOf: "2026-08-24",
    sourceIds: ["dsirda-faq"],
    explore: "rail",
  },
  {
    id: "activation-trunk",
    title: "Activation Area trunk infrastructure",
    category: "infrastructure",
    status: "built",
    headline: "22.54 km² in TP 2A and 4A, with roads, utilities and plants in place.",
    figures: [["Area", "22.54 km²"], ["Internal roads", "72 km"], ["Plots", "1 to 330 acres"], ["Earth filling", "1.5–2 m"]],
    milestones: [{ date: "2016", text: "DICDL formed. Implementation starts in TP 2A and 4A.", sourceIds: ["dsirda-faq"] }],
    note: "Utility ducts for water, wastewater, ICT, gas and storm water run under the road network.",
    asOf: "2026-08-24",
    sourceIds: ["dsirda-faq"],
    explore: "activation",
  },
  {
    id: "abcd",
    title: "ABCD building and CIOC",
    category: "infrastructure",
    status: "built",
    headline: "Administrative and Business Centre, with the City Integrated Operations Center.",
    figures: [["Houses", "Offices, CIOC, auditorium, exhibition, bank, post office"]],
    milestones: [],
    note: "The CIOC monitors utilities, traffic and emergency response.",
    asOf: "2026-08-24",
    sourceIds: ["dsirda-faq"],
    explore: "bec",
  },
  {
    id: "water",
    title: "Water, sewage and effluent plants",
    category: "infrastructure",
    status: "operational",
    headline: "WTP 50 MLD, STP 10 MLD, CETP 20 MLD, each designed to scale threefold.",
    figures: [["WTP", "50 → 150 MLD"], ["STP", "10 → 30 MLD"], ["CETP", "20 → 60 MLD"], ["Reservoirs", "2 MBR + 9 ESR"]],
    milestones: [],
    note: "The WTP is about 5 km from the Activation Area. DSIRDA describes the STP and CETP as ready for operation.",
    asOf: "2026-08-24",
    sourceIds: ["dsirda-faq"],
    explore: "wtp",
  },
  {
    id: "canal",
    title: "Central storm-water canal",
    category: "infrastructure",
    status: "built",
    headline: "6.6 km canal carrying storm water from the road network to the sea.",
    figures: [["Length", "6.6 km"]],
    milestones: [],
    asOf: "2026-08-24",
    sourceIds: ["dsirda-faq"],
    explore: "canal",
  },
  {
    id: "power-torrent",
    title: "Torrent Power substations",
    category: "energy",
    status: "built",
    headline: "Two substations, including a 400/220 kV GIS with SCADA. 500 MVA now, 1,500 MVA planned.",
    figures: [["Capacity", "500 → 1,500 MVA"], ["Licensee", "Torrent Power"]],
    milestones: [],
    asOf: "2026-08-24",
    sourceIds: ["dsirda-faq"],
    explore: "sub-torrent",
  },
  {
    id: "power-getco",
    title: "GETCO 220 kV substation",
    category: "energy",
    status: "construction",
    headline: "The second power source, being developed by GETCO.",
    figures: [["Voltage", "220 kV"]],
    milestones: [],
    asOf: "2026-08-24",
    sourceIds: ["dsirda-faq"],
    explore: "sub-getco",
  },
  {
    id: "solar",
    title: "Dholera solar park",
    category: "energy",
    status: "operational",
    headline: "Tata Power’s 300 MW plant running since April 2022. A much larger park is planned.",
    figures: [["Commissioned", "300 MW (Tata Power)"], ["Planned park", "4,400 MW (reference)"], ["Phase 1", "1,000 MW (reference)"]],
    milestones: [{ date: "2022-04-04", text: "Tata Power Renewables commissions 300 MW with single-axis trackers.", sourceIds: ["tatapower-solar"] }],
    note: "The 4,400 MW and 1,000 MW figures come from a reference article, not from DSIRDA.",
    asOf: "2026-10-20",
    sourceIds: ["tatapower-solar", "wiki-dsir"],
    explore: "solar",
  },
  {
    id: "gas",
    title: "City gas network",
    category: "energy",
    status: "initiated",
    headline: "Gujarat Gas has started a transmission pipeline toward plot-level supply.",
    figures: [["Operator", "Gujarat Gas Ltd"]],
    milestones: [],
    asOf: "2026-08-24",
    sourceIds: ["dsirda-faq"],
  },
  {
    id: "data-centres",
    title: "Data Centre Policy 2026–29",
    category: "industry",
    status: "policy",
    headline: "Gujarat’s new policy names Dholera a priority zone for green AI data centres.",
    figures: [["State target", "About 7.5 GW"], ["Dholera incentive", "Capital subsidy (reported)"]],
    milestones: [
      { date: "2026-07-09", text: "Policy launched.", sourceIds: ["fpj-dc-policy"] },
      { date: "2026-08-07", text: "Notified by Government Resolution.", sourceIds: ["ians-dc-policy"] },
    ],
    note: "No individual data-centre project in Dholera has been announced in an official source.",
    asOf: "2026-10-20",
    sourceIds: ["fpj-dc-policy", "ians-dc-policy"],
  },
  {
    id: "social",
    title: "School, hospital, fire station, housing",
    category: "social",
    status: "initiated",
    headline: "Healthcare, a school to 12th standard, a fire station, a food court, housing, a guest house and a hotel.",
    figures: [["Mode", "Land allotment and PPP"]],
    milestones: [],
    note: "DSIRDA gives no opening dates or capacities.",
    asOf: "2026-08-24",
    sourceIds: ["dsirda-faq"],
    explore: "school",
  },
];

export const timeline = [
  { date: "2008-05", year: "2008", text: "Approved as a node of the Delhi–Mumbai Industrial Corridor.", sourceIds: ["dsirda-faq"] },
  { date: "2009", year: "2009", text: "Gujarat passes the Special Investment Region Act.", sourceIds: ["dsirda-faq"] },
  { date: "2010", year: "2010", text: "DSIRDA is established as the regional development authority.", sourceIds: ["dsirda-faq"] },
  { date: "2011", year: "2011", text: "Master-planning work starts.", sourceIds: ["dsirda-faq"] },
  { date: "2012", year: "2012", text: "An ICT master plan is prepared.", sourceIds: ["dsirda-faq"] },
  { date: "2013", year: "2013", text: "Programme managers are appointed.", sourceIds: ["dsirda-faq"] },
  { date: "2014", year: "2014", text: "Environment clearance is received.", sourceIds: ["dsirda-faq"] },
  { date: "2016", year: "2016", text: "DICDL is formed. Implementation starts on TP 2A and 4A, the 22.54 km² Activation Area. DICDL is 51% Government of Gujarat, through DSIRDA, in land, and 49% the Government of India, through NICDIT, in cash.", sourceIds: ["dsirda-faq"] },
  { date: "2022-04-04", year: "2022", text: "Tata Power commissions a 300 MW solar plant at Dholera.", sourceIds: ["tatapower-solar"] },
  { date: "2024-02", year: "2024", text: "The Union Cabinet approves the Tata Electronics–PSMC semiconductor fab at Dholera.", sourceIds: ["wiki-dsir"] },
  { date: "2026-03-31", year: "2026", text: "The 109 km Ahmedabad–Dholera Expressway is inaugurated.", sourceIds: ["deshgujarat-expressway", "wiki-expressway"] },
  { date: "2026-04-09", year: "2026", text: "A 66.166 ha SEZ for Tata Semiconductor Manufacturing is notified.", sourceIds: ["pib-tata-sez", "deshgujarat-sez"] },
  { date: "2026-05-13", year: "2026", text: "The Cabinet approves the Sarkhej–Dholera semi high-speed rail line.", sourceIds: ["ii-shsr"] },
  { date: "2026-06-05", year: "2026", text: "An AAI aircraft makes a trial landing at Dholera International Airport.", sourceIds: ["bt-dholera", "gs-airport"] },
  { date: "2026-08-07", year: "2026", text: "Gujarat notifies its Data Centre Policy 2026–29, with Dholera as a priority zone.", sourceIds: ["ians-dc-policy"] },
  { date: "2026-08", year: "2026", text: "Western Railway invites EPC bids for the semi high-speed line.", sourceIds: ["mrn-shsr-tender"] },
  { date: "Now", year: "Now", text: "DSIRDA says trunk infrastructure in the Activation Area has been developed. Later area will be taken up as town-planning schemes are approved. The Activation Area is also described as a Semicon City under the Gujarat Semiconductor Policy of 2022.", sourceIds: ["dsirda-faq", "dsirda-planning"] },
];

export const villages = [
  { id: "ambli", name: "Ambli", lat: 22.3258371, lon: 72.230266, pin: "osm", note: "The OpenStreetMap node is a sub-centre labelled Ambli. It marks a place in the village, not a surveyed centre." },
  { id: "bavaliyari", name: "Bavaliyari", lat: 22.0751785, lon: 72.1175549, pin: "osm", note: "OpenStreetMap place node." },
  { id: "bhadiyad", name: "Bhadiyad", lat: 22.2800596, lon: 72.1677497, pin: "osm", note: "OpenStreetMap place node." },
  { id: "bhangadh", name: "Bhangadh", lat: 22.1234135, lon: 72.211734, pin: "osm", note: "OpenStreetMap place node." },
  { id: "bhimtalav", name: "Bhimtalav", lat: 22.2335455, lon: 72.2046755, pin: "osm", note: "OpenStreetMap node named Bhimtalav, near the Dholera village node." },
  { id: "cher", name: "Cher", lat: 22.2537791, lon: 72.0919701, pin: "osm", note: "OpenStreetMap place node." },
  { id: "dholera", name: "Dholera", lat: 22.2495856, lon: 72.1959892, pin: "osm", note: "This node is the origin of the model. East is +X. North is −Z. One unit is one metre." },
  { id: "gogla", name: "Gogla", lat: 22.2914227, lon: 72.2378826, pin: "osm", note: "OpenStreetMap place node." },
  { id: "gorasu", name: "Gorasu", lat: 22.2568111, lon: 72.1337168, pin: "osm", note: "OpenStreetMap place node." },
  { id: "hebatpur", name: "Hebatpur", lat: 22.1398631, lon: 72.1004929, pin: "osm", note: "OpenStreetMap place node." },
  { id: "kadipur", name: "Kadipur", lat: 22.276348, lon: 72.2026384, pin: "osm", note: "The OpenStreetMap name at this node sits on the Ahmedabad–Dholera Expressway. The Activation Area rectangle is centred near it and is still only a schematic footprint." },
  { id: "khun", name: "Khun", lat: 22.2449925, lon: 72.2282455, pin: "osm", note: "OpenStreetMap place node." },
  { id: "mahadevpura", name: "Mahadevpura", lat: 22.1461861, lon: 72.2388088, pin: "osm", note: "OpenStreetMap names Dholera Solar Park at this Mahadevpura node. The dark field is drawn here. Its edges are schematic." },
  { id: "mingalpur", name: "Mingalpur", lat: 22.0998684, lon: 72.2055728, pin: "osm", note: "OpenStreetMap place node." },
  { id: "mundi", name: "Mundi", lat: 22.1980259, lon: 72.1736604, pin: "osm", note: "OpenStreetMap place node." },
  { id: "otariya", name: "Otariya", lat: 22.237163, lon: 72.1347276, pin: "osm", note: "OpenStreetMap place node." },
  { id: "panchi", name: "Panchi", lat: 22.175257, lon: 72.1734842, pin: "osm", note: "OpenStreetMap place node." },
  { id: "rahtalav", name: "Rahtalav", lat: 22.205167, lon: 72.2495084, pin: "osm", note: "OpenStreetMap place node, toward the gulf side of the village cluster." },
  { id: "sandhida", name: "Sandhida", lat: 22.1868428, lon: 72.1539264, pin: "osm", note: "OpenStreetMap place node." },
  { id: "sangasar", name: "Sangasar", lat: null, lon: null, pin: "none", note: "The name is on published lists of the 22 villages. No OpenStreetMap centre was found, so Sangasar is listed and not pinned." },
  { id: "sodhi", name: "Sodhi", lat: 22.218913, lon: 72.0680657, pin: "osm", note: "OpenStreetMap place node, on the inland side of the cluster." },
  { id: "zankhi", name: "Zankhi", lat: 22.1011036, lon: 72.1862152, pin: "osm", note: "OpenStreetMap place node. Also spelled Zakhi in some lists." },
];

export const connectivity = [
  { mode: "Road", items: [["Ahmedabad–Dholera Expressway", "109 km, open since March 2026"], ["NH 751", "Ahmedabad–Bhavnagar, through the city"], ["Ahmedabad", "About 100 km north-east"]], sourceIds: ["dsirda-faq", "deshgujarat-expressway"] },
  { mode: "Air", items: [["Dholera International", "About 20 km, under construction"], ["Bhavnagar", "60 km"], ["Ahmedabad", "125 km"], ["Vadodara", "145 km"]], sourceIds: ["dsirda-faq"] },
  { mode: "Rail", items: [["Sarkhej–Dholera semi high-speed", "Approved 2026, tendering"], ["Bhimnath–Dholera freight", "Under implementation"]], sourceIds: ["dsirda-faq", "ii-shsr"] },
  { mode: "Sea", items: [["Pipavav", "200 km"], ["Kandla", "300 km"], ["Mundra", "350 km"]], sourceIds: ["dsirda-faq"] },
];

export const climate = [
  { season: "Winter", months: "November–February", range: "18–32 °C" },
  { season: "Summer", months: "March–May", range: "25–40 °C" },
  { season: "Monsoon", months: "June–October", range: "27–37 °C" },
];

export const allotment = {
  modes: [
    { use: "Industrial", how: "First come first served, auction, or tender" },
    { use: "Residential", how: "Auction or tender" },
    { use: "Commercial", how: "Auction or tender" },
  ],
  steps: [
    "Read the land allotment policy and the GDCR for the use you need.",
    "Check the current rates on the official DSIRDA land-pricing page.",
    "Apply for approvals through the Gujarat Investor Facilitation Portal.",
    "Plan for 1.5 to 2 m of earth filling. The project does it unless filling is bought as an extra.",
  ],
  policies: ["policy-semicon", "policy-electronics", "policy-it", "policy-agsi"],
  sourceIds: ["dsirda-faq", "dsirda-allotment", "dsirda-gdcr", "dsirda-pricing", "ifp"],
};

export const faq = [
  { q: "What is Dholera SIR?", a: "A Special Investment Region under Gujarat’s SIR Act of 2009, about 100 km south-west of Ahmedabad. It is a node of the Delhi–Mumbai Industrial Corridor, and DSIRDA calls it India’s first greenfield industrial smart city.", sourceIds: ["dsirda-faq"] },
  { q: "How large is it?", a: "920 km² in total and 22 villages of Dholera taluka. Town-planning schemes 1 to 6 cover 422 km². DSIRDA’s Planning page counts TP1 and TP2 together, 153 km², as Phase I. The FAQ uses “Phase I” for the 22.54 km² Activation Area, the first construction phase.", sourceIds: ["dsirda-faq", "dsirda-planning"] },
  { q: "Who develops it?", a: "DSIRDA is the planning authority. DICDL, the special-purpose vehicle, builds infrastructure and allots land. DICDL is 51% Government of Gujarat, through DSIRDA, and 49% Government of India, through NICDIT.", sourceIds: ["dsirda-faq", "dsirda-about"] },
  { q: "What is already built?", a: "In the Activation Area: about 72 km of roads with underground utilities, the water, sewage and effluent plants, reservoirs, Torrent Power substations, the 6.6 km canal, and the ABCD building with the city operations centre.", sourceIds: ["dsirda-faq"] },
  { q: "Is the expressway open?", a: "Yes, according to press reports. The 109 km Ahmedabad–Dholera Expressway was inaugurated on 31 March 2026. The DSIRDA FAQ had not yet been updated to say so as of 24 August 2026.", sourceIds: ["deshgujarat-expressway", "wiki-expressway", "dsirda-faq"] },
  { q: "When does the airport open?", a: "There is no official date. An AAI aircraft made a trial landing on 5 June 2026, and press reports give targets from late 2026 to 2027. Commercial flights also need a DGCA aerodrome licence.", sourceIds: ["bt-dholera", "gs-airport"] },
  { q: "What is the Tata semiconductor project?", a: "A fab by Tata Electronics with Taiwan’s PSMC, with a proposed investment of ₹91,000 crore. DSIRDA puts the investment at ₹91,000 crore. The Commerce Ministry notified a 66.166 ha SEZ for it in April 2026.", sourceIds: ["dsirda-about", "pib-tata-sez"] },
  { q: "How is land allotted?", a: "Industrial land: first come first served, auction, or tender. Residential and commercial land: auction or tender. Plots in the Activation Area run from 1 acre to 330 acres, and parcels can be combined.", sourceIds: ["dsirda-faq", "dsirda-allotment"] },
  { q: "Where are land prices?", a: "On the official DSIRDA land-pricing page. This site does not copy prices, and it is not a broker.", sourceIds: ["dsirda-pricing"] },
  { q: "What is the climate like?", a: "Winter, November to February, is about 18–32 °C. Summer, March to May, is about 25–40 °C. The monsoon, June to October, is about 27–37 °C.", sourceIds: ["dsirda-faq"] },
  { q: "Is this an official site?", a: "No. It is an independent guide and schematic model built from public sources. Confirm boundaries, rules and allotment with DSIRDA and DICDL.", sourceIds: [] },
];

export const disclaimer =
  "Independent guide and schematic model. Not a government site, not a survey, and not an offer of land. Confirm boundaries, rules, and allotment with DSIRDA and DICDL.";

export function sourceById(id) {
  return sources.find((s) => s.id === id) || null;
}
