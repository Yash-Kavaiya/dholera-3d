/** Published figures and labels. Geometry in src/geo/layout.js must use these numbers. */
import { facts, disclaimer, villages, timeline, sources } from "../data/dholera.js";

export { facts, disclaimer, villages, timeline, sources };

export const zones = [
  { id: "zone-industrial", title: "Industrial", paragraphs: ["The Activation Area is described as an industrial zone with large contiguous parcels and plug-in utilities. Across the wider plan, industry is one of the main uses.", "This wash is a schematic extent. It is not the development-plan boundary, and it has no plot prices."] },
  { id: "zone-residential", title: "Residential", paragraphs: ["Residential land is part of the published mix, in the Activation Area and in later town-planning schemes. DSIRDA allots residential plots by auction or tender, not by the model you are looking at.", "The housing blocks inside the Activation Area are drawn solid in this city model; they interpret the initiated housing and are not a floor plan or an allotment map."] },
  { id: "zone-city", title: "City centre", paragraphs: ["A city-centre use sits in the development plan alongside knowledge, logistics, and the high-access corridor. The pale patch marks that use.", "Its place on this model is schematic. The Administrative and Business Centre you can walk to is a real project inside the Activation Area, and it is not the whole city centre."] },
  { id: "zone-knowledge", title: "Knowledge and IT", paragraphs: ["Knowledge and IT is a named use in the development plan. Gujarat’s IT / ITeS policy is one of the state policies DSIRDA points investors to.", "The patch is a catalogue of the use, drawn on the model so you can fly to it. It is not a surveyed campus."] },
  { id: "zone-access", title: "High access corridor", paragraphs: ["The high-access corridor is the planned intense mixed-use band, tied to the main roads. On a real plan it follows the corridor. Here it is a patch near the schematic expressway.", "FAR and height depend on the General Development Control Regulations and the road in front of a plot. This model does not print those numbers."] },
  { id: "zone-logistics", title: "Logistics", paragraphs: ["Logistics land is meant to sit on the freight and highway network: the expressway, the Bhimnath–Dholera freight line, and the highways already named by DSIRDA.", "The patch is schematic. The freight line drawn to the west is a straight corridor, not a surveyed track."] },
  { id: "zone-tourism", title: "Tourism and resorts", paragraphs: ["Tourism is a published use, on the gulf side of a coastal city. The strip is drawn toward the water for that reason.", "It is not a resort map, and the coast in this model is the edge of the schematic plinth, not the notified shoreline."] },
  { id: "zone-sports", title: "Sports and recreation", paragraphs: ["Sports and recreation is a separate use in the development plan, distinct from neighbourhood open space.", "The green patch marks the use. It does not locate a stadium."] },
  { id: "zone-public", title: "Public and social facilities", paragraphs: ["The Activation Area plan reserves land for healthcare, education, a police station, a fire station, and other social uses. DSIRDA says work has started on a hospital, a school, a fire station, a food court, housing, a guest house, and a hotel.", "Those buildings are drawn solid inside the Activation Area. This regional patch is the wider use, and it is schematic."] },
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
      "Solid forms are the city as this model interprets it built out: an illustration, not a survey. Future adds the later town-planning phases. The plinth is sized to the published area. It is not the notified boundary.",
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
      "National and state highways already tie the site to Ahmedabad, Rajkot, Mundra, Kandla, Pipavav, Dahej, Hazira, Bhavnagar, Delhi, and Mumbai. NH 751, the Ahmedabad–Bhavnagar road, passes through the industrial city. A separate access-controlled expressway, about 109 km and four lanes, was built by NHAI between Ahmedabad and Dholera. Press reports date its inauguration to 31 March 2026. The DSIRDA FAQ, last updated in August 2026, still calls it under implementation.",
      "The Dholera International Airport is a company of the Airports Authority of India, the Government of Gujarat, and NICDIT. DSIRDA places it about 20 km from Dholera, with a link to the expressway. An AAI aircraft made a trial landing there on 5 June 2026. It is not yet open to commercial flights. The FAQ still names Bhavnagar (60 km), Ahmedabad (125 km), and Vadodara (145 km) as the nearest existing airports.",
      "A Bhimnath–Dholera freight line is under implementation by Western Railway, toward the Dedicated Freight Corridor near Ahmedabad. The Sarkhej–Dholera semi high-speed passenger line was approved by the Union Cabinet in May 2026, and Western Railway invited bids for it in August 2026. The nearest port in the FAQ is Pipavav at 200 km, then Kandla at 300 km and Mundra at 350 km.",
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
    kicker: "2008 to 2026",
    title: "How it got this far",
    paragraphs: [
      "The sequence to 2016 is the one DSIRDA publishes. The rows after it are dated public records and press reports, listed on the Sources page. Later phases still wait on town-planning approval.",
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
    "First construction phase. Trunk roads, plants, canal, substations and the ABCD buildings are drawn solid, alongside a modelled fabric of housing, civic, commercial and industrial buildings. The city you see is an interpretation, not a survey.",
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
    "Residential use is part of the Activation Area. The solid housing blocks are this model's interpretation of the housing DSIRDA says has been initiated. They are not floor plans.",
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
    "A 220 kV substation by GETCO is described as being developed, so the second source of power is still in progress. It is drawn as a typical solid yard, a control building, transformers and gantries. The Future toggle adds the later-phase grain beyond the Activation Area.",
  ]),
  expressway: place("Ahmedabad–Dholera Expressway", "109 km · Open since March 2026", [
    "A four-lane, access-controlled expressway of about 109 km, built by NHAI, separate from NH 751. Press reports date its inauguration to 31 March 2026. This model shows the approach across the map, not every kilometre back to Sarkhej.",
    "The line passes through the Kadipur node, where OpenStreetMap names the expressway, and runs toward Adhelai, the published southern end. The bends between those pins are drawn, not surveyed. The stroke is much wider than the carriageway so it can be read from above the whole region.",
  ]),
  nh751: place("NH 751", "Ahmedabad–Bhavnagar", [
    "The existing Ahmedabad–Bhavnagar national highway passes through Dholera Industrial City. It is not the new expressway.",
    "The grey line is a north–south corridor through the Dholera village node. It is not the highway centreline.",
  ]),
  airport: place("Dholera International Airport", "About 20 km · Trial landing June 2026", [
    "Dholera International Airport Company Limited is a venture of the Airports Authority of India, the Government of Gujarat, and NICDIT. DSIRDA describes an aviation hub about 20 km from Dholera, linked to the expressway, and still lists Ahmedabad, Vadodara, and Bhavnagar as the nearest existing airports.",
    "An AAI aircraft made a trial landing on 5 June 2026. No commercial opening date has been published.",
    "The pin is the OpenStreetMap node named Dholera International Airport (under construction). Runway, terminal, cargo shed, and tower are a schematic airfield, not the construction drawings. The distance from the Dholera village node is printed on the pin from this projection.",
  ]),
  "airport-link": place("Airport link", "Schematic spur", [
    "DSIRDA says the airport will meet the expressway by a dedicated access road. This spur is that connection, drawn from the expressway line to the airport pin. It is not the notified link alignment.",
  ]),
  solar: place("Solar park", "300 MW running", [
    "Tata Power commissioned a 300 MW plant with single-axis trackers at Dholera in April 2022. Reference articles describe a much larger park planned, 4,400 MW, with 1,000 MW in its first phase. The field is centred on the OpenStreetMap feature named Dholera Solar Park at Mahadevpura.",
    "Rows of panels stand in for the plant. Their spacing and the fence line are not the built layout.",
  ]),
  "passenger-rail": place("Sarkhej–Dholera semi high-speed rail", "Approved May 2026", [
    "The Union Cabinet approved a semi high-speed passenger line from Sarkhej, Ahmedabad, to Dholera in May 2026, about 134 km at about ₹20,667 crore in press reports. Western Railway invited EPC bids in August 2026. It is not the freight line, and nothing is built yet.",
    "Future draws it as a wide brown stroke beside the expressway, so the corridor can be read from above. The offset and the bends are schematic, and the stroke is much wider than a railway. Turn Future off and the line leaves the model.",
  ]),
  "future-grain": place("Later phases", "Not plots", [
    "Town-planning schemes 1 to 6 cover 422 km². Only the 22.54 km² Activation Area has a published list of trunk works.",
    "The buildings outside that rectangle are a grain of typologies: glass towers on podiums, residential slabs, low campuses, sawtooth industrial sheds and warehouses on the Phase I bands, and sheds, warehouses and house clusters, more thinly, on TP3 to TP6. The mix is illustrative. They are not streets, not flats, and not a drawing you can allot from.",
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
  semicon: place("Semicon City", "Tata–PSMC fab under construction", [
    "DSIRDA calls the Activation Area a Semicon City under the Gujarat Semiconductor Policy of 2022, for semiconductors, suppliers, and electronics manufacturing.",
    "Tata Electronics, with Taiwan’s PSMC, is building India’s first commercial chip fab here, with a proposed investment of ₹91,000 crore. The Commerce Ministry notified a 66.166 ha SEZ for it in April 2026, on plots in TP Scheme 2A.",
    "The campus is a generic fab layout: a windowless cleanroom with air handlers and exhaust stacks on the roof, a utility building with cooling towers, offices on a bridge, and gas and water tanks. It is drawn as a solid campus. It is not the fab’s footprint or its design.",
  ]),
  school: place("School", "Initiated", [
    "DSIRDA says a school up to the 12th standard has been initiated, along with other social buildings. It is drawn as a typical school: a three-floor teaching block and two wings around a courtyard. The shape is generic and has no floor plan.",
  ]),
  hospital: place("Hospital", "Initiated", [
    "A healthcare facility is among the social projects DSIRDA says have been initiated. It is drawn as a typical hospital: a diagnostic podium, twin ward blocks and a rooftop helipad. The shape is generic, with no floor plan and no bed count.",
  ]),
  fire: place("Fire station", "Initiated", [
    "A fire station is one of the social projects already started, with the police station reserved in the land-use plan. Only the fire station is drawn: an apparatus hall with three bays, a forecourt, and a hose tower. The shape is generic.",
  ]),
  guesthouse: place("Guest house", "Initiated", [
    "A guest house is on the list of projects started through allotment or public-private arrangements. Drawn as two staggered wings under hipped roofs. Generic shape, no plan.",
  ]),
  hotel: place("Hotel", "Initiated", [
    "A hotel is on the same initiated list as the guest house. It is drawn as a podium with a rooftop pool and a finned tower, beside the commercial tint. Generic shape, not a branded design.",
  ]),
  foodcourt: place("Food court", "Initiated", [
    "A food court is named alongside the school, hospital, and housing as work already started. Drawn as a glass pavilion under a floating roof. Generic shape.",
  ]),
  "residential-blocks": place("Residential blocks", "Initiated", [
    "Housing for the Activation Area is described as initiated. Each bar is drawn solid as a retail plinth with three stepped towers, balconies and roof terraces. The massing is an interpretation, not a floor plan.",
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
  { focus: "expressway", chapter: "connect", say: "The expressway opened in March 2026. NH 751 is the older road." },
  { focus: "airport", chapter: "connect", say: "The airport had its first trial landing in June 2026." },
  { focus: "solar", chapter: "zones", say: "Tata Power’s 300 MW solar plant, on the Mahadevpura map node." },
  { focus: "tp1", chapter: "plan", say: "Phase I is TP1 and TP2, 153 square kilometres together." },
  { focus: "activation", chapter: "activation", say: "Drop into the 22.54 square kilometre Activation Area." },
  { focus: "canal", chapter: "infrastructure", say: "The canal is 6.6 kilometres, toward the gulf." },
  { focus: "wtp", chapter: "infrastructure", say: "The water plant sits about 5 kilometres off the rectangle." },
  { focus: "sub-torrent", chapter: "infrastructure", say: "Solid yards are the substations described as built." },
  { focus: "semicon", chapter: "activation", say: "Semicon City. The Tata–PSMC fab SEZ was notified in April 2026." },
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
    "Future adds the later phases: a passenger line beside the expressway, and a grain of building types over the rest of the 422 km² — towers, housing slabs, campuses, sheds and warehouses. It reads the land still to be planned, not the built Activation Area.",
    "The grain is not a master plan. It only says the land outside the Activation Area is meant to become city as later town-planning schemes are approved. Prices, survey numbers and company campuses stay off this model.",
    "Turn Future off to return to the built-out city. Every solid building in the model is an interpretation of the published programme, not a surveyed design.",
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
    { id: "expressway", status: "Open", title: "Expressway", text: "About 109 km, four lanes, access-controlled, NHAI. Inaugurated 31 March 2026 in press reports. Not the same road as NH 751." },
    { id: "airport", status: "Under way", title: "Airport", text: "DIACL: AAI, Government of Gujarat, and NICDIT. About 20 km from Dholera, with a link to the expressway. AAI trial landing on 5 June 2026. No commercial opening date published." },
    { id: "rail", status: "Under way", title: "Freight rail", text: "Western Railway, Bhimnath to Dholera, toward the Dedicated Freight Corridor near Ahmedabad." },
    { id: "sub-getco", status: "Under way", title: "GETCO substation", text: "220 kV, described as being developed. The second power source beside Torrent." },
    { id: "school", status: "Started", title: "Social buildings", text: "School to 12th standard, hospital, fire station, food court, guest house, hotel, and housing are initiated. No bed count is printed." },
    { id: "solar", status: "Running", title: "Solar park", text: "Tata Power 300 MW, commissioned April 2022. A 4,400 MW park is planned in reference sources. The field is drawn on the Mahadevpura map node." },
    { id: "passenger-rail", status: "Approved", title: "Semi high-speed rail", text: "Sarkhej–Dholera, approved by the Cabinet in May 2026, EPC bids invited in August 2026. Shown only while Future is on." },
    { id: "semicon", status: "Under way", title: "Semicon City", text: "Tata–PSMC fab, ₹91,000 crore proposed. A 66.166 ha SEZ was notified in April 2026. The halls are not the fab’s design." },
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
