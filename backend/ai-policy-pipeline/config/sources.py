"""
sources.py — canonical list of all policy sources to crawl.

Each entry:
  category  : top-level grouping
  label     : human-readable name
  url       : seed URL (crawler starts here)
  keywords  : if non-empty, only store pages whose text contains ≥1 keyword
               (case-insensitive substring match). Leave [] to store everything found.
"""

# ── Keyword groups ────────────────────────────────────────────────────────────
# Assign sources a relevant combination of these groups.
# OR logic: a page is stored if it contains ANY one keyword.

GOVERNANCE = [
    "policy", "regulation", "regulatory", "rulemaking", "proposed rule",
    "final rule", "guidance", "compliance", "enforcement", "standard",
    "framework", "governance", "oversight", "accountability", "transparency",
    "audit", "risk management", "risk assessment", "data governance", "privacy",
    "data protection", "student data", "consent decree", "settlement agreement",
    "investigation", "resolution agreement", "accreditation", "quality assurance",
    "institutional effectiveness", "academic integrity", "procurement",
    "vendor management", "third-party vendor", "terms of service", "privacy policy",
    "data processing agreement", "acceptable use policy",
]

TECHNOLOGY = [
    "artificial intelligence", "AI", "generative AI", "algorithmic",
    "automated decision-making", "machine learning", "predictive analytics",
    "learning analytics", "adaptive learning", "education technology", "edtech",
    "digital learning", "online learning", "learning management system", "LMS",
    "student information system", "SIS", "proctoring", "remote proctoring",
    "facial recognition", "surveillance", "chatbot", "large language model", "LLM",
    "assessment technology", "credentialing platform", "digital credential",
    "skills assessment", "hiring algorithm", "employment screening",
    "workforce technology", "case management system", "technology",
]

SECTOR = [
    "education", "K-12", "school district", "student", "teacher", "educator",
    "classroom", "higher education", "college", "university", "community college",
    "faculty", "academic program", "accreditor", "institution",
    "workforce development", "workforce system", "training provider",
    "apprenticeship", "credentialing", "reskilling", "upskilling",
    "career pathway", "labor market", "adult education",
]

EQUITY = [
    "civil rights", "discrimination", "bias", "algorithmic bias",
    "disparate impact", "equity", "accessibility", "disability", "ADA",
    "Section 504", "IDEA", "FERPA", "COPPA", "Title VI", "Title IX",
    "language access", "due process", "student rights", "parental rights",
    "minor", "children", "youth", "protected class", "fairness",
    "explainability", "human review", "appeal process", "contestability", "redress",
]

VENDOR_POLICY = [
    "updated terms", "terms update", "privacy update", "policy update",
    "data use", "data retention", "data sharing", "third-party sharing",
    "subprocessor", "processor", "controller", "service provider",
    "customer data", "training data", "model training", "AI training",
    "opt out", "user content", "student content", "enterprise data",
    "education data", "security practices", "acceptable use", "restricted use",
    "prohibited use", "compliance update",
]

ACCREDITATION = [
    "standards for accreditation", "criteria for accreditation",
    "principles of accreditation", "substantive change", "institutional integrity",
    "academic quality", "student achievement", "governance structure",
    "board oversight", "institutional control", "assessment of student learning",
    "continuous improvement", "quality enhancement", "program review",
    "distance education", "regular and substantive interaction",
    "student support services", "academic freedom", "research integrity",
]

WORKFORCE = [
    "workforce innovation", "WIOA", "workforce board", "labor department",
    "employment services", "job matching", "skills-based hiring",
    "eligible training provider", "ETPL", "career services",
    "pre-apprenticeship", "labor market information", "reemployment",
    "occupational training", "digital skills", "algorithmic hiring",
    "automated employment decision tool",
]

AI_READINESS = ["AI-readiness", "future-ready", "Future-Ready Leaders"]

# Convenience combinations used across multiple sources
_GOVERNANCE_TECH_SECTOR = GOVERNANCE + TECHNOLOGY + SECTOR
_GOVERNANCE_TECH_EQUITY = GOVERNANCE + TECHNOLOGY + EQUITY
_VENDOR_FULL = VENDOR_POLICY + TECHNOLOGY + GOVERNANCE
_ACCREDITOR_FULL = ACCREDITATION + GOVERNANCE + TECHNOLOGY + SECTOR


# ── Sources ───────────────────────────────────────────────────────────────────

