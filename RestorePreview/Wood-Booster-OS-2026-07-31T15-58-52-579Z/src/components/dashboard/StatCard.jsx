function StatCard({
  icon,
  label,
  value,
  detail,
  highlight = false,
}) {
  return (
    <article
      className={`rounded-2xl border p-6 ${
        highlight
          ? "border-amber-500/40 bg-amber-500/5"
          : "border-neutral-800 bg-neutral-900"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-neutral-500">
            {label}
          </p>

          <p
            className={`mt-3 text-3xl font-bold ${
              highlight
                ? "text-amber-400"
                : "text-neutral-100"
            }`}
          >
            {value}
          </p>

          <p className="mt-2 text-sm text-neutral-500">
            {detail}
          </p>
        </div>

        <span className="text-3xl">
          {icon}
        </span>
      </div>
    </article>
  )
}

export default StatCard
