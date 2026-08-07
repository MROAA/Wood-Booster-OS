import { Link } from "react-router-dom"

function OverviewTab({
  project,
  noteCount,
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <p className="text-xs uppercase tracking-wider text-neutral-500">
          Project description
        </p>

        <h2 className="mt-2 text-2xl font-semibold">
          Projektin kuvaus
        </h2>

        {project.description ? (
          <p className="mt-5 whitespace-pre-wrap leading-7 text-neutral-300">
            {project.description}
          </p>
        ) : (
          <p className="mt-5 text-neutral-500">
            Projektille ei ole vielä lisätty kuvausta.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <p className="text-xs uppercase tracking-wider text-neutral-500">
          Project information
        </p>

        <h2 className="mt-2 text-2xl font-semibold">
          Projektin tiedot
        </h2>

        <dl className="mt-6 space-y-5">
          <InfoRow
            label="Asiakas"
            value={
              project.customer ? (
                <Link
                  to={`/customers/${project.customer.id}`}
                  className="text-[var(--wood-accent)] hover:opacity-80"
                >
                  {project.customer.name}
                </Link>
              ) : (
                "Ei määritetty"
              )
            }
          />

          <InfoRow
            label="Tila"
            value={project.status || "Suunnittelu"}
          />

          <InfoRow
            label="Deadline"
            value={
              project.deadline
                ? formatDate(project.deadline)
                : "Ei määritetty"
            }
          />

          <InfoRow
            label="Muistiinpanoja"
            value={String(noteCount)}
          />

          <InfoRow
            label="Luotu"
            value={
              project.createdAt
                ? formatDateTime(project.createdAt)
                : "Ei tiedossa"
            }
          />

          <InfoRow
            label="Päivitetty"
            value={
              project.updatedAt
                ? formatDateTime(project.updatedAt)
                : "Ei tiedossa"
            }
          />
        </dl>
      </section>
    </div>
  )
}

function InfoRow({
  label,
  value,
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-neutral-500">
        {label}
      </dt>

      <dd className="mt-1 text-neutral-200">
        {value}
      </dd>
    </div>
  )
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "Ei määritetty"
  }

  const date = new Date(
    `${dateValue}T12:00:00`,
  )

  if (Number.isNaN(date.getTime())) {
    return dateValue
  }

  return new Intl.DateTimeFormat("fi-FI", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).format(date)
}

function formatDateTime(dateValue) {
  if (!dateValue) {
    return "Ei tiedossa"
  }

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return "Ei tiedossa"
  }

  return new Intl.DateTimeFormat("fi-FI", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export default OverviewTab