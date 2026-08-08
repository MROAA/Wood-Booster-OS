import {
  useEffect,
  useState,
} from "react"

import {
  apiGet,
} from "../api/client"



const SECTIONS = [

  {
    id: "workflow",
    label: "Työvaiheet",
  },

  {
    id: "materials",
    label: "Materiaalit",
  },

  {
    id: "notes",
    label: "Muistiinpanot",
  },

  {
    id: "edit",
    label: "Muokkaa projektia",
  },

]



function toNumber(
  value
) {

  const number =
    Number(value)

  if(
    Number.isFinite(number)
  ) {

    return number

  }

  return 0

}



function ProjectStatusSummary({
  projectId,
  expandedSection,
  onExpandedSectionChange,
  workflowContent,
  materialsContent,
  notesContent,
  editContent,
}) {


  const [
    workflowSummary,
    setWorkflowSummary,
  ] = useState({
    doneCount: 0,
    total: 0,
    progress: 0,
    nextStepTitle: "",
  })


  const [
    materialsSummary,
    setMaterialsSummary,
  ] = useState({
    total: 0,
    missingCount: 0,
  })


  const [
    notesSummary,
    setNotesSummary,
  ] = useState({
    total: 0,
    latestTitle: "",
    latestContent: "",
  })




  useEffect(() => {

    if(!projectId) {

      return

    }

    let cancelled = false

    apiGet(`/projects/${projectId}/workflow`)
      .then(data => {

        if(cancelled) {

          return

        }

        const steps =
          data.steps || []

        const doneCount =
          steps.filter(
            step =>
              step.done
          )
          .length

        const progress =
          steps.length === 0
          ?
          0
          :
          Math.round(
            (doneCount / steps.length) * 100
          )

        const nextStep =
          steps.find(
            step =>
              !step.done
          )

        setWorkflowSummary({
          doneCount,
          total: steps.length,
          progress,
          nextStepTitle:
            nextStep?.title || "",
        })

      })
      .catch(() => {})

    return () => {

      cancelled = true

    }

  },[
    projectId,
  ])




  useEffect(() => {

    if(!projectId) {

      return

    }

    let cancelled = false

    Promise.all([
      apiGet(`/projects/${projectId}/materials`),
      apiGet("/inventory"),
    ])
    .then(([materialsData, inventory]) => {

      if(cancelled) {

        return

      }

      const materials =
        materialsData.materials || []

      const missingCount =
        materials
          .filter(
            material =>
              material.inventoryItemId
          )
          .filter(
            material => {

              const stockItem =
                inventory.find(
                  item =>
                    String(item.id) ===
                    String(material.inventoryItemId)
                )

              if(!stockItem) {

                return false

              }

              const shortage =
                toNumber(material.quantity) -
                toNumber(stockItem.quantity)

              return shortage > 0

            }
          )
          .length

      setMaterialsSummary({
        total: materials.length,
        missingCount,
      })

    })
    .catch(() => {})

    return () => {

      cancelled = true

    }

  },[
    projectId,
  ])




  useEffect(() => {

    if(!projectId) {

      return

    }

    let cancelled = false

    apiGet(`/projects/${projectId}/notes`)
      .then(data => {

        if(cancelled) {

          return

        }

        const notes =
          data.notes || []

        const latest =
          notes[0]

        setNotesSummary({
          total: notes.length,
          latestTitle:
            latest?.title || "",
          latestContent:
            latest?.content || "",
        })

      })
      .catch(() => {})

    return () => {

      cancelled = true

    }

  },[
    projectId,
  ])




  function toggleSection(
    sectionId
  ) {

    onExpandedSectionChange(
      expandedSection === sectionId
      ?
      null
      :
      sectionId
    )

  }




  const sectionContent = {

    workflow: workflowContent,

    materials: materialsContent,

    notes: notesContent,

    edit: editContent,

  }




  return (

    <div
      className="
        space-y-6
      "
    >

      {
        SECTIONS.map(
          section => {

            const isOpen =
              expandedSection === section.id

            return (

              <div

                key={
                  section.id
                }

                className="
                  panel
                  p-6
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

                  <p
                    className="
                      text-lg
                      font-semibold
                    "
                  >

                    {section.label}

                  </p>


                  <button

                    type="button"

                    onClick={() =>
                      toggleSection(
                        section.id
                      )
                    }

                    className="
                      text-sm
                      font-semibold
                      text-[var(--wood-accent)]
                      hover:opacity-80
                    "

                  >

                    {
                      isOpen
                      ?
                      "Piilota ▴"
                      :
                      section.id === "edit"
                      ?
                      "Muokkaa ▾"
                      :
                      `Näytä kaikki ▾`
                    }

                  </button>

                </div>




                {
                  section.id === "workflow" &&
                  !isOpen &&
                  (

                    <div
                      className="
                        mt-4
                      "
                    >

                      <div
                        className="
                          h-3
                          overflow-hidden
                          rounded-full
                          bg-[var(--wood-bg)]
                        "
                      >

                        <div

                          className="
                            h-full
                            rounded-full
                            bg-[var(--wood-accent)]
                            transition-all
                          "

                          style={{
                            width:
                              `${workflowSummary.progress}%`,
                          }}

                        />

                      </div>


                      <p
                        className="
                          mt-3
                          text-2xl
                          font-semibold
                        "
                      >

                        {workflowSummary.doneCount}
                        {" / "}
                        {workflowSummary.total}
                        {" valmiina — "}
                        {workflowSummary.progress}
                        {" %"}

                      </p>


                      <p
                        className="
                          mt-1
                          text-sm
                          text-[var(--wood-muted)]
                        "
                      >

                        {
                          workflowSummary.nextStepTitle
                          ?
                          `Seuraava: ${workflowSummary.nextStepTitle}`
                          :
                          "Kaikki vaiheet valmiit ✓"
                        }

                      </p>

                    </div>

                  )
                }




                {
                  section.id === "materials" &&
                  !isOpen &&
                  (

                    <div
                      className="
                        mt-4
                      "
                    >

                      <p
                        className="
                          text-2xl
                          font-semibold
                        "
                      >

                        {materialsSummary.total}
                        {" materiaalia"}

                      </p>


                      {
                        materialsSummary.missingCount > 0 &&
                        (

                          <p
                            className="
                              mt-1
                              text-sm
                              text-red-300
                            "
                          >

                            {materialsSummary.missingCount}
                            {" hälytystä — varastosta puuttuu materiaalia"}

                          </p>

                        )
                      }

                    </div>

                  )
                }




                {
                  section.id === "notes" &&
                  !isOpen &&
                  (

                    <div
                      className="
                        mt-4
                      "
                    >

                      <p
                        className="
                          text-2xl
                          font-semibold
                        "
                      >

                        {notesSummary.total}
                        {" muistiinpanoa"}

                      </p>


                      {
                        notesSummary.latestContent &&
                        (

                          <p
                            className="
                              mt-1
                              line-clamp-2
                              text-sm
                              text-[var(--wood-muted)]
                            "
                          >

                            {
                              notesSummary.latestTitle &&
                              (
                                <span
                                  className="
                                    font-semibold
                                    text-[var(--wood-text)]
                                  "
                                >

                                  {notesSummary.latestTitle}
                                  {": "}

                                </span>
                              )
                            }

                            {notesSummary.latestContent}

                          </p>

                        )
                      }

                    </div>

                  )
                }




                {
                  isOpen &&
                  (

                    <div
                      className="
                        mt-5
                      "
                    >

                      {sectionContent[section.id]}

                    </div>

                  )
                }

              </div>

            )

          }
        )
      }

    </div>

  )

}



export default ProjectStatusSummary
