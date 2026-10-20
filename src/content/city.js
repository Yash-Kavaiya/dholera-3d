/** Published figures and labels. Geometry in src/geo/layout.js must use these numbers. */

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
});

export const disclaimer =
  "Unofficial schematic model. Not a survey, not a government site, and not an offer of land. Confirm boundaries, rules, and allotment with DSIRDA and DICDL.";

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

export const zones = [
  { id: "zone-industrial", title: "Industrial", paragraphs: ["The Activation Area is described as an industrial zone with large contiguous parcels and plug-in utilities. Across the wider plan, industry is one of the main uses.", "This wash is a schematic extent. It is not the development-plan boundary, and it has no plot prices."] },
  { id: "zone-residential", title: "Residential", paragraphs: ["Residential land is part of the published mix, in the Activation Area and in later town-planning schemes. DSIRDA allots residential plots by auction or tender, not by the model you are looking at.", "The blocks inside the Activation Area are translucent because those buildings are not being claimed as finished."] },
  { id: "zone-city", title: "City centre", paragraphs: ["A city-centre use sits in the development plan alongside knowledge, logistics, and the high-access corridor. The pale patch marks that use.", "Its place on this model is schematic. The Administrative and Business Centre you can walk to is a real project inside the Activation Area, and it is not the whole city centre."] },
  { id: "zone-knowledge", title: "Knowledge and IT", paragraphs: ["Knowledge and IT is a named use in the development plan. Gujarat’s IT / ITeS policy is one of the state policies DSIRDA points investors to.", "The patch is a catalogue of the use, drawn on the model so you can fly to it. It is not a surveyed campus."] },
  { id: "zone-access", title: "High access corridor", paragraphs: ["The high-access corridor is the planned intense mixed-use band, tied to the main roads. On a real plan it follows the corridor. Here it is a patch near the schematic expressway.", "FAR and height depend on the General Development Control Regulations and the road in front of a plot. This model does not print those numbers."] },
  { id: "zone-logistics", title: "Logistics", paragraphs: ["Logistics land is meant to sit on the freight and highway network: the expressway, the Bhimnath–Dholera freight line, and the highways already named by DSIRDA.", "The patch is schematic. The freight line drawn to the west is a straight corridor, not a surveyed track."] },
  { id: "zone-tourism", title: "Tourism and resorts", paragraphs: ["Tourism is a published use, on the gulf side of a coastal city. The strip is drawn toward the water for that reason.", "It is not a resort map, and the coast in this model is the edge of the schematic plinth, not the notified shoreline."] },
  { id: "zone-sports", title: "Sports and recreation", paragraphs: ["Sports and recreation is a separate use in the development plan, distinct from neighbourhood open space.", "The green patch marks the use. It does not locate a stadium."] },
  { id: "zone-public", title: "Public and social facilities", paragraphs: ["The Activation Area plan reserves land for healthcare, education, a police station, a fire station, and other social uses. DSIRDA says work has started on a hospital, a school, a fire station, a food court, housing, a guest house, and a hotel.", "Those buildings are the translucent ones inside the Activation Area. This regional patch is the wider use, and it is schematic."] },
  { id: "zone-solar", title: "Solar", paragraphs: ["A 300 MW solar park is part of the public project record. OpenStreetMap places a feature named Dholera Solar Park at Mahadevpura, and the dark field is drawn there.", "Panel rows and the field’s edges are schematic. The pin is the map node."] },
  { id: "zone-agriculture", title: "Agriculture and later phases", paragraphs: ["Most of the 920 km² is not in the first construction phase. DSIRDA says later areas will be taken up as town-planning schemes are approved.", "The outer wash is that remainder. It is not a map of farms or of plots for sale."] },
  { id: "zone-crz", title: "Coastal belt", paragraphs: ["The gulf is the eastern condition of Dholera. A coastal regulation belt is part of how the real plan treats that edge.", "This strip follows the eastern side of the schematic plinth. It is not the notified coastal regulation line."] },
];

