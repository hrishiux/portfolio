/* Lambda & E20 — every number on the site, with where it came from.
   One file, loaded as a plain script so the page also works when opened from disk.
   kind: "measured"   = a lab, dyno or test-bottle reading reported by the source
         "published"  = a reference value printed by the source
         "statement"  = an official or industry claim, not a measurement
         "oem"        = the manufacturer's own technical document
         "calculated" = arithmetic on sourced numbers; the formula is in `method`
         "digitised"  = read off a published chart image, pixel by pixel
   Accessed: 7 October 2026. */

window.AFR = {
  accessed: "2026-10-07",

  sources: [
    { id: "hpt", short: "HP Tuners", title: "Air-Fuel Ratios, Lambda, and Stoichiometry Explained", publisher: "HP Tuners", date: "2024-06-15", kind: "published", url: "https://www.hptuners.com/?p=1181002", used: "Stoichiometric AFR of petrol (14.7), E10 (14.1), E85 (9.7), E98 (9.0); widebands report on a petrol scale" },
    { id: "hpa", short: "HP Academy", title: "Air Fuel Ratio: Choosing the Correct AFR (EFI Tuning Fundamentals)", publisher: "High Performance Academy", date: "n.d.", kind: "published", url: "https://www.hpacademy.com/courses/efi-tuning-fundamentals/air-fuel-ratio-choosing-the-correct-afr/", used: "Reference lambda targets: idle and cruise 1.00, best economy about 1.05, NA full throttle 0.85–0.92, turbo full throttle 0.82–0.85" },
    { id: "wiki-eth", short: "Wikipedia: Ethanol", title: "Ethanol (infobox)", publisher: "Wikipedia", date: "n.d.", kind: "published", url: "https://en.wikipedia.org/wiki/Ethanol", used: "Density of ethanol, 0.78945 g/cm³ at 20 °C" },
    { id: "ornl", short: "US DOE (ORNL/NREL) 2009", title: "Effects of Intermediate Ethanol Blends on Legacy Vehicles and Small Non-Road Engines, Report 1 – Updated (NREL/TP-540-43543, ORNL/TM-2008/117)", publisher: "US Department of Energy · Knoll, West, Clark, Graves, Orban, Przesmitzki, Theiss", date: "2009-02", kind: "measured", url: "https://docs.nlr.gov/docs/fy09osti/43543.pdf", used: "Measured fuel properties of 12 test fuels (Table 2.2); 16-vehicle full-throttle results; catalyst temperatures; fuel economy −7.7% on E20" },
    { id: "ssp384", short: "Audi SSP 384", title: "Self-Study Programme 384: Audi chain-driven 1.8 litre 4V TFSI engine (EA888)", publisher: "Audi Service Training", date: "2007", kind: "oem", url: "https://www.audiclub.fi/audifinns/filedata/fetch?id=1980335", used: "Mixture set to λ 1 in all operating ranges except directly after starting; operating modes; EU4 lambda sensor layout; MED 17.5" },
    { id: "audi2011", short: "Audi Technology Portal", title: "1.8 TFSI (status 2011)", publisher: "AUDI AG", date: "2011", kind: "oem", url: "https://www.audi-technology-portal.de/en/drivetrain/engine-efficiency-technologies/1.8-tfsi_en", used: "Third-generation 1.8 TFSI: water-cooled exhaust manifold removes the need for a richer mixture at full load" },
    { id: "mr", short: "MotorReviewer", title: "1.8 TSI EA888 engine: specs and generations", publisher: "MotorReviewer", date: "n.d.", kind: "published", url: "https://www.motorreviewer.com/engine.php?engine_id=118", used: "EA888 1.8: CDAA as second generation, 160 hp at 4,500–6,200 rpm; bore 82.5 mm, stroke 84.1 mm, compression 9.6:1, K03 turbo" },
    { id: "wiki-g", short: "Wikipedia: Suzuki G engine", title: "Suzuki G engine", publisher: "Wikipedia", date: "n.d.", kind: "published", url: "https://en.wikipedia.org/wiki/Suzuki_G_engine", used: "G16B: 1,590 cc, 75.0 × 90.0 mm, SOHC 16-valve, MPFI, compression 9.5:1, 94–97 PS at 5,600 rpm, 132–140 N·m at 4,000 rpm; used in the 1995–2007 Baleno/Esteem" },
    { id: "rd", short: "Race Dynamics, 2015", title: "Race Dynamics dyno database of Stock cars (post #9, Maruti Suzuki Baleno)", publisher: "Race Dynamics, Bengaluru, on Team-BHP", date: "2015-09-09", kind: "measured", url: "https://www.team-bhp.com/forum/modifications-accessories/168016-race-dynamics-dyno-database-stock-cars.html", used: "Stock Baleno (SY416, G16B) on an inertial chassis dyno, SAE corrected: 71.24 whp, 106.79 N·m at the wheels; curve digitised from the posted chart" },
    { id: "wiki-cbr", short: "Wikipedia: Honda CBR250R", title: "Honda CBR250R, CBR300R, and CB300F", publisher: "Wikipedia", date: "n.d.", kind: "published", url: "https://en.wikipedia.org/wiki/Honda_CBR250R,_CBR300R,_and_CB300F", used: "MC41 engine: 249.5 cc single, DOHC, liquid-cooled, 76.0 × 55.0 mm, compression 10.7:1; 26.7 hp (19.9 kW) at 8,500 rpm claimed" },
    { id: "mcom", short: "Motorcycle.com, 2011", title: "2011 Honda CBR250R Tech Review", publisher: "Motorcycle.com", date: "2011", kind: "published", url: "https://www.motorcycle.com/manufacturer/honda/2011-honda-cbr250r-tech-review-90209.html", used: "PGM-FI with a 38 mm Keihin throttle body; O2 sensor, air-injection (AI) system and a catalyser in the exhaust" },
    { id: "mp", short: "Motor Plus, 2012", title: "Test ECU Vortex di Honda CBR 250R, Naikan Power!", publisher: "Otomotifnet / Motor Plus (Indonesia), editor Billy", date: "2012-05-14", kind: "measured", url: "https://otomotifnet.gridoto.com/read/231043477/test-ecu-vortex-di-honda-cbr-250r-naikan-power", used: "2011 CBR250R, stock engine and exhaust, Dynojet 250i: stock ECU about 14:1 AFR, 23.94 hp, 14.98 lb·ft, limiter 10,500 rpm; Vortex ECU about 12:1, 24.47 hp, 15.53 lb·ft, 12,300 rpm" },
    { id: "pib22", short: "PIB factsheet, 2022", title: "Encouraging Ethanol Blending (Budget Series #9)", publisher: "Press Information Bureau · Ministry of Petroleum & Natural Gas", date: "2022-02-27", kind: "statement", url: "https://static.pib.gov.in/WriteReadData/specificdocs/documents/2022/feb/doc202222720201.pdf", used: "EBP launched January 2003 with E5 in nine states and four UTs; extended to 20 states and four UTs in 2006" },
    { id: "mopng", short: "MoPNG EBP page", title: "Ethanol Blended Petrol (EBP) Programme", publisher: "Ministry of Petroleum & Natural Gas", date: "updated 2026-09-29", kind: "statement", url: "https://mopng.gov.in/en/refining/ethanol-blended-petrol", used: "Average blend of 5.00% in ESY 2018-19; programme extended to all of India except two island UTs from 1 April 2019" },
    { id: "ls24", short: "Lok Sabha reply, 2024", title: "Suresh Gopi provides update on the ethanol blended petroleum programme to the Lok Sabha", publisher: "Renewable Watch", date: "2024-08-13", kind: "statement", url: "https://renewablewatch.in/2024/08/13/suresh-gopi-provides-update-on-the-ethanol-blended-petroleum-programme-to-the-lok-sabha/", used: "1.53% in ESY 2013-14; 8.17% in 2020-21; 12.06% in 2022-23; 10% reached in June 2022, five months early" },
    { id: "rs25", short: "Rajya Sabha data, 2025", title: "Year wise Ethanol Quantity Blended and Blending Percentage in India (Rajya Sabha Unstarred Q. 2848, 18 Aug 2025)", publisher: "Dataful · Ministry of Petroleum & Natural Gas", date: "2025-08-18", kind: "statement", url: "https://dataful.in/datasets/21604/", used: "Blend %: 2020-21 8.5, 2021-22 10, 2022-23 12, 2023-24 14.6, 2024-25 19.93 (as on 31 Jul 2025)" },
    { id: "pib23", short: "PIB, Dec 2023", title: "Road map for mixing ethanol in petrol and diesel", publisher: "Press Information Bureau · Ministry of Petroleum & Natural Gas", date: "2023-12-04", kind: "statement", url: "https://pib.gov.in/PressReleasePage.aspx?PRID=1982356", used: "20% target advanced from 2030 to ESY 2025-26; 10% in ESY 2021-22 and 12% in ESY 2022-23" },
    { id: "pib26", short: "PIB Q&A, Jul 2026", title: "Ethanol Blended Petrol Programme: From E5 to E20 and Beyond (PIB, 10 Jul 2026), as summarised by LegacyIAS", publisher: "LegacyIAS summary of a Ministry of Petroleum & Natural Gas release", date: "2026-07-10", kind: "statement", url: "https://www.legacyias.com/pib-summaries-11-july-2026/", used: "20% reached in ESY 2025-26; from April 2026 all petrol is E20 with RON 95 minimum; mileage drop of 3–5% possible" },
    { id: "harm", short: "Harmonixx Tuning, 2025", title: "The truth about ethanol blended fuel: A study by Harmonixx Tuning", publisher: "Team-BHP News (R Patil)", date: "2025-08-14", kind: "measured", url: "https://www.team-bhp.com/news/truth-about-ethanol-blended-fuel-study-harmonixx-tuning", used: "Ethanol test-bottle readings of Indian pump fuels, late 2020 to Aug 2025; claimed mileage drop of 3–4% on E10 and up to 6–8% on E20" },
    { id: "niti", short: "NITI Aayog roadmap, 2021", title: "NITI Aayog's 2021 roadmap had flagged mileage, compatibility issues with E20", publisher: "Business Today (Chetan Bhutani), quoting the 2021 roadmap", date: "2026-07-07", kind: "statement", url: "https://www.businesstoday.in/amp/auto/story/niti-aayogs-2021-roadmap-had-flagged-mileage-compatibility-issues-with-e20-541333-2026-07-07", used: "E20 economy drop: about 6–7% for existing cars calibrated for E10, 3–4% for two-wheelers, 1–2% for vehicles designed and calibrated for E20" },
    { id: "mopng25", short: "Petroleum Ministry, Aug 2025", title: "E20 petrol does not cause drastic drop in fuel efficiency: Petroleum Ministry", publisher: "The Tribune", date: "2025-08-05", kind: "statement", url: "https://www.tribuneindia.com/news/business/e20-petrol-does-not-cause-drastic-drop-in-fuel-efficiency-even-improves-engine-performance-petroleum-ministry", used: "Mileage drop 1–2% for vehicles designed for E10 and calibrated for E20, about 3–6% for others; RON 108.5 for ethanol and 84.4 for petrol" },
    { id: "arai", short: "ARAI, Jul 2026", title: "Vehicles on E20 fuel show 2–6% drop in fuel consumption in controlled tests: ARAI Director", publisher: "The Tribune", date: "2026-07-04", kind: "measured", url: "https://www.tribuneindia.com/news/business/vehicles-on-e20-fuel-show-2-6-drop-in-fuel-consumption-in-controlled-tests-arai-director/", used: "2–6% drop on E20 against E10 in controlled chassis-dyno tests of 3- to 10-year-old vehicles" },
    { id: "rs246", short: "RS246 forum, 2005", title: "Wideband lambda values with vag-com", publisher: "RS246.com (DuncS3; replies by MRC Tuning)", date: "2005-03-15", kind: "measured", url: "https://forum.rs246.com/viewtopic.php?p=71495", used: "Audi S3 (8L) 1.8T 20-valve, ECU 8N0 906 018 BH, VCDS block 031 wideband lambda, 4th-gear full-throttle pulls on its stock map and its chipped map; MRC Tuning: stock EGT limit 920 °C, the ECU enriches above it" },
    { id: "sc18t", short: "SEATCupra.net, 2013", title: "Does this log look ok?", publisher: "SEATCupra.net (vagman2001; replies by leon cupra r, 8bit)", date: "2013-05-30", kind: "measured", url: "https://www.seatcupra.net/forums/threads/does-this-log-look-ok.381728/page-2", used: "Remapped SEAT Leon Cupra R 1.8T 20-valve (ECU 1ML 906 032 A): VCDS lambda specified and actual, modelled exhaust temperature and enrichment factor, two 4th-gear pulls; stock fuelling described as λ 0.953 until EGT passes 920 °C" },
    { id: "sc18t-floor", short: "SEATCupra.net, 2010", title: "First time with vag-com logging...", publisher: "SEATCupra.net", date: "2010-08-01", kind: "statement", url: "https://www.seatcupra.net/forums/threads/first-time-with-vag-com-logging.278090/", used: "On this ECU family the lambda channel reads no richer than 0.75" },
    { id: "sc16", short: "SEATCupra.net, 2012", title: "Running Rich? VCDS Log", publisher: "SEATCupra.net (owner's log; reply by 8bit)", date: "2012-05-30", kind: "measured", url: "https://www.seatcupra.net/forums/threads/running-rich-vcds-log.354233/", used: "Stock SEAT Leon Mk1 1.6 non-turbo (MAP sensor): a full drive logged in VCDS blocks 031, 001 and 002, including two full-throttle pulls; MOT lambda 1.03 before and 1.009 after a throttle-body clean" },
    { id: "tbhp-unichip", short: "Team-BHP, 2010", title: "How does unichip increase performance? (posts #24 and #45 by sapl, a Coimbatore tuning shop)", publisher: "Team-BHP", date: "2010-11-09", kind: "measured", url: "https://www.team-bhp.com/forum/modifications-accessories/51471-how-does-unichip-increase-performance-2.html", used: "Oscilloscope capture of the narrowband oxygen sensor on a Swift with a Suzuki G13B, about 1 Hz switching in closed loop" },
    { id: "audizine", short: "Audizine, 2017", title: "What’s your Target AFR/lambda?", publisher: "Audizine (unmarkedA4, Perry01)", date: "2017-12-18", kind: "measured", url: "https://www.audizine.com/threads/whats-your-target-afr-lambda.794143/", used: "Audi A4 B8 2.0T, EA888 Gen 2: a 2009 car with a larger K04 turbo on stock fuelling logs λ 0.8204 (12.05 AFR) at full load; a B8.5 on a Stage 2 custom file logs AFR 13.4 tapering to 11.7 at 6,000 rpm" },
    { id: "owner", short: "Owner’s note, 2026", title: "My own Suzuki SY416: I replaced its oxygen sensor myself", publisher: "Hrishikesh Nanda", date: "2026-10-08", kind: "owner", url: "", used: "The SY416’s oxygen sensor is a narrowband type with two or three wires" },
    { id: "owner-scan", short: "Owner's VCDS scans, 2026", title: "Fault scans of my Octavia (Skoda Laura 1.8 TSI) with VCDS", publisher: "Hrishikesh Nanda", date: "2026-06-13 and 2026-07-08", kind: "owner", url: "", used: "Engine computer reports 1.8l R4/4V TFSI, engine code CDA, part number 3T0 907 115 G (06J 907 115 family). Neither scan, at 69,390 and 69,620 km, holds a lean, rich or fuel-trim fault code; the car ran E20 and E0 in that period" },
    { id: "arai-bt", short: "ARAI durability, Jul 2026", title: "E20 mileage drop: ARAI finds up to 6% loss in fuel efficiency, rules out engine breakdowns", publisher: "Business Today", date: "2026-07-04", kind: "measured", url: "https://www.businesstoday.in/india/story/e20-fuel-efficiency-arai-finds-up-to-6-mileage-loss-rules-out-engine-breakdowns-541001-2026-07-04", used: "Durability runs of 40,000 km (cars) and 20,000 km (two-wheelers); some older rubber hoses, seals and gaskets may degrade faster; metal and plastic parts compatible" },
    { id: "aet-stock", short: "AET Motorsport log, 2023 (stock)", title: "stock.CSV: VCDS log of an EA888 Gen 3 2.0 TFSI, ECU 5G0 906 259 E (Simos 18)", publisher: "AET Motorsport, public log on Datazap", date: "2023-06-09", kind: "measured", url: "https://datazap.me/u/aet-motorsport/logs/i37j3hg02oannjsexel6ekiv", used: "Full-throttle pull from 1,813 to 6,467 rpm, logged at 10:54 with VCDS 23.3: lambda probes actual (bank 1), charge pressure specified and actual, intake air temperature, throttle position" },
    { id: "aet-stg1", short: "AET Motorsport log, 2023 (Stage 1)", title: "STG1.CSV: VCDS log, same ECU part number and software version, 30 minutes later", publisher: "AET Motorsport, public log on Datazap", date: "2023-06-09", kind: "measured", url: "https://datazap.me/u/aet-motorsport/logs/yq70z5wwylll5xjj36y4g03k", used: "Full-throttle pull on a Stage 1 file from 1,762 to 6,444 rpm, logged at 11:24, same channels" },
    { id: "aet-18", short: "AET Motorsport log, 2023 (1.8 Stage 1)", title: "STG1.CSV: VCDS log of an EA888 Gen 3 1.8 TFSI, ECU 6C0 906 264", publisher: "AET Motorsport, public log on Datazap", date: "2023-07-06", kind: "measured", url: "https://datazap.me/u/aet-motorsport/logs/wc44uh3r1w7hh6asvsiya2jv", used: "Full-throttle pull on a Stage 1 file from 1,806 to 6,438 rpm: lambda 0.80–0.85 above 2,500 rpm, charge pressure up to 2.67 bar absolute" },
    { id: "ecutek", short: "EcuTek knowledge base", title: "VW AG EA888 Engine Tuning (Mk7)", publisher: "EcuTek (Brandyn Mowat)", date: "n.d., updated 13 March", kind: "statement", url: "https://ecutek.atlassian.net/wiki/spaces/SUPPORT/pages/21430325/VAG+EA888+Engine+Tuning", used: "“On the EA888 Gen 3 engine, a lambda set point of 1 is targeted for the entire operating range”, for engines run at factory load limits; high intake or catalyst temperatures and turbo protection can move the set point; factory maximum catalyst temperature 950 °C" },
    { id: "ornl11", short: "US DOE (ORNL) 2012", title: "Intermediate Ethanol Blends Catalyst Durability Program (ORNL/TM-2011/234)", publisher: "Oak Ridge National Laboratory · West, Sluder, Knoll, Orban, Feng", date: "2012-02", kind: "measured", url: "https://info.ornl.gov/sites/publications/files/Pub31271.pdf", used: "2009 Honda Civic 1.8: full-throttle test lambda on E0 and E20 from a wideband sensor ahead of the first catalyst (Fig. 3.3, read from the PDF's vector paths); enrichment averaged about 0.82 on E0 and 0.87 on E20; the Civic and the 2009 Corolla 1.8 do not apply learned fuel trim at full throttle, nor did 19 of the 27 models tested (Table 3.1)" },
    { id: "wiki-r", short: "Wikipedia: Honda R engine", title: "Honda R engine", publisher: "Wikipedia", date: "n.d.", kind: "published", url: "https://en.wikipedia.org/wiki/Honda_R_engine", used: "R18A1 (2006–2011 Civic): 1,799 cc, 81 × 87.3 mm, SOHC 16-valve i-VTEC, PGM-FI, compression 10.5 : 1; an Indian variant rated 132 PS" },
    { id: "nasa", short: "NASA Speed News, 2013", title: "Leaning the Mixture: installing an adjustable fuel pressure regulator and an air-fuel ratio gauge in a Spec Miata", publisher: "NASA Speed News (Brett Becker)", date: "2013-06-01", kind: "statement", url: "https://nasaspeed.news/tech/engine/leaning-the-mixture-installing-an-adjustable-fuel-pressure-regulator-and-an-air-fuel-ratio-gauge-in-a-spec-miata/", used: "Stock Mazda MX-5 1.6 and 1.8: fuel is added from about 4,200 rpm, and by 6,000 rpm the air-fuel ratio is down to 11 : 1" }
  ],

  /* ---------- 1. Stoichiometry ---------- */
  stoich: {
    petrol: 14.7, ethanol: 9.0,            // hpt
    rhoPetrol: 0.746, rhoEthanol: 0.789,   // ornl Table 2.2 (E0 specific gravity); wiki-eth
    method: "Mass-weighted blend: AFR = w·9.0 + (1 − w)·14.7, where w is the ethanol mass fraction, w = 0.789·v / (0.789·v + 0.746·(1 − v)) for ethanol volume fraction v. Run at v = 0.10 this gives 14.10, matching the published E10 value of 14.1.",
    published: [
      { label: "Petrol (E0)", ethanol: 0, afr: 14.7, src: "hpt" },
      { label: "E10", ethanol: 10, afr: 14.1, src: "hpt" },
      { label: "E85", ethanol: 85, afr: 9.7, src: "hpt" },
      { label: "E98", ethanol: 98, afr: 9.0, src: "hpt" }
    ]
  },

  fuels: [
    { id: "E0",  ethanol: 0,  name: "E0 · petrol" },
    { id: "E10", ethanol: 10, name: "E10" },
    { id: "E20", ethanol: 20, name: "E20 · India from April 2026" },
    { id: "E85", ethanol: 85, name: "E85" }
  ],

  /* ---------- 2. Reference targets (HP Academy) ---------- */
  targets: [
    { id: "turbo", label: "Turbo, full throttle", lo: 0.82, hi: 0.85, src: "hpa" },
    { id: "na",    label: "Non-turbo, full throttle", lo: 0.85, hi: 0.92, src: "hpa" },
    { id: "cruise", label: "Idle and cruise", lo: 1.00, hi: 1.00, src: "hpa" },
    { id: "eco",   label: "Best economy", lo: 1.05, hi: 1.05, approx: true, src: "hpa" }
  ],

  /* ---------- 3. The three vehicles ---------- */
  vehicles: [
    {
      id: "octavia", slot: 1, shape: "circle",
      name: "Octavia Mk2 1.8 TSI",
      aka: "Sold in India as the Skoda Laura 1.8 TSI",
      type: "Turbo · direct injection",
      specs: [
        ["Engine", "EA888 Gen 2, 1.8 TSI (CDAA in the 160 PS cars)", "mr"],
        ["Bore × stroke", "82.5 × 84.1 mm", "mr"],
        ["Compression", "9.6 : 1", "mr"],
        ["Air", "BorgWarner K03 turbocharger", "mr"],
        ["Fuel", "Direct injection, homogeneous charge", "ssp384"],
        ["Engine computer", "Bosch MED 17.5", "ssp384"],
        ["On my car", "Engine code CDA, ECU 3T0 907 115 G (read with VCDS)", "owner-scan"],
        ["Claimed output", "160 hp at 4,500–6,200 rpm", "mr"]
      ]
    },
    {
      id: "sy416", slot: 2, shape: "square",
      name: "Suzuki SY416",
      aka: "Sold in India as the Maruti Suzuki Baleno",
      type: "Non-turbo · port injection",
      specs: [
        ["Engine", "Suzuki G16B, 1,590 cc", "wiki-g"],
        ["Bore × stroke", "75.0 × 90.0 mm", "wiki-g"],
        ["Compression", "9.5 : 1", "wiki-g"],
        ["Valvetrain", "SOHC, 16 valves", "wiki-g"],
        ["Fuel", "Multi-point injection (MPFI)", "wiki-g"],
        ["Oxygen sensor", "Narrowband, two or three wires (I replaced it)", "owner"],
        ["Claimed output", "94 bhp, 130 N·m (as quoted by Race Dynamics)", "rd"]
      ]
    },
    {
      id: "cbr", slot: 3, shape: "triangle",
      name: "Honda CBR250R (2011)",
      aka: "Model code MC41",
      type: "Single cylinder · fuel injection",
      specs: [
        ["Engine", "249.5 cc single, DOHC, liquid-cooled", "wiki-cbr"],
        ["Bore × stroke", "76.0 × 55.0 mm", "wiki-cbr"],
        ["Compression", "10.7 : 1", "wiki-cbr"],
        ["Fuel", "PGM-FI, 38 mm Keihin throttle body", "mcom"],
        ["Exhaust", "O2 sensor, air injection, catalyser", "mcom"],
        ["Claimed output", "26.7 hp at 8,500 rpm", "wiki-cbr"]
      ]
    }
  ],

  /* What is publicly documented about each engine's mixture, by operating region */
  regions: ["After a start", "Idle and cruise", "Full throttle", "Logged or on a dyno"],
  evidence: {
    octavia: [
      { kind: "oem", text: "Slightly richer than λ 1 directly after starting, then a few seconds of split injection (HOSP)", src: "ssp384" },
      { kind: "oem", text: "λ 1", src: "ssp384" },
      { kind: "relative", text: "Manual: λ 1 in all ranges. A stock third-generation 2.0 logs λ 0.98–1.02 to 4,300 rpm and 0.92–0.96 above 5,000; a Gen 2 2.0 logs 0.82 on its stock fuel map (with a bigger turbo)", src: "ssp384 aet-stock audizine" },
      { kind: "relative", text: "No full EA888 Gen 2 log found. A stock and a Stage 1 pull of a third-generation 2.0, two Gen 2 2.0T owners' readings, and three 1.8T 20-valve logs. My own fault scans: no lean, rich or fuel-trim codes while running E20", src: "aet-stock aet-stg1 audizine rs246 sc18t owner-scan" }
    ],
    sy416: [
      { kind: "relative", text: "A stock VW 1.6 non-turbo asked for λ 0.85 at restart, rising to 1.00 within about 20 seconds", src: "sc16" },
      { kind: "relative", text: "My SY416 has a narrowband sensor. A G13B's narrowband sensor flips rich and lean about once a second; the VW 1.6 holds λ 1", src: "owner tbhp-unichip sc16" },
      { kind: "relative", text: "No G16B data. A Honda 1.8 non-turbo averaged λ 0.82 under full-throttle enrichment in a US lab; the VW 1.6 non-turbo asked for 0.90 to 5,200 rpm and 0.75–0.76 above 5,500", src: "ornl11 sc16" },
      { kind: "measured", text: "Power and torque on a chassis dyno, no air–fuel channel", src: "rd" }
    ],
    cbr: [
      { kind: "gap", text: "Nothing public found" },
      { kind: "gap", text: "Nothing public found" },
      { kind: "measured", text: "About 14 : 1 on a Dynojet 250i, λ ≈ 0.95", src: "mp" },
      { kind: "measured", text: "Stock vs aftermarket ECU, mixture stated as an average", src: "mp" }
    ]
  },

  /* Full-throttle lambda points. AFR readings from a wideband are on the petrol scale, so λ = AFR / 14.7 */
  fullThrottle: [
    { vehicle: "octavia", label: "Octavia Mk2 1.8 TSI", note: "Audi's manual: λ 1 in all operating ranges", lambda: 1.00, kind: "oem", src: "ssp384" },
    { vehicle: "octavia", label: "1.8T 20V, stock map", note: "The EA888's predecessor; typical λ 0.883, range 0.789–0.93 from 3,440 to 7,000 rpm", lambda: 0.883, lo: 0.789, hi: 0.93, kind: "relative", src: "rs246" },
    { vehicle: "octavia", label: "1.8T 20V, chipped map", note: "Same car; typical λ 0.879, range 0.75–0.906 from 3,720 to 6,760 rpm", lambda: 0.879, lo: 0.75, hi: 0.906, kind: "relative", src: "rs246" },
    { vehicle: "octavia", label: "EA888 Gen 2 2.0T, stage 2", note: "Audi A4 B8.5 with a custom file; AFR 13.4 tapering to 11.7 at 6,000 rpm on a petrol-scale reading", lambda: 0.796, markLabel: "at 6,000 rpm", lo: 0.796, hi: 0.912, kind: "relative", src: "audizine" },
    { vehicle: "octavia", label: "EA888 Gen 2 2.0T, stock fuel map", note: "Audi A4 B8, larger K04 turbo, stock fuelling: λ 0.8204 (12.05 : 1) at full load", lambda: 0.8204, kind: "relative", src: "audizine" },
    { vehicle: "octavia", label: "EA888 Gen 3 2.0, stock", note: "A tuner's log before a remap; λ 0.98–1.02 from 2,000 to 4,300 rpm and 0.92–0.96 above 5,000; range 0.921–1.019 from 2,000 to 6,467 rpm", lambda: 0.951, markLabel: "at 6,000 rpm", lo: 0.921, hi: 1.019, kind: "relative", src: "aet-stock" },
    { vehicle: "octavia", label: "EA888 Gen 3 2.0, Stage 1", note: "Same ECU part number, logged 30 minutes later; range 0.804–0.858 from 2,050 to 6,444 rpm", lambda: 0.817, markLabel: "at 6,000 rpm", lo: 0.804, hi: 0.858, kind: "relative", src: "aet-stg1" },
    { vehicle: "octavia", label: "EA888 Gen 3 1.8, Stage 1", note: "A 1.8 TFSI on a Stage 1 file; range 0.802–0.849 from 2,500 to 6,438 rpm", lambda: 0.834, markLabel: "at 5,977 rpm", lo: 0.802, hi: 0.849, kind: "relative", src: "aet-18" },
    { vehicle: "sy416", label: "Suzuki SY416", note: "No public measurement found for the G16B, G13B or G13BB", lambda: null, kind: "gap" },
    { vehicle: "sy416", label: "VW 1.6 non-turbo, stock", note: "Second full-throttle pull; typical λ 0.90, range 0.80–0.932 from 2,414 to 5,766 rpm", lambda: 0.9, lo: 0.8, hi: 0.932, kind: "relative", src: "sc16" },
    { vehicle: "sy416", label: "Honda R18 1.8, stock", note: "2009 Civic in a US lab, wideband ahead of the catalyst; full-throttle enrichment averaged about 0.82 on E0", lambda: 0.82, approx: true, kind: "relative", src: "ornl11" },
    { vehicle: "sy416", label: "Mazda MX-5 1.6 and 1.8, stock", note: "Fuel added from about 4,200 rpm; 11 : 1 by 6,000 rpm", afr: 11, lambda: 0.748, approx: true, kind: "statement", src: "nasa" },
    { vehicle: "cbr", label: "CBR250R, stock ECU", note: "About 14 : 1 on the dyno", afr: 14, lambda: 0.952, approx: true, kind: "measured", src: "mp" },
    { vehicle: "cbr", label: "CBR250R, Vortex ECU", note: "About 12 : 1 on average", afr: 12, lambda: 0.816, approx: true, kind: "measured", src: "mp" }
  ],

  /* EA888 Gen 3 2.0 TFSI (Simos 18, ECU 5G0 906 259 E), two full-throttle pulls logged by AET Motorsport
     on 9 June 2023: stock at 10:54, Stage 1 at 11:24, same ECU part number and software version.
     VCDS: the interface ID belongs to the tuner's cable, so the logs do not prove it is the same car.
     Rows: [time s, rpm, lambda actual bank 1, charge pressure specified bar abs, actual bar abs, intake air °C, throttle %] */
  gen3: {
    src: { stock: "aet-stock", stage1: "aet-stg1" },
    stock: [[7.29,1813,1.0078,1.922,1.482,25,71.4],[7.4,1840,1.0225,1.934,1.515,25,72.2],[7.51,1869,1.0342,1.94,1.549,24,72.9],[7.62,1905,1.042,1.937,1.584,24,73.7],[7.73,1964,1.0107,1.919,1.621,24,75.3],[7.84,1982,1.0176,1.919,1.659,24,76.1],[7.95,2018,1.0186,1.93,1.696,24,76.9],[8.06,2093,1.0107,1.964,1.737,24,77.6],[8.17,2134,1.0137,1.984,1.789,24,78],[8.28,2175,1.002,1.991,1.841,24,78.4],[8.39,2226,0.9951,2.003,1.896,24,78.8],[8.51,2282,1.0078,2.018,1.972,24,79.2],[8.62,2328,0.9941,2.023,2.003,24,79.6],[8.73,2373,0.9893,2.021,2.007,24,80],[8.84,2394,0.9902,2.012,2.016,24,80],[8.95,2406,0.9971,2.016,2.017,24,79.6],[9.06,2436,0.9902,2.012,2.011,24,80],[9.17,2465,0.9902,2.005,2.011,24,80],[9.28,2503,0.9854,2.001,2.009,24,74.5],[9.39,2533,0.9854,2.005,2.008,24,72.5],[9.52,2584,0.9824,2.016,2.003,24,73.7],[9.63,2637,0.9883,2.02,2.003,24,76.1],[9.74,2690,0.9814,2.035,2.01,24,79.6],[9.83,2721,0.9863,2.039,2.009,24,83.5],[9.94,2768,0.9863,2.038,2.022,24,83.5],[10.05,2811,0.9902,2.044,2.036,23,83.9],[10.16,2855,0.9961,2.053,2.047,23,84.3],[10.27,2898,0.9961,2.054,2.056,23,84.7],[10.38,2960,0.9961,2.054,2.055,23,84.7],[10.5,2989,0.9951,2.055,2.062,23,85.1],[10.61,3032,0.9922,2.056,2.068,23,85.9],[10.71,3060,0.9941,2.056,2.073,23,85.1],[10.82,3101,0.9912,2.056,2.075,23,81.2],[10.93,3141,0.9922,2.058,2.069,23,77.3],[11.04,3183,0.9873,2.057,2.072,23,77.3],[11.16,3233,0.9863,2.056,2.066,23,75.3],[11.27,3277,0.9775,2.058,2.064,23,76.1],[11.38,3312,0.9785,2.056,2.065,23,77.3],[11.49,3349,0.9814,2.056,2.063,23,77.6],[11.59,3390,0.9834,2.059,2.061,23,78.4],[11.72,3422,0.9795,2.063,2.064,23,80],[11.83,3467,0.9824,2.061,2.061,23,81.6],[11.95,3524,0.9834,2.062,2.067,24,83.9],[12.06,3559,0.9824,2.115,2.067,24,85.1],[12.17,3599,0.9766,2.138,2.097,24,86.3],[12.27,3624,0.9854,2.144,2.115,24,85.9],[12.39,3687,0.9883,2.143,2.141,24,86.3],[12.51,3752,1,2.14,2.154,24,86.3],[12.62,3819,0.9922,2.156,2.154,24,86.3],[12.73,3842,1.0078,2.163,2.17,24,86.3],[12.84,3876,0.9961,2.16,2.176,24,86.3],[12.95,3921,1.002,2.155,2.183,24,86.7],[13.06,3951,1.0049,2.156,2.177,24,85.1],[13.17,4004,1.0029,2.168,2.182,24,83.9],[13.29,4060,0.9932,2.165,2.193,24,86.3],[13.4,4121,0.9971,2.161,2.185,24,83.9],[13.51,4148,0.999,2.163,2.185,25,83.1],[13.62,4200,1.0039,2.161,2.189,25,83.1],[13.73,4239,1,2.156,2.187,25,82],[13.84,4281,0.998,2.148,2.188,25,77.3],[13.95,4317,0.9922,2.152,2.186,25,65.1],[14.06,4338,0.9922,2.158,2.169,25,66.7],[14.17,4376,0.9902,2.158,2.166,25,71],[14.28,4416,0.9883,2.156,2.169,25,74.9],[14.39,4480,0.9854,2.16,2.18,25,77.6],[14.52,4515,0.9824,2.163,2.179,25,80.4],[14.62,4570,0.9775,2.166,2.183,26,83.5],[14.73,4604,0.9766,2.168,2.192,26,85.9],[14.86,4652,0.9746,2.169,2.197,26,87.1],[14.97,4694,0.9697,2.171,2.21,26,86.7],[15.09,4731,0.9668,2.172,2.214,26,83.5],[15.22,4765,0.96,2.166,2.229,26,67.5],[15.34,4817,0.96,2.166,2.215,27,65.1],[15.47,4862,0.958,2.165,2.209,27,66.7],[15.6,4922,0.9561,2.166,2.204,27,67.8],[15.7,4960,0.9541,2.164,2.206,27,69],[15.8,4999,0.9502,2.161,2.209,27,69.8],[15.92,5037,0.9482,2.164,2.212,28,68.6],[16.02,5082,0.9453,2.169,2.206,28,68.6],[16.13,5122,0.9463,2.173,2.199,28,70.6],[16.24,5163,0.9463,2.175,2.196,28,72.9],[16.35,5200,0.9424,2.177,2.193,28,76.1],[16.46,5230,0.9443,2.181,2.192,29,78.8],[16.57,5284,0.9443,2.186,2.191,29,83.1],[16.68,5335,0.9434,2.192,2.189,29,87.1],[16.79,5375,0.9434,2.194,2.203,29,86.7],[16.91,5417,0.9482,2.198,2.201,29,86.7],[17.01,5455,0.9453,2.203,2.207,29,86.7],[17.12,5489,0.9473,2.209,2.201,30,86.7],[17.23,5550,0.9463,2.204,2.197,30,86.7],[17.34,5582,0.9482,2.176,2.208,30,86.7],[17.45,5624,0.9502,2.177,2.205,30,86.7],[17.56,5680,0.9473,2.166,2.209,30,86.7],[17.67,5716,0.9502,2.158,2.198,31,86.3],[17.78,5740,0.9512,2.125,2.207,31,84.7],[17.89,5793,0.9512,2.12,2.199,31,70.2],[18,5834,0.9561,2.11,2.197,32,64.3],[18.11,5866,0.9531,2.095,2.18,32,61.6],[18.22,5903,0.9512,2.077,2.14,32,63.9],[18.33,5932,0.9521,2.061,2.114,32,70.2],[18.44,5968,0.9482,2.054,2.101,32,73.7],[18.55,5998,0.9512,2.048,2.079,33,76.5],[18.66,6053,0.9473,2.038,2.057,33,78.8],[18.77,6101,0.9482,2.04,2.049,33,83.1],[18.88,6144,0.9482,2.037,2.027,33,86.7],[18.97,6194,0.9463,2.022,2.022,34,86.3],[19.08,6242,0.9434,2.014,2.023,34,86.3],[19.19,6288,0.9404,2.007,2.018,34,86.7],[19.3,6324,0.9385,1.998,2.011,34,86.3],[19.41,6370,0.9355,1.985,2.008,34,86.7],[19.52,6425,0.9316,1.977,2,35,86.3],[19.63,6454,0.9434,1.968,1.986,35,86.3],[19.74,6467,0.9385,1.964,1.988,35,86.3],[19.85,6454,0.9268,1.965,1.986,35,86.7],[19.96,6452,0.9209,1.965,1.985,36,86.3],[20.07,6449,0.9238,1.967,1.978,36,86.3],[20.18,6426,0.9238,1.97,1.975,36,86.7],[20.29,6348,0.9258,2,1.983,36,86.3]],
    stage1: [[6.62,1762,0.999,2.158,1.473,26,86.7],[6.73,1816,1.0234,2.23,1.501,26,86.3],[6.84,1858,0.9814,2.467,1.529,26,86.3],[6.95,1917,0.9678,2.694,1.555,26,86.3],[7.06,1947,0.9121,2.844,1.583,26,86.7],[7.17,1988,0.8916,2.844,1.612,26,86.7],[7.28,2016,0.8604,2.844,1.637,26,86.3],[7.39,2052,0.8262,2.844,1.665,26,86.3],[7.5,2107,0.8262,2.844,1.692,26,86.3],[7.61,2138,0.8311,2.844,1.726,26,86.7],[7.72,2195,0.835,2.844,1.768,26,86.3],[7.83,2235,0.8213,2.844,1.811,26,86.7],[7.94,2285,0.8311,2.844,1.863,26,86.7],[8.05,2338,0.832,2.844,1.918,26,86.7],[8.16,2387,0.8291,2.844,1.983,26,86.3],[8.27,2433,0.834,2.844,2.055,26,86.3],[8.38,2484,0.8311,2.844,2.133,26,86.3],[8.49,2532,0.833,2.844,2.22,26,86.7],[8.6,2589,0.8408,2.844,2.316,26,86.7],[8.71,2633,0.8271,2.844,2.42,26,86.7],[8.82,2698,0.8369,2.844,2.543,26,86.3],[8.94,2756,0.8457,2.844,2.71,26,86.3],[9.07,2874,0.8584,2.844,2.689,26,86.7],[9.17,2883,0.8516,2.844,2.666,26,86.7],[9.27,2860,0.8486,2.844,2.747,26,86.7],[9.38,2904,0.8447,2.844,2.691,26,86.3],[9.49,2905,0.8389,2.844,2.705,26,86.3],[9.58,2891,0.8359,2.844,2.756,26,86.3],[9.69,2907,0.8438,2.844,2.676,26,86.7],[9.8,2984,0.8262,2.844,2.737,26,86.3],[9.91,2973,0.832,2.844,2.786,26,86.3],[10.02,3081,0.8223,2.844,2.705,26,86.3],[10.13,3114,0.8262,2.844,2.733,26,86.7],[10.24,3111,0.8281,2.844,2.781,26,86.7],[10.35,3161,0.8203,2.844,2.769,26,86.7],[10.46,3229,0.8145,2.844,2.768,26,86.3],[10.57,3269,0.8105,2.844,2.793,26,86.3],[10.68,3313,0.8037,2.844,2.8,26,86.7],[10.79,3331,0.8076,2.844,2.777,27,86.3],[10.9,3381,0.8086,2.844,2.789,27,86.3],[11.01,3420,0.8066,2.844,2.819,27,86.3],[11.12,3448,0.8086,2.844,2.826,27,86.3],[11.23,3479,0.8047,2.844,2.827,27,86.7],[11.34,3553,0.8047,2.844,2.835,27,86.3],[11.45,3590,0.832,2.844,2.789,27,86.7],[11.55,3600,0.8184,2.844,2.684,27,86.3],[11.67,3577,0.8096,2.844,2.708,27,86.3],[11.78,3611,0.8145,2.844,2.756,28,86.7],[11.89,3709,0.8203,2.844,2.731,28,86.3],[11.99,3770,0.8154,2.844,2.748,28,86.7],[12.11,3818,0.8213,2.844,2.781,28,86.7],[12.22,3879,0.8232,2.844,2.774,28,86.3],[12.32,3937,0.8232,2.844,2.777,28,86.3],[12.43,3971,0.8223,2.844,2.779,28,86.7],[12.54,4026,0.8184,2.844,2.798,29,86.7],[12.65,4045,0.8164,2.844,2.798,29,86.7],[12.76,4103,0.8154,2.844,2.809,29,86.3],[12.87,4138,0.8164,2.844,2.833,29,86.7],[12.98,4192,0.8164,2.844,2.836,29,86.7],[13.09,4220,0.8232,2.844,2.832,30,86.3],[13.2,4265,0.8174,2.844,2.85,30,86.3],[13.31,4295,0.8203,2.844,2.87,30,86.7],[13.44,4343,0.8193,2.844,2.899,30,86.7],[13.55,4408,0.8203,2.844,2.889,31,86.7],[13.66,4463,0.8223,2.844,2.894,31,86.3],[13.77,4481,0.8232,2.844,2.902,31,86.3],[13.88,4503,0.8203,2.844,2.904,32,86.7],[13.99,4548,0.8193,2.844,2.918,32,86.7],[14.1,4588,0.8174,2.844,2.93,32,86.7],[14.2,4615,0.8145,2.844,2.929,33,86.7],[14.31,4664,0.8145,2.844,2.927,33,86.7],[14.42,4694,0.8145,2.844,2.922,33,86.3],[14.55,4720,0.8125,2.844,2.918,34,86.3],[14.65,4783,0.8096,2.844,2.916,34,86.7],[14.76,4830,0.8066,2.844,2.906,35,86.3],[14.87,4870,0.8135,2.844,2.903,35,86.7],[14.98,4904,0.8096,2.844,2.907,35,86.3],[15.09,4936,0.8066,2.844,2.904,36,86.3],[15.2,4997,0.8037,2.844,2.893,36,86.7],[15.31,5032,0.8057,2.844,2.878,36,86.7],[15.44,5067,0.8076,2.844,2.885,37,86.3],[15.54,5120,0.8076,2.844,2.879,37,86.7],[15.65,5170,0.8096,2.844,2.877,37,86.3],[15.76,5207,0.8086,2.844,2.875,38,86.3],[15.87,5246,0.8057,2.844,2.881,38,86.7],[15.99,5282,0.8086,2.844,2.876,39,86.7],[16.1,5328,0.8096,2.844,2.885,39,86.7],[16.2,5373,0.8125,2.844,2.88,39,86.3],[16.31,5419,0.8154,2.844,2.863,40,86.3],[16.44,5442,0.8135,2.844,2.856,40,86.3],[16.55,5468,0.8096,2.844,2.85,40,86.7],[16.66,5530,0.8125,2.837,2.83,41,86.3],[16.76,5571,0.8154,2.829,2.836,41,86.7],[16.87,5613,0.8184,2.82,2.805,42,86.7],[16.98,5668,0.8203,2.813,2.797,42,86.7],[17.09,5711,0.8193,2.803,2.782,42,86.7],[17.21,5762,0.8213,2.799,2.764,43,86.3],[17.32,5779,0.8184,2.794,2.763,43,86.7],[17.44,5818,0.8164,2.786,2.759,44,86.3],[17.55,5864,0.8193,2.777,2.752,44,86.7],[17.68,5909,0.8193,2.768,2.755,45,86.7],[17.79,5973,0.8184,2.759,2.739,45,86.7],[17.9,6001,0.8174,2.755,2.734,45,86.3],[18.01,6044,0.8184,2.748,2.721,46,86.7],[18.12,6089,0.8203,2.741,2.71,46,86.7],[18.23,6133,0.8223,2.734,2.674,46,86.3],[18.34,6176,0.8193,2.725,2.662,46,86.7],[18.45,6223,0.8213,2.718,2.656,47,86.7],[18.55,6279,0.8193,2.709,2.628,47,86.3],[18.66,6310,0.8213,2.704,2.642,48,86.7],[18.77,6332,0.8154,2.7,2.634,48,86.3],[18.88,6370,0.8174,2.691,2.616,48,86.7],[19,6415,0.8154,2.687,2.612,49,86.7],[19.1,6444,0.8164,2.686,2.621,49,86.7],[19.21,6439,0.8174,2.687,2.627,49,86.7],[19.32,6444,0.8135,2.683,2.616,50,86.3],[19.43,6439,0.8164,2.687,2.619,50,86.7],[19.54,6427,0.8164,2.691,2.623,50,86.3]]
  },

  /* 2009 Honda Civic 1.8 (R18), ORNL/TM-2011/234 Fig. 3.3: count of samples at each lambda during the full-throttle
     test (accelerations, cruise and idle; fuel cut-off above 1.1 left out by the report). Read from the PDF's vector
     paths, axis-calibrated (0.70–1.10, 0–3,500). Check: the samples below 0.95 average 0.822 on E0 and 0.876 on E20;
     the report's text gives about 0.82 and 0.87. Rows: [lambda, samples] */
  civicWot: {
    src: "ornl11",
    stated: { e0: 0.82, e20: 0.87 },
    check: { e0: 0.822, e20: 0.876 },
    e0: [[0.7,0],[0.704,1],[0.708,0],[0.712,0],[0.716,2],[0.72,1],[0.723,4],[0.727,1],[0.731,0],[0.735,2],[0.739,0],[0.743,1],[0.747,4],[0.751,12],[0.754,4],[0.758,6],[0.762,10],[0.766,7],[0.77,11],[0.774,22],[0.778,33],[0.782,34],[0.786,46],[0.789,49],[0.793,69],[0.797,116],[0.801,200],[0.805,240],[0.809,291],[0.813,244],[0.817,214],[0.821,170],[0.825,89],[0.828,43],[0.832,24],[0.836,21],[0.84,18],[0.844,16],[0.848,10],[0.852,11],[0.856,10],[0.86,14],[0.863,6],[0.867,11],[0.871,12],[0.875,7],[0.879,6],[0.883,14],[0.887,11],[0.891,13],[0.895,12],[0.898,11],[0.902,12],[0.906,10],[0.91,17],[0.914,13],[0.918,11],[0.922,17],[0.926,13],[0.93,23],[0.933,14],[0.937,17],[0.941,22],[0.945,22],[0.949,30],[0.953,45],[0.957,56],[0.961,72],[0.965,82],[0.969,157],[0.972,197],[0.976,301],[0.98,442],[0.984,787],[0.988,1353],[0.992,2147],[0.996,2880],[1,3047],[1.004,2856],[1.007,2228],[1.011,1559],[1.015,1165],[1.019,833],[1.023,597],[1.027,378],[1.031,241],[1.034,146],[1.038,91],[1.042,76],[1.046,63],[1.05,46],[1.054,37],[1.058,31],[1.062,33],[1.066,19],[1.07,23],[1.073,14],[1.077,14],[1.081,18],[1.085,18],[1.089,12],[1.093,17],[1.097,6]],
    e20: [[0.717,1],[0.72,0],[0.724,0],[0.727,0],[0.731,0],[0.734,0],[0.738,0],[0.741,0],[0.744,0],[0.748,0],[0.751,1],[0.755,0],[0.758,0],[0.762,1],[0.765,0],[0.769,0],[0.772,0],[0.775,0],[0.779,0],[0.782,1],[0.786,2],[0.789,1],[0.793,2],[0.796,2],[0.8,1],[0.803,5],[0.807,1],[0.81,5],[0.814,7],[0.817,8],[0.82,7],[0.824,25],[0.827,19],[0.831,24],[0.834,27],[0.838,25],[0.841,43],[0.845,59],[0.848,64],[0.851,71],[0.855,97],[0.858,101],[0.862,95],[0.865,104],[0.869,167],[0.872,140],[0.876,152],[0.879,115],[0.882,82],[0.886,52],[0.889,37],[0.893,13],[0.896,18],[0.9,12],[0.903,16],[0.907,8],[0.91,17],[0.914,11],[0.917,12],[0.92,22],[0.924,23],[0.927,24],[0.931,22],[0.934,24],[0.938,23],[0.941,51],[0.945,56],[0.948,45],[0.952,53],[0.955,70],[0.958,87],[0.962,165],[0.965,253],[0.969,316],[0.972,419],[0.976,583],[0.979,1031],[0.983,1644],[0.986,2230],[0.99,2858],[0.993,2677],[0.996,2526],[1,2152],[1.003,1562],[1.007,1243],[1.01,950],[1.014,705],[1.017,503],[1.021,380],[1.024,297],[1.028,181],[1.031,134],[1.034,81],[1.038,52],[1.041,58],[1.045,57],[1.048,51],[1.052,33],[1.055,36],[1.058,30],[1.062,18],[1.065,27],[1.069,25],[1.072,27],[1.076,18],[1.079,13],[1.083,17],[1.086,8],[1.09,8],[1.093,13],[1.097,13],[1.1,10]]
  },

  cbrDyno: {
    src: "mp",
    rows: [
      { setup: "Stock ECU", afr: "≈ 14 : 1", hp: 23.94, lbft: 14.98, limiter: 10500 },
      { setup: "Vortex ECU", afr: "≈ 12 : 1", hp: 24.47, lbft: 15.53, limiter: 12300 }
    ]
  },

  /* ---------- Close relatives (no public logs exist for my exact engines) ---------- */

  /* Audi S3 1.8T 20V, VCDS block 031 wideband lambda, 4th gear, same car on two maps. [rpm, lambda] */
  s3: {
    src: "rs246",
    stock: [[3440,0.93],[3640,0.922],[3800,0.899],[4000,0.891],[4160,0.906],[4320,0.891],[4480,0.883],[4640,0.891],[4800,0.883],[4960,0.899],[5080,0.883],[5240,0.883],[5360,0.891],[5520,0.891],[5640,0.883],[5760,0.883],[5920,0.867],[6040,0.883],[6160,0.891],[6280,0.891],[6360,0.867],[6480,0.836],[6560,0.813],[6680,0.789],[6760,0.805],[6800,0.813],[6880,0.844],[6960,0.852],[7000,0.906]],
    chipped: [[3720,0.906],[3920,0.891],[4160,0.883],[4360,0.883],[4560,0.883],[4760,0.883],[4960,0.891],[5120,0.883],[5320,0.883],[5480,0.867],[5640,0.883],[5800,0.875],[5920,0.821],[6080,0.782],[6200,0.75],[6320,0.75],[6400,0.758],[6520,0.805],[6640,0.828],[6760,0.821]]
  },

  /* Remapped SEAT Leon Cupra R 1.8T 20V, two consecutive 4th-gear pulls, 30 May 2013.
     runA: [rpm, lambda actual, lambda specified] — rpm is the mean of the two engine-speed groups around each lambda sample.
     runB: [rpm, modelled exhaust temperature °C, enrichment factor %] — rpm from group 118, the sample nearest in time. */
  leonR: {
    src: "sc18t",
    limit: 920,
    runA: [[2360,0.945,0.945],[2480,0.93,0.961],[2760,0.945,0.953],[3120,1,0.953],[3580,0.883,0.899],[4060,0.875,0.875],[4440,0.867,0.875],[4820,0.875,0.875],[5160,0.875,0.875],[5480,0.875,0.875],[5720,0.797,0.805],[5940,0.75,0.743],[6160,0.75,0.743],[6320,0.75,0.766],[6500,0.766,0.782],[6640,0.75,0.766],[6760,0.75,0.743],[6840,0.75,0.743]],
    runB: [[2400,680,0],[2560,680,0],[2840,700,0],[3240,745,0],[3600,800,0],[4040,860,0],[4400,880,0],[4760,895,0],[5080,915,0],[5320,930,6.7],[5560,940,14.9],[5800,940,16.9],[6000,935,16.5],[6200,930,15.7],[6360,930,16.1],[6520,925,16.1],[6640,925,15.7]]
  },

  /* Stock SEAT Leon Mk1 1.6 non-turbo, a drive logged in VCDS, 29 May 2012, from engine start.
     [time s, lambda actual, lambda specified, rpm (mean of groups 001 and 002), load %, injection ms, manifold pressure mbar] */
  drive16: {
    src: "sc16",
    cols: ["t", "act", "spec", "rpm", "load", "inj", "map"],
    rows: [
      [22.7,1,0.852,105,0,0,1012],[24.66,1,0.904,1005,18.8,9,268.9],[26.51,1,0.92,706,18.9,3,320],[28.7,1,0.936,716,18.8,3,325.1],[30.83,1,0.944,713,18.2,3,317.4],[32.84,1,0.952,726,17.8,3,310],[34.7,1,0.96,722,17.8,3,310],[36.63,1,0.968,708,17.3,3,303.6],[39,1,0.976,714,16.8,3,297.6],[41.03,1.028,0.984,719,17.1,3,300],
      [43,1.016,0.992,710,16.7,3,294.6],[45.03,0.996,1,723,17.7,3,307.5],[46.99,1,1,726,16.9,3,296.4],[48.99,1.012,1,788,16.5,3,291.2],[50.88,1.02,1,845,30.1,5,465.5],[52.91,1.032,1,697,21.4,4,357],[54.94,0.876,1,705,22.9,4,375.9],[56.97,1.02,1,767,27.9,4,448.8],[58.94,0.996,1,895,21.7,3,360],[61.02,1,1,1552,40.1,7,597.1],
      [62.94,1.108,0.996,1626,30.1,5,457.2],[64.9,1.084,1,880,13.7,2,251],[66.76,1.072,1,942,13.6,2,247],[68.74,1.02,1,1395,70.4,11,965.2],[70.64,1,1,1923,52.3,8,735.8],[72.59,0.952,1,1538,25.9,1,321.3],[74.56,0.984,1,1682,32.6,7,508],[76.43,0.98,1,1764,30.1,4,459],[78.27,0.896,0.9,2016,71.4,7,904.2],[80.24,0.908,0.9,2499,77.7,13,999.6],
      [82.28,0.896,0.9,2992,79,13,999.6],[84.14,0.888,0.9,3430,80.1,13,995.7],[86.09,0.908,0.9,3861,79.8,12,991.8],[87.95,0.892,0.9,4310,86.4,13,979.2],[89.99,0.904,0.904,4649,85.9,13,958.8],[91.91,0.892,0.9,4988,87.7,9,969],[93.89,1.2,0.992,4835,16.9,12,288.8],[95.83,1.2,0.996,3197,21.9,0,426.7],[97.88,1.2,0.996,1737,14.2,0,252],[99.84,1.144,0.996,1836,16.7,0,288.8],
      [101.84,0.996,1,1909,70.6,10,938.4],[103.79,1.016,1,2036,75.2,11,999.6],[105.81,1.028,1,2189,74.7,11,989.4],[107.82,1.072,0.984,2268,64.8,10,944.9],[109.66,1.2,0.996,2180,12.3,0,522.1],[111.52,1.2,0.996,1979,22.6,0,377.4],[113.42,0.924,1,1775,20.9,0,371.5],[115.29,0.988,1,1807,50.8,6,705.6],[117.07,1.004,1,1919,67.8,11,920.9],[118.95,0.992,0.988,1919,18.8,8,352.8],
      [120.79,0.996,1.008,1937,39.6,4,665.3],[122.65,0.956,1,1952,44.2,6,741.7],[124.71,0.96,1,1929,24.7,2,351.4],[126.47,0.96,0.996,1884,15.5,6,261],[128.16,1.056,0.996,1861,17.7,5,316.2],[130.18,1.2,0.996,1789,18.7,0,322.6],[132.16,1.2,0.996,1639,14.5,0,255],[134.14,0.976,1,1632,52.3,6,715.7],[136.08,0.96,1,1728,17.2,4,306],[138.12,1.2,1,2029,12.9,4,230],
      [140.12,1.2,1,1563,15.9,0,271.1],[142.11,1.2,1,714,13.6,2,257.9],[144.04,1.016,1,688,13.9,3,264.2],[145.9,0.92,1,901,14.8,2,276.6],[147.85,1.004,1,1597,56.4,9,792.5],[149.72,0.996,1,2307,73.4,11,975.4],[151.65,0.956,1,1919,28.6,1,341.4],[153.46,1.004,0.996,2046,45.9,7,663],[155.33,0.976,0.996,2100,30.6,6,477.5],[157.5,0.988,1,2221,58.9,9,867],
      [159.55,0.992,0.992,2448,58.1,10,846.6],[161.58,1.044,0.992,2223,70.9,10,965.2],[163.63,0.996,1,1908,51.5,8,734.4],[165.53,0.996,0.996,1930,54.9,9,792.5],[167.48,1.024,1.004,1901,48.3,7,680.7],[169.46,1,1.004,1833,46.2,7,772.2],[171.5,1.004,1.004,1753,20.1,4,352.8],[173.46,0.988,0.992,1811,16.1,2,268.9],[175.3,0.94,0.992,1847,37.1,6,675.4],[177.14,1.2,0.996,1786,7.1,0,492],
      [178.96,1.2,0.996,1495,13.3,0,238.1],[180.95,1.2,1,756,13.2,0,248],[182.98,0.996,1,709,16.4,3,297.6],[184.8,0.988,1,1516,67.6,4,955],[186.77,1.2,0.996,2183,39.3,10,657.8],[188.62,1.008,1,2102,76,9,999.6],[190.65,0.988,0.992,2941,77.5,11,989.4],[192.62,0.956,0.996,2547,17.5,8,294.6],[194.57,1.036,0.992,2302,44.7,7,637.6],[196.71,1.2,0.996,2141,12.7,3,226.3],
      [198.78,0.968,0.996,2020,12,2,210.8],[200.77,1.02,0.996,2096,24.3,4,394.7],[202.73,0.968,0.984,2201,16.1,3,267.8],[204.66,0.992,1.008,2180,11.1,2,205],[206.63,1.2,0.996,2105,11.3,0,526.2],[208.58,1.2,0.996,2020,20.7,0,340],[210.42,1.2,0.996,1923,14.6,0,254],[212.35,1.2,0.996,1818,14.3,0,253],[214.27,1.2,0.996,1703,12.9,0,234.6],[216.16,1.2,0.996,1588,12.4,0,226.3],
      [218.08,1.2,1,1469,12.3,0,226.3],[220.08,0.968,0.984,1462,15.2,2,264.2],[222.11,0.98,0.992,1565,28.2,5,436.9],[223.98,1,1.008,1680,31.4,5,489.6],[225.9,1,1.004,1945,55.4,6,856.8],[227.93,0.912,0.9,2414,76.7,13,999.6],[230.04,0.904,0.9,2942,78.5,13,999.6],[231.89,0.892,0.9,3411,79.6,13,995.7],[233.81,0.9,0.9,3886,79.6,12,991.8],[235.73,0.9,0.9,4343,87.2,13,985.5],
      [237.9,0.932,0.908,4851,87.7,13,981.6],[239.79,0.884,0.9,5233,87.7,13,985.5],[241.5,0.8,0.752,5548,87.4,12,985.5],[243.28,0.8,0.764,5766,87.2,16,981.6],[245.12,0.888,0.996,5730,86.2,15,979.2],[247.13,1.2,0.992,4908,24.5,0,340],[249.07,1.2,0.992,3805,23.4,0,316.2],[250.95,1.2,0.992,2717,21.4,0,335.3],[253.02,1.2,0.996,1397,14.7,0,255],[255,1.048,1,722,17.1,2,303.6],
      [257.01,1.016,1,699,14.3,3,271.1],[258.96,0.868,1,812,31.8,3,346.8],[260.8,0.992,1.004,1799,50,8,714],[262.85,1.2,0.992,2151,49,8,685.4],[264.71,1.048,1,1916,69.4,10,928.2],[266.51,1.12,0.996,1992,69.6,11,924.6],[268.49,1.016,1,1616,31.1,4,469.2],[270.54,0.992,1.004,1829,60.2,8,843.3],[272.33,0.988,0.992,2058,43.7,8,650.2],[274.22,0.98,0.996,1900,29.6,5,514.1],
      [276.11,1.016,1.008,1772,43.3,7,619.8],[278.01,1.032,1.008,1896,53.6,8,775.2],[279.8,1.2,0.996,1915,13.9,2,247],[281.65,0.968,0.988,1919,24.1,1,355.6],[283.54,1.028,0.996,1962,27.9,4,428.4],[285.57,0.996,0.996,1974,15.9,2,268.9],[287.51,1.2,0.996,1948,12.2,2,222.6],[289.33,1.2,0.996,1575,14.7,0,257.9],[291.34,1.2,1,728,11.9,2,228.2],[293.38,1.02,1,682,13.3,2,257.9],
      [295.39,0.984,1,1060,15.2,2,283.4],[297.23,1.012,1,1771,46.2,7,657.8],[299.16,0.96,0.996,1603,13.8,2,230.9],[301.18,1.2,0.996,1714,12.5,2,225.4],[302.99,0.984,1,1833,42.7,3,591.6],[304.92,0.992,1,2105,76,11,1005.8],[306.97,0.924,1,1930,19.6,9,335.3],[308.82,0.996,0.996,1732,51.3,8,715.7],[310.66,0.988,0.992,1829,46,8,663],[312.63,1,1.004,1800,38.5,6,571.2],
      [314.68,1.004,0.996,1528,14,1,235.2],[316.72,1.2,0.996,1472,12.1,0,225.4],[318.85,1.2,0.996,1408,12.4,0,231.8],[320.83,1.2,0.996,1364,12.6,0,236.2],[322.72,1.2,0.996,1320,12.4,0,235.2],[324.7,1.008,0.984,1300,19.3,3,306],[326.64,0.988,1,1347,53.5,9,751.8],[328.62,1.028,1.008,1345,12.5,3,241.9],[330.6,1.104,1.008,1283,11,2,211.7],[332.54,0.952,1.008,1331,28.6,3,413.3],
      [334.62,1.028,1,1490,42.7,8,622.2],[336.69,1.2,1,1069,12.5,0,233.7],[338.74,1.06,1,693,15,3,278.9],[340.8,0.992,1,675,15.6,3,287.7],[342.79,1.148,1,1041,13.3,3,247],[344.75,0.96,1,1337,29.7,2,410],[346.62,0.98,1,1834,47.4,9,667.9],[348.59,1.036,0.988,2150,42.3,6,629.9],[350.61,1.2,0.996,1397,12.4,1,233.7],[352.69,1.004,0.98,1433,16.5,2,260],
      [354.6,1.088,1,1361,16.5,3,285.6],[356.56,1.08,0.992,1237,10.7,2,206.6],[358.43,1.004,1,1113,10.5,2,204],[360.46,1.016,1,959,11.1,2,213.4],[362.39,0.96,1,753,11.9,2,227.2],[364.25,0.92,1,685,14.7,3,275.4],[366.26,0.94,1,675,14.4,2,272.2],[368.12,0.956,1,676,14.4,2,272.2],[370.05,0.98,1,679,13.6,2,260],[372.1,0.984,1,683,15.4,2,284.5],
      [374.21,0.996,1,688,15.1,2,280],[376.4,0.992,1,679,13.8,2,264.2],[378.38,1,1,677,14.1,2,267.8],[380.33,0.996,1,684,14.4,2,271.1],[382.36,0.996,1,678,14.1,2,267.8]
    ]
  },

  /* Narrowband oxygen sensor on a Suzuki G13B, oscilloscope capture posted by a tuning shop.
     Digitised from the 320 × 234 px image: grid of 25 px per division, 10 divisions across, 8 up.
     The scope's volts and seconds per division are not readable in the image. [x div, y div] */
  g13b: {
    src: "tbhp-unichip",
    rows: [[0.12,5.52],[0.2,5.48],[0.28,5.48],[0.36,5.28],[0.44,5.36],[0.52,4.64],[0.6,5.24],[0.92,3],[1,2.32],[1.16,1.96],[1.24,1.96],[1.32,1.88],[1.4,1.88],[1.48,1.84],[1.56,1.92],[1.64,1.88],[1.72,1.92],[1.8,1.88],[1.88,2.12],[1.96,2.16],[2.2,5.16],[2.28,5.2],[2.36,5.4],[2.44,5.32],[2.52,5.44],[2.6,5.32],[2.68,5.36],[2.76,4.92],[3,2.96],[3.16,2.08],[3.24,1.96],[3.32,1.92],[3.4,1.92],[3.48,1.92],[3.56,1.92],[3.64,1.96],[3.72,2.12],[3.88,2.64],[3.96,2.6],[4.04,4.24],[4.2,5.24],[4.28,5.4],[4.36,5.4],[4.44,5.44],[4.52,5.4],[4.6,5.36],[4.68,5.32],[4.76,4.84],[4.92,3.6],[5,3.64],[5.24,2.08],[5.32,1.96],[5.4,1.92],[5.48,1.92],[5.56,1.88],[5.64,1.88],[5.72,1.88],[5.8,2.04],[5.88,2.08],[6.04,2.92],[6.12,4.6],[6.2,4.56],[6.28,5.16],[6.36,5.2],[6.44,5.24],[6.52,5.04],[6.6,5.4],[6.68,5.12],[6.84,4.84],[6.92,5.12],[7.32,2.04],[7.4,1.96],[7.48,1.92],[7.56,1.96],[7.64,1.88],[7.72,2.12],[7.8,2.08],[7.96,3],[8.04,4.72],[8.12,4.84],[8.2,5.24],[8.28,5.16],[8.36,5.4],[8.44,5.36],[8.52,5.4],[8.6,5.2],[8.84,5.2],[8.92,3.32],[9,3.28],[9.16,2.36],[9.24,2.12],[9.32,2.16],[9.4,2.04],[9.48,2.12],[9.56,2.08],[9.64,2.68],[9.72,2.68],[9.8,5],[9.88,4.96]]
  },

  /* Stock SY416 on Race Dynamics' chassis dyno. Digitised from the 800 × 562 px chart:
     x calibrated on the 2,000–8,000 rpm gridlines (115 px per 1,000 rpm), y on the 0–100 gridlines (3.94 px per unit).
     Check against the figures printed on the chart: peak torque 106.6 vs 106.79 N·m, peak power 71.1 vs 71.24 hp. */
  balenoDyno: {
    src: "rd",
    published: { whp: 71.24, nm: 106.79 },
    cols: ["rpm", "nm", "hp"],
    rows: [
      [1800,74.6,18.5],[1900,83.0,21.8],[2000,88.6,24.4],[2100,92.9,27.2],[2200,96.2,29.4],[2300,99.2,31.7],
      [2400,101.5,33.8],[2500,103.3,36.0],[2600,104.8,37.8],[2700,105.8,39.8],[2800,106.3,41.4],[2900,106.6,43.1],
      [3000,106.6,44.4],[3100,106.1,45.9],[3200,105.6,47.0],[3300,104.8,48.2],[3400,104.1,49.2],[3500,103.6,50.5],
      [3600,102.8,51.5],[3700,102.3,52.8],[3800,101.8,53.8],[3900,101.3,55.1],[4000,100.8,56.1],[4100,100.8,57.6],
      [4200,101.0,59.1],[4300,101.0,60.7],[4400,101.0,61.9],[4500,100.8,63.5],[4600,100.3,64.5],[4700,99.7,65.5],
      [4800,99.5,66.8],[4900,99.0,67.8],[5000,98.5,68.8],[5100,97.5,69.5],[5200,96.4,70.1],[5300,95.2,70.6],
      [5400,93.9,70.8],[5500,92.4,71.1],[5600,90.6,71.1],[5700,88.8,70.8],[5800,86.8,70.6],[5900,84.5,69.8],
      [6000,82.5,69.3],[6100,79.9,68.3],[6200,77.7,67.3],[6300,74.9,66.0],[6400,72.3,64.7],[6500,69.5,63.5],
      [6600,66.5,61.7],[6700,63.2,59.4],[6800,59.9,56.9]
    ]
  },

  /* ---------- 4. E20 ---------- */
  /* Average ethanol in petrol, by Ethanol Supply Year. Years without an official figure collected stay empty. */
  blending: [
    { esy: "2013-14", pct: 1.53, src: "ls24" },
    { esy: "2014-15", pct: null },
    { esy: "2015-16", pct: null },
    { esy: "2016-17", pct: null },
    { esy: "2017-18", pct: null },
    { esy: "2018-19", pct: 5.00, src: "mopng" },
    { esy: "2019-20", pct: null },
    { esy: "2020-21", pct: 8.5, src: "rs25", note: "The 2024 Lok Sabha reply gives 8.17%" },
    { esy: "2021-22", pct: 10, src: "rs25", note: "10% reached in June 2022, five months ahead of target" },
    { esy: "2022-23", pct: 12, src: "rs25", note: "The 2024 Lok Sabha reply gives 12.06%" },
    { esy: "2023-24", pct: 14.6, src: "rs25" },
    { esy: "2024-25", pct: 19.93, src: "rs25", note: "As on 31 July 2025" },
    { esy: "2025-26", pct: 20, src: "pib26", note: "All petrol E20 with RON 95 minimum from April 2026" }
  ],

  milestones: [
    { when: "Jan 2003", text: "E5 goes on sale in nine states and four union territories", src: "pib22" },
    { when: "2006", text: "E5 extended to 20 states and four union territories", src: "pib22" },
    { when: "Apr 2019", text: "Programme covers all of India except Andaman & Nicobar and Lakshadweep", src: "mopng" },
    { when: "Jun 2022", text: "10% average reached, five months ahead of target", src: "ls24" },
    { when: "Apr 2023", text: "E20-compliant vehicles on sale, per SIAM", src: "mopng25" },
    { when: "Apr 2026", text: "All petrol is E20, minimum RON 95", src: "pib26" }
  ],

  /* Harmonixx Tuning's ethanol test-bottle readings, August 2025 */
  pump: {
    src: "harm",
    when: "August 2025",
    rows: [
      { fuel: "IOCL 91 RON", lo: 18, hi: 20 },
      { fuel: "XP95", lo: 18, hi: 22 },
      { fuel: "Power 95", lo: 15, hi: 18 },
      { fuel: "Shell V-Power", lo: 12, hi: 15 },
      { fuel: "XP100", lo: 8, hi: 12 }
    ],
    earlier: [
      { when: "Late 2020", text: "0% in every fuel tested: Shell Regular, Shell V-Power, HP Power 99" },
      { when: "Late 2022", text: "Power 99 at E7–E8, the first blend they saw" },
      { when: "Apr 2023", text: "XP95 at E5" }
    ]
  },

  /* ORNL/NREL Table 2.2: measured properties of the 12 test fuels.
     LHV in Btu/lbm; sg = specific gravity; o = oxygen mass fraction. Energy per litre is LHV × sg, indexed to the same lab's E0. */
  ornlFuels: [
    { lab: "NREL", fuel: "E0",  etoh: 0.0,  lhv: 18533, sg: 0.746, o: 0.0000 },
    { lab: "NREL", fuel: "E10", etoh: 9.9,  lhv: 17873, sg: 0.750, o: 0.0365 },
    { lab: "NREL", fuel: "E15", etoh: 13.9, lhv: 17471, sg: 0.752, o: 0.0511 },
    { lab: "NREL", fuel: "E20", etoh: 18.6, lhv: 17091, sg: 0.754, o: 0.0679 },
    { lab: "ORNL", fuel: "E0",  etoh: 0.0,  lhv: 18534, sg: 0.746, o: 0.0000 },
    { lab: "ORNL", fuel: "E10", etoh: 9.1,  lhv: 17844, sg: 0.750, o: 0.0336 },
    { lab: "ORNL", fuel: "E15", etoh: 14.4, lhv: 17485, sg: 0.752, o: 0.0527 },
    { lab: "ORNL", fuel: "E20", etoh: 19.8, lhv: 17043, sg: 0.755, o: 0.0723 },
    { lab: "ANL",  fuel: "E0",  etoh: 0.0,  lhv: 18542, sg: 0.746, o: 0.0000 },
    { lab: "ANL",  fuel: "E10", etoh: 9.9,  lhv: 17793, sg: 0.751, o: 0.0362 },
    { lab: "ANL",  fuel: "E15", etoh: 14.3, lhv: 17412, sg: 0.752, o: 0.0524 },
    { lab: "ANL",  fuel: "E20", etoh: 19.6, lhv: 17044, sg: 0.755, o: 0.0717 }
  ],

  /* ORNL/NREL full-throttle findings, 16 vehicles (model years 1999–2007), E20 against E0 */
  ornlWot: {
    src: "ornl",
    fleet: 16, held: 9, leaner: 7,
    heldText: "Kept the same full-throttle mixture on E20. The report's explanation: they carry fuel-trim corrections learned at cruise into full throttle",
    leanerText: "Ran leaner on E20 at full throttle, though still rich, by roughly the fuel's extra oxygen content",
    catalyst: [
      { group: "Ran leaner (7 cars)", comparison: "E20 vs E0", lo: 29, hi: 35, text: "average rise of 29 to 35 °C in peak catalyst temperature" },
      { group: "Ran leaner (7 cars)", comparison: "E20 vs E10", lo: 20, hi: 20, approx: true, text: "average rise of about 20 °C" },
      { group: "Held mixture (9 cars)", comparison: "E20 vs E0", lo: 0, hi: 5, below: true, rangeLo: -14, rangeHi: 14, text: "under 5 °C on average; individual results from −14 to +14 °C" }
    ],
    economy: -7.7
  },

  /* Claimed or measured drop in fuel economy on E20. baseline: what E20 is compared with */
  mileage: [
    { src: "ornl",    who: "US DOE lab tests, 2009", what: "16 US cars, 1999–2007", lo: 7.7, hi: 7.7, baseline: "E0", kind: "measured" },
    { src: "harm",    who: "Harmonixx Tuning, 2025", what: "Their experience across customer cars", lo: 6, hi: 8, baseline: "E0", kind: "statement", note: "Compared with unblended petrol" },
    { src: "niti",    who: "NITI Aayog roadmap, 2021", what: "Existing cars calibrated for E10", lo: 6, hi: 7, baseline: "unstated", kind: "statement" },
    { src: "niti",    who: "NITI Aayog roadmap, 2021", what: "Two-wheelers", lo: 3, hi: 4, baseline: "unstated", kind: "statement" },
    { src: "niti",    who: "NITI Aayog roadmap, 2021", what: "Vehicles designed and calibrated for E20", lo: 1, hi: 2, baseline: "unstated", kind: "statement" },
    { src: "mopng25", who: "Petroleum Ministry, 2025", what: "Vehicles designed for E10, calibrated for E20", lo: 1, hi: 2, baseline: "unstated", kind: "statement" },
    { src: "mopng25", who: "Petroleum Ministry, 2025", what: "Other vehicles", lo: 3, hi: 6, baseline: "unstated", kind: "statement" },
    { src: "pib26",   who: "PIB Q&A, 2026", what: "General guidance", lo: 3, hi: 5, baseline: "unstated", kind: "statement" },
    { src: "arai",    who: "ARAI with carmakers, 2026", what: "3- to 10-year-old vehicles, controlled tests", lo: 2, hi: 6, baseline: "E10", kind: "measured" }
  ],

  /* What each of the three is likely to meet on E20, kept to what sources say */
  e20Notes: [
    { vehicle: "octavia", text: "Harmonixx Tuning lists VW Group TSI engines from 2012 on as safe on E20; whether that covers a given Laura depends on its build date. Audi's manual describes λ 1 control across the map, and the US study notes that closed-loop λ 1 operation is where an engine computer corrects for a fuel's extra oxygen. My own VCDS scans, taken while the car ran E20 and E0, hold no lean, rich or fuel-trim fault codes: the corrections stayed inside the computer's limits, though the scans don't show how far they moved.", src: "harm ssp384 ornl owner-scan" },
    { vehicle: "sy416", text: "The G16B went into the Baleno from 1995 to 2007, and India's first E5 went on sale in 2003. ARAI's 2026 durability runs found that some older rubber hoses, seals and gaskets in vehicles not designed for E20 may degrade faster. The nearest measured case is a Honda 1.8 non-turbo, which ran λ 0.87 at full throttle on E20 against 0.82 on E0 because it does not carry learned fuel trim into full throttle; whether the G16B does is not documented.", src: "wiki-g pib22 arai-bt ornl11" },
    { vehicle: "cbr", text: "NITI Aayog's roadmap puts the two-wheeler economy drop on E20 at 3–4%. Like the cars in the US study, its full-throttle mixture on E20 has not been measured in public.", src: "niti ornl" }
  ],

  /* Lineage: which sources feed which chart or table on the page. anchor = element id to jump to. */
  lineage: [
    { anchor: "fig-stoich", label: "Stoichiometric AFR by ethanol", src: "hpt wiki-eth ornl" },
    { anchor: "fig-ruler", label: "Reference lambda targets", src: "hpa" },
    { anchor: "vehicle-cards", label: "Vehicle cards", src: "mr ssp384 owner-scan wiki-g rd owner wiki-cbr mcom mp" },
    { anchor: "fig-dyno", label: "SY416 on a chassis dyno", src: "rd" },
    { anchor: "matrix", label: "Evidence table", src: "ssp384 audi2011 aet-stock aet-stg1 audizine rs246 sc18t sc16 ornl11 tbhp-unichip rd mp owner owner-scan" },
    { anchor: "fig-wot", label: "Full throttle, public data", src: "mp ssp384 aet-stock aet-stg1 aet-18 audizine rs246 sc16 ornl11 nasa hpa" },
    { anchor: "fig-curves", label: "Full-throttle lambda against rpm", src: "rs246 sc16 hpa" },
    { anchor: "fig-gen3", label: "EA888 Gen 3, stock and Stage 1", src: "aet-stock aet-stg1 ecutek audi2011" },
    { anchor: "fig-egt", label: "Exhaust-temperature protection", src: "sc18t sc18t-floor" },
    { anchor: "fig-drive", label: "Six-minute drive log", src: "sc16" },
    { anchor: "fig-o2", label: "G13B oxygen sensor signal", src: "tbhp-unichip owner" },
    { anchor: "fig-3d", label: "3D engine-map view", src: "sc16" },
    { anchor: "fig-monitor", label: "Monitor and statistics", src: "sc16" },
    { anchor: "fig-explorer", label: "Explorer", src: "sc16 rs246 sc18t aet-stock aet-stg1 ornl rd ls24 mopng rs25 pib26" },
    { anchor: "fig-blend", label: "India's blend by year", src: "ls24 mopng rs25 pib26 pib22 mopng25" },
    { anchor: "fig-pump", label: "What was in the pump", src: "harm" },
    { anchor: "fig-ornl", label: "Sixteen cars on E20", src: "ornl" },
    { anchor: "fig-civic", label: "A Honda 1.8 on E0 and E20", src: "ornl11 wiki-r" },
    { anchor: "fig-props", label: "Twelve test fuels", src: "ornl" },
    { anchor: "fig-miles", label: "Mileage claims", src: "ornl harm niti mopng25 pib26 arai" },
    { anchor: "e20-notes", label: "Expected effect on the three vehicles", src: "harm ssp384 ornl owner-scan wiki-g pib22 arai-bt ornl11 niti" }
  ]
};
