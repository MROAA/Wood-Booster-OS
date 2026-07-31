import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  apiGet,
} from "../api/client"


const ProjectAIContext =
  createContext(null)


export function ProjectAIProvider({
  project,
  onProjectUpdated,
  children,
}) {
  const [memory, setMemory] =
    useState([])

  const [knowledge, setKnowledge] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")


  useEffect(() => {
    let cancelled = false


    async function loadSharedContext() {
      setLoading(true)
      setError("")

      try {
        const [
          memoryData,
          knowledgeData,
        ] = await Promise.all([
          apiGet("/memory"),
          apiGet("/knowledge"),
        ])

        if (cancelled) {
          return
        }

        setMemory(
          Array.isArray(
            memoryData?.memories,
          )
            ? memoryData.memories
            : Array.isArray(memoryData)
              ? memoryData
              : [],
        )

        setKnowledge(
          Array.isArray(
            knowledgeData?.knowledge,
          )
            ? knowledgeData.knowledge
            : Array.isArray(
                knowledgeData,
              )
              ? knowledgeData
              : [],
        )
      } catch (loadError) {
        console.error(
          "AI Context error:",
          loadError,
        )

        if (!cancelled) {
          setMemory([])
          setKnowledge([])

          setError(
            loadError?.message ||
            "AI-kontekstin lataaminen epäonnistui.",
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }


    loadSharedContext()


    return () => {
      cancelled = true
    }
  }, [])


  function updateProject(
    updatedProject,
  ) {
    if (!updatedProject) {
      return
    }

    if (
      typeof onProjectUpdated ===
      "function"
    ) {
      onProjectUpdated(
        updatedProject,
      )
    }
  }


  const context = useMemo(
    () => ({
      project,
      memory,
      knowledge,
    }),
    [
      project,
      memory,
      knowledge,
    ],
  )


  const value = useMemo(
    () => ({
      context,
      loading,
      error,
      updateProject,
    }),
    [
      context,
      loading,
      error,
      onProjectUpdated,
    ],
  )


  return (
    <ProjectAIContext.Provider
      value={value}
    >
      {children}
    </ProjectAIContext.Provider>
  )
}


export function useProjectAI() {
  const value =
    useContext(
      ProjectAIContext,
    )

  if (!value) {
    throw new Error(
      "useProjectAI must be used inside ProjectAIProvider.",
    )
  }

  return value
}


export default ProjectAIContext
