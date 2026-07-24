import {
  useEffect,
  useState,
} from "react"

import ProjectAIChat from "./ProjectAIChat"
import ProjectTools from "./ProjectTools"
import ProjectMemory from "./ProjectMemory"
import ProjectKnowledge from "./ProjectKnowledge"

import {
  ProjectAIProvider,
} from "./ProjectAIContext"

import {
  setActiveTab,
  setAvailableActions,
} from "../services/runtime/runtimeContext"


const tabs = [
  {
    id: "overview",
    label: "Overview",
    icon: "📋",
  },
  {
    id: "ai",
    label: "AI Assistant",
    icon: "🤖",
  },
  {
    id: "tools",
    label: "Tools",
    icon: "🛠",
  },
  {
    id: "memory",
    label: "Memory",
    icon: "🧠",
  },
  {
    id: "knowledge",
    label: "Knowledge",
    icon: "📚",
  },
  {
    id: "notes",
    label: "Notes",
    icon: "📝",
  },
  {
    id: "files",
    label: "Files",
    icon: "📁",
  },
]


function ProjectOverview({
  project,
}) {
  return (
    <div className="space-y-6">

      <div>

        <h2 className="text-xl font-bold">
          Projektin yhteenveto
        </h2>

        <p className="mt-2 text-neutral-400">
          Projektin tärkeimmät perustiedot.
        </p>

      </div>


      <div className="grid gap-4 md:grid-cols-2">

        <InfoCard
          title="Projektin nimi"
          value={
            project?.name ||
            "Ei nimeä"
          }
        />

        <InfoCard
          title="Tila"
          value={
            project?.status ||
            "Ei tilaa"
          }
        />

        <InfoCard
          title="Asiakas"
          value={
            project?.customer?.name ||
            "Ei asiakasta"
          }
        />

        <InfoCard
          title="Projektin ID"
          value={
            project?.id ||
            "Ei ID:tä"
          }
        />

      </div>


      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">

        <p className="text-sm text-neutral-500">
          Muistiinpanot
        </p>

        <p className="mt-3 whitespace-pre-wrap break-words leading-7 text-neutral-300">
          {project?.notes ||
            "Projektille ei ole vielä muistiinpanoja."}
        </p>

      </div>

    </div>
  )
}


function InfoCard({
  title,
  value,
}) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">

      <p className="text-sm text-neutral-500">
        {title}
      </p>

      <p className="mt-2 break-words font-semibold">
        {value}
      </p>

    </div>
  )
}


function ProjectNotes({
  project,
}) {
  return (
    <div className="space-y-5">

      <div>

        <h2 className="text-xl font-bold">
          📝 Projektin muistiinpanot
        </h2>

        <p className="mt-2 text-neutral-400">
          Projektin nykyiset muistiinpanot.
        </p>

      </div>


      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6">

        <p className="whitespace-pre-wrap break-words leading-7 text-neutral-300">
          {project?.notes ||
            "Muistiinpanoja ei ole vielä lisätty."}
        </p>

      </div>

    </div>
  )
}


function ProjectFiles() {
  return (
    <div className="space-y-5">

      <div>

        <h2 className="text-xl font-bold">
          📁 Projektin tiedostot
        </h2>

        <p className="mt-2 text-neutral-400">
          Tiedostojen hallinta lisätään myöhemmässä
          vaiheessa.
        </p>

      </div>


      <div className="rounded-2xl border border-dashed border-neutral-700 bg-neutral-950 p-10 text-center">

        <div className="text-4xl">
          📂
        </div>

        <p className="mt-4 font-semibold">
          Ei tiedostoja
        </p>

        <p className="mt-2 text-sm text-neutral-500">
          Tänne voidaan myöhemmin lisätä kuvat,
          piirustukset, tarjoukset ja muut
          projektitiedostot.
        </p>

      </div>

    </div>
  )
}


