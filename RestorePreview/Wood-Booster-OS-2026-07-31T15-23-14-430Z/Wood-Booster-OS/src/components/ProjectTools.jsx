import {
  useState,
} from "react"

import {
  apiPost,
} from "../api/client"


const API_URL =
  "http://localhost:3001/api"


const tools = [
  {
    id: "workflow",
    icon: "🪚",
    title: "Luo työvaiheet",
    description:
      "Workshop Agent laatii projektille selkeän valmistusjärjestyksen.",
    instruction:
      "Laadi tälle projektille yksityiskohtainen ja käytännöllinen valmistuksen työvaihelista.",
  },
  {
    id: "materials",
    icon: "🪵",
    title: "Luo materiaalilista",
    description:
      "Product Agent arvioi projektiin tarvittavat materiaalit.",
    instruction:
      "Laadi tälle projektille materiaalilista. Erottele puu, epoksi, kiinnikkeet, pintakäsittelyaineet ja muut tarvikkeet.",
  },
  {
    id: "pricing",
    icon: "💶",
    title: "Laske hinta",
    description:
      "Pricing Agent tekee alustavan kustannus- ja hintalaskelman.",
    instruction:
      "Laadi tälle projektille alustava kustannus- ja myyntihintalaskelma. Erottele materiaalit, työtunnit, muut kulut, kate ja suositeltu myyntihinta. Kerro selvästi, jos tarkkoja lähtötietoja puuttuu.",
  },
  {
    id: "quote",
    icon: "📄",
    title: "Luo tarjousluonnos",
    description:
      "CRM Agent laatii asiakkaalle tarkistettavan tarjousluonnoksen.",
    instruction:
      "Laadi tästä projektista selkeä asiakkaalle lähetettävä tarjousluonnos. Älä väitä puuttuvia hintoja tai toimitusaikoja varmoiksi, vaan merkitse ne tarkistettaviksi.",
  },
  {
    id: "marketing",
    icon: "📣",
    title: "Luo markkinointiluonnos",
    description:
      "Marketing Agent kirjoittaa Wood-Booster-brändin mukaisen tekstin.",
    instruction:
      "Laadi tästä projektista Wood-Booster-brändin mukainen markkinointitekstin luonnos. Korosta käsityötä, laatua, puun luonnollista historiaa ja ajatusta: Me jatkamme puun tarinaa.",
  },
]