export const chapters = [
  {
    id: "arrive",
    label: "Arrive",
    kicker: "Gulf of Khambhat",
    title: "Dholera",
    paragraphs: [
      "A planning model of the Special Investment Region: the whole 920 km² plinth, the 422 km² town-planning area, and the 22.54 km² Activation Area where the trunk works already stand.",
      "Solid forms are works DSIRDA describes as built. Translucent forms are planned or only started. The plinth is sized to the published area. It is not the notified boundary.",
    ],
    links: [
      { id: "gulf", label: "Gulf of Khambhat" },
      { id: "sir", label: "The 920 km² plinth" },
    ],
  },
  {
    id: "region",
    label: "Region",
    kicker: "920 km²",
    title: "The region",
    paragraphs: [
      "Dholera SIR is a special investment region under Gujarat’s SIR Act of 2009, about 100 km south-west of Ahmedabad, on the Delhi–Mumbai Industrial Corridor. DSIRDA calls it India’s first greenfield industrial smart city and describes the 920 km² footprint as larger than Singapore.",
      "The region covers 22 villages of Dholera taluka. It sits between the industrial cities of Vadodara, Ahmedabad, Rajkot, and Bhavnagar, with the Gulf of Khambhat on the east.",
      "Winter on the DSIRDA note runs from November to February, about 18°C to 32°C. Summer, March to May, about 25°C to 40°C. The monsoon, June to October, about 27°C to 37°C.",
    ],
    links: [
      { id: "gulf", label: "Gulf" },
      { id: "ahmedabad", label: "Toward Ahmedabad" },
      { id: "bhavnagar", label: "Toward Bhavnagar" },
    ],
  },
  {
    id: "plan",
    label: "The Plan",
    kicker: "422 km²",
    title: "Town planning",
    paragraphs: [
      "Under town-planning schemes 1 to 6, DSIRDA counts 422 km² as the developable area. Phase I is TP1 and TP2 together, 153 km². The line between TP1 and TP2 on this model is not the notified boundary. The four later bands split the remaining area equally because a public per-scheme area was not used here.",
      "The mechanism is Gujarat’s town-planning scheme, under the Gujarat Town Planning and Urban Development Act, so land can be reconstituted for roads and public uses as well as for building.",
      "Industrial land is allotted first-come, by auction, or by tender. Residential and commercial land is allotted by auction or tender. Plots in the Activation Area are published from 1 acre up to 330 acres, and parcels can be combined. Prices are on the DSIRDA land-pricing page, not in this model.",
    ],
    links: [
      { id: "tp1", label: "TP1" },
      { id: "tp2", label: "TP2" },
      { id: "tp3", label: "TP3" },
      { id: "tp4", label: "TP4" },
      { id: "tp5", label: "TP5" },
      { id: "tp6", label: "TP6" },
    ],
  },
  {
    id: "activation",
    label: "Activation",
    kicker: "22.54 km²",
    title: "Activation Area",
    paragraphs: [
      "The first phase of construction is 22.54 km² in town-planning schemes 2A and 4A. DSIRDA says the trunk infrastructure here has been developed: roads, underground utilities, plants, reservoirs, substations, the canal, and the ABCD buildings.",
      "The rectangle is sized to 22.54 km² and placed near the Kadipur expressway node. The streets are a designed grid whose centrelines add up to the published 72 km. They are not the sanctioned road cadastre. Walk mode works only inside this rectangle.",
      "Three tints divide the rectangle into industrial, residential, and commercial ground. That division is illustrative. The Activation Area does contain all three uses. The drawing is not the plot plan.",
    ],
    links: [
      { id: "activation", label: "Footprint" },
      { id: "aa-roads", label: "72 km of roads" },
      { id: "bec", label: "Business and Exhibition Center" },
      { id: "spv", label: "SPV building" },
    ],
  },
  {
    id: "zones",
    label: "Zones",
    kicker: "Land use",
    title: "Uses",
    paragraphs: [
      "Fly the coloured washes, or read them here. Each one is a use named in the public planning record. None of them is a traced development-plan polygon, and none of them carries a price.",
      "Rules for floor area and height live in the General Development Control Regulations. They change with the width of the road a plot faces. Use the official PDF before you treat a number from anywhere else as a rule.",
    ],
    links: [],
  },
  {
    id: "infrastructure",
    label: "Infrastructure",
    kicker: "Trunk works",
    title: "What is already there",
    paragraphs: [
      "Inside the Activation Area the public list is specific. About 72 km of internal roads. Utilities under those roads for water, wastewater, ICT, gas, and storm water. A water treatment plant of 50 MLD, scalable to 150, sited about 5 km from the Activation Area. A sewage plant of 10 MLD, scalable to 30. A common effluent plant of 20 MLD, scalable to 60.",
      "Two mass-balancing reservoirs and nine elevated service reservoirs. Recycled water from the sewage and effluent plants is part of the supply story, alongside treated water. Storm water uses the road network and a central canal of 6.6 km to the sea. DSIRDA also notes that plots need about 1.5 to 2 metres of earth filling, done by the project unless filling is bought as an extra.",
      "Power is described as dual-source. Torrent Power has built substations, including a 400/220 kV gas-insulated, SCADA-enabled substation, with distribution of 500 MVA scalable to 1,500. A 220 kV GETCO substation is being developed. Gujarat Gas has started a transmission line toward plot-level supply. ICT ducts are in, and the City Integrated Operations Center in the ABCD building is meant to watch utilities, traffic, and emergency response.",
    ],
    links: [
      { id: "canal", label: "Central canal" },
      { id: "wtp", label: "Water treatment" },
      { id: "stp", label: "Sewage plant" },
      { id: "cetp", label: "Effluent plant" },
      { id: "sub-torrent", label: "Torrent substation" },
      { id: "sub-getco", label: "GETCO substation" },
      { id: "esr", label: "Reservoirs" },
    ],
  },
  {
    id: "connect",
    label: "Connect",
    kicker: "Roads, rail, air, sea",
    title: "How you get there",
    paragraphs: [
      "National and state highways already tie the site to Ahmedabad, Rajkot, Mundra, Kandla, Pipavav, Dahej, Hazira, Bhavnagar, Delhi, and Mumbai. NH 751, the Ahmedabad–Bhavnagar road, passes through the industrial city. A separate access-controlled expressway, about 109 km and four lanes, is being built by NHAI between Ahmedabad and Dholera.",
      "The Dholera International Airport is a company of the Airports Authority of India, the Government of Gujarat, and NICDIT. DSIRDA places it about 20 km from Dholera, with a link to the expressway. The FAQ still names Bhavnagar (60 km), Ahmedabad (125 km), and Vadodara (145 km) as the nearest existing airports.",
      "A Bhimnath–Dholera freight line is under implementation by Western Railway, toward the Dedicated Freight Corridor near Ahmedabad. A semi-high-speed passenger line is planned from Ahmedabad along the expressway. The nearest port in the FAQ is Pipavav at 200 km, then Kandla at 300 km and Mundra at 350 km.",
    ],
    links: [
      { id: "expressway", label: "Expressway" },
      { id: "nh751", label: "NH 751" },
      { id: "airport", label: "Airport" },
      { id: "rail", label: "Freight corridor" },
    ],
  },
  {
    id: "villages",
    label: "Villages",
    kicker: "Twenty-two names",
    title: "Villages",
    paragraphs: [
      "DSIRDA says the region covers 22 villages of Dholera taluka. The names below are the list this model uses. A pin, where you see one, is an OpenStreetMap place node. It is not a village boundary and not a statement about whether a survey number falls inside the notified region.",
      "Sangasar stays in the list without a pin. No OpenStreetMap centre was found for it.",
    ],
    links: [],
  },
  {
    id: "time",
    label: "Time",
    kicker: "2008 onward",
    title: "How it got this far",
    paragraphs: [
      "The sequence below is the one DSIRDA publishes. Later phases still wait on town-planning approval. The Activation Area is the part where the trunk contracts have already been built.",
    ],
    links: [{ id: "activation", label: "See the Activation Area" }],
  },
  {
    id: "sources",
    label: "Sources",
    kicker: "Read the record",
    title: "Sources and limits",
    paragraphs: [
      "Numbers in this model are the published ones: 920 km², 422 km², 153 km² for Phase I, 22.54 km², 72 km of road, 6.6 km of canal, and the plant capacities. If a figure is not in that public set, it is not printed here.",
      "The ground is a model. The plinth was grown from OpenStreetMap village nodes until its area matched 920 km². Town-planning bands were cut from a 422 km² inner shape. The Activation Area is a rectangle of the right area near Kadipur. Do not use it to buy land or to argue a boundary.",
      "Approvals are filed through the state’s Investor Facilitation Portal. Allotment rules, the GDCR, and land pricing are on the DSIRDA site.",
    ],
    links: [],
  },
];

