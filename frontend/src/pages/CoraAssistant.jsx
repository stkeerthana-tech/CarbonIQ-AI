import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Sparkles,
  Send,
  Bot,
  User,
  ShieldCheck,
  Globe2,
  HelpCircle,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const GENERAL_KNOWLEDGE = {
  esg: {
    title: 'Environmental, Social, and Governance (ESG)',
    badge: 'Sustainability Standard',
    summary:
      'ESG is a strategic framework utilized by investors, regulators, and corporate leaders to evaluate an organization\'s sustainability practices, societal impact, and governance integrity. It forms the foundation for non-financial risk management and regulatory reporting.',
    points: [
      'Environmental (E): Direct & indirect carbon emissions (Scopes 1-3), energy efficiency, waste management, water stewardship, and climate risk mitigation.',
      'Social (S): Workplace health & safety, labor rights, fair compensation, diversity, equity & inclusion (DEI), and community engagement.',
      'Governance (G): Board independence & diversity, executive compensation, anti-bribery policies, whistleblower protection, and audit transparency.',
      'Why it matters: Drives compliance with global mandates (e.g. CSRD, SEC), minimizes legal & climate risks, and attracts ESG-aligned institutional capital.',
    ],
    matchKeywords: [
      'esg',
      'environmental social and governance',
      'environmental social governance',
      'environmental, social',
      'what is esg',
      'explain esg',
      'define esg',
    ],
  },
  greenhouse_gases: {
    title: 'Greenhouse Gases (GHGs) & Atmospheric Impact',
    badge: 'GHG Protocol Standard',
    summary:
      'Greenhouse gases (GHGs) are atmospheric gases that absorb and emit infrared radiation, trapping heat within the Earth\'s atmosphere (the greenhouse effect). Under the Kyoto Protocol and GHG Protocol, organizations track seven primary greenhouse gases.',
    points: [
      'Carbon Dioxide (CO2): The primary contributor from fossil fuel combustion (coal, gas, diesel) and industrial processes (GWP = 1).',
      'Methane (CH4): Emitted from agricultural practices, enteric fermentation, fossil fuel extraction, and landfills (GWP ≈ 28 over 100 years).',
      'Nitrous Oxide (N2O): Released from agricultural fertilizers, chemical manufacturing, and wastewater operations (GWP ≈ 265).',
      'Fluorinated Gases (F-gases): Synthetic industrial gases including HFCs (refrigerants), PFCs (electronics), SF6 (electrical switchgear), and NF3 with high global warming potentials.',
      'Note: Carbonix AI calculates CO2 equivalent (CO2e) emissions strictly from verified activity records and authoritative factor databases without guessing unmeasured gases.',
    ],
    matchKeywords: [
      'greenhouse gas',
      'greenhouse gases',
      'ghg',
      'ghgs',
      'what are greenhouse gases',
      'what is a greenhouse gas',
      'greenhouse effect',
    ],
  },
  co2e: {
    title: 'Carbon Dioxide Equivalent (CO2e) & GWP',
    badge: 'GHG Protocol Standard',
    summary:
      'CO2e (Carbon Dioxide Equivalent) is the universal metric used in carbon accounting to compare and consolidate the climate impact of various greenhouse gases based on their Global Warming Potential (GWP), relative to carbon dioxide.',
    points: [
      'Standard Baseline: Carbon Dioxide (CO2) is the baseline reference with a GWP of exactly 1.0.',
      'Global Warming Potential (GWP): Represents the heat-trapping potency of a gas over a 100-year horizon (e.g., 1 tonne CH4 = 28 tCO2e; 1 tonne N2O = 265 tCO2e).',
      'Consolidation: Allows organizations to aggregate emissions across diverse fuels, refrigerants, and processes into a single unified carbon footprint.',
    ],
    matchKeywords: [
      'co2e',
      'co2 equivalent',
      'carbon dioxide equivalent',
      'what is co2e',
      'what is co2 e',
      'gwp',
      'global warming potential',
      'co2 vs co2e',
      'difference between co2 and co2e',
    ],
  },
  carbon_emission: {
    title: 'Carbon Emissions & Corporate Footprints',
    badge: 'GHG Protocol Standard',
    summary:
      'Carbon emissions refer to the release of greenhouse gases into the atmosphere resulting from human activities—primarily fossil fuel combustion, industrial processes, electricity generation, and supply chain operations.',
    points: [
      'Measurement Metric: Quantified in mass of carbon dioxide equivalent (kg CO2e or metric tonnes tCO2e).',
      'Reporting Scopes: Partitioned into Scope 1 (Direct Operations), Scope 2 (Purchased Energy), and Scope 3 (Value Chain).',
      'Calculation Core: Computed deterministically as Activity Data (quantity/units) × Verified Emission Factor = Total CO2e.',
    ],
    matchKeywords: [
      'carbon emission',
      'carbon emissions',
      'what is carbon emission',
      'what are carbon emissions',
      'carbon footprint',
      'what is a carbon footprint',
      'corporate carbon footprint',
    ],
  },
  scope_1: {
    title: 'Scope 1 Emissions (Direct Operations)',
    badge: 'GHG Protocol Standard',
    summary:
      'Scope 1 emissions are direct greenhouse gas emissions from sources that are owned or operationally controlled by your organization.',
    points: [
      'Stationary Combustion: Natural gas, diesel, fuel oil used in on-site boilers, furnaces, heaters, and emergency generators.',
      'Mobile Combustion: Company-owned or leased delivery vans, fleet vehicles, corporate cars, and transport vessels.',
      'Process Emissions: Chemical reactions occurring during industrial production (e.g., cement manufacturing, chemical synthesis).',
      'Fugitive Emissions: Unintentional refrigerant leaks from commercial HVAC units, industrial chillers, and gas pipeline joints.',
    ],
    matchKeywords: [
      'scope 1',
      'scope-1',
      'scope 1 direct',
      'what is scope 1',
      'explain scope 1',
      'define scope 1',
      'scope 1 emission',
      'scope 1 emissions',
    ],
  },
  scope_2: {
    title: 'Scope 2 Emissions (Purchased Electricity & Energy)',
    badge: 'GHG Protocol Standard',
    summary:
      'Scope 2 emissions are indirect GHG emissions resulting from the generation of purchased electricity, steam, heating, or cooling consumed by your organization\'s facilities.',
    points: [
      'Purchased Electricity: Grid power consumed across corporate offices, retail spaces, data centres, and manufacturing plants.',
      'Purchased Thermal Energy: District heating networks, industrial steam, or chilled water cooling systems.',
      'Location-based Accounting: Reflects average emission intensities of the regional electricity grids serving the facilities.',
      'Market-based Accounting: Reflects contractual energy instruments such as Renewable Energy Certificates (RECs) and Power Purchase Agreements (PPAs).',
    ],
    matchKeywords: [
      'scope 2',
      'scope-2',
      'scope 2 indirect',
      'what is scope 2',
      'explain scope 2',
      'define scope 2',
      'scope 2 emission',
      'scope 2 emissions',
    ],
  },
  scope_3: {
    title: 'Scope 3 Emissions (Value Chain & Upstream/Downstream)',
    badge: 'GHG Protocol Standard',
    summary:
      'Scope 3 emissions encompass all other indirect emissions across an organization\'s broader value chain, categorized into 15 distinct categories under the GHG Protocol.',
    points: [
      'Upstream (Categories 1-8): Purchased goods & services (supply chain), capital goods, fuel/energy transport, upstream freight, waste generated in operations, business travel, and employee commuting.',
      'Downstream (Categories 9-15): Downstream transportation & logistics, processing of sold goods, use phase of sold products, end-of-life disposal/recycling, franchises, and investments.',
      'Value Chain Impact: Typically accounts for 70% to 90%+ of an enterprise\'s total climate footprint.',
    ],
    matchKeywords: [
      'scope 3',
      'scope-3',
      'scope 3 value chain',
      'what is scope 3',
      'explain scope 3',
      'define scope 3',
      'scope 3 emission',
      'scope 3 emissions',
    ],
  },
  carbon_accounting: {
    title: 'Carbon Accounting & GHG Accounting Principles',
    badge: 'Methodology Standard',
    summary:
      'Carbon accounting is the systematic discipline of measuring, quantifying, and disclosing greenhouse gas emissions produced by an organization to inform decarbonization targets, audit reviews, and regulatory disclosures.',
    points: [
      'Standard Formula: Activity Data (e.g., kWh, liters, km) × Verified Emission Factor = Total CO2e (kg or tCO2e).',
      'Deterministic Integrity: Numerical emission figures must be computed with immutable formulas and factors, never fabricated or extrapolated by AI.',
      'International Standards: Governed by the GHG Protocol Corporate Standard, ISO 14064, and CSRD ESRS E1.',
      'Auditability: Complete traceability ensuring each record links to its source activity, factor authority, timestamp, and audit trail status.',
    ],
    matchKeywords: [
      'carbon accounting',
      'ghg accounting',
      'what is carbon accounting',
      'how does carbon accounting work',
      'emission accounting',
      'carbon accounting principles',
    ],
  },
  emission_factors: {
    title: 'Emission Factors & Data Provenance',
    badge: 'Methodology Standard',
    summary:
      'An emission factor is a certified coefficient that converts an activity metric (e.g., liters of fuel, kWh of electricity, tonne-kilometers) into greenhouse gas emissions (kg CO2e or tCO2e).',
    points: [
      'Authoritative Authorities: Sourced from verified databases including UK Defra/DESNZ, US EPA, CEA India, IEA, and IPCC.',
      'Hierarchy of Selection: Supplier-specific factors take precedence, followed by national grid factors and regional/sectoral averages.',
      'Deterministic Execution: In Carbonix AI, calculations execute strictly against verified factor tables with full provenance metadata.',
    ],
    matchKeywords: [
      'emission factor',
      'emission factors',
      'what is an emission factor',
      'what are emission factors',
      'factor database',
      'defra factor',
      'epa factor',
    ],
  },
  ghg_protocol: {
    title: 'GHG Protocol Corporate Standard',
    badge: 'GHG Protocol Standard',
    summary:
      'The Greenhouse Gas Protocol (GHG Protocol), co-developed by the World Resources Institute (WRI) and WBCSD, is the international accounting standard for quantifying corporate carbon emissions.',
    points: [
      'Global Standard: Establishes the universally recognized 3-Scope reporting architecture.',
      'Core Principles: Relevance, Completeness, Consistency, Transparency, and Accuracy.',
      'Regulatory Alignment: Serves as the foundational baseline for EU CSRD (ESRS E1), SEC climate disclosure rules, CDP, and Science Based Targets (SBTi).',
    ],
    matchKeywords: [
      'ghg protocol',
      'greenhouse gas protocol',
      'what is ghg protocol',
      'what is the ghg protocol',
      'wri wbcsd',
      'ghg standards',
    ],
  },
  greenwashing: {
    title: 'Greenwashing & Compliance Risks',
    badge: 'ESG Compliance',
    summary:
      'Greenwashing is the practice of conveying misleading, exaggerated, or false claims regarding the environmental performance, sustainability credentials, or climate impact of an organization.',
    points: [
      'Common Forms: Vague marketing buzzwords (e.g., \'eco-friendly\' without metrics), cherry-picked baselines, hidden supply chain trade-offs, and unverified offset reliance.',
      'Regulatory Scrutiny: Enforced by international authorities under directives like the EU Green Claims Directive, UK CMA Green Claims Code, and US FTC Green Guides.',
      'Prevention: Verifiable activity data, immutable audit trails, deterministic calculations, and alignment with SBTi and GHG Protocol guidelines.',
    ],
    matchKeywords: [
      'greenwashing',
      'green washing',
      'what is greenwashing',
      'prevent greenwashing',
      'green claims',
      'green claim',
    ],
  },
  csrd: {
    title: 'Corporate Sustainability Reporting Directive (CSRD)',
    badge: 'EU Regulation',
    summary:
      'The EU Corporate Sustainability Reporting Directive (CSRD) mandates comprehensive, standardized ESG disclosures for over 50,000 European companies and multinational enterprises operating in the EU.',
    points: [
      'European Sustainability Reporting Standards (ESRS): Sets mandatory disclosure standards, with ESRS E1 specifically governing climate change and Scopes 1-3.',
      'Double Materiality: Organizations must report both impact materiality (how corporate activities impact people & planet) and financial materiality (how ESG factors impact financial performance).',
      'Mandatory Audit Assurance: Mandates independent third-party assurance over non-financial sustainability statements.',
    ],
    matchKeywords: [
      'csrd',
      'corporate sustainability reporting directive',
      'esrs',
      'esrs e1',
      'what is csrd',
      'what is the csrd',
      'double materiality',
    ],
  },
  csddd: {
    title: 'Corporate Sustainability Due Diligence Directive (CSDDD)',
    badge: 'EU Regulation',
    summary:
      'The EU Corporate Sustainability Due Diligence Directive (CSDDD) requires large enterprises to conduct due diligence to identify, prevent, mitigate, and remedy adverse human rights and environmental impacts throughout their global value chains.',
    points: [
      'Corporate Due Diligence: Enforces active monitoring of supply chains and downstream operations.',
      'Climate Transition Plan: Requires companies to adopt and implement a transition plan aligned with the Paris Agreement 1.5°C threshold.',
      'Legal Accountability: Introduces civil liability and regulatory oversight for failure to address severe supply chain violations.',
    ],
    matchKeywords: [
      'csddd',
      'corporate sustainability due diligence',
      'what is csddd',
      'what is the csddd',
      'due diligence directive',
    ],
  },
  carbon_neutrality: {
    title: 'Carbon Neutrality vs. Net Zero (SBTi)',
    badge: 'Climate Targets',
    summary:
      'While frequently used interchangeably in informal discussions, Carbon Neutrality and Net Zero represent distinct decarbonization frameworks with different boundary requirements and offset rules.',
    points: [
      'Carbon Neutrality (PAS 2060): Balances gross carbon emissions by purchasing carbon offsets/credits; may focus on Scopes 1 and 2 without requiring deep direct reductions.',
      'Net Zero (SBTi Standard): Requires 90-95% absolute gross emissions reduction across Scopes 1, 2, and 3 by 2050 (or sooner), neutralizing only the remaining 5-10% unabated residual emissions via permanent carbon removal.',
      'Key Difference: Net Zero strictly prioritizes structural operational abatement over avoidance credits.',
    ],
    matchKeywords: [
      'carbon neutrality',
      'net zero',
      'net-zero',
      'carbon neutral',
      'what is net zero',
      'what is carbon neutrality',
      'difference between carbon neutral and net zero',
      'sbti',
      'science based targets',
    ],
  },
  calculation_methodology: {
    title: 'Deterministic Calculation Methodology',
    badge: 'Methodology Standard',
    summary:
      'Carbonix AI utilizes a deterministic, rule-based calculation engine that calculates greenhouse gas emissions strictly from empirical activity quantities and verified emission factors.',
    points: [
      'Formula: Activity Quantity × Verified Emission Factor = Total CO2e (kg or metric tonnes).',
      'AI Separation: Lyzr AI provides conversational reasoning, compliance guidance, and contextual explanations, but never calculates, modifies, or invents numerical carbon figures.',
      'Full Provenance: Every calculated record maintains complete traceability to the emission factor version, authority, user, and audit log.',
    ],
    matchKeywords: [
      'how is emission calculated',
      'how was this emission calculated',
      'how are emissions calculated',
      'how do you calculate emissions',
      'calculation engine',
      'calculation formula',
      'deterministic calculation',
    ],
  },
};

