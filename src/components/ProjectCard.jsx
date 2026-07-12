import { Link } from "react-router"

function ProjectCard({ project, onDelete }) {
  return (
    <article className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold">
            {project.name}
          </h3>

          <p className="mt-2 text-sm text-neutral-400">
            {project.customer || "Ei asiakasta"}
          </p>
        </div>

        <StatusBadge status={project.status} />
      </div>

      <div className="mt-6 space-y-3 border-t border-neutral-800 pt-5">
        <InfoRow
          label="Deadline"
          value={
            project.deadline
              ? formatDate(project.deadline)
              : "Ei asetettu"
          }
        />

        {project.notes && (
          <div>
            <p className="text-xs uppercase tracking-wider text-neutral-500">
              Muistiinpanot
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-300">
              {getNotesText(project.notes)}
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Link
          to={`/projects/${project.id}`}
          className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-amber-400"
        >
          Avaa projekti
        </Link>

        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
        >
          Poista
        </button>
      </div>
    </article>
  )
}

function getNotesText(notes) {
  if (typeof notes === "string") {
    return notes
  }

  if (!Array.isArray(notes)) {
    return ""
  }

  return notes
    .map((note) => {
      if (typeof note === "string") {
        return note
      }

      if (
        note &&
        typeof note === "object" &&
        typeof note.text === "string"
      ) {
        return note.text
      }

      return ""
    })
    .filter(Boolean)
    .join("\n\n")
}

function StatusBadge({ status }) {
  return (
    <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
      {status}
    </span>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-neutral-500">{label}</span>
      <span className="text-neutral-300">{value}</span>
    </div>
  )
}

function formatDate(dateValue) {
  return new Intl.DateTimeFormat("fi-FI").format(
    new Date(`${dateValue}T12:00:00`),
  )
}

export default ProjectCard