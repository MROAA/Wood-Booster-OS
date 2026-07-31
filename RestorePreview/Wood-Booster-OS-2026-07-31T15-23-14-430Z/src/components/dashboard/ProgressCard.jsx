import { Link } from "react-router"

function ProgressCard({
  project,
  progress,
  completedTasks,
  totalTasks,
}) {
  return (
    <Link
      to={`/projects/${project.id}`}
      className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 transition hover:border-amber-500/50"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-neutral-100">
            {project.name}
          </h3>

          <p className="mt-1 text-sm text-neutral-500">
            {completedTasks} / {totalTasks} työvaihetta
          </p>
        </div>

        <span className="font-semibold text-amber-400">
          {progress} %
        </span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-800">
        <div
          className="h-full rounded-full bg-amber-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </Link>
  )
}

export default ProgressCard
