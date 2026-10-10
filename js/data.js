/* ==========================================================================
   PORTFOLIO CONTENT
   Everything a visitor reads lives here. Edit text / links freely; the game,
   the guided tour and the Quick View all render from this file.

   Section fields
     id, title, subtitle, icon, cat (tour category), blurb (guide's line)
     blocks: p, h, stats, flow, compare, img, gallery, links, list, quote,
             code, tags, cards, courses, callout, facts, trophies
   ========================================================================== */

const PROFILE = {
  name: "Mehul Gupta",
  tagline: "I build AI products and make the data underneath them correct.",
  roles: "AI Systems · Analytics · Product Delivery",
  email: "mg8671@nyu.edu",
  linkedin: "https://www.linkedin.com/in/mehulmg/",
  github: "https://github.com/mgupta646",
  tableau: "https://public.tableau.com/app/profile/mehul.gupta7649/vizzes",
  pdf: "assets/Mehul_Gupta_Portfolio.pdf",
  status: "Available January 2027 · Brooklyn, NY · Open to relocation",
};

/* tour categories (order = order in the tour planner) */
const CATEGORIES = [
  { id: "ai", name: "AI & Product" },
  { id: "data", name: "Data & Analytics" },
  { id: "build", name: "Builds & Code" },
  { id: "edu", name: "Education & Teaching" },
  { id: "aero", name: "Aerospace" },
  { id: "life", name: "About, Awards & Contact" },
];
const TOUR_PRESETS = [
  { id: "recruiter", name: "★ Recruiter's Cut", ids: ["home", "vlab", "rosi", "magic", "aviation", "citibike", "apps", "nyu", "trophy", "contact"] },
  { id: "ai", name: "AI & Product", cats: ["ai"] },
  { id: "data", name: "Data & Analytics", cats: ["data"] },
  { id: "build", name: "Builds & Code", cats: ["build"] },
  { id: "aero", name: "Aerospace", cats: ["aero"] },
  { id: "edu", name: "Education", cats: ["edu"] },
  { id: "all", name: "Everything", all: true },
];

const L = {
  vlabDemo: "https://vlabcb.vercel.app",
  vlabCode: "https://github.com/mgupta646/vlabcb",
  aviationDemo: "https://aviation-chat.vercel.app/",
  aviationCode: "https://github.com/mgupta646/Aviation-Crisis-Intelligence",
  citiTableau: "https://public.tableau.com/app/profile/mehul.gupta7649/viz/Citibike1_17764341788430/DASHBOARD",
  citiSite: "https://mgupta646.github.io/CITIDASH/",
  qr: "https://chromewebstore.google.com/detail/qr-code-generator-pro/pfhgpgpkbknddkofmgknfeoaglljgbfb",
  mbrowser: "https://www.linkedin.com/feed/update/urn:li:activity:7449319946746122240/",
  devfest: "https://www.linkedin.com/feed/update/urn:li:activity:7505994439463456768/",
  tandon: "https://engineering.nyu.edu/academics/departments/technology-management-and-innovation/industry-engagement/industry-innovation",
  ijert: "https://www.ijert.org/design-analysis-of-low-cost-subsonic-open-section-wind-tunnel",
  bootcamp: "https://credentials.engineering.nyu.edu/81782623-77bf-4653-9e33-b6446e14842d",
  certs: "https://www.linkedin.com/in/mehulmg/details/certifications/",
  macys: "https://www.linkedin.com/feed/update/urn:li:share:7414014951171870720/",
};