chapters.find((c) => c.id === "zones").links = zones.map((z) => ({ id: z.id, label: z.title }));
chapters.find((c) => c.id === "villages").links = villages.map((v) => ({
  id: v.pin === "osm" ? `village-${v.id}` : v.id,
  label: v.pin === "osm" ? v.name : `${v.name} (no pin)`,
}));

export const timeline = [
  { year: "2008", text: "Approved as a node of the Delhi–Mumbai Industrial Corridor, in May." },
  { year: "2009", text: "Gujarat passes the Special Investment Region Act." },
  { year: "2010", text: "DSIRDA is established as the regional development authority." },
  { year: "2011", text: "Master planning work starts." },
  { year: "2012", text: "An ICT masterplan is prepared." },
  { year: "2013", text: "Programme managers are appointed." },
  { year: "2014", text: "Environment clearance is received." },
  { year: "2016", text: "DICDL is formed. Implementation starts on TP 2A and 4A, the 22.54 km² Activation Area. DICDL is 51% Government of Gujarat, through DSIRDA, in land, and 49% the Government of India, through NICDIT, in cash." },
  { year: "Now", text: "DSIRDA says trunk infrastructure in the Activation Area has been developed. Later area will be taken up as town-planning schemes are approved. The Activation Area is also described as a Semicon City under the Gujarat Semiconductor Policy of 2022, aimed at semiconductors, their suppliers, and electronics manufacturing." },
];

