function Section({
  title,
  description,
  action,
  children,
  className = "",
  contentClassName = "",
  headerClassName = "",
  titleClassName = "",
}) {
  const hasHeader =
    title ||
    description ||
    action

  return (
    <section
      className={`
        min-w-0
        rounded-2xl
        border
        border-neutral-800
        bg-neutral-900
        p-5
        ${className}
      `}
    >
      {hasHeader && (
        <div
          className={`
            flex
            flex-wrap
            items-start
            justify-between
            gap-4
            ${headerClassName}
          `}
        >
          <div className="min-w-0 flex-1">
            {title && (
              <h2
                className={`
                  break-words
                  text-lg
                  font-semibold
                  text-white
                  ${titleClassName}
                `}
              >
                {title}
              </h2>
            )}

            {description && (
              <p className="mt-1 max-w-3xl break-words text-sm leading-6 text-neutral-500">
                {description}
              </p>
            )}
          </div>

          {action && (
            <div className="shrink-0">
              {action}
            </div>
          )}
        </div>
      )}

      <div
        className={`
          min-w-0
          ${hasHeader ? "mt-5" : ""}
          ${contentClassName}
        `}
      >
        {children || (
          <div className="rounded-xl border border-dashed border-neutral-700 bg-neutral-950 p-5 text-center">
            <p className="text-sm text-neutral-500">
              Ei näytettävää sisältöä.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}


export default Section