function ProjectTools({
  project,
  onProjectUpdated,
}) {
  const [activeTool, setActiveTool] =
    useState(null)

  const [result, setResult] =
    useState("")

  const [agent, setAgent] =
    useState("")

  const [reason, setReason] =
    useState("")

  const [error, setError] =
    useState("")

  const [loading, setLoading] =
    useState(false)

  const [saving, setSaving] =
    useState(false)

  const [saved, setSaved] =
    useState(false)

  const [copied, setCopied] =
    useState(false)


  async function runTool(tool) {
    if (loading || saving) {
      return
    }

    setActiveTool(tool.id)
    setResult("")
    setAgent("")
    setReason("")
    setError("")
    setCopied(false)
    setSaved(false)
    setLoading(true)

    const projectContext = `
WOOD-BOOSTER PROJECT TOOL

====================
PROJECT
====================

Project ID:
${project.id}

Name:
${project.name || "Ei nimeä"}

Status:
${project.status || "Ei tilaa"}

Customer:
${project.customer?.name || "Ei asiakasta"}

Notes:
${project.notes || "Ei muistiinpanoja"}

====================
TASK
====================

${tool.instruction}

====================
REQUIREMENTS
====================

- Käytä vain saatavilla olevaa projektitietoa ja Wood-Booster-tietopankkia.
- Noudata Truth Layeria ja Truth Authority -tietoa.
- Älä keksi puuttuvia materiaaleja, mittoja, hintoja tai päivämääriä.
- Merkitse puuttuvat lähtötiedot selvästi.
- Anna käytännöllinen ja helposti luettava tulos.
- Vastaa suomeksi.
`.trim()

    try {
      const data = await apiPost(
        "/agents/chat",
        {
          message: projectContext,
        },
      )

      const answer =
        data.answer ||
        data.response ||
        data.message

      if (!answer) {
        throw new Error(
          data.error ||
          "AI ei palauttanut vastausta.",
        )
      }

      setResult(answer)

      setAgent(
        data.agent ||
        "Tuntematon agentti",
      )

      setReason(
        data.reason ||
        "Reitityksen syytä ei palautettu.",
      )
    } catch (requestError) {
      console.error(
        "Project tool error:",
        requestError,
      )

      setError(
        requestError?.message ||
        "Työkalun suorittaminen epäonnistui.",
      )
    } finally {
      setLoading(false)
    }
  }


  async function saveToProjectNotes() {
    if (!result || saving) {
      return
    }

    setSaving(true)
    setSaved(false)
    setError("")

    const selectedTool =
      tools.find(
        (tool) =>
          tool.id === activeTool,
      )

    const currentNotes =
      project.notes?.trim() || ""

    const timestamp =
      new Date().toLocaleString(
        "fi-FI",
      )

    const newNoteSection = `
==============================
AI-TYÖKALUN TULOS
==============================

Työkalu:
${selectedTool?.title || "AI Tool"}

Agentti:
${agent || "Tuntematon"}

Tallennettu:
${timestamp}

${result}
`.trim()

    const updatedNotes =
      currentNotes
        ? `${currentNotes}\n\n${newNoteSection}`
        : newNoteSection

    try {
      const response = await fetch(
        `${API_URL}/projects/${project.id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            notes: updatedNotes,
          }),
        },
      )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
          "Muistiinpanojen tallentaminen epäonnistui.",
        )
      }

      const updatedProject =
        data.project

      if (!updatedProject) {
        throw new Error(
          "Backend ei palauttanut päivitettyä projektia.",
        )
      }

      if (
        typeof onProjectUpdated ===
        "function"
      ) {
        onProjectUpdated(
          updatedProject,
        )
      }

      setSaved(true)
    } catch (saveError) {
      console.error(
        "Save project notes error:",
        saveError,
      )

      setError(
        saveError?.message ||
        "AI-tuloksen tallentaminen epäonnistui.",
      )
    } finally {
      setSaving(false)
    }
  }


  async function copyResult() {
    if (!result) {
      return
    }

    try {
      await navigator.clipboard.writeText(
        result,
      )

      setCopied(true)

      window.setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (copyError) {
      console.error(
        "Copy failed:",
        copyError,
      )

      setError(
        "Tuloksen kopioiminen epäonnistui.",
      )
    }
  }


  function clearResult() {
    if (loading || saving) {
      return
    }

    setActiveTool(null)
    setResult("")
    setAgent("")
    setReason("")
    setError("")
    setCopied(false)
    setSaved(false)
  }


  const selectedTool =
    tools.find(
      (tool) =>
        tool.id === activeTool,
    )


  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-xl font-bold">
          🛠 Project AI Tools
        </h2>

        <p className="mt-2 max-w-3xl text-neutral-400">
          Käytä Wood-Boosterin agentteja projektin
          suunnitteluun, materiaalien arviointiin,
          hinnoitteluun ja viestintään.
        </p>
      </div>


      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">

        {tools.map((tool) => {
          const isActive =
            activeTool === tool.id

          const isProcessing =
            isActive && loading

          return (
            <button
              key={tool.id}
              type="button"
              onClick={() =>
                runTool(tool)
              }
              disabled={
                loading || saving
              }
              className={`
                rounded-2xl
                border
                p-5
                text-left
                transition
                disabled:cursor-not-allowed
                disabled:opacity-60

                ${
                  isActive
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-neutral-800 bg-neutral-950 hover:border-neutral-700 hover:bg-neutral-900"
                }
              `}
            >
              <div className="text-3xl">
                {tool.icon}
              </div>

              <h3 className="mt-4 font-bold">
                {tool.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-neutral-400">
                {tool.description}
              </p>

              <p className="mt-4 text-sm font-semibold text-amber-400">
                {isProcessing
                  ? "AI käsittelee..."
                  : "Suorita työkalu →"}
              </p>
            </button>
          )
        })}

      </div>


      {loading && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
          <p className="font-semibold text-amber-300">
            AI käsittelee työkalua
          </p>

          <p className="mt-2 text-sm text-neutral-400">
            {selectedTool?.title ||
              "Project AI Tool"}
          </p>
        </div>
      )}


      {error && (
        <div className="rounded-2xl border border-red-800 bg-red-950/60 p-5">
          <p className="font-semibold text-red-300">
            Toiminto epäonnistui
          </p>

          <p className="mt-2 text-sm text-red-200">
            {error}
          </p>
        </div>
      )}


      {saved && (
        <div className="rounded-2xl border border-green-800 bg-green-950/40 p-5">
          <p className="font-semibold text-green-300">
            AI-tulos tallennettiin projektin
            muistiinpanoihin.
          </p>
        </div>
      )}


      {result && (
        <section className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6">

          <div className="flex flex-col gap-4 border-b border-neutral-800 pb-5 sm:flex-row sm:items-start sm:justify-between">

            <div>
              <div className="flex flex-wrap items-center gap-3">

                <h3 className="text-lg font-bold">
                  {selectedTool?.icon}
                  {" "}
                  {selectedTool?.title ||
                    "AI-tulos"}
                </h3>

                <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400">
                  VALMIS
                </span>

              </div>

              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-neutral-400">

                <p>
                  Agentti:
                  {" "}
                  <span className="font-semibold text-neutral-200">
                    {agent}
                  </span>
                </p>

                <p>
                  Reititys:
                  {" "}
                  <span className="text-neutral-300">
                    {reason}
                  </span>
                </p>

              </div>
            </div>


            <div className="flex flex-wrap gap-2">

              <button
                type="button"
                onClick={
                  saveToProjectNotes
                }
                disabled={
                  saving || saved
                }
                className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Tallennetaan..."
                  : saved
                    ? "Tallennettu ✓"
                    : "Tallenna muistiinpanoihin"}
              </button>

              <button
                type="button"
                onClick={copyResult}
                disabled={saving}
                className="rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm font-semibold text-neutral-200 transition hover:bg-neutral-800 disabled:opacity-60"
              >
                {copied
                  ? "Kopioitu ✓"
                  : "Kopioi"}
              </button>

              <button
                type="button"
                onClick={clearResult}
                disabled={saving}
                className="rounded-xl border border-neutral-700 px-4 py-2 text-sm font-semibold text-neutral-400 transition hover:bg-neutral-900 hover:text-white disabled:opacity-60"
              >
                Tyhjennä
              </button>

            </div>

          </div>


          <div className="mt-6 whitespace-pre-wrap leading-7 text-neutral-300">
            {result}
          </div>

        </section>
      )}

    </div>
  )
}


export default ProjectTools