function ProjectTabs({
  project,
  onProjectUpdated,
}) {
  const [activeTab, setLocalActiveTab] =
    useState("overview")


  useEffect(() => {
    setLocalActiveTab("overview")
  }, [project?.id])


  useEffect(() => {
    function handleOpenProjectTab(
      event,
    ) {
      const requestedTab =
        String(
          event?.detail?.tab ||
          "",
        )
          .trim()
          .toLowerCase()

      const requestedProjectId =
        event?.detail?.projectId ||
        null

      if (!requestedTab) {
        return
      }

      const tabExists =
        tabs.some(
          (tab) =>
            tab.id ===
            requestedTab,
        )

      if (!tabExists) {
        console.warn(
          "Tuntematon projektivälilehti:",
          requestedTab,
        )

        return
      }

      /*
       * Jos tapahtuma koskee eri projektia,
       * odotetaan että navigointi avaa ensin
       * oikean ProjectDetails-sivun.
       */
      if (
        requestedProjectId &&
        project?.id &&
        String(requestedProjectId) !==
          String(project.id)
      ) {
        return
      }

      setLocalActiveTab(
        requestedTab,
      )
    }


    window.addEventListener(
      "wood-booster:open-project-tab",
      handleOpenProjectTab,
    )


    return () => {
      window.removeEventListener(
        "wood-booster:open-project-tab",
        handleOpenProjectTab,
      )
    }
  }, [project?.id])


  useEffect(() => {
    const currentTab =
      tabs.find(
        (tab) =>
          tab.id === activeTab,
      )

    setActiveTab({
      id:
        currentTab?.id ||
        activeTab,

      label:
        currentTab?.label ||
        activeTab,

      scope:
        "project",

      projectId:
        project?.id ||
        null,
    })


    setAvailableActions(
      createTabActions({
        activeTab,
        project,
      }),
    )
  }, [
    activeTab,
    project,
  ])


  function handleTabChange(
    tabId,
  ) {
    const tabExists =
      tabs.some(
        (tab) =>
          tab.id === tabId,
      )

    if (!tabExists) {
      return
    }

    setLocalActiveTab(
      tabId,
    )
  }


  function handleProjectUpdated(
    updatedProject,
  ) {
    if (
      !updatedProject ||
      typeof onProjectUpdated !==
        "function"
    ) {
      return
    }

    onProjectUpdated(
      updatedProject,
    )
  }


  function renderActiveTab() {
    switch (activeTab) {
      case "overview":
        return (
          <ProjectOverview
            project={project}
          />
        )

      case "ai":
        return (
          <ProjectAIChat />
        )

      case "tools":
        return (
          <ProjectTools
            project={project}
            onProjectUpdated={
              handleProjectUpdated
            }
          />
        )

      case "memory":
        return (
          <ProjectMemory
            project={project}
          />
        )

      case "knowledge":
        return (
          <ProjectKnowledge
            project={project}
          />
        )

      case "notes":
        return (
          <ProjectNotes
            project={project}
          />
        )

      case "files":
        return (
          <ProjectFiles />
        )

      default:
        return (
          <ProjectOverview
            project={project}
          />
        )
    }
  }


  return (
    <ProjectAIProvider
      project={project}
      onProjectUpdated={
        handleProjectUpdated
      }
    >
      <div className="space-y-6">

        <div className="overflow-x-auto border-b border-neutral-800">

          <div className="flex min-w-max gap-2">

            {tabs.map((tab) => {
              const isActive =
                activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() =>
                    handleTabChange(
                      tab.id,
                    )
                  }
                  className={`
                    flex
                    items-center
                    gap-2
                    border-b-2
                    px-4
                    py-3
                    text-sm
                    font-semibold
                    transition

                    ${
                      isActive
                        ? "border-amber-500 text-amber-400"
                        : "border-transparent text-neutral-400 hover:text-white"
                    }
                  `}
                >
                  <span>
                    {tab.icon}
                  </span>

                  <span>
                    {tab.label}
                  </span>
                </button>
              )
            })}

          </div>

        </div>


        <div>
          {renderActiveTab()}
        </div>

      </div>
    </ProjectAIProvider>
  )
}


function createTabActions({
  activeTab,
  project,
}) {
  const projectId =
    project?.id ||
    null

  const actions =
    tabs.map(
      (tab) => ({
        type:
          "open_project_tab",

        label:
          `Avaa ${tab.label}`,

        tab:
          tab.id,

        projectId,
      }),
    )


  if (activeTab === "overview") {
    actions.push({
      type:
        "update_project",

      label:
        "Päivitä projektin tiedot",

      projectId,
    })
  }


  if (activeTab === "ai") {
    actions.push({
      type:
        "send_project_ai_message",

      label:
        "Lähetä viesti projektin AI-avustajalle",

      projectId,
    })
  }


  if (activeTab === "tools") {
    actions.push({
      type:
        "use_project_tool",

      label:
        "Käytä projektityökalua",

      projectId,
    })
  }


  if (activeTab === "memory") {
    actions.push({
      type:
        "create_project_memory",

      label:
        "Tallenna projektimuisti",

      projectId,
    })
  }


  if (activeTab === "knowledge") {
    actions.push({
      type:
        "add_project_knowledge",

      label:
        "Lisää projektitietoa",

      projectId,
    })
  }


  if (activeTab === "notes") {
    actions.push({
      type:
        "create_project_note",

      label:
        "Luo projektimuistiinpano",

      projectId,
    })
  }


  if (activeTab === "files") {
    actions.push({
      type:
        "upload_project_file",

      label:
        "Lisää projektitiedosto",

      projectId,
    })
  }


  return actions
}


export default ProjectTabs