function findGeneralKnowledge(queryText) {
  const q = queryText.toLowerCase().trim();
  const stripped = q.replace(/[?!.,;:()'"]/g, ' ').replace(/\s+/g, ' ').trim();

  for (const [key, entry] of Object.entries(GENERAL_KNOWLEDGE)) {
    for (const kw of entry.matchKeywords) {
      if (stripped === kw || stripped.includes(kw) || q.includes(kw)) {
        return entry;
      }
    }
  }
  return null;
}

function classifyIntent(text) {
  const q = text.toLowerCase().trim();
  const stripped = q.replace(/[?!.,;:()'"]/g, ' ').replace(/\s+/g, ' ').trim();

  // 1. Company-Specific Signals (possessives, org-specific inquiries, data lookups)
  const companyPossessives = [
    'my company',
    'our company',
    "company's",
    'this company',
    'my org',
    'our org',
    'my organization',
    'our organization',
    'this organization',
    'my emission',
    'my emissions',
    'our emission',
    'our emissions',
    'my footprint',
    'our footprint',
    'our scope 1',
    'my scope 1',
    'our scope 2',
    'my scope 2',
    'our scope 3',
    'my scope 3',
    'our activities',
    'my activities',
    'our activity',
    'my activity',
    'our records',
    'my records',
    'our data',
    'my data',
    'our latest',
    'our recent',
    'our calculation',
    'our calculations',
    'our anomalies',
    'my anomalies',
    'we logged',
    'did we',
    'have we',
    'what did we',
    'our numbers',
    'for our company',
    'in our company',
    'for our organization',
  ];

  const companyActionPhrases = [
    'show my',
    'show our',
    'what are my',
    'what are our',
    'what is my',
    'what is our',
    'activities need review',
    'activities needing review',
    'activities need attention',
    'activities needing attention',
    'what activities need review',
    'what activities need attention',
    'needs review',
    'needing review',
    'why was this activity flagged',
    'why was this flagged',
    'why is this activity marked',
    'show recent emissions',
    'show our recent emissions',
    'what was our latest calculation',
    'what was the latest calculation',
    'latest calculation for',
    'what are our anomalies',
    'what are my anomalies',
    'anomalies in our',
  ];

  const hasPossessive = companyPossessives.some((p) => stripped.includes(p));
  const hasAction = companyActionPhrases.some((p) => stripped.includes(p));

  if (hasPossessive || hasAction) {
    return { type: 'COMPANY_SPECIFIC' };
  }

  // 2. Ambiguous Queries
  // If the query mentions a scope or emissions summary without definition words (what is, explain, define, etc.)
  // and without company possessives, ask for clarification.
  const isDefinitionPattern = /^(what is|what are|explain|define|tell me about what|how does|what does|meaning of|describe|how is|how are)/i.test(q);

  if (!isDefinitionPattern) {
    if (
      /^scope [123] emissions?$/i.test(stripped) ||
      /^tell me about scope [123] emissions?$/i.test(stripped) ||
      /^scope [123]$/i.test(stripped) ||
      /^emissions? summary$/i.test(stripped) ||
      /^activity review$/i.test(stripped) ||
      /^emission data$/i.test(stripped)
    ) {
      return { type: 'AMBIGUOUS' };
    }
  }

  // 3. General Knowledge Match
  const gkEntry = findGeneralKnowledge(q);
  if (gkEntry) {
    return { type: 'GENERAL', entry: gkEntry };
  }

  // 4. General question fallback (starts with definition words)
  if (isDefinitionPattern) {
    return { type: 'GENERAL_QUESTION' };
  }

  return { type: 'GENERAL_OPEN' };
}

export function CoraAssistant() {
  const { activeCompany } = useOutletContext();
  const { user } = useAuth();

  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      sender: 'cora',
      type: 'welcome',
      text: `Hello ${user?.name || 'there'}! I am Cora, your Carbon Intelligence Assistant. I provide verified insights from your organization's deterministic emission records, explain GHG protocols, and assist with audit reviews. How can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [activities, setActivities] = useState([]);
  const messagesEndRef = useRef(null);

  // Preload verified backend data for the current company
  useEffect(() => {
    async function loadCompanyData() {
      if (!activeCompany?.id) {
        setDashboardData(null);
        setActivities([]);
        return;
      }
      try {
        const [dashRes, actRes] = await Promise.all([
          api.dashboard.get(activeCompany.id),
          api.activities.list(activeCompany.id),
        ]);
        if (dashRes.success) setDashboardData(dashRes.data);
        if (actRes.success) setActivities(actRes.data);
      } catch (err) {
        console.error('Error loading company data for Cora:', err);
      }
    }
    loadCompanyData();
  }, [activeCompany?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (queryText) => {
    const text = (queryText || input).trim();
    if (!text || loading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    const lower = text.toLowerCase();
    const intent = classifyIntent(text);

    // =========================================================================
    // 1. GENERAL KNOWLEDGE — NO COMPANY REQUIRED
    // =========================================================================
    if (intent.type === 'GENERAL') {
      const entry = intent.entry;
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `cora-${Date.now()}`,
            sender: 'cora',
            type: 'standard_knowledge',
            badge: entry.badge || 'GHG Protocol Standard',
            title: entry.title,
            summary: entry.summary,
            points: entry.points,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setLoading(false);
      }, 350);
      return;
    }

    // =========================================================================
    // 2. AMBIGUOUS QUESTIONS — ASK FOR CLARIFICATION
    // =========================================================================
    if (intent.type === 'AMBIGUOUS') {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `cora-${Date.now()}`,
            sender: 'cora',
            type: 'clarification',
            text: `Would you like a general explanation of Scope emissions under the GHG Protocol, or would you like to view your organization's verified carbon emission data?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setLoading(false);
      }, 350);
      return;
    }

    // =========================================================================
    // 3. COMPANY-SPECIFIC QUESTIONS — REQUIRE ACTIVE COMPANY
    // =========================================================================
    if (intent.type === 'COMPANY_SPECIFIC') {
      if (!activeCompany?.id) {
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: `cora-${Date.now()}`,
              sender: 'cora',
              type: 'general_response',
              text: `Please select an organization first so I can access its verified Carbonix data.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
          setLoading(false);
        }, 350);
        return;
      }

      // Check specific company data queries
      // A. Scope 1, 2, or 3 specific company query
      if (lower.includes('scope 1') || lower.includes('scope-1')) {
        setTimeout(() => {
          if (!dashboardData) {
            setMessages((prev) => [
              ...prev,
              {
                id: `cora-${Date.now()}`,
                sender: 'cora',
                type: 'verified_data',
                text: `No verified emission data is available yet for ${activeCompany.company_name}. Please submit activity records to calculate your Scope 1 emissions.`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          } else {
            setMessages((prev) => [
              ...prev,
              {
                id: `cora-${Date.now()}`,
                sender: 'cora',
                type: 'verified_data',
                title: `Verified Scope 1 Emissions for ${dashboardData.company_name}`,
                verifiedData: {
                  total: `${dashboardData.total_co2e_tonnes} tCO2e`,
                  scope1: `${dashboardData.scope_1_tonnes} tCO2e`,
                  scope2: `${dashboardData.scope_2_tonnes} tCO2e`,
                  scope3: `${dashboardData.scope_3_tonnes} tCO2e`,
                },
                text: `According to verified records, ${dashboardData.company_name} has generated ${dashboardData.scope_1_tonnes} tCO2e in direct Scope 1 emissions (stationary combustion, mobile fleet, and fugitive releases).`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          }
          setLoading(false);
        }, 400);
        return;
      }

      if (lower.includes('scope 2') || lower.includes('scope-2')) {
        setTimeout(() => {
          if (!dashboardData) {
            setMessages((prev) => [
              ...prev,
              {
                id: `cora-${Date.now()}`,
                sender: 'cora',
                type: 'verified_data',
                text: `No verified emission data is available yet for ${activeCompany.company_name}. Please submit activity records to calculate your Scope 2 emissions.`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          } else {
            setMessages((prev) => [
              ...prev,
              {
                id: `cora-${Date.now()}`,
                sender: 'cora',
                type: 'verified_data',
                title: `Verified Scope 2 Emissions for ${dashboardData.company_name}`,
                verifiedData: {
                  total: `${dashboardData.total_co2e_tonnes} tCO2e`,
                  scope1: `${dashboardData.scope_1_tonnes} tCO2e`,
                  scope2: `${dashboardData.scope_2_tonnes} tCO2e`,
                  scope3: `${dashboardData.scope_3_tonnes} tCO2e`,
                },
                text: `According to verified records, ${dashboardData.company_name} has generated ${dashboardData.scope_2_tonnes} tCO2e in Scope 2 emissions from purchased electricity and utilities.`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          }
          setLoading(false);
        }, 400);
        return;
      }

      if (lower.includes('scope 3') || lower.includes('scope-3')) {
        setTimeout(() => {
          if (!dashboardData) {
            setMessages((prev) => [
              ...prev,
              {
                id: `cora-${Date.now()}`,
                sender: 'cora',
                type: 'verified_data',
                text: `No verified emission data is available yet for ${activeCompany.company_name}. Please submit activity records to calculate your Scope 3 emissions.`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          } else {
            setMessages((prev) => [
              ...prev,
              {
                id: `cora-${Date.now()}`,
                sender: 'cora',
                type: 'verified_data',
                title: `Verified Scope 3 Emissions for ${dashboardData.company_name}`,
                verifiedData: {
                  total: `${dashboardData.total_co2e_tonnes} tCO2e`,
                  scope1: `${dashboardData.scope_1_tonnes} tCO2e`,
                  scope2: `${dashboardData.scope_2_tonnes} tCO2e`,
                  scope3: `${dashboardData.scope_3_tonnes} tCO2e`,
                },
                text: `According to verified records, ${dashboardData.company_name} has generated ${dashboardData.scope_3_tonnes} tCO2e in Scope 3 value chain emissions.`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          }
          setLoading(false);
        }, 400);
        return;
      }

      // B. Flagged / Needs Review / Anomalies
      if (
        lower.includes('needs review') ||
        lower.includes('attention') ||
        lower.includes('flagged') ||
        lower.includes('why was this activity flagged') ||
        lower.includes('why is this activity marked') ||
        lower.includes('anomalies') ||
        lower.includes('anomaly')
      ) {
        setTimeout(() => {
          const flaggedList = activities.filter(
            (a) => a.emission?.status === 'Needs Review' || a.anomaly?.is_anomaly
          );
          setMessages((prev) => [
            ...prev,
            {
              id: `cora-${Date.now()}`,
              sender: 'cora',
              type: 'verified_data',
              title: `Audit Review & Flagged Activities`,
              text:
                flaggedList.length > 0
                  ? `There are currently ${flaggedList.length} activity record(s) requiring review or attention for ${activeCompany.company_name}:`
                  : `All current activity records for ${activeCompany.company_name} have been verified and calculated deterministically. No items currently require review.`,
              flaggedItems: flaggedList.map((item) => ({
                id: item.id,
                activity: item.activity,
                quantity: `${item.quantity} ${item.unit}`,
                reason:
                  item.emission?.review_reason ||
                  (item.anomaly?.is_anomaly ? item.anomaly.reason : 'Unverified factor or scope flag'),
              })),
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
          setLoading(false);
        }, 400);
        return;
      }

      // C. Latest Calculation / Recent Emissions
      if (
        lower.includes('latest calculation') ||
        lower.includes('recent emission') ||
        lower.includes('recent emissions') ||
        lower.includes('last calculation')
      ) {
        setTimeout(() => {
          const calculatedActivities = activities.filter((a) => a.emission && a.emission.co2e_tonnes !== undefined);
          if (calculatedActivities.length === 0) {
            setMessages((prev) => [
              ...prev,
              {
                id: `cora-${Date.now()}`,
                sender: 'cora',
                type: 'verified_data',
                text: `No calculated emission records were found for ${activeCompany.company_name}. You can add activities to run deterministic emission calculations.`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          } else {
            const latest = calculatedActivities[calculatedActivities.length - 1];
            setMessages((prev) => [
              ...prev,
              {
                id: `cora-${Date.now()}`,
                sender: 'cora',
                type: 'verified_data',
                title: `Latest Calculation for ${activeCompany.company_name}`,
                text: `Most recent calculation: "${latest.activity}" (${latest.quantity} ${latest.unit}) resulted in ${latest.emission.co2e_tonnes} tCO2e (${latest.emission.co2e_kg} kg CO2e) under ${latest.scope || 'Scope 1'}. Status: ${latest.emission.status || 'Verified'}.`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          }
          setLoading(false);
        }, 400);
        return;
      }

      // D. Total Emissions / Company Footprint summary
      setTimeout(() => {
        if (!dashboardData) {
          setMessages((prev) => [
            ...prev,
            {
              id: `cora-${Date.now()}`,
              sender: 'cora',
              type: 'verified_data',
              text: `No verified emission data is available yet for ${activeCompany.company_name}. Please submit activity records to calculate your carbon footprint.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `cora-${Date.now()}`,
              sender: 'cora',
              type: 'verified_data',
              title: `Verified Footprint for ${dashboardData.company_name}`,
              verifiedData: {
                total: `${dashboardData.total_co2e_tonnes} tCO2e`,
                scope1: `${dashboardData.scope_1_tonnes} tCO2e`,
                scope2: `${dashboardData.scope_2_tonnes} tCO2e`,
                scope3: `${dashboardData.scope_3_tonnes} tCO2e`,
                activities: `${dashboardData.activity_count} logged`,
                calculated: `${dashboardData.calculated_count} calculated`,
                needsReview: `${dashboardData.needs_review_count} needing review`,
              },
              text: `According to verified records, ${dashboardData.company_name} has a net footprint of ${dashboardData.total_co2e_tonnes} tCO2e across ${dashboardData.calculated_count} fully calculated records.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }
        setLoading(false);
      }, 400);
      return;
    }

    // =========================================================================
    // 4. OPEN-ENDED QUESTIONS / LYZR AI INTELLIGENCE
    // =========================================================================
    try {
      if (activeCompany?.id && dashboardData) {
        const aiRes = await api.ai.getInsights(activeCompany.id, {
          company_name: dashboardData.company_name,
          total_co2e_tonnes: dashboardData.total_co2e_tonnes,
          scope_1_tonnes: dashboardData.scope_1_tonnes,
          scope_2_tonnes: dashboardData.scope_2_tonnes,
          scope_3_tonnes: dashboardData.scope_3_tonnes,
          activity_count: dashboardData.activity_count,
          calculated_count: dashboardData.calculated_count,
          needs_review_count: dashboardData.needs_review_count,
          activity_breakdown: dashboardData.activity_breakdown,
        });

        if (aiRes.success && aiRes.data?.insight) {
          setMessages((prev) => [
            ...prev,
            {
              id: `cora-${Date.now()}`,
              sender: 'cora',
              type: 'ai_insight',
              title: 'Cora Carbon Intelligence Analysis',
              text: aiRes.data.insight,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `cora-${Date.now()}`,
              sender: 'cora',
              type: 'general_response',
              text: `Regarding "${text}": Carbonix AI strictly computes emissions using verified activity data and authoritative factor databases. You can review individual calculations under Audit Trail or ask me specific questions regarding Scope 1, Scope 2, Scope 3, or your verified company emissions.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }
      } else {
        // No company selected for open-ended general inquiry
        setMessages((prev) => [
          ...prev,
          {
            id: `cora-${Date.now()}`,
            sender: 'cora',
            type: 'general_response',
            text: `Regarding "${text}": Carbonix AI is your carbon accounting intelligence assistant. You can ask me general questions about ESG, Greenhouse Gases, Scopes 1-3, and carbon accounting standards without selecting an organization, or select an organization to view verified emission records.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `cora-${Date.now()}`,
          sender: 'cora',
          type: 'general_response',
          text: `I understand you're asking about "${text}". As your carbon intelligence assistant, I can explain greenhouse gas emission standards, break down Scope 1-3 protocols, or clarify audit records for your organization.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const QUICK_QUESTIONS = [
    { label: 'What is ESG?', query: 'What is ESG?' },
    { label: 'What are greenhouse gases?', query: 'What are greenhouse gases?' },
    { label: 'What is Scope 1?', query: 'What is Scope 1?' },
    { label: 'What is Scope 2?', query: 'What is Scope 2?' },
    { label: 'What is Scope 3?', query: 'What is Scope 3?' },
    { label: 'What is CO2e?', query: 'What is CO2e?' },
    { label: "My company's emissions?", query: "What are my company's emissions?" },
    { label: 'Activities needing review?', query: 'What activities need review?' },
    { label: 'How is emission calculated?', query: 'How is emission calculated?' },
  ];

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
            }}
          >
            <Sparkles size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.35rem', margin: 0, letterSpacing: '-0.02em' }}>Cora AI</h1>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '0.1rem 0.45rem',
                  borderRadius: '4px',
                  background: 'rgba(124, 58, 237, 0.15)',
                  color: '#c4b5fd',
                  border: '1px solid rgba(124, 58, 237, 0.25)',
                  textTransform: 'uppercase',
                }}
              >
                Intelligence Assistant
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.1rem' }}>
              Connected to <strong style={{ color: 'var(--text-primary)' }}>{activeCompany?.company_name || 'No organization selected'}</strong> &bull; Deterministic engine verified
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.725rem',
            padding: '0.25rem 0.65rem',
            borderRadius: '9999px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            color: '#34d399',
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
          <span>Lyzr Integration Active</span>
        </div>
      </div>

      {/* Quick Prompts Carousel / Chips */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          paddingBottom: '0.75rem',
          marginBottom: '0.5rem',
          scrollbarWidth: 'none',
        }}
      >
        {QUICK_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(q.query)}
            disabled={loading}
            style={{
              whiteSpace: 'nowrap',
              padding: '0.4rem 0.8rem',
              borderRadius: '9999px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              fontSize: '0.775rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--nav-active-border)';
              e.currentTarget.style.color = 'var(--nav-active-color)';
              e.currentTarget.style.background = 'var(--nav-active-bg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.background = 'var(--bg-card)';
            }}
          >
            <Sparkles size={12} style={{ color: 'var(--primary-light)' }} />
            <span>{q.label}</span>
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div
        className="glass-panel"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          marginBottom: '1rem',
        }}
      >
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  maxWidth: '85%',
                  flexDirection: isUser ? 'row-reverse' : 'row',
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isUser
                      ? 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(37,99,235,0.2))'
                      : 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(76,29,149,0.2))',
                    border: isUser ? '1px solid rgba(59,130,246,0.3)' : '1px solid var(--primary-light)',
                    color: isUser ? '#3b82f6' : 'var(--nav-active-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {isUser ? <User size={16} /> : <Bot size={16} />}
                </div>

                {/* Message Bubble */}
                <div
                  style={{
                    padding: '0.9rem 1.15rem',
                    borderRadius: '16px',
                    borderBottomRightRadius: isUser ? '4px' : '16px',
                    borderBottomLeftRadius: isUser ? '16px' : '4px',
                    background: isUser ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'var(--bg-card)',
                    border: isUser ? '1px solid rgba(124, 58, 237, 0.4)' : '1px solid var(--border-subtle)',
                    color: isUser ? '#ffffff' : 'var(--text-primary)',
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  {/* Badge Header for specialized Cora messages */}
                  {m.type === 'standard_knowledge' && (
                    <div style={{ marginBottom: '0.65rem' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.65rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          background: 'rgba(16, 185, 129, 0.12)',
                          color: 'var(--esg-accent)',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        <Globe2 size={12} />
                        <span>{m.badge || 'GHG Protocol Standard'}</span>
                      </span>
                      <h4 style={{ fontSize: '1rem', marginTop: '0.35rem', color: 'var(--text-primary)' }}>{m.title}</h4>
                      <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{m.summary}</p>
                      {m.points && (
                        <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                          {m.points.map((p, pIdx) => (
                            <li key={pIdx} style={{ marginBottom: '0.25rem' }}>{p}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {m.type === 'clarification' && (
                    <div>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.65rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          background: 'rgba(234, 179, 8, 0.12)',
                          color: '#eab308',
                          border: '1px solid rgba(234, 179, 8, 0.25)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <HelpCircle size={12} />
                        <span>Clarification Needed</span>
                      </span>
                      <p style={{ margin: 0 }}>{m.text}</p>
                    </div>
                  )}

                  {m.type === 'verified_data' && (
                    <div>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.65rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          background: 'rgba(56, 189, 248, 0.12)',
                          color: 'var(--scope-1)',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <ShieldCheck size={12} />
                        <span>Verified Backend Data</span>
                      </span>
                      {m.title && <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>{m.title}</h4>}
                      {m.verifiedData && (
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '0.5rem',
                            margin: '0.65rem 0',
                            padding: '0.75rem',
                            background: 'var(--bg-card-hover)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.8rem',
                          }}
                        >
                          <div><span style={{ color: 'var(--text-muted)' }}>Net Footprint:</span> <strong>{m.verifiedData.total}</strong></div>
                          <div><span style={{ color: 'var(--text-muted)' }}>Scope 1:</span> <strong>{m.verifiedData.scope1}</strong></div>
                          <div><span style={{ color: 'var(--text-muted)' }}>Scope 2:</span> <strong>{m.verifiedData.scope2}</strong></div>
                          <div><span style={{ color: 'var(--text-muted)' }}>Scope 3:</span> <strong>{m.verifiedData.scope3}</strong></div>
                        </div>
                      )}
                      <p>{m.text}</p>
                      {m.flaggedItems && m.flaggedItems.length > 0 && (
                        <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          {m.flaggedItems.map((fi) => (
                            <div
                              key={fi.id}
                              style={{
                                padding: '0.5rem 0.75rem',
                                borderRadius: 'var(--radius-sm)',
                                background: 'var(--status-flagged-bg)',
                                border: '1px solid var(--status-flagged-border)',
                                fontSize: '0.8rem',
                              }}
                            >
                              <div style={{ fontWeight: 600, color: 'var(--status-flagged-color)' }}>{fi.activity} ({fi.quantity})</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{fi.reason}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {m.type === 'ai_insight' && (
                    <div>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.65rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          background: 'var(--nav-active-bg)',
                          color: 'var(--nav-active-color)',
                          border: '1px solid var(--nav-active-border)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <Sparkles size={12} />
                        <span>AI Compliance Analysis</span>
                      </span>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
                    </div>
                  )}

                  {(!m.type || m.type === 'welcome' || m.type === 'general_response' || m.type === 'methodology_explanation') && (
                    <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
                  )}
                </div>
              </div>
              <span
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  marginTop: '0.25rem',
                  padding: isUser ? '0 0.5rem 0 0' : '0 0 0 2.75rem',
                }}
              >
                {m.timestamp}
              </span>
            </div>
          );
        })}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--nav-active-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--nav-active-color)',
                border: '1px solid var(--primary-light)',
              }}
            >
              <Bot size={16} />
            </div>
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '16px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div className="spinner" style={{ width: '14px', height: '14px', border: '2px solid var(--border-subtle)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
              <span>Cora is analyzing verified records...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        style={{
          display: 'flex',
          gap: '0.75rem',
        }}
      >
        <input
          type="text"
          className="form-input"
          placeholder="Ask Cora about Scope 1-3, emission factors, or your company's carbon footprint..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          style={{
            flex: 1,
            padding: '0.85rem 1.15rem',
            fontSize: '0.9rem',
            borderRadius: 'var(--radius-lg)',
          }}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !input.trim()}
          style={{
            padding: '0.85rem 1.4rem',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Send size={16} />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}

export default CoraAssistant;
