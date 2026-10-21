/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * HQ Systems (Project Atlas -luettelo)
 *
 * Kertoo MISTÄ kunkin järjestelmän koodi löytyy - ei sitä, toimiiko
 * se. Tila lasketaan aina todisteista (systemAtlas.js): onko koodi
 * olemassa, lataako palvelin (server/index.js) tai sovellus
 * (src/main.jsx) sen, löytyykö se vakaasta haarasta tai muista
 * haaroista, ja löytyykö testejä. Tähän ei saa kirjoittaa tilaa.
 *
 * code: polut projektin juuresta (tiedostoja tai hakemistoja).
 *   Tyhjä lista = tavoiteltu järjestelmä, jolle ei tunneta toteutusta;
 *   polkuja ei koskaan keksitä.
 * contains: lisätodisteet kytkennästä, kun järjestelmää ei ladata
 *   JavaScriptin importeilla (esim. git-hook tai npm-skripti).
 * docs: suunnitelmadokumentit repossa (vain "suunniteltu"-tilaan).
 * project: "hq" | "shared" (yhteinen AI-ydin).
 */

const HQ_SYSTEMS = [

    // Liiketoiminta

    {
        id: "dashboard",
        name: "Dashboard",
        project: "hq",
        domain: "business",
        purpose: "Työpäivän tilannekuva: aktiiviset projektit ja tunnusluvut.",
        code: ["src/pages/Dashboard.jsx", "server/routes/dashboard.js"],
    },
    {
        id: "projects",
        name: "Projektinhallinta",
        project: "hq",
        domain: "business",
        purpose: "Projektit, työvaiheet, aikajana, muistiinpanot, materiaalit ja tiedostot.",
        code: [
            "src/pages/Projects.jsx",
            "src/pages/ProjectDetails.jsx",
            "server/routes/projects.js",
            "server/routes/projectWorkflow.js",
            "server/routes/projectTimeline.js",
            "server/routes/projectNotes.js",
            "server/routes/projectMaterials.js",
        ],
    },
    {
        id: "customers",
        name: "Asiakashallinta",
        project: "hq",
        domain: "business",
        purpose: "Asiakkaat ja asiakkaiden projektit.",
        code: ["src/pages/Customers.jsx", "src/pages/CustomerDetails.jsx", "server/routes/customers.js"],
    },
    {
        id: "inventory",
        name: "Varasto",
        project: "hq",
        domain: "business",
        purpose: "Materiaalit, tarvikkeet ja varastomäärät.",
        code: ["src/pages/Inventory.jsx", "server/routes/inventory.js"],
    },
    {
        id: "purchases",
        name: "Ostot",
        project: "hq",
        domain: "business",
        purpose: "Ostotilaukset.",
        code: ["src/pages/Purchases.jsx", "server/routes/purchases.js"],
    },
    {
        id: "quotes",
        name: "Tarjoukset",
        project: "hq",
        domain: "business",
        purpose: "Projektin tarjous ja tarjousrivit.",
        code: ["src/pages/Quotes.jsx", "server/routes/projectQuote.js"],
    },
    {
        id: "invoices",
        name: "Laskutus",
        project: "hq",
        domain: "business",
        purpose: "Projektin lasku ja laskurivit.",
        code: ["src/pages/Invoices.jsx", "server/routes/projectInvoice.js"],
    },
    {
        id: "knowledge",
        name: "Tietopankki ja dokumentit",
        project: "hq",
        domain: "business",
        purpose: "Tietopankin dokumentit ja niiden lataus.",
        code: [
            "src/pages/Knowledge.jsx",
            "server/routes/knowledge.js",
            "server/routes/knowledge-upload.js",
        ],
    },
    {
        id: "creative-studio",
        name: "Media- ja markkinointityökalut",
        project: "hq",
        domain: "creative",
        purpose: "Somejulkaisujen ja blogin luonnokset, kuvamuokkaukset.",
        code: [
            "src/components/SocialStudioTab.jsx",
            "server/routes/socialStudio.js",
            "server/routes/wordpressStudio.js",
            "server/routes/mediaEdits.js",
        ],
    },
    {
        id: "product-design",
        name: "Tuotesuunnittelu",
        project: "hq",
        domain: "workshop",
        purpose: "Tuotteen mitat, rakenteet, materiaalit ja pintakäsittely (Master PRD V8).",
        code: [],
    },
    {
        id: "production-planning",
        name: "Valmistussuunnittelu",
        project: "hq",
        domain: "workshop",
        purpose: "Valmistusjärjestys, materiaali- ja työkalutarpeet (Master PRD V8).",
        code: [],
    },

    // Kehitys ja ylläpito

    {
        id: "dev-studio",
        name: "Dev Studio",
        project: "hq",
        domain: "development",
        purpose: "Python-luonnokset, katselmointi, hyväksyntä ja kirjoitus.",
        code: [
            "src/pages/DevStudio.jsx",
            "server/routes/devStudio.js",
            "server/services/spacemonkey/plugins/PythonDeveloper",
        ],
    },
    {
        id: "code-change-studio",
        name: "Koodimuutosluonnokset",
        project: "hq",
        domain: "development",
        purpose: "JavaScript-muutosluonnokset ja monitiedostosuunnitelmat (/koodi).",
        code: [
            "server/routes/devCodeChangeStudio.js",
            "server/routes/devMultiFileChangeStudio.js",
            "server/services/spacemonkey/plugins/CodeChangeDeveloper",
        ],
    },
    {
        id: "git-guardian",
        name: "Git Guardian",
        project: "hq",
        domain: "trust",
        purpose: "Commit-tarkistus ennen jokaista committia.",
        code: ["git_guardian_precommit.py", "backend/modules/git_guardian.py"],
        contains: [{ file: ".githooks/pre-commit", text: "git_guardian_precommit.py" }],
    },
    {
        id: "system-pulse",
        name: "System Pulse",
        project: "hq",
        domain: "trust",
        purpose: "Järjestelmän terveys ja build-vahti.",
        code: ["src/pages/SystemPulse.jsx", "server/routes/systemPulse.js"],
    },
    {
        id: "recovery",
        name: "Snapshot- ja palautusjärjestelmä",
        project: "hq",
        domain: "trust",
        purpose: "Varmuuskopiot, palautus ja hyväksytty palautus.",
        code: [
            "server/routes/recovery.js",
            "server/routes/backup.js",
            "server/services/systemRecovery",
        ],
    },
    {
        id: "stable-build",
        name: "Stable Build Controller",
        project: "hq",
        domain: "trust",
        purpose: "Build-tarkistus ja vakaiden buildien kirjanpito.",
        code: ["scripts/stable-build-check.js"],
        contains: [{ file: "package.json", text: "stable-build-check.js" }],
    },
    {
        id: "desktop",
        name: "Boosterverse Desktop",
        project: "hq",
        domain: "workspace",
        purpose: "Työpöytä, ikkunat ja sovellukset selaimessa.",
        code: ["src/pages/BoosterverseDesktop.jsx"],
    },

    // Yhteinen AI-ydin

    {
        id: "spacemonkey-chat",
        name: "Spacemonkey-keskustelu",
        project: "shared",
        domain: "ai",
        purpose: "HQ:n keskustelun pääreitti ja käyttöliittymä.",
        code: [
            "src/components/ai/ChatPanel.jsx",
            "src/pages/SpacemonkeyChat.jsx",
            "server/routes/agentChat.js",
        ],
    },
    {
        id: "ai-brain",
        name: "AI Brain",
        project: "shared",
        domain: "ai",
        purpose: "Kielimallin kutsu, konteksti ja muistiehdotukset.",
        code: ["server/services/aiBrain.js", "server/services/aiBrainV2/brainOrchestrator.js"],
    },
    {
        id: "spacemonkey-runtime",
        name: "Spacemonkey Runtime",
        project: "shared",
        domain: "ai",
        purpose: "ToolBus, Skill Engine, Workflow Engine, Plugin Manager ja Capability Registry.",
        code: [
            "server/services/spacemonkey/spacemonkeyRuntimeBootstrap.js",
            "server/services/spacemonkey/toolbus/ToolBus.js",
            "server/services/spacemonkey/skills/SkillEngine.js",
            "server/services/spacemonkey/workflows/WorkflowEngine.js",
            "server/services/spacemonkey/plugins/PluginManager.js",
        ],
    },
    {
        id: "agent-runtime",
        name: "Agent Runtime",
        project: "shared",
        domain: "ai",
        purpose: "Agenttien valinta kyvykkyyden perusteella, tehtävän tila ja aikaraja.",
        code: [
            "server/services/spacemonkey/agents/runtime/AgentRuntime.js",
            "server/services/spacemonkey/agents/runtime/agentTask.js",
        ],
    },
    {
        id: "hq-assistant",
        name: "HQ-avustaja keskustelussa",
        project: "shared",
        domain: "ai",
        purpose: "Rekisteröidyt vain luku -kyvykkyydet: projektit, tiedostot, agentit.",
        code: [
            "server/services/chatModes/hqAssistant.js",
            "server/services/spacemonkey/plugins/HqAssistant",
        ],
    },
    {
        id: "project-atlas",
        name: "Project Atlas",
        project: "shared",
        domain: "ai",
        purpose: "Spacemonkeyn tieto siitä, mitä HQ:ssa on rakennettu.",
        code: [
            "server/services/spacemonkey/inventory/systemAtlas.js",
            "server/services/spacemonkey/inventory/hqSystems.js",
        ],
    },
    {
        id: "workspace-root",
        name: "Spacemonkeyn työtila (Workspace Root)",
        project: "shared",
        domain: "ai",
        purpose: "Spacemonkeyn oma eristetty työtila: tehtävät, raportit ja luonnokset.",
        code: ["server/services/spacemonkey/workspace/SpacemonkeyWorkspace.js"],
    },
    {
        id: "system-operator",
        name: "Koneen tilan tarkkailu (OS Operator, vain luku)",
        project: "shared",
        domain: "trust",
        purpose: "Muisti, kuorma, levytila, sallitut palvelut ja terveysreitit ilman root-oikeuksia.",
        code: [
            "server/services/spacemonkey/os/systemObserver.js",
            "server/services/spacemonkey/plugins/SystemOperator",
        ],
    },
    {
        id: "browser-operator",
        name: "Selainoperaattori (Playwright)",
        project: "shared",
        domain: "development",
        purpose: "Ennalta määritellyt käyttöliittymätestit eristetyssä selaimessa, vain lukevat pyynnöt.",
        code: [
            "server/services/spacemonkey/browser/BrowserOperator.js",
            "server/services/spacemonkey/plugins/BrowserOperator",
        ],
    },
    {
        id: "identity",
        name: "Identiteetti ja Godfilet",
        project: "shared",
        domain: "ai",
        purpose: "Spacemonkeyn persoona ja perussäännöt.",
        code: [
            "server/services/aiBrainV2/system/spacemonkey/spacemonkeyGodFileLoader.js",
            "server/services/aiBrainV2/system/spacemonkey/godfiles",
        ],
    },
    {
        id: "knowledge-layer",
        name: "Tietokerros",
        project: "shared",
        domain: "ai",
        purpose: "ai-knowledge-tiedostojen haku keskusteluun.",
        code: ["server/services/knowledgeSearch.js", "server/ai-knowledge"],
    },
    {
        id: "memory-layer",
        name: "Muisti",
        project: "shared",
        domain: "ai",
        purpose: "Hyväksytyt muistit ja muistiehdotukset.",
        code: ["src/pages/Memory.jsx", "server/routes/memory.js"],
    },
    {
        id: "approval-gateway",
        name: "Human Approval Gateway",
        project: "shared",
        domain: "trust",
        purpose: "Palvelintason hyväksyntä kirjoittaville toiminnoille.",
        code: ["server/services/hearthwoodApproval"],
        docs: ["docs/security/human-approval-gateway-v1.md"],
    },

]

export default HQ_SYSTEMS