SOURCES = [
    # ── 1. Vendor Policies ──────────────────────────────────────────────────
    {
        "category": "Vendor Policy",
        "label": "OpenAI",
        "url": "https://openai.com/policies",
        "keywords": _VENDOR_FULL,
    },
    {
        "category": "Vendor Policy",
        "label": "Google Workspace for Education",
        "url": "https://workspace.google.com/terms/education_terms.html",
        "keywords": [],  # store all — dedicated education terms page
    },
    {
        "category": "Vendor Policy",
        "label": "Google Policies",
        "url": "https://policies.google.com/",
        "keywords": _VENDOR_FULL,
    },
    {
        "category": "Vendor Policy",
        "label": "Microsoft Trust Center",
        "url": "https://www.microsoft.com/en-us/trust-center",
        "keywords": _VENDOR_FULL,
    },
    {
        "category": "Vendor Policy",
        "label": "Microsoft Compliance",
        "url": "https://learn.microsoft.com/en-us/compliance/",
        "keywords": _VENDOR_FULL,
    },
    {
        "category": "Vendor Policy",
        "label": "Anthropic Legal",
        "url": "https://www.anthropic.com/legal",
        "keywords": [],  # store all — dedicated legal page
    },
    {
        "category": "Vendor Policy",
        "label": "Canvas (Instructure)",
        "url": "https://www.instructure.com/policies",
        "keywords": [],  # store all — dedicated policy page
    },
    {
        "category": "Vendor Policy",
        "label": "Blackboard Legal",
        "url": "https://www.blackboard.com/legal",
        "keywords": [],  # store all — dedicated legal page
    },

    # ── 2. State Attorney General Offices ───────────────────────────────────
    {
        "category": "State AG",
        "label": "California AG",
        "url": "https://oag.ca.gov/",
        "keywords": _GOVERNANCE_TECH_EQUITY,
    },
    {
        "category": "State AG",
        "label": "New York AG",
        "url": "https://ag.ny.gov/",
        "keywords": _GOVERNANCE_TECH_EQUITY,
    },
    {
        "category": "State AG",
        "label": "Illinois AG",
        "url": "https://illinoisattorneygeneral.gov/",
        "keywords": _GOVERNANCE_TECH_EQUITY,
    },
    {
        "category": "State AG",
        "label": "Massachusetts AG",
        "url": "https://www.mass.gov/orgs/office-of-the-attorney-general",
        "keywords": _GOVERNANCE_TECH_EQUITY,
    },
    {
        "category": "State AG",
        "label": "Texas AG",
        "url": "https://www.texasattorneygeneral.gov/",
        "keywords": _GOVERNANCE_TECH_EQUITY,
    },
    {
        "category": "State AG",
        "label": "Colorado AG",
        "url": "https://coag.gov/",
        "keywords": _GOVERNANCE_TECH_EQUITY,
    },
    {
        "category": "State AG",
        "label": "Maryland AG",
        "url": "https://www.marylandattorneygeneral.gov",
        "keywords": _GOVERNANCE_TECH_EQUITY,
    },
    {
        "category": "State AG",
        "label": "Washington DC AG",
        "url": "https://oag.dc.gov/",
        "keywords": _GOVERNANCE_TECH_EQUITY,
    },
    {
        "category": "State AG",
        "label": "Connecticut AG",
        "url": "https://portal.ct.gov/ag",
        "keywords": _GOVERNANCE_TECH_EQUITY,
    },
    {
        "category": "State AG",
        "label": "Washington State AG",
        "url": "https://www.atg.wa.gov/",
        "keywords": _GOVERNANCE_TECH_EQUITY,
    },

    # ── 3. Regional Accreditors ──────────────────────────────────────────────
    {
        "category": "Accreditor",
        "label": "Middle States (MSCHE)",
        "url": "https://www.msche.org/",
        "keywords": _ACCREDITOR_FULL,
    },
    {
        "category": "Accreditor",
        "label": "SACSCOC",
        "url": "https://sacscoc.org/",
        "keywords": _ACCREDITOR_FULL,
    },
    {
        "category": "Accreditor",
        "label": "WASC (WSCUC)",
        "url": "https://www.wscuc.org/",
        "keywords": _ACCREDITOR_FULL,
    },
    {
        "category": "Accreditor",
        "label": "HLC",
        "url": "https://www.hlcommission.org/",
        "keywords": _ACCREDITOR_FULL,
    },
    {
        "category": "Accreditor",
        "label": "NECHE",
        "url": "https://neche.org/",
        "keywords": _ACCREDITOR_FULL,
    },

    # ── 4. Council for Higher Education Accreditation ───────────────────────
    {
        "category": "Higher Ed Governance",
        "label": "CHEA",
        "url": "https://www.chea.org/",
        "keywords": _ACCREDITOR_FULL + AI_READINESS,
    },

    # ── 5. Global / International ────────────────────────────────────────────
    {
        "category": "Global",
        "label": "UNESCO AI",
        "url": "https://www.unesco.org/en/artificial-intelligence",
        "keywords": [],  # store all — dedicated AI topic page
    },
    {
        "category": "Global",
        "label": "OECD AI",
        "url": "https://oecd.ai/",
        "keywords": [],  # store all — dedicated AI policy site
    },
    {
        "category": "Global",
        "label": "OECD Education",
        "url": "https://www.oecd.org/education/",
        "keywords": _GOVERNANCE_TECH_SECTOR,
    },
    {
        "category": "Global",
        "label": "EU Digital Strategy",
        "url": "https://digital-strategy.ec.europa.eu/",
        "keywords": _GOVERNANCE_TECH_SECTOR,
    },
    {
        "category": "Global",
        "label": "EDPB (EU Data Protection Board)",
        "url": "https://edpb.europa.eu/",
        "keywords": [],  # store all — dedicated data protection regulator
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
        "keywords": _GOVERNANCE_TECH_EQUITY,
    },
    {
        "category": "Global",
        "label": "World Bank Education",
        "url": "https://www.worldbank.org/en/topic/education",
        "keywords": _GOVERNANCE_TECH_SECTOR + WORKFORCE + AI_READINESS,
    },
    {
        "category": "Global",
        "label": "Singapore IMDA",
        "url": "https://www.imda.gov.sg/",
        "keywords": _GOVERNANCE_TECH_SECTOR,
    },
    {
        "category": "Global",
        "label": "Australia OAIC",
        "url": "https://www.oaic.gov.au/",
        "keywords": GOVERNANCE + TECHNOLOGY + EQUITY,
    },
    {
        "category": "Global",
        "label": "Germany BMBF",
        "url": "https://www.bmbf.de/",
        "keywords": ["ki", "ai", "digital", "bildung"] + GOVERNANCE + TECHNOLOGY,
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
        "keywords": ["numérique", "ia", "données", "algorithme", "apprentissage"] + GOVERNANCE + TECHNOLOGY,
    },
    {
        "category": "Global",
        "label": "Italy Ministry of Education (MIUR)",
        "url": "https://www.miur.gov.it/",
        "keywords": ["intelligenza artificiale", "digitale", "dati", "algoritmo"] + GOVERNANCE,
    },
    {
        "category": "Global",
        "label": "Spain Ministry of Education",
        "url": "https://www.educacionyfp.gob.es/",
        "keywords": ["inteligencia artificial", "digital", "datos", "algoritmo"] + GOVERNANCE,
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
        "keywords": _GOVERNANCE_TECH_SECTOR,
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
        "keywords": _GOVERNANCE_TECH_SECTOR,
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
        "keywords": _GOVERNANCE_TECH_SECTOR + EQUITY + AI_READINESS,
    },
    {
        "category": "Global",
        "label": "UK DSIT",
        "url": "https://www.gov.uk/government/organisations/department-for-science-innovation-and-technology",
        "keywords": _GOVERNANCE_TECH_SECTOR,
    },
    {
        "category": "Global",
        "label": "South Africa Dept of Basic Education",
        "url": "https://www.education.gov.za/",
        "keywords": _GOVERNANCE_TECH_SECTOR + AI_READINESS,
    },
    {
        "category": "Global",
        "label": "South Africa Dept of Higher Education",
        "url": "https://www.dhet.gov.za/",
        "keywords": _GOVERNANCE_TECH_SECTOR + WORKFORCE,
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
        "keywords": _GOVERNANCE_TECH_SECTOR + AI_READINESS,
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
        "keywords": _GOVERNANCE_TECH_SECTOR + AI_READINESS,
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
        "keywords": _GOVERNANCE_TECH_SECTOR + AI_READINESS,
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
        "keywords": _GOVERNANCE_TECH_SECTOR + AI_READINESS,
    },
    {
        "category": "Global",
        "label": "African Union",
        "url": "https://au.int/",
        "keywords": _GOVERNANCE_TECH_SECTOR + AI_READINESS,
    },
    {
        "category": "Global",
        "label": "Canada ISED",
        "url": "https://ised-isde.canada.ca/",
        "keywords": _GOVERNANCE_TECH_SECTOR + WORKFORCE,
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
        "keywords": _GOVERNANCE_TECH_SECTOR + ACCREDITATION,
    },
    {
        "category": "Global",
        "label": "Japan MEXT",
        "url": "https://www.mext.go.jp/",
        "keywords": _GOVERNANCE_TECH_SECTOR + AI_READINESS,
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
        "keywords": _GOVERNANCE_TECH_SECTOR + AI_READINESS,
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
        "keywords": _GOVERNANCE_TECH_SECTOR + AI_READINESS,
    },
    {
        "category": "Global",
        "label": "India MeitY",
        "url": "https://www.meity.gov.in/",
        "keywords": _GOVERNANCE_TECH_SECTOR,
    },
]
