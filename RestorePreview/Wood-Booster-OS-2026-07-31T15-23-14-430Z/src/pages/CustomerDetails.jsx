import { useEffect, useState } from "react"
import { Link, useParams } from "react-router"

import { getCustomer } from "../data/customers"

function CustomerDetails() {
  const { customerId } = useParams()

  const [customer, setCustomer] = useState(null)
  const [projects, setProjects] = useState([])
  const [projectName, setProjectName] = useState("")


  useEffect(() => {
    async function loadData() {
      const customerData = await getCustomer(customerId)

      const projectsResponse = await fetch(
        `http://localhost:3001/api/customers/${customerId}/projects`,
      )

      const projectsData =
        await projectsResponse.json()

      setCustomer(customerData)
      setProjects(projectsData)
    }

    loadData()
  }, [customerId])


  async function handleCreateProject(event) {
    event.preventDefault()

    if (!projectName.trim()) {
      return
    }

    const response = await fetch(
      "http://localhost:3001/api/projects",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: projectName,
          customerId,
        }),
      },
    )

    const newProject = await response.json()

    setProjects((current) => [
      ...current,
      newProject,
    ])

    setProjectName("")
  }


  if (!customer) {
    return (
      <div className="min-h-screen bg-neutral-950 p-10 text-white">
        Ladataan asiakasta...
      </div>
    )
  }


  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-5xl px-6 py-10">

        <Link
          to="/customers"
          className="text-amber-400"
        >
          ← Takaisin asiakkaisiin
        </Link>


        <section className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-8">

          <h1 className="text-4xl font-bold">
            {customer.name}
          </h1>


          <div className="mt-6 space-y-2 text-neutral-300">
            <p>
              🏢 {customer.company || "Ei yritystä"}
            </p>

            <p>
              ✉ {customer.email || "Ei sähköpostia"}
            </p>

            <p>
              ☎ {customer.phone || "Ei puhelinta"}
            </p>
          </div>


          <section className="mt-8 rounded-xl bg-neutral-950 p-5">

            <h2 className="text-xl font-semibold">
              Projektit
            </h2>


            <form
              onSubmit={handleCreateProject}
              className="mt-5 flex gap-3"
            >

              <input
                value={projectName}
                onChange={(event) =>
                  setProjectName(event.target.value)
                }
                placeholder="Projektin nimi"
                className="flex-1 rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3"
              />


              <button
                className="rounded-xl bg-amber-500 px-5 py-3 font-semibold text-black"
              >
                + Lisää
              </button>

            </form>


            <div className="mt-6 space-y-3">

              {projects.map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="block rounded-xl border border-neutral-800 bg-neutral-900 p-4 transition hover:border-amber-500"
                >
                  🪵 {project.name}
                </Link>
              ))}


              {projects.length === 0 && (
                <p className="text-neutral-500">
                  Ei projekteja vielä
                </p>
              )}

            </div>

          </section>


        </section>

      </div>
    </main>
  )
}

export default CustomerDetails