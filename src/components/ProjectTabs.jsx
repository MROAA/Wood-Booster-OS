import {
  useEffect,
  useState,
} from "react"

import {
  useSearchParams,
} from "react-router-dom"



import ProjectAIChat from "./ProjectAIChat"
import ProjectTools from "./ProjectTools"
import ProjectMemory from "./ProjectMemory"
import ProjectKnowledge from "./ProjectKnowledge"
import ProjectEditor from "./ProjectEditor"

import MaterialsTab from "./MaterialsTab"
import NotesTab from "./NotesTab"
import GalleryTab from "./GalleryTab"
import TimelineTab from "./TimelineTab"
import WorkflowTab from "./WorkflowTab"
import QuoteTab from "./QuoteTab"
import InvoiceTab from "./InvoiceTab"

import FilesTab from "./project/FilesTab"
import OverviewTab from "./project/OverviewTab"


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
      "edit",

    label:
      "Muokkaa",

    icon:
      "✏️",
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
      "invoice",

    label:
      "Lasku",

    icon:
      "🧾",
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














function ProjectTabs({
  project,
  onProjectUpdated,
}) {


  const [
    searchParams,
  ] = useSearchParams()


  const requestedTab =
    searchParams.get(
      "tab"
    )


  const [
    activeTab,
    setLocalActiveTab,
  ] = useState(
    () =>
      tabs.some(
        tab =>
          tab.id === requestedTab
      )
      ?
      requestedTab
      :
      "overview"
  )







  useEffect(() => {

    setLocalActiveTab(
      tabs.some(
        tab =>
          tab.id === requestedTab
      )
      ?
      requestedTab
      :
      "overview"
    )

  },[
    project?.id,
    requestedTab,
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

          <OverviewTab
            project={project}
            noteCount={project?.projectNotes?.length || 0}
          />

        )




      case "edit":

        return (

          <ProjectEditor

            project={
              project
            }

            onProjectUpdated={
              onProjectUpdated
            }

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

            onProjectUpdated={
              onProjectUpdated
            }

          />

        )




      case "invoice":

        return (

          <InvoiceTab

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

          <OverviewTab
            project={project}
            noteCount={project?.projectNotes?.length || 0}
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
