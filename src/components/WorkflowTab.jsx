import { useMemo, useState } from "react"

import {
  getProgress,
  getWorkflow,
  saveWorkflow,
} from "../data/WorkflowStore"

function WorkflowTab({ projectId }) {
  const initialWorkflow = useMemo(
    () => getWorkflow(projectId),
    [projectId],
  )

  const [workflow, setWorkflow] =
    useState(initialWorkflow)

  function toggleStep(stepId) {
    const updatedWorkflow = workflow.map(
      (step) => {
        if (step.id !== stepId) {
          return step
        }

        return {
          ...step,
          done: !step.done,
        }
      },
    )

    setWorkflow(updatedWorkflow)
    saveWorkflow(projectId, updatedWorkflow)
  }

  const progress = getProgress(workflow)

  return (
    <div>
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <p className="text-xs uppercase tracking-wider text-neutral-500">
          Production workflow
        </p>

        <h2 className="mt-2 text-2xl font-semibold">
          Tuotannon työvaiheet
        </h2>

        <p className="mt-2 text-neutral-400">
          Merkitse työvaiheet valmiiksi projektin edetessä.
        </p>

        <div className="mt-6">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-neutral-400">
              Edistyminen
            </span>

            <span className="font-semibold text-amber-400">
              {progress} %
            </span>
          </div>

          <div className="mt-3 h-3 overflow-hidden rounded-full bg-neutral-800">
            <div
              className="h-full rounded-full bg-amber-500 transition-all"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <div className="space-y-3">
          {workflow.map((step, index) => (
            <button
              key={step.id}
              type="button"
              onClick={() => toggleStep(step.id)}
              className="flex w-full items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-950 p-4 text-left transition hover:border-amber-500/50"
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-bold ${
                  step.done
                    ? "border-green-500 bg-green-500 text-neutral-950"
                    : "border-neutral-600 text-transparent"
                }`}
              >
                ✓
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-wider text-neutral-600">
                  Vaihe {index + 1}
                </p>

                <p
                  className={`mt-1 font-medium ${
                    step.done
                      ? "text-neutral-500 line-through"
                      : "text-neutral-200"
                  }`}
                >
                  {step.title}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

export default WorkflowTab