import {
  Link,
  useParams,
} from "react-router-dom"

import {
  useEffect,
  useState,
} from "react"

import {
  apiGet,
} from "../api/client"

import ProjectTabs from "../components/ProjectTabs"

import {
  clearActiveCustomer,
  clearActiveProject,
  setActiveCustomer,
  setActiveProject,
  setAvailableActions,
} from "../services/runtime/runtimeContext"


function ProjectDetails() {
  const { id } = useParams()

  const [project, setProject] =
    useState(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")


  useEffect(() => {
    let cancelled = false


    async function loadProject() {
      setLoading(true)
      setError("")

      clearActiveProject()
      clearActiveCustomer()

      try {
        const data =
          await apiGet(
            `/projects/${id}`,
          )

        const loadedProject =
          data?.project || data

        if (!loadedProject?.id) {
          throw new Error(
            "Backend ei palauttanut projektia.",
          )
        }

        if (!cancelled) {
          setProject(
            loadedProject,
          )
        }
      } catch (loadError) {
        console.error(
          "Project loading error:",
          loadError,
        )

        if (!cancelled) {
          setProject(null)

          setError(
            loadError?.message ||
            "Projektin lataaminen epäonnistui.",
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }


    loadProject()


    return () => {
      cancelled = true

      clearActiveProject()
      clearActiveCustomer()

      setAvailableActions([])
    }
  }, [id])


  useEffect(() => {
    function handleProjectUpdatedEvent(
      event,
    ) {
      const detail =
        event?.detail || {}

      const updatedProject =
        detail.project

      const updatedProjectId =
        String(
          updatedProject?.id ||
          detail.projectId ||
          "",
        )

      const currentProjectId =
        String(id || "")

      if (
        !updatedProjectId ||
        updatedProjectId !==
          currentProjectId
      ) {
        return
      }

      setProject(
        (currentProject) => {
          if (!currentProject) {
            return (
              updatedProject ||
              null
            )
          }

          if (!updatedProject) {
            return currentProject
          }

          return {
            ...currentProject,
            ...updatedProject,

            customer:
              updatedProject.customer ??
              currentProject.customer,
          }
        },
      )
    }


    window.addEventListener(
      "wood-booster:project-updated",
      handleProjectUpdatedEvent,
    )


    return () => {
      window.removeEventListener(
        "wood-booster:project-updated",
        handleProjectUpdatedEvent,
      )
    }
  }, [id])


  useEffect(() => {
    if (!project?.id) {
      return
    }

    setActiveProject({
      id:
        project.id,

      name:
        project.name ||
        "Nimetön projekti",

      status:
        project.status ||
        null,

      notes:
        project.notes ||
        null,

      customerId:
        project.customerId ||
        project.customer?.id ||
        null,
    })


    if (project.customer) {
      setActiveCustomer({
        id:
          project.customer.id ||
          project.customerId ||
          null,

        name:
          project.customer.name ||
          "Nimetön asiakas",

        email:
          project.customer.email ||
          null,

        phone:
          project.customer.phone ||
          null,

        company:
          project.customer.company ||
          null,
      })
    } else {
      clearActiveCustomer()
    }


    setAvailableActions([
      {
        type: "navigate",
        label: "Avaa projektit",
        path: "/projects",
      },
      {
        type: "open_project_tab",
        label:
          "Avaa projektin yleisnäkymä",
        tab: "overview",
      },
      {
        type: "open_project_tab",
        label: "Avaa materiaalit",
        tab: "materials",
      },
      {
        type: "open_project_tab",
        label: "Avaa tiedostot",
        tab: "files",
      },
      {
        type: "open_project_tab",
        label: "Avaa muistiinpanot",
        tab: "notes",
      },
      {
        type: "open_project_tab",
        label: "Avaa aikajana",
        tab: "timeline",
      },
      {
        type: "open_project_tab",
        label: "Avaa galleria",
        tab: "gallery",
      },
      {
        type: "open_project_tab",
        label: "Avaa työnkulku",
        tab: "workflow",
      },
      {
        type: "open_project_tab",
        label: "Avaa tarjous",
        tab: "quote",
      },
      {
        type: "update_project",
        label: "Päivitä projekti",
        projectId:
          project.id,
      },
      {
        type:
          "create_project_note",
        label:
          "Luo projektimuistiinpano",
        projectId:
          project.id,
      },
    ])
  }, [project])


  function handleProjectUpdated(
    updatedProject,
  ) {
    if (!updatedProject) {
      return
    }

    setProject(
      (currentProject) => {
        if (!currentProject) {
          return updatedProject
        }

        return {
          ...currentProject,
          ...updatedProject,

          customer:
            updatedProject.customer ??
            currentProject.customer,
        }
      },
    )
  }


  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        Ladataan projektia...
      </div>
    )
  }


  if (error) {
    return (
      <div className="space-y-5">

        <Link
          to="/projects"
          className="text-amber-400 transition hover:text-amber-300"
        >
          ← Projects
        </Link>

        <div className="rounded-2xl border border-red-900 bg-red-950/40 p-6">

          <p className="font-semibold text-red-300">
            Projektin lataaminen
            epäonnistui
          </p>

          <p className="mt-2 text-sm text-red-200">
            {error}
          </p>

        </div>

      </div>
    )
  }


  if (!project) {
    return (
      <div className="space-y-5">

        <Link
          to="/projects"
          className="text-amber-400 transition hover:text-amber-300"
        >
          ← Projects
        </Link>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          Projektia ei löytynyt.
        </div>

      </div>
    )
  }


  return (
    <div className="space-y-8">

      <Link
        to="/projects"
        className="inline-flex text-amber-400 transition hover:text-amber-300"
      >
        ← Projects
      </Link>


      <header>

        <p className="text-sm uppercase tracking-[0.25em] text-amber-500">
          Project OS
        </p>

        <h1 className="mt-3 text-4xl font-bold">
          📦 {project.name}
        </h1>

      </header>


      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

        <Card
          title="Status"
          value={
            project.status ||
            "Ei tilaa"
          }
        />

        <Card
          title="Customer"
          value={
            project.customer?.name ||
            "Ei asiakasta"
          }
        />

        <Card
          title="Project ID"
          value={project.id}
        />

      </div>


      <ProjectTabs
        project={project}
        onProjectUpdated={
          handleProjectUpdated
        }
      />

    </div>
  )
}


function Card({
  title,
  value,
}) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">

      <p className="text-neutral-500">
        {title}
      </p>

      <p className="mt-2 break-words text-xl font-bold">
        {value}
      </p>

    </div>
  )
}


export default ProjectDetails
