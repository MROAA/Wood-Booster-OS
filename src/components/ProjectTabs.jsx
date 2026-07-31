import {
  useEffect,
  useState,
} from "react"



import ProjectAIChat from "./ProjectAIChat"
import ProjectTools from "./ProjectTools"
import ProjectMemory from "./ProjectMemory"
import ProjectKnowledge from "./ProjectKnowledge"

import MaterialsTab from "./MaterialsTab"
import NotesTab from "./NotesTab"
import GalleryTab from "./GalleryTab"
import TimelineTab from "./TimelineTab"
import WorkflowTab from "./WorkflowTab"
import QuoteTab from "./QuoteTab"

import FilesTab from "./project/FilesTab"


import {
  ProjectAIProvider,
} from "./ProjectAIContext"


import {
  setActiveTab,
  setAvailableActions,
} from "../services/runtime/runtimeContext"







const tabs = [

  {
    id:
      "overview",

    label:
      "Overview",

    icon:
      "📋",
  },


  {
    id:
      "ai",

    label:
      "AI Assistant",

    icon:
      "🤖",
  },


  {
    id:
      "tools",

    label:
      "Tools",

    icon:
      "🛠",
  },


  {
    id:
      "materials",

    label:
      "Materials",

    icon:
      "🪵",
  },


  {
    id:
      "timeline",

    label:
      "Timeline",

    icon:
      "📅",
  },


  {
    id:
      "gallery",

    label:
      "Gallery",

    icon:
      "🖼",
  },


  {
    id:
      "workflow",

    label:
      "Workflow",

    icon:
      "⚙️",
  },


  {
    id:
      "quote",

    label:
      "Quote",

    icon:
      "💶",
  },


  {
    id:
      "memory",

    label:
      "Memory",

    icon:
      "🧠",
  },


  {
    id:
      "knowledge",

    label:
      "Knowledge",

    icon:
      "📚",
  },


  {
    id:
      "notes",

    label:
      "Notes",

    icon:
      "📝",
  },


  {
    id:
      "files",

    label:
      "Files",

    icon:
      "📁",
  },

]







function ProjectOverview({
  project,
}) {


  return (

    <div
      className="
        space-y-6
      "
    >

      <div>

        <h2
          className="
            text-xl
            font-bold
          "
        >
          Projektin yhteenveto
        </h2>


        <p
          className="
            mt-2
            text-[var(--wood-muted)]
          "
        >
          Projektin tärkeimmät perustiedot.
        </p>


      </div>





      <div
        className="
          grid
          gap-4
          md:grid-cols-2
        "
      >

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





      <div
        className="
          card
          p-5
        "
      >

        <p
          className="
            text-sm
            text-[var(--wood-muted)]
          "
        >
          Muistiinpanot
        </p>


        <p
          className="
            mt-3
            whitespace-pre-wrap
            break-words
            leading-7
          "
        >

          {
            project?.notes ||
            "Projektille ei ole vielä muistiinpanoja."
          }

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

    <div
      className="
        card
        p-5
      "
    >

      <p
        className="
          text-sm
          text-[var(--wood-muted)]
        "
      >

        {title}

      </p>


      <p
        className="
          mt-2
          break-words
          font-semibold
        "
      >

        {value}

      </p>


    </div>

  )

}







function ProjectTabs({
  project,
  onProjectUpdated,
}) {


  const [
    activeTab,
    setLocalActiveTab,
  ] = useState(
    "overview"
  )







  useEffect(() => {

    setLocalActiveTab(
      "overview"
    )

  },[
    project?.id,
  ])







  useEffect(() => {


    function handleOpenProjectTab(
      event
    ) {


      const requestedTab =
        String(
          event?.detail?.tab ||
          ""
        )
        .trim()
        .toLowerCase()



      if(!requestedTab) {

        return

      }



      const exists =
        tabs.some(
          tab =>
            tab.id === requestedTab
        )



      if(!exists) {

        return

      }



      setLocalActiveTab(
        requestedTab
      )


    }







    window.addEventListener(

      "wood-booster:open-project-tab",

      handleOpenProjectTab

    )



    return () => {

      window.removeEventListener(

        "wood-booster:open-project-tab",

        handleOpenProjectTab

      )

    }


  },[])







  useEffect(() => {


    const current =
      tabs.find(
        tab =>
          tab.id === activeTab
      )



    setActiveTab({

      id:
        current?.id ||
        activeTab,

      label:
        current?.label ||
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
      })
    )


  },[
    activeTab,
    project,
  ])







  function renderActiveTab() {


    switch(activeTab) {


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
              onProjectUpdated
            }

          />

        )





      case "materials":

        return (

          <MaterialsTab

            projectId={
              project.id
            }

          />

        )





      case "timeline":

        return (

          <TimelineTab

            projectId={
              project.id
            }

            onProjectUpdated={
              onProjectUpdated
            }

          />

        )





      case "gallery":

        return (

          <GalleryTab

            projectId={
              project.id
            }

          />

        )





      case "workflow":

        return (

          <WorkflowTab

            projectId={
              project.id
            }

          />

        )





      case "quote":

        return (

          <QuoteTab

            project={
              project
            }

          />

        )





      case "memory":

        return (

          <ProjectMemory

            project={
              project
            }

          />

        )





      case "knowledge":

        return (

          <ProjectKnowledge

            project={
              project
            }

          />

        )





      case "notes":

        return (

          <NotesTab

            projectId={
              project.id
            }

          />

        )





      case "files":

        return (

          <FilesTab

            projectId={
              project.id
            }

          />

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

      project={
        project
      }

      onProjectUpdated={
        onProjectUpdated
      }

    >

      <div
        className="
          space-y-6
        "
      >

        <div
          className="
            overflow-x-auto
            border-b
            border-[var(--wood-border)]
          "
        >

          <div
            className="
              flex
              min-w-max
              gap-2
            "
          >

            {
              tabs.map(
                tab => (

                  <button

                    key={
                      tab.id
                    }

                    type="button"

                    onClick={() =>
                      setLocalActiveTab(
                        tab.id
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

                      ${
                        activeTab === tab.id

                        ?

                        "border-[var(--wood-accent)] text-[var(--wood-accent)]"

                        :

                        "border-transparent text-[var(--wood-muted)]"

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

              )

            }


          </div>


        </div>





        {
          renderActiveTab()
        }


      </div>


    </ProjectAIProvider>

  )


}







function createTabActions({
  activeTab,
  project,
}) {


  return tabs.map(
    tab => ({

      type:
        "open_project_tab",

      label:
        `Avaa ${tab.label}`,

      tab:
        tab.id,

      projectId:
        project?.id ||
        null,

    })
  )


}







export default ProjectTabs
