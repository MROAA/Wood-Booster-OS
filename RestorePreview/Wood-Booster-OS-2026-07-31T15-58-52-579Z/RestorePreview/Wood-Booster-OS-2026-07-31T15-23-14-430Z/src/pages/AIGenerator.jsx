import { useMemo, useState } from "react"
import { useNavigate } from "react-router"

const API_URL =
  "http://localhost:3001/api/ai/generate-project"

const emptyForm = {
  customerName: "",
  projectName: "",
  description: "",
  width: "",
  depth: "",
  height: "",
  woodType: "Tammi",
  style: "Skandinaavinen",
  budget: "",
  deadline: "",
}

function AIGenerator() {
  const navigate = useNavigate()

  const [form, setForm] = useState(emptyForm)
  const [generating, setGenerating] =
    useState(false)
  const [error, setError] = useState("")

  const estimatedArea = useMemo(() => {
    const width = toNumber(form.width)
    const depth = toNumber(form.depth)

    if (width <= 0 || depth <= 0) {
      return 0
    }

    return (width / 1000) * (depth / 1000)
  }, [form.width, form.depth])

  function handleChange(event) {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))

    setError("")
  }

  async function handleGenerate(event) {
    event.preventDefault()

    const projectName = form.projectName.trim()
    const description = form.description.trim()

    if (!projectName) {
      setError("Projektin nimi puuttuu.")
      return
    }

    if (!description) {
      setError("Kirjoita asiakkaan toive.")
      return
    }

    try {
      setGenerating(true)
      setError("")

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName:
            form.customerName.trim(),
          projectName,
          description,
          width: toNumber(form.width),
          depth: toNumber(form.depth),
          height: toNumber(form.height),
          woodType: form.woodType,
          style: form.style,
          budget: toNumber(form.budget),
          deadline: form.deadline || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            "AI-projektin luominen epäonnistui.",
        )
      }

      if (!data.projectId) {
        throw new Error(
          "Backend ei palauttanut projektin tunnistetta.",
        )
      }

      navigate(`/projects/${data.projectId}`)
    } catch (generateError) {
      console.error(generateError)
      setError(generateError.message)
    } finally {
      setGenerating(false)
    }
  }

  function resetForm() {
    setForm(emptyForm)
    setError("")
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header>
          <p className="text-xs uppercase tracking-[0.35em] text-amber-500">
            Wood-Booster AI
          </p>

          <h1 className="mt-3 text-4xl font-bold md:text-5xl">
            AI Project Generator
          </h1>

          <p className="mt-4 max-w-3xl text-neutral-400">
            Kuvaile asiakkaan toive. Wood-Booster
            luo oikean projektin, materiaalit,
            työvaiheet ja kustannusarvion suoraan
            tietokantaan.
          </p>
        </header>

        {error && (
          <div className="mt-6 rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-red-300">
            {error}
          </div>
        )}

        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_0.8fr]">
          <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <p className="text-xs uppercase tracking-wider text-neutral-500">
              Project brief
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              Asiakkaan toive
            </h2>

            <form
              onSubmit={handleGenerate}
              className="mt-6 space-y-5"
            >
              <FormField label="Asiakkaan nimi">
                <input
                  name="customerName"
                  value={form.customerName}
                  onChange={handleChange}
                  placeholder="Esimerkiksi Matti Meikäläinen"
                  className={inputClasses}
                />
              </FormField>

              <FormField label="Projektin nimi">
                <input
                  name="projectName"
                  value={form.projectName}
                  onChange={handleChange}
                  placeholder="Esimerkiksi Aurora-pöytä"
                  className={inputClasses}
                />
              </FormField>

              <FormField label="Projektin kuvaus">
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={7}
                  placeholder="Asiakas haluaa 2200 × 950 mm tammisen ruokapöydän mustilla teräsjaloilla..."
                  className={`${inputClasses} resize-y`}
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-3">
                <FormField label="Leveys mm">
                  <input
                    type="number"
                    name="width"
                    min="0"
                    value={form.width}
                    onChange={handleChange}
                    className={inputClasses}
                  />
                </FormField>

                <FormField label="Syvyys mm">
                  <input
                    type="number"
                    name="depth"
                    min="0"
                    value={form.depth}
                    onChange={handleChange}
                    className={inputClasses}
                  />
                </FormField>

                <FormField label="Korkeus mm">
                  <input
                    type="number"
                    name="height"
                    min="0"
                    value={form.height}
                    onChange={handleChange}
                    className={inputClasses}
                  />
                </FormField>
              </div>

              {estimatedArea > 0 && (
                <p className="rounded-xl bg-neutral-950 px-4 py-3 text-sm text-neutral-400">
                  Arvioitu kansipinta-ala:{" "}
                  <span className="font-semibold text-amber-400">
                    {formatNumber(estimatedArea)} m²
                  </span>
                </p>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Puulaji">
                  <select
                    name="woodType"
                    value={form.woodType}
                    onChange={handleChange}
                    className={inputClasses}
                  >
                    <option>Tammi</option>
                    <option>Saarni</option>
                    <option>Koivu</option>
                    <option>Mänty</option>
                    <option>Pähkinä</option>
                    <option>Muu</option>
                  </select>
                </FormField>

                <FormField label="Tyyli">
                  <select
                    name="style"
                    value={form.style}
                    onChange={handleChange}
                    className={inputClasses}
                  >
                    <option>Skandinaavinen</option>
                    <option>Rustic</option>
                    <option>Moderni</option>
                    <option>Industrial</option>
                    <option>River table</option>
                    <option>Minimalistinen</option>
                  </select>
                </FormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Budjetti €">
                  <input
                    type="number"
                    name="budget"
                    min="0"
                    value={form.budget}
                    onChange={handleChange}
                    className={inputClasses}
                  />
                </FormField>

                <FormField label="Deadline">
                  <input
                    type="date"
                    name="deadline"
                    value={form.deadline}
                    onChange={handleChange}
                    className={inputClasses}
                  />
                </FormField>
              </div>

              <button
                type="submit"
                disabled={generating}
                className="w-full rounded-xl bg-amber-500 px-5 py-3 font-semibold text-neutral-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generating
                  ? "Luodaan projektia..."
                  : "✨ Luo oikea projekti AI:lla"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                disabled={generating}
                className="w-full rounded-xl border border-neutral-700 px-5 py-3 font-semibold text-neutral-300 transition hover:bg-neutral-800 disabled:opacity-50"
              >
                Tyhjennä
              </button>
            </form>
          </section>

          <aside className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <p className="text-xs uppercase tracking-wider text-neutral-500">
              Automation
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              Mitä järjestelmä luo?
            </h2>

            <div className="mt-6 space-y-3">
              {[
                "Asiakkaan tai käyttää olemassa olevaa",
                "Projektin perustiedot",
                "Materiaalilistan",
                "Työvaiheet",
                "Työtunnit ja kustannukset",
                "Suositellun myyntihinnan",
                "Deadlinen",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-xl bg-neutral-950 px-4 py-3"
                >
                  <span className="text-green-400">
                    ✓
                  </span>

                  <span className="text-neutral-300">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
              <p className="text-sm leading-6 text-neutral-300">
                Onnistuneen luonnin jälkeen selain
                siirtyy automaattisesti uuden projektin
                sivulle.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}

function FormField({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm text-neutral-300">
        {label}
      </span>

      {children}
    </label>
  )
}

function toNumber(value) {
  const number = Number(value)

  return Number.isFinite(number)
    ? number
    : 0
}

function formatNumber(value) {
  return new Intl.NumberFormat("fi-FI", {
    maximumFractionDigits: 2,
  }).format(toNumber(value))
}

const inputClasses =
  "mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition placeholder:text-neutral-600 focus:border-amber-500"

export default AIGenerator