export const sources = [
  { title: "DSIRDA FAQ", href: "https://dholera.gujarat.gov.in/faqs", note: "Area, Activation Area, ABCD, utilities, connectivity, allotment, seasons, policies." },
  { title: "Planning", href: "https://dholera.gujarat.gov.in/planning", note: "22 villages, 422 km² in TP1–TP6, Phase I of 153 km²." },
  { title: "About the authority", href: "https://dholera.gujarat.gov.in/about_us", note: "DICDL, NICDC, and the town-planning programme." },
  { title: "Land pricing", href: "https://dholera.gujarat.gov.in/land_pricing", note: "Official pricing. Not copied into this model." },
  { title: "Land allotment policy", href: "https://dholera.gujarat.gov.in/web/document/download?model=website.documents&field=file&filename_field=Land_Allotment_Policy.pdf&id=1", note: "PDF linked from the FAQ." },
  { title: "General Development Control Regulations", href: "https://dholera.gujarat.gov.in/web/document/download?model=website.documents&field=file&filename_field=3.-DP-Report-2-GDCR.pdf&id=33", note: "PDF linked from the FAQ. FAR and height live here." },
  { title: "Investor Facilitation Portal", href: "https://ifp.gujarat.gov.in/", note: "Single window for approvals." },
  { title: "Gujarat Semiconductor Policy 2022", href: "https://dst.gujarat.gov.in/Home/GujaratSemiconductorPolicy", note: "Linked from the DSIRDA FAQ." },
  { title: "Gujarat Electronics Policy 2022–28", href: "https://dst.gujarat.gov.in/Home/GujaratElectronicsPolicy", note: "Linked from the DSIRDA FAQ." },
  { title: "Gujarat IT / ITeS Policy 2022–27", href: "https://dst.gujarat.gov.in/Home/gjstateititespolicy", note: "Linked from the DSIRDA FAQ." },
  { title: "Aatmanirbhar Gujarat Scheme for Industries 2022", href: "https://ic.gujarat.gov.in/documents/aatmanirbhar-gujarat/pdf/pdf.pdf", note: "Linked from the DSIRDA FAQ." },
  { title: "OpenStreetMap place nodes", href: "https://www.openstreetmap.org/", note: "Village pins, the solar-park name at Mahadevpura, the airport pin, Kadipur on the expressway, Adhelai, and a Bhimnath node in Botad." },
];

const place = (title, kicker, paragraphs, links = []) => ({ title, kicker, paragraphs, links });

