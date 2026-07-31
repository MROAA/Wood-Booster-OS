/*
==================================================

WOOD-BOOSTER AI AGENT LAW LOADER

Yhdistää kaikki yhteiset AI-agenttien lait.

Kaikki agentit käyttävät tätä kautta
yhteisiä toimintaperiaatteita.

==================================================
*/


import {
  CORE_LAW
} from "./agentLaws/coreLaw.js"


import {
  HALLUCINATION_LAW
} from "./agentLaws/hallucinationLaw.js"


import {
  SECURITY_LAW
} from "./agentLaws/securityLaw.js"


import {
  PROMPT_INJECTION_LAW
} from "./agentLaws/promptInjectionLaw.js"


import {
  MEMORY_LAW
} from "./agentLaws/memoryLaw.js"


import {
  ROLE_LAW
} from "./agentLaws/roleLaw.js"


import {
  DECISION_LAW
} from "./agentLaws/decisionLaw.js"


import {
  SOURCE_LAW
} from "./agentLaws/sourceLaw.js"


import {
  OUTPUT_LAW
} from "./agentLaws/outputLaw.js"





export const AGENT_LAW = `


==================================================

WOOD-BOOSTER AI MASTER LAW

==================================================



${CORE_LAW}



${HALLUCINATION_LAW}



${SECURITY_LAW}



${PROMPT_INJECTION_LAW}



${MEMORY_LAW}



${ROLE_LAW}



${DECISION_LAW}



${SOURCE_LAW}



${OUTPUT_LAW}



==================================================

END MASTER LAW

==================================================


`
