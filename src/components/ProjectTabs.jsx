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
import MediaStudioTab from "./MediaStudioTab"
import SocialStudioTab from "./SocialStudioTab"
import BlogStudioTab from "./BlogStudioTab"

import ProjectStatusSummary from "./ProjectStatusSummary"


import {
  ProjectAIProvider,
} from "./ProjectAIContext"


import {
  setActiveTab,
  setAvailableActions,
} from "../services/runtime/runtimeContext"



/*
 * Toissijaiset toiminnot - eivät näy suoraan projektisivulla, vaan
 * "Lisää toimintoja" -valikon kautta. Marc: "loput toiminnot ei ole
 * oleellisia ja voidaan tehdä viimeiseksi."
 */
const secondaryTabs = [

  {
    id: "ai",
    label: "AI Assistant",
    icon: "△",
  },

  {
    id: "tools",
    label: "Tools",
    icon: "▨",
  },

  {
    id: "gallery",
    label: "Gallery",
    icon: "▧",
  },

  {
    id: "media-studio",
    label: "Media Studio",
    icon: "◨",
  },

  {
    id: "social",
    label: "Somejulkaisu",
    icon: "◎",
  },

  {
    id: "blog",
    label: "Blogi",
    icon: "✎",
  },

  {
    id: "timeline",
    label: "Timeline",
    icon: "■",
  },

  {
    id: "quote",
    label: "Quote",
    icon: "✚",
  },

  {
    id: "invoice",
    label: "Lasku",
    icon: "▥",
  },

  {
    id: "memory",
    label: "Memory",
    icon: "⬢",
  },

  {
    id: "knowledge",
    label: "Knowledge",
    icon: "◌",
  },

  {
    id: "files",
    label: "Files",
    icon: "▣",
  },

]



function ProjectTabs({
  project,
  onProjectUpdated,
}) {


  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams()


  const requestedTab =
    searchParams.get(
      "tab"
    )


  const [
    activeSecondaryTab,
    setActiveSecondaryTab,
  ] = useState(
    () =>
      secondaryTabs.some(
        tab =>
          tab.id === requestedTab
      )
      ?
      requestedTab
      :
      null
  )


  const [
    expandedSection,
    setExpandedSection,
  ] = useState(null)




  useEffect(() => {

    setActiveSecondaryTab(
      secondaryTabs.some(
        tab =>
          tab.id === requestedTab
      )
      ?
      requestedTab
      :
      null
    )

  },[
    project?.id,
    requestedTab,
  ])




  useEffect(() => {


    function handleOpenProjectTab(
      event
    ) {


      const requested =
        String(
          event?.detail?.tab ||
          ""
        )
        .trim()
        .toLowerCase()


      if(!requested || requested === "edit") {

        setActiveSecondaryTab(
          null
        )

        setExpandedSection(
          requested === "edit"
          ?
          "edit"
          :
          null
        )

        return

      }


      const exists =
        secondaryTabs.some(
          tab =>
            tab.id === requested
        )


      if(!exists) {

        return

      }


      setActiveSecondaryTab(
        requested
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
      secondaryTabs.find(
        tab =>
          tab.id === activeSecondaryTab
      )


    setActiveTab({

      id:
        current?.id ||
        "workbench",

      label:
        current?.label ||
        "Työtila",

      scope:
        "project",

      projectId:
        project?.id ||
        null,

    })


    setAvailableActions(
      createTabActions({
        project,
      })
    )


  },[
    activeSecondaryTab,
    project,
  ])




  function openSecondaryTab(
    tabId
  ) {

    setActiveSecondaryTab(
      tabId || null
    )

    const nextParams =
      new URLSearchParams(
        searchParams
      )

    if(tabId) {

      nextParams.set(
        "tab",
        tabId
      )

    } else {

      nextParams.delete(
        "tab"
      )

    }

    setSearchParams(
      nextParams,
      {
        replace: true,
      }
    )

  }




  function renderSecondaryTab() {


    switch(activeSecondaryTab) {


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


      case "gallery":

        return (

          <GalleryTab

            projectId={
              project.id
            }

          />

        )


      case "media-studio":

        return (

          <MediaStudioTab

            projectId={
              project.id
            }

          />

        )


      case "social":

        return (

          <SocialStudioTab

            projectId={
              project.id
            }

          />

        )


      case "blog":

        return (

          <BlogStudioTab

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


      case "files":

        return (

          <FilesTab

            projectId={
              project.id
            }

          />

        )


      default:

        return null


    }


  }




  const activeSecondaryLabel =
    secondaryTabs.find(
      tab =>
        tab.id === activeSecondaryTab
    )
    ?.label




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
            flex
            flex-wrap
            items-center
            justify-between
            gap-3
          "
        >

          {
            activeSecondaryTab
            ?
            (

              <button

                type="button"

                onClick={() =>
                  openSecondaryTab(
                    null
                  )
                }

                className="
                  text-sm
                  font-semibold
                  text-[var(--wood-accent)]
                  hover:opacity-80
                "

              >

                ← Takaisin työtilaan

              </button>

            )
            :
            (

              <span
                className="
                  text-sm
                  font-semibold
                  text-[var(--wood-muted)]
                "
              >

                Työtila

              </span>

            )
          }


          <label
            className="
              flex
              items-center
              gap-2
              text-sm
            "
          >

            <span
              className="
                text-[var(--wood-muted)]
              "
            >

              Lisää toimintoja

            </span>


            <select

              value={
                activeSecondaryTab || ""
              }

              onChange={
                event =>
                  openSecondaryTab(
                    event.target.value || null
                  )
              }

              className="
                wb-input
              "

            >

              <option value="">
                Valitse...
              </option>

              {
                secondaryTabs.map(
                  tab => (

                    <option

                      key={
                        tab.id
                      }

                      value={
                        tab.id
                      }

                    >

                      {tab.icon}
                      {" "}
                      {tab.label}

                    </option>

                  )
                )
              }

            </select>

          </label>


        </div>




        {

          activeSecondaryTab

          ?
          (

            <div>

              <h2
                className="
                  mb-4
                  text-lg
                  font-semibold
                  text-[var(--wood-muted)]
                "
              >

                {activeSecondaryLabel}

              </h2>


              {renderSecondaryTab()}

            </div>

          )

          :
          (

            <ProjectStatusSummary

              projectId={
                project.id
              }

              expandedSection={
                expandedSection
              }

              onExpandedSectionChange={
                setExpandedSection
              }

              workflowContent={

                <WorkflowTab

                  projectId={
                    project.id
                  }

                />

              }

              materialsContent={

                <MaterialsTab

                  projectId={
                    project.id
                  }

                />

              }

              notesContent={

                <NotesTab

                  projectId={
                    project.id
                  }

                />

              }

              editContent={

                <ProjectEditor

                  project={
                    project
                  }

                  onProjectUpdated={
                    onProjectUpdated
                  }

                />

              }

            />

          )

        }


      </div>


    </ProjectAIProvider>

  )


}



function createTabActions({
  project,
}) {


  return secondaryTabs.map(
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