export const places = {
  gulf: place("Gulf of Khambhat", "Water", [
    "The gulf is the eastern edge of this model. The foam line is where the schematic plinth meets the water. It is not a charted shoreline.",
    "The central canal is described as draining storm water to the sea. On the model it runs east through the Activation Area and stops at the plinth.",
  ]),
  sir: place("Special Investment Region", "920 km²", [
    "The plinth is scaled so its plan area is 920 km², the figure DSIRDA publishes. It was grown from the village pins. It is not the notified SIR boundary.",
    "DSIRDA is the planning authority. DICDL, the special-purpose vehicle, builds infrastructure and allots land inside that plan.",
  ]),
  activation: place("Activation Area", "22.54 km² · TP 2A and 4A", [
    "First construction phase. Trunk roads, plants, canal, substations, and the ABCD buildings are the solid parts. Housing, the school, the hospital, the fire station, the food court, the guest house, the hotel, and the Semicon City district are translucent.",
    "The rectangle’s area matches the published 22.54 km². Its corners are not the sanctioned scheme corners.",
  ]),
  "aa-roads": place("Internal roads", "72 km of centreline", [
    "DSIRDA publishes about 72 km of internal roads in the Activation Area, with the storm, water, wastewater, ICT, and gas networks under them.",
    "These centrelines add up to that length. Arterials are drawn wider than collectors. Both are narrower than a full right-of-way. The pattern is designed for the model. It is not the town-planning road drawing.",
  ]),
  "aa-industrial": place("Industrial ground", "Illustrative tint", [
    "The Activation Area is described as land for industry as well as housing and commerce. This tint marks an industrial share of the rectangle.",
    "It is not a plot plan. Allotment is 1 acre to 330 acres in the public note, by the official policy.",
  ]),
  "aa-residential": place("Residential ground", "Illustrative tint", [
    "Residential use is part of the Activation Area. The translucent blocks are the housing DSIRDA says has been initiated. They are not floor plans.",
  ]),
  "aa-commercial": place("Commercial ground", "Illustrative tint", [
    "The ABCD buildings sit on this tint: administration, exhibitions, and the city operations room. Commercial plots beyond those buildings are not drawn as a cadastre.",
  ]),
  bec: place("Business and Exhibition Center", "ABCD", [
    "One of the two ABCD buildings. DSIRDA lists administrative offices, the City Integrated Operations Center, an experience zone, conference rooms, an auditorium, a banquet hall, a restaurant, a bank, and a post office across the ABCD complex.",
    "The massing is a model of that brief. It is not a measured survey of the building.",
  ]),
  spv: place("SPV building", "ABCD", [
    "The second ABCD building, for the special-purpose vehicle. DICDL is that vehicle: 51% state, through DSIRDA, and 49% NICDIT.",
    "The massing is schematic, paired with the exhibition building across a small court.",
  ]),
  canal: place("Central canal", "6.6 km", [
    "A central canal of 6.6 km takes storm water from the Activation Area network to the sea. There is also an open canal front in the public project list.",
    "The channel on the model is 6.6 km of centreline, running east, with a short turn at the end. Roads cross it on gaps in the water. Those bridges are part of the grid, not surveyed structures. Walk mode treats the water as solid.",
  ]),
  wtp: place("Water treatment plant", "50 MLD", [
    "Commissioned at 50 MLD and scalable to 150. DSIRDA places it about 5 km from the Activation Area. Treated water is held in two mass-balancing reservoirs and nine elevated reservoirs.",
    "The siting here is 5 km off the rectangle, on the plinth, chosen so it stays on land. The tanks are schematic.",
  ]),
  stp: place("Sewage treatment plant", "10 MLD", [
    "10 MLD, scalable to 30. The sewer network is under the Activation Area roads. Recycled water from this plant is part of what tenants can use.",
    "The tanks are placed inside the rectangle. The spot is schematic.",
  ]),
  cetp: place("Common effluent treatment plant", "20 MLD", [
    "20 MLD, scalable to 60, for industrial wastewater. Ducts run under the road network. The plant is drawn as a tank farm inside the Activation Area. The spot is schematic.",
  ]),
  esr: place("Elevated reservoirs", "Nine towers", [
    "Nine elevated service reservoirs, with two mass-balancing reservoirs, hold treated water for the Activation Area.",
    "The nine towers stand on the arterial crossings. Their positions are regular because the real yard drawings are not in this model.",
  ]),
  mbr: place("Mass-balancing reservoirs", "Two basins", [
    "Two ground reservoirs near the water plant, pairing with the nine towers inside the Activation Area. The basins are schematic.",
  ]),
  "sub-torrent": place("Torrent Power substation", "400/220 kV", [
    "Torrent Power is the private distribution licensee in the public note. DSIRDA says it has built two substations, including a 400/220 kV gas-insulated, SCADA-enabled yard. Distribution capacity is given as 500 MVA, scalable to 1,500.",
    "The larger yard stands inside the Activation Area. A second, smaller solid yard is the other built substation. Neither is a measured electrical layout.",
  ]),
  "sub-getco": place("GETCO substation", "Being built", [
    "A 220 kV substation by GETCO is described as being developed, so the second source of power is still in progress. It is drawn translucent, unlike the Torrent yards.",
  ]),
  expressway: place("Ahmedabad–Dholera Expressway", "109 km", [
    "A four-lane, access-controlled expressway of about 109 km, implemented by NHAI, separate from NH 751. This model shows the approach across the map, not every kilometre back to Sarkhej.",
    "The line passes through the Kadipur node, where OpenStreetMap names the expressway, and runs toward Adhelai, the published southern end. The bends between those pins are drawn, not surveyed. The stroke is much wider than the carriageway so it can be read from above the whole region.",
  ]),
  nh751: place("NH 751", "Ahmedabad–Bhavnagar", [
    "The existing Ahmedabad–Bhavnagar national highway passes through Dholera Industrial City. It is not the new expressway.",
    "The grey line is a north–south corridor through the Dholera village node. It is not the highway centreline.",
  ]),
  airport: place("Dholera International Airport", "About 20 km", [
    "Dholera International Airport Company Limited is a venture of the Airports Authority of India, the Government of Gujarat, and NICDIT. DSIRDA describes an aviation hub about 20 km from Dholera, linked to the expressway, and still lists Ahmedabad, Vadodara, and Bhavnagar as the nearest existing airports.",
    "The pin is the OpenStreetMap node named Dholera International Airport (under construction). Runway, terminal, cargo shed, and tower are a schematic airfield, not the construction drawings. The distance from the Dholera village node is printed on the pin from this projection.",
  ]),
  "airport-link": place("Airport link", "Schematic spur", [
    "DSIRDA says the airport will meet the expressway by a dedicated access road. This spur is that connection, drawn from the expressway line to the airport pin. It is not the notified link alignment.",
  ]),
  solar: place("Solar park", "300 MW", [
    "Public project updates include a 300 MW solar park. The field is centred on the OpenStreetMap feature named Dholera Solar Park at Mahadevpura.",
    "Rows of panels stand in for the plant. Their spacing and the fence line are not the built layout.",
  ]),
  "passenger-rail": place("Passenger rail", "Planned", [
    "A semi-high-speed passenger line is planned from Ahmedabad along the expressway. It is not the freight line, and it is not described as built.",
    "Future draws it as a wide brown stroke beside the expressway, so the corridor can be read from above. The offset and the bends are schematic, and the stroke is much wider than a railway. Turn Future off and the line leaves the model.",
  ]),
  "future-grain": place("Later phases", "Not plots", [
    "Town-planning schemes 1 to 6 cover 422 km². Only the 22.54 km² Activation Area has a published list of trunk works.",
    "The blocks outside that rectangle are a grain, denser on the Phase I bands and thinner on TP3 to TP6. They are not streets, not flats, and not a drawing you can allot from.",
  ]),
  rail: place("Bhimnath–Dholera freight line", "Western Railway", [
    "Western Railway is implementing a freight line from Bhimnath to Dholera, to reach the Dedicated Freight Corridor near Ahmedabad. A passenger semi-high-speed line is a separate, planned project along the expressway.",
    "The western pin is the OpenStreetMap node named Bhimnath in Botad district. The rail is a straight corridor from that pin to the Activation Area. It is not the surveyed alignment.",
  ]),
  bhimnath: place("Bhimnath", "Botad district", [
    "OpenStreetMap node used as the western end of the freight corridor. Several places in Gujarat carry the name. This one is the node in Botad, west of Dholera.",
  ]),
  adhelai: place("Adhelai", "Expressway end", [
    "Published descriptions put the southern end of the Ahmedabad–Dholera Expressway at Adhelai in Bhavnagar district. The pin is the OpenStreetMap village node. The road beyond the plinth is the approach, not a survey.",
  ]),
  ahmedabad: place("Ahmedabad", "About 100 km", [
    "DSIRDA places Dholera about 100 km south-west of Ahmedabad. The label sits at the edge of the model, not at the real city. A straight-line distance from the Dholera node to a central Ahmedabad coordinate is shown beside the published figure.",
  ]),
  bhavnagar: place("Bhavnagar", "South", [
    "Bhavnagar is the city to the south. The FAQ gives its existing airport as 60 km away, and the expressway’s southern end toward Adhelai. This label is a direction on the model, not the city itself.",
  ]),
  semicon: place("Semicon City", "Planned district", [
    "DSIRDA calls the Activation Area a Semicon City under the Gujarat Semiconductor Policy of 2022, for semiconductors, suppliers, and electronics manufacturing.",
    "The halls are a translucent district so that status stays visible. No company campus is modelled. The policy link is in Sources.",
  ]),
  school: place("School", "Initiated", [
    "DSIRDA says a school up to the 12th standard has been initiated, along with other social buildings. The block is translucent. It has no floor plan.",
  ]),
  hospital: place("Hospital", "Initiated", [
    "A healthcare facility is among the social projects DSIRDA says have been initiated. The block is translucent, and it has no floor plan and no bed count.",
  ]),
  fire: place("Fire station", "Initiated", [
    "A fire station is one of the social projects already started, with the police station reserved in the land-use plan. Only the fire station is given a mass, and it is translucent.",
  ]),
  guesthouse: place("Guest house", "Initiated", [
    "A guest house is on the list of projects started through allotment or public-private arrangements. Translucent mass, no plan.",
  ]),
  hotel: place("Hotel", "Initiated", [
    "A hotel is on the same initiated list as the guest house. It is a translucent mass beside the commercial tint, not a branded design.",
  ]),
  foodcourt: place("Food court", "Initiated", [
    "A food court is named alongside the school, hospital, and housing as work already started. Small translucent mass.",
  ]),
  "residential-blocks": place("Residential blocks", "Initiated", [
    "Housing for the Activation Area is described as initiated. The bars are translucent so they stay distinct from the roads and plants, which are solid.",
    "They are not flats you can count, and they are not plots.",
  ]),
  tp1: place("TP1", "Phase I", [
    "Phase I is TP1 and TP2 together, 153 km². This band is the northern half of that area on the model. The cut is equal, not the notified boundary between TP1 and TP2.",
  ]),
  tp2: place("TP2", "Phase I", [
    "The southern half of the schematic Phase I band. Activation schemes 2A and 4A are the first construction drawings inside the wider town-planning geography. This band does not claim to be scheme 2A.",
  ]),
  tp3: place("TP3", "Later phase", [
    "One of four equal bands cut from the developable area after Phase I’s 153 km². No separate public area for TP3 is printed here.",
  ]),
  tp4: place("TP4", "Later phase", [
    "Scheme 4A is part of the Activation Area, together with 2A. This regional band is not that scheme boundary. It is one equal share of the land outside Phase I.",
  ]),
  tp5: place("TP5", "Later phase", [
    "An equal schematic band in the southern developable area. The real TP5 drawing is a town-planning document, not this stripe.",
  ]),
  tp6: place("TP6", "Later phase", [
    "The southernmost equal band. Bavaliyari, Hebatpur, and other southern pins may fall near it. That is a result of the area cut, not a notification of which village sits in TP6.",
  ]),
};

