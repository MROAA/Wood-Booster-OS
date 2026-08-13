const systemArchitecture = {


  name:
    "Wood-Booster AI Platform",


  version:
    "1.0.0",



  philosophy: {

    description:
      "Modular AI operating platform designed to grow safely over time.",


    principles:[

      "modularity",

      "security_first",

      "controlled_growth",

      "human_approval",

      "knowledge_driven"

    ]

  },




  layers:{



    core: {

      name:
        "AI Core Kernel",


      purpose:
        "Central coordination layer for all AI operations.",


      modules:[

        "requestRouter",

        "contextEngine",

        "eventBus",

        "systemState",

        "orchestrator"

      ]

    },





    intelligence: {

      name:
        "Intelligence Layer",


      purpose:
        "Reasoning, planning and decision capabilities.",


      modules:[

        "aiBrainV2",

        "reasoning",

        "decision",

        "planning"

      ]

    },





    knowledge: {

      name:
        "Knowledge System",


      purpose:
        "Structured information and truth management.",


      modules:[

        "knowledgeRouter",

        "knowledgeValidator",

        "knowledgeGraph",

        "sourceManager"

      ]

    },





    memory: {

      name:
        "Memory System",


      purpose:
        "Controlled learning and memory management.",


      modules:[

        "shortTermMemory",

        "longTermMemory",

        "memoryApproval",

        "memoryRetrieval"

      ]

    },





    identity: {

      name:
        "Identity Layer",


      purpose:
        "Defines AI personality, values and behaviour.",


      modules:[

        "personalityEngine",

        "values",

        "communicationStyle",

        "creatorIdentity"

      ]

    },





    agents: {

      name:
        "Agent System",


      purpose:
        "Specialized AI workers using shared intelligence.",


      modules:[

        "workshopAgent",

        "businessAgent",

        "codingAgent",

        "designAgent",

        "researchAgent"

      ]

    },





    tools: {

      name:
        "Tool System",


      purpose:
        "Controlled access to external actions.",


      modules:[

        "filesystem",

        "database",

        "terminal",

        "automation"

      ]

    },





    security: {

      name:
        "Security Layer",


      purpose:
        "Protects system, data and actions.",


      modules:[

        "permissionManager",

        "policyEngine",

        "auditLogger",

        "approvalSystem"

      ]

    }



  }




}







function getSystemArchitecture(){


  return systemArchitecture


}







function getArchitectureLayer(name){


  return systemArchitecture.layers[name]

}







export {

  getSystemArchitecture,

  getArchitectureLayer

}
