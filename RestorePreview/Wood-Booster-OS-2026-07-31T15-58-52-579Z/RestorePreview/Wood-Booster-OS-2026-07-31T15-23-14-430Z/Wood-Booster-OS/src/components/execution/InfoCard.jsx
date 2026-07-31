function hasDisplayValue(
  value,
) {
  return (
    value !==
      undefined &&
    value !==
      null &&
    value !==
      ""
  )
}


function formatValue(
  value,
) {
  if (
    typeof value ===
    "boolean"
  ) {
    return value
      ? "Kyllä"
      : "Ei"
  }

  if (
    typeof value ===
      "object" &&
    value !==
      null
  ) {
    try {
      return JSON.stringify(
        value,
        null,
        2,
      )
    } catch {
      return String(
        value,
      )
    }
  }

  return String(
    value,
  )
}


function InfoCard({
  label,
  value,
  description,
  children,
  className = "",
  valueClassName = "",
}) {
  const hasValue =
    hasDisplayValue(
      value,
    )

  const formattedValue =
    hasValue
      ? formatValue(
          value,
        )
      : ""

  const isStructuredValue =
    typeof value ===
      "object" &&
    value !==
      null

  return (
    <div
      className={`
        min-w-0
        rounded-xl
        border
        border-neutral-800
        bg-neutral-950
        p-4
        ${className}
      `}
    >
      {label && (
        <p className="break-words text-xs font-semibold uppercase tracking-wider text-neutral-500">
          {label}
        </p>
      )}

      {hasValue &&
        (
          isStructuredValue
            ? (
                <pre
                  className={`
                    mt-2
                    overflow-x-auto
                    whitespace-pre-wrap
                    break-words
                    text-sm
                    leading-6
                    text-neutral-300
                    ${valueClassName}
                  `}
                >
                  {
                    formattedValue
                  }
                </pre>
              )
            : (
                <p
                  className={`
                    mt-2
                    break-words
                    font-medium
                    text-white
                    ${valueClassName}
                  `}
                >
                  {
                    formattedValue
                  }
                </p>
              )
        )}

      {children && (
        <div className="mt-2 min-w-0">
          {children}
        </div>
      )}

      {description && (
        <p className="mt-2 break-words text-sm leading-6 text-neutral-500">
          {description}
        </p>
      )}

      {!hasValue &&
        !children &&
        !description && (
          <p className="mt-2 text-neutral-500">
            -
          </p>
        )}
    </div>
  )
}


export default InfoCard