export const tourStops = [
  { focus: "arrive", chapter: "arrive", say: "Over the gulf, looking inland at the whole region." },
  { focus: "sir", chapter: "region", say: "The plinth is 920 square kilometres, and it is not the notified line." },
  { focus: "village-dholera", chapter: "villages", say: "Twenty-two village names. Pins are map nodes." },
  { focus: "expressway", chapter: "connect", say: "The expressway is the new road. NH 751 is the one already there." },
  { focus: "airport", chapter: "connect", say: "The airport pin is OpenStreetMap. The buildings are a stand-in." },
  { focus: "solar", chapter: "zones", say: "The solar field sits on the Mahadevpura map node." },
  { focus: "tp1", chapter: "plan", say: "Phase I is TP1 and TP2, 153 square kilometres together." },
  { focus: "activation", chapter: "activation", say: "Drop into the 22.54 square kilometre Activation Area." },
  { focus: "canal", chapter: "infrastructure", say: "The canal is 6.6 kilometres, toward the gulf." },
  { focus: "wtp", chapter: "infrastructure", say: "The water plant sits about 5 kilometres off the rectangle." },
  { focus: "sub-torrent", chapter: "infrastructure", say: "Solid yards are the substations described as built." },
  { focus: "bec", chapter: "activation", say: "ABCD. Walk the last stretch from here." },
];

