"""
sources.py — canonical list of all policy sources to crawl.

Each entry:
  category  : top-level grouping
  label     : human-readable name
  url       : seed URL (crawler starts here)
  keywords  : if non-empty, only store pages whose text contains ≥1 keyword
               (case-insensitive). Leave empty [] to store everything found.
"""

SOURCES = [
    # ── 1. Vendor Policies ──────────────────────────────────────────────────
    {
        "category": "Vendor Policy",
        "label": "OpenAI",
        "url": "https://openai.com/policies",
        "keywords": ["policy", "terms", "privacy", "usage", "education"],
    },
    {
        "category": "Vendor Policy",
        "label": "Google Workspace for Education",
        "url": "https://workspace.google.com/terms/education_terms.html",
        "keywords": [],
    },
    {
        "category": "Vendor Policy",
        "label": "Google Policies",
        "url": "https://policies.google.com/",
        "keywords": ["education", "ai", "data", "privacy"],
    },
    {
        "category": "Vendor Policy",
        "label": "Microsoft Trust Center",
        "url": "https://www.microsoft.com/en-us/trust-center",
        "keywords": ["education", "ai", "data", "privacy", "compliance"],
    },
    {
        "category": "Vendor Policy",
        "label": "Microsoft Compliance",
        "url": "https://learn.microsoft.com/en-us/compliance/",
        "keywords": ["education", "ai", "data", "privacy"],
    },
    {
        "category": "Vendor Policy",
        "label": "Anthropic Legal",
        "url": "https://www.anthropic.com/legal",
        "keywords": [],
    },
    {
        "category": "Vendor Policy",
        "label": "Canvas (Instructure)",
        "url": "https://www.instructure.com/policies",
        "keywords": [],
    },
    {
        "category": "Vendor Policy",
        "label": "Blackboard Legal",
        "url": "https://www.blackboard.com/legal",
        "keywords": [],
    },

    # ── 2. State Attorney General Offices ───────────────────────────────────
    {
        "category": "State AG",
        "label": "California AG",
        "url": "https://oag.ca.gov/",
        "keywords": ["ai", "artificial intelligence", "privacy", "education", "data"],
    },
    {
        "category": "State AG",
        "label": "New York AG",
        "url": "https://ag.ny.gov/",
        "keywords": ["ai", "artificial intelligence", "privacy", "education", "data"],
    },
    {
        "category": "State AG",
        "label": "Illinois AG",
        "url": "https://illinoisattorneygeneral.gov/",
        "keywords": ["ai", "artificial intelligence", "privacy", "education"],
    },
    {
        "category": "State AG",
        "label": "Massachusetts AG",
        "url": "https://www.mass.gov/orgs/office-of-the-attorney-general",
        "keywords": ["ai", "artificial intelligence", "privacy", "education"],
    },
    {
        "category": "State AG",
        "label": "Texas AG",
        "url": "https://www.texasattorneygeneral.gov/",
        "keywords": ["ai", "artificial intelligence", "privacy", "education"],
    },
    {
        "category": "State AG",
        "label": "Colorado AG",
        "url": "https://coag.gov/",
        "keywords": ["ai", "artificial intelligence", "privacy", "education"],
    },
    {
        "category": "State AG",
        "label": "Maryland AG",
        "url": "https://www.marylandattorneygeneral.gov",
        "keywords": ["ai", "artificial intelligence", "privacy", "education"],
    },
    {
        "category": "State AG",
        "label": "Washington DC AG",
        "url": "https://oag.dc.gov/",
        "keywords": ["ai", "artificial intelligence", "privacy", "education"],
    },
    {
        "category": "State AG",
        "label": "Connecticut AG",
        "url": "https://portal.ct.gov/ag",
        "keywords": ["ai", "artificial intelligence", "privacy", "education"],
    },
    {
        "category": "State AG",
        "label": "Washington State AG",
        "url": "https://www.atg.wa.gov/",
        "keywords": ["ai", "artificial intelligence", "privacy", "education"],
    },

    # ── 3. Regional Accreditors ──────────────────────────────────────────────
    {
        "category": "Accreditor",
        "label": "Middle States (MSCHE)",
        "url": "https://www.msche.org/",
        "keywords": ["ai", "integrity", "standard", "policy", "governance"],
    },
    {
        "category": "Accreditor",
        "label": "SACSCOC",
        "url": "https://sacscoc.org/",
        "keywords": ["ai", "integrity", "standard", "policy", "governance"],
    },
    {
        "category": "Accreditor",
        "label": "WASC (WSCUC)",
        "url": "https://www.wscuc.org/",
        "keywords": ["ai", "integrity", "standard", "policy", "governance"],
    },
    {
        "category": "Accreditor",
        "label": "HLC",
        "url": "https://www.hlcommission.org/",
        "keywords": ["ai", "integrity", "standard", "policy", "governance"],
    },
    {
        "category": "Accreditor",
        "label": "NECHE",
        "url": "https://neche.org/",
        "keywords": ["ai", "integrity", "standard", "policy", "governance"],
    },

    # ── 4. Council for Higher Education Accreditation ───────────────────────
    {
        "category": "Higher Ed Governance",
        "label": "CHEA",
        "url": "https://www.chea.org/",
        "keywords": ["ai", "governance", "policy", "integrity", "digital"],
    },

    # ── 5. Global / International ────────────────────────────────────────────
    {
        "category": "Global",
        "label": "UNESCO AI",
        "url": "https://www.unesco.org/en/artificial-intelligence",
        "keywords": [],
    },
    {
        "category": "Global",
        "label": "OECD AI",
        "url": "https://oecd.ai/",
        "keywords": [],
    },
    {
        "category": "Global",
        "label": "OECD Education",
        "url": "https://www.oecd.org/education/",
        "keywords": ["ai", "digital", "data", "policy"],
    },
    {
        "category": "Global",
        "label": "EU Digital Strategy",
        "url": "https://digital-strategy.ec.europa.eu/",
        "keywords": ["education", "ai", "data"],
    },
    {
        "category": "Global",
        "label": "EDPB (EU Data Protection Board)",
        "url": "https://edpb.europa.eu/",
        "keywords": [],
    },
    {
        "category": "Global",
        "label": "Ireland DPC",
        "url": "https://www.dataprotection.ie/",
        "keywords": [],
    },
    {
        "category": "Global",
        "label": "CNIL (France)",
        "url": "https://www.cnil.fr/",
        "keywords": [],
    },
    {
        "category": "Global",
        "label": "Council of Europe",
        "url": "https://www.coe.int/",
        "keywords": ["ai", "education", "data", "digital"],
    },
    {
        "category": "Global",
        "label": "World Bank Education",
        "url": "https://www.worldbank.org/en/topic/education",
        "keywords": ["ai", "digital", "data", "technology"],
    },
    {
        "category": "Global",
        "label": "Singapore IMDA",
        "url": "https://www.imda.gov.sg/",
        "keywords": ["ai", "governance", "education", "data"],
    },
    {
        "category": "Global",
        "label": "Australia OAIC",
        "url": "https://www.oaic.gov.au/",
        "keywords": ["ai", "education", "data"],
    },
    {
        "category": "Global",
        "label": "Germany BMBF",
        "url": "https://www.bmbf.de/",
        "keywords": ["ki", "ai", "digital", "bildung"],
    },
    {
        "category": "Global",
        "label": "Germany BfDI",
        "url": "https://www.bfdi.bund.de/",
        "keywords": [],
    },
    {
        "category": "Global",
        "label": "France Ministry of Education",
        "url": "https://www.education.gouv.fr/",
        "keywords": ["numérique", "ia", "ai", "données"],
    },
    {
        "category": "Global",
        "label": "Italy Ministry of Education (MIUR)",
        "url": "https://www.miur.gov.it/",
        "keywords": ["intelligenza artificiale", "digitale", "dati"],
    },
    {
        "category": "Global",
        "label": "Spain Ministry of Education",
        "url": "https://www.educacionyfp.gob.es/",
        "keywords": ["inteligencia artificial", "digital", "datos"],
    },
    {
        "category": "Global",
        "label": "Spain AEPD",
        "url": "https://www.aepd.es/",
        "keywords": [],
    },
    {
        "category": "Global",
        "label": "Netherlands Ministry of Education",
        "url": "https://www.government.nl/ministries/ministry-of-education-culture-and-science",
        "keywords": ["ai", "digital", "data"],
    },
    {
        "category": "Global",
        "label": "Netherlands DPA",
        "url": "https://autoriteitpersoonsgegevens.nl/",
        "keywords": [],
    },
    {
        "category": "Global",
        "label": "Sweden Skolverket",
        "url": "https://www.skolverket.se/",
        "keywords": ["ai", "digital", "data"],
    },
    {
        "category": "Global",
        "label": "Sweden IMY",
        "url": "https://www.imy.se/",
        "keywords": [],
    },
    {
        "category": "Global",
        "label": "UK Department for Education",
        "url": "https://www.gov.uk/government/organisations/department-for-education",
        "keywords": ["ai", "digital", "data", "technology"],
    },
    {
        "category": "Global",
        "label": "UK DSIT",
        "url": "https://www.gov.uk/government/organisations/department-for-science-innovation-and-technology",
        "keywords": ["ai", "education", "data"],
    },
    {
        "category": "Global",
        "label": "South Africa Dept of Basic Education",
        "url": "https://www.education.gov.za/",
        "keywords": ["ai", "digital", "data", "technology"],
    },
    {
        "category": "Global",
        "label": "South Africa Dept of Higher Education",
        "url": "https://www.dhet.gov.za/",
        "keywords": ["ai", "digital", "data"],
    },
    {
        "category": "Global",
        "label": "South Africa Information Regulator",
        "url": "https://inforegulator.org.za/",
        "keywords": [],
    },
    {
        "category": "Global",
        "label": "Kenya Ministry of Education",
        "url": "https://www.education.go.ke/",
        "keywords": ["ai", "digital", "data"],
    },
    {
        "category": "Global",
        "label": "Kenya ODPC",
        "url": "https://www.odpc.go.ke/",
        "keywords": [],
    },
    {
        "category": "Global",
        "label": "Nigeria Federal Ministry of Education",
        "url": "https://education.gov.ng/",
        "keywords": ["ai", "digital", "data"],
    },
    {
        "category": "Global",
        "label": "Nigeria NDPC",
        "url": "https://ndpc.gov.ng/",
        "keywords": [],
    },
    {
        "category": "Global",
        "label": "Ghana Ministry of Education",
        "url": "https://moe.gov.gh/",
        "keywords": ["ai", "digital", "data"],
    },
    {
        "category": "Global",
        "label": "Ghana Data Protection Commission",
        "url": "https://www.dataprotection.org.gh/",
        "keywords": [],
    },
    {
        "category": "Global",
        "label": "Ethiopia Ministry of Education",
        "url": "https://moe.gov.et/",
        "keywords": ["ai", "digital", "data"],
    },
    {
        "category": "Global",
        "label": "African Union",
        "url": "https://au.int/",
        "keywords": ["ai", "education", "digital", "data"],
    },
    {
        "category": "Global",
        "label": "Canada ISED",
        "url": "https://ised-isde.canada.ca/",
        "keywords": ["ai", "education", "data", "digital"],
    },
    {
        "category": "Global",
        "label": "Canada Privacy Commissioner",
        "url": "https://www.priv.gc.ca/",
        "keywords": [],
    },
    {
        "category": "Global",
        "label": "Canada CMEC",
        "url": "https://www.cmec.ca/",
        "keywords": ["ai", "digital", "education"],
    },
    {
        "category": "Global",
        "label": "Japan MEXT",
        "url": "https://www.mext.go.jp/",
        "keywords": ["ai", "digital", "education", "data"],
    },
    {
        "category": "Global",
        "label": "Japan PPC",
        "url": "https://www.ppc.go.jp/en/",
        "keywords": [],
    },
    {
        "category": "Global",
        "label": "South Korea Ministry of Education",
        "url": "https://english.moe.go.kr/",
        "keywords": ["ai", "digital", "data"],
    },
    {
        "category": "Global",
        "label": "South Korea PIPC",
        "url": "https://www.pipc.go.kr/",
        "keywords": [],
    },
    {
        "category": "Global",
        "label": "India Ministry of Education",
        "url": "https://www.education.gov.in/",
        "keywords": ["ai", "digital", "data"],
    },
    {
        "category": "Global",
        "label": "India MeitY",
        "url": "https://www.meity.gov.in/",
        "keywords": ["ai", "education", "data"],
    },
]