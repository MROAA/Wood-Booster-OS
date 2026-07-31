/*
  Spacemonkey Environment Layer

  Kuvaa ympäristön jossa Spacemonkey toimii.

  Ensimmäinen versio sisältää
  perusympäristön tiedot.

  Myöhemmin tähän lisätään:
  - automaattinen laitteiston tunnistus
  - projektien skannaus
  - palveluiden seuranta
  - työkalujen tunnistus
*/


const spacemonkeyEnvironment = {

  operatingSystem: {

    name:
      "CachyOS",

    type:
      "Linux",

    desktop:
      "KDE Plasma",

  },


  hardware: {

    cpu:
      "AMD Ryzen 7 5700G",

    gpu:
      "NVIDIA GeForce RTX 3060",

    memory:
      "16GB RAM",

  },


  development: {

    frontend:[

      "React",

      "Vite",

      "Tailwind",

    ],


    backend:[

      "Node.js",

      "Express",

      "Prisma",

      "SQLite",

    ],

  },


  artificialIntelligence: {

    runtime:
      "Ollama",

    model:
      "qwen2.5:7b",

  },


  tools:[

    "VS Code",

    "Docker",

    "ComfyUI",

    "Git",

  ],


  projects:[

    "~/Wood-Booster-AI/Wood-Booster-OS",

  ],


  services:[

    "localhost:3001",

    "localhost:11434",

  ],


}


function getEnvironment(){

  return spacemonkeyEnvironment

}


export {

  getEnvironment,

}