export function entryFor(id) {
  if (places[id]) return { id, ...places[id] };
  if (id.startsWith("village-")) {
    const v = villages.find((item) => item.id === id.slice(8));
    if (!v) return null;
    return {
      id,
      title: v.name,
      kicker: "Village",
      paragraphs: [
        v.note,
        "DSIRDA says the region covers 22 villages. A pin is not a boundary, and a village name alone does not say whether a particular survey number was notified.",
      ],
      links: [{ id: "villages", label: "All villages" }],
    };
  }
  const zone = zones.find((item) => item.id === id);
  if (zone) {
    return {
      id,
      title: zone.title,
      kicker: "Land use · schematic",
      paragraphs: zone.paragraphs,
      links: [{ id: "zones", label: "All uses" }],
    };
  }
  return null;
}

export const futureView = {
  id: "future",
  kicker: "The published programme",
  title: "Dholera as planned",
  paragraphs: [
    "Future finishes the masses DSIRDA describes as started: the school, hospital, fire station, food court, guest house, hotel, housing, the GETCO yard, and the Semicon City halls. It also draws two things named in the plan and not built here: a passenger line beside the expressway, and a grain of blocks over the rest of the 422 km².",
    "The grain is not a master plan. It only says the land outside the Activation Area is meant to become city as later town-planning schemes are approved. Prices, survey numbers, and company campuses stay off this model.",
    "Turn Future off to restore the split you started with. Solid means the trunk works described as built. Translucent means started or still a plan.",
  ],
  rows: [
    { id: "aa-roads", status: "Built", title: "Internal roads", text: "About 72 km in the Activation Area. Water, wastewater, ICT, gas, and storm ducts run under them." },
    { id: "canal", status: "Built", title: "Central canal", text: "6.6 km of storm water toward the sea, plus an open canal front in the project list." },
    { id: "wtp", status: "Built", title: "Water treatment", text: "50 MLD, scalable to 150, about 5 km from the Activation Area." },
    { id: "stp", status: "Built", title: "Sewage plant", text: "10 MLD, scalable to 30. Recycled water is part of the supply." },
    { id: "cetp", status: "Built", title: "Effluent plant", text: "20 MLD, scalable to 60, for industrial wastewater." },
    { id: "esr", status: "Built", title: "Reservoirs", text: "Nine elevated towers and two mass-balancing reservoirs." },
    { id: "sub-torrent", status: "Built", title: "Torrent substations", text: "Two yards, including 400/220 kV GIS with SCADA. 500 MVA, scalable to 1,500." },
    { id: "bec", status: "Built", title: "ABCD", text: "Offices, the City Integrated Operations Center, experience zone, conference, auditorium, banquet, restaurant, bank, and post office across the two buildings." },
    { id: "nh751", status: "Existing", title: "NH 751", text: "Ahmedabad–Bhavnagar highway through the city. Separate from the new expressway." },
    { id: "expressway", status: "Under way", title: "Expressway", text: "About 109 km, four lanes, access-controlled, NHAI. Ahmedabad to Dholera, not the same road as NH 751." },
    { id: "airport", status: "Under way", title: "Airport", text: "DIACL: AAI, Government of Gujarat, and NICDIT. About 20 km from Dholera, with a link to the expressway. The pin is still marked under construction." },
    { id: "rail", status: "Under way", title: "Freight rail", text: "Western Railway, Bhimnath to Dholera, toward the Dedicated Freight Corridor near Ahmedabad." },
    { id: "sub-getco", status: "Under way", title: "GETCO substation", text: "220 kV, described as being developed. The second power source beside Torrent." },
    { id: "school", status: "Started", title: "Social buildings", text: "School to 12th standard, hospital, fire station, food court, guest house, hotel, and housing are initiated. No bed count is printed." },
    { id: "solar", status: "Reported", title: "Solar park", text: "300 MW in public project updates. The field is drawn on the Mahadevpura map node. Its edges are schematic." },
    { id: "passenger-rail", status: "Planned", title: "Passenger rail", text: "Semi-high-speed line planned along the expressway. Shown only while Future is on." },
    { id: "semicon", status: "Planned", title: "Semicon City", text: "The official name for semiconductors, suppliers, and electronics manufacturing under the 2022 policy. No company campus is modelled." },
    { id: "future-grain", status: "Later", title: "TP1–TP6 beyond the Activation Area", text: "422 km² developable. Phase I, TP1 and TP2, is 153 km² together. The rest waits on later town-planning schemes. The grain is not a plot plan." },
    { id: "activation", status: "Note", title: "Earth filling", text: "Plots need about 1.5 to 2 metres of filling, done by the project unless filling is bought as an extra." },
  ],
};

export const layers = [
  { id: "built", label: "Built" },
  { id: "planned", label: "Planned" },
  { id: "zones", label: "Zones" },
  { id: "villages", label: "Villages" },
  { id: "roads", label: "Roads" },
  { id: "utilities", label: "Utilities" },
  { id: "water", label: "Water" },
];
