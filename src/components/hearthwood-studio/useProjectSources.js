import { useEffect, useState } from "react"

import { apiGet } from "../../api/client"
import { summarizeChanges, summarizeHealth, summarizeSpacemonkey } from "./projectOverview"

// Studio Home's live sources, read once when Studio Home opens.

async function read(path) {
  try {
    return await apiGet(path)
  } catch {
    return null
  }
}

/** Reads the overview sources once; undefined while reading. */
export function useProjectSources() {
  const [sources, setSources] = useState({ loading: true })
  useEffect(() => {
    let cancelled = false
    Promise.all([read("/hearthwood-patchbay?archived=false"), read("/hearthwood-patchbay/doctor"), read("/hearthwood-dev/status")])
      .then(([patches, doctor, devStatus]) => {
        if (!cancelled) setSources({ loading: false, patches, doctor, devStatus })
      })
    return () => { cancelled = true }
  }, [])
  if (sources.loading) return { loading: true }
  return {
    loading: false,
    changes: summarizeChanges(sources.patches),
    health: summarizeHealth(sources.doctor),
    monkey: summarizeSpacemonkey(sources.devStatus),
  }
}