const SECTIONS = [
  /* ------------------------------------------------------------------ */
  {
    id: "home", cat: "life", icon: "house",
    title: "About Mehul",
    subtitle: "Home · Brooklyn, NY",
    blurb: "Mehul's home base. He trained as an aerospace engineer, where a wrong assumption breaks a part, and now builds AI products with the same discipline.",
    blocks: [
      { type: "quote", text: "I build AI products and make the data underneath them correct." },
      { type: "facts", items: [
        ["Based", "Brooklyn, NY"],
        ["Graduating", "December 2026 · NYU"],
        ["Available", "January 2027"],
        ["Work authorization", "F-1 OPT · STEM eligible"],
        ["Relocation", "Open to relocating"],
      ]},
      { type: "p", text: "I came to AI products from <b>aerospace engineering</b>, where a wrong input assumption doesn't produce a slightly wrong answer. It produces a part that fails. I still work that way." },
      { type: "p", text: "Most of my work is less about models than about the layer beneath them: whether an <b>evaluation measures what it claims to</b>, whether a <b>data source means what its name implies</b>, and what users <b>actually did</b>, not just what they said in a session." },
      { type: "stats", items: [
        { v: "2M+", l: "trip records analyzed" },
        { v: "6 × 40", l: "LLM providers × rubric points" },
        { v: "Top 30", l: "Ferrocampus 2025" },
      ]},
      { type: "links", items: [
        { label: "LinkedIn", url: PROFILE.linkedin },
        { label: "GitHub", url: PROFILE.github },
        { label: "Tableau Public", url: PROFILE.tableau },
        { label: "Portfolio PDF", url: PROFILE.pdf, kind: "download" },
      ]},
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: "vlab", cat: "ai", icon: "robot",
    title: "V-Lab Research Assistant",
    subtitle: "AI Lab · NYU Stern Volatility and Risk Institute",
    blurb: "BEEP BOOP! I'm the V-Lab assistant. Mehul built me end to end for NYU Stern, and he benchmarked 6 LLM providers before choosing my model.",
    blocks: [
      { type: "callout", title: "Graduate Assistant, Director's Office · Jan – Jun 2026", text: "NYU Stern Volatility and Risk Institute, working with Nobel Laureate Prof. Robert F. Engle and Prof. Richard Berner." },
      { type: "stats", items: [
        { v: "6", l: "LLM providers benchmarked" },
        { v: "40", l: "point rubric, built twice" },
        { v: "3", l: "architectures to production" },
      ]},
      { type: "p", text: "V-Lab is the institute's public risk platform for analysts, researchers and practitioners. I owned its multi-agent AI assistant <b>end to end</b>: scoping, design, implementation, launch and post-launch iteration across volatility, systemic-risk (SRISK) and illiquidity research. It took three successive architectures to get it right." },
      { type: "h", text: "The decision that mattered" },
      { type: "p", text: "Choosing a model meant building the evaluation first. I ran identical inputs through six providers against a 40-point rubric. Partway through, I found the rubric <b>couldn't tell a correct answer from a fluent one</b>. The scores were measuring confidence, not correctness. I rebuilt the criteria, re-scored everything, and presented a primary and a parallel recommendation to faculty leadership, including a Nobel Laureate." },
      { type: "flow", caption: "Fig. 1: Catching that the first rubric rewarded confident phrasing forced a rebuild before any model was chosen.", steps: [
        { t: "Evaluate", d: "Identical inputs across 6 providers" },
        { t: "Rubric v1", d: "40 pts: accuracy · depth · reasoning" },
        { t: "Diagnose", d: "Scores tracked fluency, not accuracy", warn: true },
        { t: "Rubric v2", d: "Rebuilt criteria, re-scored all 6" },
        { t: "Decide", d: "Primary + parallel option to leadership", ok: true },
      ]},
      { type: "h", text: "After launch: let the logs decide" },
      { type: "quote", text: "Users tell you what they want in a session. The logs tell you what they tried at 11pm and gave up on." },
      { type: "flow", loop: true, caption: "Fig. 2: Post-launch loop. Failure frequency set the order of work.", steps: [
        { t: "Live assistant", d: "Deployed on V-Lab" },
        { t: "Usage logs", d: "Real sessions mined" },
        { t: "Coverage gaps", d: "Ranked by frequency" },
        { t: "Fix routing", d: "Rebuild KB routing, largest gap first" },
      ]},
      { type: "img", src: "assets/shots/vlab.png", cap: "Public demo: domain navigation, topic selection and the assistant interface." },
      { type: "links", items: [
        { label: "Open live demo", url: L.vlabDemo },
        { label: "View source code", url: L.vlabCode },
      ]},
      { type: "tags", items: ["Multi-agent architecture", "LLM evaluation", "Tool calling", "Knowledge-base routing", "Usage analytics"] },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: "rosi", cat: "ai", icon: "turbine",
    title: "ROSI AI Platform",
    subtitle: "Green Energy Park · NYU Stern Center for Sustainable Business",
    blurb: "These turbines power ROSI, a client-facing sustainability AI platform. Mehul owns its requirements and caught a data flaw nobody asked him to check.",
    blocks: [
      { type: "callout", title: "AI Product Graduate Fellow · Aug 2026 – Present", text: "NYU Stern Center for Sustainable Business. I build the data pipelines and multi-agent LLM workflows behind a client-facing AI platform, and I own the requirements document engineering builds against." },
      { type: "p", text: "The brief arrived incomplete, with a <b>fixed December 31 alpha date</b>. My first job was turning it into a scoped delivery plan. The work spans four linked SASB/ROSI data tables, LLM/MCP prototypes and build-versus-license analysis." },
      { type: "h", text: "A clean source can still answer the wrong question" },
      { type: "p", text: "I had catalogued state-average electricity prices as a usable input: published, clean, easy to query. When the work moved to estimating what a <b>specific client</b> would pay, I checked what that number actually is: total revenue divided by total electricity sold. <b>No customer is ever charged that price.</b> I rebuilt that part of the data layer on filed tariff schedules. Nobody asked me to check; the stated requirement was met, but the client's real problem wasn't." },
      { type: "compare", caption: "Fig. 3: The averaging step is where the error lived.",
        left: { label: "Rejected input", title: "State-average price", formula: "total revenue ÷ total kWh sold", items: ["✗ Fixed fees averaged away", "✗ Tiered rates averaged away", "✗ Demand charges averaged away"], foot: "Fine for regional comparison. Wrong for a client estimate." },
        right: { label: "Adopted input", title: "Filed tariff schedules", formula: "rate structure + client usage", items: ["✓ Fixed fees retained", "✓ Tiered rates retained", "✓ Demand charges retained"], foot: "An estimate that survives contact with a real bill." } },
      { type: "h", text: "Turning a delivery preference into an enforceable requirement" },
      { type: "p", text: "The platform was going to ship to each client as static files, and control ends the moment a file lands. I worked through the cost, access-control and latency trade-offs with engineering and moved delivery to <b>API-served licensing with server-side validation</b>, then handed over a precise requirement, not a preference." },
      { type: "flow", caption: "Fig. 4: Validation moved server-side, so entitlement stays enforceable after delivery.", steps: [
        { t: "Client request", d: "Ask for licensed access" },
        { t: "API service", d: "Controlled delivery" },
        { t: "Validation", d: "Check entitlement on every request", ok: true },
        { t: "Response", d: "Serve authorized output" },
      ]},
      { type: "stats", items: [
        { v: "4", l: "linked SASB / ROSI tables" },
        { v: "Dec '26", l: "alpha target" },
        { v: "API", l: "licensing + server-side validation" },
      ]},
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: "magic", cat: "ai", icon: "magic",
    title: "MaGic Filter",
    subtitle: "Wizard Tower · Natural-language filtering for BI dashboards · under IP review",
    blurb: "Inside this tower is MaGic Filter: ask a dashboard a question in plain English and it filters itself. It's currently under IP review.",
    blocks: [
      { type: "p", text: "Dashboard filtering is a clicking problem. You know the question you want to ask, then spend a minute translating it into a sequence of dropdowns. <b>MaGic Filter takes the question in plain language and applies the filter</b>, connecting an AI interaction to the BI workflow people already use." },
      { type: "flow", caption: "Interaction design: an illustrative request becomes a filtered view.", steps: [
        { t: "Ask", d: "“Show member trips on weekdays after 5 PM.”" },
        { t: "Interpret", d: "Map intent to dashboard fields" },
        { t: "Apply", d: "Update the relevant BI filters" },
        { t: "Explore", d: "Inspect the resulting view" },
      ]},
      { type: "h", text: "From idea to practitioner feedback" },
      { type: "list", items: [
        "Built and deployed the extension with an LLM (Groq LLaMA-3.3-70B) behind Vercel Edge Functions, <b>with the API key kept server-side</b>",
        "Demoed it to practitioners in the BI user community, people with no reason to be generous",
        "Earned interest from community leaders and an <b>invitation to present at a regional user group</b>",
        "Used that feedback to learn where integration friction lives and how people expect a dashboard to behave",
      ]},
      { type: "callout", title: "What this demonstrates", text: "Product discovery, dashboard integration, AI application delivery and clear technical demos." },
      { type: "tags", items: ["LLM", "Tableau Extensions API", "Vercel Edge", "Prompt design", "Product discovery"] },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: "aviation", cat: "data", icon: "plane",
    title: "Aviation Crisis Intelligence",
    subtitle: "Airfield · D3.js · JavaScript · Node.js API · Groq · Vercel",
    blurb: "This jet is a dashboard! Aviation Crisis Intelligence tracks how conflicts and oil shocks hit 25 airlines, and you can filter it just by asking.",
    blocks: [
      { type: "stats", items: [
        { v: "9", l: "linked chart views" },
        { v: "25", l: "airlines" },
        { v: "8", l: "geopolitical phases, 2019–2026" },
      ]},
      { type: "p", text: "A linked dashboard exploring fuel prices, airline economics and route disruption. The views share phase, region and carrier filters, and a <b>natural-language filter assistant</b> turns a typed question into chart state." },
      { type: "img", src: "assets/shots/aviation.png", cap: "Fuel-price view from the live prototype. Values are prototype inputs." },
      { type: "flow", steps: [
        { t: "Question", d: "Natural-language request" },
        { t: "Serverless API", d: "Groq returns structured filter intent" },
        { t: "Dashboard state", d: "Filters apply, charts re-render", ok: true },
      ]},
      { type: "list", items: [
        "<b>Frontend:</b> D3.js views with shared JavaScript filter state, plus global and chart-specific controls for different depths of exploration",
        "<b>Backend:</b> a Node.js API proxy keeps the model key server-side; its response connects the chat to the chart filters",
      ]},
      { type: "links", items: [
        { label: "Open live prototype", url: L.aviationDemo },
        { label: "Inspect code", url: L.aviationCode },
      ]},
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: "citibike", cat: "data", icon: "bike",
    title: "Citi Bike Analytics",
    subtitle: "Bike Dock · Python + SQL + Tableau · 2M+ trips",
    blurb: "Ding ding! 2 million+ Citi Bike trips, cleaned in Python and SQL and published as a dashboard you can talk to.",
    blocks: [
      { type: "stats", items: [
        { v: "2M+", l: "trip records analyzed" },
        { v: "Sep '24", l: "NYC trip data" },
        { v: "Chat", l: "conversational interface" },
      ]},
      { type: "p", text: "The goal: make a large dataset useful for operating decisions. I cleaned and analyzed trip records in Python and SQL, built views of station demand and rider behavior, and added a <b>conversational interface</b> so people can ask questions in plain language instead of writing queries." },
      { type: "flow", steps: [
        { t: "Prepare", d: "Clean & structure trip records" },
        { t: "Analyze", d: "SQL / Python usage patterns" },
        { t: "Visualize", d: "Station, time & rider views" },
        { t: "Explore", d: "Filters + conversational Q&A" },
      ]},
      { type: "gallery", items: [
        { src: "assets/shots/citibike-map.png", cap: "Trip origins by station" },
        { src: "assets/shots/citibike-heatmap.png", cap: "Hour × day volume, casual riders" },
      ]},
      { type: "list", title: "Questions the dashboard answers", items: [
        "Where do trips start, and which station clusters carry the most demand?",
        "How does usage shift by hour and day, and how do members differ from casual riders?",
        "How do trip duration and distance change across rider segments?",
      ]},
      { type: "links", items: [
        { label: "Live Tableau dashboard", url: L.citiTableau },
        { label: "Product analytics site", url: L.citiSite },
      ]},
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: "bi", cat: "data", icon: "billboard",
    title: "BI Dashboard Gallery",
    subtitle: "Billboard · Tableau & Power BI",
    blurb: "The town billboard runs Mehul's dashboards: HR attrition, hotel revenue, e-commerce and sales, in Tableau and Power BI.",
    blocks: [
      { type: "p", text: "Tableau dashboards and Power BI case studies across business domains, each built to move from a headline metric to the questions behind it." },
      { type: "cards", items: [
        { title: "HR / People Analytics", sub: "Tableau · sample employee dataset", img: "assets/shots/hr-attrition.png", text: "Segment attrition by role and department, then explore income, age and overtime patterns.", links: [{ label: "Open dashboard", url: "https://public.tableau.com/app/profile/mehul.gupta7649/viz/HRANALYTICS_17776058072060/Dashboard2" }] },
        { title: "Hospitality Revenue", sub: "Power BI · guided Codebasics case", img: "assets/shots/hospitality-powerbi.png", text: "Relate hotel, room and booking data; explore revenue, occupancy, ADR and RevPAR with slicers and weekly views.", links: [{ label: "Open project", url: "https://github.com/mgupta646/power-Bi-dashboards" }] },
        { title: "E-commerce Performance", sub: "Power BI · sample sales case", img: "assets/shots/ecommerce-powerbi.png", text: "Sales, profit, quantity, products and geography, from headline performance down to the underlying mix.", links: [{ label: "Open project", url: "https://github.com/mgupta646/power-Bi-dashboards" }] },
      ]},
      { type: "links", items: [
        { label: "All Tableau work", url: PROFILE.tableau },
        { label: "AdventureWorks sales dashboard", url: "https://public.tableau.com/app/profile/mehul.gupta7649/viz/AdventureWorksSalesDashboard20152017/Dashboard1" },
      ]},
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: "apps", cat: "build", icon: "stall",
    title: "Software Studio",
    subtitle: "Desktop browser · Chrome Web Store extension · Google developer communities",
    blurb: "Mehul ships real software: a desktop browser for Windows and Mac, and a QR tool published on Google's Chrome Web Store.",
    blocks: [
      { type: "cards", items: [
        {
          title: "QR Code Generator Pro",
          sub: "Published on the Google Chrome Web Store · Apr 2026",
          img: "assets/shots/qr-extension.png",
          text: "A toolbar tool that picks up the current tab's URL and generates customizable QR codes: 6 dot styles, 3 corner styles, full color control and PNG/JPG export. Processing is <b>100% local</b>, with no server round trip.",
          flow: [
            { t: "Toolbar", d: "Use current tab URL" },
            { t: "Configure", d: "Colors & QR style" },
            { t: "Generate", d: "Local rendering" },
            { t: "Export", d: "PNG or JPG" },
          ],
          links: [{ label: "Chrome Web Store listing", url: L.qr }],
        },
        {
          title: "M Browser",
          sub: "Desktop browser for Windows & Mac · Mar 2026 – Present",
          img: "assets/shots/mbrowser.png",
          text: "Started on a PyQt foundation for navigation, tabs and desktop interactions, then reworked major layers as it grew into <b>privacy controls, ad blocking, packaging</b> and platform-specific UI. <b>The engineering call:</b> adapt each version to Windows or Mac instead of forcing one desktop interface.",
          links: [{ label: "M Browser project post", url: L.mbrowser }],
          tags: ["PyQt", "Cross-platform", "Privacy", "Ad blocking", "Packaging"],
        },
        {
          title: "Developer communities",
          sub: "Google Chrome Web Store developer · Google DevFest / GDG · Tableau developer groups",
          text: "A published developer on Google's Chrome Web Store and a participant in Tableau developer groups. At Google DevFest / GDG workshops I practiced <b>agentic data-engineering patterns</b>: data grounding, code-level guardrails, persistent state and independent evaluation.",
          links: [{ label: "DevFest workshop post", url: L.devfest }],
        },
      ]},
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: "dev", cat: "build", icon: "pc",
    title: "Dev Desk",
    subtitle: "Python automation · conversational analytics",
    blurb: "Mehul's battle station. It runs an 8,000-contact async outreach engine and a chat assistant for AdventureWorks sales data.",
    blocks: [
      { type: "cards", items: [
        {
          title: "Recruiter Outreach System",
          sub: "Python · asyncio · 8,000-contact database",
          text: "An asynchronous outreach pipeline with role-based attachment routing, rate limiting and duplicate-send prevention. I built it for my own job search, so every operational mistake had an immediate cost to me as the user.",
          flow: [
            { t: "Select", d: "Pick relevant recipients" },
            { t: "Route", d: "Match role + attachments" },
            { t: "Pace", d: "Rate-limit outbound work" },
            { t: "Guard", d: "Prevent duplicate sends", ok: true },
          ],
          tags: ["Python", "asyncio", "Rate limiting", "Idempotency"],
        },
        {
          title: "AdventureWorks Analytics Assistant",
          sub: "Conversational analytics companion",
          text: "A chat assistant that answers questions over AdventureWorks sales data, paired with a published Tableau dashboard of the same data.",
          links: [
            { label: "Live assistant", url: "https://awwchat.vercel.app" },
            { label: "Code", url: "https://github.com/mgupta646/awwchat" },
            { label: "Tableau dashboard", url: "https://public.tableau.com/app/profile/mehul.gupta7649/viz/AdventureWorksSalesDashboard20152017/Dashboard1" },
          ],
        },
      ]},
      { type: "links", items: [{ label: "Everything on GitHub", url: PROFILE.github }] },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: "flowmind", cat: "build", icon: "train",
    title: "FlowMind AI",
    subtitle: "Rail Station · Multi-agent approach to rail congestion · Top 30, Ferrocampus 2025",
    blurb: "All aboard the FlowMind Express! Mehul's four-person team placed in the global Top 30 at Ferrocampus 2025 with a multi-agent approach to rail congestion.",
    blocks: [
      { type: "stats", items: [
        { v: "Top 30", l: "globally, Ferrocampus 2025" },
        { v: "4", l: "person team" },
        { v: "NYU", l: "featured on Tandon's innovation page" },
      ]},
      { type: "p", text: "We co-developed a <b>simulation-based, multi-agent concept</b> for rail congestion, turning an operational challenge into a technical concept and a competition submission." },
      { type: "flow", caption: "The concept's three jobs.", steps: [
        { t: "Predict", d: "Anticipate congestion" },
        { t: "Guide", d: "Distribute passengers" },
        { t: "Oversee", d: "Operators stay in control", ok: true },
      ]},
      { type: "links", items: [{ label: "NYU Tandon innovation feature", url: L.tandon }] },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: "library", cat: "data", icon: "books",
    title: "Skill Library",
    subtitle: "Bookshelf · Toolkit + SQL, Python & BI foundations",
    blurb: "Every book here is a tool Mehul uses daily: Python, SQL, BI, LLM APIs and evaluation design. Real SQL included.",
    blocks: [
      { type: "tags", title: "AI systems", items: ["Multi-agent architecture", "LLM tool calling", "Retrieval & KB routing", "Evaluation design", "Prompt engineering", "Provider benchmarking", "MCP"] },
      { type: "tags", title: "Engineering", items: ["Python", "SQL", "JavaScript", "REST / LLM APIs", "Data pipelines & ETL", "PostgreSQL", "DuckDB", "Git", "Vercel", "D3.js", "PyQt", "Chrome extensions"] },
      { type: "tags", title: "Data & BI", items: ["Tableau", "Power BI / DAX", "SQL / MySQL", "pandas", "NumPy", "Excel", "Data cleaning", "Linked tables", "Source-quality checks"] },
      { type: "tags", title: "Product", items: ["Discovery & requirements", "Specs & roadmaps", "Usage / behavioral analysis", "Release criteria", "Jira", "Confluence"] },
      { type: "h", text: "Instagram-clone analysis: a 7-table schema" },
      { type: "code", caption: "A real query: users with no posts. The LEFT JOIN keeps every user; a NULL photo marks an account that never posted.", text: "SELECT u.username\nFROM ig_clone.users u\nLEFT JOIN ig_clone.photos p\n  ON p.user_id = u.id\nWHERE p.id IS NULL;" },
      { type: "cards", items: [
        { title: "Instagram-clone SQL", sub: "MySQL joins, aggregates, views", links: [{ label: "Inspect", url: "https://github.com/mgupta646/SQL_Tableau_InstagramClone-main" }] },
        { title: "NYC Taxi HiveQL", sub: "Schema, ingestion, fare & tip metrics", links: [{ label: "Inspect", url: "https://github.com/mgupta646/YellowTaxiNYC_HiveCaseStudy-main" }] },
        { title: "Movie-industry EDA", sub: "pandas: budgets, gross, genre, margins", links: [{ label: "Inspect", url: "https://github.com/mgupta646/Python_MoviesIndustry_EDA-main" }] },
        { title: "King County Housing", sub: "Tableau workbook & repo visual", links: [{ label: "Inspect", url: "https://github.com/mgupta646/Tableau-Dashboard" }] },
      ]},
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: "nyu", cat: "edu", icon: "capNYU",
    title: "MS, Management of Technology",
    subtitle: "NYU Tandon School of Engineering · December 2026",
    blurb: "A violet NYU cap! MS in Management of Technology at NYU Tandon. Mehul graduates in December 2026 on a full scholarship.",
    blocks: [
      { type: "facts", items: [
        ["Degree", "MS, Management of Technology"],
        ["School", "NYU Tandon School of Engineering"],
        ["Dates", "Sep 2025 – Dec 2026"],
        ["Credits", "36 / 36 planned"],
        ["Funding", "Full scholarship, Government of India"],
      ]},
      { type: "h", text: "Coursework" },
      { type: "courses", terms: [
        { term: "Fall 2025", items: ["Economics & Strategy", "Operations Management", "Global Innovation"] },
        { term: "Spring 2026", items: ["Organizational Behavior", "Financial Analysis for Tech Managers", "Data Visualization for Business Intelligence"] },
        { term: "Summer 2026", items: ["Project Management", "Programming for Business Intelligence & Analytics", "Data Engineering", "Technology Strategy"] },
        { term: "Fall 2026 · in progress", items: ["Marketing", "Entrepreneurship", "MOT Capstone Project"], current: true },
      ]},
      { type: "callout", title: "From the classroom: Retail Ops case study", text: "My Operations Management team's Macy's process-strategy case lives in the Department Store, downtown." },
      { type: "callout", title: "NYU Data Science Bootcamp · badge, Dec 2025", text: "A 9-week program covering Python, data preparation, EDA, SQL and applied ML, with weekly technical assignments and a team solution presented to industry professionals." },
      { type: "links", items: [{ label: "View NYU credential", url: L.bootcamp }] },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: "retail", cat: "edu", icon: "store",
    title: "Retail Process Strategy: Macy's",
    subtitle: "Department Store · NYU Operations Management case study",
    blurb: "A department store? This is Mehul's Operations Management case: mapping where shoppers wait and the systems behind it.",
    blocks: [
      { type: "p", text: "In a four-person course team, I analyzed Macy's process strategy: how a high-volume retailer can improve flow <b>without losing personalized service</b>. My contribution focused on <b>service blueprinting</b>, Heizer's process framework and the case for <b>mass customization</b>." },
      { type: "compare", neutral: true, caption: "Service blueprint: connect customer-facing friction to the operating system behind it.",
        left: { label: "Frontstage", title: "Customer experience", items: ["Queues", "Associate availability", "Fitting assistance"], foot: "Where the customer waits, and where personal service creates variability." },
        right: { label: "Backstage", title: "Operating support", items: ["Inventory visibility", "System lag", "Team flexibility"], foot: "The processes, information and staffing behind that friction." } },
      { type: "h", text: "From diagnosis to recommendation" },
      { type: "p", text: "I explored mass customization as a way to balance repeatable work with high-touch service. The team proposed cross-training and process changes, alongside a <b>DMAIC-based checkout redesign</b> and a cost-of-quality assessment." },
      { type: "stats", items: [
        { v: "97%", l: "proposed payment-success target" },
        { v: "3", l: "quality KPIs defined" },
        { v: "DMAIC", l: "checkout redesign" },
      ]},
      { type: "list", title: "Quality KPIs the team proposed", items: [
        "<b>Payment success</b>: successful payments ÷ attempts",
        "<b>Payment time</b>: average time to complete a payment",
        "<b>Crash frequency</b>: online payment failures tracked over time",
      ]},
      { type: "links", items: [{ label: "Professor's public project summary", url: L.macys }] },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: "teaching", cat: "edu", icon: "chalk",
    title: "Graduate Teaching Fellow",
    subtitle: "Chalkboard · NYU Stern · Futures and Options (FINC-GB 6043)",
    blurb: "Options payoff diagrams on a chalkboard: Mehul is a Graduate Teaching Fellow for Futures & Options at NYU Stern.",
    blocks: [
      { type: "callout", title: "Graduate Teaching Fellow · Aug 2026 – Present", text: "NYU Stern, FINC-GB 6043 Futures and Options, with Professor Menachem Brenner." },
      { type: "p", text: "I support futures and options instruction through <b>office hours, problem sets and grading</b>, translating futures pricing, binomial option models and risk frameworks into clear material for a graduate cohort with mixed quantitative backgrounds." },
      { type: "p", text: "Teaching is the same skill as writing a good requirement: find exactly where someone's mental model breaks, then fix that, not everything around it." },
      { type: "tags", items: ["Futures pricing", "Binomial options", "Risk frameworks", "Office hours", "Assessment"] },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: "conference", cat: "edu", icon: "stage",
    title: "Conferences & Delivery",
    subtitle: "Conference Stage · NYU Stern VRI · SoFiE",
    blurb: "Mehul ran speakers, registration and on-site operations for a 275-person conference at NYU Stern's Volatility and Risk Institute.",
    blocks: [
      { type: "stats", items: [
        { v: "275", l: "conference attendees" },
        { v: "5+", l: "partner universities (SoFiE)" },
        { v: "3", l: "workstreams run in parallel" },
      ]},
      { type: "cards", items: [
        { title: "275-attendee conference", sub: "NYU Stern Volatility and Risk Institute", text: "Coordinated the speaker, registration and on-site workstreams, keeping deadlines, stakeholders and execution on one shared event schedule." },
        { title: "SoFiE: Society for Financial Econometrics", sub: "Graduate Assistant, Administration · 2026", text: "Primary coordinator for the annual SoFiE conference with partners including MIT, Duke, Johns Hopkins, the University of Toronto and the University of Copenhagen. I also ran its digital presence and email campaigns." },
      ]},
      { type: "p", text: "Events are delivery projects with a hard, public deadline: nothing ships late, and every dependency shows up on the day." },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: "cu", cat: "edu", icon: "capCU",
    title: "BE, Aerospace Engineering",
    subtitle: "Chandigarh University · May 2024",
    blurb: "A Chandigarh University cap: Bachelor of Engineering in Aerospace, class of May 2024.",
    blocks: [
      { type: "facts", items: [
        ["Degree", "BE, Aerospace Engineering"],
        ["School", "Chandigarh University"],
        ["Dates", "Aug 2020 – May 2024"],
      ]},
      { type: "list", items: [
        "Propulsion trade studies and simulation in <b>ANSYS, SolidWorks and Fusion 360</b>, with simulation runs automated in <b>Python</b>",
        "Co-authored a <b>wind-tunnel design paper</b> (IJERT, 2024)",
        "Fabrication leadership on a <b>Guinness World Record</b> hydro-rocketry project (2023)",
        "<b>NASA Space Apps Challenge</b> Regional Gold (2023)",
        "Autodesk <b>CAD / CAM / CAE</b> specialization: Fusion 360 design, simulation and manufacturing (Jan 2022)",
        "Astronomy Club Executive Council, part of a 4,000+ member network",
      ]},
      { type: "p", text: "Visit the <b>Aerospace Base</b> in the south-east to see the rocket, the wind tunnel and the telescope." },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: "rocket", cat: "aero", icon: "rocket",
    title: "Hydro-Rocketry World Record",
    subtitle: "Launch Pad · Guinness World Record, 2023",
    blurb: "T-minus 10! This rocket honors a Guinness World Record hydro-rocketry project where Mehul led fabrication. Want to launch it?",
    launch: true,
    blocks: [
      { type: "stats", items: [
        { v: "GWR", l: "Guinness World Record, 2023" },
        { v: "Gold", l: "NASA Space Apps Regional, 2023" },
        { v: "BE", l: "Aerospace Engineering" },
      ]},
      { type: "callout", title: "Fabrication Lead · Dec 2022 – Mar 2023", text: "I guided the fabrication team through safety checks, testing procedures and build cycles across university departments, trained students on workshop tools, and hosted demos and awareness drives to build campus participation." },
      { type: "quote", text: "In a physical system, a wrong assumption doesn't degrade the output gracefully. It breaks the part. Every case study here is that habit applied to software." },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: "windtunnel", cat: "aero", icon: "tunnel",
    title: "Wind-Tunnel Research",
    subtitle: "Wind Tunnel · Co-authored paper, IJERT 2024",
    blurb: "A wind tunnel! Mehul co-authored a 2024 IJERT paper on designing a low-cost subsonic open-section tunnel.",
    blocks: [
      { type: "callout", title: "Design Analysis of a Low-Cost Subsonic Open-Section Wind Tunnel", text: "Co-authored · International Journal of Engineering Research & Technology (IJERT), 2024" },
      { type: "p", text: "Propulsion and wind-tunnel work using <b>ANSYS, SolidWorks and Fusion 360</b>, with <b>Python</b> automating simulation runs. Interrogating inputs before trusting results is a habit I learned here and still apply to every data source." },
      { type: "flow", caption: "My engineering toolchain.", steps: [
        { t: "Design", d: "CAD in SolidWorks / Fusion 360" },
        { t: "Simulate", d: "Analysis in ANSYS" },
        { t: "Automate", d: "Python-driven simulation runs" },
        { t: "Publish", d: "IJERT, 2024", ok: true },
      ]},
      { type: "links", items: [{ label: "Read the paper", url: L.ijert }] },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: "astro", cat: "aero", icon: "telescope",
    title: "Astronomy Club",
    subtitle: "Telescope · Chandigarh University Astronomy Club",
    blurb: "Mehul helped lead a 4,000+ member astronomy network that worked with 20+ universities on Astronomy and Space Week.",
    blocks: [
      { type: "callout", title: "Executive Council · Nov 2021 – Jul 2024 | Administrative Incharge · Jun 2023 – Apr 2024", text: "Chandigarh University Astronomy Club" },
      { type: "stats", items: [
        { v: "4,000+", l: "students & volunteers" },
        { v: "20+", l: "universities on Astronomy & Space Week" },
        { v: "★", l: "secured observational equipment" },
      ]},
      { type: "list", items: [
        "Led a network of 4,000+ students and volunteers through workshops, events and outreach",
        "Collaborated with 20+ universities on Astronomy and Space Week",
        "Secured support for the club's observational equipment",
        "Mentored junior members and managed volunteer teams",
      ]},
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: "trophy", cat: "life", icon: "trophy",
    title: "Trophy Case",
    subtitle: "Awards, honors & credentials",
    blurb: "The trophy case: NASA Space Apps Regional Gold, a Guinness World Record, Top 30 at Ferrocampus, a published paper and more.",
    blocks: [
      { type: "trophies", items: [
        { t: "NASA Space Apps Challenge", d: "Regional Gold · 2023", k: "gold" },
        { t: "Guinness World Record", d: "Hydro-rocketry, fabrication lead · 2023", k: "gold" },
        { t: "Full Scholarship", d: "Government of India, academic excellence", k: "gold" },
        { t: "International Roller-skating", d: "Gold Medal", k: "gold" },
        { t: "Ferrocampus 2025", d: "Top 30 globally · FlowMind AI", k: "silver" },
        { t: "NYU Tandon feature", d: "FlowMind AI on the innovation page", k: "silver" },
        { t: "Published paper", d: "Wind-tunnel design · IJERT 2024", k: "silver" },
        { t: "Chrome Web Store", d: "Published Google Chrome developer", k: "bronze" },
        { t: "Regional user group", d: "Invited to present MaGic Filter", k: "bronze" },
      ]},
      { type: "h", text: "Credentials" },
      { type: "tags", items: ["NYU Data Science Bootcamp (badge)", "Google: Foundations of Data Science", "Google AI Essentials", "Google: Foundations of Project Management", "Autodesk CAD/CAM/CAE Specialization"] },
      { type: "links", items: [
        { label: "NYU bootcamp credential", url: L.bootcamp },
        { label: "All certifications", url: L.certs },
      ]},
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: "gym", cat: "life", icon: "dumbbell",
    title: "The Gym",
    subtitle: "Healthy body, sharp mind",
    blurb: "Welcome to the GYM! Mehul stays sharp through steady training, and he's an international roller-skating gold medalist.",
    blocks: [
      // TODO(Mehul): personalise with your routine, sports and goals
      { type: "p", text: "Training is a daily habit for me. The discipline carries straight into how I ship work: show up, track progress, and fix the weakest link first." },
      { type: "stats", items: [
        { v: "Gold", l: "International roller-skating" },
        { v: "Daily", l: "training habit" },
        { v: "∞", l: "consistency > intensity" },
      ]},
      { type: "list", items: [
        "<b>International Roller-skating Gold Medal</b>",
        "Regular strength training and conditioning",
      ]},
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: "contact", cat: "life", icon: "mail",
    title: "Let's Talk",
    subtitle: "Mailbox",
    blurb: "You've got mail! Mehul graduates December 2026 and is available January 2027. He's open to relocating.",
    blocks: [
      { type: "p", text: "I'm looking for roles in <b>AI product, AI engineering and analytics</b>, where getting the data and the evaluation right is part of the job. I graduate in <b>December 2026</b>, I'm available from <b>January 2027</b>, and I'm open to relocating (F-1 OPT, STEM eligible)." },
      { type: "links", big: true, items: [
        { label: "✉ mg8671@nyu.edu", url: "mailto:mg8671@nyu.edu" },
        { label: "LinkedIn", url: PROFILE.linkedin },
        { label: "GitHub", url: PROFILE.github },
        { label: "Tableau Public", url: PROFILE.tableau },
        { label: "⬇ Portfolio PDF", url: PROFILE.pdf, kind: "download" },
      ]},
    ],
  },
];

/* Lines for NPCs, signs and the tour guide */
const NPC_LINES = {
  guide: [
    "Hello there! Welcome to MEHUL TOWN!",
    "Every building here is a piece of Mehul's work: AI products, data, software, aerospace and more.",
    "Walk up to anything with a sign and its story opens. Want me to show you around? Press the red TOUR button on the left!",
  ],
  guideIdle: [
    "Need directions? Press the red TOUR button on the left and I'll walk you around!",
    "In a hurry? QUICK VIEW (top right) puts everything on one page.",
  ],
  jogger: [
    "Huff... huff... Mehul says consistency beats intensity!",
    "The GYM is right next to the track. Go check it out!",
  ],
  pilot: [
    "Welcome to the airfield! That jet is really a dashboard.",
    "It tracks how conflicts and oil shocks hit 25 airlines. Walk up to the plane!",
  ],
  conductor: [
    "Next train: the FlowMind Express!",
    "It's named after Mehul's Top 30 Ferrocampus project on rail congestion. Check out the station.",
  ],
  sign: [
    "MEHUL TOWN: where data meets the sky.",
    "↑ Campus · AI Lab   ← Home · Downtown   → Dev Deck · Airfield   ↓ Gym · Trophies · Aerospace · Station",
  ],
  cat: ["Mrrrow... (The cat is napping on the warm flowers.)"],
  dog: ["Woof! (Byte wags happily. Byte follows Mehul everywhere.)"],
  done: [
    "You've explored ALL of Mehul Town! 🎉",
    "Mehul graduates in December 2026 and is available from January 2027.",
    "Let's talk: mg8671@nyu.edu",
  ],
};
