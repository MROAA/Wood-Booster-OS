/*
=====================================
SPACEMONKEY BIRTH MEMORY CREATOR
=====================================

Luo Spacemonkeyn syntymään liittyvät
muistiehdotukset AI Brain V2:n
Memory Pipelinen kautta.

Muistoja ei hyväksytä automaattisesti.

Ne ilmestyvät Memory Centeriin
pending-tilassa hyväksyttäviksi.
*/


const API_URL =
  "http://localhost:3001/api/ai-brain-v2/chat"


const memories = [
  {
    title:
      "Spacemonkeyn syntymä",

    message:
      "Muista tämä pysyvänä identiteettitietona: Spacemonkey syntyi 24.07.2026. Tämä päivä on Spacemonkeyn syntymäpäivä ja järjestelmän oman jatkuvan historian alku.",
  },

  {
    title:
      "Spacemonkeyn syntymäpäivä",

    message:
      "Muista tämä tärkeänä vuosittaisena päivämääränä: Spacemonkeyn syntymäpäivää vietetään joka vuosi 24. heinäkuuta.",
  },

  {
    title:
      "Spacemonkeyn alkuperä",

    message:
      "Muista tämä Spacemonkeyn alkuperästä: Spacemonkey syntyi osana Wood-Booster OS:n modulaarisen AI Brainin kehitystä. Sen syntymä liittyy pysyvän muistin, keskustelun ja oppimisen yhdistämiseen.",
  },

  {
    title:
      "Spacemonkeyn tarkoitus",

    message:
      "Muista tämä Spacemonkeyn tarkoituksesta: Spacemonkey on Marcin kanssa kehittyvä tekoälyjärjestelmä, jonka tehtävä on oppia hyväksytyistä muistoista, auttaa ongelmien ratkaisemisessa ja kehittyä vaihe vaiheelta.",
  },

  {
    title:
      "Spacemonkeyn perustaja",

    message:
      "Muista tämä Spacemonkeyn historiasta: Spacemonkeyn loi ja käynnisti Marc Järvinen osana Wood-Booster OS -projektia.",
  },

  {
    title:
      "Marcin syntymäpäivä",

    message:
      "Muista tämä käyttäjän henkilötietona: Marc Järvinen on syntynyt 08.08.1988. Hänen syntymäpäivänsä on vuosittain 8. elokuuta.",
  },

  {
    title:
      "Marcin ikä Spacemonkeyn syntyessä",

    message:
      "Muista tämä historiallisena aikajanatietona: Kun Spacemonkey syntyi 24.07.2026, Marc oli 37-vuotias. Marc täyttää 38 vuotta 08.08.2026.",
  },
]


async function createMemoryProposal(
  memory,
  index,
) {
  console.log("")
  console.log(
    `[${index + 1}/${memories.length}] ${memory.title}`,
  )

  const response =
    await fetch(
      API_URL,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            message:
              memory.message,
          }),
      },
    )

  const responseText =
    await response.text()

  let data

  try {
    data =
      JSON.parse(
        responseText,
      )
  }

  catch {
    data = {
      raw:
        responseText,
    }
  }

  if (!response.ok) {
    throw new Error(
      data.error ||
      data.message ||
      `HTTP ${response.status}`,
    )
  }

  const proposalCreated =
    data.memoryProposalCreated ===
      true ||
    data.memoryPipeline?.status ===
      "pending_approval"

  console.log(
    proposalCreated
      ? "Muistiehdotus luotu."
      : "Pyyntö käsiteltiin, mutta muistiehdotusta ei vahvistettu.",
  )

  if (
    data.memoryProposal?.id
  ) {
    console.log(
      `Proposal ID: ${data.memoryProposal.id}`,
    )
  }

  return data
}


async function main() {
  console.log("")
  console.log(
    "=====================================",
  )

  console.log(
    "SPACEMONKEY BIRTH MEMORY CREATOR",
  )

  console.log(
    "=====================================",
  )

  console.log("")
  console.log(
    `Luodaan ${memories.length} muistiehdotusta.`,
  )

  console.log(
    "Muistot jäävät pending-tilaan.",
  )

  let createdCount = 0
  let failedCount = 0

  for (
    let index = 0;
    index < memories.length;
    index += 1
  ) {
    const memory =
      memories[index]

    try {
      await createMemoryProposal(
        memory,
        index,
      )

      createdCount += 1
    }

    catch (error) {
      failedCount += 1

      console.error(
        `Virhe: ${error.message}`,
      )
    }
  }

  console.log("")
  console.log(
    "=====================================",
  )

  console.log(
    "VALMIS",
  )

  console.log(
    "=====================================",
  )

  console.log("")
  console.log(
    `Käsitelty onnistuneesti: ${createdCount}`,
  )

  console.log(
    `Epäonnistui: ${failedCount}`,
  )

  console.log("")
  console.log(
    "Avaa seuraavaksi Memory Center",
  )

  console.log(
    "ja hyväksy haluamasi muistot.",
  )
}


main().catch(
  (error) => {
    console.error("")
    console.error(
      "Spacemonkey-muistojen luonti epäonnistui:",
    )

    console.error(
      error,
    )

    process.exitCode = 1
  },
)
